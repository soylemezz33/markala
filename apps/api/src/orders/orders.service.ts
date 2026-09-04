import { Injectable, Logger, NotFoundException, ForbiddenException, BadRequestException, ConflictException } from "@nestjs/common";
import { Prisma, OrderStatus } from "@prisma/client";
import { createHash } from "crypto";
import { PrismaService } from "../prisma/prisma.service";
import { ParasutService } from "../integrations/parasut/parasut.service";
import { MetaCapiService } from "../integrations/meta/meta-capi.service";
import { SettingsService } from "../settings/settings.service";
import { MailService } from "../mail/mail.service";
import { LoyaltyService } from "../loyalty/loyalty.service";
import { computeConfiguredPrice, computeAreaLine, DEFAULT_PRICING, extractSelections, pickConfigurationSummary, normalizeSelections } from "./pricing";
import { computeItemCostTotal } from "./costing";
import { iptalMailiGonderilirMi } from "./iptal-mail-kurali";
import { PERM, roleHasPerm } from "../auth/permissions";
import { ODEME_YONTEMI, HAVALE_INDIRIM_YUZDE } from "../common/banka";
import { DESIGN_ROW_SELECT, designRowToPublic } from "./order-design.service";
import { driveFileUrl } from "../storage/drive.service";
import { musteriDosyaSatirlari, ilkDosya } from "./musteri-dosyalari";

/**
 * PARASAL ALAN TEMİZLİĞİ — 2026-09-01, kargo rolü için.
 *
 * ORDERS_AMOUNTS izni olmayan panel rolünde tutar/maliyet/ödeme alanları yanıttan
 * SİLİNİR (0'a çekilmez!). Ağustos 2026'daki stripAmounts denemesi alanları sıfırladığı
 * için panel "₺0 / Ödeme Bekliyor" gösterdi ve geri alındı; alan hiç yoksa panel bloğu
 * render etmez, yanlış bilgi üretmez.
 *
 * costTotal ÖZELLİKLE kritik: sipariş anındaki TEDARİKÇİ MALİYETİ snapshot'ı. lineTotal
 * ile yan yana görülürse kâr marjı doğrudan hesaplanır.
 *
 * "customer" MUAF: müşteri kendi siparişinin tutarlarını görmek zorunda.
 * Rol verilmezse FAIL-CLOSED (siler) — bugün tek çağıran OrdersController ve rolü hep
 * geçiriyor; ileride iç çağıran eklenirse tutar eksikliği hemen fark edilsin diye böyle.
 */
const PARASAL_ORDER_ALANLARI = [
  "subtotal", "shippingFee", "discount", "vat", "total",
  "paymentStatus", "paymentMethod",
  "iyzicoPaymentId", "iyzicoConversationId", "iyzicoCheckoutToken",
  "parasutInvoiceId", "recoveryMailStage",
  "paymentErrorCode", "paymentErrorMessage",
] as const;
const PARASAL_ITEM_ALANLARI = ["unitPrice", "lineTotal", "costTotal"] as const;

function parasalAlanlariAyikla<T extends object>(order: T, role?: string): T {
  if (role === "customer" || roleHasPerm(role, PERM.ORDERS_AMOUNTS)) return order;
  const temiz = { ...(order as Record<string, unknown>) };
  for (const alan of PARASAL_ORDER_ALANLARI) delete temiz[alan];
  if (Array.isArray(temiz.items)) {
    temiz.items = (temiz.items as Array<Record<string, unknown>>).map((kalem) => {
      const k = { ...kalem };
      for (const alan of PARASAL_ITEM_ALANLARI) delete k[alan];
      return k;
    });
  }
  return temiz as T;
}

function generateOrderNumber(): string {
  const ts = Date.now().toString(36).toUpperCase();
  const rand = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `MK-${ts}-${rand}`;
}

/** KDV oranı — Markala matbaa ürünleri için %20 (basePrice KDV DAHİL kabul ediliyor). */
const VAT_RATE = 0.2;
/** KDV dahil fiyatları ondalık çarpana çevirmek için (1.20). */
const VAT_DIVISOR = 1 + VAT_RATE;
/** Konfigürasyonda gelen serbest "miktar" alanları kötüye kullanılmasın diye üst sınır. */
const MAX_QUANTITY_PER_ITEM = 100_000;
// İş-mantığı üst tavanı. DB numeric alanları (subtotal 12,4 / line_total 10,2) 10^8'de taşıyor →
// eskiden büyük adet + birim fiyat 'numeric field overflow' 500'e düşüyordu (müşteri genel hata).
// Bu tavan altında tutar; aşan sipariş için 400 + eyleme dönük mesaj (bize ulaşın) döner.
const MAX_ORDER_TOTAL = 5_000_000;

type ConfigurationInput = unknown;

/** İki ondalık yuvarlama (kuruş hassasiyeti). */
function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

/**
 * Sipariş statüsü geçiş matrisi — admin (veya sistem) bir siparişi
 * yalnızca aşağıdaki izinli komşu durumlara taşıyabilir.
 * Örn. teslim_edildi → siparis_alindi YASAK.
 */
/**
 * Sürecin ileri yönü. Sıra hem "ileri mi geri mi gidiyoruz" sorusunu yanıtlar
 * (bkz. isGeriAdim) hem de geçiş matrisini üretir.
 */
export const STATUS_ORDER = [
  "siparis-alindi",
  "tasarim-bekleniyor",
  "tasarim-onayindi",
  "tasarim-onaylandi", // 2026-09-03: onay geldi, üretime alınabilir (kargo@'ya bildirim)
  "uretimde",
  "kargoya-verildi",
  "teslim-edildi",
] as const;

// 2026-08-28 (Hasan): geri dönüş ARTIK SERBEST. Önceden yalnız ileri gidilebiliyordu;
// yanlışlıkla "Tasarım Onayında"ya alınan sipariş geri alınamıyor, panel kilitleniyordu.
// Yanlış tıklamayı engellemek adına doğru olanı düzeltmeyi imkânsız kılmak kötü bir takas —
// koruma artık admin panelindeki onay adımında (müşteriye mail gidecek mi, orada yazıyor).
//
// İPTAL hâlâ terminal: iade ve sadakat puanı geri alınmış olur, siparişi yeniden açmak
// ayrı bir iştir (para hareketi) ve sessizce yapılmamalı.
export const validStatusTransitions: Record<string, string[]> = {
  ...Object.fromEntries(
    STATUS_ORDER.map((s) => [s, [...STATUS_ORDER.filter((o) => o !== s), "iptal-edildi"]]),
  ),
  "iptal-edildi": [],
};

/** Hedef durum, mevcut durumdan ÖNCEyse bu bir düzeltmedir (geri adım). */
export function isGeriAdim(current: string, next: string): boolean {
  const a = STATUS_ORDER.indexOf(current as (typeof STATUS_ORDER)[number]);
  const b = STATUS_ORDER.indexOf(next as (typeof STATUS_ORDER)[number]);
  return a >= 0 && b >= 0 && b < a;
}

/**
 * URL slug (hyphen: "kargoya-verildi") → Prisma OrderStatus enum üyesi (underscore: "kargoya_verildi").
 *
 * Şema'da enum değerleri @map ile hyphen'li DB değerine maplenmiş; ANCAK Prisma Client API'si
 * DAİMA underscore üye adını bekler (Object.values(OrderStatus) hepsi underscore). Hyphenli slug'ı
 * doğrudan `status: ... as any` ile geçmek Prisma'da "Expected OrderStatus" validation hatası → 500
 * üretiyordu (admin sipariş durumu güncellemesi ve status filtreli liste tamamen kırıktı).
 * Bilinmeyen/eksik slug → null.
 */
export function slugToOrderStatus(slug: string | undefined | null): OrderStatus | null {
  if (!slug) return null;
  const member = slug.replace(/-/g, "_");
  return (Object.values(OrderStatus) as string[]).includes(member) ? (member as OrderStatus) : null;
}

/**
 * Konfigürasyon JSON'undan opsiyonel adet/quantity bilgisini güvenli şekilde okur.
 * Sunucu fiyatlandırması bu değeri kullanabilir (örn. "kartvizit adedi"); ancak
 * client'tan gelen unitPrice/lineTotal asla okunmaz.
 *
 * DAİMA pozitif TAM SAYI döner (ondalık değer aşağı yuvarlanır), geçerli adet yoksa null.
 * Regresyon: `configuration` doğrulanmamış `unknown` olduğundan `{ quantity: 2.5 }` gibi
 * ondalık bir değer effectiveQty olarak doğrudan OrderItem.quantity (Int) sütununa gidiyor
 * ve Prisma create'i "invalid value 2.5" ile patlatıyordu (kullanıcıya 500). Floor + pozitiflik
 * kontrolü bunu önler; ondalık 0..1 (örn. 0.4) → null → DTO'daki baseQty'ye düşülür.
 */
export function extractConfigQuantity(config: ConfigurationInput): number | null {
  if (!config || typeof config !== "object") return null;
  const c = config as Record<string, unknown>;
  const candidates = [c.quantity, c.adet, c.count];
  for (const v of candidates) {
    const n = typeof v === "number" ? v : typeof v === "string" ? Number(v) : NaN;
    if (Number.isFinite(n)) {
      const q = Math.floor(n);
      if (q > 0) return q;
    }
  }
  return null;
}

function summarizeConfiguration(config: ConfigurationInput): string {
  if (!config || typeof config !== "object") return "";
  const c = config as Record<string, unknown>;
  return Object.entries(c)
    .filter(([, v]) => typeof v === "string" || typeof v === "number" || typeof v === "boolean")
    .map(([k, v]) => `${k}: ${String(v)}`)
    .join(" · ");
}

