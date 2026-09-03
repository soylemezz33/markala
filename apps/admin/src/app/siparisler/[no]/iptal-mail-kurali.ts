/**
 * İptal onay penceresinde "müşteriye e-posta gidecek mi?" cümlesi.
 *
 * KAYNAK KURAL API'de: apps/api/src/orders/iptal-mail-kurali.ts — maili gönderip
 * göndermemeye sunucu karar verir. Buradaki kopya YALNIZ onay metnini doğru
 * yazmak içindir; ikisi ayrışırsa admin, olmayacak bir maili haber verir.
 * Değiştirirken İKİSİNİ birden değiştir (iptal-mail-kurali.spec.ts ikisinde de var).
 */
export function iptalMailiGonderilirMi(order: {
  paymentMethod?: string | null;
  paymentStatus?: string | null;
}): boolean {
  const durum = String(order.paymentStatus ?? "");
  if (durum === "basarili") return true;
  if (durum === "iade_edildi" || durum === "iade-edildi") return true;
  if (order.paymentMethod === "cari") return true;
  return false;
}
