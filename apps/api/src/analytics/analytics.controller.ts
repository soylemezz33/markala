import { Body, Controller, Get, Post, Query, Req, UseGuards } from "@nestjs/common";
import { Request } from "express";
import { AnalyticsService } from "./analytics.service";
import { TrackEventDto, FunnelQueryDto } from "./analytics.dto";
import { JwtAuthGuard } from "../auth/jwt.guard";
import { RolesGuard, Roles } from "../auth/roles.guard";

@Controller("analytics")
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Post("track")
  async track(@Body() dto: TrackEventDto, @Req() req: Request) {
    const userId = (req as any).user?.sub as string | undefined;
    const ipAddress = (req.headers["x-forwarded-for"] as string)?.split(",")[0] ?? req.socket.remoteAddress;
    const userAgent = req.headers["user-agent"];
    await this.analyticsService.track(dto, userId, ipAddress, userAgent);
    return { ok: true };
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("admin", "super_admin")
  @Get("funnel")
  async funnel(@Query() query: FunnelQueryDto) {
    const startDate = new Date(query.startDate);
    const endDate = new Date(query.endDate);
    return this.analyticsService.getFunnelCounts(startDate, endDate);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("admin", "super_admin")
  @Get("top-products")
  async topProducts(@Query() query: FunnelQueryDto) {
    const startDate = new Date(query.startDate);
    const endDate = new Date(query.endDate);
    return this.analyticsService.getTopProducts(startDate, endDate);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("admin", "super_admin")
  @Get("daily-volume")
  async dailyVolume(@Query("event") eventName: string, @Query() query: FunnelQueryDto) {
    const startDate = new Date(query.startDate);
    const endDate = new Date(query.endDate);
    return this.analyticsService.getDailyEventVolume(eventName as any, startDate, endDate);
  }
}
