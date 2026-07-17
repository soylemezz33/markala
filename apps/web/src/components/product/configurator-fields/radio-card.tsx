"use client";

import { cn } from "@markala/ui";
import type { ProductOption } from "@markala/types";

interface Props {
  option: ProductOption;
  selected: boolean;
  onSelect: () => void;
}

export function RadioCard({ option, selected, onSelect }: Props) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={selected}
      onClick={onSelect}
      className={cn(
        "flex items-center justify-between gap-3 px-4 py-3 rounded-md border text-left transition-all duration-200 ease-out-expo",
        selected
          ? "border-[#4B3AA0] bg-paper-50 shadow-sm"
          : "border-paper-200 bg-paper-50 hover:border-ink-300",
      )}
    >
      <div className="flex items-center gap-3">
        <span
          className={cn(
            "w-4 h-4 rounded-full border-2 grid place-items-center",
            selected ? "border-[#4B3AA0]" : "border-paper-300",
          )}
        >
          {selected && <span className="w-2 h-2 rounded-full bg-[#4B3AA0]" />}
        </span>
        <span className="font-medium text-ink-900 text-sm">{option.label}</span>
      </div>
      {option.priceModifier !== 0 && (
        <span className="text-sm tabular-nums text-ink-500">
          {option.priceModifier > 0 ? "+" : ""}
          {option.priceModifier.toLocaleString("tr-TR")} ₺
        </span>
      )}
    </button>
  );
}
