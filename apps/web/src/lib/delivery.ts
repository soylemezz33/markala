/**
 * Dinamik teslim/kargo tarihi tahmini.
 * Rakip-gap: "en geç X tarihinde kargoda" — kanıtlanmış dönüşüm tetikleyici
 * (Bidolubaskı/Baskıkapında'da var, Markala'da yoktu).
 *
 * productionTime serbest metin ("1-2 iş günü", "2-3 iş günü", "3 iş günü"...).
 * Buradan max iş günü çıkarılır, hafta sonu atlanarak + 14:00 cutoff ile
 * en geç kargoya veriliş tarihi hesaplanır.
 */

const CUTOFF_HOUR = 14;

const TR_MONTHS = [
  "Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran",
  "Temmuz", "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık",
];
const TR_DAYS = ["Pazar", "Pazartesi", "Salı", "Çarşamba", "Perşembe", "Cuma", "Cumartesi"];

/** "1-2 iş günü" → 2 (en yüksek sayı). Sayı yoksa 3 (güvenli varsayım). */
export function maxBusinessDays(productionTime: string): number {
  const nums = (productionTime.match(/\d+/g) ?? []).map(Number).filter((n) => n > 0 && n < 60);
  return nums.length ? Math.max(...nums) : 3;
}

/** start'tan itibaren n iş günü ekle (Cmt/Pzr atla). */
function addBusinessDays(start: Date, n: number): Date {
  const d = new Date(start);
  let added = 0;
  while (added < n) {
    d.setDate(d.getDate() + 1);
    const dow = d.getDay();
    if (dow !== 0 && dow !== 6) added++;
  }
  return d;
}

export interface DeliveryEstimate {
  /** En geç kargoya veriliş tarihi */
  shipDate: Date;
  /** "12 Haziran Cuma" */
  label: string;
  /** Sipariş bugün üretime girer mi (cutoff öncesi + hafta içi) */
  sameDayIntake: boolean;
  /** Cutoff saatine kalan dakikalar (cutoff öncesiyse) */
  beforeCutoff: boolean;
}

export function estimateDelivery(productionTime: string, now: Date = new Date()): DeliveryEstimate {
  const days = maxBusinessDays(productionTime);
  const dow = now.getDay();
  const isWeekday = dow !== 0 && dow !== 6;
  const beforeCutoff = now.getHours() < CUTOFF_HOUR;
  const sameDayIntake = isWeekday && beforeCutoff;

  // Cutoff sonrası ya da hafta sonu → üretim bir sonraki iş günü başlar (+1 gün ofset).
  const offset = sameDayIntake ? 0 : 1;
  const shipDate = addBusinessDays(now, days + offset);

  const label = `${shipDate.getDate()} ${TR_MONTHS[shipDate.getMonth()]} ${TR_DAYS[shipDate.getDay()]}`;
  return { shipDate, label, sameDayIntake, beforeCutoff };
}

/**
 * SİTE GENELİ TESLİMAT VAADİ — TEK KAYNAK (2026-09-02).
 *
 * NEDEN BURADA: Hasan 57fa12a ile "kargo süresi herkese aynı, 81 ilin tamamı 2-4 iş günü"
 * dedi; ama o karar YALNIZCA lib/cities.ts'e uygulanabildi, çünkü aynı iddia sitede sekiz
 * ayrı dosyada elle yazılıydı (anasayfa süreç şeridi, hakkımızda, kargo takip, dört rehber
 * sayfası, yardım merkezi). Sonuç: site kendi kendisiyle çelişti — bir yerde 2-4, dört
 * yerde hâlâ 1-3 yazıyordu. Teslim vaadi tüketiciye verilen bir taahhüt; çelişkili olması
 * hem güven hem mevzuat açısından sorun.
 *
 * BUNDAN SONRA: süre değişecekse SADECE burası değişir. Yeni bir yere süre yazarken
 * literal string yazma, bu sabitleri import et.
 */

/** Üretim süresi — ürün bazında DB'den gelebilir; bu, site geneli standart iddiadır. */
export const URETIM_SURESI = "3-5 iş günü"; // 2026-09-17 Hasan: "üretim başlayıp bitişine 3-5 iş günü"

/** Kargo süresi — 81 ilin tamamı için aynı (Hasan kararı, 2026-09-02). */
export const KARGO_SURESI = "2-4 iş günü";

/** Üretim + kargo toplamı. URETIM_SURESI ve KARGO_SURESI ile tutarlı olmak ZORUNDA. */
export const TOPLAM_SURE = "5-9 iş günü";

// ---------------------------------------------------------------------------
// Ürün bazlı teslim ARALIĞI (2026-09-17, dış rapor 6. bölüm — sepet + ürün sayfası).
//
// Tarih DEĞİL aralık: 2026-08-08 kararıyla "en geç X tarihinde kargoda" vaadi kaldırıldı
// (üretim süresiyle karışıp yanlış beklenti yaratıyordu). Burada yalnız iş günü aralığı
// verilir: üretim (ürünün productionTime metni) + kargo (KARGO_SURESI) = toplam.
// Birden çok kalem tek kargoda çıkar → üretim = kalemlerin EN UZUNU.
// ---------------------------------------------------------------------------

export interface GunAraligi {
  min: number;
  max: number;
}

/** KARGO_SURESI'nin sayısal hâli — ikisi birlikte değişmeli. */
export const KARGO_ARALIGI: GunAraligi = { min: 2, max: 4 };

/** "6-7 iş günü" → {6,7}; "3 iş günü" → {3,3}; sayı yoksa null. */
export function parseBusinessDayRange(text: string | null | undefined): GunAraligi | null {
  const nums = ((text ?? "").match(/\d+/g) ?? []).map(Number).filter((n) => n > 0 && n < 60);
  if (nums.length === 0) return null;
  return { min: Math.min(...nums), max: Math.max(...nums) };
}

/** {3,6} → "3-6 iş günü"; {3,3} → "3 iş günü". */
export function gunAraligiMetni(a: GunAraligi): string {
  return a.min === a.max ? `${a.min} iş günü` : `${a.min}-${a.max} iş günü`;
}

export interface TeslimAraligi {
  uretim: GunAraligi;
  kargo: GunAraligi;
  toplam: GunAraligi;
  uretimMetni: string;
  toplamMetni: string;
}

/**
 * Kalemlerin üretim sürelerinden toplam teslim aralığı. Boş/çözümlenemeyen metin site geneli
 * URETIM_SURESI'ne düşer (eski sepet satırlarında productionTime yoktur).
 */
export function teslimAraligi(productionTimes: Array<string | null | undefined>): TeslimAraligi {
  const varsayilan = parseBusinessDayRange(URETIM_SURESI) ?? { min: 1, max: 2 };
  const araliklar = (productionTimes.length ? productionTimes : [undefined]).map(
    (t) => parseBusinessDayRange(t) ?? varsayilan,
  );
  const uretim = {
    min: Math.max(...araliklar.map((a) => a.min)),
    max: Math.max(...araliklar.map((a) => a.max)),
  };
  const toplam = { min: uretim.min + KARGO_ARALIGI.min, max: uretim.max + KARGO_ARALIGI.max };
  return {
    uretim,
    kargo: KARGO_ARALIGI,
    toplam,
    uretimMetni: gunAraligiMetni(uretim),
    toplamMetni: gunAraligiMetni(toplam),
  };
}