/**
 * Idempotency-Key hash'i ve hangi sipariş ID'sine çözüldüğünü `notes` JSON içinde tutar.
 * Order modelinde ayrı sütun olmadığı için geçici çözüm.
 * Notes formatı: `__idem:<hash>__\n<kullanıcı notu>`.
 */
const IDEM_PREFIX = "__idem:";
const IDEM_SUFFIX = "__";

function hashIdempotencyKey(key: string, userId?: string, email?: string): string {
  const scope = userId ?? email ?? "guest";
  return createHash("sha256").update(`${scope}:${key}`).digest("hex").substring(0, 32);
}

function buildNotesWithIdem(notes: string | undefined, idemHash: string | undefined): string | undefined {
  if (!idemHash) return notes;
  const tag = `${IDEM_PREFIX}${idemHash}${IDEM_SUFFIX}`;
  return notes ? `${tag}\n${notes}` : tag;
}

/** Satır-içi (misafir/storefront) adres — kayıtlı Address yoksa Order'a snapshot olarak yazılır.
 * Fix 5: type/companyName/taxNumber/taxOffice eklendi — sipariş detay sayfası (a.type==="corporate")
 * kontrolünün ve Paraşüt fatura kurumsal sınıflandırmasının snapshot üzerinde de çalışması için. */
export interface InlineAddress {
  fullName: string;
  phone: string;
  city: string;
  district: string;
  fullAddress: string;
  zipCode?: string;
  label?: string;
  /** "individual" | "corporate" — AddressBlock ve Paraşüt kurumsal tespiti için */
  type?: string;
  /** Fatura adresi kurumsal ise firma adı */
  companyName?: string;
  /** Vergi kimlik numarası (kurumsal) */
  taxNumber?: string;
  /** Vergi dairesi (kurumsal) */
  taxOffice?: string;
}

/** Sadece izinli alanları al — client'tan gelebilecek fazlalık alanları snapshot'a sızdırma. */
function normalizeAddressSnapshot(a: InlineAddress): InlineAddress {
  return {
    fullName: a.fullName,
    phone: a.phone,
    city: a.city,
    district: a.district,
    fullAddress: a.fullAddress,
    ...(a.zipCode ? { zipCode: a.zipCode } : {}),
    label: a.label ?? "Teslimat",
    // Fix 5: kurumsal fatura alanları — varsa snapshot'a dahil et
    ...(a.type ? { type: a.type } : {}),
    ...(a.companyName ? { companyName: a.companyName } : {}),
    ...(a.taxNumber ? { taxNumber: a.taxNumber } : {}),
    ...(a.taxOffice ? { taxOffice: a.taxOffice } : {}),
  };
}

/**
 * Yanıtta adresi tek bir şekle indir: kayıtlı sipariş FK relation'ını,
 * misafir siparişi ise snapshot JSON'unu `shippingAddress`/`billingAddress` olarak yüzeye çıkarır.
 * Böylece admin panel (order.shippingAddress.fullAddress ...) FK olsun snapshot olsun aynı şekilde render eder.
 */
/**
 * Sipariş kaleminin seçimlerini ürün seçenek şemasıyla eşleyip görüntüleme detayı üretir:
 * { group: "Baskı", label: "Çift yüz · mat", detail: "350 gr Kuşe · mat selefon" }.
 * Eşleşmeyen/boş seçimler atlanır; sıra ürün şemasının grup sırasıdır.
 */
function optionDetailsFor(
  options: Array<{ groupKey: string; groupLabel: string; optionKey: string; optionLabel: string; optionSublabel: string | null }>,
  configuration: unknown,
): Array<{ group: string; label: string; detail: string | null }> {
  const sels = extractSelections(configuration) as Record<string, string>;
  const out: Array<{ group: string; label: string; detail: string | null }> = [];
  const seen = new Set<string>();
  for (const o of options) {
    if (seen.has(o.groupKey)) continue;
    const sel = sels[o.groupKey];
    if (sel === undefined || sel === null || String(sel) === "") continue;
    const match = options.find((x) => x.groupKey === o.groupKey && x.optionKey === String(sel));
    if (!match) continue;
    seen.add(o.groupKey);
    out.push({ group: match.groupLabel, label: match.optionLabel, detail: match.optionSublabel ?? null });
  }
  return out;
}

function withAddressView<
  T extends {
    shippingAddress?: unknown;
    billingAddress?: unknown;
    shippingAddressSnapshot?: unknown;
    billingAddressSnapshot?: unknown;
  },
>(order: T): T {
  return {
    ...order,
    shippingAddress: order.shippingAddress ?? order.shippingAddressSnapshot ?? null,
    billingAddress: order.billingAddress ?? order.billingAddressSnapshot ?? null,
  };
}

/**
 * Sipariş onay maili SİPARİŞ OLUŞTURULURKEN mi gönderilmeli?
 *
 * Kartlı sipariş mailini ödeme başarısında alır (payments.handleCallback).
 * Ödemesiz akışlar iyzico callback'inden GEÇMEZ; onlarda mail burada gider:
 *  - cari (açık hesap): üyeye bağlıdır, userId şart.
 *  - havale/EFT: misafire de açık (Hasan kararı), userId ARANMAZ.
 *
 * Saf fonksiyon: kural create() içindeki prisma/transaction yığınına gömülü
 * kalmasın, doğrudan test edilebilsin diye ayrıldı. 2026-09-02'de koşul yalnız
 * `onAccount && userId` olduğu için havale siparişleri HİÇBİR mail almıyordu —
 * müşteri IBAN'ı e-postayla göremiyor, yönetici bekleyen havaleyi bilmiyordu.
 */
export function siparisAnindaMailGonderilir(
  paymentMethod: string | null | undefined,
  userId: string | null | undefined,
): boolean {
  if (paymentMethod === ODEME_YONTEMI.havale) return true;
  if (paymentMethod === ODEME_YONTEMI.cari) return Boolean(userId);
  return false;
}

@Injectable()
export class OrdersService {
  private readonly logger = new Logger(OrdersService.name);

  constructor(private prisma: PrismaService, private parasut: ParasutService, private settings: SettingsService, private mail: MailService, private loyalty: LoyaltyService, private metaCapi: MetaCapiService) {}

  /**
   * Public kargo takibi — sipariş no + e-posta eşleşmesiyle GERÇEK durum + zaman damgaları döner
   * (auth yok, rate-limitli). PII sızmasın diye yalnız takip için gereken minimum alanlar; eşleşme
   * yoksa hangi alanın yanlış olduğunu SIZDIRMADAN tek "bulunamadı". localStorage'a bağlı eski
   * akış + uydurma timeline KALDIRILDI → farklı cihazdan da çalışır, gerçek durumu gösterir.
   */
  async trackPublic(orderNumber: string, email: string) {
    const order = await this.prisma.order.findFirst({
      where: {
        orderNumber: orderNumber.trim(),
        email: { equals: email.trim(), mode: "insensitive" },
        deletedAt: null,
      },
      select: {
        orderNumber: true,
        status: true,
        createdAt: true,
        shippedAt: true,
        deliveredAt: true,
        trackingNumber: true,
        trackingCarrier: true,
        _count: { select: { items: true } },
      },
    });
    if (!order) {
      throw new NotFoundException("Bu bilgilerle eşleşen sipariş bulunamadı. Sipariş numaranızı ve e-posta adresinizi kontrol edin.");
    }
    return {
      orderNumber: order.orderNumber,
      status: String(order.status).replace(/_/g, "-"),
      createdAt: order.createdAt,
      shippedAt: order.shippedAt,
      deliveredAt: order.deliveredAt,
      trackingNumber: order.trackingNumber,
      trackingCarrier: order.trackingCarrier,
      itemCount: order._count.items,
    };
  }

