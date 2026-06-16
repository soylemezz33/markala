import {
  ConflictException,
  Injectable,
  InternalServerErrorException,
  Logger,
  UnauthorizedException,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { JwtService } from "@nestjs/jwt";
import * as argon2 from "argon2";
import * as crypto from "crypto";
import { PrismaService } from "../prisma/prisma.service";

/**
 * SECURITY HARDENING (auth.service):
 *
 * 1. Access token: 15dk (önceden 7gün — XSS sonrası bekleme penceresi çok genişti).
 * 2. Refresh token: 30 gün, httpOnly cookie + DB hash (sha256). Token kendisi DB'de saklanmaz.
 * 3. Token rotation: her refresh kullanımında eski revoke + yeni issue (replay tespiti).
 * 4. Register: mevcut e-posta → 409 ConflictException + net mesaj.
 *    (Eski tasarım enumeration için 500 dönüyordu; ama bilinmeyen e-posta zaten 200+token
 *    döndüğünden 200/500 farkı enumeration'ı engellemiyordu — sadece gerçek kullanıcıyı
 *    "sunucu hatası" ile korkutuyordu. UX > işlevsiz gizleme.)
 * 5. argon2 + complexity regex (DTO katmanında) brute force + DoS koruması.
 * 6. console.warn audit log; ileride Sentry/Loki entegrasyonu.
 */
/**
 * Geçerli (decode edilebilir) bir argon2 dummy hash üretir.
 *
 * argon2.verify(), hash'i memory-hard KDF'yi çalıştırmadan ÖNCE decode eder ve
 * geçersiz/çok kısa bir encoded hash'te anında reddeder ("Output is too short").
 * Bu yüzden timing koruması için elle yazılmış bir sabit DEĞİL, gerçek argon2.hash()
 * çıktısı kullanılmalı — aksi halde verify ~0.2ms'de patlar, gerçek login ~40ms sürer
 * ve "kullanıcı var/yok" farkı timing'den okunabilir (user enumeration).
 */
export function createDummyHash(): Promise<string> {
  return argon2.hash(crypto.randomBytes(32).toString("hex"));
}

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);
  private readonly refreshTtlMs = 30 * 24 * 60 * 60 * 1000; // 30 gün
  /** Bilinmeyen e-postada verify edilecek geçerli dummy hash — lazy, tek sefer üretilir. */
  private dummyHashPromise?: Promise<string>;

  constructor(
    private prisma: PrismaService,
    private jwt: JwtService,
    private config: ConfigService,
  ) {}

  /** Bilinmeyen e-postada verify edilecek geçerli dummy hash — ilk çağrıda üretip cache'ler. Bkz. createDummyHash(). */
  private getDummyHash(): Promise<string> {
    if (!this.dummyHashPromise) {
      this.dummyHashPromise = createDummyHash();
    }
    return this.dummyHashPromise;
  }

  async register(
    input: { email: string; password: string; fullName: string; phone?: string },
    context: { userAgent?: string; ipAddress?: string },
  ) {
    // Mevcut e-posta → 409 (beklenen client durumu); gerçek beklenmeyen hata → 500.
    const duplicateMsg =
      "Bu e-posta adresi zaten kayıtlı. Giriş yapabilir veya şifrenizi sıfırlayabilirsiniz.";
    try {
      const existing = await this.prisma.user.findUnique({
        where: { email: input.email },
      });
      if (existing) {
        this.logger.warn(
          `register.duplicate_attempt email=${input.email} ip=${context.ipAddress ?? "?"}`,
        );
        throw new ConflictException(duplicateMsg);
      }

      const passwordHash = await argon2.hash(input.password);
      const user = await this.prisma.user.create({
        data: {
          email: input.email,
          passwordHash,
          fullName: input.fullName,
          phone: input.phone,
        },
      });

      return this.issueTokenPair(user, context);
    } catch (err) {
      // Beklenen durum: olduğu gibi yukarı fırlat (controller doğru HTTP status'u döner).
      if (err instanceof ConflictException) throw err;
      // Yarış durumu: findUnique ile create arası aynı e-posta oluşturulduysa Prisma
      // unique-constraint (P2002) atar — bunu da 409'a maple, 500 değil.
      if ((err as { code?: string })?.code === "P2002") {
        this.logger.warn(
          `register.duplicate_race email=${input.email} ip=${context.ipAddress ?? "?"}`,
        );
        throw new ConflictException(duplicateMsg);
      }
      // Yalnızca gerçek beklenmeyen hatalar 500 olur (izleme/alarm anlamlı kalsın).
      this.logger.error(`register.failed email=${input.email}`, err as Error);
      throw new InternalServerErrorException("Kayıt başarısız. Lütfen tekrar deneyin.");
    }
  }

  async login(
    email: string,
    password: string,
    context: { userAgent?: string; ipAddress?: string },
  ) {
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user) {
      // Timing attack azaltma: kullanıcı yoksa da GERÇEK bir argon2 verify maliyeti üret.
      // Geçerli dummy hash → KDF çalışır → "kullanıcı var" path'iyle eşit gecikme. Bkz. getDummyHash().
      const dummyHash = await this.getDummyHash();
      await argon2.verify(dummyHash, password).catch(() => false);
      this.logger.warn(
        `login.unknown_email email=${email} ip=${context.ipAddress ?? "?"}`,
      );
      throw new UnauthorizedException("Geçersiz e-posta veya şifre.");
    }

    const ok = await argon2.verify(user.passwordHash, password);
    if (!ok) {
      this.logger.warn(
        `login.bad_password userId=${user.id} ip=${context.ipAddress ?? "?"}`,
      );
      throw new UnauthorizedException("Geçersiz e-posta veya şifre.");
    }

    await this.prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    return this.issueTokenPair(user, context);
  }

  async refresh(
    rawRefreshToken: string,
    context: { userAgent?: string; ipAddress?: string },
  ) {
    if (!rawRefreshToken) throw new UnauthorizedException("Refresh token gerekli.");

    const tokenHash = this.hashRefreshToken(rawRefreshToken);
    const stored = await this.prisma.refreshToken.findUnique({
      where: { tokenHash },
      include: { user: true },
    });

    if (!stored || stored.revokedAt || stored.expiresAt < new Date()) {
      // Replay tespit edildiyse o kullanıcının TÜM aktif refresh'lerini revoke et.
      if (stored?.userId) {
        await this.prisma.refreshToken.updateMany({
          where: { userId: stored.userId, revokedAt: null },
          data: { revokedAt: new Date() },
        });
        this.logger.warn(
          `refresh.replay_detected userId=${stored.userId} ip=${context.ipAddress ?? "?"}`,
        );
      }
      throw new UnauthorizedException("Refresh token geçersiz.");
    }

    // Rotation: eskiyi revoke et, yeni çift üret.
    await this.prisma.refreshToken.update({
      where: { id: stored.id },
      data: { revokedAt: new Date() },
    });

    return this.issueTokenPair(stored.user, context);
  }

  async logout(rawRefreshToken: string | undefined) {
    if (!rawRefreshToken) return { ok: true };
    const tokenHash = this.hashRefreshToken(rawRefreshToken);
    await this.prisma.refreshToken
      .update({
        where: { tokenHash },
        data: { revokedAt: new Date() },
      })
      .catch(() => undefined); // token bilinmiyorsa sessizce geç — bilgi sızdırma
    return { ok: true };
  }

  /**
   * Şifre değiştirme — mevcut şifreyi argon2.verify ile DOĞRULAR, sonra yeni hash yazar.
   * Mevcut şifre hatalıysa 401. Güvenlik için kullanıcının TÜM aktif refresh token'larını
   * revoke eder (tüm cihazlar düşer; kullanıcı yeni şifreyle yeniden giriş yapar).
   * NOT: Önceki sürümde /hesabim/sifre formu mock'tu — backend endpoint yoktu, mevcut şifre
   * hiç doğrulanmıyordu ve değişiklik DB'ye yazılmıyordu.
   */
  async changePassword(userId: string, currentPassword: string, newPassword: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new UnauthorizedException("Kullanıcı bulunamadı.");

    const ok = await argon2.verify(user.passwordHash, currentPassword).catch(() => false);
    if (!ok) {
      this.logger.warn(`password.change.bad_current userId=${userId}`);
      throw new UnauthorizedException("Mevcut şifreniz hatalı.");
    }

    const passwordHash = await argon2.hash(newPassword);
    await this.prisma.user.update({ where: { id: userId }, data: { passwordHash } });
    await this.prisma.refreshToken.updateMany({
      where: { userId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
    this.logger.log(`password.change.ok userId=${userId}`);
    return { ok: true };
  }

  async me(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        fullName: true,
        phone: true,
        accountType: true,
        role: true,
        companyName: true,
        taxOffice: true,
        taxNumber: true,
      },
    });
    if (!user) throw new UnauthorizedException("Oturum geçersiz.");
    return user;
  }

  private async issueTokenPair(
    user: { id: string; email: string; role: string },
    context: { userAgent?: string; ipAddress?: string },
  ) {
    const payload = { sub: user.id, email: user.email, role: user.role };
    const accessToken = this.jwt.sign(payload, {
      expiresIn: this.config.get<string>("JWT_ACCESS_EXPIRES_IN") ?? "15m",
    });

    const refreshTokenRaw = crypto.randomBytes(48).toString("base64url");
    const refreshTokenHash = this.hashRefreshToken(refreshTokenRaw);
    const expiresAt = new Date(Date.now() + this.refreshTtlMs);

    await this.prisma.refreshToken.create({
      data: {
        tokenHash: refreshTokenHash,
        userId: user.id,
        expiresAt,
        userAgent: context.userAgent?.slice(0, 500),
        ipAddress: context.ipAddress?.slice(0, 64),
      },
    });

    return {
      accessToken,
      refreshToken: refreshTokenRaw, // controller cookie'ye yazıp body'den çıkaracak
      refreshExpiresAt: expiresAt,
      user: { id: user.id, email: user.email, role: user.role },
    };
  }

  /** Refresh token'ı plaintext olarak DB'ye yazmayız; SHA-256 hash tutarız (HMAC değil çünkü token zaten yüksek entropi). */
  private hashRefreshToken(raw: string) {
    return crypto.createHash("sha256").update(raw).digest("hex");
  }
}
