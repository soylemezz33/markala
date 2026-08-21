import { Controller, Get, Post, Patch, Delete, Param, Body, Query, UseGuards } from "@nestjs/common";
import { ApiTags, ApiBearerAuth } from "@nestjs/swagger";
import { FaqsService } from "./faqs.service";
import { JwtAuthGuard } from "../auth/jwt.guard";
import { RolesGuard, Roles } from "../auth/roles.guard";
import { Perms, PERM } from "../auth/permissions";
import { CreateFaqDto, UpdateFaqDto } from "./faqs.dto";

@ApiTags("faqs")
@Controller("faqs")
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles("admin", "super_admin")
@Perms(PERM.CATALOG)
@ApiBearerAuth()
export class FaqsController {
  constructor(private service: FaqsService) {}

  @Get()
  list(@Query("category") category?: string) {
    return this.service.findAll(category);
  }

  @Post()
  create(@Body() dto: CreateFaqDto) {
    return this.service.create(dto);
  }

  @Patch(":id")
  update(@Param("id") id: string, @Body() dto: UpdateFaqDto) {
    return this.service.update(id, dto);
  }

  @Delete(":id")
  remove(@Param("id") id: string) {
    return this.service.remove(id);
  }
}

/**
 * Halka açık SSS ucu — storefront /yardim/sss bu uçtan beslenir.
 * Ana controller sınıf seviyesinde admin-guard'lı olduğundan (yönetim uçları),
 * public okuma AYRI controller'da: guard yok, yalnız aktif kayıtlar döner.
 */
@ApiTags("faqs")
@Controller("faqs/public")
export class PublicFaqsController {
  constructor(private service: FaqsService) {}

  @Get()
  list() {
    return this.service.findAllPublic();
  }
}
