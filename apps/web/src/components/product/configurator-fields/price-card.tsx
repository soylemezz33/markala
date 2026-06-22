"use client";

import { Price } from "@markala/ui";
import { getInstallmentAmount } from "@/lib/configurator";

interface Props {
  total: number;
  kdvLabel?: string;
}

export function PriceCard({ total, kdvLabel = "KDV dahil" }: Props) {
  const isQuote = total <= 0;
  const installment = isQuote ? 0 : getInstallmentAmount(total, 3);

  return (
    <div className="bg-ink-900 text-paper-50 rounded-lg p-5 md:p-6 overflow-hidden">
      <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
        <span className="text-sm text-paper-100/70">Toplam</span>
        {isQuote ? (
          <span className="text-4xl font-medium tabular-nums tracking-tight text-brand-300 text-right min-w-0">
            Teklif Al
          </span>
        ) : (
          <Price
            amount={total}
            size="xl"
            className="text-brand-300 transition-all duration-200 tabular-nums break-all text-right min-w-0"
          />
        )}
      </div>
      {!isQuote && (
        <div className="mt-2 flex items-center justify-between text-xs text-paper-100/60">
          <span>{kdvLabel}</span>
          {total > 100 && (
            <span>
              3 taksitle <Price amount={installment} size="sm" className="text-paper-100" />
              &apos;den
            </span>
          )}
        </div>
      )}
    </div>
  );
}
