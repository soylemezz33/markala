"use client";

import { useState, useTransition } from "react";
import type { OptionInput, ApiPrice, PriceInput } from "@markala/api-client";
import { toast } from "@/components/toast";
import { updateProductPrices } from "./actions";

// ===== Tipler =====

interface CellState {
  price: string;
  cost: string;
}

interface Props {
  productId: string;
  options: OptionInput[];
  initialPrices: ApiPrice[];
}

// ===== Izgara türetme yardımcıları =====

/** options[] → gruplara ayır, sırala. */
function deriveGroups(options: OptionInput[]) {
  const map = new Map<
    string,
    {
      key: string;
      label: string;
      role: "dimension" | "priced";
      sort: number;
      options: OptionInput[];
    }
  >();
  for (const o of options) {
    if (!map.has(o.groupKey)) {
      map.set(o.groupKey, {
        key: o.groupKey,
        label: o.groupLabel,
        role: o.groupRole,
        sort: o.groupSort,
        options: [],
      });
    }
    map.get(o.groupKey)!.options.push(o);
  }
  const groups = Array.from(map.values()).sort((a, b) => a.sort - b.sort);
  for (const g of groups) {
    g.options.sort((a, b) => a.optionSort - b.optionSort);
  }
  return groups;
}

/**
 * Fiyat boyutunu hesapla:
 * - İlk non-adet dimension grubu; yoksa tek dimension grubu; yoksa null.
 */
function derivePriceDimension(
  groups: ReturnType<typeof deriveGroups>,
): ReturnType<typeof deriveGroups>[0] | null {
  const dimensions = groups.filter((g) => g.role === "dimension");
  if (dimensions.length === 0) return null;
  const nonAdet = dimensions.find((g) => g.key !== "adet");
  if (nonAdet) return nonAdet;
  return dimensions[0] ?? null;
}

/** initialPrices listesinden hücre state başlangıç değerini oluştur. */
function buildInitialCells(
  groups: ReturnType<typeof deriveGroups>,
  priceDim: ReturnType<typeof deriveGroups>[0] | null,
  initialPrices: ApiPrice[],
): Record<string, CellState> {
  const cells: Record<string, CellState> = {};
  const pricedGroups = groups.filter((g) => g.role === "priced");

  if (pricedGroups.length === 0) {
    // Basit ürün — tek hücre, key = "simple"
    const row = initialPrices.find(
      (p) => (p.groupKey == null || p.groupKey === "") && (p.optionKey == null || p.optionKey === ""),
    );
    cells["simple"] = {
      price: row ? String(row.price) : "",
      cost: row?.cost != null ? String(row.cost) : "",
    };
    return cells;
  }

  for (const pg of pricedGroups) {
    for (const opt of pg.options) {
      if (priceDim) {
        for (const dimOpt of priceDim.options) {
          const key = `${pg.key}__${opt.optionKey}__${dimOpt.optionKey}`;
          const row = initialPrices.find(
            (p) =>
              p.groupKey === pg.key &&
              p.optionKey === opt.optionKey &&
              p.dimKey === dimOpt.optionKey,
          );
          cells[key] = {
            price: row ? String(row.price) : "",
            cost: row?.cost != null ? String(row.cost) : "",
          };
        }
      } else {
        const key = `${pg.key}__${opt.optionKey}__null`;
        const row = initialPrices.find(
          (p) =>
            p.groupKey === pg.key &&
            p.optionKey === opt.optionKey &&
            (p.dimKey == null || p.dimKey === ""),
        );
        cells[key] = {
          price: row ? String(row.price) : "",
          cost: row?.cost != null ? String(row.cost) : "",
        };
      }
    }
  }
  return cells;
}

