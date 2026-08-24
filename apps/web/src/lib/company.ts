/**
 * Firma kimliği — TEK KAYNAK.
 *
 * Neden var: 2026-08 SEO denetiminde adres sitede ÜÇ farklı şekilde geçiyordu
 * (JSON-LD "Çiftlikköy / Astoria One", footer ve /iletisim "Menteş Mah.", yasal
 * sayfalar bir başkası). Google Merchant Center hesabı "Misrepresentation"
 * gerekçesiyle askıya alınmıştı ve tutarsız işletme kimliği bu değerlendirmenin
 * bir numaralı kalemidir. 2026-08-17'de Hasan doğru adresin **Menteş Mah.**
 * olduğunu teyit etti.
 *
 * Kural: adres/unvan/iletişim bilgisi gerektiğinde BURADAN import et; sayfaya
 * elle yazma. Böylece bilgiler bir daha birbirinden ayrışamaz.
 */

/** Ticaret sicilindeki tam unvan (ETBİS kaydıyla birebir aynı). */
export const LEGAL_NAME =
  "324 Ajans Bilgi Teknolojileri Reklam Pazarlama ve Ticaret Limited Şirketi";

/** Kısa marka adı. */
export const BRAND_NAME = "Markala";

export const ADDRESS = {
  street: "Menteş Mah. 100. Yıl Cumhuriyet Cad. No:59/A",
  locality: "Yenişehir",
  region: "Mersin",
  country: "TR",
  /**
   * Posta kodu BİLEREK boş: eski koddaki 33060 Çiftlikköy adresine aitti ve yeni
   * adrese uymuyor. Yanlış posta kodu yayınlamak, hiç yayınlamamaktan kötüdür
   * (kimlik doğrulamasında tutarsızlık sayılır). Doğrusu öğrenilince doldurulacak.
   */
  postalCode: undefined as string | undefined,
} as const;

/** Tek satırlık, insan-okur adres. */
export const ADDRESS_LINE = `${ADDRESS.street}, ${ADDRESS.locality} / ${ADDRESS.region}`;

/**
 * Google Haritalar — RESMİ işletme kaydı (Hasan iletti, 2026-08-24).
 * Kısa link Google Business Profile "Markala.com.tr" kaydına gider; koordinatlar
 * o kaydın place URL'inden alındı (uydurma değil). Eski adres-sorgusu yaklaşımı
 * (koordinat bilinmiyordu) artık gerekmiyor.
 */
export const MAPS_SHORT_LINK = "https://maps.app.goo.gl/2v85cgEgq3dcj6ut5";
export const GEO = { lat: 36.7899463, lng: 34.577764 } as const;

/** İşletme kaydını hedefleyen sorgu (embed'de kart adıyla çıksın diye ad + adres). */
export const MAPS_QUERY = encodeURIComponent(
  `Markala.com.tr ${ADDRESS.street} ${ADDRESS.locality} ${ADDRESS.region}`,
);
export const MAPS_LINK = MAPS_SHORT_LINK;
export const MAPS_EMBED = `https://maps.google.com/maps?q=${MAPS_QUERY}&ll=${GEO.lat},${GEO.lng}&z=16&hl=tr&output=embed`;

export const PHONE = "0324 433 33 51";
/** schema.org / tel: için E.164 biçimi. */
export const PHONE_E164 = "+90-324-433-3351";
export const EMAIL = "merhaba@markala.com.tr";
export const EMAIL_SALES = "kurumsal@markala.com.tr";
export const KEP = "324ajans@hs03.kep.tr";

/** ETBİS kaydı — Ticaret Bakanlığı'nın bu siteye özel doğrulama bağlantısı. */
export const ETBIS_VERIFY_URL =
  "https://etbis.ticaret.gov.tr/tr/SiteSorgulamaSonuc?siteId=6c81d5f8-88a6-4899-8443-bc9f102db393";

/** schema.org PostalAddress düğümü — postalCode yalnız biliniyorsa eklenir. */
export const POSTAL_ADDRESS_SCHEMA = {
  "@type": "PostalAddress",
  streetAddress: ADDRESS.street,
  addressLocality: ADDRESS.locality,
  addressRegion: ADDRESS.region,
  addressCountry: ADDRESS.country,
  ...(ADDRESS.postalCode ? { postalCode: ADDRESS.postalCode } : {}),
} as const;
