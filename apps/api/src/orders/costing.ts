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

  // area: 2026-09-01'den önce satış motoru `satış_hariç = maliyet × marj` ürettiği için maliyet
  // geri hesaplanabiliyordu. Artık fiyat satırı KDV DAHİL SON SATIŞ fiyatını tutuyor (kâr rakamın
  // içinde, ürün ürün farklı: 1,32–2,50) → satıştan maliyete giden sabit bir oran YOK.
  // Uydurma rakam yazmak yerine null döneriz: rapor "maliyet bilinmiyor" der, yanlış kâr göstermez.
  // KALICI ÇÖZÜM: gerçek maliyetler ürünün content.maliyetUsd alanına yazılıyor (fiyat Excel'inin
  // MALİYET kolonu); costing bunu okuyup m² kârını yeniden hesaplayabilir — geliştirme oturumu işi.
  if (product.pricingMode === "area") {
    void marj;
    return null;
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
  const costRows = rows.map((r) => ({ ...r, price: (r.cost ?? 0) as number | string }));
  const unitCost = computeConfiguredPrice(
    (product.options ?? []) as never,
    costRows as never,
    selections as Record<string, string>,
  );
  // 0 SONUÇ = "bilinmiyor" (null), "bedava" DEĞİL. İki sebep olabilir: (a) seçilen satırın
  // cost'u eksik, (b) eski siparişin selections'ı ürünün DEĞİŞMİŞ şemasıyla eşleşmiyor
  // (2026-08-24 backfill'de yakalandı: klasik-kartvizit'in 80 satırı da maliyetliyken eski
  // kalem 0 hesaplanıyordu). İkisinde de %100 kâr yanılsaması üretmek yerine null dönülür.
  if (unitCost <= 0) return null;
  // Motor "bir set"in maliyetini döndürür (unitPrice ile aynı kapsam); satır = set × adet.
  return round2(unitCost * qty);
}

function round2(n: number): number {
  return Math.round((Number(n) || 0) * 100) / 100;
}