  /**
   * SECURITY: never trust client-side pricing.
   * Client sadece "ne sipariş ediliyor" bilgisini (productId, configuration, quantity) gönderir.
   * unitPrice / lineTotal / subtotal / vat / total alanları DTO'da yer almıyor; gönderilse bile
   * burada görmezden gelinir — fiyatlar her zaman sunucuda Product.basePrice'tan yeniden hesaplanır.
   */
  async create(input: {
    userId?: string;
    email: string;
    phone: string;
    items: Array<{
      // productId VEYA productSlug'tan en az biri gelir (storefront sepeti yalnızca slug taşır).
      productId?: string;
      productSlug?: string;
      configuration: ConfigurationInput;
      quantity: number;
      needsDesignSupport?: boolean;
      uploadedFileName?: string;
      uploadedFileUrl?: string;
      designs?: unknown;
    }>;
    // Adres: kayıtlı FK id VEYA satır-içi inline adres (misafir/storefront). En az biri zorunlu.
    shippingAddressId?: string;
    billingAddressId?: string;
    shippingAddress?: InlineAddress;
    billingAddress?: InlineAddress;
    couponCode?: string;
    // Sadakat: kullanıcının bu siparişte harcamak istediği puan (LOYALTY_ENABLED açıksa).
    redeemPoints?: number;
    notes?: string;
    idempotencyKey?: string;
    paymentMethod?: string;
    // Meta CAPI (checkout çerezlerinden) — KVKK onay-gate'li Purchase için saklanır.
    marketingConsent?: boolean;
    fbp?: string;
    fbc?: string;
    // Google Ads atıf + CAPI eşleşme sinyalleri (checkout isteğinden snapshot).
    gclid?: string;
    // gbraid/wbraid: iOS/uygulama kampanyalarında gclid yerine gelir. utm*: reklam dışı kanallar.
    gbraid?: string;
    wbraid?: string;
    utmSource?: string;
    utmMedium?: string;
    utmCampaign?: string;
    clientUserAgent?: string;
    clientIp?: string;
  }) {
    if (!input.items || input.items.length === 0) {
      throw new BadRequestException("Sipariş en az bir kalem içermelidir.");
    }

    // === Idempotency-Key kontrolü ===
    // Aynı (userId|email) + key kombinasyonu daha önce başarılı bir sipariş ürettiyse
    // yenisini yaratmadan mevcut order'ı geri döndür.
    const idemHash = input.idempotencyKey
      ? hashIdempotencyKey(input.idempotencyKey, input.userId, input.email)
      : undefined;
    if (idemHash) {
      const existing = await this.prisma.order.findFirst({
        where: { notes: { contains: `${IDEM_PREFIX}${idemHash}${IDEM_SUFFIX}` } },
        include: { items: true, shippingAddress: true, billingAddress: true },
      });
      if (existing) return existing;
    }

    // Adres çözümü: her adres için kayıtlı FK id VEYA satır-içi snapshot. En az biri zorunlu.
    const resolvedAddresses = await this.resolveAddresses(input);

    // Ürünleri tek seferde çek (active + price snapshot). Storefront sepeti slug taşıdığından
    // hem id hem slug ile çözeriz; item başına önce id, yoksa slug ile eşleştirilir.
    const productIds = Array.from(
      new Set(input.items.map((i) => i.productId).filter((v): v is string => !!v)),
    );
    const productSlugs = Array.from(
      new Set(input.items.map((i) => i.productSlug).filter((v): v is string => !!v)),
    );
    const products = await this.prisma.product.findMany({
      where: {
        isActive: true,
        OR: [
          ...(productIds.length ? [{ id: { in: productIds } }] : []),
          ...(productSlugs.length ? [{ slug: { in: productSlugs } }] : []),
        ],
      },
      include: { options: true, prices: true },
    });
    const productById = new Map(products.map((p) => [p.id, p]));
    const productBySlug = new Map(products.map((p) => [p.slug, p]));

    // Kampanya paketleri (CampaignPackage — Product DEĞİL): üründe bulunmayan slug'lar için.
    // Sepete eklenmiş bir paket de sipariş/ödeme akışına girebilsin diye (sabit packagePrice).
    const unresolvedSlugs = productSlugs.filter((s) => !productBySlug.has(s));
    const bundles = unresolvedSlugs.length
      ? await this.prisma.campaignPackage.findMany({ where: { isActive: true, slug: { in: unresolvedSlugs } } })
      : [];
    const bundleBySlug = new Map(bundles.map((b) => [b.slug, b]));

    // m² (area) ürünleri için global fiyat ayarları — yalnız area ürünü varsa tek sefer çek.
    const hasAreaProduct = products.some((p) => (p as { pricingMode?: string }).pricingMode === "area");
    const pricing = hasAreaProduct ? await this.settings.getPricing() : DEFAULT_PRICING;

    // SECURITY: kalem fiyatlarını her zaman SUNUCUDA hesapla (Product konfigüratörü veya paket
    // packagePrice'ı). Client'tan gelen herhangi bir fiyat alanı tamamen yok sayılır.
    const recalculatedItems = input.items.map((i) => {
      if (!i.productId && !i.productSlug) {
        throw new BadRequestException("Sipariş kalemi productId veya productSlug içermelidir.");
      }
      // Sepet adedi = kaç adet kalem (konfigüre ürün seti veya paket).
      const quantity = Number.isInteger(i.quantity) && i.quantity > 0 ? i.quantity : 1;
      if (quantity > MAX_QUANTITY_PER_ITEM) {
        throw new BadRequestException(`Geçersiz adet (${i.productId ?? i.productSlug}).`);
      }
      const configuration = i.configuration ?? {};
      const configurationSummary = pickConfigurationSummary(i.configuration, summarizeConfiguration(i.configuration));
      // Müşteri tasarım dosyaları (2026-09-03): set başına tasarım × çoklu dosya → DesignUpload
      // (kind=musteri) satırları. Eski tek-dosya alanları ilk dosyayla doldurulur (geriye dönük).
      const musteriDosyalari = musteriDosyaSatirlari(i.designs);
      const ilk = ilkDosya(musteriDosyalari);
      const common = {
        configuration,
        configurationSummary,
        quantity,
        needsDesignSupport: i.needsDesignSupport ?? false,
        uploadedFileName: i.uploadedFileName ?? ilk?.uploadedFileName,
        uploadedFileUrl: i.uploadedFileUrl ?? ilk?.uploadedFileUrl,
        musteriDosyalari,
      };

      const product =
        (i.productId ? productById.get(i.productId) : undefined) ??
        (i.productSlug ? productBySlug.get(i.productSlug) : undefined);

      if (product) {
        // Konfigüratör fiyatı: ürünün KENDİ options/prices şeması + kullanıcı selections'ından.
        // Fix 1+2: rules (forcesOption/disablesGroups) ve locked normalizasyonu web ile parity.
        const rawSelections = extractSelections(i.configuration) as Record<string, string>;
        const mappedOpts = (product.options ?? []).map((o) => ({
          ...o,
          groupRole: o.groupRole as "dimension" | "priced",
          locked: (o as unknown as { locked?: boolean }).locked ?? false,
          rules: (o as unknown as { rules?: unknown }).rules as import("./pricing").OptionRules | null ?? null,
        }));
        const selections = normalizeSelections(mappedOpts, rawSelections);
        const mappedPrices = (product.prices ?? []).map((r) => ({
          groupKey: r.groupKey,
          optionKey: r.optionKey,
          dimKey: r.dimKey,
          price: Number(r.price),
          cost: r.cost == null ? null : Number(r.cost),
        }));
        // m² maliyet motoru (area) vs mevcut toplamsal (additive) — ürünün pricingMode'una göre.
        // Area (2026-09-04): 1 m² tabanı TOPLAM alana uygulanır → satır fiyatı gerçek adetle
        // hesaplanır, unitPrice türetilir (computeAreaLine). Eski "adet=1 × quantity" kurulumu
        // tabanı her parçaya ayrı bindiriyordu (80×100 × 2 → 2 m² yerine 1,6 m² olmalı).
        const isAreaProduct = (product as { pricingMode?: string }).pricingMode === "area";
        const areaLine = isAreaProduct
          ? computeAreaLine(mappedOpts as never, mappedPrices, selections, quantity, pricing)
          : null;
        const configuredUnit = areaLine
          ? areaLine.unitPrice
          : computeConfiguredPrice(mappedOpts, mappedPrices, selections);
        // Area: sunucu-tarafı maxM2 + emniyet tavanı — doğrudan API ile absürt ölçü (en/boy)
        // siparişini engelle (client'taki areaMaxExceeded kontrolünün sunucu karşılığı).
        if ((product as { pricingMode?: string }).pricingMode === "area") {
          const alanPiece = ((Number(selections.en) || 0) * (Number(selections.boy) || 0)) / 10000;
          const matOpt = mappedOpts.find((o) => o.groupKey === "malzeme" && o.optionKey === selections.malzeme);
          const matRules = matOpt?.rules as { maxM2?: number; minEn?: number; minBoy?: number } | null | undefined;
          const maxM2 = matRules?.maxM2;
          if (typeof maxM2 === "number" && maxM2 > 0 && alanPiece > maxM2) {
            throw new BadRequestException(`Bu malzeme tek parçada en fazla ${maxM2} m² basılabilir: ${product.slug}`);
          }
          if (alanPiece > 100) {
            throw new BadRequestException(`Geçersiz ölçü (tek parça ${alanPiece.toFixed(1)} m²): ${product.slug}`);
          }
          // Üretim minimumu (2026-08-26 UX denetimi İş 2) — client'taki areaMinViolated'ın
          // sunucu karşılığı: doğrudan API çağrısıyla da min altı ölçü sipariş edilemez.
          const enCm = Number(selections.en) || 0;
          const boyCm = Number(selections.boy) || 0;
          if (typeof matRules?.minEn === "number" && matRules.minEn > 0 && enCm > 0 && enCm < matRules.minEn) {
            throw new BadRequestException(`Bu ürün için en (genişlik) en az ${matRules.minEn} cm olmalıdır: ${product.slug}`);
          }
          if (typeof matRules?.minBoy === "number" && matRules.minBoy > 0 && boyCm > 0 && boyCm < matRules.minBoy) {
            throw new BadRequestException(`Bu ürün için boy (uzunluk) en az ${matRules.minBoy} cm olmalıdır: ${product.slug}`);
          }
        }
        // Fiyatı belirlenmemiş ürün (configuredUnit=0 → "Teklif Al") sipariş edilemez:
        // storefront sepete eklemeyi zaten engeller; bu sunucu-tarafı savunma (doğrudan API
        // çağrısıyla 0-toplamlı sipariş oluşturulmasını önler).
        if (!Number.isFinite(configuredUnit) || configuredUnit <= 0) {
          throw new BadRequestException(`Bu ürün için fiyat belirlenmemiş (Teklif Al), sipariş alınamıyor: ${product.slug}`);
        }
        const unitPrice = round2(configuredUnit);
        // Denetim kaydı: sunucu-tarafı fiyat hesabı. Client'tan gelen totalPrice ile karşılaştır;
        // %5'i aşan sapma şüpheli (fiyat manipülasyonu, stale cache, calculator hatası).
        const clientTotalHint = (i.configuration as Record<string, unknown>)?.totalPrice;
        if (typeof clientTotalHint === "number" && clientTotalHint > 0) {
          const pctDiff = Math.abs(unitPrice - clientTotalHint) / unitPrice;
          if (pctDiff > 0.05) {
            this.logger.warn(
              `Fiyat sapması [${product.slug}]: sunucu=${unitPrice}₺ client=${clientTotalHint}₺ (%${(pctDiff * 100).toFixed(1)})`,
            );
          }
        } else {
          this.logger.debug(`Sunucu fiyat [${product.slug}]: ${unitPrice}₺ × ${quantity}`);
        }
        // Area: satır toplamı motorun kendi sonucudur (unit × qty kuruş yuvarlaması biriktirmesin).
        const lineTotal = areaLine ? areaLine.lineTotal : round2(unitPrice * quantity);
        // Maliyet SNAPSHOT'ı (2026-08-24): sipariş anındaki maliyet kaleme yazılır —
        // sonradan yapılan maliyet güncellemeleri geçmiş kâr raporunu DEĞİŞTİRMEZ.
        // null = maliyeti girilmemiş ürün (rapor "maliyet girilmemiş" olarak toplar).
        const costTotal = computeItemCostTotal(
          product as { pricingMode?: string | null; options?: unknown; prices?: unknown; content?: unknown },
          { selections },
          quantity,
          lineTotal / 1.2,
          Number(pricing.marj) > 0 ? Number(pricing.marj) : DEFAULT_PRICING.marj,
          // area (m²) ürünlerde maliyet content.maliyetUsd'den kur/minM2 ile hesaplanır.
          pricing,
        );
        return {
          ...common,
          productId: product.id as string | null,
          productSlug: product.slug,
          productName: product.name,
          productImage: product.images?.[0] ?? "",
          unitPrice,
          lineTotal,
          costTotal,
        };
      }

      // Kampanya paketi (sabit packagePrice; productId NULL).
      const bundle = i.productSlug ? bundleBySlug.get(i.productSlug) : undefined;
      if (bundle) {
        const unitPrice = round2(Number(bundle.packagePrice));
        if (!Number.isFinite(unitPrice) || unitPrice <= 0) {
          throw new BadRequestException(`Paket fiyatı geçersiz: ${bundle.slug}`);
        }
        return {
          ...common,
          productId: null,
          productSlug: bundle.slug,
          productName: bundle.name,
          productImage: "",
          unitPrice,
          lineTotal: round2(unitPrice * quantity),
          costTotal: null as number | null, // paket maliyeti sistemde yok — bilinmiyor
        };
      }

      throw new BadRequestException(`Ürün bulunamadı veya pasif: ${i.productId ?? i.productSlug}`);
    });

    // Sunucu tarafı toplamlar.
    // basePrice KDV dahil — bu yüzden subtotal da KDV dahil bir "brüt" toplamdır.
    const subtotal = round2(recalculatedItems.reduce((s, it) => s + it.lineTotal, 0));

    // Son savunma: item bazında 0-fiyat guard'larına ek olarak toplam sıfır sipariş de reddedilir.
    // (Teorik kenar durum: tüm item'lar geçse de toplam yuvarlama/edge nedeniyle 0 çıkabilir.)
    if (!Number.isFinite(subtotal) || subtotal <= 0) {
      throw new BadRequestException("Sipariş tutarı sıfır olamaz; fiyatsız ürünler sipariş edilemiyor.");
    }

    // Üst tavan: DB numeric taşmasını (500 'numeric field overflow') net bir 400'e çevir. Kalem
    // bazında da kontrol et (line_total numeric(10,2) tek başına da taşabilir).
    const overLine = recalculatedItems.find((it) => it.lineTotal > MAX_ORDER_TOTAL);
    if (overLine || subtotal > MAX_ORDER_TOTAL) {
      throw new BadRequestException(
        `Bu tutarda sipariş online alınamıyor. Lütfen bizimle iletişime geçin (0324 433 33 51), kurumsal teklif hazırlayalım.`,
      );
    }

    // === Kupon validation (server-side) ===
    // Kupon yalnızca sunucuda doğrulanır; client'tan gelen tutarlar yok sayılır.
    let discount = 0;
    let appliedCoupon: { id: string; code: string; type: string } | null = null;
    if (input.couponCode) {
      const code = input.couponCode.trim().toUpperCase();
      const coupon = await this.prisma.coupon.findUnique({ where: { code } });
      if (!coupon) throw new BadRequestException("Kupon bulunamadı.");
      if (!coupon.isActive) throw new BadRequestException("Kupon pasif.");

      const now = new Date();
      if (coupon.validFrom && now < coupon.validFrom) {
        throw new BadRequestException("Kupon henüz geçerli değil.");
      }
      if (coupon.validUntil && now > coupon.validUntil) {
        throw new BadRequestException("Kuponun süresi dolmuş.");
      }
      if (coupon.maxUses != null && coupon.usedCount >= coupon.maxUses) {
        throw new BadRequestException("Kupon kullanım hakkı tükenmiş.");
      }
      const minOrder = coupon.minOrderAmount != null ? Number(coupon.minOrderAmount) : 0;
      if (minOrder > 0 && subtotal < minOrder) {
        throw new BadRequestException(`Bu kupon için minimum sipariş tutarı: ${minOrder} TL`);
      }
      // İlk-sipariş kuralı (HOSGELDIN gibi): kullanıcının/e-postanın önceki siparişi varsa reddet
      // → tekrar kullanımı engeller. (Beklemede sipariş "Ödeme Yap" ile aynı sipariş üzerinden öder,
      //  yeni sipariş açmaz; bu yüzden önceki sipariş = ilk değil.)
      if (coupon.firstOrderOnly) {
        // İlk-sipariş kuponu HESABA bağlıdır — misafir kullanamaz. /orders/guest kaldırıldığı için
        // normalde userId hep dolu gelir; bu, API doğrudan çağrılsa bile taze e-posta ile istismarı kapatır.
        if (!input.userId) {
          throw new BadRequestException("Bu kupon yalnızca giriş yapan üyelerin ilk siparişinde geçerlidir.");
        }
        // userId VEYA e-posta ile önceki TAMAMLANMIŞ sipariş varsa reddet (aynı e-postayla
        // 2. hesap denemesini de yakalar). "Tamamlanmış" = ödemesi başarılı YA DA cari
        // (açık hesap) siparişi. Ödenmemiş/başarısız/iptal denemeler SAYILMAZ — aksi halde
        // ödeme-başlat hatasından sonra retry, az önce oluşan ödenmemiş sipariş yüzünden
        // "yalnızca ilk siparişinizde geçerlidir" der ve HOSGELDIN'li checkout kalıcı tıkanır.
        const priorCount = await this.prisma.order.count({
          where: {
            OR: [{ userId: input.userId }, ...(input.email ? [{ email: input.email }] : [])],
            AND: [
              {
                OR: [
                  { paymentStatus: "basarili" },
                  { paymentMethod: "cari", status: { not: "iptal_edildi" } },
                ],
              },
            ],
          },
        });
        if (priorCount > 0) {
          throw new BadRequestException("Bu kupon yalnızca ilk siparişinizde geçerlidir.");
        }
      }

      const value = Number(coupon.value);
      if (coupon.type === "percentage") {
        discount = round2((subtotal * value) / 100);
      } else if (coupon.type === "fixed_amount") {
        discount = round2(Math.min(value, subtotal));
      }
      // free_shipping aşağıda shippingFee=0 olarak uygulanır.
      appliedCoupon = { id: coupon.id, code: coupon.code, type: coupon.type };
    }

    // === Kurumsal (B2B) — onaylı kurumsal kullanıcı: indirim + cari hesap uygunluğu ===
    let cariEligible = false;
    let cariCreditLimit: number | null = null;
    let cariTermDays = 0;
    if (input.userId) {
      const u = await this.prisma.user.findUnique({
        where: { id: input.userId },
        select: {
          accountType: true, corporateStatus: true, corporateDiscount: true,
          corporateCreditLimit: true, corporatePaymentTermDays: true,
        },
      });
      if (u?.accountType === "corporate" && u.corporateStatus === "approved") {
        cariEligible = true;
        cariCreditLimit = u.corporateCreditLimit != null ? Number(u.corporateCreditLimit) : null;
        cariTermDays = u.corporatePaymentTermDays ?? 0;
        const pct = u.corporateDiscount != null ? Number(u.corporateDiscount) : 0;
        if (pct > 0) discount = round2(discount + (subtotal * pct) / 100);
      }
    }

    // === Havale/EFT indirimi ===
    // Kart komisyonu ödenmediği için müşteriye yansıtılır (Hasan, 2026-09-02).
    // KUPON VE KURUMSAL İNDİRİMDEN SONRA kalan tutara uygulanır: subtotal'ın
    // tamamı üzerinden verilseydi kupon+kurumsal+havale üst üste binip marjı
    // yerdi. Puan harcamasından ÖNCE hesaplanır ki puanın harcanabileceği
    // boşluk (roomTl) doğru daralsın.
    // Client'a GÜVENİLMEZ: yöntem "havale" ise indirimi sunucu kendisi ekler.
    const havaleOdeme = input.paymentMethod === ODEME_YONTEMI.havale;
    if (havaleOdeme) {
      discount = round2(discount + ((subtotal - discount) * HAVALE_INDIRIM_YUZDE) / 100);
    }

    // === Sadakat puanı harcama (LOYALTY_ENABLED açıksa) ===
    // Puan indirimi mevcut `discount` değişkenine eklenir → KDV/toplam/iyzico sepeti otomatik
    // doğru (payments.service order.discount'ı okur, ek değişiklik gerekmez). Client'a GÜVENİLMEZ:
    // bakiye ve kurallar (bakiye, %50 tavan, subtotal boşluğu) sunucuda YENİDEN doğrulanır.
    let redeemPointsSpent = 0;
    if (this.loyalty.isEnabled() && input.userId && input.redeemPoints && input.redeemPoints > 0) {
      const balance = await this.loyalty.getBalance(input.userId);
      const maxByRule = this.loyalty.maxRedeemablePoints(balance, subtotal);
      // Kupon+kurumsal indirim sonrası kalan subtotal boşluğuna göre de sınırla (toplam indirim
      // subtotal'ı aşmasın; puanlar boşa harcanmasın).
      const roomTl = Math.max(0, subtotal - discount);
      const roomPoints = Math.floor(roomTl) * LoyaltyService.REDEEM_POINTS_PER_TL;
      redeemPointsSpent = Math.max(0, Math.min(Math.floor(input.redeemPoints), maxByRule, roomPoints));
      if (redeemPointsSpent > 0) {
        discount = round2(discount + this.loyalty.redeemTlValue(redeemPointsSpent));
      }
    }

    // İndirim subtotal'ı aşamaz: kupon + kurumsal + puan yığılaması subtotal'ı geçerse kısıt uygula.
    // Muhasebe kaydı ve Paraşüt e-faturası için indirim <= subtotal garantisi (negatif satır engeli).
    discount = round2(Math.min(discount, subtotal));

    // Kargo: free_shipping kuponu VEYA ara toplam eşiği → ücretsiz; aksi halde settings'ten gelen bedel.
    const { fee: shippingFeeSetting, freeThreshold } = await this.settings.getShipping();
    const freeShipping = appliedCoupon?.type === "free_shipping" || subtotal >= freeThreshold;
    const shippingFee = freeShipping ? 0 : shippingFeeSetting;

    // basePrice KDV dahil — vat reverse calculation
    // KDV dahil brüt = subtotal (- discount). KDV = brüt − (brüt / 1.20).
    const taxableGross = round2(Math.max(0, subtotal - discount));
    const netBeforeVat = round2(taxableGross / VAT_DIVISOR);
    const vat = round2(taxableGross - netBeforeVat);
    // Toplam = brüt (KDV dahil) + kargo (KDV burada ayrı tutulmuyor).
    const total = round2(taxableGross + shippingFee);

    // === Cari hesap (açık hesap) ödeme yolu — yalnız onaylı kurumsal müşteri, kredi limiti dahilinde ===
    // NOT: Kredi limiti kontrolü ARTIK transaction İÇİNDE, kullanıcı satırı kilitlenerek yapılır
    // (aşağıda assertCariLimitWithinTx). Burada yalnız uygunluk + vade tarihi hesaplanır.
    // Buradaki uygunluk verisi (cariEligible/limit/term) kullanıcının statik kurumsal ayarlarıdır;
    // aynı işlem içinde değişmediği için yarış koşulu yok — yarış SADECE bakiyede (ledger) yaşanır.
    const onAccount = input.paymentMethod === "cari";
    let cariDueDate: Date | null = null;
    if (onAccount) {
      if (!cariEligible) {
        throw new BadRequestException("Açık hesap (cari) yalnızca onaylı kurumsal müşteriler içindir.");
      }
      cariDueDate = new Date(Date.now() + cariTermDays * 24 * 60 * 60 * 1000);
    }

    const finalNotes = buildNotesWithIdem(input.notes, idemHash);

    // Kupon kullanım sayısını atomic artırmak için transaction.
    const placed = await this.prisma.$transaction(async (tx) => {
      if (appliedCoupon) {
        // Atomic increment + race koşulu: kupon hala geçerliyse usedCount++ ;
        // maxUses dolduysa updateMany 0 satır günceller ve hata fırlatılır.
        const c = await tx.coupon.findUnique({ where: { id: appliedCoupon.id } });
        if (!c || !c.isActive) throw new ConflictException("Kupon artık geçerli değil.");
        if (c.maxUses != null && c.usedCount >= c.maxUses) {
          throw new ConflictException("Kupon kullanım hakkı tükenmiş.");
        }
        const updated = await tx.coupon.updateMany({
          where: {
            id: appliedCoupon.id,
            isActive: true,
            ...(c.maxUses != null ? { usedCount: { lt: c.maxUses } } : {}),
          },
          data: { usedCount: { increment: 1 } },
        });
        if (updated.count === 0) {
          throw new ConflictException("Kupon kullanım hakkı az önce doldu, tekrar deneyin.");
        }
      }

      // === ATOMİK kredi limiti kontrolü (cari/açık hesap) ===
      // KRİTİK yarış düzeltmesi: bakiye kontrolü transaction DIŞINDA yapıldığında iki eşzamanlı
      // cari sipariş aynı eski bakiyeyi okuyup ikisi de limitten geçebiliyordu (limit aşımı).
      // Çözüm: kullanıcı satırını kilitle (SELECT ... FOR UPDATE) → aynı kullanıcının cari
      // siparişleri serileşir → bakiyeyi KİLİTLİ olarak yeniden hesapla → limit kontrolü → debit.
      // Kilit + okuma + yazma aynı transaction'da olduğundan check-and-create artık atomiktir.
      if (onAccount && input.userId) {
        await this.assertCariLimitWithinTx(tx, input.userId, cariCreditLimit, total);
      }

      const created = await tx.order.create({
        data: {
          orderNumber: generateOrderNumber(),
          userId: input.userId,
          email: input.email,
          phone: input.phone,
          subtotal: new Prisma.Decimal(subtotal),
          shippingFee: new Prisma.Decimal(shippingFee),
          discount: new Prisma.Decimal(discount),
          vat: new Prisma.Decimal(vat),
          total: new Prisma.Decimal(total),
          // Havale siparişi paymentStatus=beklemede ile açılır (şemadaki varsayılan):
          // para gelmeden üretime girmemeli. Admin "ödeme geldi" deyince basarili olur.
          paymentMethod: onAccount ? ODEME_YONTEMI.cari : input.paymentMethod ?? null,
          // Meta CAPI: onay + eşleşme sinyalleri (yoksa false/null → CAPI sessizce atlar).
          marketingConsent: input.marketingConsent ?? false,
          fbp: input.fbp ?? null,
          fbc: input.fbc ?? null,
          // Ads atıf (gclid) + sipariş anı UA/IP — CAPI client_user_agent/client_ip_address kaynağı.
          gclid: input.gclid ?? null,
          gbraid: input.gbraid ?? null,
          wbraid: input.wbraid ?? null,
          utmSource: input.utmSource ?? null,
          utmMedium: input.utmMedium ?? null,
          utmCampaign: input.utmCampaign ?? null,
          clientUserAgent: input.clientUserAgent ?? null,
          clientIp: input.clientIp ?? null,
          shippingAddressId: resolvedAddresses.shippingAddressId,
          billingAddressId: resolvedAddresses.billingAddressId,
          shippingAddressSnapshot: resolvedAddresses.shippingAddressSnapshot
            ? (resolvedAddresses.shippingAddressSnapshot as unknown as Prisma.InputJsonValue)
            : Prisma.DbNull,
          billingAddressSnapshot: resolvedAddresses.billingAddressSnapshot
            ? (resolvedAddresses.billingAddressSnapshot as unknown as Prisma.InputJsonValue)
            : Prisma.DbNull,
          notes: finalNotes,
          items: {
            create: recalculatedItems.map((i) => ({
              productId: i.productId ?? undefined,
              productSlug: i.productSlug,
              productName: i.productName,
              productImage: i.productImage,
              configurationSummary: i.configurationSummary,
              configuration: i.configuration as Prisma.InputJsonValue,
              unitPrice: new Prisma.Decimal(i.unitPrice),
              quantity: i.quantity,
              lineTotal: new Prisma.Decimal(i.lineTotal),
              costTotal: i.costTotal == null ? null : new Prisma.Decimal(i.costTotal),
              needsDesignSupport: i.needsDesignSupport,
              uploadedFileName: i.uploadedFileName,
              uploadedFileUrl: i.uploadedFileUrl,
              // Müşterinin set başına dosyaları (2026-09-03) — DesignUpload kind=musteri. orderId
              // iç içe create ile verilemez; hemen aşağıda updateMany ile doldurulur.
              ...(i.musteriDosyalari.length
                ? { designUploads: { create: i.musteriDosyalari.map((m) => ({ kind: m.kind, designIndex: m.designIndex, fileName: m.fileName, fileUrl: m.fileUrl, fileSize: m.fileSize, mimeType: m.mimeType, storageKey: m.storageKey })) } }
                : {}),
            })),
          },
        },
        include: { items: true, shippingAddress: true, billingAddress: true },
      });

      // Müşteri dosya satırlarına (kind=musteri) orderId yaz: iç içe create yalnız orderItemId verir;
      // Drive taşıma ve panelden silme (findFirst {id, orderId}) sipariş kimliğiyle arar.
      if (recalculatedItems.some((i) => i.musteriDosyalari.length > 0)) {
        await tx.designUpload.updateMany({
          where: { orderItem: { orderId: created.id }, orderId: null },
          data: { orderId: created.id },
        });
      }

      // Açık hesap (cari): siparişi cari deftere borç (debit) olarak işle — vade tarihli.
      if (onAccount && input.userId) {
        await tx.corporateLedgerEntry.create({
          data: {
            userId: input.userId,
            orderId: created.id,
            kind: "debit",
            amount: new Prisma.Decimal(total),
            description: `Sipariş ${created.orderNumber}`,
            dueDate: cariDueDate,
          },
        });
      }

      // Sadakat puanı harcama — AYNI transaction'da: bakiyeyi atomik düş + spend ledger yaz.
      // Bakiye yetersizse hata → tüm sipariş rollback (indirimi ödenmemiş puanla veremeyiz).
      if (redeemPointsSpent > 0 && input.userId) {
        await this.loyalty.spendForOrderTx(tx, input.userId, created.id, redeemPointsSpent);
      }

      // Misafir siparişinde FK relation null gelir; snapshot'ı adres olarak yüzeye çıkar.
      return withAddressView(created);
    });

    // ÖDEMESİZ AKIŞLAR — sipariş iyzico callback'inden GEÇMEZ, o yüzden onay maili
    // BURADA gönderilir. Kartlı siparişler mailini ödeme başarısında alır
    // (payments.handleCallback). Fire-and-forget.
    //
    // 2026-09-02 DÜZELTMESİ: koşul yalnız `onAccount` idi; havale siparişi ne cari ne
    // kartlı olduğu için HİÇBİR mail almıyordu — müşteri IBAN'ı e-postayla hiç görmüyor,
    // yönetici de bekleyen havaleden haberdar olmuyordu. Havalede mailin İÇERİĞİ zaten
    // ödeme beklendiğini söyler ve hesap bilgilerini taşır (mail.service > isHavale).
    //
    // userId şartı yalnız cari için: açık hesap üyeye bağlıdır. Havale MİSAFİRE de açık
    // (Hasan kararı) — orada mail adresi sipariş kaydından gelir.
    const odemesizAkis = siparisAnindaMailGonderilir(input.paymentMethod, input.userId);
    if (odemesizAkis) {
      void this.mail.sendOrderConfirmationEmail((placed as { id: string }).id).catch(() => undefined);
      // Yöneticiye "yeni sipariş" bildirimi. BİLEREK onay mailiyle AYNI noktada: sipariş
      // ancak burada (cari) ya da ödeme başarısında "gerçek" olur. Sipariş oluşturma anına
      // bağlansaydı terk edilmiş ödemeler de bildirim üretirdi (2026-08-18'de panelde
      // ödemesiz siparişlerin görünmesi zaten sorun olmuştu).
      void this.mail.sendNewOrderAdminEmail((placed as { id: string }).id).catch(() => undefined);
      // Meta CAPI Purchase: cari sipariş iyzico callback'inden GEÇMEZ → burada tetiklenmezse
      // kurumsal dönüşümler Meta'da hiç görünmüyordu. event_id=orderNumber olduğundan tarayıcı
      // Pixel'iyle dedup korunur (handleCallback'teki çağrı deseninin aynısı, fire-and-forget).
      //
      // HAVALEDE ATEŞLENMEZ: para henüz gelmedi. Havalenin dönüşümü, ödemenin onaylandığı
      // an odemeOnayla() içinden bildirilir — ödenmemiş siparişi dönüşüm saymak Ads/GA4'ü
      // şişirirdi.
      if (onAccount) {
        void this.metaCapi.sendPurchase((placed as { id: string }).id).catch(() => undefined);
      }
    }
    return placed;
  }

