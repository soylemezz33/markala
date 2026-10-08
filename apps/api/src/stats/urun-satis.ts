/**
 * ÜRÜN SATIŞ TOPLAMLARI — saf toplama (2026-10-08, Hasan: "hangi üründen totalde kaç tane
 * satılmış, panelde bir sayfa").
 *
 * Girdi: gerçekleşen sipariş kalemleri (filtre `gerceklesenSiparis`, tek kaynak). Çıktı:
 * ürün başına sipariş sayısı, adet, ciro ve varyant dökümü. Prisma'ya bağımlı değil ki
 * birim testi DB'siz koşsun ve ciro sayfasındaki ürün listesiyle aynı veriden beslensin.
 *
 * ADET TANIMI: `quantity` toplamı. Paket ürünlerde (kartvizit 1.000 adet, magnet 1.000 adet)
 * bu "paket sayısı"dır, kart sayısı değil — varyant sütunu paketi gösterir
 * ("1.000 Adet · Çift yüz mat"). Aynı siparişte aynı ürün iki kalemse (iki ayrı tasarım)
 * sipariş 1, adet 2 sayılır.
 *
 * CİRO: kalem `lineTotal` toplamı, KDV DAHİL, sipariş indirimi düşülmemiş — müşterinin o
 * kaleme ödediği tutar. Kâr/KDV hariç analiz için Ciro & Kâr sayfası var; burada amaç
 * "ne kadar satıldı", "ne kazandık" değil.
 */

export interface SatisKalemi {
  productId: string | null;
  productSlug: string;
  productName: string;
  configurationSummary: string;
  quantity: number;
  lineTotal: number | string | { toString(): string };
  order: { id: string; createdAt: Date };
}

export interface UrunSatisSatiri {
  productId: string | null;
  productSlug: string;
  productName: string;
  siparis: number;
  adet: number;
  ciro: number;
  ilkSatis: string;
  sonSatis: string;
  varyantlar: Array<{ ozet: string; siparis: number; adet: number; ciro: number }>;
}

export interface UrunSatisOzeti {
  gunSayisi: number | null;
  siparis: number;
  adet: number;
  ciro: number;
  urunSayisi: number;
  urunler: UrunSatisSatiri[];
}

const num = (v: unknown): number => {
  const n = typeof v === "number" ? v : Number(String(v));
  return Number.isFinite(n) ? n : 0;
};
const round2 = (n: number) => Math.round(n * 100) / 100;

export function urunSatisToplamlari(items: SatisKalemi[], gunSayisi: number | null): UrunSatisOzeti {
  type Acc = {
    productId: string | null;
    productSlug: string;
    productName: string;
    siparisler: Set<string>;
    adet: number;
    ciro: number;
    ilk: Date;
    son: Date;
    varyant: Map<string, { siparisler: Set<string>; adet: number; ciro: number }>;
  };
  const map = new Map<string, Acc>();
  const tumSiparisler = new Set<string>();
  let toplamAdet = 0;
  let toplamCiro = 0;

  for (const it of items) {
    // Anahtar: slug (ürün silinse de kalem slug'ı kalır; aynı ürünün id'si değişmez).
    const key = it.productSlug || it.productName;
    const tutar = num(it.lineTotal);
    const t = it.order.createdAt;
    let a = map.get(key);
    if (!a) {
      a = {
        productId: it.productId ?? null,
        productSlug: it.productSlug,
        // En son görülen ad kazanır (ürün adı değişmişse güncel olan görünsün).
        productName: it.productName,
        siparisler: new Set(),
        adet: 0,
        ciro: 0,
        ilk: t,
        son: t,
        varyant: new Map(),
      };
      map.set(key, a);
    }
    if (t >= a.son) {
      a.son = t;
      a.productName = it.productName;
    }
    if (t < a.ilk) a.ilk = t;
    a.siparisler.add(it.order.id);
    a.adet += it.quantity;
    a.ciro += tutar;
    const vKey = (it.configurationSummary || "").trim() || "—";
    let v = a.varyant.get(vKey);
    if (!v) {
      v = { siparisler: new Set(), adet: 0, ciro: 0 };
      a.varyant.set(vKey, v);
    }
    v.siparisler.add(it.order.id);
    v.adet += it.quantity;
    v.ciro += tutar;

    tumSiparisler.add(it.order.id);
    toplamAdet += it.quantity;
    toplamCiro += tutar;
  }

  const urunler: UrunSatisSatiri[] = [...map.values()]
    .map((a) => ({
      productId: a.productId,
      productSlug: a.productSlug,
      productName: a.productName,
      siparis: a.siparisler.size,
      adet: a.adet,
      ciro: round2(a.ciro),
      ilkSatis: a.ilk.toISOString(),
      sonSatis: a.son.toISOString(),
      varyantlar: [...a.varyant.entries()]
        .map(([ozet, v]) => ({ ozet, siparis: v.siparisler.size, adet: v.adet, ciro: round2(v.ciro) }))
        .sort((x, y) => y.adet - x.adet || y.ciro - x.ciro),
    }))
    // Varsayılan sıra: en çok adet; eşitse ciro.
    .sort((x, y) => y.adet - x.adet || y.ciro - x.ciro);

  return {
    gunSayisi,
    siparis: tumSiparisler.size,
    adet: toplamAdet,
    ciro: round2(toplamCiro),
    urunSayisi: urunler.length,
    urunler,
  };
}
