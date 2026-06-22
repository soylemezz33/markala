import type { Product, ProductParameter } from "@markala/types";

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

export interface DimensionValue {
  width: number; // cm
  height: number; // cm
  /** Seçili extra id'leri (kolon dikiş, germe vb.) */
  extras: string[];
}

export type SelectionValue =
  | string
  | string[]
  | number
  | DimensionValue;

export interface ConfigState {
  selections: Record<string, SelectionValue>;
}

export function isDimensionValue(v: unknown): v is DimensionValue {
  return (
    typeof v === "object" &&
    v !== null &&
    "width" in v &&
    "height" in v &&
    "extras" in v
  );
}

export function initConfig(product: Product): ConfigState {
  const selections: ConfigState["selections"] = {};
  for (const p of product.parameters) {
    if (p.kind === "radio" || p.kind === "select") {
      selections[p.id] = p.defaultOptionId ?? p.options?.[0]?.id ?? "";
    } else if (p.kind === "checkbox-group") {
      selections[p.id] = [];
    } else if (p.kind === "quantity") {
      selections[p.id] = p.quantityPresets?.[0] ?? 1;
    } else if (p.kind === "dimension") {
      selections[p.id] = {
        width: p.defaultWidth ?? 100,
        height: p.defaultHeight ?? 100,
        extras: [],
      };
    } else if (p.kind === "matrix") {
      selections[p.id] = p.defaultCellId ?? p.cells?.[0]?.id ?? "";
    }
  }
  return { selections };
}

export interface PriceBreakdown {
  base: number;
  modifiers: Array<{ label: string; amount: number }>;
  unitPrice: number;
  quantity: number;
  total: number;
  vatIncluded: boolean;
  /** Dimension parametresi varsa hesaplanan alan/çevre */
  dimensions?: { areaSqm: number; perimeterM: number };
}

/**
 * Fiyat hesaplama motoru.
 *
 * Desteklenen parametre tipleri:
 *  - radio / select : priceModifier (sabit ek)
 *  - checkbox-group : seçilenlerin priceModifier toplamı
 *  - quantity       : adet × unitPrice
 *  - dimension      : alan(m²) × pricePerSqm + ek seçenekler (sabit / çevre×m / 1m² altı oto)
 *
 * VinilTürk modelinden uyarlandı: en×boy → alan + çevre,
 * sonra (alan × birim_fiyat) + ek seçenekler.
 */
