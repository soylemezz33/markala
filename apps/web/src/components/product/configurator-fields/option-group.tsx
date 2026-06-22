"use client";

import { cn } from "@markala/ui";

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
  onSelect: (optionKey: string) => void;
}

export function OptionGroup({ groupKey, groupLabel, options, selected, onSelect }: Props) {
  const sorted = [...options].sort((a, b) => a.optionSort - b.optionSort);

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
              <span className="min-w-0">
                <span className="block font-medium text-ink-900 text-sm">
                  {opt.optionLabel}
                </span>
                {opt.optionSublabel && (
                  <span className="block text-xs text-ink-500 mt-0.5">
                    {opt.optionSublabel}
                  </span>
                )}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
