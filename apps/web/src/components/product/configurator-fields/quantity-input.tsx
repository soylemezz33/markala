"use client";

import { cn } from "@markala/ui";

interface Props {
  value: number;
  presets: number[];
  unitPrice: number;
  onChange: (n: number) => void;
}

export function QuantityInput({ value, presets, unitPrice, onChange }: Props) {
  return (
    <div>
      <div className="flex flex-wrap gap-2">
        {presets.map((preset) => (
          <button
            key={preset}
            type="button"
            aria-pressed={value === preset}
            onClick={() => onChange(preset)}
            className={cn(
              "px-4 h-10 rounded-md border text-sm font-medium tabular-nums transition-all",
              value === preset
                ? "border-ink-900 bg-ink-900 text-paper-50"
                : "border-paper-200 text-ink-700 hover:border-ink-300",
            )}
          >
            {preset.toLocaleString("tr-TR")}
          </button>
        ))}
        <input
          type="number"
          min={1}
          value={value}
          aria-label="Özel adet"
          onChange={(e) => onChange(parseInt(e.target.value, 10) || 1)}
          className="w-24 h-10 px-3 rounded-md border border-paper-200 bg-paper-50 text-ink-900 text-sm tabular-nums focus:border-ink-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-300/30"
        />
      </div>
      {unitPrice > 0 && (
        <p className="mt-2 text-xs text-ink-500">
          Birim fiyat: {unitPrice.toLocaleString("tr-TR", { minimumFractionDigits: 2 })} ₺
        </p>
      )}
    </div>
  );
}