export function calculatePrice(product: Product, state: ConfigState): PriceBreakdown {
  let total = product.basePrice;
  const modifiers: PriceBreakdown["modifiers"] = [];
  let unitPrice = 0;
  let quantity = 1;
  let dimensions: PriceBreakdown["dimensions"] | undefined;

  // Ebat-bazlı / per-unit fiyat ön-taraması (İSG levhaları: ebat×malzeme × adet)
  let sizeKey = "";
  let perUnitQty = 1;
  for (const p of product.parameters) {
    const s = state.selections[p.id];
    if (p.isSizeDriver && typeof s === "string") sizeKey = s;
    if (p.kind === "quantity" && typeof s === "number") perUnitQty = s;
  }

  for (const param of product.parameters) {
    const sel = state.selections[param.id];

    if ((param.kind === "radio" || param.kind === "select") && typeof sel === "string") {
      const opt = param.options?.find((o) => o.id === sel);
      if (opt) {
        // priceBySize varsa ebata göre fiyat; perUnit ise adetle çarp
        const unit = opt.priceBySize?.[sizeKey] ?? opt.priceModifier;
        const amount = param.perUnit ? unit * perUnitQty : unit;
        if (amount !== 0) {
          total += amount;
          modifiers.push({ label: `${param.label}: ${opt.label}`, amount });
        }
      }
    }

    if (param.kind === "checkbox-group" && Array.isArray(sel)) {
      for (const optId of sel) {
        const opt = param.options?.find((o) => o.id === optId);
        if (opt) {
          total += opt.priceModifier;
          modifiers.push({ label: opt.label, amount: opt.priceModifier });
        }
      }
    }

    if (param.kind === "quantity" && typeof sel === "number") {
      quantity = sel;
      unitPrice = param.unitPrice ?? 0;
      total += unitPrice * quantity;
    }

    if (param.kind === "matrix" && typeof sel === "string") {
      const cell = param.cells?.find((c) => c.id === sel);
      if (cell) {
        const row = param.rows?.find((r) => r.id === cell.rowId);
        const col = param.cols?.find((c) => c.id === cell.colId);
        const label = cell.code
          ? `${cell.code}${row?.label ? ` · ${row.label}` : ""}${col?.label ? ` · ${col.label}` : ""}`
          : `${row?.label ?? cell.rowId} · ${col?.label ?? cell.colId}`;
        // Matrix sabit toplam fiyat üretir — basePrice'a eklenir
        total += cell.price;
        modifiers.push({ label, amount: cell.price });
        // Adet bilgisini quantity alanına da yansıt — sepet/sipariş satırı için
        const colNum = parseInt(col?.id ?? "", 10);
        if (!Number.isNaN(colNum) && colNum > 0) {
          quantity = colNum;
          unitPrice = cell.price / colNum;
        }
      }
    }

    if (param.kind === "dimension" && isDimensionValue(sel)) {
      const w = Math.max(1, sel.width);
      const h = Math.max(1, sel.height);
      const areaSqm = (w * h) / 10000;
      const perimeterM = (2 * (w + h)) / 100;
      dimensions = { areaSqm, perimeterM };

      const pricePerSqm = param.pricePerSqm ?? 0;
      const baseLine = areaSqm * pricePerSqm;
      total += baseLine;
      modifiers.push({
        label: `${areaSqm.toFixed(2)} m² × ${pricePerSqm.toLocaleString("tr-TR")} ₺`,
        amount: baseLine,
      });

      // Otomatik 1m² altı ekleri
      for (const ex of param.extras ?? []) {
        if (ex.autoBelow1Sqm && areaSqm < 1) {
          const fee = ex.flatFee ?? 0;
          total += fee;
          modifiers.push({ label: `${ex.label} (otomatik)`, amount: fee });
        }
      }

      // Kullanıcı seçtiği ekler
      for (const exId of sel.extras ?? []) {
        const ex = param.extras?.find((e) => e.id === exId);
        if (!ex) continue;
        let exTotal = 0;
        if (ex.flatFee) exTotal += ex.flatFee;
        if (ex.perimeterPricePerM) exTotal += ex.perimeterPricePerM * perimeterM;
        if (exTotal > 0) {
          total += exTotal;
          modifiers.push({ label: ex.label, amount: exTotal });
        }
      }
    }
  }

  // Per-unit/ebat fiyatlı ürünlerde birim fiyat = toplam / adet (gösterim için)
  if (unitPrice === 0 && quantity > 0 && total > 0) {
    unitPrice = total / quantity;
  }

  return {
    base: product.basePrice,
    modifiers,
    unitPrice,
    quantity,
    total: Math.max(0, total),
    vatIncluded: true,
    dimensions,
  };
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

export function findParameter(product: Product, id: string): ProductParameter | undefined {
  return product.parameters.find((p) => p.id === id);
}

/**
 * Sepet satırı / sipariş için insanca okunabilir konfigürasyon özeti.
 * "Lak Mat · 1.000 adet · Tasarım desteği isteniyor" gibi.
 */
export function buildSummary(
  product: Product,
  state: ConfigState,
  needsDesign: boolean,
): string {
  const parts: string[] = [];
  for (const param of product.parameters) {
    const sel = state.selections[param.id];
    if ((param.kind === "radio" || param.kind === "select") && typeof sel === "string") {
      const opt = param.options?.find((o) => o.id === sel);
      if (opt) parts.push(opt.label);
    } else if (param.kind === "checkbox-group" && Array.isArray(sel) && sel.length > 0) {
      const labels = sel
        .map((id) => param.options?.find((o) => o.id === id)?.label)
        .filter(Boolean);
      if (labels.length > 0) parts.push(labels.join(", "));
    } else if (param.kind === "quantity" && typeof sel === "number") {
      parts.push(`${sel.toLocaleString("tr-TR")} adet`);
    } else if (param.kind === "dimension" && isDimensionValue(sel)) {
      parts.push(`${sel.width} × ${sel.height} cm`);
      if (sel.extras.length > 0) {
        const labels = sel.extras
          .map((id) => param.extras?.find((e) => e.id === id)?.label)
          .filter(Boolean);
        if (labels.length > 0) parts.push(labels.join(", "));
      }
    } else if (param.kind === "matrix" && typeof sel === "string") {
      const cell = param.cells?.find((c) => c.id === sel);
      if (cell) {
        const row = param.rows?.find((r) => r.id === cell.rowId);
        const col = param.cols?.find((c) => c.id === cell.colId);
        const segments: string[] = [];
        if (row?.label) {
          segments.push(row.sublabel ? `${row.label} (${row.sublabel})` : row.label);
        }
        if (col?.label) segments.push(col.label);
        if (cell.code) segments.unshift(cell.code);
        parts.push(segments.join(" · "));
      }
    }
  }
  if (needsDesign) parts.push("Tasarım desteği isteniyor");
  return parts.join(" · ");
}
