import {
  Body,
  ConflictException,
  Controller,
  Delete,
  ForbiddenException,
  Get,
  NotFoundException,
  Param,
  Patch,
  Post,
  Put,
  Req,
  UseGuards,
} from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { ArrayMaxSize, IsArray, IsEmail, IsIn, IsOptional, IsString, Matches, MaxLength, MinLength } from "class-validator";
import * as argon2 from "argon2";
import type { Request } from "express";
import { PrismaService } from "../prisma/prisma.service";
import { JwtAuthGuard } from "../auth/jwt.guard";
import { RolesGuard, Roles } from "../auth/roles.guard";
import { PANEL_ROLES } from "../auth/permissions";
import { RolIzinService } from "./rol-izin.service";

/** Atanabilir roller. "customer" = panel erişimini KALDIR anlamına gelir. */
const ASSIGNABLE = [...PANEL_ROLES, "customer"] as const;

type Istek = Request & { user: { sub: string; role: string } };

class SetRoleDto {
  @IsString()
  @IsIn(ASSIGNABLE as unknown as string[])
  role!: string;
}

/**
 * Şifre kuralları KAYIT FORMUYLA AYNI (min 8, büyük+küçük+rakam, max 128).
 * Max 128: argon2 hash'i CPU/RAM DoS'una karşı. Panelden açılan hesap diye kural
 * gevşetilmedi — bu hesaplar panele giriyor, yani daha değerli hedefler.
 */
const SIFRE_KURALI = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).+$/;

/**
 * Panelden hesap oluşturma (2026-08-21, Hasan kararı: "siteden üye olmasın, ben
 * panelden e-posta ve şifre tanımlayacağım").
 */
class CreateUserDto {
  @IsEmail({}, { message: "Geçerli bir e-posta adresi girin." })
  @MaxLength(254)
  email!: string;

  @IsString()
  @MinLength(8, { message: "Şifre en az 8 karakter olmalı." })
  @MaxLength(128, { message: "Şifre çok uzun." })
  @Matches(SIFRE_KURALI, { message: "Şifre büyük harf, küçük harf ve rakam içermelidir." })
  password!: string;

  @IsString()
  @IsIn(PANEL_ROLES as unknown as string[])
  role!: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  fullName?: string;
}

class InviteDto {
  @IsEmail()
  email!: string;

  @IsString()
  @IsIn(ASSIGNABLE as unknown as string[])
  role!: string;
}

/** Ad/e-posta düzenleme (2026-09-17). Rol ve şifre ayrı uçlardadır. */
class UpdateUserDto {
  @IsOptional()
  @IsEmail({}, { message: "Geçerli bir e-posta adresi girin." })
  @MaxLength(254)
  email?: string;

  @IsOptional()
  @IsString()
  @MinLength(2, { message: "Ad en az 2 karakter olmalı." })
  @MaxLength(120)
  fullName?: string;
}

class ResetPasswordDto {
  @IsString()
  @MinLength(8, { message: "Şifre en az 8 karakter olmalı." })
  @MaxLength(128, { message: "Şifre çok uzun." })
  @Matches(SIFRE_KURALI, { message: "Şifre büyük harf, küçük harf ve rakam içermelidir." })
  password!: string;
}

class RolIzinDto {
  @IsArray()
  @ArrayMaxSize(64)
  @IsString({ each: true })
  izinler!: string[];
}

/**
 * PANEL KULLANICILARI — 2026-08-21 (Hasan: "yetkiliyi panelden nasıl ekleyeceğim").
 *
 * YALNIZ super_admin. Sebep: rol atama, yetki YÜKSELTME aracıdır. admin rolündeki biri
 * kendini ya da bir başkasını super_admin yapabilseydi rol ayrımının anlamı kalmazdı.
 *
 * KORUMALAR:
 *  - Kendi rolünü değiştiremez, kendi şifreni buradan sıfırlayamaz, kendini silemezsin.
 *  - Son super_admin'in rolü düşürülemez / hesabı silinemez (paneli sahipsiz bırakma engeli).
 *  - Her değişiklik audit_logs'a yazılır (kim, kimi, neden→ne, IP). Şifre asla loglanmaz.
 *
 * 2026-09-17 GENİŞLETME (Hasan): düzenleme (ad/e-posta), şifre sıfırlama, silme ve
 * rol izin matrisi (GET/PUT/DELETE roller). Rol izinleri RolIzinService üzerinden
 * `panel_role_permissions` tablosuna yazılır; süper admin kilitlidir.
 */