  /**
   * Transaction İÇİNDE kredi limiti kontrolü (atomik check-and-create için).
   *
   * Yarış kapanışı: önce kullanıcı satırını `SELECT ... FOR UPDATE` ile kilitler — böylece
   * AYNI kullanıcının eşzamanlı cari siparişleri PostgreSQL'de serileşir (ikinci işlem
   * birincinin commit'ini bekler). Ardından bakiyeyi transaction içinden (kilitli görünümle)
   * yeniden hesaplar ve `bakiye + yeniBorç ≤ limit` kuralını uygular. Kilit + okuma + (çağıran
   * tarafında) debit yazımı aynı transaction'da olduğundan check-and-create artık atomiktir.
   *
   * Limit semantiği DEĞİŞMEDİ: limit null → sınırsız; round2(bakiye + total) > limit → reddet.
   * Test ortamı (mock tx) `$queryRaw`/`groupBy` sağlamayabilir; bu durumda kilit/okuma sessizce
   * atlanır ve mevcut (transaction-dışı) bakiye okumasına düşülür — happy-path davranışı korunur.
   */
  private async assertCariLimitWithinTx(
    tx: Prisma.TransactionClient,
    userId: string,
    creditLimit: number | null,
    newDebit: number,
  ): Promise<void> {
    // Limit yoksa (sınırsız) kontrol gereksiz — yine de kilide gerek yok.
    if (creditLimit == null) return;

    // Kullanıcı satırını kilitle → aynı kullanıcının cari siparişleri serileşir.
    // queryRaw mock'ta tanımsız olabilir (birim testleri) → güvenli düşüş.
    try {
      if (typeof tx.$queryRaw === "function") {
        await tx.$queryRaw`SELECT id FROM users WHERE id = ${userId} FOR UPDATE`;
      }
    } catch (e) {
      this.logger.error(`cari limit kilidi alınamadı user=${userId}: ${(e as Error).message}`);
    }

    // Bakiyeyi transaction içinden (kilit sonrası taze görünümle) hesapla.
    const balance = await this.ledgerBalanceVia(tx, userId);
    if (round2(balance + newDebit) > creditLimit) {
      throw new BadRequestException(
        `Kredi limiti aşılıyor (limit ${creditLimit} ₺, mevcut borç ${balance} ₺).`,
      );
    }
  }

