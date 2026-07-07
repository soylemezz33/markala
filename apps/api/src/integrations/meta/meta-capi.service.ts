import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { createHash } from "node:crypto";
import { PrismaService } from "../../prisma/prisma.service";

const GRAPH_VERSION = "v21.0";
const DEFAULT_PIXEL_ID = "1112404194692078";
const WEB_ORIGIN = "https://markala.com.tr";

/**
 * Meta (Facebook) Conversions API — sunucu-taraflı olay gönderimi.
 *
 * Neden sunucu-taraflı: tarayıcı Pixel'i adblock / iOS-ITP / sekme kapanması / JS hatası
 * yüzünden Purchase'ı kaçırabilir. iyzico ödeme callback'i sunucuya HER durumda gelir →
 * Purchase'ı buradan bildirmek dönüşüm kaybını kapatır (match quality + dayanıklılık).
 *
 * KVKK: order.marketingConsent=false ise HİÇBİR VERİ Meta'ya gönderilmez.
 * Dedup: event_id = orderNumber; tarayıcı Pixel'i de aynı event_id ile Purchase atar →
 *        Meta iki kaydı tekilleştirir (çift dönüşüm sayılmaz).
 * Fire-and-forget: tüm hatalar yutulur, ödeme/checkout akışını ASLA bloke etmez.
 */
@Injectable()
export class MetaCapiService {
  private readonly logger = new Logger(MetaCapiService.name);

  constructor(
    private prisma: PrismaService,
    private config: ConfigService,
  ) {}

  /** SHA-256 hex — Meta advanced matching, normalize edilmiş PII üzerinde. */
  private hash(value: string): string {
    return createHash("sha256").update(value).digest("hex");
  }

  /** Telefonu Meta formatına indirger: ülke kodu + numara, yalnız rakam (ör. 905321234567). */
  private normalizePhone(phone?: string | null): string | null {
    const d = (phone ?? "").replace(/\D/g, "");
    if (!d) return null;
    if (d.startsWith("90")) return d;
    if (d.startsWith("0")) return `90${d.slice(1)}`;
    if (d.length === 10) return `90${d}`;
    return d;
  }

  /**
   * Sipariş ödemesi İLK kez başarıyla işaretlendiğinde çağrılır
   * (payments.handleCallback → updateMany count>0, onay maili ile aynı guard).
   */
  async sendPurchase(orderId: string): Promise<void> {
    const token = this.config.get<string>("META_CAPI_TOKEN");
    if (!token) return; // CAPI yapılandırılmamış → sessiz no-op
    const pixelId = this.config.get<string>("META_PIXEL_ID") ?? DEFAULT_PIXEL_ID;

    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      select: {
        orderNumber: true,
        email: true,
        phone: true,
        total: true,
        marketingConsent: true,
        fbp: true,
        fbc: true,
      },
    });
    if (!order) return;
    if (!order.marketingConsent) {
      this.logger.log(`CAPI Purchase atlandı (pazarlama onayı yok) order=${orderId}`);
      return;
    }

    const userData: Record<string, unknown> = {};
    if (order.email) userData.em = [this.hash(order.email.trim().toLowerCase())];
    const phone = this.normalizePhone(order.phone);
    if (phone) userData.ph = [this.hash(phone)];
    if (order.fbp) userData.fbp = order.fbp;
    if (order.fbc) userData.fbc = order.fbc;

    const payload = {
      data: [
        {
          event_name: "Purchase",
          event_time: Math.floor(Date.now() / 1000),
          event_id: order.orderNumber, // tarayıcı Pixel Purchase'ı ile dedup anahtarı
          action_source: "website",
          event_source_url: `${WEB_ORIGIN}/odeme/basarili/${orderId}`,
          user_data: userData,
          custom_data: {
            currency: "TRY",
            value: Number(order.total),
          },
        },
      ],
    };

    const url = `https://graph.facebook.com/${GRAPH_VERSION}/${pixelId}/events?access_token=${encodeURIComponent(token)}`;
    try {
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const body = await res.text().catch(() => "");
        this.logger.warn(`CAPI Purchase HTTP ${res.status} order=${order.orderNumber}: ${body.slice(0, 300)}`);
      } else {
        this.logger.log(`CAPI Purchase gönderildi order=${order.orderNumber}`);
      }
    } catch (err) {
      this.logger.warn(`CAPI Purchase gönderilemedi order=${order.orderNumber}: ${(err as Error).message}`);
    }
  }
}
