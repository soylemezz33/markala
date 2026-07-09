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

interface PricingOption { groupKey: string; groupLabel: string; groupRole: "dimension"|"priced"; groupSort: number; optionKey: string; optionLabel: string; optionSublabel?: string|null; optionSort: number; locked?: boolean; rules?: OptionRules | null; }
interface PricingPriceRow { groupKey?: string|null; optionKey?: string|null; dimKey?: string|null; price: number|string; cost?: number|string|null; }

// ---------------------------------------------------------------------------
// Fix 1+2 — Kural (rules) ve kilitli (locked) seçenek normalizasyonu
// Web configurator.ts ile birebir aynı mantık (resolveRules + effectiveSelections).
// ---------------------------------------------------------------------------

/** Option başına kurallar şeması — web configurator.ts OptionRulesLite ile birebir. */
export interface OptionRules {
  disablesGroups?: string[];
  forcesOption?: { groupKey: string; optionKey: string };
}

/**
 * Aktif seçimlerin rules'larını toplar.
 * Sadece SEÇİLİ olan option'ların rules'ları geçerlidir (web ile birebir davranış).
 */
export function resolveRules(
  opts: PricingOption[],
  selections: Record<string, string>,
): { disabledGroups: Set<string>; forced: Record<string, string> } {
  const disabledGroups = new Set<string>();
  const forced: Record<string, string> = {};
  for (const o of opts) {
    if (selections[o.groupKey] !== o.optionKey) continue; // sadece SEÇİLİ option'ın rules'ı
    const r = o.rules;
    if (!r) continue;
    for (const g of r.disablesGroups ?? []) disabledGroups.add(g);
    if (r.forcesOption) forced[r.forcesOption.groupKey] = r.forcesOption.optionKey;
  }
  return { disabledGroups, forced };
}

/**
 * Efektif seçimler = selections + forced, pasif gruplar çıkarılmış.
 * Ayrıca locked=true olan gruplar için client seçimi yok sayılır → grubun
 * optionSort en küçük option'ı (default) zorlanır.
 * Pasif gruplar (disabledGroups) fiyata katılmaz.
 */
export function effectiveSelections(
  opts: PricingOption[],
  selections: Record<string, string>,
  resolved: { disabledGroups: Set<string>; forced: Record<string, string> },
): Record<string, string> {
  // SIRA web ile BİREBİR olmalı (görülen=tahsil): locked-default ÖNCE, forced SONRA.
  // Web'de initSelections locked grubu default'a tohumlar, sonra effectiveSelections forced'ı
  // üstüne yazar → forcesOption locked gruba da uygulanır (forced kazanır). Burada da aynı sıra.
  const result: Record<string, string> = { ...selections };

  // locked=true → o grup için client seçimi yok sayılır; optionSort en küçük default zorlanır
  const lockedDefaults = new Map<string, { optionKey: string; optionSort: number }>();
  for (const o of opts) {
    if (!o.locked) continue;
    const cur = lockedDefaults.get(o.groupKey);
    if (!cur || o.optionSort < cur.optionSort) {
      lockedDefaults.set(o.groupKey, { optionKey: o.optionKey, optionSort: o.optionSort });
    }
  }
  for (const [groupKey, { optionKey }] of lockedDefaults) {
    result[groupKey] = optionKey;
  }

  // forced (locked-default'u dahil ezer — web davranışıyla aynı, forcesOption locked gruba da uygulanır)
  Object.assign(result, resolved.forced);

  // disabledGroups çıkar
  for (const g of resolved.disabledGroups) {
    delete result[g];
  }
  return result;
}

/**
 * Ürün option'larından rules+locked normalizasyonu uygulanmış efektif selections döndürür.
 * Kural/locked yoksa selections değişmeden gelir (geriye uyumlu, sıfır maliyet).
 */
export function normalizeSelections(
  opts: PricingOption[],
  rawSelections: Record<string, string>,
): Record<string, string> {
  // Hiç rules/locked yoksa erken çık (yaygın durum — performans)
  const hasRulesOrLocked = opts.some((o) => o.rules || o.locked);
  if (!hasRulesOrLocked) return rawSelections;

  const resolved = resolveRules(opts, rawSelections);
  return effectiveSelections(opts, rawSelections, resolved);
}

