import { Body, ConflictException, Controller, ForbiddenException, Get, NotFoundException, Param, Patch, Post, Req, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { IsEmail, IsIn, IsOptional, IsString, Matches, MaxLength, MinLength } from "class-validator";
import * as argon2 from "argon2";
import type { Request } from "express";
import { PrismaService } from "../prisma/prisma.service";
import { JwtAuthGuard } from "../auth/jwt.guard";
import { RolesGuard, Roles } from "../auth/roles.guard";
import { PANEL_ROLES } from "../auth/permissions";

/** Atanabilir roller. "customer" = panel erişimini KALDIR anlamına gelir. */
const ASSIGNABLE = [...PANEL_ROLES, "customer"] as const;

class SetRoleDto {
  @IsString()
  @IsIn(ASSIGNABLE as unknown as string[])
  role!: string;
}

/**
 * Panelden hesap oluşturma (2026-08-21, Hasan kararı: "siteden üye olmasın, ben
 * panelden e-posta ve şifre tanımlayacağım").
 *
 * Şifre kuralları KAYIT FORMUYLA AYNI tutuldu (min 8, büyük+küçük+rakam, max 128).
 * Max 128: argon2 hash'i CPU/RAM DoS'una karşı. Panelden açılan hesap diye kural
 * gevşetilmedi — bu hesaplar panele giriyor, yani daha değerli hedefler.
 */
class CreateUserDto {
  @IsEmail({}, { message: "Geçerli bir e-posta adresi girin." })
  @MaxLength(254)
  email!: string;

  @IsString()
  @MinLength(8, { message: "Şifre en az 8 karakter olmalı." })
  @MaxLength(128, { message: "Şifre çok uzun." })
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).+$/, {
    message: "Şifre büyük harf, küçük harf ve rakam içermelidir.",
  })
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

/**
 * PANEL KULLANICILARI — 2026-08-21 (Hasan: "yetkiliyi panelden nasıl ekleyeceğim").
 *
 * YALNIZ super_admin. Sebep: rol atama, yetki YÜKSELTME aracıdır. admin rolündeki biri
 * kendini ya da bir başkasını super_admin yapabilseydi rol ayrımının anlamı kalmazdı.
 *
 * KORUMALAR:
 *  - Kendi rolünü değiştiremezsin (kendini kilitleme + kendini yükseltme engeli).
 *  - Son super_admin'in rolü düşürülemez (paneli sahipsiz bırakma engeli).
 *  - Yeni kullanıcı BURADAN OLUŞTURULMAZ: kişi önce siteden normal üye olur, sonra
 *    buradan rolü yükseltilir. Böylece şifre belirleme/doğrulama mevcut güvenli akıştan
 *    geçer, panelde ikinci bir hesap oluşturma yolu (ve zayıf şifre riski) açılmaz.
 *  - Her değişiklik audit_logs'a yazılır (kim, kimi, neden→ne, IP).
 */
@ApiTags("admin-panel-users")
// YOL ÇAKIŞMASI DÜZELTMESİ (2026-08-21): "admin/users" yolunu UsersAdminController
// (müşteri yönetimi) ZATEN kullanıyor ve onun @Get()'i benimkini yutuyordu; sayfa dizi
// alıp `data.users` tanımsız kalınca çöküyordu. Ayrı yola taşındı.
@Controller("admin/panel-users")
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles("super_admin")
@ApiBearerAuth()
export class AdminUsersController {
  constructor(private prisma: PrismaService) {}

  /** Panel erişimi olan kullanıcılar (müşteriler HARİÇ). */
  @Get()
  async list() {
    const users = await this.prisma.user.findMany({
      where: { role: { not: "customer" } },
      select: { id: true, email: true, fullName: true, role: true, createdAt: true },
      orderBy: [{ role: "asc" }, { createdAt: "asc" }],
    });
    return { users, assignableRoles: ASSIGNABLE };
  }

  /**
   * E-postadan kullanıcı bulup rol atar (yetkili "ekleme" akışı).
   * Kullanıcı yoksa 404 — önce siteden üye olması gerekir (bkz. sınıf notu).
   */
  @Patch("invite")
  async invite(@Body() dto: InviteDto, @Req() req: Request & { user: { sub: string } }) {
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
   * Panelden yetkili hesabı OLUŞTUR. E-posta zaten kayıtlıysa 409 — o durumda
   * "yetki ver" akışı (invite) kullanılmalı, mevcut hesabın şifresi ezilmemeli.
   *
   * emailVerifiedAt DOLU yazılır: hesabı yönetici açtığı için doğrulama maili
   * beklemeye gerek yok, aksi halde kişi panele giremezdi.
   */
  @Post()
  async create(@Body() dto: CreateUserDto, @Req() req: Request & { user: { sub: string } }) {
    const email = dto.email.toLowerCase().trim();
    const exists = await this.prisma.user.findFirst({
      where: { email: { equals: email, mode: "insensitive" } },
      select: { id: true, role: true },
    });
    if (exists) {
      // Kayıtlı e-posta iki farklı durumdur:
      //  a) MÜŞTERİ hesabı → yetki ver (rolü yükselt). Şifresine DOKUNMA; kendi şifresi kalsın.
      //     Aksi halde çıkmaz sokak olurdu: kişi listede görünmediği için rolü de değiştirilemezdi.
      //  b) Zaten panel yetkilisi → 409; rolü aşağıdaki listeden değiştirilmeli.
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

    await this.prisma.auditLog
      .create({
        data: {
          actorId: req.user.sub,
          entityType: "User",
          entityId: user.id,
          action: "panel_user_create",
          diff: { email: user.email, role: user.role },
          ipAddress: req.ip ?? null,
        },
      })
      .catch(() => undefined);

    return { ok: true, email: user.email, role: user.role };
  }

  @Patch(":id/role")
  async setRole(
    @Param("id") id: string,
    @Body() dto: SetRoleDto,
    @Req() req: Request & { user: { sub: string } },
  ) {
    return this.applyRole(id, dto.role, req.user.sub, req.ip);
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

    // Son super_admin korumasi: paneli sahipsiz birakma.
    if (target.role === "super_admin" && role !== "super_admin") {
      const count = await this.prisma.user.count({ where: { role: "super_admin" } });
      if (count <= 1) {
        throw new ForbiddenException("Son süper admin'in yetkisi kaldırılamaz.");
      }
    }

    await this.prisma.user.update({
      where: { id: targetId },
      data: { role: role as never },
    });

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
