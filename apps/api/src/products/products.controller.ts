import {
  Controller,
  Get,
  Param,
  Query,
  UseGuards,
  Post,
  Body,
  Patch,
  Delete,
  Req,
  ForbiddenException,
} from "@nestjs/common";
import type { Request } from "express";
import { ApiTags, ApiBearerAuth, ApiQuery } from "@nestjs/swagger";
import { ProductsService } from "./products.service";
import { JwtAuthGuard } from "../auth/jwt.guard";
import { RolesGuard, Roles } from "../auth/roles.guard";
import { Perms, PERM, roleHasPerm } from "../auth/permissions";
import { CreateProductDto, UpdateProductDto } from "./products.dto";

/**
 * Ürün yazma uçlarında FİYAT alanlarını PERM.PRICING'e bağlar (2026-08-31 denetim bulgusu).
 *
 * Bu uçlar `@Perms(PERM.CATALOG)` ile işaretli ve RolesGuard izin tabanlı açılım yapıyor
 * (roles.guard.ts:39) → `tasarimci` rolü CATALOG'a sahip olduğu için buradan geçiyordu.
 * Oysa permissions.ts:61 açıkça şunu yazıyor: "Fiyat AYRI izindir (PERM.PRICING) ve
 * tasarımcıda YOK". DTO `basePrice`/`startingPrice` kabul ettiği için tasarımcı tek bir
 * PATCH ile siparişte fiilen tahsil edilen tutarı (Product.basePrice) değiştirebiliyordu.
 *
 * Alanlar DTO'dan tamamen çıkarılmadı: panelin "yeni ürün" formu basePrice gönderiyor
 * (new-product-client.tsx:77) ve PRICING iznine sahip roller için bu meşru.
 */
function fiyatAlaniYetkisiDogrula(
  role: string | undefined,
  dto: { basePrice?: unknown; startingPrice?: unknown },
): void {
  const fiyatDokunuyor = dto.basePrice !== undefined || dto.startingPrice !== undefined;
  if (!fiyatDokunuyor) return;
  if (roleHasPerm(role, PERM.PRICING)) return;
  throw new ForbiddenException("Fiyat alanlarını değiştirme yetkiniz yok.");
}

@ApiTags("products")
@Controller("products")
export class ProductsController {
  constructor(private service: ProductsService) {}

  @Get()
  @ApiQuery({ name: "category", required: false })
  @ApiQuery({ name: "bestseller", required: false })
  @ApiQuery({ name: "take", required: false })
  @ApiQuery({ name: "q", required: false })
  @ApiQuery({ name: "list", required: false, description: "true → hafif liste yanıtı (content/description hariç)" })
  list(
    @Query("category") category?: string,
    @Query("bestseller") bestseller?: string,
    @Query("take") take?: string,
    @Query("skip") skip?: string,
    @Query("q") q?: string,
    @Query("list") list?: string,
  ) {
    return this.service.findAll({
      categorySlug: category,
      bestseller: bestseller === "true" ? true : bestseller === "false" ? false : undefined,
      take: take ? parseInt(take) : undefined,
      skip: skip ? parseInt(skip) : undefined,
      q,
      list: list === "true",
    });
  }

  /**
   * ADMIN: pasif ürünler dahil TÜM ürünleri döndürür (storefront `GET /products` daima
   * aktif-filtreli). ":slug" rotasından ÖNCE tanımlanmalı (yoksa "admin-list" slug sanılır).
   */
  @Get("admin-list")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("admin", "super_admin")
  @Perms(PERM.CATALOG)
  @ApiBearerAuth()
  @ApiQuery({ name: "take", required: false })
  @ApiQuery({ name: "q", required: false })
  adminList(
    @Query("category") category?: string,
    @Query("take") take?: string,
    @Query("skip") skip?: string,
    @Query("q") q?: string,
  ) {
    return this.service.findAll({
      categorySlug: category,
      take: take ? parseInt(take) : undefined,
      skip: skip ? parseInt(skip) : undefined,
      q,
      includeInactive: true,
    });
  }

  @Get(":slug")
  detail(@Param("slug") slug: string) {
    return this.service.findBySlug(slug);
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("admin", "super_admin")
  @Perms(PERM.CATALOG)
  @ApiBearerAuth()
  create(@Req() req: Request & { user: { role: string } }, @Body() dto: CreateProductDto) {
    fiyatAlaniYetkisiDogrula(req.user?.role, dto);
    return this.service.create(dto);
  }

  @Patch(":id")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("admin", "super_admin")
  @Perms(PERM.CATALOG)
  @ApiBearerAuth()
  update(
    @Req() req: Request & { user: { role: string } },
    @Param("id") id: string,
    @Body() dto: UpdateProductDto,
  ) {
    fiyatAlaniYetkisiDogrula(req.user?.role, dto);
    return this.service.update(id, dto);
  }

  @Delete(":id")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("admin", "super_admin")
  @Perms(PERM.CATALOG)
  @ApiBearerAuth()
  remove(@Param("id") id: string) {
    return this.service.remove(id);
  }
}
