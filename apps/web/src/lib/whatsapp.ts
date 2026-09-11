/**
 * Markala iletişim/sipariş kanalları (tek kaynak).
 * WhatsApp = sabit hat 0324 433 33 51 (903244333351). 2026-09-11: hat Meta Cloud API'de,
 * Chatwoot (chat.324ajans.com) gelen kutusuna bağlı; eski mobil hat 0531 900 41 02 artık
 * yalnız çağrı yönlendirme hedefi, WhatsApp olarak gösterilmez.
 * Arama (tel:) = sabit hat. İkisi ayrı kanaldır; karıştırma.
 */
export const MARKALA_WHATSAPP_NUMBER = "903244333351";
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
