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

const formatter = new Intl.NumberFormat("tr-TR", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

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
