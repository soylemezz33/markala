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
