import { Controller, Get, Query, Req, UseGuards } from "@nestjs/common";
import type { Request } from "express";
import { ApiTags, ApiBearerAuth } from "@nestjs/swagger";
import { StatsService } from "./stats.service";
import { ProfitService } from "./profit.service";
import { JwtAuthGuard } from "../auth/jwt.guard";
import { RolesGuard, Roles } from "../auth/roles.guard";
import { Perms, PERM, roleHasPerm } from "../auth/permissions";

@ApiTags("admin-stats")
@Controller("admin/stats")
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles("admin", "super_admin")
// Sinif seviyesi GENIS: dashboard sayimlarini tasarimci da gorebilmeli.
// Parasal alanlar serviste kesilir; kar ucu ayrica FINANCE ister (asagida).
@Perms(PERM.ORDERS_READ)
@ApiBearerAuth()
export class StatsController {
  constructor(private service: StatsService, private profit: ProfitService) {}

  /**
   * 2026-08-21: uc FINANCE yerine ORDERS_READ istiyor — aksi halde tasarimci panelinde
   * dashboard 403 alip HER SEYI 0 gosteriyordu (Hasan bildirdi). Parasal alanlar burada
   * degil SERVISTE, role gore kesiliyor; menu/kart gizlemek guvenlik degildir.
   */
  @Get()
  summary(@Req() req: Request & { user: { role: string } }) {
    return this.service.summary({ includeFinance: roleHasPerm(req.user?.role, PERM.FINANCE) });
  }

  /** Kâr analizi — ciro KDV hariç, maliyeti bilinmeyen kalemler ayrı raporlanır. */
  @Get("profit")
  @Perms(PERM.FINANCE)
  profitSummary(@Query("days") days?: string) {
    const n = Number(days);
    return this.profit.summary(Number.isFinite(n) && n > 0 ? n : undefined);
  }
}
