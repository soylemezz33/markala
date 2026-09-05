import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";

/**
 * DHL Türkiye yurt içi kargo entegrasyonu — STUB.
 *
 * FAZ 4'te:
 * - DHL Express XML/REST API (developer.dhl.com)
 * - Müşteri kurumsal hesabı + API key gerekli
 * - Endpoint base: https://api-eu.dhl.com/track/shipments?trackingNumber={no}
 *
 * Tipik akış:
 * 1. Sipariş paketlenince createShipment() → trackingNumber + label PDF
 * 2. Müşteriye trackingNumber mail+SMS ile bildirilir
 * 3. trackShipment() ile statü poll edilir (her 4 saatte bir)
 * 4. Webhook varsa DHL push gönderir (önerilen)
 */

export type DhlServiceTier = "DOMESTIC_EXPRESS" | "STANDARD";

export interface DhlShipmentInput {
  orderId: string;
  recipientName: string;
  recipientPhone: string;
  recipientEmail?: string;
  recipientCity: string;
  recipientDistrict: string;
  recipientAddress: string;
  recipientZipCode?: string;
  weightKg: number;
  dimensions?: { lengthCm: number; widthCm: number; heightCm: number };
  service?: DhlServiceTier;
  /** İçerik açıklaması (gümrük + sigorta için) */
  description?: string;
  /** Ürün değeri (sigorta için) */
  declaredValue?: number;
}

export interface DhlShipmentResult {
  trackingNumber: string;
  labelUrl: string;
  estimatedDelivery: string; // ISO date
  cost: number;
}

export interface DhlTrackingEvent {
  timestamp: string;
  statusCode: string;
  description: string;
  location?: string;
}

export interface DhlTrackingResult {
  trackingNumber: string;
  status: "pre-transit" | "in-transit" | "delivered" | "failure" | "unknown";
  statusDescription?: string;
  estimatedDelivery?: string;
  events: DhlTrackingEvent[];
}

/** DHL Unified Tracking API yanıtının kullandığımız kısmı (api-eu.dhl.com/track/shipments). */
interface UnifiedApiShipment {
  id?: string;
  status?: {
    timestamp?: string;
    statusCode?: string;
    status?: string;
    description?: string;
    location?: { address?: { addressLocality?: string } };
  };
  estimatedTimeOfDelivery?: string;
  events?: Array<{
    timestamp?: string;
    statusCode?: string;
    status?: string;
    description?: string;
    location?: { address?: { addressLocality?: string } };
  }>;
}

@Injectable()
export class DhlService {
  private readonly logger = new Logger(DhlService.name);
  private readonly apiKey: string | undefined;
  private readonly accountNumber: string | undefined;

  constructor(private config: ConfigService) {
    this.apiKey = this.config.get<string>("DHL_API_KEY");
    this.accountNumber = this.config.get<string>("DHL_ACCOUNT_NUMBER");
  }

  private isLive(): boolean {
    return Boolean(this.apiKey && this.accountNumber);
  }

  /**
   * TAKİP sorgusu yapılabilir mi? Yalnız API anahtarı yeter — gönderi OLUŞTURMA (isLive)
   * ayrıca hesap numarası ister. İkisi karıştırılırsa anahtar tanımlıyken takip taraması
   * sessizce atlanırdı (2026-09-05, kargo teslim taraması).
   */
  takipYapilabilir(): boolean {
    return Boolean(this.apiKey);
  }

  /** Yeni gönderi oluştur, tracking no + label döner */
  async createShipment(input: DhlShipmentInput): Promise<DhlShipmentResult> {
    if (this.isLive()) {
      // TODO: gerçek DHL API çağrısı
      // const res = await fetch("https://api-eu.dhl.com/...", { ... });
      this.logger.warn(`[DHL LIVE-NOT-IMPLEMENTED] Order ${input.orderId}`);
    } else {
      this.logger.warn(`[DHL STUB] Shipment for order ${input.orderId}`);
    }

    // Mock cevap
    const trackingNumber = `DHL${Date.now().toString().slice(-12)}`;
    const days = input.service === "DOMESTIC_EXPRESS" ? 1 : 3;
    return {
      trackingNumber,
      labelUrl: `https://stub.markala.com.tr/labels/${input.orderId}.pdf`,
      estimatedDelivery: new Date(Date.now() + days * 86400000).toISOString(),
      cost: this.calculateMockFee(input.weightKg, input.service ?? "STANDARD"),
    };
  }

  // ── Takip önbelleği (2026-08-29) ────────────────────────────────────────────
  // Amaç ikili: (1) günlük 250 çağrılık DHL kotasını korumak, (2) public ucumuz
  // üzerinden DHL'e istek seli gitmesini engellemek. Bulunan gönderi 10 dk,
  // bulunamayan 2 dk tutulur (bulunamayan kısa: numara henüz DHL'e işlenmemiş
  // olabilir — 24-48 saat gecikme normal — müşteri az sonra tekrar dener).
  private takipCache = new Map<string, { expiresAt: number; data: DhlTrackingResult | null }>();
  private static readonly CACHE_HIT_MS = 10 * 60_000;
  private static readonly CACHE_MISS_MS = 2 * 60_000;