/** cells state → PriceInput[] (boş/sıfır satış fiyatları atlanır). */
function flattenCells(
  cells: Record<string, CellState>,
  groups: ReturnType<typeof deriveGroups>,
  priceDim: ReturnType<typeof deriveGroups>[0] | null,
): PriceInput[] {
  const result: PriceInput[] = [];
  const pricedGroups = groups.filter((g) => g.role === "priced");

  if (pricedGroups.length === 0) {
    // Basit ürün
    const c = cells["simple"];
    if (!c) return result;
    const price = Number(c.price);
    if (!c.price || !Number.isFinite(price) || price <= 0) return result;
    const cost = c.cost ? Number(c.cost) : undefined;
    result.push({
      groupKey: null,
      optionKey: null,
      dimKey: null,
      price,
      ...(cost != null && Number.isFinite(cost) ? { cost } : {}),
    });
    return result;
  }

  for (const pg of pricedGroups) {
    for (const opt of pg.options) {
      if (priceDim) {
        for (const dimOpt of priceDim.options) {
          const key = `${pg.key}__${opt.optionKey}__${dimOpt.optionKey}`;
          const c = cells[key];
          if (!c) continue;
          const price = Number(c.price);
          if (!c.price || !Number.isFinite(price) || price <= 0) continue;
          const cost = c.cost ? Number(c.cost) : undefined;
          result.push({
            groupKey: pg.key,
            optionKey: opt.optionKey,
            dimKey: dimOpt.optionKey,
            price,
            ...(cost != null && Number.isFinite(cost) ? { cost } : {}),
          });
        }
      } else {
        const key = `${pg.key}__${opt.optionKey}__null`;
        const c = cells[key];
        if (!c) continue;
        const price = Number(c.price);
        if (!c.price || !Number.isFinite(price) || price <= 0) continue;
        const cost = c.cost ? Number(c.cost) : undefined;
        result.push({
          groupKey: pg.key,
          optionKey: opt.optionKey,
          dimKey: null,
          price,
          ...(cost != null && Number.isFinite(cost) ? { cost } : {}),
        });
      }
    }
  }
  return result;
}

// ===== Ana bileşen =====

