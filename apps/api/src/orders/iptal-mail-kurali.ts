/**
 * İptal bildirimi müşteriye gönderilir mi?
 *
 * 2026-09-03 (Hasan): "Ödeme Bekliyor" durumundaki bir siparişi iptal edince
 * müşteriye mail gidiyordu. Ödemeyi hiç tamamlamamış kişi, aylar sonra bile
 * "yeni siparişim mi iptal oldu?" diye paniklüyor — oysa ortada tamamlanmış
 * bir sipariş yok. PARA GELMEYEN siparişin iptali müşteriyi ilgilendirmez;
 * bu bir kayıt temizliğidir.
 *
 * Kural saf fonksiyonda ve testli: koşullu bildirimlerin sayfa/servis içine
 * gömülmüş hâli yanlış durumda ateşlendiğinde fark edilmiyor.
 */

export type IptalMailDurumu = {
  /** "kart" | "havale" | "cari" | null */
  paymentMethod: string | null;
  /** PaymentStatus: beklemede | basarili | basarisiz | iade_edildi */
  paymentStatus: string | null;
};

export function iptalMailiGonderilirMi(order: IptalMailDurumu): boolean {
  // Para tahsil edildi → iptal, iade beklentisi doğurur; müşteri mutlaka bilmeli.
  if (order.paymentStatus === "basarili") return true;
  if (order.paymentStatus === "iade_edildi" || order.paymentStatus === "iade-edildi") return true;

  // Cari (açık hesap): tasarımı gereği peşin ödeme yok ama sipariş ONAYLI,
  // üretime giriyor ve ay sonunda faturalanıyor. İptali gerçek bir olaydır.
  if (order.paymentMethod === "cari") return true;

  // Geriye kalan: kartta yarıda bırakılmış ödeme, ödenmemiş havale, başarısız
  // ödeme denemesi. Para gelmedi → sessizce iptal et.
  return false;
}
