/**
 * KÂR MARJI ÇÖZÜMLEME — tek doğruluk kaynağı (2026-08-27, Hasan talebi).
 *
 * Satış fiyatı = maliyet × marj. Marj üç seviyede tanımlanabilir; en özel olan kazanır:
 *
 *      ÜRÜN (products.profit_margin)
 *        ↓ yoksa
 *      KATEGORİ (categories.profit_margin)
 *        ↓ yoksa
 *      GLOBAL (site_settings → pricing.marj)
 *
 * TASARIM KARARI — marj fiyatı KENDİLİĞİNDEN değiştirmez:
 * Fiyatlar `product_prices.price` sütununda saklanır ve müşteriye oradan gösterilir.
 * Marj alanını değiştirmek canlı fiyatları anında oynatsaydı, bir yazım hatası tüm
 * kataloğu yanlış fiyata düşürebilirdi. Bunun yerine marj bir HESAP ARACIDIR:
 * yönetici "marjı uygula" dediğinde fiyatlar maliyetten yeniden hesaplanır (önce önizleme).
 * Böylece maliyet ve satış fiyatı elle de girilebilir olmaya devam eder.
 */

/** Marj çarpanı için makul sınırlar — yazım hatasına (1.8 yerine 18) karşı koruma. */
export const MIN_MARGIN = 1;
export const MAX_MARGIN = 20;

export interface MarginSource {
  /** Ürüne özel marj (products.profit_margin) */
  product?: number | null;
  /** Kategori marjı (categories.profit_margin) */
  category?: number | null;
  /** Global ayar (pricing.marj) */
  global?: number | null;
}

export interface ResolvedMargin {
  margin: number;
  /** Hangi seviyeden geldi — panelde "ürün marjı / kategori marjı / global" rozetini besler. */
  source: "product" | "category" | "global" | "default";
}

const gecerli = (v: unknown): v is number => {
  const n = typeof v === "string" ? Number(v) : (v as number);
  return typeof n === "number" && Number.isFinite(n) && n >= MIN_MARGIN && n <= MAX_MARGIN;
};

/** Marjı öncelik sırasına göre çözer. Hiçbiri geçerli değilse 1.8 (mevcut katalog ortalaması). */
export function resolveMargin(src: MarginSource): ResolvedMargin {
  if (gecerli(src.product)) return { margin: Number(src.product), source: "product" };
  if (gecerli(src.category)) return { margin: Number(src.category), source: "category" };
  if (gecerli(src.global)) return { margin: Number(src.global), source: "global" };
  return { margin: 1.8, source: "default" };
}

/** Maliyetten satış fiyatı — 2 ondalığa yuvarlanır. Maliyet yoksa null (fiyat uydurma). */
export function priceFromCost(cost: number | null | undefined, margin: number): number | null {
  const c = typeof cost === "string" ? Number(cost) : cost;
  if (typeof c !== "number" || !Number.isFinite(c) || c <= 0) return null;
  return Math.round(c * margin * 100) / 100;
}

/** Mevcut fiyat/maliyetten gerçekleşen marj — panelde "şu an %X kâr" göstermek için. */
export function actualMargin(cost: number | null | undefined, price: number | null | undefined): number | null {
  const c = Number(cost);
  const p = Number(price);
  if (!Number.isFinite(c) || !Number.isFinite(p) || c <= 0) return null;
  return Math.round((p / c) * 1000) / 1000;
}
