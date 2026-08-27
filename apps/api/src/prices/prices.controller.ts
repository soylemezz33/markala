import { Controller, Get, Put, Post, Param, Body, UseGuards } from "@nestjs/common";
import { ApiTags, ApiBearerAuth } from "@nestjs/swagger";
import { PricesService } from "./prices.service";
import { JwtAuthGuard } from "../auth/jwt.guard";
import { RolesGuard, Roles } from "../auth/roles.guard";
import { Perms, PERM } from "../auth/permissions";
import { SetOptionsDto, SetPricesDto, BulkAdjustDto, CategorySetDto, ApplyToCategoryDto, ApplyMarginDto, SetMarginDto } from "./prices.dto";

@ApiTags("prices")
@Controller()
export class PricesController {
  constructor(private service: PricesService) {}

  @Get("products/:id/prices")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("admin", "super_admin")
  @Perms(PERM.PRICING)
  @ApiBearerAuth()
  getForProduct(@Param("id") id: string) {
    return this.service.getForProduct(id);
  }

  @Put("products/:id/options")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("admin", "super_admin")
  @Perms(PERM.PRICING)
  @ApiBearerAuth()
  setOptions(@Param("id") id: string, @Body() dto: SetOptionsDto) {
    return this.service.setOptions(id, dto.options);
  }

  @Put("products/:id/prices")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("admin", "super_admin")
  @Perms(PERM.PRICING)
  @ApiBearerAuth()
  setPrices(@Param("id") id: string, @Body() dto: SetPricesDto) {
    return this.service.setPrices(id, dto.prices);
  }

  @Post("prices/bulk-adjust")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("admin", "super_admin")
  @Perms(PERM.PRICING)
  @ApiBearerAuth()
  bulkAdjust(@Body() dto: BulkAdjustDto) {
    return this.service.bulkAdjust(dto);
  }

  @Post("prices/category-set")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("admin", "super_admin")
  @Perms(PERM.PRICING)
  @ApiBearerAuth()
  categorySet(@Body() dto: CategorySetDto) {
    return this.service.categorySet(dto.categoryId, dto.price);
  }

  /** Kaynak ürünle aynı kategori+yapıdaki kardeş sayısı (buton rozeti için). */
  @Get("prices/:productId/siblings")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("admin", "super_admin")
  @Perms(PERM.PRICING)
  @ApiBearerAuth()
  siblings(@Param("productId") productId: string) {
    return this.service.countStructureSiblings(productId);
  }

  /** Kaynak ürünün fiyat ızgarasını aynı kategori+yapıdaki kardeşlere kopyalar. */
  @Post("prices/apply-to-category")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("admin", "super_admin")
  @Perms(PERM.PRICING)
  @ApiBearerAuth()
  applyToCategory(@Body() dto: ApplyToCategoryDto) {
    return this.service.applyToCategory(dto.sourceProductId);
  }
  // ── KÂR MARJI (2026-08-27) ─────────────────────────────────────────────
  /** Ürünün marj durumu: ürün/kategori/global değerleri + gerçekleşen ortalama. */
  @Get("prices/margin/:productId")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("admin", "super_admin")
  @Perms(PERM.PRICING)
  @ApiBearerAuth()
  marginInfo(@Param("productId") productId: string) {
    return this.service.marginInfo(productId);
  }

  /** Kategori/ürün marjını kaydeder (null → kaldır). Fiyatlara DOKUNMAZ. */
  @Post("prices/margin")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("admin", "super_admin")
  @Perms(PERM.PRICING)
  @ApiBearerAuth()
  setMargin(@Body() dto: SetMarginDto) {
    return this.service.setMargin(dto.scope, dto.targetId, dto.margin ?? null);
  }

  /** Marjı fiyatlara uygular. dryRun varsayılan TRUE — önce önizleme. */
  @Post("prices/apply-margin")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("admin", "super_admin")
  @Perms(PERM.PRICING)
  @ApiBearerAuth()
  applyMargin(@Body() dto: ApplyMarginDto) {
    return this.service.applyMargin(dto.scope, dto.targetId, dto.margin, dto.dryRun !== false);
  }
}
