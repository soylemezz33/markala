"use client";

import { Price } from "@markala/ui";
import { getInstallmentAmount, type PriceBreakdown } from "@/lib/configurator";

export function PriceCard({ breakdown }: { breakdown: PriceBreakdown }) {
  const installment = getInstallmentAmount(breakdown.total, 3);
  return (
    <div className="bg-ink-900 text-paper-50 rounded-lg p-5 md:p-6 overflow-hidden">
      <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
        <span className="text-sm text-paper-100/70">Toplam</span>
        <Price
          amount={breakdown.total}
          size="xl"
          className="text-brand-300 transition-all duration-200 tabular-nums break-all text-right min-w-0"
        />
      </div>
      <div className="mt-2 flex items-center justify-between text-xs text-paper-100/60">
        <span>{breakdown.vatIncluded ? "KDV dahil" : "KDV hariç"}</span>
        {breakdown.total > 100 && (
          <span>
            3 taksitle <Price amount={installment} size="sm" className="text-paper-100" />'den
          </span>
        )}
      </div>
    </div>
  );
}