@ApiTags("admin-panel-users")
// YOL ÇAKIŞMASI DÜZELTMESİ (2026-08-21): "admin/users" yolunu UsersAdminController
// (müşteri yönetimi) ZATEN kullanıyor ve onun @Get()'i benimkini yutuyordu. Ayrı yola taşındı.
@Controller("admin/panel-users")
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles("super_admin")
@ApiBearerAuth()
export class AdminUsersController {
  constructor(
    private prisma: PrismaService,
    private rolIzin: RolIzinService,
  ) {}

  /** Panel erişimi olan kullanıcılar (müşteriler ve kapatılmış hesaplar HARİÇ). */
  @Get()
  async list() {
    const users = await this.prisma.user.findMany({
      where: { role: { not: "customer" }, deletedAt: null },
      select: {
        id: true,
        email: true,
        fullName: true,
        role: true,
        createdAt: true,
        lastLoginAt: true,
        twoFactorEnabled: true,
      },
      orderBy: [{ role: "asc" }, { createdAt: "asc" }],
    });
    return { users, assignableRoles: ASSIGNABLE };
  }

  // ── ROL İZİN MATRİSİ (2026-09-17) ─────────────────────────────────────────────
  // ":id" uçlarıyla çakışmaz: "roller/:rol" iki parçalı, ":id" tek parçalı.

  @Get("roller")
  roller() {
    return this.rolIzin.listele();
  }

  @Put("roller/:rol")
  rolKaydet(@Param("rol") rol: string, @Body() dto: RolIzinDto, @Req() req: Istek) {
    return this.rolIzin.kaydet(rol, dto.izinler, req.user.sub, req.ip);
  }

  @Delete("roller/:rol")
  rolSifirla(@Param("rol") rol: string, @Req() req: Istek) {
    return this.rolIzin.sifirla(rol, req.user.sub, req.ip);
  }

  /**
   * E-postadan kullanıcı bulup rol atar (yetkili "ekleme" akışı).
   * Kullanıcı yoksa 404 — önce siteden üye olması gerekir.
   */
  @Patch("invite")
  async invite(@Body() dto: InviteDto, @Req() req: Istek) {
    const target = await this.prisma.user.findFirst({
      where: { email: { equals: dto.email.trim(), mode: "insensitive" } },
      select: { id: true, email: true, role: true },
    });
    if (!target) {
      throw new NotFoundException(
        "Bu e-postayla kayıtlı kullanıcı yok. Kişi önce siteden üye olmalı, sonra buradan yetki verebilirsiniz.",
      );
    }
    return this.applyRole(target.id, dto.role, req.user.sub, req.ip);
  }

  /**
   * Panelden yetkili hesabı OLUŞTUR. E-posta zaten kayıtlıysa:
   *  a) MÜŞTERİ hesabı → yetki ver (rolü yükselt). Şifresine DOKUNMA.
   *  b) Zaten panel yetkilisi → 409; rolü listeden değiştirilmeli.
   * emailVerifiedAt DOLU yazılır: hesabı yönetici açtığı için doğrulama beklenmez.
   */
  @Post()
  async create(@Body() dto: CreateUserDto, @Req() req: Istek) {
    const email = dto.email.toLowerCase().trim();
    const exists = await this.prisma.user.findFirst({
      where: { email: { equals: email, mode: "insensitive" } },
      select: { id: true, role: true },
    });
    if (exists) {
      if (exists.role !== "customer") {
        throw new ConflictException(
          "Bu e-posta zaten panel yetkilisi. Rolünü aşağıdaki listeden değiştirebilirsiniz.",
        );
      }
      const promoted = await this.applyRole(exists.id, dto.role, req.user.sub, req.ip);
      return { ...promoted, promoted: true, email, role: dto.role };
    }
    const passwordHash = await argon2.hash(dto.password);
    const user = await this.prisma.user.create({
      data: {
        email,
        passwordHash,
        fullName: dto.fullName?.trim() || email,
        role: dto.role as never,
        emailVerifiedAt: new Date(),
      },
      select: { id: true, email: true, role: true },
    });

    await this.denetim(req, user.id, "panel_user_create", { email: user.email, role: user.role });
    return { ok: true, email: user.email, role: user.role };
  }

