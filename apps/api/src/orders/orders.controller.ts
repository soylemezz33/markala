import { Controller, Get, Post, Patch, Body, Param, UseGuards, Req, Query, Headers } from "@nestjs/common";
import { ApiTags, ApiBearerAuth } from "@nestjs/swagger";
import { OrdersService } from "./orders.service";
import { JwtAuthGuard } from "../auth/jwt.guard";
import { RolesGuard, Roles } from "../auth/roles.guard";
import { CreateOrderDto, UpdateOrderStatusDto } from "./orders.dto";
import type { Request } from "express";

@ApiTags("orders")
@Controller("orders")
export class OrdersController {
  constructor(private service: OrdersService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  create(
    @Req() req: Request & { user: { sub: string } },
    @Body() dto: CreateOrderDto,
    @Headers("idempotency-key") idempotencyKey?: string,
  ) {
    return this.service.create({ ...dto, userId: req.user.sub, idempotencyKey });
  }

  @Post("guest")
  createGuest(@Body() dto: CreateOrderDto, @Headers("idempotency-key") idempotencyKey?: string) {
    return this.service.create({ ...dto, idempotencyKey });
  }

  @Get("mine")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  listMine(@Req() req: Request & { user: { sub: string } }) {
    return this.service.listMine(req.user.sub);
  }

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("admin", "super_admin")
  @ApiBearerAuth()
  listAll(
    @Query("status") status?: string,
    @Query("take") take?: string,
    @Query("skip") skip?: string,
  ) {
    return this.service.listAll({
      status,
      take: take ? parseInt(take) : undefined,
      skip: skip ? parseInt(skip) : undefined,
    });
  }

  @Get(":id")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  detail(@Req() req: Request & { user: { sub: string; role: string } }, @Param("id") id: string) {
    return this.service.findById(id, req.user.role === "customer" ? req.user.sub : undefined);
  }

  @Patch(":id/status")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("admin", "super_admin")
  @ApiBearerAuth()
  updateStatus(@Param("id") id: string, @Body() dto: UpdateOrderStatusDto) {
    return this.service.updateStatus(id, dto.status, {
      trackingNumber: dto.trackingNumber,
      trackingCarrier: dto.trackingCarrier,
    });
  }
}