  /** Verilen transaction client üzerinden cari bakiye (borç − tahsilat). */
  private async ledgerBalanceVia(
    client: Prisma.TransactionClient,
    userId: string,
  ): Promise<number> {
    const grouped = await client.corporateLedgerEntry.groupBy({
      by: ["kind"],
      where: { userId },
      _sum: { amount: true },
    });
    let debit = 0;
    let credit = 0;
    for (const g of grouped) {
      const v = Number(g._sum.amount ?? 0);
      if (g.kind === "debit") debit = v;
      else credit = v;
    }
    return round2(debit - credit);
  }

  /**
   * Sipariş adreslerini çözer: her biri için kayıtlı FK id VEYA satır-içi inline adres.
   * Kurallar:
   *  - shippingAddressId verildiyse: auth kullanıcıda IDOR kontrolü, misafirde id'ye güvenilir (geri uyum).
   *  - shippingAddress (inline) verildiyse: snapshot olarak saklanır (FK yok).
   *  - billing yoksa shipping'e düşer (kayıtlı id veya snapshot).
   *  - Hiçbiri yoksa BadRequest.
   */
  private async resolveAddresses(input: {
    userId?: string;
    shippingAddressId?: string;
    billingAddressId?: string;
    shippingAddress?: InlineAddress;
    billingAddress?: InlineAddress;
  }): Promise<{
    shippingAddressId: string | null;
    billingAddressId: string | null;
    shippingAddressSnapshot: InlineAddress | null;
    billingAddressSnapshot: InlineAddress | null;
  }> {
    // Kayıtlı adres id'sinin doğrulanması — IDOR koruması.
    // Kural: addressId YALNIZCA giriş yapan kullanıcılar için kullanılabilir (userId zorunlu).
    // Misafir/anonim akışı zaten /orders/guest kaldırıldığından normal akışta userId her zaman doludur;
    // ancak servis doğrudan çağrılsa veya gelecekte misafir yolu eklenirse savunma hattı burada.
    const assertOwned = async (id: string) => {
      if (!input.userId) {
        // userId olmadan addressId kullanmak IDOR riski — reddet.
        throw new ForbiddenException("Kayıtlı adres kullanmak için giriş yapmanız gereklidir.");
      }
      const found = await this.prisma.address.findFirst({ where: { id, userId: input.userId } });
      if (!found) throw new ForbiddenException("Belirtilen adrese erişim izniniz yok.");
    };

    // Teslimat adresi — zorunlu.
    let shippingAddressId: string | null = null;
    let shippingAddressSnapshot: InlineAddress | null = null;
    if (input.shippingAddressId) {
      await assertOwned(input.shippingAddressId);
      shippingAddressId = input.shippingAddressId;
    } else if (input.shippingAddress) {
      shippingAddressSnapshot = normalizeAddressSnapshot(input.shippingAddress);
    } else {
      throw new BadRequestException("Teslimat adresi gerekli (shippingAddressId veya shippingAddress).");
    }

    // Fatura adresi — verilmezse teslimat adresine düşer.
    let billingAddressId: string | null = null;
    let billingAddressSnapshot: InlineAddress | null = null;
    if (input.billingAddressId) {
      await assertOwned(input.billingAddressId);
      billingAddressId = input.billingAddressId;
    } else if (input.billingAddress) {
      billingAddressSnapshot = normalizeAddressSnapshot(input.billingAddress);
    } else {
      // Fatura = teslimat
      billingAddressId = shippingAddressId;
      billingAddressSnapshot = shippingAddressSnapshot;
    }

    return { shippingAddressId, billingAddressId, shippingAddressSnapshot, billingAddressSnapshot };
  }