  @Patch(":id/role")
  async setRole(@Param("id") id: string, @Body() dto: SetRoleDto, @Req() req: Istek) {
    return this.applyRole(id, dto.role, req.user.sub, req.ip);
  }

  /**
   * Ad / e-posta düzenleme (2026-09-17). E-posta değişince benzersizlik büyük-küçük harf
   * duyarsız kontrol edilir. Kişi kendi adını/e-postasını da düzeltebilir; JWT'deki e-posta
   * alanı bir sonraki token yenilemesinde güncellenir (yetki kararlarında kullanılmıyor).
   */
  @Patch(":id")
  async update(@Param("id") id: string, @Body() dto: UpdateUserDto, @Req() req: Istek) {
    const target = await this.yetkiliBul(id);
    const data: { email?: string; fullName?: string } = {};
    const diff: Record<string, { from: string; to: string }> = {};

    if (dto.fullName !== undefined) {
      const ad = dto.fullName.trim();
      if (ad && ad !== target.fullName) {
        data.fullName = ad;
        diff.fullName = { from: target.fullName, to: ad };
      }
    }
    if (dto.email !== undefined) {
      const email = dto.email.toLowerCase().trim();
      if (email !== target.email.toLowerCase()) {
        const baska = await this.prisma.user.findFirst({
          where: { email: { equals: email, mode: "insensitive" }, id: { not: id } },
          select: { id: true },
        });
        if (baska) throw new ConflictException("Bu e-posta başka bir hesapta kayıtlı.");
        data.email = email;
        diff.email = { from: target.email, to: email };
      }
    }
    if (Object.keys(data).length === 0) {
      return { ok: true, unchanged: true, message: "Değişiklik yok." };
    }

    await this.prisma.user.update({ where: { id }, data });
    await this.denetim(req, id, "panel_user_update", diff);
    return { ok: true, email: data.email ?? target.email, fullName: data.fullName ?? target.fullName };
  }

  /**
   * Şifre sıfırlama (2026-09-17): süper admin yeni şifreyi belirler, kişinin TÜM oturumları
   * (refresh token'ları) iptal edilir → eski cihazlar düşer, yeni şifreyle girer.
   * Kendi şifresi için bu uç KAPALI: kişi profilinden (mevcut şifre doğrulamalı) değiştirir.
   * Şifre ne loga ne yanıta yazılır.
   */
  @Post(":id/sifre")
  async resetPassword(@Param("id") id: string, @Body() dto: ResetPasswordDto, @Req() req: Istek) {
    if (id === req.user.sub) {
      throw new ForbiddenException("Kendi şifrenizi buradan sıfırlayamazsınız; profilinizden değiştirin.");
    }
    const target = await this.yetkiliBul(id);
    const passwordHash = await argon2.hash(dto.password);
    await this.prisma.$transaction([
      this.prisma.user.update({ where: { id }, data: { passwordHash } }),
      this.prisma.refreshToken.updateMany({ where: { userId: id, revokedAt: null }, data: { revokedAt: new Date() } }),
    ]);
    await this.denetim(req, id, "panel_user_password_reset", { email: target.email, oturumlarIptal: true });
    return { ok: true, email: target.email };
  }

