import { computeConfiguredPrice, computeAreaPrice, extractSelections } from "./pricing";
import type { PricingSettings } from "./pricing";

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
  /** Ürün içeriği — area (m²) ürünlerde `content.maliyetUsd` gerçek maliyeti taşır. */
  content?: unknown;
}

export function computeItemCostTotal(
  product: CostingProduct | null | undefined,
  configuration: unknown,
  quantity: number,
  /** KDV hariç satır cirosu — yalnız area (m²) ürünlerde geri-hesap için kullanılır. */
  satisHaricLine: number,
  marj: number,
  /**
   * Fiyat ayarları — area (m²) ürünlerde maliyet hesabı için ŞART (kur, minM2, kdv).
   * Verilmezse area ürün null döner (eski davranış korunur).
   */
  pricing?: PricingSettings,
): number | null {
  if (!product) return null; // kampanya paketi vb. — ürün ilişkisi yok
  const qty = Number.isFinite(quantity) && quantity > 0 ? quantity : 1;

  /**
   * AREA (m²) MALİYETİ — 2026-09-02'de bağlandı (Hasan: "bunların maliyetleri dolar
   * üzerinden mevcut olması lazım").
   *
   * Satıştan maliyete giden sabit bir oran YOK: fiyat satırı KDV DAHİL SON SATIŞ
   * fiyatını tutuyor ve kâr çarpanı ürün ürün değişiyor (1,32–2,50). Eskiden burada
   * `satış_hariç ÷ marj` yapılıyordu; 2026-09-01'de bu geçersiz olunca fonksiyon
   * koşulsuz null dönmeye başladı — oysa GERÇEK maliyet `content.maliyetUsd`'de duruyor
   * (fiyat Excel'inin MALİYET kolonu, seçenek başına USD/m²).
   *
   * Hesap satış motorunun BİREBİR aynısı: fiyat satırlarındaki değerler maliyetle
   * değiştirilip `computeAreaPrice` çalıştırılır. Böylece m²/çevre/adet kuralları,
   * minM2 ve `birim: "tl"` istisnası satışla aynı şekilde uygulanır.
   *
   * `.dahil` alınır, `.haric` DEĞİL: motorun "dahil" çıktısı ham çarpım sonucudur.
   * Beslenen değer maliyet (KDV hariç) olduğu için sonuç da KDV hariç maliyettir;
   * `.haric` almak 1,2'ye ikinci kez bölerdi.
   *
   * EKSİK MALİYET = null: seçili seçeneklerden BİRİNİN bile maliyeti yoksa hesap
   * eksik çıkar. Eksik maliyet göstermek, "bilinmiyor" demekten daha tehlikelidir
   * (kâr olduğundan yüksek görünür) — bu dosyanın temel kuralı.
   */
  if (product.pricingMode === "area") {
    void marj; // area'da marj kullanılmaz — maliyet doğrudan veriden gelir.
    if (!pricing) return null; // ayar verilmediyse eski davranış: bilinmiyor.

    const maliyetUsd = (product.content as { maliyetUsd?: Record<string, unknown> } | null)
      ?.maliyetUsd;
    if (!maliyetUsd || typeof maliyetUsd !== "object") return null;

    const sels = extractSelections(configuration) as Record<string, string> | null;
    if (!sels || Object.keys(sels).length === 0) return null;

    const opts = (product.options ?? []) as Array<{
      groupKey?: string | null;
      optionKey?: string | null;
      groupRole?: string | null;
    }>;

    // Fiyatlanan her grupta SEÇİLİ seçeneğin maliyeti var mı? Biri bile yoksa null.
    const rolePerGroup = new Map<string, string>();
    for (const o of opts) {
      const g = String(o.groupKey ?? "");
      if (g && !rolePerGroup.has(g)) rolePerGroup.set(g, String(o.groupRole ?? ""));
    }
    const priceRowsRaw = (product.prices ?? []) as Array<{
      groupKey?: string | null;
      optionKey?: string | null;
      price?: unknown;
      cost?: unknown;
    }>;
    /** Seçeneğin SATIŞ değeri (area'da fiyat satırının cost'u satış fiyatını tutar). */
    const satisDegeri = (gKey: string, oKey: string) => {
      const row = priceRowsRaw.find((r) => r.groupKey === gKey && r.optionKey === oKey);
      if (!row) return 0;
      const n = Number(row.cost ?? row.price ?? 0);
      return Number.isFinite(n) ? n : 0;
    };

    for (const [gKey, role] of rolePerGroup) {
      if (role !== "priced") continue;
      const sel = sels[gKey];
      if (!sel) continue; // seçilmemiş grup fiyata da girmez
      const v = maliyetUsd[sel];
      if (v !== undefined && v !== null && Number.isFinite(Number(v))) continue;
      /**
       * maliyetUsd'de yok AMA satış değeri de 0 ise maliyeti 0 kabul et.
       * Örnek: kompozit üründe "ekislem: yok" seçeneği. Ürün onu `priced` grupta
       * tanımlamış (fiyatı 0), maliyet tablosunda karşılığı olması da beklenmez —
       * satılmayan şey tüketilmez. Bu istisna olmadan TÜM kalem "maliyeti
       * bilinmiyor" sayılıyordu (canlıda Kompozit Baskı böyle düşüyordu).
       *
       * Satış değeri 0 DEĞİLSE maliyet gerçekten bilinmiyordur → null.
       */
      if (satisDegeri(gKey, sel) === 0) continue;
      return null;
    }

    // Satış satırlarını maliyet değerleriyle değiştir — motor aynı, girdi farklı.
    const costRows = priceRowsRaw.map((r) => {
      const v = maliyetUsd[String(r.optionKey ?? "")];
      const n = Number(v);
      return { ...r, cost: Number.isFinite(n) ? n : null, price: 0 };
    });

    const { dahil } = computeAreaPrice(opts as never, costRows as never, sels, pricing);
    if (!Number.isFinite(dahil) || dahil <= 0) return null;
    // Motor "bir set"in maliyetini döndürür (unitPrice ile aynı kapsam); satır = set × adet.
    return round2(dahil * qty);
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
