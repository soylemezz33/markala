"use client";

import { cn } from "@markala/ui";
import { Lock } from "@phosphor-icons/react";
import { formatPrice } from "@/lib/format";

interface OptionItem {
  optionKey: string;
  optionLabel: string;
  optionSublabel?: string | null;
  optionSort: number;
}

interface Props {
  groupKey: string;
  groupLabel: string;
  options: OptionItem[];
  selected: string;
  locked?: boolean;
  disabled?: boolean;
  onSelect: (optionKey: string) => void;
  priceHints?: Record<string, number | null>;
  hintMode?: "delta" | "total" | "none";
}

export function OptionGroup({ groupKey, groupLabel, options, selected, locked, disabled, onSelect, priceHints, hintMode = "none" }: Props) {
  const sorted = [...options].sort((a, b) => a.optionSort - b.optionSort);

  if (disabled && !locked) {
    return (
      <div className="opacity-50 pointer-events-none select-none">
        <label className="block text-sm font-medium text-ink-900 mb-3">
          {groupLabel}
        </label>
        <div
          aria-label={`${groupLabel}: bu seçenek aktif konfigürasyonda geçersiz`}
          aria-disabled="true"
          className="px-4 py-3 rounded-md border border-paper-200 bg-paper-100 text-center text-sm text-ink-400"
        >
          —
        </div>
      </div>
    );
  }

  if (locked) {
    const displayOpt =
      sorted.find((o) => o.optionKey === selected) ?? sorted[0];
    return (
      <div>
        <label className="block text-sm font-medium text-ink-900 mb-3">
          {groupLabel}
        </label>
        <div
          aria-label={`${groupLabel}: ${displayOpt?.optionLabel ?? ""} (yönetici tarafından kilitlendi)`}
          className={cn(
            "flex items-center gap-3 px-4 py-3 rounded-md border",
            "border-paper-200 bg-paper-100 opacity-60 cursor-not-allowed select-none",
          )}
        >
          <Lock size={16} weight="bold" className="flex-none text-ink-400" />
          <span className="min-w-0">
            <span className="block font-medium text-ink-700 text-sm">
              {displayOpt?.optionLabel}
            </span>
            {displayOpt?.optionSublabel && (
              <span className="block text-xs text-ink-500 mt-0.5">
                {displayOpt.optionSublabel}
              </span>
            )}
          </span>
        </div>
      </div>
    );
  }

  return (
    <div>
      <label
        id={`group-${groupKey}-label`}
        className="block text-sm font-medium text-ink-900 mb-3"
      >
        {groupLabel}
      </label>
      <div
        role="radiogroup"
        aria-labelledby={`group-${groupKey}-label`}
        className="grid grid-cols-1 gap-2"
      >
        {sorted.map((opt) => {
          const isSelected = selected === opt.optionKey;
          const hint = priceHints?.[opt.optionKey];
          const showHint = hintMode !== "none" && hint !== null && hint !== undefined && Number.isFinite(hint);
          let hintLabel: string | null = null;
          if (showHint) {
            if (hintMode === "delta") {
              hintLabel = hint > 0 ? `+${formatPrice(hint)} ₺` : null;
            } else {
              // total mode: adet başına toplam
              hintLabel = hint > 0 ? `${formatPrice(hint)} ₺` : null;
            }
          }
          return (
            <button
              key={opt.optionKey}
              type="button"
              role="radio"
              aria-checked={isSelected}
              onClick={() => onSelect(opt.optionKey)}
              className={cn(
                "flex items-center gap-3 px-4 py-3 rounded-md border text-left transition-all duration-200 ease-out-expo",
                isSelected
                  ? "border-ink-900 bg-paper-50 shadow-sm"
                  : "border-paper-200 bg-paper-50 hover:border-ink-300",
              )}
            >
              <span
                className={cn(
                  "w-4 h-4 rounded-full border-2 grid place-items-center flex-none",
                  isSelected ? "border-ink-900" : "border-paper-300",
                )}
              >
                {isSelected && <span className="w-2 h-2 rounded-full bg-ink-900" />}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block font-medium text-ink-900 text-sm">
                  {opt.optionLabel}
                </span>
                {opt.optionSublabel && (
                  <span className="block text-xs text-ink-500 mt-0.5">
                    {opt.optionSublabel}
                  </span>
                )}
              </span>
              {hintLabel && (
                <span className="text-sm tabular-nums text-ink-500 flex-none">
                  {hintLabel}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
