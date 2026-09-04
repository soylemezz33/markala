/**
 * iyzico hata kodunu müşterinin ANLAYACAĞI bir açıklamaya çevirir (2026-09-04).
 *
 * Neden var: ödeme başarısız olunca müşteri "Ödeme tamamlanamadı" diyen genel bir sayfa
 * görüyordu. Sebep (ör. "Kart limiti yetersiz") veritabanına yazılıyor ve PANELDE
 * görünüyordu ama müşteriye HİÇ iletilmiyordu — müşteri ne yapacağını bilemeyip
 * WhatsApp'tan "ödemem neden onaylanmadı?" diye yazıyordu (Hasan bildirdi).
 *
 * Tasarım: ham banka metnini URL'den taşımak yerine KOD taşınır ve karşılığı burada
 * yazılır. Böylece metin bizim kontrolümüzde kalır (URL ile oynanamaz) ve her hata için
 * NE YAPILACAĞINI da söyleyebiliriz.
 */
export interface OdemeHatasi {
  /** Kısa başlık — "Ödeme tamamlanamadı" yerine geçer. */
  baslik: string;
  /** Ne olduğu, müşteri diliyle. */
  aciklama: string;
  /** Somut çıkış yolu; boşsa genel öneriler gösterilir. */
  oneri?: string;
}

/**
 * Kodlar iyzico'nun hata kodlarıdır. Listede olmayan kod GENEL mesaja düşer —
 * uydurma açıklama üretilmez.
 */
const KOD_TABLOSU: Record<string, OdemeHatasi> = {
  "10051": {
    baslik: "Kartın limiti yetmedi",
    aciklama: "Bankan işlemi limit/bakiye yetersizliği nedeniyle onaylamadı.",
    oneri: "Başka bir kartla deneyebilir ya da havale/EFT ile ödeyip %5 indirim kazanabilirsin.",
  },
  "10005": {
    baslik: "Banka işlemi onaylamadı",
    aciklama: "Bankan bu işleme izin vermedi. Sebebini yalnız bankan görebiliyor.",
    oneri: "Bankanı arayıp internetten alışverişe izin verilmesini isteyebilir ya da başka bir kart deneyebilirsin.",
  },
  "10012": {
    baslik: "Kart bilgileri hatalı",
    aciklama: "Kart numarası, son kullanma tarihi veya CVC bilgisi doğrulanamadı.",
    oneri: "Bilgileri kontrol edip tekrar deneyebilirsin.",
  },
  "10041": {
    baslik: "Kart kullanıma kapalı",
    aciklama: "Kartın bu işlem için kullanılamıyor.",
    oneri: "Bankanla görüşmen ya da başka bir kart denemen gerekiyor.",
  },
  "10054": {
    baslik: "Kartın son kullanma tarihi geçmiş",
    aciklama: "Girilen kartın süresi dolmuş görünüyor.",
    oneri: "Güncel bir kartla tekrar deneyebilirsin.",
  },
  "10084": {
    baslik: "CVC bilgisi hatalı",
    aciklama: "Kartın arkasındaki 3 haneli güvenlik kodu doğrulanamadı.",
    oneri: "Kodu kontrol edip tekrar deneyebilirsin.",
  },
  "10201": {
    baslik: "İşlem zaman aşımına uğradı",
    aciklama: "Ödeme adımı beklenenden uzun sürdüğü için iptal edildi.",
    oneri: "Tekrar denediğinde çoğunlukla sorunsuz tamamlanır.",
  },
  // 3D Secure doğrulaması tamamlanmadı (şifre girilmedi / pencere kapatıldı).
  "10052": {
    baslik: "3D Secure doğrulaması tamamlanmadı",
    aciklama: "Bankanın gönderdiği doğrulama adımı tamamlanmadan işlem sonlandı.",
    oneri: "SMS ile gelen kodu girerek tekrar deneyebilirsin.",
  },
};

const GENEL: OdemeHatasi = {
  baslik: "Ödeme tamamlanamadı",
  aciklama: "Ödemen alınamadı ya da işlem iptal edildi.",
};

export function odemeHataMesaji(kod: string | null | undefined): OdemeHatasi {
  if (!kod) return GENEL;
  return KOD_TABLOSU[kod.trim()] ?? GENEL;
}

/** Bilinen kod mu? (arayüz, bilinmeyen kodda genel metni farklı sunabilir) */
export function bilinenHataKodu(kod: string | null | undefined): boolean {
  return !!kod && kod.trim() in KOD_TABLOSU;
}
