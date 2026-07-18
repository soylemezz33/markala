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
  // Hacim indirimi: yalnız lineer adet-çarpanlı ürünlerde (İSG). round2 = server ile parite.
  const gross = unit * qty * (1 - volumeDiscountRate(qty));
  return Math.round(Math.max(0, gross) * 100) / 100;
}

/**
 * Hacim/adet indirimi kademesi — ⚠️ api pricing.ts'teki volumeDiscountRate ile BİREBİR AYNI
 * olmalı (client/server fiyat paritesi). Yalnız "adet" ayrı çarpan-boyutu olan lineer ürünlerde
 * (İSG levhaları) uygulanır; matris (kartvizit) ve area ürünler etkilenmez.
 */
export function volumeDiscountRate(qty: number): number {
  if (qty >= 250) return 0.35;
  if (qty >= 100) return 0.28;
  if (qty >= 50) return 0.22;
  if (qty >= 25) return 0.15;
  if (qty >= 10) return 0.08;
  return 0;
}

export type TierBadge = "onerilen" | "enAvantajli";

/**
 * Adet (tiraj) satırları için rozet haritası — birim fiyat düşüşünü görünür kılar.
 * - "enAvantajli": en düşük birim fiyatlı kademe (eşitlikte en yüksek adet).
 * - "onerilen": en düşük adetle min birim fiyatın %10 bandına giren tatlı nokta
 *   (müşteri maksimum adede çıkmadan indirimin büyük kısmını alır).
 * Kademeler arası anlamlı fark yoksa (maks/min birim < 1.15) rozet üretilmez —
 * yapay "avantaj" iddiası dürüst-kopya kuralını ihlal eder.
 */
