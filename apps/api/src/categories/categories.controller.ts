import { Controller, Get, Param, Query, UseGuards, Post, Body, Patch, Delete } from "@nestjs/common";
import { ApiTags, ApiBearerAuth } from "@nestjs/swagger";
import { CategoriesService } from "./categories.service";
import { JwtAuthGuard } from "../auth/jwt.guard";
import { RolesGuard, Roles } from "../auth/roles.guard";
import { CreateCategoryDto, UpdateCategoryDto } from "./categories.dto";

@ApiTags("categories")
@Controller("categories")
export class CategoriesController {
  constructor(private service: CategoriesService) {}

  @Get()
  list(@Query("includeInactive") includeInactive?: string) {
    return this.service.findAll(includeInactive === "true");
  }

  @Get(":slug")
  detail(@Param("slug") slug: string) {
    return this.service.findBySlug(slug);
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("admin", "super_admin")
  @ApiBearerAuth()
  create(@Body() dto: CreateCategoryDto) {
    return this.service.create(dto);
  }

  @Patch(":id")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("admin", "super_admin")
  @ApiBearerAuth()
  update(@Param("id") id: string, @Body() dto: UpdateCategoryDto) {
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
