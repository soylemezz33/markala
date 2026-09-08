import { createHash } from "crypto";

/**
 * BAŞLANGIÇ FİYATI ÖNBELLEĞİ (2026-09-08).
 *
 * NEDEN: `topluBaslangicFiyatlari` ürün listesi ve kategori kartlarının ortak hesabı ve
 * ~950 ms sürüyor (792 ürün, ~20 bin fiyat satırı). Vitrinde her sayfa render'ı bu hesabı
 * iki kez tetikliyor (`/api/products?take=5000&list=true` + `/api/categories`).
 *
 * 8 Eylül 14:32–14:33 arasında TEK bir ziyaretçinin 39 sayfalık gezintisi Prisma bağlantı
 * havuzunu tüketti ve 24 istek "connection pool timeout" ile düştü. Trafik 45 istekti —
 * yani sorun yük değil, her isteğin pahalı olması. (7 Eylül'deki 45 dakikalık kesinti de
 * büyük olasılıkla aynı kökten; o gün suçladığım 08:30 cron'u kapalıyken tekrarladı.)
 *
 * Bu veri yalnız panelden ürün/fiyat düzenlenince değişir — yani saniyeler ölçeğinde
 * sabittir. Sonucu kısa süre bellekte tutmak, yüzlerce ağır sorguyu tek sorguya indirir.
 *
 * ── TASARIM ────────────────────────────────────────────────────────────────────────────
 * - Anahtar, istenen ürün kimliklerinin SIRALI listesinin özeti. Farklı ürün kümesi =
 *   farklı anahtar; yanlış kümenin fiyatını döndürme riski yok.
 * - UÇUŞTAKİ İSTEK PAYLAŞILIR: aynı anda gelen render'lar tek hesabı bekler. Bu olmadan
 *   soğuk başlangıçta yine onlarca paralel ağır sorgu çıkardı — havuzu tüketen desenin ta
 *   kendisi.
 * - Hesap HATA VERİRSE önbelleğe yazılmaz; sonraki istek yeniden dener (hatayı 60 saniye
 *   dondurmak, geçici bir DB hıçkırığını kalıcı fiyatsız listeye çevirirdi).
 * - Bellek sınırı var: farklı kategori sayfaları farklı kümeler üretir, sınırsız büyümesin.
 */

/** Önbellek ömrü. Panelden fiyat değişince en geç bu kadar sonra yansır. */
export const BELLEK_TTL_MS = 60_000;
/** Aynı anda tutulan en fazla farklı ürün kümesi. */
export const EN_FAZLA_GIRDI = 50;

type Girdi = { an: number; deger: Map<string, number | null> };

const bellek = new Map<string, Girdi>();
const ucustaki = new Map<string, Promise<Map<string, number | null>>>();

/** Ürün kimliklerinden sıraya duyarsız, çakışmaya dayanıklı anahtar üretir. */
export function bellekAnahtari(ids: string[]): string {
  return createHash("sha1").update([...ids].sort().join(",")).digest("hex");
}

/**
 * Önbellekli sarmalayıcı. `hesapla` yalnız önbellek boş/bayat olduğunda çağrılır.
 * `simdi` testler için dışarıdan verilebilir.
 */
export async function onbellekliBaslangicFiyatlari(
  ids: string[],
  hesapla: () => Promise<Map<string, number | null>>,
  simdi: number = Date.now(),
): Promise<Map<string, number | null>> {
  if (!ids.length) return new Map();
  const anahtar = bellekAnahtari(ids);

  const mevcut = bellek.get(anahtar);
  if (mevcut && simdi - mevcut.an < BELLEK_TTL_MS) return mevcut.deger;

  const bekleyen = ucustaki.get(anahtar);
  if (bekleyen) return bekleyen;

  const vaat = hesapla()
    .then((deger) => {
      // Yazarken de OKURKEN de aynı zaman kaynağı kullanılmalı. İlk sürüm burada
      // Date.now() yazıp yukarıda `simdi` ile karşılaştırıyordu; testte enjekte edilen
      // zamanla gerçek zaman karışınca TTL hiç dolmuyordu (girdi sonsuza kadar taze
      // görünüyordu). Test bunu yakaladı.
      bellek.set(anahtar, { an: simdi, deger });
      // En eski girdiyi at (Map ekleme sırasını korur) — bellek sınırsız büyümesin.
      if (bellek.size > EN_FAZLA_GIRDI) {
        const enEski = bellek.keys().next().value;
        if (enEski !== undefined) bellek.delete(enEski);
      }
      return deger;
    })
    .finally(() => {
      ucustaki.delete(anahtar);
    });

  ucustaki.set(anahtar, vaat);
  return vaat;
}

/** Panelden fiyat/ürün değişince çağrılır — bekleme olmadan taze veri gösterilsin. */
export function baslangicFiyatBellegiTemizle(): void {
  bellek.clear();
}

/** Yalnız testler için. */
export function bellekDurumu(): { girdi: number; ucustaki: number } {
  return { girdi: bellek.size, ucustaki: ucustaki.size };
}
