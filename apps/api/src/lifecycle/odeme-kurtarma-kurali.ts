/**
 * Ödeme kurtarma mailinin KİME ve NE ZAMAN gideceği (saf kural, 2026-10-05).
 *
 * Neden ayrı modül: kural karmaşıklaştı (iki ödeme durumu, iki farklı zamanlama, mükerrer
 * sipariş koruması) ve cron'un içine gömülü hâliyle test edilemiyordu.
 *
 * ESKİ DAVRANIŞ VE HATASI: kurtarma yalnız paymentStatus="beklemede" siparişleri hedefliyordu.
 * Kartı reddedilen müşteri "basarisiz" oluyor ve filtreden düşüyordu — ona HİÇBİR ŞEY
 * gitmiyordu. Canlı veri (5 Eki 2026): 6 başarısız ödeme müşterisinden 3'ü aynı oturumda
 * dakikalar içinde kendi kendine tekrar deneyip ödedi; siteden çıkan 2'si (2.330 ₺) bir daha
 * hiç dönmedi. Yani kurtarma penceresi DAR ve ERKEN olmalı.
 */

/** Zamanlama eşikleri (saat). 72 saatten eski siparişe hiç dokunulmaz. */
export const KURTARMA_SURELERI = {
  /** Bekleyen ödeme: müşteri hâlâ ödeme akışında olabilir, 2 saat dürtme. */
  beklemedeMinSaat: 2,
  /**
   * Başarısız ödeme: müşteri kartının reddedildiğini zaten gördü, beklemenin anlamı yok.
   * 15 dakika, aynı oturumda tekrar deneyenleri boş yere dürtmemek için bırakılan paydır.
   */
  basarisizMinSaat: 0.25,
  /** Bu yaştan sonra ilk hatırlatma atlanır, doğrudan son hatırlatma gider. */
  ilkAsamaMaxSaat: 24,
  /** Üst sınır — daha eskisi ölü sayılır. */
  sonAsamaMaxSaat: 72,
} as const;

/** Kurtarma kapsamındaki ödeme durumları. */
export const KURTARILABILIR_DURUMLAR = ["beklemede", "basarisiz"] as const;
export type KurtarilabilirDurum = (typeof KURTARILABILIR_DURUMLAR)[number];

export interface KurtarmaGirdisi {
  /** Order.paymentStatus */
  odemeDurumu: string;
  /** Siparişin yaşı (saat). */
  yasSaat: number;
  /** Order.recoveryMailStage — 0, 1 ya da 2. */
  gonderilenAsama: number;
  /**
   * Aynı müşterinin BU siparişten SONRA oluşturulmuş ödenmiş bir siparişi var mı?
   *
   * Kritik: kartı reddedilen müşteri çoğu zaman sepeti yeniden kurup yeni sipariş açıyor
   * (canlıda semsiperimcek33 üç, a-dikkanoglu iki sipariş açtı). Eski başarısız siparişe
   * "ödemeni tamamla" maili atmak müşteriyi zaten ödediği bir iş için sıkıştırmak olur.
   */
  sonrakiOdenmisSiparisVar: boolean;
}

/** Ödeme durumu kurtarma kapsamında mı? */
export function kurtarilabilirDurumMu(odemeDurumu: string): boolean {
  return (KURTARILABILIR_DURUMLAR as readonly string[]).includes(odemeDurumu);
}

/** Bu durum için ilk hatırlatmanın gönderilebileceği en erken yaş (saat). */
export function minimumYasSaat(odemeDurumu: string): number {
  return odemeDurumu === "basarisiz"
    ? KURTARMA_SURELERI.basarisizMinSaat
    : KURTARMA_SURELERI.beklemedeMinSaat;
}

/**
 * Hangi aşama gönderilmeli? null = şimdi gönderme.
 *
 * 1 = ilk hatırlatma, 2 = son hatırlatma. Aşama tek yönlü ilerler; 24 saati geçmiş ama hiç
 * mail almamış sipariş doğrudan 2 alır (üst üste iki mail gitmesin).
 */
export function kurtarmaAsamasi(g: KurtarmaGirdisi): 1 | 2 | null {
  if (!kurtarilabilirDurumMu(g.odemeDurumu)) return null;
  if (g.sonrakiOdenmisSiparisVar) return null;
  if (g.gonderilenAsama >= 2) return null;
  if (g.yasSaat > KURTARMA_SURELERI.sonAsamaMaxSaat) return null;
  if (g.yasSaat < minimumYasSaat(g.odemeDurumu)) return null;

  if (g.yasSaat >= KURTARMA_SURELERI.ilkAsamaMaxSaat) return g.gonderilenAsama < 2 ? 2 : null;
  return g.gonderilenAsama < 1 ? 1 : null;
}
