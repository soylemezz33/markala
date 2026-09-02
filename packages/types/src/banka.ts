/**
 * Havale/EFT banka bilgileri — TEK KAYNAK (hem API hem web buradan okur).
 *
 * Neden packages/types içinde: IBAN'ın iki yerde yazılması KABUL EDİLEMEZ.
 * API bunu sipariş e-postasına, web ise ödeme ve sipariş sayfalarına basıyor;
 * ikisi ayrışırsa müşteri yanlış hesaba para gönderir ve geri dönüşü zordur.
 * apps/web/src/lib/company.ts bunu yeniden dışa açar — web tarafında "firma
 * bilgisi tek dosyadan gelir" alışkanlığı bozulmasın diye.
 *
 * Hesap sahibi, sitenin satıcı tüzel kişiliğiyle AYNIdır (Markala, 324 Ajans'ın
 * alt markası) — müşteri farklı bir isme para göndermiş olmaz.
 */

/** Alıcı hesap. Ünvan, ETBİS kaydındaki resmî hâliyle yazılır. */
export const BANKA_HESABI = {
  /** Hesap sahibi — havale ekranında "Alıcı" olarak gösterilir. */
  unvan:
    "324 Ajans Bilgi Teknolojileri Reklam Pazarlama ve Ticaret Limited Şirketi",
  banka: "Enpara Bank A.Ş.",
  /** Ekranda gösterilen, 4'erli gruplanmış biçim (okunması/kontrolü kolay). */
  iban: "TR21 0015 7000 0000 0131 9850 21",
  /** Kopyala butonu ve makine karşılaştırmaları için boşluksuz biçim. */
  ibanDuz: "TR210015700000000131985021",
} as const;

/**
 * Havale/EFT ile ödeyene uygulanan indirim (%).
 * Gerekçe: kart komisyonu ödenmediği için müşteriye yansıtılıyor (Hasan, 2026-09-02).
 * Kupon ve kurumsal indirimden SONRA kalan tutara uygulanır — üst üste binip
 * marjı yemesin diye (bkz. orders.service.ts fiyat zinciri).
 */
export const HAVALE_INDIRIM_YUZDE = 5;

/** Ödeme yöntemi anahtarları — DB'de `orders.payment_method` sütununa yazılır. */
export const ODEME_YONTEMI = {
  kart: "iyzico",
  havale: "havale",
  cari: "cari",
} as const;

export type OdemeYontemi = (typeof ODEME_YONTEMI)[keyof typeof ODEME_YONTEMI];

/**
 * IBAN doğrulaması (ISO 13616 mod-97). Sabitin yanlış yazılmasına karşı testte
 * kullanılır; çalışma zamanında da bir yere IBAN girilecekse buradan geçirilmeli.
 */
export function ibanGecerliMi(iban: string): boolean {
  const s = iban.replace(/\s+/g, "").toUpperCase();
  if (!/^TR\d{24}$/.test(s)) return false;
  const yer = s.slice(4) + s.slice(0, 4);
  const sayi = [...yer]
    .map((c) => (/[A-Z]/.test(c) ? String(c.charCodeAt(0) - 55) : c))
    .join("");
  let kalan = 0;
  for (const d of sayi) kalan = (kalan * 10 + Number(d)) % 97;
  return kalan === 1;
}
