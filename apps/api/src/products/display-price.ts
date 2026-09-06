import { computeAreaPrice, computeConfiguredPrice, normalizeSelections } from "../orders/pricing";

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
  optionSort?: number;
  /** Kilitli grup: müşteri seçmez, her siparişe otomatik uygulanır (effectiveSelections). */
  locked?: boolean;
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
  // KİLİTLİ gruplar her siparişe otomatik uygulanır (ör. Ayaklı Dekota'da adet başına ayak
  // ücreti, 2026-09-04). Başlangıç fiyatı da onları içermeli; yoksa kart müşterinin asla
  // ödemeyeceği bir rakam gösterir. Sipariş motoruyla aynı kural: gruptaki en küçük optionSort.
  const kilitli: Record<string, string> = {};
  for (const o of priced) {
    if (!o.locked) continue;
    const cur = priced.find((x) => x.groupKey === o.groupKey && x.optionKey === kilitli[o.groupKey]);
    if (!cur || (o.optionSort ?? 0) < (cur.optionSort ?? 0)) kilitli[o.groupKey] = o.optionKey;
  }
  let min: number | null = null;
  for (const opt of priced) {
    if ((opt.groupSort ?? 0) !== anaSort) continue; // ek işlem grupları elenir
    const eff = opt.rules?.effect ?? "perM2";
    if (eff !== "perM2" && eff !== "perPiece") continue;
    const r = computeAreaPrice(
      rawOptions as never,
      rows,
      { ...kilitli, [opt.groupKey]: opt.optionKey, en: "100", boy: "100", adet: "1" },
      pricing,
    ).dahil;
    if (r > 0 && (min === null || r < min)) min = r;
  }
  return min;
}

/**
 * TOPLAMSAL (non-area) ürünlerde başlangıç fiyatı: EN UCUZ TAM KONFİGÜRASYON.
 *
 * Eskiden MIN(ProductPrice.price > 0) alınıyordu. Bu, tek fiyatlı gruptan oluşan ürünlerde
 * doğru; ama birden fazla fiyatlı grubu olan üründe EK SEÇENEĞİN satırını yakalıyor.
 * 2026-09-05'te Makam Bayrağı kategorisi "105 ₺'den başlayan" yazıyordu: 105 ₺ saçak
 * (püskül) satırıydı, bayrağın kendisi 2.116,80 ₺'den başlıyor. Müşteri m² fiyatı sanıp
 * yanılıyordu (Hasan: "yanıltıcı oluyor").
 *
 * Artık sipariş motoruyla (computeConfiguredPrice + normalizeSelections) aynı yoldan,
 * her fiyatlı grup için bir seçenek + fiyat-boyutu için her seçenek denenerek EN DÜŞÜK
 * pozitif toplam alınır. "Yok" gibi satırsız seçenekler motorda 0 katkı yapar, burada da.
 * Adet çarpanı olan ürünlerde (İSG) en küçük adet seçeneği kullanılır (= 1 adet fiyatı).
 * Kilitli gruplar tek adaydır (motor zaten varsayılana zorlar).
 *
 * Kombinasyon sayısı KOMBINASYON_TAVANI'nı aşarsa eski davranışa (min pozitif satır) düşer;
 * katalogda en geniş ürün bile birkaç yüz kombinasyondur.
 */
const KOMBINASYON_TAVANI = 20_000;

interface ToplamsalOption extends AreaDisplayOption {
  groupLabel?: string;
  optionLabel?: string;
}

export function additiveStartingPrice(rawOptions: unknown, rows: DisplayPriceRow[]): number | null {
  const pozitifMin = (): number | null => {
    const p = rows.map((r) => r.price).filter((v) => v > 0);
    return p.length ? Math.min(...p) : null;
  };
  const opts = (Array.isArray(rawOptions) ? rawOptions : []) as ToplamsalOption[];
  if (!opts.length || !rows.length) return pozitifMin();

  type Grup = { key: string; role: string; sort: number; options: { key: string; sort: number; locked: boolean }[] };
  const gruplar = new Map<string, Grup>();
  for (const o of opts) {
    let g = gruplar.get(o.groupKey);
    if (!g) {
      g = { key: o.groupKey, role: o.groupRole, sort: o.groupSort ?? 0, options: [] };
      gruplar.set(o.groupKey, g);
    }
    g.options.push({ key: o.optionKey, sort: o.optionSort ?? 0, locked: !!o.locked });
  }
  const sirali = [...gruplar.values()].sort((a, b) => a.sort - b.sort);
  const dims = sirali.filter((g) => g.role === "dimension");
  const priceDimKey = dims.length ? (dims.find((g) => g.key !== "adet") ?? dims[0]).key : null;

  // Her grup için aday seçenekler
  const adaylar: { key: string; keys: string[] }[] = [];
  for (const g of sirali) {
    const sorted = [...g.options].sort((a, b) => a.sort - b.sort);
    if (!sorted.length) continue;
    if (g.role === "priced") {
      if (sorted.some((o) => o.locked)) {
        const def = sorted.filter((o) => o.locked).sort((a, b) => a.sort - b.sort)[0];
        adaylar.push({ key: g.key, keys: [def.key] });
      } else {
        adaylar.push({ key: g.key, keys: sorted.map((o) => o.key) });
      }
    } else if (g.key === priceDimKey) {
      adaylar.push({ key: g.key, keys: sorted.map((o) => o.key) });
    } else if (g.key === "adet") {
      // Çarpan boyutu: en küçük sayısal adet (1 adet fiyatı)
      const sayisal = sorted.map((o) => ({ ...o, n: Number(o.key) })).filter((o) => Number.isFinite(o.n) && o.n > 0);
      const enKucuk = sayisal.length ? sayisal.sort((a, b) => a.n - b.n)[0] : sorted[0];
      adaylar.push({ key: g.key, keys: [enKucuk.key] });
    } else {
      adaylar.push({ key: g.key, keys: [sorted[0].key] }); // fiyata etkisiz boyut
    }
  }
  const toplam = adaylar.reduce((a, g) => a * g.keys.length, 1);
  if (!adaylar.length || toplam > KOMBINASYON_TAVANI) return pozitifMin();

  const rowsForEngine = rows.map((r) => ({ groupKey: r.groupKey, optionKey: r.optionKey, dimKey: r.dimKey, price: r.price }));
  let min: number | null = null;
  const sec: Record<string, string> = {};
  const gez = (i: number) => {
    if (i === adaylar.length) {
      const eff = normalizeSelections(opts as never, { ...sec });
      const v = computeConfiguredPrice(opts as never, rowsForEngine, eff);
      if (v > 0 && (min === null || v < min)) min = v;
      return;
    }
    const g = adaylar[i];
    for (const k of g.keys) {
      sec[g.key] = k;
      gez(i + 1);
    }
    delete sec[g.key];
  };
  gez(0);
  return min ?? pozitifMin();
}