  listMine(userId: string) {
    return this.prisma.order.findMany({
      // Soft-delete edilmiş sipariş müşteriye GÖRÜNMEZ. Şema deletedAt'i "KVKK & TTK,
      // mali kayıt 10 yıl saklanır" diye tanımlıyor: satır DB'de kalır, arayüzde yoktur.
      // Cron'lar (lifecycle/reconcile) ve ciro/kâr sorguları bunu zaten filtreliyordu;
      // bu iki liste atlanmıştı (2026-09-03).
      where: { userId, deletedAt: null },
      include: { items: true },
      orderBy: { createdAt: "desc" },
    });
  }

  async listAll(opts: { status?: string; take?: number; skip?: number; role?: string } = {}) {
    // Geçersiz/bilinmeyen status filtresi → filtre uygulanmaz (eskiden Prisma'da 500'e yol açıyordu).
    const status = slugToOrderStatus(opts.status);
    // designUploads (2026-09-03, "Kargodaki ürünler" ekranı): panel listesi kalem başına
    // tasarımcı önizlemesini göstersin diye satırlar listeye de eklendi — findById ile aynı
    // kural: müşteri rolünde ASLA (çalışma dosyaları vitrine sızmaz), panelde her rolde.
    const panelRolu = !!opts.role && opts.role !== "customer";
    const orders = await this.prisma.order.findMany({
      // Soft-delete edilmiş sipariş panel listesinde de görünmez (bkz. listMine notu).
      where: status ? { status, deletedAt: null } : { deletedAt: null },
      include: {
        items: panelRolu
          ? { include: { designUploads: { orderBy: { createdAt: "asc" }, select: DESIGN_ROW_SELECT } } }
          : true,
        user: { select: { email: true, fullName: true } },
        shippingAddress: true,
        billingAddress: true,
      },
      orderBy: { createdAt: "desc" },
      take: opts.take ?? 50,
      skip: opts.skip ?? 0,
    });
    // Müşteri adı: üye → FK adres → snapshot (misafir checkout'ta girilen isim) → null.
    // Admin sipariş tablolarında e-posta yerine isim göstermek için.
    return orders.map((o) => {
      const nameOf = (a: unknown) => (a as { fullName?: string } | null)?.fullName || undefined;
      const items = (o.items as Array<Record<string, unknown> & { designUploads?: unknown[] }>).map((it) => {
        const { designUploads: ham, ...kalem } = it;
        const driveId = (kalem as { uploadedFileDriveId?: string | null }).uploadedFileDriveId;
        return panelRolu
          ? {
              ...kalem,
              designUploads: ((ham ?? []) as Parameters<typeof designRowToPublic>[0][]).map(designRowToPublic),
              uploadedFileDriveUrl: driveId ? driveFileUrl(driveId) : null,
            }
          : kalem;
      });
      return parasalAlanlariAyikla(
        {
          ...o,
          items,
          customerName:
            o.user?.fullName ||
            nameOf(o.shippingAddress) ||
            nameOf(o.billingAddress) ||
            nameOf(o.shippingAddressSnapshot) ||
            nameOf(o.billingAddressSnapshot) ||
            null,
        },
        opts.role,
      );
    });
  }

