import { Controller, Get, Query, UseGuards } from "@nestjs/common";
import { ApiTags, ApiBearerAuth } from "@nestjs/swagger";
import { StatsService } from "./stats.service";
import { ProfitService } from "./profit.service";
import { JwtAuthGuard } from "../auth/jwt.guard";
import { RolesGuard, Roles } from "../auth/roles.guard";

@ApiTags("admin-stats")
@Controller("admin/stats")
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles("admin", "super_admin")
@ApiBearerAuth()
export class StatsController {
  constructor(private service: StatsService, private profit: ProfitService) {}

  @Get()
  summary() {
    return this.service.summary();
  }

  /** Kâr analizi — ciro KDV hariç, maliyeti bilinmeyen kalemler ayrı raporlanır. */
  @Get("profit")
  profitSummary(@Query("days") days?: string) {
    const n = Number(days);
    return this.profit.summary(Number.isFinite(n) && n > 0 ? n : undefined);
  }
}
