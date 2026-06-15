import { Controller, Get, Post, Patch, Delete, Param, Body, UseGuards } from "@nestjs/common";
import { ApiTags, ApiBearerAuth } from "@nestjs/swagger";
import { CouponsService } from "./coupons.service";
import { JwtAuthGuard } from "../auth/jwt.guard";
import { RolesGuard, Roles } from "../auth/roles.guard";
import { CreateCouponDto, UpdateCouponDto } from "./coupons.dto";

@ApiTags("coupons")
@Controller("coupons")
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles("admin", "super_admin")
@ApiBearerAuth()
export class CouponsController {
  constructor(private service: CouponsService) {}

  @Get()
  list() {
    return this.service.findAll();
  }

  @Post()
  create(@Body() dto: CreateCouponDto) {
    return this.service.create(dto);
  }

  @Patch(":id")
  update(@Param("id") id: string, @Body() dto: UpdateCouponDto) {
    return this.service.update(id, dto);
  }

  @Delete(":id")
  remove(@Param("id") id: string) {
    return this.service.remove(id);
  }
}
