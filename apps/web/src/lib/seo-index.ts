/**
 * Hangi sayfa arama motoruna SUNULUR? Sitemap ve sayfa `robots` metadata'sının TEK kaynağı —
 * ikisi çeliştiğinde Google karışık sinyal alır, o yüzden aynı fonksiyondan besleniyorlar.
 *
 * Kural dışı bırakılan sayfalar SİTEDE KALIR: kullanıcı gezinir, sipariş verir, iç
 * bağlantılar çalışır. Yalnız indekse girmezler (`follow` açık — bağlantı akışı sürer).
 *
 * ——— 2026-09-23 ölçümü, Hasan onaylı ———
 *
 * İL SAYFALARI: 81 il + 9 Mersin ilçesi, 90 günde toplam 1.043 gösterim / 11 tık.
 * URL denetiminde 12 örneğin 10'u indekste DEĞİL ("URL is unknown to Google" ya da
 * "Discovered – currently not indexed"); yalnız Osmaniye ve Gaziantep indekste.
 * Sitemap gönderilmiş ve /matbaa 81 ilin hepsine bağlantı veriyor — yani keşif sorunu
 * yok, Google şablon sayfaları indekslemeye DEĞER BULMUYOR. Şehir adı maskelendiğinde
 * şablon illerin içeriği birbirinin %40-50'si. Sipariş verisi de il bazlı iddia kurmaya
 * yetmiyor (32 ilde ~95 sipariş). Bu yüzden yalnız ELLE YAZILMIŞ (curated) iller indekse
 * sunulur; bir il için gerçek içerik yazıldığında `curated: true` yapılır ve otomatik
 * girer. Mersin ilçeleri, Mersin curated olduğu için kapsamdadır.
 *
 * PROMOSYON SKU'LARI: toptancı feed'inden gelen 420 üründen 410'u hiç gösterim almıyor;
 * alan 10'u da 90 günde toplam 12 gösterim / 1 tık üretti. "Promosyon Kristal Masa
 * İsimliği 6765" gibi kod numaralı jenerik adlar hiçbir sorguyla eşleşmiyor. Tarama
 * bütçesini asıl kataloğa bırakmak için indekse sunulmuyorlar.
 */

/** Toptancı feed'inden gelen promosyon ürünlerinin slug öneki. */
const PROMOSYON_ONEK = "promosyon-";

/** Ürün sayfası indekse sunulur mu? */
export function urunIndekslenir(slug: string): boolean {
  return !slug.startsWith(PROMOSYON_ONEK);
}

/** İl (ve altındaki ilçe) sayfaları indekse sunulur mu? */
export function ilIndekslenir(curated: boolean): boolean {
  return curated;
}

/** `robots` metadata'sı: indekslenmeyen sayfa taranmaya ve bağlantı akışına açık kalır. */
export const NOINDEX = { index: false, follow: true } as const;
