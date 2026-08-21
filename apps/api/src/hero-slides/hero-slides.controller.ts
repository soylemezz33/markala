import { Controller, Get, Post, Patch, Delete, Param, Query, Body, UseGuards } from "@nestjs/common";
import { ApiTags, ApiBearerAuth } from "@nestjs/swagger";
import { HeroSlidesService } from "./hero-slides.service";
import { JwtAuthGuard } from "../auth/jwt.guard";
import { RolesGuard, Roles } from "../auth/roles.guard";
import { Perms, PERM } from "../auth/permissions";
import { CreateHeroSlideDto, UpdateHeroSlideDto } from "./hero-slides.dto";

@ApiTags("hero-slides")
@Controller("hero-slides")
export class HeroSlidesController {
  constructor(private service: HeroSlidesService) {}

  @Get()
  list(@Query("includeInactive") includeInactive?: string) {
    return this.service.findAll(includeInactive === "true");
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("admin", "super_admin")
  @Perms(PERM.MEDIA)
  @ApiBearerAuth()
  create(@Body() dto: CreateHeroSlideDto) {
    return this.service.create(dto);
  }

  @Patch(":id")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("admin", "super_admin")
  @Perms(PERM.MEDIA)
  @ApiBearerAuth()
  update(@Param("id") id: string, @Body() dto: UpdateHeroSlideDto) {
    return this.service.update(id, dto);
  }

  @Delete(":id")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("admin", "super_admin")
  @Perms(PERM.MEDIA)
  @ApiBearerAuth()
  remove(@Param("id") id: string) {
    return this.service.remove(id);
  }
}