  /**
   * Hesap silme (2026-09-17).
   *  - Kendini ve son süper admin'i silemezsin.
   *  - Sipariş geçmişi olan hesap (yetkili aynı zamanda müşteriyse) SİLİNMEZ: panel yetkisi
   *    kaldırılır (rol → customer), oturumları düşürülür; sipariş/fatura geçmişi korunur (TTK).
   *  - Sipariş geçmişi yoksa hesap kalıcı silinir. Tokenlar/adresler kaskadla gider; iç notlar
   *    ve tasarım dosyaları kalır (yazar alanı boşa düşer, ad snapshot'ı okunabilir kalır).
   */
  @Delete(":id")
  async remove(@Param("id") id: string, @Req() req: Istek) {
    if (id === req.user.sub) throw new ForbiddenException("Kendi hesabınızı silemezsiniz.");
    const target = await this.yetkiliBul(id);
    await this.sonSuperAdminKorumasi(target);

    const siparis = await this.prisma.order.count({ where: { userId: id } });
    if (siparis > 0) {
      await this.prisma.$transaction([
        this.prisma.user.update({ where: { id }, data: { role: "customer" } }),
        this.prisma.refreshToken.updateMany({ where: { userId: id, revokedAt: null }, data: { revokedAt: new Date() } }),
      ]);
      await this.denetim(req, id, "panel_user_revoke", { email: target.email, from: target.role, to: "customer", siparis });
      return {
        ok: true,
        deleted: false,
        email: target.email,
        message: `${target.email} hesabının ${siparis} siparişi var; hesap silinmedi, panel yetkisi kaldırıldı ve oturumları kapatıldı.`,
      };
    }

    await this.prisma.user.delete({ where: { id } });
    await this.denetim(req, id, "panel_user_delete", { email: target.email, role: target.role });
    return { ok: true, deleted: true, email: target.email, message: `${target.email} hesabı silindi.` };
  }

  // ── yardımcılar ────────────────────────────────────────────────────────────────

  private async yetkiliBul(id: string) {
    const target = await this.prisma.user.findUnique({
      where: { id },
      select: { id: true, email: true, fullName: true, role: true, deletedAt: true },
    });
    if (!target || target.deletedAt) throw new NotFoundException("Kullanıcı bulunamadı.");
    if (target.role === "customer") {
      throw new NotFoundException("Bu hesap panel yetkilisi değil.");
    }
    return target;
  }

  private async sonSuperAdminKorumasi(target: { role: string }) {
    if (target.role !== "super_admin") return;
    const count = await this.prisma.user.count({ where: { role: "super_admin", deletedAt: null } });
    if (count <= 1) throw new ForbiddenException("Son süper admin'in yetkisi kaldırılamaz.");
  }

  private async denetim(req: Istek, entityId: string, action: string, diff: Record<string, unknown>) {
    await this.prisma.auditLog
      .create({
        data: { actorId: req.user.sub, entityType: "User", entityId, action, diff: diff as never, ipAddress: req.ip ?? null },
      })
      .catch(() => undefined);
  }

  private async applyRole(targetId: string, role: string, actorId: string, ip?: string) {
    if (targetId === actorId) {
      throw new ForbiddenException("Kendi rolünüzü değiştiremezsiniz.");
    }
    const target = await this.prisma.user.findUnique({
      where: { id: targetId },
      select: { id: true, email: true, role: true },
    });
    if (!target) throw new NotFoundException("Kullanıcı bulunamadı.");
    if (target.role === role) {
      return { ok: true, unchanged: true, message: "Rol zaten bu değerde." };
    }

    // Son super_admin koruması: paneli sahipsiz bırakma.
    if (target.role === "super_admin" && role !== "super_admin") {
      await this.sonSuperAdminKorumasi(target);
    }

    // Panel yetkisi kaldırılıyorsa açık oturumları da düşür — erişim anında bitsin.
    const oturumKapat = role === "customer";
    await this.prisma.$transaction([
      this.prisma.user.update({ where: { id: targetId }, data: { role: role as never } }),
      ...(oturumKapat
        ? [this.prisma.refreshToken.updateMany({ where: { userId: targetId, revokedAt: null }, data: { revokedAt: new Date() } })]
        : []),
    ]);

    await this.prisma.auditLog
      .create({
        data: {
          actorId,
          entityType: "User",
          entityId: targetId,
          action: "role_change",
          diff: { email: target.email, from: target.role, to: role },
          ipAddress: ip ?? null,
        },
      })
      .catch(() => undefined);

    return { ok: true, email: target.email, from: target.role, to: role };
  }
}
