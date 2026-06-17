import { Body, Controller, Get, Headers, Param, Post, Query, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { JwtService } from "@nestjs/jwt";
import { validateSync } from "class-validator";
import { plainToInstance } from "class-transformer";
import { AnalyticsService } from "./analytics.service";
import { CollectDto, CollectEventDto, OverviewQueryDto } from "./analytics.dto";
import { JwtAuthGuard } from "../auth/jwt.guard";
import { RolesGuard, Roles } from "../auth/roles.guard";

@ApiTags("analytics")
@Controller("analytics")
export class AnalyticsController {
  constructor(
    private service: AnalyticsService,
    private jwt: JwtService,
  ) {}

  /**
   * ENDPOINT 1 — PUBLIC, guard YOK. Yüksek-frekanslı storefront olay gönderimi.
   *
   * Dayanıklılık sözleşmesi: ASLA 4xx/5xx fırlatma. Geçersiz olaylar sessizce atlanır,
   * dizi 50'den uzunsa kırpılır. Authorization Bearer header varsa JWT soft-decode edilir
   * (geçersizse yoksayılır → endpoint public kalır), userId olaylara eklenir.
   *
   * NOT: ValidationPipe whitelist'i CollectDto.events dizisini geçirir; her olay burada
   * validateSync ile tek tek elenir (global pipe geçersizleri komple reddetmesin diye gevşek).
   */
  @Post("collect")
  async collect(@Body() body: unknown, @Headers("authorization") authHeader?: string) {
    let rawEvents: unknown[] = [];
    if (body && typeof body === "object" && Array.isArray((body as CollectDto).events)) {
      rawEvents = (body as CollectDto).events as unknown[];
    }

    // Maks 50 — fazlasını yoksay.
    const sliced = rawEvents.slice(0, 50);

    // Her olayı tek tek doğrula; geçersizleri ele (asla hata fırlatma).
    const valid: CollectEventDto[] = [];
    for (const raw of sliced) {
      try {
        const dto = plainToInstance(CollectEventDto, raw, { enableImplicitConversion: false });
        const errors = validateSync(dto, { whitelist: true, forbidNonWhitelisted: false });
        if (errors.length === 0) valid.push(dto);
      } catch {
        // tek olayın hatası tüm batch'i düşürmesin
      }
    }

    const userId = this.softDecodeUserId(authHeader);

    let accepted = 0;
    try {
      accepted = await this.service.collect(valid, userId);
    } catch {
      // service zaten hata-izole; ekstra güvenlik ağı
      accepted = 0;
    }

    return { ok: true, accepted };
  }

  /** Authorization Bearer header'ı soft-decode et; geçersiz/eksikse undefined (public kalır). */
  private softDecodeUserId(authHeader?: string): string | undefined {
    if (!authHeader) return undefined;
    const match = /^Bearer\s+(.+)$/i.exec(authHeader.trim());
    if (!match) return undefined;
    try {
      const payload = this.jwt.verify<{ sub?: string }>(match[1]);
      return typeof payload?.sub === "string" ? payload.sub : undefined;
    } catch {
      return undefined; // süresi dolmuş/geçersiz token → public kalır
    }
  }

  /**
   * ENDPOINT 2 — ADMIN JWT. Gösterge paneli özetleri (KPI/huni/top ürün/heatmap/CRM segment).
   */
  @Get("overview")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("admin", "super_admin")
  @ApiBearerAuth()
  overview(@Query() query: OverviewQueryDto) {
    return this.service.overview(query.days ?? 30);
  }

  /**
   * ENDPOINT 3 — ADMIN JWT. Bir segmentin müşteri listesi (win-back/kampanya — iletişim bilgili).
   */
  @Get("segments/:key")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("admin", "super_admin")
  @ApiBearerAuth()
  segment(@Param("key") key: string) {
    return this.service.segment(key);
  }
}
