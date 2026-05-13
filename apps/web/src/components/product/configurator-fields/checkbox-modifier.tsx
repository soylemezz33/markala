"use client";

import { cn } from "@markala/ui";
import { Check } from "@phosphor-icons/react";
import type { ProductOption } from "@markala/types";

interface Props {
  option: ProductOption;
  checked: boolean;
  onToggle: () => void;
}

export function CheckboxModifier({ option, checked, onToggle }: Props) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className={cn(
        "w-full flex items-center justify-between gap-3 px-4 py-3 rounded-md border text-left transition-all duration-200 ease-out-expo",
        checked
          ? "border-ink-900 bg-brand-50"
          : "border-paper-200 bg-paper-50 hover:border-ink-300",
      )}
    >
      <div className="flex items-center gap-3">
        <span
          className={cn(
            "w-4 h-4 rounded border-2 grid place-items-center",
            checked ? "bg-ink-900 border-ink-900 text-paper-50" : "border-paper-300",
          )}
        >
          {checked && <Check size={10} weight="bold" />}
        </span>
        <span className="font-medium text-ink-900 text-sm">{option.label}</span>
      </div>
      {option.priceModifier !== 0 && (
        <span className="text-sm tabular-nums text-ink-500">
          +{option.priceModifier.toLocaleString("tr-TR")} ₺
        </span>
      )}
    </button>
  );
}