  async findById(id: string, userId?: string, role?: string) {
    const order = await this.prisma.order.findUnique({
      where: { id },
      // user DARALTILDI (2026-08-24): `user: true` TÜM satırı — passwordHash dahil —
      // yanıta koyuyordu (admin paneline ve müşterinin kendi sipariş detayına sızıyordu).
      // Panelin ihtiyacı üye kimliği + üyelik tarihi (üye/misafir rozeti) kadarıdır.
      include: {
        // Tasarımcı dosyaları (2026-09-02) YALNIZ panel rollerinde: aynı uç müşteriye de
        // servis ediyor; çalışma dosyaları (AI/PSD) vitrine sızmasın. Müşteri kendi yüklediği
        // dosyayı zaten uploadedFile* alanında görür.
        items:
          role && role !== "customer"
            ? { include: { designUploads: { orderBy: { createdAt: "asc" }, select: DESIGN_ROW_SELECT } } }
            : true,
        shippingAddress: true,
        billingAddress: true,
        user: { select: { id: true, fullName: true, email: true, accountType: true, createdAt: true } },
      },
    });
    if (!order) throw new NotFoundException("Sipariş bulunamadı.");
    if (userId && order.userId !== userId) throw new ForbiddenException("Bu siparişe erişim izniniz yok.");
    // Kalem seçenek DETAYLARI (2026-08-25, Hasan: panelde "Çift yüz · mat" yetmiyor,
    // "350 gr Kuşe · mat selefon" gibi teknik açıklama da görünmeli). Seçimler ürünün
    // GÜNCEL şemasındaki etiket + alt açıklamayla (optionSublabel) eşlenir. Salt
    // görüntüleme; şeması değişmiş eski siparişte eşleşmeyen seçim sessizce atlanır.
    const pIds = [...new Set(order.items.map((i) => i.productId).filter((v): v is string => !!v))];
    const optProducts = pIds.length
      ? await this.prisma.product.findMany({
          where: { id: { in: pIds } },
          select: { id: true, options: { orderBy: [{ groupSort: "asc" }, { optionSort: "asc" }] } },
        })
      : [];
    const optsById = new Map(optProducts.map((p) => [p.id, p.options]));
    const items = order.items.map((it) => {
      // designUploads yalnız panel rollerinde include edilir (yukarıda); müşteride alan yoktur.
      const ham = (it as { designUploads?: Parameters<typeof designRowToPublic>[0][] }).designUploads;
      const driveId = (it as { uploadedFileDriveId?: string | null }).uploadedFileDriveId;
      return {
        ...it,
        optionDetails: optionDetailsFor(optsById.get(it.productId ?? "") ?? [], it.configuration),
        ...(ham ? { designUploads: ham.map(designRowToPublic) } : {}),
        // Müşteri dosyası Drive'a taşındıysa panel "Drive'da aç" basar (2026-09-03). Yalnız panelde.
        ...(ham ? { uploadedFileDriveUrl: driveId ? driveFileUrl(driveId) : null } : {}),
      };
    });
    // Misafir siparişinde FK relation null; snapshot'ı adres olarak yüzeye çıkar (admin detay render).
    return parasalAlanlariAyikla(withAddressView({ ...order, items }), role);
  }

  /**
   * Havale/EFT ödemesini ONAYLA (admin) — para hesaba geçtikten SONRA çağrılır.
   *
   * Neden ayrı uç: havale siparişi paymentStatus="beklemede" açılır, çünkü para
   * otomatik gelmiyor; eşleştirmeyi insan yapar (ekstredeki açıklamada sipariş
   * numarası). Bu uç yalnız ÖDEME durumunu değiştirir, sipariş durumuna DOKUNMAZ:
   * üretime alma kararı admin'in mevcut durum akışında kalır (orada zaten üretim
   * e-postası gidiyor — burada ikinci bir bildirim kurgusu üretmiyoruz).
   *
   * Idempotent: zaten onaylanmış siparişte hata vermez, kaydı aynen döndürür
   * (panelde çift tıklama kazası ↔ çift onay logu üretmesin).
   */
  async odemeOnayla(
    id: string,
    actor?: { actorId?: string | null; ipAddress?: string | null; role?: string },
  ) {
    const order = await this.prisma.order.findUnique({
      where: { id },
      select: { id: true, orderNumber: true, paymentStatus: true, paymentMethod: true, total: true },
    });
    if (!order) throw new NotFoundException("Sipariş bulunamadı.");
    if (order.paymentMethod !== ODEME_YONTEMI.havale) {
      throw new BadRequestException(
        "Bu işlem yalnızca havale/EFT siparişleri içindir; kart ödemeleri otomatik onaylanır.",
      );
    }
    if (order.paymentStatus === "basarili") return order;

    const updated = await this.prisma.order.update({
      where: { id },
      data: { paymentStatus: "basarili" },
    });

    // Denetim kaydı — parayı kimin onayladığı izlenebilir olmalı (mali sorumluluk).
    // Yazım hatası onayı bozmaz.
    await this.prisma.auditLog
      .create({
        data: {
          actorId: actor?.actorId ?? null,
          entityType: "Order",
          entityId: id,
          action: "havale_odeme_onay",
          diff: {
            orderNumber: order.orderNumber,
            tutar: String(order.total),
            paymentStatus: { from: order.paymentStatus, to: "basarili" },
            role: actor?.role ?? null,
          },
          ipAddress: actor?.ipAddress ?? null,
        },
      })
      .catch((e) => console.error("[audit] havale onayı denetim kaydı yazılamadı:", e?.message));

    /**
     * Sunucu-taraflı Purchase dönüşümü — havalede TEK KAYNAK burasıdır.
     *
     * Kartta dönüşümü tarayıcı ateşler (başarı sayfası). Havalede o an para
     * GELMEMİŞTİR; ödenmemiş siparişi dönüşüm saymak Ads/GA4'ü şişirir. Bu
     * yüzden istemci havale siparişinde purchase ATEŞLEMEZ (bkz.
     * /odeme/basarili/[orderId]/page.tsx) ve gerçek dönüşüm PARANIN GELDİĞİ
     * an, yani burada bildirilir.
     *
     * Meta CAPI event_id = orderNumber olduğundan tekrar çağrılsa bile Meta
     * tarafında tekilleşir; ayrıca bu uç idempotent (zaten onaylıysa yukarıda
     * döner), dolayısıyla çift sayım iki katmanda da engellenmiş olur.
     * Pazarlama onayı yoksa sendPurchase kendi içinde atlar (KVKK).
     * Hata dönüşü ödemeyi bozmaz — void + catch.
     */
    void this.metaCapi.sendPurchase(id).catch(() => undefined);

    return updated;
  }

