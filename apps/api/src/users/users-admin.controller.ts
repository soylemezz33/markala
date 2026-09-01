import { Body, Controller, Get, Param, Patch, Query, Req, UseGuards } from "@nestjs/common";
import type { Request } from "express";
import { ApiTags, ApiBearerAuth } from "@nestjs/swagger";
import { UsersService } from "./users.service";
import { JwtAuthGuard } from "../auth/jwt.guard";
import { RolesGuard, Roles } from "../auth/roles.guard";
import { Perms, PERM } from "../auth/permissions";
import { ListUsersQueryDto, UpdateCorporateDto } from "./users.dto";

@ApiTags("admin-users")
@Controller("admin/users")
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles("admin", "super_admin")
// 2026-09-01: uç yalnız rol adına bağlıydı, bu yüzden CUSTOMERS_READ'i olan roller
// (tasarımcı, muhasebe) /musteriler sayfasını menüde GÖRÜYOR ama liste 403 dönüp BOŞ
// geliyordu. Kargo rolünde de aynısı olacaktı. İzin eklendi; parasal alanlar yanıttan
// ORDERS_AMOUNTS'a göre ayrıca kesiliyor (users.service).
@Perms(PERM.CUSTOMERS_READ)
@ApiBearerAuth()
export class UsersAdminController {
  constructor(private service: UsersService) {}

  @Get()
  list(@Query() query: ListUsersQueryDto) {
    return this.service.listForAdmin({ take: query.take, skip: query.skip, q: query.q });
  }

  @Get(":id")
  detail(@Param("id") id: string, @Req() req: Request & { user?: { role?: string } }) {
    return this.service.getForAdmin(id, req.user?.role);
  }

  /**
   * Kurumsal müşteri ayarları (indirim oranı + kredi limiti) — admin müşteri başına belirler.
   *
   * ⚠️ Sınıf seviyesindeki CUSTOMERS_READ'i EZER (metot dekoratörü önceliklidir). Aksi halde
   * müşteri kartını okuyabilen her rol — kargo dahil — iskonto ve kredi limiti YAZABİLİRDİ.
   * Bu parasal bir ayardır, FINANCE ister.
   */
  @Patch(":id/corporate")
  @Perms(PERM.FINANCE)
  updateCorporate(@Param("id") id: string, @Body() dto: UpdateCorporateDto) {
    return this.service.updateCorporateSettings(id, dto);
  }
}
