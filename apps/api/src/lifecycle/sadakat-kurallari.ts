/**
 * SADAKAT PROGRAMI — SAF KURALLAR (2026-09-06 ortak kararları; karar dokümanı: sadakat-karar-dokumani).
 *
 * Bu dosya veritabanına ve maile dokunmaz; RetentionService bunları çağırır, testler burayı doğrular.
 *
 * Karar 1 — İkinci sipariş teşviki: teslimattan 1 gün sonra kişiye özel %10 kod (21 gün, min 750 ₺),
 *           3 gün sonra kod kullanılmadıysa hatırlatma. Yalnız İLK siparişini tamamlamış ve pazarlama
 *           izni vermiş müşteriye.
 * Karar 2 — Puan süresi: son kazanımdan 12 ay; 1 ay ve 1 hafta önce hatırlatma; dolunca sıfırlama.
 * Karar 5 — Tekrar sipariş hatırlatması: ürün döngüsüne göre tek mail, indirim yok.
 */

export const IKINCI_SIPARIS_KUPON = {
  yuzde: 10,
  gecerlilikGun: 21,
  minSepetTl: 750,
  /** Teslimattan kaç saat sonra kod maili (aşama 1) */
  asama1Saat: 24,
  /** Teslimattan kaç saat sonra hatırlatma (aşama 2), kod hâlâ kullanılmadıysa */
  asama2Saat: 72,
  /** Bu süreden eski teslimatlara dokunulmaz (cron uzun süre kapalı kaldıysa geç mail gitmesin) */
  azamiYasSaat: 24 * 14,
  onEk: "TESEKKUR",
} as const;

export const PUAN_SURESI = {
  ay: 12,
  hatirlatma1Gun: 30,
  hatirlatma2Gun: 7,
} as const;

/** Karar 5 tablosu: kategori → teslimattan kaç gün sonra hatırlatma. Sezonluk olanlar ayrı. */
export const TEKRAR_SIPARIS_DONGUSU_GUN: Record<string, number> = {
  kartvizit: 90,
  brosur: 60,
  etiket: 60,
  afis: 60,
  "antetli-kagit": 120,
  zarf: 120,
  makbuz: 90,
  "amerikan-servis": 45,
  "oto-paspas": 45,
  "kapi-aski-brosur": 90,
  bloknot: 120,
};
/** İSG levhaları: yıllık denetim → 11 ay. Kategori slug'ı "is-guvenligi-" ile başlar. */
export const ISG_DONGUSU_GUN = 335;
/** Branda/bayrak: sezon başları (Mart ve Eylül'ün ilk 7 günü), teslimattan en az 30 gün sonra. */
export const SEZONLUK_KATEGORILER = new Set(["vinil-branda-afis", "yelken-bayrak", "kirlangic-bayrak", "rollup"]);
export const SEZON_AYLARI = new Set([2, 8]); // 0 tabanlı: Mart=2, Eylül=8

export type TeslimatAdayi = {
  id: string;
  deliveredAt: Date;
  retentionMailStage: number;
  retentionCouponCode: string | null;
  /** Kod kullanıldı mı (kupon.usedCount > 0) — aşama 2 yalnız kullanılmadıysa */
  kuponKullanildi: boolean;
  /** Müşterinin tamamlanmış sipariş sayısı (bu dahil) */
  tamamlanmisSiparis: number;
  pazarlamaIzni: boolean;
  email: string | null;
};

/**
 * İkinci-sipariş teşviki için hangi aşama gönderilecek?
 *  - null: bu turda bir şey yapma
 *  - 9: uygun değil (izin yok / ilk sipariş değil / e-posta yok / çok eski) → bir daha bakma
 *  - 1: kod maili · 2: hatırlatma
 */
export function ikinciSiparisAsamasi(aday: TeslimatAdayi, now: Date): 1 | 2 | 9 | null {
  if (aday.retentionMailStage >= 2 || aday.retentionMailStage === 9) return null;
  if (!aday.email || !aday.pazarlamaIzni || aday.tamamlanmisSiparis !== 1) return 9;
  const yasSaat = (now.getTime() - aday.deliveredAt.getTime()) / 3_600_000;
  if (yasSaat > IKINCI_SIPARIS_KUPON.azamiYasSaat) return 9;
  if (aday.retentionMailStage === 0) return yasSaat >= IKINCI_SIPARIS_KUPON.asama1Saat ? 1 : null;
  // aşama 1 gönderilmiş
  if (aday.kuponKullanildi) return null; // kod kullanıldı → hatırlatma gereksiz, aşama 1'de kalır
  return yasSaat >= IKINCI_SIPARIS_KUPON.asama2Saat ? 2 : null;
}

/** Kişiye özel kod: TESEKKUR-XXXXXX (karışıklık yaratan 0/O, 1/I harfleri yok). */
export function ikinciSiparisKodu(rastgele: () => number = Math.random): string {
  const alfabe = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let s = "";
  for (let i = 0; i < 6; i++) s += alfabe[Math.floor(rastgele() * alfabe.length)];
  return `${IKINCI_SIPARIS_KUPON.onEk}-${s}`;
}

/** Puan süresi: son kazanımdan 12 ay sonra. */
export function puanSonTarihi(sonKazanim: Date): Date {
  const d = new Date(sonKazanim.getTime());
  d.setMonth(d.getMonth() + PUAN_SURESI.ay);
  return d;
}

/**
 * Puan süresi hatırlatma/sıfırlama aşaması:
 *  - "sifirla": süre doldu → bakiye düşülür
 *  - 1: 30 gün kala ilk hatırlatma · 2: 7 gün kala son hatırlatma · null: bekle
 */
export function puanSuresiAsamasi(expiresAt: Date | null, mailStage: number, balance: number, now: Date): 1 | 2 | "sifirla" | null {
  if (!expiresAt || balance <= 0) return null;
  const kalanGun = (expiresAt.getTime() - now.getTime()) / 86_400_000;
  if (kalanGun <= 0) return "sifirla";
  if (kalanGun <= PUAN_SURESI.hatirlatma2Gun && mailStage < 2) return 2;
  if (kalanGun <= PUAN_SURESI.hatirlatma1Gun && mailStage < 1) return 1;
  return null;
}

/**
 * Tekrar sipariş hatırlatması bugün gönderilmeli mi? Kategori döngüsüne göre.
 * Sezonluk kategorilerde yalnız Mart/Eylül'ün ilk 7 gününde ve teslimattan ≥30 gün sonra.
 */
export function tekrarSiparisZamaniMi(kategoriSlug: string, deliveredAt: Date, now: Date): boolean {
  const gecenGun = (now.getTime() - deliveredAt.getTime()) / 86_400_000;
  if (SEZONLUK_KATEGORILER.has(kategoriSlug)) {
    return SEZON_AYLARI.has(now.getMonth()) && now.getDate() <= 7 && gecenGun >= 30;
  }
  const dongu = kategoriSlug.startsWith("is-guvenligi") ? ISG_DONGUSU_GUN : TEKRAR_SIPARIS_DONGUSU_GUN[kategoriSlug];
  if (!dongu) return false; // döngüsü tanımsız kategori (plaket, kupa vb.) → hatırlatma yok
  // Pencere: döngü günü ile +14 gün arası; daha eskiye geç mail gitmesin
  return gecenGun >= dongu && gecenGun <= dongu + 14;
}