/**
 * Hacim/adet indirimi kademesi — YALNIZ "adet" ayrı bir çarpan-boyutu olan (lineer fiyatlı)
 * ürünlerde uygulanır (İSG levhaları: birim × adet). Matris ürünler (kartvizit/broşür, adet
 * fiyat-boyutu → qty=1) ve area ürünler (computeAreaPrice) bu yoldan GEÇMEZ = etkilenmez.
 * ⚠️ web configurator.ts'teki volumeDiscountRate ile BİREBİR AYNI olmalı (client/server parite).
 */
export function volumeDiscountRate(qty: number): number {
  if (qty >= 250) return 0.35;
  if (qty >= 100) return 0.28;
  if (qty >= 50) return 0.22;
  if (qty >= 25) return 0.15;
  if (qty >= 10) return 0.08;
  return 0;
}

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
  // Hacim indirimi: yalnız lineer adet-çarpanlı ürünlerde (İSG). round2 = web ile parite.
  const gross = unit * qty * (1 - volumeDiscountRate(qty));
  return Math.round(Math.max(0, gross) * 100) / 100;
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
    if (typeof s === "string" && s.trim()) {
      const trimmed = s.trim();
      if (trimmed.length > 500) return trimmed.slice(0, 497) + "…";
      return trimmed;
    }
  }
  return fallback;
}

// ---------------------------------------------------------------------------
// m² Maliyet Motoru (pricingMode="area") — vinilturk maliyet → satış
// configurator.ts (web) ile BİREBİR aynı mantık. Test: pricing.spec.ts.
// ---------------------------------------------------------------------------

export interface PricingSettings { kur: number; marj: number; kdv: number; minM2: number }
// Fallback yalnız settings fetch düşerse kullanılır; canlı işletme değeriyle eşit tutulur (marj 1.2).
export const DEFAULT_PRICING: PricingSettings = { kur: 46, marj: 1.2, kdv: 0.2, minM2: 1 };
export interface AreaOptionRules {
  effect?: "perM2" | "perM2Add" | "perPerimeter" | "conditional" | "perPiece";
  birim?: "dolar" | "tl";
  maxM2?: number;
}
type AreaOption = PricingOption & { rules?: AreaOptionRules | null };

const round2 = (n: number) => Math.round(n * 100) / 100;

/**
 * m² bazlı fiyat: maliyet (cost) × marj × kur, etki tipine göre.
 * - perM2/perM2Add: tl × toplamAlan (min minM2)
 * - perPerimeter: tl × çevre(m) × adet
 * - conditional: alan<1 m² ise tl × adet
 * - perPiece: tl × adet (takım)
 * Dönüş: { haric, dahil } (KDV hariç/dahil, TL, 2 ondalık).
 */
export function computeAreaPrice(
  options: AreaOption[],
  prices: PricingPriceRow[],
  selections: Record<string, string>,
  settings: PricingSettings = DEFAULT_PRICING,
): { haric: number; dahil: number } {
  const sels = selections && typeof selections === "object" ? selections : {};
  const opts = Array.isArray(options) ? options : [];
  const rows = Array.isArray(prices) ? prices : [];
  const { kur, marj, kdv, minM2 } = settings;

  const en = num(sels.en);
  const boy = num(sels.boy);
  let adet = Number(sels.adet);
  if (!Number.isFinite(adet) || adet < 1) adet = 1;

  const alan = (en * boy) / 10000;
  const toplamAlan = Math.max(minM2, alan * adet);
  const cevre = ((en + boy) * 2) / 100;

  const role = new Map<string, "dimension" | "priced">();
  for (const o of opts) if (!role.has(o.groupKey)) role.set(o.groupKey, o.groupRole);

  let maliyet = 0;
  for (const [gKey, r] of role) {
    if (r !== "priced") continue;
    const sel = sels[gKey];
    if (!sel) continue;
    const optMeta = opts.find((o) => o.groupKey === gKey && o.optionKey === sel);
    const row = rows.find((p) => p.groupKey === gKey && p.optionKey === sel);
    if (!row) continue;
    const cost = num(row.cost ?? row.price);
    const rules: AreaOptionRules = optMeta?.rules ?? {};
    const tl = rules.birim === "tl" ? cost : cost * kur;
    switch (rules.effect ?? "perM2") {
      case "perM2":
      case "perM2Add":
        maliyet += tl * toplamAlan;
        break;
      case "perPerimeter":
        maliyet += tl * cevre * adet;
        break;
      case "conditional":
        if (alan < 1) maliyet += tl * adet;
        break;
      case "perPiece":
        maliyet += tl * adet;
        break;
    }
  }

  const haric = Math.max(0, maliyet * marj);
  const dahil = haric * (1 + kdv);
  return { haric: round2(haric), dahil: round2(dahil) };
}