export function adetTierBadges(
  hints: Record<string, number | null> | undefined,
  allowedKeys?: ReadonlySet<string>,
): Record<string, TierBadge> {
  if (!hints) return {};
  const entries = Object.entries(hints)
    .filter(([k]) => !allowedKeys || allowedKeys.has(k))
    .map(([key, total]) => ({ key, qty: Number(key), total }))
    .filter(
      (e): e is { key: string; qty: number; total: number } =>
        Number.isFinite(e.qty) && e.qty > 0 &&
        typeof e.total === "number" && Number.isFinite(e.total) && e.total > 0,
    )
    .map((e) => ({ ...e, unit: e.total / e.qty }));
  if (entries.length < 3) return {};

  const minUnit = Math.min(...entries.map((e) => e.unit));
  const maxUnit = Math.max(...entries.map((e) => e.unit));
  if (maxUnit / minUnit < 1.15) return {};

  const best = entries.reduce((a, b) =>
    b.unit < a.unit || (b.unit === a.unit && b.qty > a.qty) ? b : a,
  );
  const sweet = entries
    .filter((e) => e.key !== best.key && e.qty < best.qty && e.unit <= minUnit * 1.1)
    .sort((a, b) => a.qty - b.qty)[0];

  const out: Record<string, TierBadge> = { [best.key]: "enAvantajli" };
  if (sweet) out[sweet.key] = "onerilen";
  return out;
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
  // Area ürünlerinde ölçü (en×boy) bir opsiyon grubu değil; özete elle ekle.
  if (selections.en && selections.boy) {
    parts.push(`${selections.en}×${selections.boy} cm`);
  }
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

// ---------------------------------------------------------------------------
// Task 5 — Seçenek kartı fiyat ipucu
// ---------------------------------------------------------------------------

/**
 * Her grubun her option'ı için gösterilecek fiyat ipucu (KDV-dahil, ham TL).
 *
 * - priced grup: grup içi en ucuza göre delta (en ucuz → 0, diğerleri pozitif).
 * - adet dimension (fiyat-boyutu DEĞİLSE): o adet seçiliyken hesaplanan TOPLAM.
 * - diğer dimension (ebat vb.): null (ipucu yok).
 *
 * Dönüş: { [groupKey]: { [optionKey]: number | null } }
 * Sayı 0 ise "en ucuz" (delta=0), pozitif ise delta, negatif olamaz.
 * adet grubu için değer tam toplam fiyattır (hintMode="total").
 */
export function optionPriceHints(
  product: Product,
  selections: Record<string, string>,
): Record<string, Record<string, number | null>> {
  const opts = (product.options ?? []) as unknown as PricingOption[];
  const rows = (product.prices ?? []) as unknown as PricingPriceRow[];

  // Grup metadata'sını çıkar
  const groupMap = new Map<string, { key: string; role: "dimension" | "priced"; sort: number }>();
  for (const o of opts) {
    if (!groupMap.has(o.groupKey))
      groupMap.set(o.groupKey, { key: o.groupKey, role: o.groupRole, sort: o.groupSort });
  }
  const groups = [...groupMap.values()].sort((a, b) => a.sort - b.sort);

  if (groups.length === 0) return {};

  // Fiyat-boyutu: ilk non-adet dimension
  const dims = groups.filter((g) => g.role === "dimension");
  const priceDimGroup = dims.length ? (dims.find((g) => g.key !== "adet") ?? dims[0]) : null;
  const priceDimKey = priceDimGroup?.key ?? null;
  const dimSel = priceDimKey ? selections[priceDimKey] : undefined;

  const result: Record<string, Record<string, number | null>> = {};

  for (const g of groups) {
    const optKeysInGroup = opts.filter((o) => o.groupKey === g.key).map((o) => o.optionKey);
    const hints: Record<string, number | null> = {};

    if (g.role === "priced") {
      // Priced grup: delta (grup içi en ucuza göre)
      const prices: Record<string, number> = {};
      for (const optKey of optKeysInGroup) {
        const row = rows.find(
          (p) =>
            p.groupKey === g.key &&
            p.optionKey === optKey &&
            (dimSel ? p.dimKey === dimSel : p.dimKey == null),
        );
        if (row) prices[optKey] = _num(row.price);
      }
      const vals = Object.values(prices);
      if (vals.length === 0) {
        // Fiyat satırı yok → hepsi null
        for (const optKey of optKeysInGroup) hints[optKey] = null;
      } else {
        const minPrice = Math.min(...vals);
        for (const optKey of optKeysInGroup) {
          const p = prices[optKey];
          hints[optKey] = p !== undefined ? p - minPrice : null;
        }
      }
    } else if (g.key === "adet") {
      // adet grubu — quantity çarpanı DA olsa fiyat-boyutu (kartvizit/broşür) DA olsa her tiraj
      // için TAM toplam ipucu göster (eskiden adet=fiyat-boyutu olunca hiç ipucu çıkmıyordu → İSG
      // ile tutarsızdı). hypothetical'a rules yeniden uygulanır (farklı adet kendi kuralını tetikler).
      const optsWithRules = opts as unknown as { groupKey: string; optionKey: string; rules?: OptionRulesLite | null }[];
      for (const optKey of optKeysInGroup) {
        const raw = { ...selections, adet: optKey };
        const resolved = resolveRules(optsWithRules, raw);
        const hyp = effectiveSelections(raw, resolved);
        hints[optKey] = calculateTotal(product, hyp);
      }
    } else {
      // Diğer dimension (ebat vb.): hint yok
      for (const optKey of optKeysInGroup) hints[optKey] = null;
    }

    result[g.key] = hints;
  }

  return result;
}

/**
 * Grup için hangi gösterim modunun kullanılacağını döndürür.
 * "delta" → "+X ₺" (priced gruplar)
 * "total" → "X ₺" (adet multiplier gruplar)
 * "none"  → hint gösterilmez
 */
export function groupHintMode(
  product: Product,
  groupKey: string,
): "delta" | "total" | "none" {
  const opts = (product.options ?? []) as unknown as PricingOption[];
  const groups = new Map<string, { role: "dimension" | "priced" }>();
  for (const o of opts) {
    if (!groups.has(o.groupKey)) groups.set(o.groupKey, { role: o.groupRole });
  }

  const g = groups.get(groupKey);
  if (!g) return "none";
  if (g.role === "priced") return "delta";
  // adet grubu — çarpan da olsa (İSG) fiyat-boyutu da olsa (kartvizit/broşür) toplam fiyat ipucu.
  if (groupKey === "adet") return "total";
  return "none";
}

// ---------------------------------------------------------------------------
// Seyrek matris — fiyat-boyutu (adet) grubunu seçili ebata göre filtreleme
// ---------------------------------------------------------------------------

/**
 * Fiyat-boyutu (priceDim, tipik "adet") grubunun, MEVCUT seçimlerle GEÇERLİ
 * (toplam fiyatı > 0) olan option anahtarlarını döndürür. Seyrek ızgarada
 * (örn. antetli: A5 yalnız 4000/8000/12000, A4 yalnız 2000/4000/6000) seçili
 * ebat için fiyatı OLMAYAN adetleri UI'da gizlemek/atlamak için kullanılır.
 *
 * Dönüş:
 * - `null` → filtreleme YOK. İki durum: (a) tüm option'lar geçerli (tam ızgara →
 *   davranış değişmez), (b) hiçbiri geçerli değil (ürün o seçimde fiyatsız →
 *   hepsini göster, "Teklif Al"a düş). Her iki halde de option gizlenmez.
 * - `{ groupKey, keys }` → o grupta yalnız `keys` içindeki option'lar gösterilmeli.
 *
 * Not: optionPriceHints'teki adet-hesabıyla aynı yöntem (resolveRules+effectiveSelections)
 * kullanıldığından kural/kilit (rules/locked) davranışı korunur.
 */
export function availablePriceDimKeys(
  product: Product,
  selections: Record<string, string>,
): { groupKey: string; keys: Set<string> } | null {
  const opts = (product.options ?? []) as unknown as PricingOption[];
  if (opts.length === 0) return null;

  const groupMap = new Map<string, { key: string; role: "dimension" | "priced"; sort: number }>();
  for (const o of opts) {
    if (!groupMap.has(o.groupKey))
      groupMap.set(o.groupKey, { key: o.groupKey, role: o.groupRole, sort: o.groupSort });
  }
  const groups = [...groupMap.values()];
  const dims = groups.filter((g) => g.role === "dimension");
  const priceDimGroup = dims.length ? (dims.find((g) => g.key !== "adet") ?? dims[0]) : null;
  if (!priceDimGroup) return null;
  const priceDimKey = priceDimGroup.key;

  const optKeys = opts.filter((o) => o.groupKey === priceDimKey).map((o) => o.optionKey);
  if (optKeys.length === 0) return null;

  const optsWithRules = opts as unknown as {
    groupKey: string;
    optionKey: string;
    rules?: OptionRulesLite | null;
  }[];

  const valid = new Set<string>();
  for (const d of optKeys) {
    const raw = { ...selections, [priceDimKey]: d };
    const resolved = resolveRules(optsWithRules, raw);
    const hyp = effectiveSelections(raw, resolved);
    if (calculateTotal(product, hyp) > 0) valid.add(d);
  }

  // Hiç filtre gerekmiyor (tam ızgara) ya da hiçbiri geçerli değil (fiyatsız) → filtreleme yapma.
  if (valid.size === 0 || valid.size === optKeys.length) return null;
  return { groupKey: priceDimKey, keys: valid };
}

// ---------------------------------------------------------------------------
// Task 4 — Koşullu/bağımlı seçenek mantığı
// ---------------------------------------------------------------------------

export interface OptionRulesLite {
  disablesGroups?: string[];
  forcesOption?: { groupKey: string; optionKey: string };
}

/**
 * Aktif seçimlerin rules'larını toplar.
 * Sadece SEÇİLİ olan option'ların rules'ları geçerlidir.
 */
export function resolveRules(
  optionsWithRules: { groupKey: string; optionKey: string; rules?: OptionRulesLite | null }[],
  selections: Record<string, string>,
): { disabledGroups: Set<string>; forced: Record<string, string> } {
  const disabledGroups = new Set<string>();
  const forced: Record<string, string> = {};
  for (const o of optionsWithRules) {
    if (selections[o.groupKey] !== o.optionKey) continue; // sadece SEÇİLİ option'ın rules'ı geçerli
    const r = o.rules;
    if (!r) continue;
    for (const g of r.disablesGroups ?? []) disabledGroups.add(g);
    if (r.forcesOption) forced[r.forcesOption.groupKey] = r.forcesOption.optionKey;
  }
  return { disabledGroups, forced };
}

/**
 * Efektif seçimler = selections + forced, pasif gruplar çıkarılmış.
 * Pasif gruplar fiyata katılmaz.
 */
export function effectiveSelections(
  selections: Record<string, string>,
  resolved: { disabledGroups: Set<string>; forced: Record<string, string> },
): Record<string, string> {
  const result = { ...selections, ...resolved.forced };
  for (const g of resolved.disabledGroups) {
    delete result[g];
  }
  return result;
}

/**
 * Kartlarda/listelerde/favorilerde gösterilen fiyat.
 * Faz C: API'nin hesapladığı displayPrice'ı kullanır (en düşük geçerli fiyat).
 * null/undefined → 0 ("Teklif Al" durumu).
 */
export function getDisplayPrice(product: Product): number {
  const p = product.displayPrice ?? 0;
  // Area (m² hesabı) başlangıç fiyatı ham kuruşlu çıkabilir (ör. 115,92) → müşteriye temiz üst
  // tam sayıya yuvarla (ASLA gerçek fiyatın ALTINDA gösterme). Additive fiyatlar (34,90 gibi
  // kasıtlı kuruşlu değerler) OLDUĞU GİBİ korunur.
  if (product.pricingMode === "area" && p > 0) return Math.ceil(p);
  return p;
}

// ---------------------------------------------------------------------------
// m² Maliyet Motoru (pricingMode="area") — API pricing.ts ile BİREBİR aynı.
// ---------------------------------------------------------------------------

export interface PricingSettings { kur: number; marj: number; kdv: number; minM2: number }
export const DEFAULT_PRICING: PricingSettings = { kur: 46, marj: 1.5, kdv: 0.2, minM2: 1 };
export interface AreaOptionRules {
  effect?: "perM2" | "perM2Add" | "perPerimeter" | "conditional" | "perPiece";
  birim?: "dolar" | "tl";
  maxM2?: number;
  /** En (genişlik) tavanı cm — örn. araç magneti 60. UI'da giriş bu değere clamp edilir. */
  maxEn?: number;
}
type AreaOption = PricingOption & { rules?: AreaOptionRules | null };

const _round2 = (n: number) => Math.round(n * 100) / 100;

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

  const en = _num(sels.en);
  const boy = _num(sels.boy);
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
    const cost = _num(row.cost ?? row.price);
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
  return { haric: _round2(haric), dahil: _round2(dahil) };
}

