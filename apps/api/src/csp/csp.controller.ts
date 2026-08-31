import { Body, Controller, Get, HttpCode, Post, Query, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { CspService } from "./csp.service";
import { JwtAuthGuard } from "../auth/jwt.guard";
import { RolesGuard, Roles } from "../auth/roles.guard";

/** Tarayıcının gönderdiği ham gövde — `{"csp-report": {...}}` veya düz nesne olabilir. */
type HamRapor = Record<string, unknown>;

@ApiTags("csp")
@Controller("csp")
export class CspController {
  constructor(private service: CspService) {}

  /**
   * PUBLIC — tarayıcı `report-uri` ile buraya POST eder, kimlik doğrulaması olamaz.
   *
   * DAYANIKLILIK SÖZLEŞMESİ: her koşulda 204 döner. Bozuk gövde, bilinmeyen alan veya
   * veritabanı hatası sayfayı etkilememeli; rapor toplama en fazla sessizce kaybolur.
   */
  @Post("report")
  @HttpCode(204)
  async report(@Body() body: HamRapor | { "csp-report"?: HamRapor } | null): Promise<void> {
    try {
      const r: HamRapor =
        (body && typeof body === "object" && "csp-report" in body
          ? ((body as { "csp-report"?: HamRapor })["csp-report"] as HamRapor)
          : (body as HamRapor)) ?? {};
      await this.service.kaydet({
        directive: (r["effective-directive"] ?? r["violated-directive"]) as string | undefined,
        blockedUri: r["blocked-uri"] as string | undefined,
        documentUri: r["document-uri"] as string | undefined,
      });
    } catch {
      // yut — 204 dönülecek
    }
  }

  /** Enforce kararı için özet. Yalnız yönetici. */
  @Get("violations")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("admin", "super_admin")
  @ApiBearerAuth()
  violations(@Query("limit") limit?: string) {
    return this.service.liste(Number(limit) || 100);
  }
}
