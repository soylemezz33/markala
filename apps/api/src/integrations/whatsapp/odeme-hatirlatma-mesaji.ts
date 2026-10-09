/**
 * ÖDEME HATIRLATMASI (WhatsApp) — 2026-10-09, Hasan: "panele bir buton koyalım, havale
 * düşmeyen ve ödeme yapmadan çıkan müşteriler için".
 *
 * 8-9 Ekim'de elle gönderdiğimiz dört hatırlatmanın (31.471 ₺'lik sipariş) kurallaştırılmış
 * hâli. Saf modül: metin üretimi ve "gönderilebilir mi?" kararı burada, I/O servis tarafında.
 *
 * ŞABLON (Meta'da ONAYLI, siparis_hatirlatma/tr):
 *   "Merhaba {{1}}, Markala.com.tr olarak hatırlatmak istedik: {{2}}. Yardımcı olmamızı ister misiniz?"
 * Yani {{2}} cümlenin ortasına girer → sonunda nokta YOK, cümle küçük harfle akar.
 *
 * HİTAPTA BEY/HANIM YOK (bilinçli): cinsiyet tahmini yanlış olduğunda mesaj kaba düşer.
 * Yalnız ad kullanılır ("Merhaba Fatih, ..."), ad yoksa "değerli müşterimiz".
 */

/** Meta'da onaylı şablon; env ile değiştirilebilir (WHATSAPP_HATIRLATMA_TEMPLATE). */
export const HATIRLATMA_SABLON_ADI = "siparis_hatirlatma";
export const HATIRLATMA_SABLON_DILI = "tr";
/** notification_logs.template — hem mükerrer kontrolü hem panel filtresi buna bakar. */
export const WA_HATIRLATMA_KAYDI = "whatsapp-odeme-hatirlatma";
/** Aynı siparişe bu süre dolmadan ikinci hatırlatma gönderilmez (rahatsız etmeme). */
export const HATIRLATMA_BEKLEME_SAAT = 12;
/** Sipariş bu yaştan gençse hatırlatma erken: müşteri hâlâ ödeme ekranında olabilir. */
export const HATIRLATMA_MIN_YAS_DAKIKA = 30;

/** Ödemesi beklenen durumlar — "basarili"ye ya da iptale düşmüş siparişe hatırlatma gitmez. */
export const HATIRLATILABILIR_ODEME = ["beklemede", "basarisiz"] as const;

export interface HatirlatmaGirdisi {
  paymentStatus: string;
  /** Sipariş durumu; iptal edilmiş siparişe hatırlatma gitmez. */
  status: string;
  createdAt: Date;
  /** Bu siparişe en son ne zaman hatırlatma gitti (başarılı). Hiç gitmediyse null. */
  sonHatirlatma: Date | null;
  simdi: Date;
}

export interface HatirlatmaKarari {
  uygun: boolean;
  /** uygun=false ise kullanıcıya gösterilecek sebep (panelde toast). */
  sebep?: string;
}

export function hatirlatmaUygunMu(g: HatirlatmaGirdisi): HatirlatmaKarari {
  if (!(HATIRLATILABILIR_ODEME as readonly string[]).includes(g.paymentStatus)) {
    return { uygun: false, sebep: "Bu siparişin ödemesi beklemiyor; hatırlatma gönderilmez." };
  }
  // Prisma enum değeri "iptal_edildi", DB/DTO karşılığı "iptal-edildi" — ikisi de kapalı.
  if (g.status === "iptal_edildi" || g.status === "iptal-edildi") {
    return { uygun: false, sebep: "İptal edilmiş siparişe hatırlatma gönderilmez." };
  }
  const yasDk = (g.simdi.getTime() - g.createdAt.getTime()) / 60000;
  if (yasDk < HATIRLATMA_MIN_YAS_DAKIKA) {
    return {
      uygun: false,
      sebep: `Sipariş çok yeni (${Math.max(0, Math.round(yasDk))} dk). Müşteri hâlâ ödeme ekranında olabilir; ${HATIRLATMA_MIN_YAS_DAKIKA} dk sonra deneyin.`,
    };
  }
  if (g.sonHatirlatma) {
    const gecenSaat = (g.simdi.getTime() - g.sonHatirlatma.getTime()) / 3600000;
    if (gecenSaat < HATIRLATMA_BEKLEME_SAAT) {
      const kalan = Math.ceil(HATIRLATMA_BEKLEME_SAAT - gecenSaat);
      return {
        uygun: false,
        sebep: `Bu siparişe ${Math.floor(gecenSaat)} saat önce hatırlatma gönderildi. ${kalan} saat sonra tekrar gönderilebilir.`,
      };
    }
  }
  return { uygun: true };
}

/** "FATİH ÜSTÜNDAĞ" → "Fatih" · boşsa "değerli müşterimiz". */
export function hitap(adSoyad: string | null | undefined): string {
  const ilk = String(adSoyad ?? "").trim().split(/\s+/)[0] ?? "";
  if (!ilk || ilk.length < 2) return "değerli müşterimiz";
  return ilk.charAt(0).toLocaleUpperCase("tr-TR") + ilk.slice(1).toLocaleLowerCase("tr-TR");
}

/**
 * Şablonun {{2}} parçası. İki hâl var ve ayrımı ödeme YÖNTEMİ belirler:
 *  - havale: para bizden kaynaklı değil, müşteri göndermemiş → "hesabımıza ulaşmadı"
 *  - kart/diğer: sepet bırakılmış, ödeme ekranı tamamlanmamış → "tamamlamadığınızı görüyoruz"
 * Fiyat, indirim ya da IBAN YAZILMAZ: bunlar müşteri yanıtlayınca ekip tarafından konuşulur.
 */
export function hatirlatmaMetni(orderNumber: string, paymentMethod: string | null | undefined): string {
  return paymentMethod === "havale"
    ? `${orderNumber} numaralı siparişinizin havale ödemesi henüz hesabımıza ulaşmadı`
    : `${orderNumber} numaralı siparişinizin ödemesini tamamlamadığınızı görüyoruz`;
}

/** Şablon gövdesinin birebir önizlemesi — panelde onay kutusunda gösterilir. */
export function hatirlatmaOnizleme(ad: string, metin: string): string {
  return `Merhaba ${ad}, Markala.com.tr olarak hatırlatmak istedik: ${metin}. Yardımcı olmamızı ister misiniz?`;
}

/** Şablon parametreleri sırayla: {{1}} hitap, {{2}} durum cümlesi. */
export function hatirlatmaParametreleri(
  musteriAdi: string | null | undefined,
  orderNumber: string,
  paymentMethod: string | null | undefined,
): { parametreler: string[]; onizleme: string } {
  const ad = hitap(musteriAdi);
  const metin = hatirlatmaMetni(orderNumber, paymentMethod);
  return { parametreler: [ad, metin], onizleme: hatirlatmaOnizleme(ad, metin) };
}
