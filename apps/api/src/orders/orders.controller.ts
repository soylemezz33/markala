import { Controller, Get, Post, Patch, Body, Param, UseGuards, Req, Query, Headers } from "@nestjs/common";
import { ApiTags, ApiBearerAuth } from "@nestjs/swagger";
import { ConfigService } from "@nestjs/config";
import { OrdersService } from "./orders.service";
import { JwtAuthGuard } from "../auth/jwt.guard";
import { RolesGuard, Roles } from "../auth/roles.guard";
import { CreateOrderDto, ListOrdersQueryDto, UpdateOrderStatusDto } from "./orders.dto";
import { paymentNonce } from "../payments/payment-nonce";
import type { Request } from "express";

@ApiTags("orders")
@Controller("orders")
export class OrdersController {
  constructor(private service: OrdersService, private config: ConfigService) {}

  /**
   * Sipariş yanıtına ödeme nonce'u ekler — /payments/iyzico/init bunu zorunlu kılar.
   * Böylece sipariş id'sini ele geçiren biri (cuid bilse bile) ödeme başlatamaz/statü bozamaz.
   */
  private withNonce<T extends { id: string }>(order: T): T & { paymentNonce: string } {
    const secret = this.config.get<string>("JWT_SECRET") ?? "";
    return { ...order, paymentNonce: paymentNonce(secret, order.id) };
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  async create(
    @Req() req: Request & { user: { sub: string } },
    @Body() dto: CreateOrderDto,
    @Headers("idempotency-key") idempotencyKey?: string,
  ) {
    const order = await this.service.create({ ...dto, userId: req.user.sub, idempotencyKey });
    return this.withNonce(order as { id: string });
  }

  // NOT: Misafir sipariş (POST /orders/guest) KALDIRILDI — sipariş vermek için giriş zorunlu.
  // Gerekçe: ilk-sipariş kuponunun (HOSGELDIN) misafir istismarı + her siparişin hesaba bağlanması.
  // Tek çağıran web checkout proxy'siydi; o da artık yalnız authed /orders'a gider.

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
  listAll(@Query() query: ListOrdersQueryDto) {
    return this.service.listAll({
      status: query.status,
      take: query.take,
      skip: query.skip,
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
  updateStatus(
    @Param("id") id: string,
    @Body() dto: UpdateOrderStatusDto,
    @Req() req: Request & { user?: { sub?: string } },
  ) {
    return this.service.updateStatus(
      id,
      dto.status,
      { trackingNumber: dto.trackingNumber, trackingCarrier: dto.trackingCarrier },
      { actorId: req.user?.sub ?? null, ipAddress: req.ip ?? null },
    );
  }
}
