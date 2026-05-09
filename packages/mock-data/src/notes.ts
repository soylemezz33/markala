/**
 * Tüm matbaa ürünlerinde, mesafeli satış sözleşmesinde ve iade sayfasında
 * tek kaynak olarak kullanılan üretim fire notu.
 *
 * Hasan'ın talimatı: bu metin değişmez ve hem ürün açıklamalarında hem de
 * yasal sözleşmelerde aynı sözcüklerle yer almalıdır.
 */
export const PRODUCTION_TOLERANCE_NOTE =
  "Lütfen Dikkat: Siparişlerinizin Renk, Adet ve Ölçülerinde %1 ila %5 arasında fire olabilmektedir.";

/** Aynı not, paragrafa append edilebilir hâli (boş satır ile ayrı). */
export const PRODUCTION_TOLERANCE_PARAGRAPH = `\n\n${PRODUCTION_TOLERANCE_NOTE}`;
