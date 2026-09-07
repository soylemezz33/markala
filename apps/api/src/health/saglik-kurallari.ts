/**
 * SİSTEM SAĞLIĞI — saf karar kuralları (2026-09-07).
 *
 * "Sağlıklı / uyarı / arızalı" kararı bilerek servis dışına, saf fonksiyonlara alındı:
 * bu kararın yanlış olması, 7 Eylül'deki gibi bir kesintinin panelde YEŞİL görünmesi
 * demek. Test edilebilir olmalı.
 *
 * TASARIM İLKESİ: Sağlık göstergesi ASLA iyimser tahmin yapmaz. Ölçemediğimiz bir şeyi
 * "sağlıklı" saymak, panelin 45 dakika "Operasyonel" demesine yol açan hatanın ta kendisi.
 * Bilinmeyen → "uyarı", asla "sağlıklı".
 */

export type Seviye = "saglikli" | "uyari" | "arizali";

/** Havuz kullanımı bu oranı aşarsa uyarı; aşağıdaki oran arızaya yaklaştığımızı gösterir. */
export const HAVUZ_UYARI_ORANI = 0.7;
export const HAVUZ_ARIZA_ORANI = 0.9;
/** Veritabanı yanıtı bu süreyi aşarsa yavaş sayılır (ms). */
export const DB_YAVAS_MS = 1000;

/** En kötü seviye kazanır: bir bileşen arızalıysa sistem arızalıdır. */
export function enKotuSeviye(seviyeler: Seviye[]): Seviye {
  if (seviyeler.includes("arizali")) return "arizali";
  if (seviyeler.includes("uyari")) return "uyari";
  return "saglikli";
}

/**
 * Veritabanı seviyesi. `acik`/`limit` Prisma havuzunun doluluğudur — 7 Eylül kesintisinde
 * tam olarak bu doldu ve hiçbir yerde görünmüyordu.
 *
 * Bağlanamıyorsak "arızalı"; ölçemiyorsak (limit bilinmiyor) "uyarı" — sessizce yeşil değil.
 */
export function veritabaniSeviyesi(g: {
  baglanti: boolean;
  gecikmeMs: number | null;
  acik: number | null;
  limit: number | null;
}): Seviye {
  if (!g.baglanti) return "arizali";
  if (g.acik !== null && g.limit !== null && g.limit > 0) {
    const oran = g.acik / g.limit;
    if (oran >= HAVUZ_ARIZA_ORANI) return "arizali";
    if (oran >= HAVUZ_UYARI_ORANI) return "uyari";
  }
  if (g.gecikmeMs !== null && g.gecikmeMs > DB_YAVAS_MS) return "uyari";
  return "saglikli";
}

/**
 * E-posta seviyesi. `ok=false` (son 15 dk'da hata var ve sonrasında başarı yok) arızadır;
 * son 24 saatte hata olmuş ama toparlamışsa uyarı — "dün akşam 25 mail düştü" bilgisi
 * kaybolmasın (3 Eylül SMTP olayı böyle fark edilmeden geçmişti).
 */
export function epostaSeviyesi(g: { ok: boolean; failedLast24h: number }): Seviye {
  if (!g.ok) return "arizali";
  return g.failedLast24h > 0 ? "uyari" : "saglikli";
}

/** Son 5 dakikada sunucu hatası varsa arıza; son 1 saatte varsa uyarı. */
export function hataSeviyesi(g: { son5dk: number; son1saat: number }): Seviye {
  if (g.son5dk > 0) return "arizali";
  return g.son1saat > 0 ? "uyari" : "saglikli";
}

/**
 * Disk seviyesi. Doluluk kritik eşiği aşarsa arıza: disk dolduğunda yükleme, log ve
 * veritabanı yazımı hep birlikte durur — geç fark edilirse en pahalı arızalardan biri.
 */
export function diskSeviyesi(kullanimYuzde: number | null): Seviye {
  if (kullanimYuzde === null) return "uyari"; // ölçemedik → yeşil deme
  if (kullanimYuzde >= 90) return "arizali";
  if (kullanimYuzde >= 80) return "uyari";
  return "saglikli";
}

/**
 * Zamanlanmış iş seviyesi: beklenen çalışma anını GEÇMİŞ ve hâlâ koşmamış bir iş uyarıdır.
 * `sonrakiCalisma` geçmişte kalmışsa zamanlayıcı durmuş demektir (7 Eylül'de olduğu gibi
 * süreç sağlıklı görünürken iç işlerin durması mümkün).
 */
export function isSeviyesi(isler: Array<{ sonrakiCalisma: string | null }>, simdi = new Date()): Seviye {
  if (!isler.length) return "uyari"; // hiç iş kayıtlı değilse zamanlayıcı ayakta değil
  const gecmisteKalan = isler.some(
    (i) => i.sonrakiCalisma !== null && new Date(i.sonrakiCalisma).getTime() < simdi.getTime() - 60_000,
  );
  return gecmisteKalan ? "uyari" : "saglikli";
}

/** Seviyeyi insan diline çevirir (panel rozetinde kullanılır). */
export function seviyeEtiketi(s: Seviye): string {
  return s === "saglikli" ? "Sağlıklı" : s === "uyari" ? "Dikkat" : "Arızalı";
}
