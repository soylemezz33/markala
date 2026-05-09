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

export function formatDate(iso: string | Date): string {
  return dateFormatter.format(typeof iso === "string" ? new Date(iso) : iso);
}

export function formatDateShort(iso: string | Date): string {
  return shortDateFormatter.format(typeof iso === "string" ? new Date(iso) : iso);
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
  return orderStatusLabels[status] ?? status;
}

export function generateOrderNumber(): string {
  const ts = Date.now().toString(36).toUpperCase();
  const rand = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `MK-${ts}-${rand}`;
}
