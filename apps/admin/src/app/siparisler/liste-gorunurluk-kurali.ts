/**
 * Sipariş listesinde bir satır görünür mü?
 *
 * 2026-09-24 (Hasan): "iptaller çok yer kaplıyor, ben özellikle seçmedikçe gözükmesin".
 * "Tümü" görünümü iptal edilmiş siparişleri GİZLER; görmek için durum filtresinden
 * "İptal" seçilir. Gizlenenler yok sayılmaz — başlıkta "N iptal gizli" olarak yazar.
 *
 * Kural ayrı dosyada çünkü hem listeyi hem sayaçları hem CSV dışa aktarımını besliyor;
 * üçü ayrışırsa kullanıcı listede görmediği siparişi sayıda veya CSV'de görür.
 */
export const IPTAL_DURUMU = "iptal-edildi";

/** Durum filtresi değeri: "all" ya da bir durum anahtarı. */
export function siparisListedeGorunur(durumSlug: string, durumFiltresi: string): boolean {
  if (durumFiltresi === "all") return durumSlug !== IPTAL_DURUMU;
  return durumSlug === durumFiltresi;
}
