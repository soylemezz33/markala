/**
 * "TASARIM ONAYI" WHATSAPP MESAJI — mesaj kurgusu (2026-09-21, Hasan/Oğuzhan talebi).
 *
 * İHTİYAÇ: Tasarımcı işi bitirdiğinde müşteriden onay almak gerekiyor. Ama WhatsApp Cloud
 * API'de müşteri son 24 saat içinde yazmadıysa SERBEST mesaj gönderilemez (hata 131047) —
 * ekip müşterinin yazmasını bekliyor, iş baskıya geç gidiyor (özellikle kartvizit).
 *
 * ÇÖZÜM: 24 saat penceresi kapalıyken de ONAYLI ŞABLON gönderilebilir ve bir şablonun
 * BAŞLIĞI GÖRSEL olabilir. Yani tasarım önizlemesi, müşteri hiç yazmamış olsa bile
 * şablonun içinde gider. Metin şablonu tek başına işe yaramaz: müşteri görmediği tasarımı
 * onaylayamaz — bu yüzden görsel başlık bu özelliğin ZORUNLU parçasıdır.
 *
 * ── META'DA OLUŞTURULACAK ŞABLON ──────────────────────────────────────────────────────
 *   Ad       : tasarim_onay          Kategori: UTILITY          Dil: tr
 *   Başlık   : GÖRSEL (IMAGE)  ← önizleme buraya basılır
 *   Gövde    : Merhaba {{1}}, {{2}} numaralı siparişinizin tasarımı hazır. Yukarıdaki
 *              görseli inceleyip onaylarsanız baskıya alıyoruz. Revize isterseniz
 *              notunuzu bu mesaja yazabilirsiniz.
 *   Düğmeler : "Onaylıyorum" · "Revize istiyorum"  (hızlı yanıt — opsiyonel ama önerilir)
 *
 * ⚠️ PARAMETRE SIRASI ŞABLONA BAĞLIDIR. Meta'da gövde metni değişir de {{1}}/{{2}} yer
 * değiştirirse müşteri adı ile sipariş numarası karışır. Şablonu düzenleyen bu dosyayı da
 * güncellemeli (aynı tuzak yeni_siparis_bildirimi'nde de var).
 *
 * ⚠️ Düğmeler hızlı YANIT (quick reply) olmalı, URL değil: müşteri dokununca WhatsApp'a
 * mesaj olarak düşer → hem cevabı alırsınız hem 24 saatlik pencere açılır, sonrası serbest
 * yazışma. Webhook Chatwoot'a gittiği için yanıt WhatsApp kutusunda görünür.
 */

/** Meta'daki şablon adı. Env `WHATSAPP_TASARIM_ONAY_TEMPLATE` ile geçersiz kılınabilir. */
export const ONAY_SABLON_ADI = "tasarim_onay";
export const ONAY_SABLON_DILI = "tr";

/** notification_logs.template — mükerrer kontrolü ve panel filtresi bu ada bakar. */
export const WA_ONAY_KAYDI = "whatsapp-design-approval";

/**
 * WhatsApp görsel başlığının kabul ettiği tipler. Tasarımcı PDF/AI yüklemiş olabilir;
 * onları göndermek ANLAMSIZDIR (müşteri WhatsApp'ta göremez) — bu yüzden önizleme seçilirken
 * bu listeye göre elenir ve uygun görsel yoksa iş yapılmaz, sessizce yanlış dosya gitmez.
 */
export const ONAY_GORSEL_MIME = ["image/jpeg", "image/png"] as const;

/** Meta görsel başlığı için üst sınır 5 MB; büyüğü reddedilir (#131052). */
export const ONAY_GORSEL_MAX_BAYT = 5 * 1024 * 1024;

export function gorselUygunMu(mimetype: string | null | undefined): boolean {
  return (ONAY_GORSEL_MIME as readonly string[]).includes(String(mimetype ?? "").toLowerCase());
}

export type OnayOzeti = {
  orderNumber: string;
  /** Müşteri adı — adres snapshot'ından ya da hesap adından. Boşsa e-postaya düşülür. */
  musteriAdi?: string | null;
  email?: string | null;
};

/**
 * Şablon gövde parametreleri: [müşteri adı, sipariş no].
 * `tekSatir` ZORUNLU — şablon parametresi satır sonu/sekme içeremez (#132000).
 */
export function tasarimOnayParametreleri(
  o: OnayOzeti,
  tekSatir: (deger: unknown, tavan?: number) => string,
): string[] {
  const musteri = tekSatir(o.musteriAdi?.trim() || o.email?.trim() || "değerli müşterimiz", 60);
  return [musteri || "değerli müşterimiz", tekSatir(o.orderNumber, 40)];
}
