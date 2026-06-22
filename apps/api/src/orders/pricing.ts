/**
 * Sunucu tarafı konfigüratör fiyat motoru.
 *
 * apps/web/src/lib/configurator.ts `calculatePrice()` mantığının BİREBİR portu (yalnız toplam).
 * Fiyat DAİMA sunucuda, ürünün KENDİ `parameters` şemasından (DB) + kullanıcının `selections`
 * seçimlerinden hesaplanır; client'ın bildirdiği `totalPrice`'a GÜVENİLMEZ (fiyat manipülasyonu
 * önlenir). Birçok ürünün base_price'ı 0'dır — gerçek fiyat parameters/selections'tan gelir
 * (örn. kartvizit: matrix hücresi 1000 adet CYP = 290).
 *
 * ⚠️ configurator.ts fiyat kuralları değişirse BURASI da güncellenmelidir (kasıtlı duplikasyon —
 *    @markala/types runtime'da api'ye bundle edilemediği için paylaşılmadı). Test: orders pricing spec.
 */

type Selections = Record<string, unknown>;

interface DimensionValue {
  width: number;
  height: number;
  extras: string[];
}

function isDimensionValue(v: unknown): v is DimensionValue {
  return typeof v === "object" && v !== null && "width" in v && "height" in v && "extras" in v;
}

function num(v: unknown): number {
  const n = typeof v === "number" ? v : Number(v);
  return Number.isFinite(n) ? n : 0;
}

/**
 * Konfigüre edilmiş bir ürünün KDV-dahil toplam fiyatını hesaplar (configurator.ts ile aynı).
 * Desteklenen parametre tipleri: radio/select (priceModifier), checkbox-group (toplam modifier),
 * quantity (adet × unitPrice), matrix (hücre sabit fiyatı), dimension (alan × m² + ekler).
 */
export function calculateConfiguredPrice(
  basePrice: number,
  parameters: unknown,
  selections: Selections,
): number {
  let total = num(basePrice);
  const params = Array.isArray(parameters) ? parameters : [];
  const sels = selections && typeof selections === "object" ? selections : {};

  // Ebat-bazlı / per-unit fiyat ön-taraması (İSG levhaları: ebat×malzeme/baskı × adet)
  let sizeKey = "";
  let perUnitQty = 1;
  for (const p of params) {
    if (!p || typeof p !== "object") continue;
    const param = p as Record<string, any>;
    const sel = (sels as Selections)[param.id];
    if (param.isSizeDriver && typeof sel === "string") sizeKey = sel;
    if (param.kind === "quantity" && typeof sel === "number") perUnitQty = num(sel);
  }

  for (const p of params) {
    if (!p || typeof p !== "object") continue;
    const param = p as Record<string, any>;
    const sel = (sels as Selections)[param.id];
    const kind = param.kind;

    if ((kind === "radio" || kind === "select") && typeof sel === "string") {
      const opt = param.options?.find((o: any) => o?.id === sel);
      if (opt) {
        // priceBySize varsa ebata göre fiyat; perUnit ise adetle çarp (configurator.ts ile aynı)
        const unit = opt.priceBySize?.[sizeKey] ?? opt.priceModifier;
        total += param.perUnit ? num(unit) * perUnitQty : num(unit);
      }
    } else if (kind === "checkbox-group" && Array.isArray(sel)) {
      for (const optId of sel) {
        const opt = param.options?.find((o: any) => o?.id === optId);
        if (opt) total += num(opt.priceModifier);
      }
    } else if (kind === "quantity" && typeof sel === "number") {
      total += num(param.unitPrice) * sel;
    } else if (kind === "matrix" && typeof sel === "string") {
      const cell = param.cells?.find((c: any) => c?.id === sel);
      if (cell) total += num(cell.price);
    } else if (kind === "dimension" && isDimensionValue(sel)) {
      const w = Math.max(1, num(sel.width) || 1);
      const h = Math.max(1, num(sel.height) || 1);
      const areaSqm = (w * h) / 10000;
      const perimeterM = (2 * (w + h)) / 100;
      total += areaSqm * num(param.pricePerSqm);

      for (const ex of param.extras ?? []) {
        if (ex?.autoBelow1Sqm && areaSqm < 1) total += num(ex.flatFee);
      }
      const exIds = Array.isArray(sel.extras) ? sel.extras : [];
      for (const exId of exIds) {
        const ex = param.extras?.find((e: any) => e?.id === exId);
        if (!ex) continue;
        total += num(ex.flatFee);
        if (ex.perimeterPricePerM) total += num(ex.perimeterPricePerM) * perimeterM;
      }
    }
  }

  return Math.max(0, total);
}

// ---------------------------------------------------------------------------
// Yeni toplamsal motor — Global Constraints sözleşmesi (product_options/product_prices)
// @markala/types runtime'da api'ye bundle edilemediği için kasıtlı duplikasyon.
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
