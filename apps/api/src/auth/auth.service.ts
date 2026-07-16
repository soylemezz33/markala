import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
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
import { MailService } from "../mail/mail.service";

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
    private mail: MailService,
  ) {}

  /**
   * Şifre sıfırlama TALEBİ — daima sessizce başarılı döner (user enumeration koruması).
   * Kullanıcı varsa: tek-kullanımlık token üretir (1 saat), hash'ini DB'ye yazar, sıfırlama
   * bağlantısını e-posta ile yollar. SMTP yapılandırılmamışsa mail sessizce başarısız olur
   * ama akış bozulmaz (log'a düşer).
   */
  async requestPasswordReset(email: string) {
    const user = await this.prisma.user.findUnique({ where: { email } });
    // Kullanıcı yoksa da aynı yanıt + benzer gecikme — var/yok bilgisini sızdırma.
    if (!user || user.deletedAt) {
      this.logger.warn(`password.reset.request_unknown email=${email}`);
      return { ok: true };
    }

    const rawToken = crypto.randomBytes(48).toString("base64url");
    const tokenHash = crypto.createHash("sha256").update(rawToken).digest("hex");
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 saat

    // Aynı kullanıcının tüketilmemiş eski token'larını geçersiz kıl (tek aktif link).
    await this.prisma.passwordResetToken.updateMany({
      where: { userId: user.id, consumedAt: null },
      data: { consumedAt: new Date() },
    });
    await this.prisma.passwordResetToken.create({
      data: { userId: user.id, tokenHash, expiresAt },
    });

    const webUrl = (this.config.get<string>("WEB_URL") ?? "https://markala.com.tr").replace(/\/$/, "");
    const resetUrl = `${webUrl}/sifre-sifirla?token=${rawToken}`;
    await this.mail.sendPasswordResetEmail(user.email, resetUrl); // hata fırlatmaz
    this.logger.log(`password.reset.request_sent userId=${user.id}`);
    return { ok: true };
  }

  /**
   * Token ile yeni şifre belirle. Token geçersiz/süresi dolmuş/kullanılmışsa 400.
   * Başarıda: argon2 hash yazılır, token tüketilir, kullanıcının TÜM refresh token'ları revoke
   * edilir (ele geçirilmiş oturumlar düşer; kullanıcı yeni şifreyle yeniden giriş yapar).
   */
  async resetPassword(rawToken: string, newPassword: string) {
    const tokenHash = crypto.createHash("sha256").update(rawToken).digest("hex");
    const stored = await this.prisma.passwordResetToken.findUnique({
      where: { tokenHash },
      include: { user: true },
    });

    if (!stored || stored.consumedAt || stored.expiresAt < new Date()) {
      this.logger.warn(`password.reset.invalid_token`);
      throw new BadRequestException(
        "Şifre sıfırlama bağlantısı geçersiz veya süresi dolmuş. Lütfen yeniden talep edin.",
      );
    }

    const passwordHash = await argon2.hash(newPassword);
    await this.prisma.$transaction([
      // E-postaya gönderilen bağlantıya tıklayıp şifre belirlemek = e-posta sahipliğinin KANITI →
      // emailVerifiedAt işaretle. Bu HEM kurumsal davet akışını (admin-onaylı B2B hesabı davet
      // linkiyle şifre kurar → doğrulanmış → giriş yapar; aksi halde katı doğrulamada 403 yerdi)
      // HEM de doğrulanmamış müşteriye kurtarma yolu (şifremi-unuttum → doğrulanmış) sağlar.
      this.prisma.user.update({ where: { id: stored.userId }, data: { passwordHash, emailVerifiedAt: new Date() } }),
      this.prisma.passwordResetToken.update({
        where: { id: stored.id },
        data: { consumedAt: new Date() },
      }),
      this.prisma.refreshToken.updateMany({
        where: { userId: stored.userId, revokedAt: null },
        data: { revokedAt: new Date() },
      }),
    ]);
    this.logger.log(`password.reset.ok userId=${stored.userId}`);
    return { ok: true };
  }

  /**
   * E-posta doğrulama bağlantısı üretir + gönderir (şifre-sıfırlama token deseniyle aynı: raw
   * base64url token, sha256 hash saklanır, 24 saat geçerli, eski tüketilmemişler iptal). Mail
   * hata fırlatmaz; gönderim sonucunu (boolean) döner. KATI doğrulama: doğrulanmamış müşteri
   * giriş yapamaz (login 403); register oto-giriş yapmaz.
   */
  async sendEmailVerification(userId: string, email: string): Promise<boolean> {
    const rawToken = crypto.randomBytes(48).toString("base64url");
    const tokenHash = crypto.createHash("sha256").update(rawToken).digest("hex");
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 saat (şablon metniyle uyumlu)
    await this.prisma.emailVerificationToken.updateMany({
      where: { userId, consumedAt: null },
      data: { consumedAt: new Date() },
    });
    await this.prisma.emailVerificationToken.create({ data: { userId, tokenHash, expiresAt } });
    const webUrl = (this.config.get<string>("WEB_URL") ?? "https://markala.com.tr").replace(/\/$/, "");
    const verifyUrl = `${webUrl}/eposta-dogrula?token=${rawToken}`;
    return this.mail.sendVerificationEmail(email, verifyUrl); // hata fırlatmaz; boolean döner
  }

  /** Token ile e-postayı doğrula → user.emailVerifiedAt yazılır, token tüketilir. Idempotent. */
  async verifyEmail(rawToken: string) {
    const tokenHash = crypto.createHash("sha256").update(rawToken).digest("hex");
    const stored = await this.prisma.emailVerificationToken.findUnique({
      where: { tokenHash },
      include: { user: true },
    });
    if (!stored || stored.consumedAt || stored.expiresAt < new Date()) {
      throw new BadRequestException(
        "Doğrulama bağlantısı geçersiz veya süresi dolmuş. Hesabınızdan yeni bağlantı isteyebilirsiniz.",
      );
    }
    await this.prisma.$transaction([
      this.prisma.user.update({ where: { id: stored.userId }, data: { emailVerifiedAt: new Date() } }),
      this.prisma.emailVerificationToken.update({ where: { id: stored.id }, data: { consumedAt: new Date() } }),
    ]);
    this.logger.log(`email.verify.ok userId=${stored.userId}`);
    return { ok: true };
  }

  /** Giriş yapmış kullanıcı için doğrulama mailini yeniden gönder. Zaten doğruluysa no-op ok. */
  async resendVerification(userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user || user.deletedAt) throw new BadRequestException("Kullanıcı bulunamadı.");
    if (user.emailVerifiedAt) return { ok: true, alreadyVerified: true };
    await this.sendEmailVerification(user.id, user.email);
    return { ok: true };
  }

  /**
   * PUBLIC doğrulama maili yeniden gönder (e-posta ile) — katı doğrulamada giriş YAPAMAYAN
   * kullanıcı için (login 403 ekranından). Enumeration KORUMASI: kullanıcı var/yok/doğrulu
   * fark etmeksizin DAİMA { ok:true }. Rate-limit main.ts (5/saat/IP).
   */
  async resendVerificationPublic(email: string) {
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (user && !user.deletedAt && !user.emailVerifiedAt) {
      await this.sendEmailVerification(user.id, user.email).catch(() => undefined);
    }
    return { ok: true };
  }

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

      // Telefon tekilliği: aynı numarayla birden çok hesap açılmasını engelle (kullanıcı isteği).
      const phone = input.phone?.trim();
      if (phone) {
        const phoneTaken = await this.prisma.user.findFirst({
          where: { phone, deletedAt: null },
          select: { id: true },
        });
        if (phoneTaken) {
          this.logger.warn(`register.duplicate_phone phone=${phone} ip=${context.ipAddress ?? "?"}`);
          throw new ConflictException(
            "Bu telefon numarası zaten bir hesapta kayıtlı. Giriş yapın veya farklı bir numara kullanın.",
          );
        }
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

      // KATI doğrulama: kayıt OTO-GİRİŞ YAPMAZ. Doğrulama maili gönderilir; kullanıcı e-postasını
      // doğrulayıp giriş yapar (aksi halde login 403 döner). Mail beklenir (fire-and-forget değil):
      // gönderilemezse kullanıcı hiç doğrulayamaz → controller "mail gitmedi" uyarısı gösterebilsin.
      const sent = await this.sendEmailVerification(user.id, user.email).catch(() => false as const);
      return { needsVerification: true as const, email: user.email, emailSent: sent !== false };
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

  /**
   * "Google ile devam et" (GIS ID token) — flag-gated: GOOGLE_CLIENT_ID env yoksa kapalı.
   *
   * Doğrulama: Google'ın resmî tokeninfo endpoint'i (imza/exp kontrolünü Google yapar;
   * ek bağımlılık yok). Güvenlik kontratı:
   *  - aud === GOOGLE_CLIENT_ID (başka uygulamanın token'ı reddedilir)
   *  - iss accounts.google.com (tokeninfo zaten Google-imzalı token dışında 4xx döner)
   *  - email_verified zorunlu → e-posta sahipliği Google'ca kanıtlı olduğundan KATI
   *    e-posta doğrulama kilidi bu akışta otomatik açılır (kurumsal-davet fix'iyle aynı ilke).
   * Yeni kullanıcı: rastgele şifreyle oluşturulur (şifreli girişe geçmek isterse
   * "şifremi unuttum" akışı zaten emailVerifiedAt'i koruyarak şifre belirletir).
   */
  async googleLogin(
    credential: string,
    context: { userAgent?: string; ipAddress?: string },
  ) {
    const clientId = process.env.GOOGLE_CLIENT_ID;
    if (!clientId) {
      throw new BadRequestException("Google ile giriş şu anda kullanılamıyor.");
    }

    interface TokenInfo {
      aud?: string;
      email?: string;
      email_verified?: string;
      name?: string;
      exp?: string;
    }
    let info: TokenInfo;
    try {
      const res = await fetch(
        `https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(credential)}`,
        { signal: AbortSignal.timeout(8000) },
      );
      if (!res.ok) {
        this.logger.warn(`google.tokeninfo_reject status=${res.status} ip=${context.ipAddress ?? "?"}`);
        throw new UnauthorizedException("Google doğrulaması başarısız. Lütfen tekrar deneyin.");
      }
      info = (await res.json()) as TokenInfo;
    } catch (err) {
      if (err instanceof UnauthorizedException) throw err;
      this.logger.error(`google.tokeninfo_error ip=${context.ipAddress ?? "?"}`, err as Error);
      throw new UnauthorizedException("Google doğrulamasına ulaşılamadı. Lütfen tekrar deneyin.");
    }

    if (info.aud !== clientId) {
      this.logger.warn(`google.aud_mismatch aud=${info.aud ?? "?"} ip=${context.ipAddress ?? "?"}`);
      throw new UnauthorizedException("Google doğrulaması başarısız.");
    }
    const email = info.email?.trim().toLowerCase();
    if (!email || info.email_verified !== "true") {
      this.logger.warn(`google.email_unverified email=${email ?? "?"} ip=${context.ipAddress ?? "?"}`);
      throw new UnauthorizedException("Google hesabınızın e-postası doğrulanmamış.");
    }

    let user = await this.prisma.user.findUnique({ where: { email } });
    if (user?.deletedAt) {
      throw new ForbiddenException("Bu hesap kapatılmış. Destek ile iletişime geçin.");
    }
    if (!user) {
      // İlk Google girişi = kayıt. Rastgele şifre (yalnız hash saklanır); e-posta Google'ca doğrulu.
      const randomPassword = crypto.randomBytes(32).toString("hex");
      const passwordHash = await argon2.hash(randomPassword);
      user = await this.prisma.user.create({
        data: {
          email,
          passwordHash,
          fullName: (info.name ?? email.split("@")[0] ?? "Müşteri").slice(0, 120),
          emailVerifiedAt: new Date(),
        },
      });
      this.logger.log(`google.register userId=${user.id}`);
    } else if (!user.emailVerifiedAt) {
      // Mevcut ama doğrulanmamış hesap: Google e-posta sahipliğini kanıtladı → kilidi aç.
      await this.prisma.user.update({
        where: { id: user.id },
        data: { emailVerifiedAt: new Date() },
      });
      user = { ...user, emailVerifiedAt: new Date() };
    }

    await this.prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    return this.issueTokenPair(user, context);
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

    // KATI e-posta doğrulama: doğrulanmamış MÜŞTERİ giriş yapamaz (403). Admin/kurumsal iç
    // hesaplar (role != customer) muaf — kontrollü oluşturulur, self-register etmez. Mevcut
    // kullanıcılar deploy öncesi backfill ile "doğrulanmış" işaretlendi → kilitlenmez. Frontend
    // 403'ü yakalayıp "yeniden doğrulama maili gönder" akışını gösterir.
    if (!user.emailVerifiedAt && user.role === "customer") {
      this.logger.warn(`login.unverified userId=${user.id} ip=${context.ipAddress ?? "?"}`);
      throw new ForbiddenException(
        "Giriş yapabilmen için e-posta adresini doğrulaman gerekiyor. Kayıt sırasında gönderdiğimiz bağlantıya tıkla ya da yeni bir doğrulama maili iste.",
      );
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

    // Yeni şifre mevcut şifreyle AYNI olamaz (kullanıcı isteği) — gerçek bir değişiklik şart.
    const sameAsCurrent = await argon2.verify(user.passwordHash, newPassword).catch(() => false);
    if (sameAsCurrent) {
      throw new BadRequestException("Yeni şifreniz mevcut şifrenizden farklı olmalı.");
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
        // Salt-okunur: kullanıcının KENDİ kurumsal durumu + indirim oranı. Checkout bunu
        // özet satırı olarak gösterir (gerçek indirim siparişte yine sunucuda hesaplanır).
        // Mass-assignment riski yok — bu READ; yazma DTO'ları bu alanları içermez.
        corporateStatus: true,
        corporateDiscount: true,
        emailVerifiedAt: true,
      },
    });
    if (!user) throw new UnauthorizedException("Oturum geçersiz.");
    // emailVerifiedAt (tarih) → emailVerified (boolean); frontend "doğrula" uyarısını buna göre gösterir.
    const { emailVerifiedAt, ...rest } = user;
    return { ...rest, emailVerified: !!emailVerifiedAt };
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
