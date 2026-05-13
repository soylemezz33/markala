import { Injectable, NotFoundException, ForbiddenException, BadRequestException, ConflictException } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { createHash } from "crypto";
import { PrismaService } from "../prisma/prisma.service";

function generateOrderNumber(): string {
  const ts = Date.now().toString(36).toUpperCase();
  const rand = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `MK-${ts}-${rand}`;
}

/** KDV oranı — Markala matbaa ürünleri için %20 (basePrice KDV DAHİL kabul ediliyor). */
const VAT_RATE = 0.2;
/** KDV dahil fiyatları ondalık çarpana çevirmek için (1.20). */
const VAT_DIVISOR = 1 + VAT_RATE;
/** Şu an sabit kargo. Gelecekte adres bölgesine göre dinamikleştirilebilir. */
const DEFAULT_SHIPPING_FEE = 49.9;
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
export const validStatusTransitions: Record<string, string[]> = {
  "siparis-alindi": ["tasarim-bekleniyor", "tasarim-onayindi", "uretimde", "iptal-edildi"],
  "tasarim-bekleniyor": ["tasarim-onayindi", "iptal-edildi"],
  "tasarim-onayindi": ["uretimde", "iptal-edildi"],
  uretimde: ["kargoya-verildi", "iptal-edildi"],
  "kargoya-verildi": ["teslim-edildi"],
  "teslim-edildi": [],
  "iptal-edildi": [],
};

/**
 * Konfigürasyon JSON'undan opsiyonel adet/quantity bilgisini güvenli şekilde okur.
 * Sunucu fiyatlandırması bu değeri kullanabilir (örn. "kartvizit adedi"); ancak
 * client'tan gelen unitPrice/lineTotal asla okunmaz.
 */
