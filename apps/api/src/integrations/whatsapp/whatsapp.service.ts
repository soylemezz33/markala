import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { PrismaService } from "../../prisma/prisma.service";
import {
  SABLON_ADI,
  SABLON_DILI,
  numarayiNormalize,
  yeniSiparisParametreleri,
} from "./yeni-siparis-mesaji";

/**
 * WHATSAPP BİLDİRİMİ (Meta Cloud API) — 2026-09-06, Hasan.
 *
 * Sipariş "gerçek" olduğunda (kart ödemesi başarılı / havale-cari sipariş oluştu) işletme
 * hattından yöneticinin WhatsApp'ına bildirim gider. Tetikleme noktaları BİLEREK yönetici
 * e-postasıyla (sendNewOrderAdminEmail) birebir aynı: o noktalar zaten "ilk işaretleme"
 * koşuluyla korunuyor, ayrı bir tetikleyici zamanla maille tutarsız davranırdı.
 *
 * ── TASARIM KARARLARI ─────────────────────────────────────────────────────────────────
 * - ASLA HATA FIRLATMAZ. Bildirim, siparişin kendisinden daha az önemlidir; WhatsApp
 *   kesintisi ödeme akışını ya da mail gönderimini bozmamalı (fire-and-forget çağrılır).
 * - Env eksikse sessizce devre dışı: geliştirme/staging ortamı gerçek mesaj göndermesin.
 * - Zaman aşımı var: Meta yanıt vermezse çağrı sonsuza kadar asılı kalmaz.
 * - Mükerrer koruması: aynı sipariş için ikinci bildirim gitmez (ödeme callback'i + reconcile
 *   taraması aynı siparişi yakalayabilir). Kaynak notification_logs, tıpkı e-postada olduğu gibi.
 * - Her gönderim notification_logs'a yazılır → panelde "gitti mi?" görünür, sessiz arıza olmaz.
 *
 * ── GEREKLİ ENV ───────────────────────────────────────────────────────────────────────
 *   WHATSAPP_TOKEN            Sistem kullanıcısı kalıcı tokeni
 *   WHATSAPP_PHONE_NUMBER_ID  Gönderen hattın id'si (0324 433 33 51 → 1284746154722193)
 *   WHATSAPP_ADMIN_TO         Bildirimin gideceği numara(lar), virgülle
 *   WHATSAPP_TEMPLATE         (ops.) şablon adı, varsayılan yeni_siparis_bildirimi
 */
const GRAPH_SURUMU = "v21.0";
const ZAMAN_ASIMI_MS = 10_000;
/** notification_logs.template — mükerrer kontrolü ve panel filtresi bu ada bakar. */
export const WA_SABLON_KAYDI = "whatsapp-new-order";

@Injectable()
export class WhatsappService {
  private readonly logger = new Logger(WhatsappService.name);

  constructor(
    private config: ConfigService,
    private prisma: PrismaService,
  ) {}

  /** Env tam mı? Eksikse entegrasyon kapalıdır (hata değil). */
  gonderebilir(): boolean {
    return Boolean(this.token() && this.phoneNumberId() && this.aliciNumaralari().length);
  }

  private token(): string {
    return (this.config.get<string>("WHATSAPP_TOKEN") ?? "").trim();
  }

  private phoneNumberId(): string {
    return (this.config.get<string>("WHATSAPP_PHONE_NUMBER_ID") ?? "").trim();
  }

  private aliciNumaralari(): string[] {
    return (this.config.get<string>("WHATSAPP_ADMIN_TO") ?? "")
      .split(",")
      .map((n) => numarayiNormalize(n))
      .filter((n): n is string => Boolean(n));
  }