  async updateStatus(
    id: string,
    status: string,
    extras?: { trackingNumber?: string; trackingCarrier?: string },
    actor?: { actorId?: string | null; ipAddress?: string | null; role?: string },
  ) {
    // State-machine kontrolü: izinsiz geçişleri engelle.
    const current = await this.prisma.order.findUnique({ where: { id }, select: { status: true } });
    if (!current) throw new NotFoundException("Sipariş bulunamadı.");

    // Prisma enum -> URL slug eşlemesi (underscore <-> hyphen).
    const currentSlug = String(current.status).replace(/_/g, "-");
    if (currentSlug !== status) {
      const allowed = validStatusTransitions[currentSlug] ?? [];
      if (!allowed.includes(status)) {
        throw new BadRequestException(
          `Geçersiz durum geçişi: ${currentSlug} → ${status}`,
        );
      }
    }

    // Hyphen slug → Prisma enum üyesi (underscore). DTO @IsIn ile doğrulandığı için normalde
    // null gelmez; yine de defansif kontrol (doğrudan slug yazmak Prisma'da 500 üretiyordu).
    const enumStatus = slugToOrderStatus(status);
    if (!enumStatus) throw new BadRequestException(`Geçersiz sipariş durumu: ${status}`);

    const updated = await this.prisma.order.update({
      where: { id },
      data: {
        status: enumStatus,
        ...extras,
        ...(status === "kargoya-verildi" && { shippedAt: new Date() }),
        ...(status === "teslim-edildi" && { deliveredAt: new Date() }),
      },
    });

    // Mal sevk edildiğinde (kargoya-verildi) Paraşüt e-fatura/e-arşiv kes.
    // Idempotent (parasutInvoiceId varsa atlar) ve hata-izole: fatura başarısız
    // olsa bile sipariş durumu güncellemesi başarılı döner.
    if (status === "kargoya-verildi") {
      await this.issueInvoiceIfNeeded(id);
    }

    // Sipariş İPTAL edilince (terminal, ödenmeyecek) harcanan sadakat puanını müşteriye iade et
    // (ödenmiş-sonra-iptalde kazanımı geri al). Fire-and-forget + flag-gated → iptal akışını bozmaz.
    if (status === "iptal-edildi")
      void this.loyalty.refundForOrder(id).catch(() => undefined);

    // Müşteri bildirimi (fire-and-forget; hata sipariş durumu güncellemesini bozmaz).
    // 2026-08-20: üretim süreci tamamen sessizdi (sipariş onayı → kargo arası hiç mail yok).
    // Hasan kararı: her durum için mail YOK, müşteriyi boğmasın. Bildirilen dört an:
    // sipariş alındı · baskıya verildi · kargoya verildi · teslim edildi.
    // "tasarim-bekleniyor" ve "tasarim-onayindi" BİLEREK sessiz.
    //
    // GERİ ADIMDA MAİL YOK (2026-08-28): geri alma bir DÜZELTMEdir, müşteriyi
    // ilgilendiren bir olay değil. "Kargoya verildi"yi yanlışlıkla işaretleyip geri alan
    // admin, müşteriye ikinci bir bildirim göndermiş olmamalı. İleri gidince yine gider.
    const geriAdim = isGeriAdim(currentSlug, status);
    if (geriAdim) this.logger.log(`Durum geri alındı (mail gönderilmedi): ${currentSlug} → ${status} order=${id}`);
    // "Tasarım Onaylandı" (2026-09-03, Hasan): müşteriye mail YOK; yalnız üretim/kargo ekibine
    // (kargo@) bildirim gider ki işi üretime alsın. Geri adımda gitmez.
    if (!geriAdim && status === "tasarim-onaylandi")
      void this.mail.sendDesignApprovedProductionEmail(id).catch(() => undefined);
    if (!geriAdim && status === "uretimde")
      void this.mail.sendOrderInProductionEmail(id).catch(() => undefined);
    if (!geriAdim && status === "kargoya-verildi")
      void this.mail
        .sendOrderShippedEmail(id, { number: extras?.trackingNumber, carrier: extras?.trackingCarrier })
        .catch(() => undefined);
    if (!geriAdim && status === "teslim-edildi")
      void this.mail.sendOrderDeliveredEmail(id).catch(() => undefined);
    // İptal bildirimi — YALNIZ parası alınmış (veya cari) siparişte. Ödemesi hiç
    // tamamlanmamış siparişin iptali müşteriyi ilgilendirmeyen bir kayıt temizliğidir;
    // mail atmak "yeni siparişim mi iptal oldu?" paniğine yol açıyor (2026-09-03, Hasan).
    // Kural + testler: iptal-mail-kurali.ts
    if (status === "iptal-edildi") {
      const iptalMaili = iptalMailiGonderilirMi({
        paymentMethod: updated.paymentMethod,
        paymentStatus: updated.paymentStatus ? String(updated.paymentStatus) : null,
      });
      if (iptalMaili) void this.mail.sendOrderCancelledEmail(id).catch(() => undefined);
      else
        this.logger.log(
          `İptal maili gönderilmedi (ödeme alınmamış): order=${id} yöntem=${updated.paymentMethod ?? "-"} durum=${String(updated.paymentStatus ?? "-")}`,
        );
    }

    // Denetim izi: hangi admin, hangi IP, önce→sonra durum değişikliği. Best-effort —
    // audit yazımı hatası sipariş güncellemesini bozmaz.
    await this.prisma.auditLog
      .create({
        data: {
          actorId: actor?.actorId ?? null,
          entityType: "Order",
          entityId: id,
          action: "status_change",
          diff: { from: currentSlug, to: status, tracking: extras?.trackingNumber ?? null },
          ipAddress: actor?.ipAddress ?? null,
        },
      })
      .catch((e) => console.error("[audit] updateStatus denetim kaydı yazılamadı:", e?.message));

    // Kaydetme yaniti da filtreden gecer: aksi halde kargo rolu takip no yazdigi
    // anda tam siparis satirini (tutar, odeme, fatura kimligi) yanit govdesinde gorurdu.
    return parasalAlanlariAyikla(updated, actor?.role);
  }

  /**
   * Takip no / kargo firmasını yazar. Durum DEĞİŞMEZ, müşteriye bildirim GİTMEZ.
   *
   * updateStatus'tan ayrı tutulmasının sebebi: orada "kargoya-verildi" mail tetikliyor.
   * Takip numarasını sonradan eklemek/düzeltmek her seferinde müşteriye kargo maili
   * atmamalı. Boş string → null (kolonu temizler); undefined → dokunulmaz.
   */
  async updateTracking(
    id: string,
    extras: { trackingNumber?: string; trackingCarrier?: string },
    actor?: { actorId?: string | null; ipAddress?: string | null; role?: string },
  ) {
    const current = await this.prisma.order.findUnique({
      where: { id },
      select: { trackingNumber: true, trackingCarrier: true },
    });
    if (!current) throw new NotFoundException("Sipariş bulunamadı.");

    // "" gelirse temizle, undefined gelirse hiç dokunma (kısmi güncelleme).
    const norm = (v?: string) => (v === undefined ? undefined : v.trim() === "" ? null : v.trim());
    const data = {
      ...(norm(extras.trackingNumber) !== undefined && { trackingNumber: norm(extras.trackingNumber) }),
      ...(norm(extras.trackingCarrier) !== undefined && { trackingCarrier: norm(extras.trackingCarrier) }),
    };
    if (Object.keys(data).length === 0) return current;

    const updated = await this.prisma.order.update({ where: { id }, data });

    await this.prisma.auditLog
      .create({
        data: {
          actorId: actor?.actorId ?? null,
          entityType: "Order",
          entityId: id,
          action: "tracking_update",
          diff: {
            from: { number: current.trackingNumber, carrier: current.trackingCarrier },
            to: { number: updated.trackingNumber, carrier: updated.trackingCarrier },
          },
          ipAddress: actor?.ipAddress ?? null,
        },
      })
      .catch((e) => console.error("[audit] updateTracking denetim kaydı yazılamadı:", e?.message));

    // Kaydetme yaniti da filtreden gecer: aksi halde kargo rolu takip no yazdigi
    // anda tam siparis satirini (tutar, odeme, fatura kimligi) yanit govdesinde gorurdu.
    return parasalAlanlariAyikla(updated, actor?.role);
  }

  /**
   * Sipariş için Paraşüt faturası kes (henüz kesilmemişse). Tüm hataları yutar —
   * çağıran akışı (sipariş durumu güncelleme) ASLA bozulmaz. Paraşüt yapılandırılmamışsa
   * servis no-op döner. Başarılı faturada Order.parasutInvoiceId güncellenir.
   */
  private async issueInvoiceIfNeeded(orderId: string): Promise<void> {
    try {
      const o = await this.prisma.order.findUnique({
        where: { id: orderId },
        select: { parasutInvoiceId: true },
      });
      if (!o || o.parasutInvoiceId) return; // zaten fatura var → çift kesme

      const res = await this.parasut.createInvoiceFromOrder(orderId);
      if (res.status === "issued" && res.invoiceId) {
        await this.prisma.order.update({
          where: { id: orderId },
          data: { parasutInvoiceId: res.invoiceId },
        });
        this.logger.log(`Paraşüt faturası bağlandı: order=${orderId} invoice=${res.invoiceId}`);
      } else if (res.status === "failed") {
        this.logger.warn(`Paraşüt faturası kesilemedi (akış bozulmadı): order=${orderId}`);
      }
    } catch (e) {
      // createInvoiceFromOrder kendi içinde yakalıyor; bu defansif son kalkan.
      this.logger.error(`issueInvoiceIfNeeded beklenmedik hata order=${orderId}: ${(e as Error).message}`);
    }
  }
  /** Admin mail-önizleme köprüleri — müşteriye değil, verilen adrese gönderir (controller: mail-onizleme). */
  async mailOnizlemeSiparisAlindi(orderId: string, alici: string): Promise<boolean> {
    return this.mail.sendOrderConfirmationEmail(orderId, alici);
  }
  async mailOnizlemeKargoyaVerildi(
    orderId: string,
    alici: string,
    tracking?: { number?: string; carrier?: string },
  ): Promise<boolean> {
    return this.mail.sendOrderShippedEmail(orderId, tracking, alici);
  }

}
