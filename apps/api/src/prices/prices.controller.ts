import { Controller, Get, Param, UseGuards } from "@nestjs/common";
import { ApiTags, ApiBearerAuth } from "@nestjs/swagger";
import { PricesService } from "./prices.service";
import { JwtAuthGuard } from "../auth/jwt.guard";
import { RolesGuard, Roles } from "../auth/roles.guard";

@ApiTags("prices")
@Controller()
export class PricesController {
  constructor(private service: PricesService) {}

  @Get("products/:id/prices")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("admin", "super_admin")
  @ApiBearerAuth()
  getForProduct(@Param("id") id: string) {
    return this.service.getForProduct(id);
  }
}
