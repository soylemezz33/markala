import type { Product } from "@markala/types";

// ---------------------------------------------------------------------------
// Faz C — Toplamsal fiyat motoru (API pricing.ts ile birebir aynı mantık)
// ---------------------------------------------------------------------------

/** DB product_options satırına karşılık gelen tip */
interface PricingOption {
  groupKey: string;
  groupLabel: string;
  groupRole: "dimension" | "priced";
  groupSort: number;
  optionKey: string;
  optionLabel: string;
  optionSublabel?: string | null;
  optionSort: number;
}

/** DB product_prices satırına karşılık gelen tip */
interface PricingPriceRow {
  groupKey?: string | null;
  optionKey?: string | null;
  dimKey?: string | null;
  price: number | string;
  cost?: number | string | null;
}

function _num(v: unknown): number {
  const n = typeof v === "number" ? v : Number(v);
  return Number.isFinite(n) ? n : 0;
}

/**
 * Toplamsal fiyat motoru — API pricing.ts ile birebir aynı.
 * Güvenli fiyat hesabı için client'ta da aynı mantık çalışır.
 */
export function computeConfiguredPrice(
  options: PricingOption[],
  prices: PricingPriceRow[],
  selections: Record<string, string>,
): number {
  const sels = selections && typeof selections === "object" ? selections : {};
  const opts = Array.isArray(options) ? options : [];
  const rows = Array.isArray(prices) ? prices : [];

  // Grupla + sırala
  const groupMap = new Map<string, { key: string; role: "dimension" | "priced"; sort: number }>();
  for (const o of opts) {
    if (!groupMap.has(o.groupKey))
      groupMap.set(o.groupKey, { key: o.groupKey, role: o.groupRole, sort: o.groupSort });
  }
  const groups = [...groupMap.values()].sort((a, b) => a.sort - b.sort);

  if (groups.length === 0) {
    const row = rows.find((p) => p.groupKey == null && p.optionKey == null);
    return row ? Math.max(0, _num(row.price)) : 0;
  }

  // Fiyat-boyutu: ilk non-adet dimension; yoksa tek dimension
  const dims = groups.filter((g) => g.role === "dimension");
  const priceDimGroup = dims.length
    ? (dims.find((g) => g.key !== "adet") ?? dims[0])
    : null;
  const priceDimKey = priceDimGroup?.key ?? null;
  const dimSel = priceDimKey ? sels[priceDimKey] : undefined;

  // Birim = Σ priced gruplar
  let unit = 0;
  for (const g of groups) {
    if (g.role !== "priced") continue;
    const sel = sels[g.key];
    if (!sel) continue;
    const row = rows.find(
      (p) =>
        p.groupKey === g.key &&
        p.optionKey === sel &&
        (dimSel ? p.dimKey === dimSel : p.dimKey == null),
    );
    if (row) unit += _num(row.price);
  }

  // Adet çarpanı: fiyat-boyutu OLMAYAN "adet" dimension
  let qty = 1;
  const adet = groups.find(
    (g) => g.role === "dimension" && g.key === "adet" && g.key !== priceDimKey,
  );
  if (adet) {
    const n = Number(sels[adet.key]);
    if (Number.isFinite(n) && n > 0) qty = n;
  }
  return Math.max(0, unit * qty);
}

/**
 * Ürünün options/prices listesinden toplam fiyat hesaplar.
 * Selections: { [groupKey]: optionKey }
 */
export function calculateTotal(
  product: Product,
  selections: Record<string, string>,
): number {
  return computeConfiguredPrice(
    (product.options ?? []) as unknown as PricingOption[],
    (product.prices ?? []) as unknown as PricingPriceRow[],
    selections,
  );
}

/**
 * Ürünün options listesinden her grup için ilk option'ı (optionSort'a göre) seçer.
 * Yeni konfigüratör UI için başlangıç seçimleri.
 */
export function initSelections(product: Product): Record<string, string> {
  const opts = (product.options ?? []) as unknown as PricingOption[];
  const result: Record<string, string> = {};
  // Her grup için optionSort en küçük olanı seç
  const seen = new Map<string, { optionKey: string; optionSort: number }>();
  for (const o of opts) {
    const existing = seen.get(o.groupKey);
    if (!existing || o.optionSort < existing.optionSort) {
      seen.set(o.groupKey, { optionKey: o.optionKey, optionSort: o.optionSort });
    }
  }
  for (const [groupKey, { optionKey }] of seen) {
    result[groupKey] = optionKey;
  }
  return result;
}

/**
 * Konfigürasyon özeti — her grup için seçili option label'ı " · " ile birleştirir.
 * Yeni konfigüratör UI için. Eski buildSummary (parameters-tabanlı) Task 6'ya kadar kalır.
 */
export function buildSelectionSummary(
  product: Product,
  selections: Record<string, string>,
  needsDesign: boolean,
): string {
  const opts = (product.options ?? []) as unknown as PricingOption[];
  // Grupları groupSort'a göre sırala
  const groupMap = new Map<string, { sort: number; label?: string }>();
  for (const o of opts) {
    if (!groupMap.has(o.groupKey))
      groupMap.set(o.groupKey, { sort: o.groupSort, label: o.groupLabel });
  }
  const groups = [...groupMap.entries()].sort((a, b) => a[1].sort - b[1].sort);

  const parts: string[] = [];
  for (const [groupKey] of groups) {
    const sel = selections[groupKey];
    if (!sel) continue;
    const opt = opts.find((o) => o.groupKey === groupKey && o.optionKey === sel);
    if (opt) parts.push(opt.optionLabel);
  }
  if (needsDesign) parts.push("Tasarım desteği isteniyor");
  return parts.join(" · ");
}


export function getInstallmentAmount(total: number, count = 3): number {
  return total / count;
}

/**
 * Kartlarda/listelerde/favorilerde gösterilen fiyat.
 * Faz C: API'nin hesapladığı displayPrice'ı kullanır (en düşük geçerli fiyat).
 * null/undefined → 0 ("Teklif Al" durumu).
 */
export function getDisplayPrice(product: Product): number {
  return product.displayPrice ?? 0;
}

