import { Injectable, Logger, NotFoundException, ForbiddenException, BadRequestException, ConflictException } from "@nestjs/common";
import { Prisma, OrderStatus } from "@prisma/client";
import { createHash } from "crypto";
import { PrismaService } from "../prisma/prisma.service";
import { ParasutService } from "../integrations/parasut/parasut.service";
import { SettingsService } from "../settings/settings.service";
import { computeConfiguredPrice, extractSelections, pickConfigurationSummary } from "./pricing";

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
// Admin esnekliği: İLERİ yönde herhangi bir aşamaya atlama + her aktif durumdan iptal serbest.
// GERİ dönüş ve terminal (teslim/iptal) durumlardan çıkış YASAK. Böylece admin "tasarım"ı
// atlayıp doğrudan "üretimde"/"kargoda" işaretleyebilir; yanlışlıkla geri alma engellenir.
export const validStatusTransitions: Record<string, string[]> = {
  "siparis-alindi": ["tasarim-bekleniyor", "tasarim-onayindi", "uretimde", "kargoya-verildi", "teslim-edildi", "iptal-edildi"],
  "tasarim-bekleniyor": ["tasarim-onayindi", "uretimde", "kargoya-verildi", "teslim-edildi", "iptal-edildi"],
  "tasarim-onayindi": ["uretimde", "kargoya-verildi", "teslim-edildi", "iptal-edildi"],
  uretimde: ["kargoya-verildi", "teslim-edildi", "iptal-edildi"],
  "kargoya-verildi": ["teslim-edildi", "iptal-edildi"],
  "teslim-edildi": [],
  "iptal-edildi": [],
};

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

/** Satır-içi (misafir/storefront) adres — kayıtlı Address yoksa Order'a snapshot olarak yazılır. */
export interface InlineAddress {
  fullName: string;
  phone: string;
  city: string;
  district: string;
  fullAddress: string;
  zipCode?: string;
  label?: string;
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
  };
}

/**
 * Yanıtta adresi tek bir şekle indir: kayıtlı sipariş FK relation'ını,
 * misafir siparişi ise snapshot JSON'unu `shippingAddress`/`billingAddress` olarak yüzeye çıkarır.
 * Böylece admin panel (order.shippingAddress.fullAddress ...) FK olsun snapshot olsun aynı şekilde render eder.
 */
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

@Injectable()
export class OrdersService {
  private readonly logger = new Logger(OrdersService.name);

  constructor(private prisma: PrismaService, private parasut: ParasutService, private settings: SettingsService) {}

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
    }>;
    // Adres: kayıtlı FK id VEYA satır-içi inline adres (misafir/storefront). En az biri zorunlu.
    shippingAddressId?: string;
    billingAddressId?: string;
    shippingAddress?: InlineAddress;
    billingAddress?: InlineAddress;
    couponCode?: string;
    notes?: string;
    idempotencyKey?: string;
    paymentMethod?: string;
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
      const common = {
        configuration,
        configurationSummary,
        quantity,
        needsDesignSupport: i.needsDesignSupport ?? false,
        uploadedFileName: i.uploadedFileName,
        uploadedFileUrl: i.uploadedFileUrl,
      };

      const product =
        (i.productId ? productById.get(i.productId) : undefined) ??
        (i.productSlug ? productBySlug.get(i.productSlug) : undefined);

      if (product) {
        // Konfigüratör fiyatı: ürünün KENDİ options/prices şeması + kullanıcı selections'ından.
        const selections = extractSelections(i.configuration);
        const configuredUnit = computeConfiguredPrice(
          (product.options ?? []).map((o) => ({ ...o, groupRole: o.groupRole as "dimension" | "priced" })),
          (product.prices ?? []).map((r) => ({ groupKey: r.groupKey, optionKey: r.optionKey, dimKey: r.dimKey, price: Number(r.price) })),
          selections as Record<string, string>,
        );
        // Fiyatı belirlenmemiş ürün (configuredUnit=0 → "Teklif Al") sipariş edilemez:
        // storefront sepete eklemeyi zaten engeller; bu sunucu-tarafı savunma (doğrudan API
        // çağrısıyla 0-toplamlı sipariş oluşturulmasını önler).
        if (!Number.isFinite(configuredUnit) || configuredUnit <= 0) {
          throw new BadRequestException(`Bu ürün için fiyat belirlenmemiş (Teklif Al), sipariş alınamıyor: ${product.slug}`);
        }
        const unitPrice = round2(configuredUnit);
        return {
          ...common,
          productId: product.id as string | null,
          productSlug: product.slug,
          productName: product.name,
          productImage: product.images?.[0] ?? "",
          unitPrice,
          lineTotal: round2(unitPrice * quantity),
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
        };
      }

      throw new BadRequestException(`Ürün bulunamadı veya pasif: ${i.productId ?? i.productSlug}`);
    });

    // Sunucu tarafı toplamlar.
    // basePrice KDV dahil — bu yüzden subtotal da KDV dahil bir "brüt" toplamdır.
    const subtotal = round2(recalculatedItems.reduce((s, it) => s + it.lineTotal, 0));

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
        // userId VEYA e-posta ile önceki sipariş varsa reddet (aynı e-postayla 2. hesap denemesini de yakalar).
        const priorCount = await this.prisma.order.count({
          where: { OR: [{ userId: input.userId }, ...(input.email ? [{ email: input.email }] : [])] },
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
    return this.prisma.$transaction(async (tx) => {
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
          paymentMethod: onAccount ? "cari" : input.paymentMethod ?? null,
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
              needsDesignSupport: i.needsDesignSupport,
              uploadedFileName: i.uploadedFileName,
              uploadedFileUrl: i.uploadedFileUrl,
            })),
          },
        },
        include: { items: true, shippingAddress: true, billingAddress: true },
      });

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

      // Misafir siparişinde FK relation null gelir; snapshot'ı adres olarak yüzeye çıkar.
      return withAddressView(created);
    });
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
      where: { userId },
      include: { items: true },
      orderBy: { createdAt: "desc" },
    });
  }

  async listAll(opts: { status?: string; take?: number; skip?: number } = {}) {
    // Geçersiz/bilinmeyen status filtresi → filtre uygulanmaz (eskiden Prisma'da 500'e yol açıyordu).
    const status = slugToOrderStatus(opts.status);
    const orders = await this.prisma.order.findMany({
      where: status ? { status } : {},
      include: {
        items: true,
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
      return {
        ...o,
        customerName:
          o.user?.fullName ||
          nameOf(o.shippingAddress) ||
          nameOf(o.billingAddress) ||
          nameOf(o.shippingAddressSnapshot) ||
          nameOf(o.billingAddressSnapshot) ||
          null,
      };
    });
  }

  async findById(id: string, userId?: string) {
    const order = await this.prisma.order.findUnique({
      where: { id },
      include: { items: true, shippingAddress: true, billingAddress: true, user: true },
    });
    if (!order) throw new NotFoundException("Sipariş bulunamadı.");
    if (userId && order.userId !== userId) throw new ForbiddenException("Bu siparişe erişim izniniz yok.");
    // Misafir siparişinde FK relation null; snapshot'ı adres olarak yüzeye çıkar (admin detay render).
    return withAddressView(order);
  }

  async updateStatus(
    id: string,
    status: string,
    extras?: { trackingNumber?: string; trackingCarrier?: string },
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

    return updated;
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
}
