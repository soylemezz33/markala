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

/**
 * "İşlem içinde bekleyen" (idle in transaction) bağlantı sayısı bu eşiği aşarsa uyarı:
 * açık kalmış işlemler havuzu gerçekten kilitler.
 */
export const ISLEMDE_BEKLEYEN_UYARI = 3;
/** Veritabanı yanıtı bu süreyi aşarsa yavaş sayılır (ms). */
export const DB_YAVAS_MS = 1000;

/** En kötü seviye kazanır: bir bileşen arızalıysa sistem arızalıdır. */
export function enKotuSeviye(seviyeler: Seviye[]): Seviye {
  if (seviyeler.includes("arizali")) return "arizali";
  if (seviyeler.includes("uyari")) return "uyari";
  return "saglikli";
}

/**
 * Veritabanı seviyesi.
 *
 * DÜZELTME (2026-09-07, ilk sürümden birkaç saat sonra): ilk hâli "açık bağlantı / limit"
 * oranına bakıyordu ve 17/17'yi ARIZA sayıyordu. Bu YANLIŞTI — üretimde ölçtük: Prisma
 * havuzunu ısındıkça limite kadar açar ve bağlantıları AÇIK TUTAR, hepsi `idle` görünür.
 * Yani 17/17 sağlıklı bir sistemin normal görüntüsü; o kural sayfayı sürekli kırmızı
 * gösterip tam da güvenilmesi gereken göstergeyi değersizleştirirdi.
 *
 * Arızanın gerçek imzası havuz ZAMAN AŞIMI hatasıdır (Prisma P2024) — istek bağlantı
 * bekleyip 10 saniyede pes ettiğinde. 7 Eylül'de site 45 dakika bunu verdi.
 */
export function veritabaniSeviyesi(g: {
  baglanti: boolean;
  gecikmeMs: number | null;
  havuzZamanAsimi15dk?: number;
  islemdeBosta?: number | null;
}): Seviye {
  if (!g.baglanti) return "arizali";
  // Havuzdan bağlantı alamayan istek varsa site fiilen hizmet veremiyor demektir.
  if ((g.havuzZamanAsimi15dk ?? 0) > 0) return "arizali";
  if ((g.islemdeBosta ?? 0) >= ISLEMDE_BEKLEYEN_UYARI) return "uyari";
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