  /**
   * Kargo durumunu DHL Unified Tracking API'sinden sorgular (GERÇEK — 2026-08-29).
   *
   * service=ecommerce-tr: DHL eCommerce Türkiye 21 Temmuz 2026'da Unified API
   * kapsamına girdi; yurt içi gönderilerimiz bu servisten sorgulanır.
   *
   * Dönüşler:
   *  - DhlTrackingResult → gönderi bulundu
   *  - null              → DHL "bulunamadı" dedi (404)
   *  - throw             → anahtar yok / DHL erişilemez / kota aşıldı; çağıran
   *                        katman müşteriyi DHL'in kendi sayfasına yönlendirir.
   *
   * UYDURMA VERİ YOK: eski stub anahtar yokken sahte olay listesi döndürüyordu.
   * Public uca bağlandığı için bu kabul edilemez — veri yoksa yok denir.
   */
  async trackShipment(trackingNumber: string): Promise<DhlTrackingResult | null> {
    if (!this.apiKey) {
      throw new Error("DHL_API_KEY tanımlı değil, takip sorgusu yapılamaz");
    }

    const no = trackingNumber.trim();
    const cached = this.takipCache.get(no);
    if (cached && cached.expiresAt > Date.now()) return cached.data;

    const url =
      `https://api-eu.dhl.com/track/shipments?trackingNumber=${encodeURIComponent(no)}` +
      `&service=ecommerce-tr&language=tr`;
    const res = await fetch(url, {
      headers: { "DHL-API-Key": this.apiKey, Accept: "application/json" },
      signal: AbortSignal.timeout(8000),
    });

    if (res.status === 404) {
      this.takipCache.set(no, { expiresAt: Date.now() + DhlService.CACHE_MISS_MS, data: null });
      return null;
    }
    if (!res.ok) {
      // 401 anahtar sorunu, 429 kota — ikisi de "hizmet şu an yok" olarak yukarı çıkar.
      this.logger.warn(`DHL takip sorgusu başarısız: HTTP ${res.status} (no=${no})`);
      throw new Error(`DHL takip servisi yanıt vermedi (HTTP ${res.status})`);
    }

    const body = (await res.json()) as { shipments?: UnifiedApiShipment[] };
    const s = body.shipments?.[0];
    if (!s) {
      this.takipCache.set(no, { expiresAt: Date.now() + DhlService.CACHE_MISS_MS, data: null });
      return null;
    }

    const result = this.mapUnifiedShipment(no, s);
    this.takipCache.set(no, { expiresAt: Date.now() + DhlService.CACHE_HIT_MS, data: result });
    // Önbellek sınırsız büyümesin (rastgele numara taraması senaryosu).
    if (this.takipCache.size > 5000) {
      const now = Date.now();
      for (const [k, v] of this.takipCache) if (v.expiresAt <= now) this.takipCache.delete(k);
    }
    return result;
  }

  /**
   * Unified API gönderisini bizim sade şekle indirger. KİŞİSEL VERİ TAŞINMAZ:
   * alıcı/teslim alan adı gibi alanlar bilinçli olarak dışarıda bırakılır —
   * public uçtan yalnız durum + tarih + şehir çıkar (Hasan onayı 2026-08-29).
   */
  private mapUnifiedShipment(no: string, s: UnifiedApiShipment): DhlTrackingResult {
    const durum = (code?: string): DhlTrackingResult["status"] => {
      switch ((code ?? "").toLowerCase()) {
        case "pre-transit": return "pre-transit";
        case "transit": return "in-transit";
        case "delivered": return "delivered";
        case "failure": return "failure";
        default: return "unknown";
      }
    };
    const olay = (e: NonNullable<UnifiedApiShipment["events"]>[number]): DhlTrackingEvent => ({
      timestamp: e.timestamp ?? "",
      statusCode: e.statusCode ?? "unknown",
      description: e.description ?? e.status ?? "",
      location: e.location?.address?.addressLocality || undefined,
    });
    return {
      trackingNumber: no,
      status: durum(s.status?.statusCode),
      statusDescription: s.status?.description ?? s.status?.status ?? undefined,
      estimatedDelivery: s.estimatedTimeOfDelivery ?? undefined,
      events: (s.events ?? []).map(olay).filter((e) => e.timestamp && e.description),
    };
  }

  /** Kargo ücreti hesapla (sepet/checkout için ön gösterim) */
  async calculateShippingFee(input: {
    fromCity: string;
    toCity: string;
    weightKg: number;
    service?: DhlServiceTier;
  }): Promise<{ fee: number; estimatedDays: string; service: string }> {
    if (this.isLive()) {
      // TODO: DHL rates API
    }
    const fee = this.calculateMockFee(input.weightKg, input.service ?? "STANDARD");
    return {
      fee,
      estimatedDays: input.service === "DOMESTIC_EXPRESS" ? "1 iş günü" : "1-3 iş günü",
      service: input.service === "DOMESTIC_EXPRESS" ? "DHL Express" : "DHL Standard",
    };
  }

  /** Webhook handler — DHL push notification */
  async handleStatusUpdate(payload: { trackingNumber: string; statusCode: string; timestamp: string }): Promise<void> {
    this.logger.log(`[DHL Webhook] ${payload.trackingNumber} → ${payload.statusCode}`);
    // TODO: Order.status güncelle, müşteriye mail+SMS bildir
  }

  private calculateMockFee(weightKg: number, service: DhlServiceTier): number {
    // Basit mock fiyatlama — gerçek API tarifesi yerine geçer
    const baseFee = service === "DOMESTIC_EXPRESS" ? 120 : 79;
    const perKg = service === "DOMESTIC_EXPRESS" ? 18 : 12;
    return Math.round(baseFee + Math.max(0, weightKg - 1) * perKg);
  }
}
