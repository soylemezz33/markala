import { computeConfiguredPrice, extractSelections } from "./pricing";

/**
 * SİPARİŞ KALEMİ MALİYETİ — TEK DOĞRULUK KAYNAĞI (2026-08-24).
 *
 * İki tüketicisi var ve İKİSİ DE AYNI mantığı kullanmak ZORUNDA:
 *   1) orders.service.create → sipariş anında `OrderItem.costTotal` snapshot'ı yazar.
 *      Böylece maliyet güncellemesi GEÇMİŞ kârı değiştirmez (Hasan talebi).
 *   2) stats/profit.service → snapshot'sız ESKİ kalemler için güncel maliyetten
 *      hesaplar (fallback). Snapshot varsa ona dokunmaz.
 *
 * Dönen değer SATIR (line) kapsamındadır — lineTotal ile aynı ölçek (kalem adedi dahil).
 * Bilinmeyen maliyet 0 DEĞİL null döner: %100 kâr yanılsaması üretmek tehlikelidir.
 */
export interface CostingProduct {
  pricingMode?: string | null;
  options?: unknown;
  prices?: unknown;
}

export function computeItemCostTotal(
  product: CostingProduct | null | undefined,
  configuration: unknown,
  quantity: number,
  /** KDV hariç satır cirosu — yalnız area (m²) ürünlerde geri-hesap için kullanılır. */
  satisHaricLine: number,
  marj: number,
): number | null {
  if (!product) return null; // kampanya paketi vb. — ürün ilişkisi yok
  const qty = Number.isFinite(quantity) && quantity > 0 ? quantity : 1;

  // area: satış motoru zaten `satış_hariç = maliyet × marj` üretir → maliyet geri hesaplanır.
  if (product.pricingMode === "area") {
    if (!(marj > 0)) return null;
    return round2(satisHaricLine / marj);
  }

  const rows = (product.prices ?? []) as Array<{
    groupKey?: string | null;
    optionKey?: string | null;
    dimKey?: string | null;
    price: unknown;
    cost?: unknown;
  }>;
  if (rows.length === 0) return null;
  // Ürünün HİÇ maliyeti yoksa (İSG kataloğunun çoğu) tahmin yürütme.
  if (!rows.some((r) => r.cost !== null && r.cost !== undefined)) return null;

  // Seçenek grubu OLMAYAN ürün (tek fiyat/tek maliyet): selections'ın boş olması NORMALDİR —
  // taban satırın maliyeti kalem adediyle çarpılır.
  const optRows = (product.options ?? []) as unknown[];
  if (optRows.length === 0) {
    const base = rows.find((r) => r.groupKey == null && r.optionKey == null);
    const c = base?.cost;
    if (c === null || c === undefined) return null;
    return round2(Number(c) * qty);
  }

  const selections = extractSelections(configuration);
  if (!selections || Object.keys(selections).length === 0) return null;

  // Fiyat motorunu `price` yerine `cost` ile çalıştır → mantık satışla birebir aynı.
  // cost'u olmayan satır 0'a düşüp maliyeti eksik göstermesin: eksik cost varsa hesap geçersiz.
  let eksikCost = false;
  const costRows = rows.map((r) => {
    const c = r.cost;
    if (c === null || c === undefined) eksikCost = true;
    return { ...r, price: (c ?? 0) as number | string };
  });
  const unitCost = computeConfiguredPrice(
    (product.options ?? []) as never,
    costRows as never,
    selections as Record<string, string>,
  );
  if (unitCost <= 0) return eksikCost ? null : 0;
  // Motor "bir set"in maliyetini döndürür (unitPrice ile aynı kapsam); satır = set × adet.
  return round2(unitCost * qty);
}

function round2(n: number): number {
  return Math.round((Number(n) || 0) * 100) / 100;
}
