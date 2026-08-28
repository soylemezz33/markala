import { computeAreaPrice } from "../orders/pricing";

/**
 * "…₺'den başlar" fiyatının TEK KAYNAĞI.
 *
 * Hem ürün listesi/detayı (products.service) hem kategori kartı (categories.service)
 * buradan hesaplar; iki yerde ayrı mantık olursa kategori kartı ile ürün kartı farklı
 * rakam gösterir. 2026-08-28'de tam olarak bu yaşandı: kategorilerin `starting_price`
 * sütunu ELLE tutuluyordu, katalog değişince bayatladı ve 7 kategoride yanlış fiyat
 * göründü (masa bayrağı 450 ₺ yazıp gerçekte 150 ₺'den başlıyordu).
 */

export interface AreaDisplayOption {
  groupKey: string;
  groupRole: string;
  groupSort: number;
  optionKey: string;
  rules?: { effect?: string } | null;
}

export interface DisplayPriceRow {
  groupKey: string | null;
  optionKey: string | null;
  dimKey: string | null;
  price: number;
  cost: number | null;
}

export interface AreaPricingSettings {
  kur: number;
  marj: number;
  kdv: number;
  minM2: number;
}

/**
 * m² ürünlerinde başlangıç fiyatı: EN UCUZ ANA MALZEME × 1 m² (KDV dahil).
 *
 * ⚠️ YALNIZ BİRİNCİL GRUP taranır (en küçük groupSort). Önceden tüm `priced` gruplar
 * taranıyordu; ürünlere "Ek İşlem" grubu (CNC kesim, laminasyon…) eklenince bunlar da
 * aday sayıldı ve ana malzemeden UCUZ oldukları için başlangıç fiyatı çöktü:
 * Pleksi 3.175 ₺ yerine 177 ₺ gösteriyordu. Ek işlem tek başına satılmaz, ana
 * malzemenin üstüne eklenir — dolayısıyla başlangıç fiyatı adayı olamaz.
 */
export function areaStartingPrice(
  opts: AreaDisplayOption[],
  rawOptions: unknown,
  rows: DisplayPriceRow[],
  pricing: AreaPricingSettings,
): number | null {
  const priced = opts.filter((o) => o.groupRole === "priced");
  if (!priced.length) return null;
  const anaSort = Math.min(...priced.map((o) => o.groupSort ?? 0));
  let min: number | null = null;
  for (const opt of priced) {
    if ((opt.groupSort ?? 0) !== anaSort) continue; // ek işlem grupları elenir
    const eff = opt.rules?.effect ?? "perM2";
    if (eff !== "perM2" && eff !== "perPiece") continue;
    const r = computeAreaPrice(
      rawOptions as never,
      rows,
      { [opt.groupKey]: opt.optionKey, en: "100", boy: "100", adet: "1" },
      pricing,
    ).dahil;
    if (r > 0 && (min === null || r < min)) min = r;
  }
  return min;
}
