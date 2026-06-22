import { Controller, Get, Put, Param, Body, UseGuards } from "@nestjs/common";
import { ApiTags, ApiBearerAuth } from "@nestjs/swagger";
import { PricesService } from "./prices.service";
import { JwtAuthGuard } from "../auth/jwt.guard";
import { RolesGuard, Roles } from "../auth/roles.guard";
import { SetOptionsDto, SetPricesDto } from "./prices.dto";

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

  @Put("products/:id/options")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("admin", "super_admin")
  @ApiBearerAuth()
  setOptions(@Param("id") id: string, @Body() dto: SetOptionsDto) {
    return this.service.setOptions(id, dto.options);
  }

  @Put("products/:id/prices")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("admin", "super_admin")
  @ApiBearerAuth()
  setPrices(@Param("id") id: string, @Body() dto: SetPricesDto) {
    return this.service.setPrices(id, dto.prices);
  }
}
