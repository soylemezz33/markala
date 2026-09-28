/**
 * Türkçe locale formatları — sayfa boyunca tutarlı kullan.
 */

/**
 * TL biçimi — TEK MARKA KURALI (2026-08-31): tam sayıysa ondalık YOK (480 ₺),
 * kuruş varsa HER ZAMAN iki basamak (34,90 ₺ · 632,40 ₺). Asla tek basamak.
 *
 * Neden: eskiden bu dosya her zaman 2 basamak yazıyordu (1.530,00 ₺), packages/ui
 * içindeki Price bileşeni ise minimumFractionDigits:0 kullanıyordu → 632.40 değeri
 * "632,4" çıkıyordu. Sepet/ödeme ekranında ikisi yan yana görünüyordu
 * ("632,4 ₺" ile "1.530,00 ₺"). Kural artık iki yerde de aynı.
 *
 * NOT: aynı mantık packages/ui/src/Price.tsx içinde de var — biri değişirse
 * diğeri de değişmeli (paket web'e bağımlı olamadığı için kopya kaçınılmaz).
 */
function tlBicimle(amount: number): string {
  const kurusVar = !Number.isInteger(amount);
  return new Intl.NumberFormat("tr-TR", {
    minimumFractionDigits: kurusVar ? 2 : 0,
    maximumFractionDigits: 2,
  }).format(amount);
}

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
  return tlBicimle(amount);
}

export function formatPriceWithSymbol(amount: number): string {
  return `${tlBicimle(amount)} ₺`;
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
  // 2026-09-28: eski metin "Tasarım Bekleniyor"du. Müşteri geri bildirimi: "ilk gördüğümde
  // bana sanki ben tasarımımı yükleyememişim hissiyatı oluşturdu". Haklıydı — o siparişte
  // dosyasını çoktan yüklemişti. Ödenmiş 89 siparişin 62'sinde müşteri dosyayı göndermiş
  // durumda, yani çoğunluğa yanlış şey söylüyorduk. Bağlam verilmediğinde de asla
  // "sen eksik bıraktın" izlenimi vermeyen bu metin kullanılıyor.
  "tasarim-bekleniyor": "Tasarım Hazırlanıyor",
  "tasarim-onayindi": "Tasarım Onayı Bekliyor",
  "tasarim-onaylandi": "Tasarım Onaylandı",
  "uretimde": "Üretimde",
  "kargoya-verildi": "Kargoya Verildi",
  "teslim-edildi": "Teslim Edildi",
  "iptal-edildi": "İptal Edildi",
};

/** Siparişin tasarım yolu — etiketin kimi beklediğimizi doğru söylemesi için. */
export interface TasarimBaglami {
  /** Müşteri baskıya hazır dosyasını yüklemiş mi? */
  musteriDosyasiVar: boolean;
  /** Tasarımı bizden istemiş mi? */
  tasarimDestegi: boolean;
}

/** Sipariş kalemlerinden tasarım bağlamını çıkarır. */
export function tasarimBaglamiCikar(
  items: ReadonlyArray<{ uploadedFileName?: string | null; needsDesignSupport?: boolean | null }>,
): TasarimBaglami {
  return {
    musteriDosyasiVar: items.some((i) => !!i.uploadedFileName),
    tasarimDestegi: items.some((i) => !!i.needsDesignSupport),
  };
}

export function orderStatusLabel(status: string, baglam?: TasarimBaglami): string {
  // normStatus (underscore→hyphen) zaten çağrılmış olmalı; bunu burada da uygula (çift güvence).
  const normalized = status.replace(/_/g, "-");
  // Tasarım aşamasında BEKLENEN TARAF siparişe göre değişir: müşteri dosyasını
  // göndermişse ya da tasarımı bizden istemişse bekleyen BİZ oluruz; hiçbiri yoksa
  // gerçekten müşterinin dosyasını bekliyoruz ve bunu açıkça söylemeliyiz.
  if (normalized === "tasarim-bekleniyor" && baglam) {
    return baglam.musteriDosyasiVar || baglam.tasarimDestegi
      ? "Tasarım Hazırlanıyor"
      : "Dosyanız Bekleniyor";
  }
  return orderStatusLabels[normalized] ?? orderStatusLabels[status] ?? "Bilinmeyen Durum";
}

export function generateOrderNumber(): string {
  const ts = Date.now().toString(36).toUpperCase();
  const rand = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `MK-${ts}-${rand}`;
}
