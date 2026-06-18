import type { Product, ProductParameter } from "@markala/types";

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

  for (const param of product.parameters) {
    const sel = state.selections[param.id];

    if ((param.kind === "radio" || param.kind === "select") && typeof sel === "string") {
      const opt = param.options?.find((o) => o.id === sel);
      if (opt && opt.priceModifier !== 0) {
        total += opt.priceModifier;
        modifiers.push({ label: `${param.label}: ${opt.label}`, amount: opt.priceModifier });
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
 * Kartlarda/listelerde/favorilerde gösterilen fiyat = ürün DETAYININ AÇILIŞTAKİ fiyatı
 * (configurator varsayılan seçimleriyle hesaplanan toplam). Tek kaynak: böylece aynı ürünün
 * fiyatı her sayfada AYNI olur (kart 50 ↔ detay 90 gibi tutarsızlık olmaz). Parametresiz
 * üründe basePrice döner. startingPrice (DB display alanı) artık fiyat KAYNAĞI değil.
 */
export function getDisplayPrice(product: Product): number {
  return calculatePrice(product, initConfig(product)).total;
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
