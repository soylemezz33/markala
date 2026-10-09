/**
 * Kampanya paketi "içerik" metnini kalemlere ayırır.
 *
 * Admin panelinde paket içeriği TEK bir serbest metin alanı (CampaignPackage.contents).
 * Storefront kartı ise adet + ürün linki gösterebiliyor. Köprü bu dosya.
 *
 * Desteklenen biçim — kalemler " + " (veya ",") ile ayrılır:
 *
 *   "1.000 × Kartvizit — çift yön #klasik-kartvizit + 1 × Branda afiş 200×100 cm #avrupa-vinil-branda"
 *
 * - Baştaki "<adet> ×" varsa adet olarak okunur, yoksa 1. Desen yalnız kalemin BAŞINA
 *   baktığı için "200×100 cm" gibi ORTADAKİ çarpı işaretleri bozulmaz.
 * - Sondaki "#slug" ürün sayfasına link verir ve müşteriye GÖSTERİLMEZ.
 * - Hiçbir işaret yoksa eski davranış korunur: metnin tamamı tek kalem, adet 1.
 *   (Canlıdaki üç eski paket bu yoldan geçiyor — biçimlerini değiştirmek gerekmedi.)
 */
export interface PaketKalemi {
  quantity: number;
  productName: string;
  productSlug?: string;
}

const SLUG_DESENI = /\s+#([a-z0-9]+(?:-[a-z0-9]+)*)$/;
const ADET_DESENI = /^([0-9][0-9.]*)\s*[×x]\s*(.+)$/;

export function paketIcerigiAyristir(text: string): PaketKalemi[] {
  const parcalar = String(text ?? "")
    .split(/\s*[+,]\s*/)
    .map((s) => s.trim())
    .filter(Boolean);

  const kalemler = parcalar.map((parca) => {
    let kalan = parca;
    let productSlug: string | undefined;

    const slugEsleme = kalan.match(SLUG_DESENI);
    if (slugEsleme?.[1] && slugEsleme.index !== undefined) {
      productSlug = slugEsleme[1];
      kalan = kalan.slice(0, slugEsleme.index).trim();
    }

    let quantity = 1;
    const adetEsleme = kalan.match(ADET_DESENI);
    if (adetEsleme?.[1] && adetEsleme[2]) {
      // "1.000" → 1000. Binlik ayıracı nokta (tr-TR); ondalık adet yok.
      const n = Number(adetEsleme[1].replace(/\./g, ""));
      if (Number.isFinite(n) && n > 0) {
        quantity = n;
        kalan = adetEsleme[2].trim();
      }
    }

    return { quantity, productName: kalan, ...(productSlug ? { productSlug } : {}) };
  });

  return kalemler.length ? kalemler : [{ quantity: 1, productName: String(text ?? "") }];
}
