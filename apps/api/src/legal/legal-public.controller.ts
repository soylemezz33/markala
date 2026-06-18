import { Controller, Get, Param } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { LegalService } from "./legal.service";

/**
 * Storefront'a AÇIK (guard YOK) yasal sayfa okuma — yalnız AKTİF sayfalar.
 * Admin LegalController class-level guard'lı; bu ayrı public controller pasif sayfa sızdırmaz.
 * Prefix /legal/public admin /legal kökünden ayrıdır.
 */
@ApiTags("legal")
@Controller("legal/public")
export class LegalPublicController {
  constructor(private service: LegalService) {}

  /** Aktif yasal sayfa listesi (slug+title) — footer/sitemap için. */
  @Get()
  list() {
    return this.service.findActive();
  }

  /** Tek aktif yasal sayfa; yoksa 404. */
  @Get(":slug")
  detail(@Param("slug") slug: string) {
    return this.service.findActiveBySlug(slug);
  }
}
