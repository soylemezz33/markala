import { Controller, Get, Post, Patch, Body, Param, UseGuards, Req, Query, Headers } from "@nestjs/common";
import { ApiTags, ApiBearerAuth } from "@nestjs/swagger";
import { ConfigService } from "@nestjs/config";
import { OrdersService } from "./orders.service";
import { JwtAuthGuard } from "../auth/jwt.guard";
import { RolesGuard, Roles } from "../auth/roles.guard";
import { Perms, PERM } from "../auth/permissions";
import { CreateOrderDto, ListOrdersQueryDto, UpdateOrderStatusDto, TrackOrderDto } from "./orders.dto";
import { paymentNonce } from "../payments/payment-nonce";
import type { Request } from "express";


/*
 * TUTAR GİZLEME KALDIRILDI — 2026-08-24 (Hasan kararı revize edildi).
 *
 * 2026-08-21'de tasarımcı rolü için sipariş yanıtlarından parasal alanlar siliniyordu
 * (stripAmounts). Ama listeye paymentStatus da girdiğinden panel ödenmiş siparişi
 * "Ödeme Bekliyor" gösterdi, tutarlar ₺0/NaN oldu. Asıl kısıt "tasarımcı CİRO görmesin"
 * idi — sipariş bazında fiyat görmesinde sakınca yok. Ciro kısıtı stats tarafında
 * (stats.service summary includeFinance=false) DURUYor; burada tutar silme yok artık.
 */
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

  /**
   * Misafir sipariş — auth YOK ("misafir olarak devam et" checkout akışı; 14ef581 giriş duvarı
   * geri alındı, funnel'ın en büyük drop-off'uydu → reklam harcamasına karşı 0 satış). userId
   * olmadan service.create() zaten çalışır (inline adres snapshot; cari/puan devre dışı).
   *
   * HOSGELDIN (firstOrderOnly) istismarı SERVİSTE kapalı: userId yoksa kupon 400 döner
   * (orders.service create → firstOrderOnly && !userId). Yani API doğrudan çağrılsa, taze
   * e-postayla bile misafir ilk-sipariş kuponu geçiremez. Web checkout proxy'si token yoksa
   * buraya yönlendirir; token varsa authed POST /orders'a gider (sipariş hesaba bağlanır).
   */
  @Post("guest")
  async createGuest(@Body() dto: CreateOrderDto, @Headers("idempotency-key") idempotencyKey?: string) {
    const order = await this.service.create({ ...dto, idempotencyKey });
    return this.withNonce(order as { id: string });
  }

  // Public kargo takip — auth YOK (giriş yapmayan/farklı cihazdaki müşteri de sorgular).
  // Sipariş no + e-posta eşleşmesi; rate-limit main.ts'te (/orders/track). ":id" GET'inden
  // AYRI path olduğu için çakışmaz.
  @Post("track")
  trackPublic(@Body() dto: TrackOrderDto) {
    return this.service.trackPublic(dto.orderNumber, dto.email);
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
  @Perms(PERM.ORDERS_READ)
  @ApiBearerAuth()
  async listAll(@Query() query: ListOrdersQueryDto) {
    return this.service.listAll({
      status: query.status,
      take: query.take,
      skip: query.skip,
    });
  }

  @Get(":id")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  async detail(@Req() req: Request & { user: { sub: string; role: string } }, @Param("id") id: string) {
    return this.service.findById(id, req.user.role === "customer" ? req.user.sub : undefined);
  }

  @Patch(":id/status")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("admin", "super_admin")
  @Perms(PERM.ORDERS_STATUS)
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