  /**
   * Yeni sipariş bildirimi. Fire-and-forget çağrılmak üzere tasarlandı: her koşulda
   * çözümlenir, hiçbir koşulda fırlatmaz. Dönen değer yalnız test/log içindir.
   */
  async bildirYeniSiparis(orderId: string): Promise<boolean> {
    try {
      if (!this.gonderebilir()) return false;

      const order = await this.prisma.order.findUnique({
        where: { id: orderId },
        select: {
          orderNumber: true,
          total: true,
          paymentStatus: true,
          paymentMethod: true,
          email: true,
          shippingAddressSnapshot: true,
          user: { select: { fullName: true } },
          items: { select: { productName: true, quantity: true } },
        },
      });
      if (!order) {
        this.logger.warn(`whatsapp.yeniSiparis: sipariş bulunamadı order=${orderId}`);
        return false;
      }

      if (await this.dahaOnceBildirildiMi(order.orderNumber)) {
        this.logger.log(`whatsapp.yeniSiparis: zaten bildirilmiş → atlandı ${order.orderNumber}`);
        return false;
      }

      const musteriAdi =
        order.user?.fullName?.trim() ||
        (order.shippingAddressSnapshot as { fullName?: string } | null)?.fullName?.trim() ||
        null;

      const parametreler = yeniSiparisParametreleri({
        orderNumber: order.orderNumber,
        totalAmount: order.total,
        paymentStatus: order.paymentStatus,
        paymentMethod: order.paymentMethod,
        items: order.items,
        musteriAdi,
        email: order.email,
      });

      let hepsiGitti = true;
      for (const alici of this.aliciNumaralari()) {
        const sonuc = await this.sablonGonder(alici, parametreler);
        if (!sonuc.ok) hepsiGitti = false;
        await this.kaydet(alici, order.orderNumber, sonuc);
      }
      return hepsiGitti;
    } catch (e) {
      // Buraya düşmek beklenmez; yine de bildirim ASLA çağıranı bozmasın.
      this.logger.error(`whatsapp.yeniSiparis beklenmedik hata order=${orderId}: ${(e as Error)?.message}`);
      return false;
    }
  }

  /** Meta Cloud API'ye onaylı şablonu gönderir. Fırlatmaz; sonucu döndürür. */
  private async sablonGonder(
    alici: string,
    parametreler: string[],
  ): Promise<{ ok: boolean; messageId?: string; hata?: string }> {
    const sablon = (this.config.get<string>("WHATSAPP_TEMPLATE") ?? "").trim() || SABLON_ADI;
    const url = `https://graph.facebook.com/${GRAPH_SURUMU}/${this.phoneNumberId()}/messages`;
    const govde = {
      messaging_product: "whatsapp",
      to: alici,
      type: "template",
      template: {
        name: sablon,
        language: { code: SABLON_DILI },
        components: [
          { type: "body", parameters: parametreler.map((text) => ({ type: "text", text })) },
        ],
      },
    };

    try {
      const res = await fetch(url, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.token()}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(govde),
        signal: AbortSignal.timeout(ZAMAN_ASIMI_MS),
      });
      const veri = (await res.json().catch(() => ({}))) as {
        messages?: { id: string }[];
        error?: { message?: string; code?: number };
      };
      if (!res.ok || veri.error) {
        // Meta hata mesajı log'a olduğu gibi yazılır: "#132001 template not found" gibi
        // kodlar teşhisin tamamıdır, özetlenirse iz kaybolur.
        const hata = `${veri.error?.code ?? res.status}: ${veri.error?.message ?? "bilinmeyen hata"}`;
        this.logger.warn(`whatsapp gönderilemedi to=${alici}: ${hata}`);
        return { ok: false, hata };
      }
      return { ok: true, messageId: veri.messages?.[0]?.id };
    } catch (e) {
      const hata = (e as Error)?.message ?? "ağ hatası";
      this.logger.warn(`whatsapp gönderilemedi to=${alici}: ${hata}`);
      return { ok: false, hata };
    }
  }

  /**
   * Aynı sipariş için bildirim zaten gitti mi? (Hasan: "gönderildiyse bir daha göndermeyelim")
   * Yalnız BAŞARILI gönderimler engeller — başarısız bildirim yeniden denenebilmeli.
   * Sorgu düşerse false: sessizce bildirimi yutmaktansa ikinci mesaj yeğdir.
   */
  private async dahaOnceBildirildiMi(orderNumber: string): Promise<boolean> {
    try {
      const adet = await this.prisma.notificationLog.count({
        where: {
          template: WA_SABLON_KAYDI,
          status: "sent",
          metadata: { path: ["orderNumber"], equals: orderNumber },
        },
      });
      return adet > 0;
    } catch (e) {
      this.logger.warn(`whatsapp mükerrer kontrolü yapılamadı (${orderNumber}): ${(e as Error).message}`);
      return false;
    }
  }

  private async kaydet(
    alici: string,
    orderNumber: string,
    sonuc: { ok: boolean; messageId?: string; hata?: string },
  ): Promise<void> {
    await this.prisma.notificationLog
      .create({
        data: {
          channel: "whatsapp",
          template: WA_SABLON_KAYDI,
          recipient: alici,
          subject: `Yeni sipariş - ${orderNumber}`,
          body: "",
          status: sonuc.ok ? "sent" : "failed",
          metadata: {
            template: WA_SABLON_KAYDI,
            orderNumber,
            ...(sonuc.messageId ? { messageId: sonuc.messageId } : {}),
            ...(sonuc.hata ? { error: sonuc.hata } : {}),
          },
        },
      })
      .catch((e) => this.logger.error(`whatsapp notificationLog yazılamadı: ${(e as Error).message}`));
  }
}
