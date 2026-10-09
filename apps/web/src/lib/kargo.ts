/**
 * KARGO SABİTLERİ — statik anlatım metinleri için tek kaynak (2026-10-09).
 *
 * GERÇEK KAYNAK VERİTABANIDIR: `site_settings` → `shipping.fee` ve `shipping.freeThreshold`.
 * Sipariş toplamını API bu değerlerle hesaplar (orders.service → settings.getShipping) ve
 * sepetteki "ücretsiz kargoya X ₺ kaldı" çubuğu /settings/shipping'ten canlı çeker.
 *
 * Buradaki sabitler YALNIZ sunucuda üretilen sabit metinler içindir (yardım merkezi
 * makaleleri, fiyat listesi notu, rehber dipnotu). Eşik 1.500 → 2.000 ₺ ve ücret 79 → 115 ₺
 * olduğunda bu metinler eski rakamla kalmıştı; müşteriye yanlış söz veriyordu (Hasan, 9 Eki).
 *
 * ⚠️ PANELDEN AYAR DEĞİŞİRSE: burayı VE `packages/mock-data/src/legal.ts` içindeki
 * mesafeli satış / teslimat-iade metinlerini elle güncelle (o paket apps/web'den import
 * edemez). Ürün ve kategori açıklamalarındaki cümleler DB'dedir, ayrıca güncellenir.
 */

/** site_settings → shipping.freeThreshold (₺, KDV dahil ara toplam). */
export const UCRETSIZ_KARGO_ESIGI = 2000;
/** site_settings → shipping.fee (₺). */
export const KARGO_UCRETI = 115;

/** "2.000" — cümlede birim (₺ / TL) ayrı yazılır. */
export const ESIK_METNI = UCRETSIZ_KARGO_ESIGI.toLocaleString("tr-TR");
/** "115" */
export const UCRET_METNI = KARGO_UCRETI.toLocaleString("tr-TR");
