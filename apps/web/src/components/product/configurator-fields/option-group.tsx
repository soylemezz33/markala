"use client";

import { cn } from "@markala/ui";
import { Lock, CaretDown, MagnifyingGlass } from "@phosphor-icons/react";
import { formatPrice } from "@/lib/format";
import { memo, useRef, useState, useEffect, useCallback } from "react";

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

const MANY = 8;

function buildHintLabel(hint: number | null | undefined, hintMode: "delta" | "total" | "none"): string | null {
  if (hintMode === "none" || hint === null || hint === undefined || !Number.isFinite(hint)) return null;
  if (hintMode === "delta") return hint > 0 ? `+${formatPrice(hint)} ₺` : null;
  return hint > 0 ? `${formatPrice(hint)} ₺` : null;
}

function trLower(s: string) {
  return s
    .replace(/İ/g, "i")
    .replace(/I/g, "ı")
    .replace(/Ğ/g, "ğ")
    .replace(/Ü/g, "ü")
    .replace(/Ş/g, "ş")
    .replace(/Ö/g, "ö")
    .replace(/Ç/g, "ç")
    .toLowerCase();
}

function SearchableDropdown({
  groupKey,
  groupLabel,
  sorted,
  selected,
  disabled,
  onSelect,
  priceHints,
  hintMode = "none",
}: {
  groupKey: string;
  groupLabel: string;
  sorted: OptionItem[];
  selected: string;
  disabled?: boolean;
  onSelect: (optionKey: string) => void;
  priceHints?: Record<string, number | null>;
  hintMode?: "delta" | "total" | "none";
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  const selectedOpt = sorted.find((o) => o.optionKey === selected) ?? sorted[0];
  const selectedHint = buildHintLabel(priceHints?.[selectedOpt?.optionKey ?? ""], hintMode);

  const filtered = query
    ? sorted.filter((o) => {
        const q = trLower(query);
        return (
          trLower(o.optionLabel).includes(q) ||
          (o.optionSublabel ? trLower(o.optionSublabel).includes(q) : false)
        );
      })
    : sorted;

  const close = useCallback(() => {
    setOpen(false);
    setQuery("");
  }, []);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    function handler(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        close();
      }
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open, close]);

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    function handler(e: KeyboardEvent) {
      if (e.key === "Escape") close();
    }
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [open, close]);

  // Focus search on open — useEffect prevents race on rapid open/close
  useEffect(() => {
    if (open && searchRef.current) {
      searchRef.current.focus();
    }
  }, [open]);

  function handleSelect(optionKey: string) {
    onSelect(optionKey);
    close();
  }

  return (
    <div ref={containerRef} className="relative">
      <label
        id={`group-${groupKey}-label`}
        className="block text-sm font-medium text-ink-900 mb-3"
      >
        {groupLabel}
      </label>
      <button
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-labelledby={`group-${groupKey}-label`}
        disabled={disabled}
        onClick={() => !disabled && setOpen((v) => !v)}
        className={cn(
          "w-full flex items-center gap-3 px-4 py-3 rounded-md border text-left transition-all duration-200",
          open
            ? "border-ink-900 bg-paper-50 shadow-sm"
            : "border-paper-200 bg-paper-50 hover:border-ink-300",
          disabled && "opacity-50 cursor-not-allowed pointer-events-none",
        )}
      >
        <span className="min-w-0 flex-1">
          <span className="block font-medium text-ink-900 text-sm">
            {selectedOpt?.optionLabel ?? "—"}
          </span>
          {selectedOpt?.optionSublabel && (
            <span className="block text-xs text-ink-500 mt-0.5">
              {selectedOpt.optionSublabel}
            </span>
          )}
        </span>
        {selectedHint && (
          <span className="text-sm tabular-nums text-ink-500 flex-none">
            {selectedHint}
          </span>
        )}
        <CaretDown
          size={16}
          weight="bold"
          className={cn(
            "flex-none text-ink-400 transition-transform duration-200",
            open && "rotate-180",
          )}
        />
      </button>

      {open && (
        <div
          id={`group-${groupKey}-listbox`}
          role="listbox"
          aria-labelledby={`group-${groupKey}-label`}
          className={cn(
            "absolute z-50 mt-1 w-full rounded-md border border-paper-200 bg-paper-50 shadow-lg",
          )}
        >
          {/* Search input */}
          <div className="p-2 border-b border-paper-200">
            <div className="relative">
              <MagnifyingGlass
                size={14}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-400 pointer-events-none"
              />
              <input
                ref={searchRef}
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Ara…"
                aria-label={`${groupLabel} seçeneklerini ara`}
                aria-controls={`group-${groupKey}-listbox`}
                className={cn(
                  "w-full pl-8 pr-3 py-2 text-sm rounded border border-paper-200 bg-white",
                  "text-ink-900 placeholder:text-ink-400",
                  "focus:outline-none focus:border-ink-400 focus:ring-1 focus:ring-ink-200",
                )}
              />
            </div>
          </div>

          {/* Options list */}
          <div className="max-h-72 overflow-auto">
            {filtered.length === 0 ? (
              <div className="px-4 py-3 text-sm text-ink-400 text-center">Sonuç bulunamadı</div>
            ) : (
              filtered.map((opt) => {
                const isSelected = selected === opt.optionKey;
                const hint = buildHintLabel(priceHints?.[opt.optionKey], hintMode);
                return (
                  <button
                    key={opt.optionKey}
                    type="button"
                    role="option"
                    aria-selected={isSelected}
                    onClick={() => handleSelect(opt.optionKey)}
                    className={cn(
                      "w-full flex items-center gap-3 px-4 py-3 text-left transition-colors duration-150",
                      isSelected
                        ? "bg-ink-900 text-paper-50"
                        : "hover:bg-paper-100 text-ink-900",
                    )}
                  >
                    <span className="min-w-0 flex-1">
                      <span className="block font-medium text-sm">
                        {opt.optionLabel}
                      </span>
                      {opt.optionSublabel && (
                        <span className={cn("block text-xs mt-0.5", isSelected ? "text-paper-300" : "text-ink-500")}>
                          {opt.optionSublabel}
                        </span>
                      )}
                    </span>
                    {hint && (
                      <span className={cn("text-sm tabular-nums flex-none", isSelected ? "text-paper-200" : "text-ink-500")}>
                        {hint}
                      </span>
                    )}
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function OptionGroupInner({ groupKey, groupLabel, options, selected, locked, disabled, onSelect, priceHints, hintMode = "none" }: Props) {
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

  // Many options → searchable dropdown
  if (options.length > MANY) {
    return (
      <SearchableDropdown
        groupKey={groupKey}
        groupLabel={groupLabel}
        sorted={sorted}
        selected={selected}
        disabled={disabled}
        onSelect={onSelect}
        priceHints={priceHints}
        hintMode={hintMode}
      />
    );
  }

  // Few options → radio cards
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

export const OptionGroup = memo(OptionGroupInner);
