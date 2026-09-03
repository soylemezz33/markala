import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  Req,
  Query,
  Headers,
  ForbiddenException,
  BadRequestException,
} from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import { ApiTags, ApiBearerAuth, ApiConsumes } from "@nestjs/swagger";
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
  UploadItemDesignDto,
  CreateOrderNoteDto,
} from "./orders.dto";
import { paymentNonce } from "../payments/payment-nonce";
import { OrderDesignService } from "./order-design.service";
import { OrderDriveService } from "../storage/order-drive.service";
import { OrderNoteService } from "./order-note.service";
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
  constructor(
    private service: OrdersService,
    private config: ConfigService,
    // Satıra tasarım dosyası ekleme/silme (2026-09-02) — OrdersService'e enjekte edilmedi,
    // bkz. order-design.service.ts başlığı (36 spec çağrısı ctor'u elle kuruyor).
    private design: OrderDesignService,
    // Havale onayında Drive sipariş klasörü (2026-09-03) — servise değil buraya enjekte, aynı sebep.
    private orderDrive: OrderDriveService,
    // İç not defteri — aynı gerekçeyle ayrı servis (bkz. order-note.service.ts başlığı).
    private notes: OrderNoteService,
  ) {}

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
  async odemeOnayla(
    @Param("id") id: string,
    @Req() req: Request & { user?: { sub?: string; role?: string } },
  ) {
    const sonuc = await this.service.odemeOnayla(id, {
      actorId: req.user?.sub ?? null,
      ipAddress: req.ip ?? null,
      role: req.user?.role,
    });
    // Para geldi → Drive sipariş klasörü (Hasan, 2026-09-03). Servis ödeme durumunu DB'den
    // yeniden okur; yanıtı bekletmez, hata verirse yalnız log.
    void this.orderDrive.klasorAc(id);
    return sonuc;
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

  /**
   * Sipariş İÇ NOTLARI (2026-09-03) — panel personeli arası not defteri.
   * Müşteriye AÇILAN hiçbir uçta dönmez; yalnız panel guard'ının arkasındadır.
   * Yetki ORDERS_NOTES: tüm panel rolleri (kargo/muhasebe dahil) yazabilir.
   */
  @Get(":id/notlar")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("admin", "super_admin")
  @Perms(PERM.ORDERS_NOTES)
  @ApiBearerAuth()
  listNotes(@Param("id") id: string) {
    return this.notes.list(id);
  }

  @Post(":id/notlar")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("admin", "super_admin")
  @Perms(PERM.ORDERS_NOTES)
  @ApiBearerAuth()
  addNote(
    @Param("id") id: string,
    @Body() dto: CreateOrderNoteDto,
    @Req() req: Request & { user?: { sub?: string; role?: string; email?: string } },
  ) {
    return this.notes.add(id, dto.body, {
      id: req.user?.sub,
      email: req.user?.email,
      role: req.user?.role,
    });
  }

  @Delete(":id/notlar/:noteId")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("admin", "super_admin")
  @Perms(PERM.ORDERS_NOTES)
  @ApiBearerAuth()
  removeNote(
    @Param("id") id: string,
    @Param("noteId") noteId: string,
    @Req() req: Request & { user?: { sub?: string; role?: string } },
  ) {
    return this.notes.remove(id, noteId, { id: req.user?.sub, role: req.user?.role });
  }

  /**
   * Sipariş SATIRINA tasarımcı dosyası yükle (2026-09-02, üretim ARGE Faz 2).
   *
   * multipart: `file` (multer) + `kind` (onizleme|calisma|baski, DTO doğrular). Yetki
   * ORDERS_DESIGN: tasarımcı + admin; kargo/muhasebe 403 (yalnız görür/indirir).
   * multer 52 MB hard limit = putDesign'daki 50 MB iş kuralının üstünde son emniyet
   * (design-uploads.controller.ts ile aynı). Kural/sahiplik kontrolü serviste, diske
   * yazmadan ÖNCE yapılır.
   */
  @Post(":id/items/:itemId/tasarim")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("admin", "super_admin")
  @Perms(PERM.ORDERS_DESIGN)
  @ApiBearerAuth()
  @ApiConsumes("multipart/form-data")
  @UseInterceptors(FileInterceptor("file", { limits: { fileSize: 52 * 1024 * 1024 } }))
  uploadItemDesign(
    @Param("id") id: string,
    @Param("itemId") itemId: string,
    @Body() dto: UploadItemDesignDto,
    @Req() req: Request & { user?: { sub?: string } },
    @UploadedFile() file?: Express.Multer.File,
  ) {
    if (!file) throw new BadRequestException("Dosya bulunamadı.");
    return this.design.add(id, itemId, dto.kind, file, {
      actorId: req.user?.sub ?? null,
      ipAddress: req.ip ?? null,
    });
  }

  /** Satırdaki tasarımcı dosyasını sil — kayıt + disk; denetim kaydına yazılır. */
  @Delete(":id/tasarim/:uploadId")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("admin", "super_admin")
  @Perms(PERM.ORDERS_DESIGN)
  @ApiBearerAuth()
  deleteItemDesign(
    @Param("id") id: string,
    @Param("uploadId") uploadId: string,
    @Req() req: Request & { user?: { sub?: string } },
  ) {
    return this.design.remove(id, uploadId, {
      actorId: req.user?.sub ?? null,
      ipAddress: req.ip ?? null,
    });
  }
}
