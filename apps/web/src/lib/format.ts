/**
 * Türkçe locale formatları — sayfa boyunca tutarlı kullan.
 */

const tlFormatter = new Intl.NumberFormat("tr-TR", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const dateFormatter = new Intl.DateTimeFormat("tr-TR", {
  day: "numeric",
  month: "long",
  year: "numeric",
});

const shortDateFormatter = new Intl.DateTimeFormat("tr-TR", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
});

export function formatPrice(amount: number): string {
  return tlFormatter.format(amount);
}

export function formatPriceWithSymbol(amount: number): string {
  return `${tlFormatter.format(amount)} ₺`;
}

/**
 * Müşteriye gösterilen başlık/vitrin fiyatı. Hesaplanan fiyat 0 (veya altı) ise
 * "teklif usulü" ürün demektir → "0,00 ₺" yerine "Teklif Al" göster.
 * Sepet/sipariş/fatura matematiğinde KULLANMA — yalnızca vitrin gösterimi.
 */
export function formatPriceDisplay(amount: number): string {
  return amount > 0 ? formatPriceWithSymbol(amount) : "Teklif Al";
}

export function formatDate(iso: string | Date): string {
  const d = typeof iso === "string" ? new Date(iso) : iso;
  // Geçersiz/boş tarihte Intl.format throw eder (RangeError) — sayfa çökmesin diye guard.
  if (!(d instanceof Date) || Number.isNaN(d.getTime())) return "";
  return dateFormatter.format(d);
}

export function formatDateShort(iso: string | Date): string {
  const d = typeof iso === "string" ? new Date(iso) : iso;
  if (!(d instanceof Date) || Number.isNaN(d.getTime())) return "";
  return shortDateFormatter.format(d);
}

const orderStatusLabels: Record<string, string> = {
  "siparis-alindi": "Sipariş Alındı",
  "tasarim-bekleniyor": "Tasarım Bekleniyor",
  "tasarim-onayindi": "Tasarım Onayı Bekliyor",
  "uretimde": "Üretimde",
  "kargoya-verildi": "Kargoya Verildi",
  "teslim-edildi": "Teslim Edildi",
  "iptal-edildi": "İptal Edildi",
};

export function orderStatusLabel(status: string): string {
  // normStatus (underscore→hyphen) zaten çağrılmış olmalı; bunu burada da uygula (çift güvence).
  const normalized = status.replace(/_/g, "-");
  return orderStatusLabels[normalized] ?? orderStatusLabels[status] ?? "Bilinmeyen Durum";
}

export function generateOrderNumber(): string {
  const ts = Date.now().toString(36).toUpperCase();
  const rand = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `MK-${ts}-${rand}`;
}
