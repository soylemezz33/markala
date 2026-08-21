import { Body, Controller, ForbiddenException, Get, NotFoundException, Param, Patch, Req, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { IsEmail, IsIn, IsString } from "class-validator";
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
