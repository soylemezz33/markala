"use client";

import { Check, Ruler } from "@phosphor-icons/react";
import { cn } from "@markala/ui";
import type { ProductParameter } from "@markala/types";
import type { DimensionValue } from "@/lib/configurator";

interface Props {
  param: ProductParameter;
  value: DimensionValue;
  onChange: (v: DimensionValue) => void;
}

/**
 * Vinilturk tarzı en+boy input + canlı alan/çevre tablosu + ek seçenekler.
 */
export function DimensionInput({ param, value, onChange }: Props) {
  const min = param.minDimension ?? 30;
  const max = param.maxDimension ?? 500;
  const w = value.width;
  const h = value.height;
  const areaSqm = (w * h) / 10000;
  const perimeterM = (2 * (w + h)) / 100;

  function setDim(field: "width" | "height", v: number) {
    onChange({ ...value, [field]: Math.min(max, Math.max(min, v || min)) });
  }

  function toggleExtra(id: string) {
    const has = value.extras.includes(id);
    onChange({
      ...value,
      extras: has ? value.extras.filter((e) => e !== id) : [...value.extras, id],
    });
  }

  return (
    <div>
      {/* En + Boy inputlar */}
      <div className="grid grid-cols-2 gap-3">
        <DimInput label="En (cm)" value={w} min={min} max={max} onChange={(v) => setDim("width", v)} />
        <DimInput label="Boy (cm)" value={h} min={min} max={max} onChange={(v) => setDim("height", v)} />
      </div>

      {/* Canlı hesap tablosu */}
      <div className="mt-3 overflow-hidden rounded-md border border-paper-200 bg-paper-100">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-xs uppercase tracking-wide text-ink-500 border-b border-paper-200">
              <th className="px-3 py-2 text-left font-medium"></th>
              <th className="px-3 py-2 text-center font-medium">En (cm)</th>
              <th className="px-3 py-2 text-center font-medium">Boy (cm)</th>
              <th className="px-3 py-2 text-center font-medium">Alan (m²)</th>
              <th className="px-3 py-2 text-center font-medium">Çevre (m)</th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-b border-paper-200">
              <td className="px-3 py-2 text-xs text-ink-500 font-medium">Birim</td>
              <td className="px-3 py-2 text-center tabular-nums text-ink-900">{w}</td>
              <td className="px-3 py-2 text-center tabular-nums text-ink-900">{h}</td>
              <td className="px-3 py-2 text-center tabular-nums text-ink-900">{areaSqm.toFixed(2)}</td>
              <td className="px-3 py-2 text-center tabular-nums text-ink-900">{perimeterM.toFixed(2)}</td>
            </tr>
            <tr>
              <td className="px-3 py-2 text-xs text-ink-500 font-medium">Toplam</td>
              <td className="px-3 py-2 text-center tabular-nums text-ink-900 font-medium">{w}</td>
              <td className="px-3 py-2 text-center tabular-nums text-ink-900 font-medium">{h}</td>
              <td className="px-3 py-2 text-center tabular-nums text-ink-900 font-medium">{areaSqm.toFixed(2)}</td>
              <td className="px-3 py-2 text-center tabular-nums text-ink-900 font-medium">{perimeterM.toFixed(2)}</td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Birim fiyat bilgi satırı */}
      {param.pricePerSqm && (
        <p className="mt-2 text-xs text-ink-500 flex items-center gap-1.5">
          <Ruler size={12} />
          Birim fiyat: <span className="font-medium text-ink-900 tabular-nums">{param.pricePerSqm.toLocaleString("tr-TR")} ₺/m²</span>
          <span className="mx-1">·</span>
          Min ebat: {min}×{min} cm · Max: {max}×{max} cm
        </p>
      )}

      {/* Ek seçenekler */}
      {param.extras && param.extras.filter((e) => !e.autoBelow1Sqm).length > 0 && (
        <div className="mt-5">
          <div className="text-sm font-medium text-ink-900 mb-2">Ek Seçenekler</div>
          <div className="space-y-2">
            {param.extras
              .filter((e) => !e.autoBelow1Sqm)
              .map((ex) => {
                const checked = value.extras.includes(ex.id);
                let extraPrice = 0;
                if (ex.flatFee) extraPrice += ex.flatFee;
                if (ex.perimeterPricePerM) extraPrice += ex.perimeterPricePerM * perimeterM;
                return (
                  <button
                    key={ex.id}
                    type="button"
                    onClick={() => toggleExtra(ex.id)}
                    className={cn(
                      "w-full flex items-center justify-between gap-3 px-4 py-3 rounded-md border text-left transition-all duration-200",
                      checked
                        ? "border-ink-900 bg-brand-50"
                        : "border-paper-200 bg-paper-50 hover:border-ink-300",
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <span
                        className={cn(
                          "w-4 h-4 rounded border-2 grid place-items-center flex-none",
                          checked ? "bg-ink-900 border-ink-900 text-paper-50" : "border-paper-300",
                        )}
                      >
                        {checked && <Check size={10} weight="bold" />}
                      </span>
                      <span className="font-medium text-ink-900 text-sm">{ex.label}</span>
                    </div>
                    <span className="text-sm tabular-nums text-ink-500">
                      +{extraPrice.toLocaleString("tr-TR", { minimumFractionDigits: 0, maximumFractionDigits: 2 })} ₺
                    </span>
                  </button>
                );
              })}
          </div>

          {/* Otomatik uygulananlar — bilgi */}
          {param.extras.some((e) => e.autoBelow1Sqm) && areaSqm < 1 && (
            <p className="mt-3 text-xs text-warning bg-warning/5 px-3 py-2 rounded">
              ⚠ 1 m²'den küçük olduğu için ek dikiş + kopça otomatik uygulanır
              ({param.extras.find((e) => e.autoBelow1Sqm)?.flatFee ?? 0} ₺).
            </p>
          )}
        </div>
      )}
    </div>
  );
}

function DimInput({
  label,
  value,
  min,
  max,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  onChange: (v: number) => void;
}) {
  return (
    <label className="block">
      <span className="text-xs text-ink-500 font-medium">{label}</span>
      <input
        type="number"
        min={min}
        max={max}
        value={value}
        onChange={(e) => onChange(parseInt(e.target.value, 10))}
        className="mt-1 w-full px-3 py-2.5 rounded border border-paper-200 bg-paper-50 text-ink-900 text-sm tabular-nums focus:border-ink-900 focus:outline-none"
      />
    </label>
  );
}
