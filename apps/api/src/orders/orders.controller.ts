import { Controller, Get, Post, Patch, Body, Param, UseGuards, Req, Query, Headers, ForbiddenException } from "@nestjs/common";
import { ApiTags, ApiBearerAuth } from "@nestjs/swagger";
import { ConfigService } from "@nestjs/config";
import { OrdersService } from "./orders.service";
import { JwtAuthGuard } from "../auth/jwt.guard";
import { RolesGuard, Roles } from "../auth/roles.guard";
import { Perms, PERM, roleHasPerm } from "../auth/permissions";
import {
  CreateOrderDto,
  ListOrdersQueryDto,
  UpdateOrderStatusDto,
  UpdateOrderTrackingDto,
  MailOnizlemeDto,
  TrackOrderDto,
} from "./orders.dto";
import { paymentNonce } from "../payments/payment-nonce";
import type { Request } from "express";


/*
 * TUTAR GİZLEME — 2026-09-01'de İZİN TABANLI olarak geri geldi (kargo rolü için).
 *
 * GEÇMİŞ: 2026-08-21'de tasarımcı için parasal alanlar siliniyordu (stripAmounts).
 * Silme listesine paymentStatus da girdiğinden panel ödenmiş siparişi "Ödeme Bekliyor"
 * gösterdi, tutarlar ₺0/NaN oldu → 2026-08-24'te tamamen kaldırıldı.
 *
 * BU SEFER FARKI: filtre ROL ADINA değil PERM.ORDERS_AMOUNTS iznine bakıyor ve izni
 * OLMAYAN role alanları hiç göndermiyor (0/NaN üretmemesi için silinir, sıfırlanmaz).
 * Tasarımcı ve muhasebe bu izni ALDI → davranışları değişmedi, Ağustos'taki regresyon
 * tekrarlanmaz. Yalnız yeni "kargo" rolü kısıtlı.
 *
 * NEDEN SUNUCUDA: admin panelinde gizlemek yetmez — veri Next RSC payload'ında durur,
 * devtools açan kullanıcı görür. Güvenlik sınırı burasıdır (bkz. permissions.ts:40).
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
  async listAll(
    @Query() query: ListOrdersQueryDto,
    @Req() req: Request & { user?: { role?: string } },
  ) {
    return this.service.listAll({
      status: query.status,
      take: query.take,
      skip: query.skip,
      role: req.user?.role,
    });
  }

  /**
   * Sipariş detayı — HEM müşteri (kendi siparişi) HEM panel kullanır.
   *
   * 2026-09-01: uçta @Roles/@Perms YOKTU, yani RolesGuard bile konsa etkisizdi
   * (guard @Roles boşsa herkesi geçirir). Sonuç: rolü "customer" olmayan HER panel
   * kimliği — hiç izni olmasa bile — sahiplik kontrolü olmadan her siparişin tam
   * detayını okuyabiliyordu (items[].costTotal, yani TEDARİKÇİ MALİYETİ dahil).
   * "customer" listede çünkü müşteri kendi siparişini görmeye devam etmeli; sahiplik
   * kontrolü aşağıdaki userId parametresiyle zaten yapılıyor.
   */
  @Get(":id")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("customer", "admin", "super_admin")
  @Perms(PERM.ORDERS_READ)
  @ApiBearerAuth()
  async detail(@Req() req: Request & { user: { sub: string; role: string } }, @Param("id") id: string) {
    return this.service.findById(
      id,
      req.user.role === "customer" ? req.user.sub : undefined,
      req.user.role,
    );
  }

  /**
   * Durum değiştirme. Guard'da EN DAR izin (ORDERS_TRACKING) aranır çünkü @Perms "hepsi"
   * mantığıyla çalışır, "ya o ya bu" diyemiyoruz — geniş yetkili roller (admin, tasarımcı)
   * bu izne zaten sahip. Asıl ayrım gövdede: ORDERS_STATUS'u OLMAYAN rol (kargo) yalnız
   * "kargoya-verildi"ye çekebilir; iptal, geri adım ve diğer geçişler kapalı.
   */
  /**
   * Havale/EFT ödemesini onayla — para hesaba geçtiğinde admin işaretler.
   * ORDERS_STATUS izni şart: tutar/ödeme kararı kargo rolünün işi değil.
   */
  @Patch(":id/odeme-onayla")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("admin", "super_admin")
  @Perms(PERM.ORDERS_STATUS)
  @ApiBearerAuth()
  odemeOnayla(
    @Param("id") id: string,
    @Req() req: Request & { user?: { sub?: string; role?: string } },
  ) {
    return this.service.odemeOnayla(id, {
      actorId: req.user?.sub ?? null,
      ipAddress: req.ip ?? null,
      role: req.user?.role,
    });
  }

  @Patch(":id/status")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("admin", "super_admin")
  @Perms(PERM.ORDERS_TRACKING)
  @ApiBearerAuth()
  updateStatus(
    @Param("id") id: string,
    @Body() dto: UpdateOrderStatusDto,
    @Req() req: Request & { user?: { sub?: string; role?: string } },
  ) {
    if (!roleHasPerm(req.user?.role, PERM.ORDERS_STATUS) && dto.status !== "kargoya-verildi") {
      throw new ForbiddenException(
        "Bu rol siparişi yalnızca 'Kargoya Verildi' olarak işaretleyebilir.",
      );
    }
    return this.service.updateStatus(
      id,
      dto.status,
      { trackingNumber: dto.trackingNumber, trackingCarrier: dto.trackingCarrier },
      { actorId: req.user?.sub ?? null, ipAddress: req.ip ?? null, role: req.user?.role },
    );
  }

  /**
   * Takip no / kargo firmasını günceller — DURUM DEĞİŞTİRMEZ, MÜŞTERİYE MAİL GİTMEZ.
   * Kargoya verilmiş ama takip numarası girilmemiş siparişleri sonradan tamamlamak
   * ve yanlış girilen numarayı düzeltmek için (bkz. UpdateOrderTrackingDto).
   */
  /**
   * Mail önizleme (admin) — gerçek sipariş verisiyle işlemsel maili İSTENEN adrese gönderir;
   * müşteriye HİÇBİR ŞEY gitmez, sipariş durumu değişmez. Şablon testleri için (2026-08-29).
   */
  @Post(":id/mail-onizleme")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("admin", "super_admin")
  @Perms(PERM.ORDERS_STATUS)
  @ApiBearerAuth()
  async mailOnizleme(@Param("id") id: string, @Body() dto: MailOnizlemeDto) {
    const ok =
      dto.sablon === "siparis-alindi"
        ? await this.service.mailOnizlemeSiparisAlindi(id, dto.alici)
        : await this.service.mailOnizlemeKargoyaVerildi(id, dto.alici, {
            number: dto.takipNo,
            carrier: dto.kargoFirma,
          });
    return { gonderildi: ok, alici: dto.alici, sablon: dto.sablon };
  }

  @Patch(":id/tracking")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("admin", "super_admin")
  // ORDERS_STATUS'tan ORDERS_TRACKING'e indirildi: kargo rolü takip no yazabilsin ama
  // sipariş iptali / durum makinesi / mail-önizleme uçlarını KAZANMASIN.
  @Perms(PERM.ORDERS_TRACKING)
  @ApiBearerAuth()
  updateTracking(
    @Param("id") id: string,
    @Body() dto: UpdateOrderTrackingDto,
    @Req() req: Request & { user?: { sub?: string; role?: string } },
  ) {
    return this.service.updateTracking(
      id,
      { trackingNumber: dto.trackingNumber, trackingCarrier: dto.trackingCarrier },
      { actorId: req.user?.sub ?? null, ipAddress: req.ip ?? null, role: req.user?.role },
    );
  }
}
