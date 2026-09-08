import type { PrismaService } from "../prisma/prisma.service";
import { areaStartingPrice, additiveStartingPrice, type AreaDisplayOption, type AreaPricingSettings } from "./display-price";
import { onbellekliBaslangicFiyatlari } from "./baslangic-fiyati-bellegi";

/**
 * Toplu başlangıç fiyatı ("…₺'den başlar") — ürün listesi ve kategori kartı için TEK yol.
 *
 * 2026-09-07 PERFORMANS DÜZELTMESİ: 2cc1885 ile toplamsal ürünlerde başlangıç fiyatı
 * "en ucuz tam konfigürasyon" oldu (Makam Bayrağı 105 ₺ olayı). Bunun için TÜM ürünlerin
 * options/prices'ı çekilip motorla hesaplanıyordu: /api/categories 10,7 sn'ye çıktı
 * (792 ürün, ~20 bin fiyat satırı). Storefront'ta grup sayfaları bu yüzden boş/404 kaldı.
 *
 * Gerçekte yalnız BİRDEN FAZLA fiyatlı grubu olan üründe tam konfigürasyon ile MIN(price>0)
 * farklıdır (Makam Bayrağı, bloknotlar gibi bir avuç ürün). Tek fiyatlı gruplu üründe
 * (İSG levhalarının tamamı, kartvizit/broşür matrisleri) en ucuz satır = en ucuz tam
 * konfigürasyon. Bu yüzden:
 *   1. product_options'tan (productId, groupKey) groupBy ile fiyatlı grup sayısı bulunur
 *      (hafif sorgu);
 *   2. area ürünler + çok gruplu toplamsal ürünler için options/prices yüklenir ve motor
 *      hesaplar (yalnız 13 + birkaç ürün);
 *   3. geri kalan için eski ucuz groupBy MIN(price > 0).
 *
 * Doğruluk: 3. yol yalnız tek fiyatlı gruplu üründe kullanılır; orada iki tanım eşittir.
 */
export interface StartingPriceProduct { id: string; pricingMode: string | null }

interface LoadedProduct {
  id: string;
  pricingMode: string | null;
  options: unknown;
  prices: { groupKey: string | null; optionKey: string | null; dimKey: string | null; price: unknown; cost: unknown }[];
}

/**
 * ÖNBELLEKLİ giriş (2026-09-08). Hesabın kendisi `hesaplaBaslangicFiyatlari`; burası yalnız
 * 60 saniyelik belleği ve uçuştaki istek paylaşımını ekler.
 *
 * NEDEN: hesap ~950 ms sürüyor ve vitrinde HER sayfa render'ı iki kez tetikliyor
 * (ürün listesi + kategoriler). 8 Eylül 14:32'de tek bir ziyaretçinin 39 sayfalık gezintisi
 * bağlantı havuzunu tüketti; 24 istek "connection pool timeout" ile düştü. Trafik 45 istekti,
 * yani sorun yük değil her isteğin pahalı olmasıydı.
 */
export async function topluBaslangicFiyatlari(
  prisma: Pick<PrismaService, "productOption" | "productPrice" | "product">,
  urunler: StartingPriceProduct[],
  getPricing: () => Promise<AreaPricingSettings>,
): Promise<Map<string, number | null>> {
  if (!urunler.length) return new Map();
  return onbellekliBaslangicFiyatlari(
    urunler.map((u) => u.id),
    () => hesaplaBaslangicFiyatlari(prisma, urunler, getPricing),
  );
}

/** Asıl hesap — önbelleksiz. Testler ve önbellek sarmalayıcısı buraya çağırır. */
export async function hesaplaBaslangicFiyatlari(
  prisma: Pick<PrismaService, "productOption" | "productPrice" | "product">,
  urunler: StartingPriceProduct[],
  getPricing: () => Promise<AreaPricingSettings>,
): Promise<Map<string, number | null>> {
  const sonuc = new Map<string, number | null>();
  if (!urunler.length) return sonuc;
  const ids = urunler.map((u) => u.id);

  // 1. Fiyatlı grup sayısı (hafif)
  const grupSatirlari = await prisma.productOption.groupBy({
    by: ["productId", "groupKey"],
    where: { productId: { in: ids }, groupRole: "priced" },
  });
  const grupSayisi = new Map<string, number>();
  for (const g of grupSatirlari) grupSayisi.set(g.productId, (grupSayisi.get(g.productId) ?? 0) + 1);

  // 2. Motor gerektirenler: area + çok fiyatlı-gruplu toplamsal
  const motorIds = urunler
    .filter((u) => u.pricingMode === "area" || (grupSayisi.get(u.id) ?? 0) > 1)
    .map((u) => u.id);
  if (motorIds.length) {
    const areaVar = urunler.some((u) => u.pricingMode === "area" && motorIds.includes(u.id));
    const pricing = areaVar ? await getPricing() : null;
    const yuklu = (await prisma.product.findMany({
      where: { id: { in: motorIds } },
      select: { id: true, pricingMode: true, options: true, prices: { select: { groupKey: true, optionKey: true, dimKey: true, price: true, cost: true } } },
    })) as unknown as LoadedProduct[];
    for (const ap of yuklu) {
      const rows = ap.prices.map((pr) => ({ groupKey: pr.groupKey, optionKey: pr.optionKey, dimKey: pr.dimKey, price: Number(pr.price), cost: pr.cost == null ? null : Number(pr.cost) }));
      if (!rows.length) { sonuc.set(ap.id, null); continue; }
      if (ap.pricingMode === "area") {
        sonuc.set(ap.id, pricing ? areaStartingPrice(ap.options as AreaDisplayOption[], ap.options, rows, pricing) : null);
      } else {
        sonuc.set(ap.id, additiveStartingPrice(ap.options, rows));
      }
    }
  }

  // 3. Geri kalan: MIN(price > 0) — tek fiyatlı gruplu üründe tam konfigürasyonla aynı
  const ucuzIds = ids.filter((id) => !sonuc.has(id));
  if (ucuzIds.length) {
    const mins = await prisma.productPrice.groupBy({
      by: ["productId"],
      where: { productId: { in: ucuzIds }, price: { gt: 0 } },
      _min: { price: true },
    });
    for (const m of mins) {
      const v = m._min.price == null ? null : Number(m._min.price);
      sonuc.set(m.productId, v && v > 0 ? v : null);
    }
    for (const id of ucuzIds) if (!sonuc.has(id)) sonuc.set(id, null);
  }
  return sonuc;
}
