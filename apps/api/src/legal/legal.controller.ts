import { Controller, Get, Post, Patch, Delete, Param, Body, UseGuards } from "@nestjs/common";
import { ApiTags, ApiBearerAuth } from "@nestjs/swagger";
import { LegalService } from "./legal.service";
import { JwtAuthGuard } from "../auth/jwt.guard";
import { RolesGuard, Roles } from "../auth/roles.guard";
import { CreateLegalPageDto, UpdateLegalPageDto } from "./legal.dto";

@ApiTags("legal")
@Controller("legal")
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles("admin", "super_admin")
@ApiBearerAuth()
export class LegalController {
  constructor(private service: LegalService) {}

  @Get()
  list() {
    return this.service.findAll();
  }

  @Get(":slug")
  detail(@Param("slug") slug: string) {
    return this.service.findBySlug(slug);
  }

  @Post()
  create(@Body() dto: CreateLegalPageDto) {
    return this.service.create(dto);
  }

  @Patch(":id")
  update(@Param("id") id: string, @Body() dto: UpdateLegalPageDto) {
    return this.service.update(id, dto);
  }

  @Delete(":id")
  remove(@Param("id") id: string) {
    return this.service.remove(id);
  }
}
