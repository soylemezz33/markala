import { cn } from "./cn";

export interface PriceProps {
  amount: number;
  currency?: "TRY";
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
  showCurrency?: boolean;
}

const sizes = {
  sm: "text-sm",
  md: "text-base",
  lg: "text-2xl",
  xl: "text-4xl",
};

/**
 * Marka kuralı: tam sayı fiyatlarda ondalık YOK (480 ₺), kuruş varsa HER ZAMAN iki
 * basamak (34,90 ₺ · 632,40 ₺). Asla tek basamak.
 *
 * 2026-08-31 düzeltmesi: eskiden sabit `minimumFractionDigits: 0` kullanılıyordu ve
 * 632.40 değeri "632,4" olarak çıkıyordu — sepet/ödeme ekranında bu, iki basamak yazan
 * lib/format.ts çıktılarının ("1.530,00 ₺") yanında bozuk duruyordu. Minimum artık
 * tutara göre seçiliyor. (Aynı mantık apps/web/src/lib/format.ts içinde de var.)
 */
function formatTL(amount: number): string {
  const kurusVar = !Number.isInteger(amount);
  return new Intl.NumberFormat("tr-TR", {
    minimumFractionDigits: kurusVar ? 2 : 0,
    maximumFractionDigits: 2,
  }).format(amount);
}
const formatter = { format: formatTL };

export function Price({ amount, size = "md", className, showCurrency = true }: PriceProps) {
  const label = showCurrency
    ? `${formatter.format(amount)} Türk Lirası`
    : formatter.format(amount);
  return (
    <span
      className={cn("font-medium tabular-nums tracking-tight", sizes[size], className)}
      aria-label={label}
    >
      {formatter.format(amount)}
      {showCurrency && <span aria-hidden="true" className="ml-1">₺</span>}
    </span>
  );
}
