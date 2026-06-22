/**
 * Sunucu tarafı konfigüratör fiyat motoru — toplamsal model (product_options/product_prices).
 *
 * Fiyat DAİMA sunucuda, ürünün KENDİ options/prices şemasından (DB) + kullanıcının selections
 * seçimlerinden hesaplanır; client'ın bildirdiği fiyata GÜVENİLMEZ (fiyat manipülasyonu önlenir).
 *
 * @markala/types runtime'da api'ye bundle edilemediği için kasıtlı duplikasyon.
 * Test: orders pricing spec.
 */

type Selections = Record<string, unknown>;

function num(v: unknown): number {
  const n = typeof v === "number" ? v : Number(v);
  return Number.isFinite(n) ? n : 0;
}

// ---------------------------------------------------------------------------
// Toplamsal motor — Global Constraints sözleşmesi (product_options/product_prices)
// ---------------------------------------------------------------------------

interface PricingOption { groupKey: string; groupLabel: string; groupRole: "dimension"|"priced"; groupSort: number; optionKey: string; optionLabel: string; optionSublabel?: string|null; optionSort: number; }
interface PricingPriceRow { groupKey?: string|null; optionKey?: string|null; dimKey?: string|null; price: number|string; cost?: number|string|null; }

export function computeConfiguredPrice(options: PricingOption[], prices: PricingPriceRow[], selections: Record<string, string>): number {
  const sels = selections && typeof selections === "object" ? selections : {};
  const opts = Array.isArray(options) ? options : [];
  const rows = Array.isArray(prices) ? prices : [];

  // Grupla + sırala
  const groupMap = new Map<string, { key: string; role: "dimension"|"priced"; sort: number }>();
  for (const o of opts) {
    if (!groupMap.has(o.groupKey)) groupMap.set(o.groupKey, { key: o.groupKey, role: o.groupRole, sort: o.groupSort });
  }
  const groups = [...groupMap.values()].sort((a, b) => a.sort - b.sort);

  if (groups.length === 0) {
    const row = rows.find((p) => p.groupKey == null && p.optionKey == null);
    return row ? Math.max(0, num(row.price)) : 0;
  }

  // Fiyat-boyutu: ilk non-adet dimension; yoksa tek dimension
  const dims = groups.filter((g) => g.role === "dimension");
  const priceDimKey = dims.length ? (dims.find((g) => g.key !== "adet") ?? dims[0]).key : null;
  const dimSel = priceDimKey ? sels[priceDimKey] : undefined;

  // Birim = Σ priced gruplar
  let unit = 0;
  for (const g of groups) {
    if (g.role !== "priced") continue;
    const sel = sels[g.key];
    if (!sel) continue;
    const row = rows.find((p) => p.groupKey === g.key && p.optionKey === sel && (dimSel ? p.dimKey === dimSel : p.dimKey == null));
    if (row) unit += num(row.price);
  }

  // Adet çarpanı: fiyat-boyutu OLMAYAN "adet" dimension
  let qty = 1;
  const adet = groups.find((g) => g.role === "dimension" && g.key === "adet" && g.key !== priceDimKey);
  if (adet) {
    const n = Number(sels[adet.key]);
    if (Number.isFinite(n) && n > 0) qty = n;
  }
  return Math.max(0, unit * qty);
}

/** Sipariş kaleminin `configuration` JSON'undan konfigüratör seçimlerini güvenle çıkarır. */
export function extractSelections(config: unknown): Selections {
  if (config && typeof config === "object" && "selections" in config) {
    const s = (config as Record<string, unknown>).selections;
    if (s && typeof s === "object") return s as Selections;
  }
  return {};
}

/** Client'ın hazırladığı insanca özet varsa onu kullan; yoksa fallback (örn. summarizeConfiguration). */
export function pickConfigurationSummary(config: unknown, fallback: string): string {
  if (config && typeof config === "object") {
    const s = (config as Record<string, unknown>).summary;
    if (typeof s === "string" && s.trim()) return s.trim().slice(0, 500);
  }
  return fallback;
}
