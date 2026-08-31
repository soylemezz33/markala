import { Controller, Get, Header, Param, Query, UseGuards, Post, Body, Patch, Delete } from "@nestjs/common";
import { ApiTags, ApiBearerAuth } from "@nestjs/swagger";
import { CategoriesService } from "./categories.service";
import { JwtAuthGuard } from "../auth/jwt.guard";
import { RolesGuard, Roles } from "../auth/roles.guard";
import { Perms, PERM } from "../auth/permissions";
import { CreateCategoryDto, UpdateCategoryDto } from "./categories.dto";

@ApiTags("categories")
@Controller("categories")
export class CategoriesController {
  constructor(private service: CategoriesService) {}

  /**
   * HALKA AÇIK liste. `profitMargin` ayıklanır — kategori kâr marjı ticari sırdır ve
   * storefront'ta hiç kullanılmıyor (2026-08-31 denetim bulgusu). Panelin marj ekranı
   * aşağıdaki guard'lı "admin-list" ucunu kullanır.
   */
  @Get()
  @Header("Cache-Control", "public, s-maxage=60, stale-while-revalidate=300")
  async list(@Query("includeInactive") includeInactive?: string) {
    const kategoriler = await this.service.findAll(includeInactive === "true");
    return kategoriler.map(({ profitMargin: _m, ...kalan }) => kalan);
  }

  /** Panel listesi — marj DAHİL. ":slug" rotasından ÖNCE tanımlanmalı. */
  @Get("admin-list")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("admin", "super_admin")
  @Perms(PERM.CATALOG)
  @ApiBearerAuth()
  adminList(@Query("includeInactive") includeInactive?: string) {
    return this.service.findAll(includeInactive === "true");
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
  create(@Body() dto: CreateCategoryDto) {
    return this.service.create(dto);
  }

  @Patch(":id")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("admin", "super_admin")
  @Perms(PERM.CATALOG)
  @ApiBearerAuth()
  update(@Param("id") id: string, @Body() dto: UpdateCategoryDto) {
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
