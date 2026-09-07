import { Controller, Get, Patch, Query, Body, UseGuards } from "@nestjs/common";
import { ApiTags, ApiBearerAuth } from "@nestjs/swagger";
import { halkaAcikFiyatAyarlari } from "./halka-acik-fiyat";
import { SettingsService } from "./settings.service";
import { JwtAuthGuard } from "../auth/jwt.guard";
import { RolesGuard, Roles } from "../auth/roles.guard";
import { UpsertSettingsDto } from "./settings.dto";

@ApiTags("settings")
@Controller("settings")
export class SettingsController {
  constructor(private service: SettingsService) {}

  @Get("shipping")
  shipping() {
    return this.service.getShipping();
  }

  /**
   * Public — storefront m² konfigüratörü kur/kdv/minM2'yi buradan okur.
   *
   * `marj` BİLEREK DÖNMEZ (2026-09-07). Kâr çarpanı ticari bilgidir; 31 Ağustos denetiminde
   * ürün ve kategori bazlı `profitMargin` halka açık yanıtlardan ayıklanmıştı ama bu GLOBAL
   * çarpan gözden kaçmıştı — hem bu uçtan hem ürün sayfasının kaynağından okunabiliyordu.
   * Fiyatlar zaten açık olduğu için çarpanı bilen maliyeti geri hesaplayabilir.
   *
   * KALDIRMAK GÜVENLİ: konfigüratör bu değeri hiç okumuyor (configurator.ts alanı
   * `{ kur, kdv, minM2 }` olarak ayrıştırır; m² fiyatı zaten KDV dahil son satış
   * değerinden gelir). Panel marjı KORUMALI `GET /settings` ucundan alır, etkilenmez.
   */
  @Get("pricing")
  async pricing() {
    return halkaAcikFiyatAyarlari(await this.service.getPricing());
  }

  /** Public — storefront header menüsünü buradan okur (admin /menu yönetir). */
  @Get("header-nav")
  headerNav() {
    return this.service.getHeaderNav();
  }

  // PUBLIC (guard YOK) — storefront middleware her istekte bunu okur: bakım bayrağı + iletişim.
  // Hassas veri içermez; "public" path'i @Get() ("/settings") ile çakışmaz.
  @Get("public")
  getPublic() {
    return this.service.getPublicConfig();
  }

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("admin", "super_admin")
  @ApiBearerAuth()
  get(@Query("group") group?: string) {
    return this.service.findByGroup(group);
  }

  @Patch()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("admin", "super_admin")
  @ApiBearerAuth()
  upsert(@Body() dto: UpsertSettingsDto) {
    return this.service.upsertMany(dto.group, dto.values);
  }
}
