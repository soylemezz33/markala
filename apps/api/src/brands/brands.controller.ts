import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { JwtAuthGuard } from "../auth/jwt.guard";
import { Roles, RolesGuard } from "../auth/roles.guard";
import { BrandsService } from "./brands.service";
import { CreateBrandDto, UpdateBrandDto } from "./brands.dto";

/**
 * Markalar / Referanslar.
 * Public: GET /brands/public → yalnız aktif markalar (guard YOK).
 * Admin: GET/POST/PATCH/DELETE /brands → method-level guard (admin, super_admin).
 *
 * Statik /brands/public, /brands/:id'den (PATCH/DELETE) önce gelir; GET /brands listesi
 * parametre almadığı için çakışma yok.
 */
@ApiTags("brands")
@Controller("brands")
export class BrandsController {
  constructor(private service: BrandsService) {}

  /** Public — aktif markalar (storefront Referanslar bölümü). */
  @Get("public")
  listPublic() {
    return this.service.findActive();
  }

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("admin", "super_admin")
  @ApiBearerAuth()
  list() {
    return this.service.findAll();
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("admin", "super_admin")
  @ApiBearerAuth()
  create(@Body() dto: CreateBrandDto) {
    return this.service.create(dto);
  }

  @Patch(":id")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("admin", "super_admin")
  @ApiBearerAuth()
  update(@Param("id") id: string, @Body() dto: UpdateBrandDto) {
    return this.service.update(id, dto);
  }

  @Delete(":id")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("admin", "super_admin")
  @ApiBearerAuth()
  remove(@Param("id") id: string) {
    return this.service.remove(id);
  }
}
