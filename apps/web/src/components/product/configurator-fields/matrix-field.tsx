"use client";

import { useEffect, useState } from "react";
import { cn } from "@markala/ui";
import type { ProductParameter } from "@markala/types";

interface Props {
  param: ProductParameter;
  value: string;
  onSelect: (cellId: string) => void;
}

/**
 * Matrix wizard — 3 adımlı seçim: Grup serisi → Paket varyantı → Adet.
 * Grupsuz matrislerde 2 adım gösterir.
 */
export function MatrixField({ param, value, onSelect }: Props) {
  const rows = param.rows ?? [];
  const cols = param.cols ?? [];
  const cells = param.cells ?? [];
  const cellMap = new Map<string, (typeof cells)[number]>();
  cells.forEach((c) => cellMap.set(`${c.rowId}::${c.colId}`, c));

  // Mevcut seçili hücreden mevcut row/col/group durumunu çıkar
  const currentCell = cells.find((c) => c.id === value);
  const currentRow = currentCell ? rows.find((r) => r.id === currentCell.rowId) : rows[0];
  const currentCol = currentCell ? cols.find((c) => c.id === currentCell.colId) : cols[0];

  // Grup listesi (örn. EKO / LAK / VIP)
  const groupKeys = Array.from(
    new Set(rows.map((r) => r.group).filter((g): g is string => Boolean(g))),
  );
  const hasGroups = groupKeys.length > 0;

  // Aktif grup
  const [activeGroup, setActiveGroup] = useState<string | undefined>(
    hasGroups ? (currentRow?.group ?? groupKeys[0]) : undefined,
  );

  // Aktif grup değişince sync
  useEffect(() => {
    if (hasGroups && currentRow?.group && currentRow.group !== activeGroup) {
      setActiveGroup(currentRow.group);
    }
  }, [hasGroups, currentRow?.group, activeGroup]);

  const visibleRows = hasGroups ? rows.filter((r) => r.group === activeGroup) : rows;

  // Sadece görünür row'larda DOLU sütunları göster
  const visibleColIds = new Set<string>();
  visibleRows.forEach((r) => {
    cols.forEach((c) => {
      if (cellMap.has(`${r.id}::${c.id}`)) visibleColIds.add(c.id);
    });
  });
  const visibleCols = cols.filter((c) => visibleColIds.has(c.id));

  function selectFirstAvailableCellInRow(rowId: string) {
    // Halihazır seçili sütun varsa onu kullan, yoksa ilk dolu hücreyi
    const preferredCol = currentCol?.id ?? visibleCols[0]?.id;
    if (preferredCol && cellMap.has(`${rowId}::${preferredCol}`)) {
      onSelect(`${rowId}-${preferredCol}`);
      return;
    }
    const firstCol = cols.find((c) => cellMap.has(`${rowId}::${c.id}`));
    if (firstCol) onSelect(`${rowId}-${firstCol.id}`);
  }

  function selectColInCurrentRow(colId: string) {
    const rowId = currentRow?.id ?? visibleRows[0]?.id;
    if (rowId && cellMap.has(`${rowId}::${colId}`)) {
      onSelect(`${rowId}-${colId}`);
    }
  }

  function handleGroupChange(g: string) {
    setActiveGroup(g);
    // Yeni grubun ilk row'unun (mümkünse aynı colu) seçimine geç
    const nextRow = rows.find((r) => r.group === g);
    if (nextRow) selectFirstAvailableCellInRow(nextRow.id);
  }

  // Adet için: aktif row'un dolu olduğu sütunlar
  const rowAvailableCols = currentRow
    ? cols.filter((c) => cellMap.has(`${currentRow.id}::${c.id}`))
    : visibleCols;

  return (
    <div className="space-y-5">
      {param.matrixNote && (
        <div className="text-xs text-ink-700 bg-brand-100/60 border border-brand-300/40 rounded-md px-3 py-2 leading-relaxed">
          {param.matrixNote}
        </div>
      )}

      {/* === ADIM 1: Grup seçimi (EKO / LAK / VIP) === */}
      {hasGroups && (
        <div>
          <div className="flex items-baseline justify-between mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-ink-500">
              <span className="inline-block w-5 h-5 rounded-full bg-ink-900 text-brand-400 text-[10px] font-bold mr-1.5 leading-5 text-center">1</span>
              Paket Serisi
            </span>
            <span className="text-[11px] text-ink-500">{visibleRows.length} varyant</span>
          </div>
          <div className="grid grid-cols-3 gap-2 p-1 bg-paper-100 rounded-lg border border-paper-200">
            {groupKeys.map((g) => {
              const active = g === activeGroup;
              return (
                <button
                  key={g}
                  type="button"
                  onClick={() => handleGroupChange(g)}
                  className={cn(
                    "py-2.5 rounded-md text-sm font-bold tracking-wider transition-all",
                    active
                      ? "bg-ink-900 text-brand-400 shadow-sm"
                      : "text-ink-700 hover:bg-paper-50",
                  )}
                >
                  {g}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* === ADIM 2: Paket varyantı (kart liste) === */}
      <div>
        <div className="flex items-baseline justify-between mb-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-ink-500">
            <span className="inline-block w-5 h-5 rounded-full bg-ink-900 text-brand-400 text-[10px] font-bold mr-1.5 leading-5 text-center">{hasGroups ? 2 : 1}</span>
            Paket Seçimi
          </span>
        </div>
        <div className="space-y-1.5 max-h-[320px] overflow-y-auto pr-1 -mr-1">
          {visibleRows.map((r) => {
            const selected = currentRow?.id === r.id;
            // 1.000 adet referans fiyatı (yoksa ilk dolu)
            const refCol = cols.find((c) => c.id === "1000") ?? cols.find((c) => cellMap.has(`${r.id}::${c.id}`));
            const refCell = refCol ? cellMap.get(`${r.id}::${refCol.id}`) : undefined;
            return (
              <button
                key={r.id}
                type="button"
                onClick={() => selectFirstAvailableCellInRow(r.id)}
                className={cn(
                  "w-full text-left px-3 py-2.5 rounded-md border transition-all flex items-start gap-3",
                  selected
                    ? "border-ink-900 bg-ink-900/[0.04] shadow-sm ring-1 ring-ink-900/8"
                    : "border-paper-200 bg-paper-50 hover:border-ink-400 hover:bg-paper-100/50",
                )}
              >
                <span
                  className={cn(
                    "mt-0.5 flex-none w-4 h-4 rounded-full border-2 grid place-items-center",
                    selected ? "border-ink-900" : "border-paper-300",
                  )}
                >
                  {selected && <span className="w-2 h-2 rounded-full bg-ink-900" />}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline justify-between gap-2">
                    <span className="text-sm font-semibold text-ink-900 truncate">
                      {refCell?.code && <span className="font-mono text-[11px] text-brand-700 mr-1.5">{refCell.code}</span>}
                      {r.label.replace(/^[A-Z0-9-]+\s—\s/, "")}
                    </span>
                    {refCell && (
                      <span className="text-xs tabular-nums text-ink-500 flex-none">
                        <span className="font-semibold text-ink-900">{refCell.price.toLocaleString("tr-TR")} ₺</span>
                        <span className="text-[10px] ml-1">/ 1.000</span>
                      </span>
                    )}
                  </div>
                  {r.sublabel && (
                    <p className="text-[11px] text-ink-500 mt-0.5 leading-relaxed line-clamp-2">{r.sublabel}</p>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* === ADIM 3: Adet seçimi === */}
      <div>
        <div className="flex items-baseline justify-between mb-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-ink-500">
            <span className="inline-block w-5 h-5 rounded-full bg-ink-900 text-brand-400 text-[10px] font-bold mr-1.5 leading-5 text-center">{hasGroups ? 3 : 2}</span>
            Adet
          </span>
          {currentCol?.sublabel && (
            <span className="text-[11px] text-ink-500">{currentCol.sublabel}</span>
          )}
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {rowAvailableCols.map((c) => {
            const cellForCol = currentRow ? cellMap.get(`${currentRow.id}::${c.id}`) : undefined;
            if (!cellForCol) return null;
            const active = currentCol?.id === c.id;
            return (
              <button
                key={c.id}
                type="button"
                onClick={() => selectColInCurrentRow(c.id)}
                className={cn(
                  "relative px-3 py-2.5 rounded-md border text-center transition-all",
                  active
                    ? "border-ink-900 bg-ink-900 text-paper-50 shadow-sm"
                    : "border-paper-200 bg-paper-50 text-ink-900 hover:border-ink-400 hover:bg-paper-100/50",
                )}
              >
                <div className={cn("text-xs font-semibold", active ? "text-paper-100/80" : "text-ink-500")}>
                  {c.label}
                </div>
                <div className="text-base font-bold tabular-nums mt-0.5">
                  {cellForCol.price.toLocaleString("tr-TR")} ₺
                </div>
                {cellForCol.badge && (
                  <span className="absolute -top-2 -right-2 bg-brand-500 text-ink-900 text-[9px] font-bold px-1.5 py-0.5 rounded-full">
                    {cellForCol.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Seçim özeti */}
      {currentCell && currentRow && currentCol && (
        <div className="bg-paper-100 border border-paper-200 rounded-md px-3 py-2.5 text-xs text-ink-700 leading-relaxed">
          <span className="font-semibold text-ink-900">Seçim:</span>{" "}
          {currentCell.code && <span className="font-mono text-brand-700">{currentCell.code}</span>}
          {" · "}{currentCol.label}
          {currentRow.sublabel && (
            <span className="block text-[11px] text-ink-500 mt-0.5">{currentRow.sublabel}</span>
          )}
        </div>
      )}

      <p className="text-[11px] text-ink-500 leading-relaxed">
        ⓘ Tüm fiyatlar KDV dahildir. Üretim adedinde %1-5 fire payı olabilir — sözleşme şartları için <a href="/yasal/mesafeli-satis" className="underline">bakınız</a>.
      </p>
    </div>
  );
}
