/**
 * Markala iletişim/sipariş kanalları (tek kaynak).
 * WhatsApp = mobil hat (905319004102) — sabit hat (0324) WhatsApp'a kayıtlı DEĞİL.
 * Arama (tel:) = sabit hat. İkisi ayrı kanaldır; karıştırma.
 */
export const MARKALA_WHATSAPP_NUMBER = "905319004102";
export const MARKALA_PHONE_NUMBER = "+903244333351";
export const MARKALA_PHONE_DISPLAY = "0324 433 33 51";

/** Verilen mesajı önceden doldurulmuş bir wa.me bağlantısına çevirir. */
export function whatsappUrl(message: string): string {
  return `https://wa.me/${MARKALA_WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
}

/** tel: bağlantısı. */
export function phoneUrl(): string {
  return `tel:${MARKALA_PHONE_NUMBER}`;
}
