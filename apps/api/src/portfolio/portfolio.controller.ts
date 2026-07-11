import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { JwtAuthGuard } from "../auth/jwt.guard";
import { Roles, RolesGuard } from "../auth/roles.guard";
import { PortfolioService } from "./portfolio.service";
import { CreatePortfolioItemDto, UpdatePortfolioItemDto } from "./portfolio.dto";

/**
 * Portfolyo / tamamlanmış işler.
 * Public: GET /portfolio/public → yalnız aktif öğeler (guard YOK).
 * Admin: GET/POST/PATCH/DELETE /portfolio → method-level guard (admin, super_admin).
 *
 * Statik /portfolio/public, /portfolio/:id'den (PATCH/DELETE) önce gelir (brands deseni).
 */
@ApiTags("portfolio")
@Controller("portfolio")
export class PortfolioController {
  constructor(private service: PortfolioService) {}

  /** Public — aktif portfolyo öğeleri (storefront galeri). */
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
  create(@Body() dto: CreatePortfolioItemDto) {
    return this.service.create(dto);
  }

  @Patch(":id")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("admin", "super_admin")
  @ApiBearerAuth()
  update(@Param("id") id: string, @Body() dto: UpdatePortfolioItemDto) {
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
