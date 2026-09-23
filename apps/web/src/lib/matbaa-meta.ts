/**
 * /matbaa şehir ve ilçe sayfalarının başlık/açıklama kalıbı.
 *
 * Layout başlığa "%s · Markala" (10 karakter) ekliyor; Google ~65 karakterde kesiyor →
 * sayfanın kendi başlığına kalan bütçe 55. Uzun il adlarında ("Afyonkarahisar",
 * "Kahramanmaraş") ve Mersin ilçelerinde eski kalıp bu sınırı aşıp SERP'te teslim
 * vaadini kesiyordu (2026-09-23 denetimi: 10 sayfa). Kalıp kısaltılabilir olduğu için
 * kelime atmak yerine kademeli daraltıyoruz; sorgu karşılığı olan "<yer> matbaa ...
 * fiyatları" kısmı her kademede korunuyor.
 */
export const MATBAA_BASLIK_SINIR = 55;
export const MATBAA_ACIKLAMA_SINIR = 160;

/**
 * @param yer  "Afyonkarahisar" ya da "Yenişehir Mersin"
 * @param teslim      tam vaat: "2-4 Günde Kapında"
 * @param teslimKisa  daraltılmış vaat: "2-4 Gün"
 */
export function matbaaBaslik(yer: string, teslim: string, teslimKisa: string): string {
  const enDar = `${yer} Matbaa Fiyatları`;
  const kademeler = [
    `${yer} Matbaa & Baskı Fiyatları - ${teslim}`,
    `${yer} Matbaa Baskı Fiyatları - ${teslimKisa}`,
    `${yer} Matbaa & Baskı Fiyatları`,
    enDar,
  ];
  return kademeler.find((k) => k.length <= MATBAA_BASLIK_SINIR) ?? enDar;
}

/** İl sayfasının teslim vaadinin üç biçimi — başlık uzun/kısa ve açıklama cümlesi. */
export function matbaaTeslim(min: number, max: number, ayniGun: boolean) {
  if (ayniGun || min === 0) {
    return { teslim: "Aynı Gün Teslim", teslimKisa: "Aynı Gün", teslimCumle: "aynı gün" };
  }
  const aralik = min === max ? `${min}` : `${min}-${max}`;
  return {
    teslim: `${aralik} Günde Kapında`,
    teslimKisa: `${aralik} Gün`,
    teslimCumle: `${aralik} iş gününde`,
  };
}

/** İl sayfası açıklaması. 2026-09-23: "siparişiniz" atıldı — Afyonkarahisar 161'e taşıyordu. */
export function matbaaIlAciklama(il: string, teslimCumle: string): string {
  return `${il} için online matbaa: kartvizit, broşür, afiş, etiket ve İSG levhaları. KDV dahil fiyatı anında görün, ${teslimCumle} DHL ile kapınızda.`;
}

/** İlçe sayfası açıklaması. */
export function matbaaIlceAciklama(ilce: string, ayniGun: boolean): string {
  const teslim = ayniGun ? "aynı gün motor kurye ile teslim" : "2-4 iş gününde kapınızda";
  return `${ilce} için online matbaa: kartvizit, broşür, afiş, etiket ve İSG levhaları. KDV dahil fiyatı anında görün - ${teslim}.`;
}