export function PricingGridEditor({ productId, options, initialPrices }: Props) {
  const [isPending, startTransition] = useTransition();

  const groups = deriveGroups(options);
  const priceDim = derivePriceDimension(groups);
  const pricedGroups = groups.filter((g) => g.role === "priced");
  const adetGroup = groups.find((g) => g.key === "adet" && g.role === "dimension");
  const adetIsMultiplier = adetGroup != null && priceDim?.key !== "adet";

  const [cells, setCells] = useState<Record<string, CellState>>(() =>
    buildInitialCells(groups, priceDim, initialPrices),
  );

  function setCell(key: string, field: "price" | "cost", val: string) {
    setCells((prev) => ({
      ...prev,
      [key]: { ...(prev[key] ?? { price: "", cost: "" }), [field]: val },
    }));
  }

  function handleSave() {
    startTransition(async () => {
      try {
        const prices = flattenCells(cells, groups, priceDim);
        await updateProductPrices(productId, prices);
        toast.success("Fiyatlar kaydedildi.");
      } catch {
        toast.error("Fiyatlar kaydedilemedi.");
      }
    });
  }

  const inputCls =
    "px-1.5 py-1 rounded border border-paper-200 bg-paper-50 text-ink-900 text-xs tabular-nums text-center focus:border-ink-900 focus:outline-none focus:ring-2 focus:ring-brand-300/30";

  // ===== Basit ürün (priced grup yok) =====
  if (pricedGroups.length === 0) {
    const c = cells["simple"] ?? { price: "", cost: "" };
    return (
      <div className="space-y-4">
        <p className="text-xs text-ink-500">
          Bu ürünün seçenek grubu yok — tek satış fiyatı giriniz.
        </p>
        <div className="flex items-end gap-4 flex-wrap">
          <label className="block">
            <span className="block text-xs font-semibold text-ink-700 uppercase tracking-wider mb-1.5">
              Satış Fiyatı (TL)
            </span>
            <input
              type="number"
              min={0}
              step="0.01"
              value={c.price}
              onChange={(e) => setCell("simple", "price", e.target.value)}
              placeholder="0.00"
              className="w-36 px-2.5 py-1.5 rounded border border-paper-200 bg-paper-50 text-ink-900 text-sm tabular-nums focus:border-ink-900 focus:outline-none focus:ring-2 focus:ring-brand-300/30"
            />
          </label>
          <label className="block">
            <span className="block text-xs font-semibold text-ink-700 uppercase tracking-wider mb-1.5">
              Maliyet (TL, opsiyonel)
            </span>
            <input
              type="number"
              min={0}
              step="0.01"
              value={c.cost}
              onChange={(e) => setCell("simple", "cost", e.target.value)}
              placeholder="0.00"
              className="w-36 px-2.5 py-1.5 rounded border border-paper-200 bg-paper-50 text-ink-900 text-sm tabular-nums focus:border-ink-900 focus:outline-none focus:ring-2 focus:ring-brand-300/30"
            />
          </label>
        </div>
        <SaveButton isPending={isPending} onClick={handleSave} />
      </div>
    );
  }

  // ===== Konfigüratör ürün (priced gruplar var) =====
  return (
    <div className="space-y-6">
      {adetIsMultiplier && (
        <p className="text-xs text-ink-500 bg-paper-100/60 border border-paper-200 rounded px-3 py-2">
          <strong>Adet</strong> grubu çarpan olarak uygulanır — fiyat ızgarasına dahil değildir.
        </p>
      )}

      {pricedGroups.map((pg) => {
        const dimOptions = priceDim ? priceDim.options : null;
        return (
          <div key={pg.key}>
            <p className="text-xs font-semibold text-ink-700 uppercase tracking-wider mb-2">
              {pg.label}
              <span className="ml-2 font-mono text-ink-400 normal-case font-normal">
                ({pg.key})
              </span>
            </p>
            <div className="overflow-x-auto border border-paper-200 rounded-md">
              <table className="w-full text-xs">
                <thead className="bg-paper-100/60 text-ink-500">
                  <tr>
                    <th className="text-left px-3 py-2 font-semibold sticky left-0 bg-paper-100/60 z-10 whitespace-nowrap">
                      {pg.label}
                    </th>
                    {dimOptions
                      ? dimOptions.map((d) => (
                          <th
                            key={d.optionKey}
                            className="text-center px-3 py-2 font-semibold whitespace-nowrap"
                          >
                            {d.optionLabel}
                          </th>
                        ))
                      : (
                          <th className="text-center px-3 py-2 font-semibold">Fiyat</th>
                        )}
                  </tr>
                </thead>
                <tbody className="divide-y divide-paper-200">
                  {pg.options.map((opt) => (
                    <tr key={opt.optionKey} className="hover:bg-paper-100/40">
                      <th
                        scope="row"
                        className="text-left px-3 py-2 font-medium text-ink-900 sticky left-0 bg-paper-50 whitespace-nowrap"
                      >
                        <div className="flex flex-col">
                          <span>{opt.optionLabel}</span>
                          {opt.optionSublabel && (
                            <span className="text-[10px] text-ink-500 font-normal mt-0.5">
                              {opt.optionSublabel}
                            </span>
                          )}
                        </div>
                      </th>
                      {dimOptions
                        ? dimOptions.map((d) => {
                            const key = `${pg.key}__${opt.optionKey}__${d.optionKey}`;
                            const c = cells[key] ?? { price: "", cost: "" };
                            return (
                              <td key={d.optionKey} className="px-2 py-1.5 text-center align-top">
                                <input
                                  type="number"
                                  min={0}
                                  step="0.01"
                                  value={c.price}
                                  onChange={(e) => setCell(key, "price", e.target.value)}
                                  placeholder="—"
                                  title="Satış fiyatı"
                                  className={inputCls + " w-20"}
                                />
                                <input
                                  type="number"
                                  min={0}
                                  step="0.01"
                                  value={c.cost}
                                  onChange={(e) => setCell(key, "cost", e.target.value)}
                                  placeholder="maliyet"
                                  title="Maliyet (opsiyonel)"
                                  className={inputCls + " w-20 mt-1 text-ink-500"}
                                />
                              </td>
                            );
                          })
                        : (() => {
                            const key = `${pg.key}__${opt.optionKey}__null`;
                            const c = cells[key] ?? { price: "", cost: "" };
                            return (
                              <td key="single" className="px-2 py-1.5 text-center align-top">
                                <input
                                  type="number"
                                  min={0}
                                  step="0.01"
                                  value={c.price}
                                  onChange={(e) => setCell(key, "price", e.target.value)}
                                  placeholder="—"
                                  title="Satış fiyatı"
                                  className={inputCls + " w-20"}
                                />
                                <input
                                  type="number"
                                  min={0}
                                  step="0.01"
                                  value={c.cost}
                                  onChange={(e) => setCell(key, "cost", e.target.value)}
                                  placeholder="maliyet"
                                  title="Maliyet (opsiyonel)"
                                  className={inputCls + " w-20 mt-1 text-ink-500"}
                                />
                              </td>
                            );
                          })()}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        );
      })}

      <SaveButton isPending={isPending} onClick={handleSave} />
    </div>
  );
}

function SaveButton({ isPending, onClick }: { isPending: boolean; onClick: () => void }) {
  return (
    <div className="flex justify-end pt-1">
      <button
        type="button"
        onClick={onClick}
        disabled={isPending}
        className="inline-flex items-center gap-2 bg-ink-900 text-paper-50 px-4 py-2 rounded text-sm font-medium hover:bg-ink-700 disabled:opacity-60"
      >
        {isPending ? "Kaydediliyor…" : "Fiyatları Kaydet"}
      </button>
    </div>
  );
}
