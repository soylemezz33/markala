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


/**
 * TUTAR GİZLEME — 2026-08-21 (Hasan kararı: grafik tasarımcı tutarları görmesin).
 *
 * Menüyü/sütunu gizlemek YETMEZ; uç hâlâ tutarı döndürür ve ağ sekmesinden görülür.
 * Bu yüzden parasal alanlar YANITTAN SİLİNİR. Tasarımcının işi için gereken
 * ürün/adet/konfigürasyon/dosya ve müşteri iletişimi aynen kalır.
 */
const MONEY_FIELDS = ["total", "subtotal", "vat", "shippingFee", "discount", "unitPrice", "lineTotal", "paymentStatus", "paymentMethod"];
function stripAmounts<T>(data: T, role: string | undefined): T {
  if (role !== "tasarimci") return data;
  /**
   * SADECE DÜZ NESNE/DİZİ içinde gezilir.
   * 2026-08-21 hata: ilk sürüm `typeof v === "object"` diyip Date'leri de yeniden
   * kuruyordu; Date'in kendi enumerable alanı olmadığı için tarih {} oluyor ve panelde
   * "Invalid Date" görünüyordu (Hasan bildirdi). Prisma Decimal gibi sınıf örnekleri de
   * aynı şekilde bozulurdu. Bu yüzden yalnız prototipi Object.prototype olan nesnelere
   * inilir; diğer her şey OLDUĞU GİBİ bırakılır.
   */
  const isPlain = (v: unknown): v is Record<string, unknown> => {
    if (v === null || typeof v !== "object" || Array.isArray(v)) return false;
    const proto = Object.getPrototypeOf(v);
    return proto === Object.prototype || proto === null;
  };
  const walk = (v: unknown): unknown => {
    if (Array.isArray(v)) return v.map(walk);
    if (isPlain(v)) {
      const out: Record<string, unknown> = {};
      for (const [k, val] of Object.entries(v)) {
        if (MONEY_FIELDS.includes(k)) continue;
        out[k] = walk(val);
      }
      return out;
    }
    return v;
  };
  return walk(data) as T;
}

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
  async listAll(@Query() query: ListOrdersQueryDto, @Req() req: Request & { user: { role: string } }) {
    const rows = await this.service.listAll({
      status: query.status,
      take: query.take,
      skip: query.skip,
    });
    return stripAmounts(rows, req.user?.role);
  }

  @Get(":id")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  async detail(@Req() req: Request & { user: { sub: string; role: string } }, @Param("id") id: string) {
    const order = await this.service.findById(id, req.user.role === "customer" ? req.user.sub : undefined);
    return stripAmounts(order, req.user?.role);
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
