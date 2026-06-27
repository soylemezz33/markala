import { Controller, Get, Patch, Query, Body, UseGuards } from "@nestjs/common";
import { ApiTags, ApiBearerAuth } from "@nestjs/swagger";
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

  /** Public — storefront m² konfigüratörü kur/marj/kdv/minM2'yi buradan okur. */
  @Get("pricing")
  pricing() {
    return this.service.getPricing();
  }

  /** Public — storefront header menüsünü buradan okur (admin /menu yönetir). */
  @Get("header-nav")
  headerNav() {
    return this.service.getHeaderNav();
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
