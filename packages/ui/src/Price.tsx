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
  return (
    <span className={cn("font-medium tabular-nums tracking-tight", sizes[size], className)}>
      {formatter.format(amount)}
      {showCurrency && <span className="ml-1">₺</span>}
    </span>
  );
}
