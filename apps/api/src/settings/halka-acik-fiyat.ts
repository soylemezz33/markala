/**
 * Halka açık fiyat ayarlarından ticari alanların ayıklanması (2026-09-07).
 *
 * 31 Ağustos denetiminde ürün ve kategori bazlı `profitMargin` public yanıtlardan
 * ayıklanmıştı; ancak `GET /settings/pricing` içindeki GLOBAL `marj` çarpanı gözden
 * kaçtı ve hem o uçtan hem ürün sayfasının kaynağından okunabiliyordu.
 *
 * Ayrı ve saf tutulmasının sebebi: bu ayıklamanın sessizce geri alınması, marjın
 * yeniden herkese açılması demek. Nöbetçi testler buraya bakıyor.
 */

export type FiyatAyarlari = { kur: number; marj: number; kdv: number; minM2: number };
export type HalkaAcikFiyatAyarlari = Omit<FiyatAyarlari, "marj">;

/** `marj` HER ZAMAN düşer; diğer alanlar aynen korunur (konfigüratör bunlara muhtaç). */
export function halkaAcikFiyatAyarlari(ayarlar: FiyatAyarlari): HalkaAcikFiyatAyarlari {
  const { marj: _gizli, ...halkaAcik } = ayarlar;
  return halkaAcik;
}