function extractConfigQuantity(config: ConfigurationInput): number | null {
  if (!config || typeof config !== "object") return null;
  const c = config as Record<string, unknown>;
  const candidates = [c.quantity, c.adet, c.count];
  for (const v of candidates) {
    if (typeof v === "number" && Number.isFinite(v) && v > 0) return v;
    if (typeof v === "string") {
      const n = Number(v);
      if (Number.isFinite(n) && n > 0) return n;
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

@Injectable()
export class OrdersService {
  constructor(private prisma: PrismaService) {}

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
      productId: string;
      configuration: ConfigurationInput;
      quantity: number;
      needsDesignSupport?: boolean;
      uploadedFileName?: string;
      uploadedFileUrl?: string;
    }>;
    shippingAddressId: string;
    billingAddressId: string;
    couponCode?: string;
    notes?: string;
    idempotencyKey?: string;
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

    // Adresler kullanıcıya ait mi? (auth'lu siparişlerde IDOR koruması)
    if (input.userId) {
      const [shipping, billing] = await Promise.all([
        this.prisma.address.findFirst({ where: { id: input.shippingAddressId, userId: input.userId } }),
        this.prisma.address.findFirst({ where: { id: input.billingAddressId, userId: input.userId } }),
      ]);
      if (!shipping || !billing) {
        throw new ForbiddenException("Belirtilen adrese erişim izniniz yok.");
      }
    }

    // Ürünleri tek seferde çek (active + price snapshot).
    const productIds = Array.from(new Set(input.items.map((i) => i.productId)));
    const products = await this.prisma.product.findMany({
      where: { id: { in: productIds }, isActive: true },
    });
    const productMap = new Map(products.map((p) => [p.id, p]));

    // SECURITY: kalem fiyatlarını her zaman sunucuda Product.basePrice'tan hesapla.
    // Client'tan gelen herhangi bir fiyat alanı tamamen yok sayılır.
    const recalculatedItems = input.items.map((i) => {
      const product = productMap.get(i.productId);
      if (!product) {
        throw new BadRequestException(`Ürün bulunamadı veya pasif: ${i.productId}`);
      }

      const baseQty = Number.isInteger(i.quantity) && i.quantity > 0 ? i.quantity : 1;
      const configQty = extractConfigQuantity(i.configuration);
      // Konfigürasyonda quantity verilmişse (örn. kartvizit "1000 adet" preset'i) o üstün,
      // aksi halde DTO'daki baseQty kullanılır.
      const effectiveQty = configQty ?? baseQty;

      if (!Number.isFinite(effectiveQty) || effectiveQty <= 0 || effectiveQty > MAX_QUANTITY_PER_ITEM) {
        throw new BadRequestException(`Geçersiz adet (${i.productId}).`);
      }

      // basePrice Prisma Decimal -> number; kuruş hassasiyeti için 2 ondalık yuvarlama.
      const unitPriceNum = Number(product.basePrice);
      if (!Number.isFinite(unitPriceNum) || unitPriceNum < 0) {
        throw new BadRequestException(`Ürün fiyatı geçersiz: ${product.slug}`);
      }
      const unitPrice = round2(unitPriceNum);
      const lineTotal = round2(unitPrice * effectiveQty);

      return {
        product,
        configuration: i.configuration ?? {},
        configurationSummary: summarizeConfiguration(i.configuration),
        quantity: effectiveQty,
        unitPrice,
        lineTotal,
        needsDesignSupport: i.needsDesignSupport ?? false,
        uploadedFileName: i.uploadedFileName,
        uploadedFileUrl: i.uploadedFileUrl,
      };
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

      const value = Number(coupon.value);
      if (coupon.type === "percentage") {
        discount = round2((subtotal * value) / 100);
      } else if (coupon.type === "fixed_amount") {
        discount = round2(Math.min(value, subtotal));
      }
      // free_shipping aşağıda shippingFee=0 olarak uygulanır.
      appliedCoupon = { id: coupon.id, code: coupon.code, type: coupon.type };
    }

    const freeShipping = appliedCoupon?.type === "free_shipping";
    const shippingFee = freeShipping ? 0 : DEFAULT_SHIPPING_FEE;

    // basePrice KDV dahil — vat reverse calculation
    // KDV dahil brüt = subtotal (- discount). KDV = brüt − (brüt / 1.20).
    const taxableGross = round2(Math.max(0, subtotal - discount));
    const netBeforeVat = round2(taxableGross / VAT_DIVISOR);
    const vat = round2(taxableGross - netBeforeVat);
    // Toplam = brüt (KDV dahil) + kargo (KDV burada ayrı tutulmuyor).
    const total = round2(taxableGross + shippingFee);

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

      return tx.order.create({
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
          shippingAddressId: input.shippingAddressId,
          billingAddressId: input.billingAddressId,
          notes: finalNotes,
          items: {
            create: recalculatedItems.map((i) => ({
              productId: i.product.id,
              productSlug: i.product.slug,
              productName: i.product.name,
              productImage: i.product.images?.[0] ?? "",
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
    });
  }

  listMine(userId: string) {
    return this.prisma.order.findMany({
      where: { userId },
      include: { items: true },
      orderBy: { createdAt: "desc" },
    });
  }

  listAll(opts: { status?: string; take?: number; skip?: number } = {}) {
    return this.prisma.order.findMany({
      where: opts.status ? { status: opts.status as any } : {},
      include: { items: true, user: { select: { email: true, fullName: true } } },
      orderBy: { createdAt: "desc" },
      take: opts.take ?? 50,
      skip: opts.skip ?? 0,
    });
  }

  async findById(id: string, userId?: string) {
    const order = await this.prisma.order.findUnique({
      where: { id },
      include: { items: true, shippingAddress: true, billingAddress: true, user: true },
    });
    if (!order) throw new NotFoundException("Sipariş bulunamadı.");
    if (userId && order.userId !== userId) throw new ForbiddenException("Bu siparişe erişim izniniz yok.");
    return order;
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

    return this.prisma.order.update({
      where: { id },
      data: {
        status: status as any,
        ...extras,
        ...(status === "kargoya-verildi" && { shippedAt: new Date() }),
        ...(status === "teslim-edildi" && { deliveredAt: new Date() }),
      },
    });
  }
}
