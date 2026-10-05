/**
 * Başarısız ödemede MÜŞTERİYE yazılacak kısa sebep ve çıkış yolu (2026-10-05).
 *
 * Web tarafındaki `apps/web/src/lib/odeme-hata-mesaji.ts` ile aynı işi yapar ama AYRI durur:
 * apps/api içinden packages/* ya da apps/web'e değer import'u yapılmaz (prod'da çöküyor,
 * bkz. API runtime paket import tuzağı). İki tablo da kısa; birbirinden sapmaları hâlinde
 * müşteriye farklı iki metin gider, o yüzden değişiklikte ikisi birlikte güncellenmeli.
 *
 * Kapsam bilinçli olarak DAR: yalnız canlıda gerçekten görülmüş kodlar. Bilinmeyen kodda
 * uydurma açıklama üretilmez, nötr metne düşülür.
 */
export interface OdemeHataOzeti {
  /** Tek cümlelik sebep — mailin ilk satırında geçer. */
  sebep: string;
  /** Müşterinin atabileceği somut adım. */
  cikisYolu: string;
}

const TABLO: Record<string, OdemeHataOzeti> = {
  "10005": {
    sebep: "Bankan işlemi onaylamadı.",
    cikisYolu:
      "En sık sebep kartın internetten alışverişe kapalı olmasıdır. Bankanı arayıp açtırabilir ya da başka bir kartla deneyebilirsin.",
  },
  "10051": {
    sebep: "Kartın limiti ya da bakiyesi işleme yetmedi.",
    cikisYolu: "Başka bir kartla deneyebilir ya da havale/EFT ile ödeyebilirsin.",
  },
  "10012": {
    sebep: "Kart bilgileri doğrulanamadı.",
    cikisYolu: "Kart numarası, son kullanma tarihi ve CVC'yi kontrol edip tekrar deneyebilirsin.",
  },
  "10041": {
    sebep: "Kartın bu işlem için kullanıma kapalı görünüyor.",
    cikisYolu: "Bankanla görüşmen ya da başka bir kart denemen gerekiyor.",
  },
  "10052": {
    sebep: "3D Secure doğrulaması tamamlanmadı.",
    cikisYolu: "Bankanın SMS ile gönderdiği kodu girerek tekrar deneyebilirsin.",
  },
  "10054": {
    sebep: "Kartın son kullanma tarihi geçmiş görünüyor.",
    cikisYolu: "Güncel bir kartla tekrar deneyebilirsin.",
  },
  "10084": {
    sebep: "Kartın güvenlik kodu (CVC) doğrulanamadı.",
    cikisYolu: "Kartın arkasındaki 3 haneli kodu kontrol edip tekrar deneyebilirsin.",
  },
  "10201": {
    sebep: "Ödeme adımı zaman aşımına uğradı.",
    cikisYolu: "Tekrar denediğinde çoğunlukla sorunsuz tamamlanır.",
  },
  /**
   * Bu hata MÜŞTERİDEN kaynaklanmaz, bizim üye işyeri tanımımızdaki kategori (MCC) kodundan
   * kaynaklanır. Müşteriye "kartını kontrol et" demek yanlış yönlendirme olur.
   */
  "10208": {
    sebep: "Ödeme altyapımız kaynaklı bir sorun oluştu — kartınla ilgili değil.",
    cikisYolu:
      "Tekrar denemen çoğunlukla yeterli oluyor. Yine olmazsa 0324 433 33 51'den bize ulaş, ödemeyi birlikte tamamlayalım.",
  },
};

const NOTR: OdemeHataOzeti = {
  sebep: "Ödemen tamamlanamadı.",
  cikisYolu: "Aynı kartla tekrar deneyebilir, farklı bir kart kullanabilir ya da havale/EFT ile ödeyebilirsin.",
};

export function odemeHataOzeti(kod: string | null | undefined): OdemeHataOzeti {
  if (!kod) return NOTR;
  return TABLO[kod.trim()] ?? NOTR;
}
