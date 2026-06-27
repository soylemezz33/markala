"use client";

import { useConfigurator } from "./context";

const PRESETS: Array<[number, number]> = [
  [60, 150],
  [75, 200],
  [100, 200],
  [200, 300],
];

/**
 * m² (area) ürünleri için özel ölçü girişi: En×Boy (cm) + hazır ölçü çipleri + adet.
 * Değerleri selections.en / selections.boy / selections.adet'e yazar — computeAreaPrice bunları okur.
 */
export function AreaField({ minM2 = 1 }: { minM2?: number }) {
  const { state, dispatch } = useConfigurator();
  const sel = state.selections;
  const en = sel.en ?? "";
  const boy = sel.boy ?? "";
  const adet = sel.adet ?? "1";

  const set = (key: string, value: string) =>
    dispatch({ type: "SET_SELECTION", groupKey: key, optionKey: value });

  const enN = Number(en) || 0;
  const boyN = Number(boy) || 0;
  const adetN = Math.max(1, Number(adet) || 1);
  const alan = (enN * boyN) / 10000;
  const toplamAlan = Math.max(minM2, alan * adetN);
  const minApplied = alan > 0 && toplamAlan > alan * adetN + 1e-9;

  const inputCls =
    "w-full rounded-lg border border-paper-300 px-3 py-2.5 text-ink-900 focus:border-brand-300 focus:outline-none focus:ring-2 focus:ring-brand-300/40";

  return (
    <div className="space-y-3">
      <span className="block text-sm font-medium text-ink-900">Ölçü (cm)</span>

      <div className="flex flex-wrap gap-2">
        {PRESETS.map(([e, b]) => {
          const on = en === String(e) && boy === String(b);
          return (
            <button
              key={`${e}x${b}`}
              type="button"
              onClick={() => {
                set("en", String(e));
                set("boy", String(b));
              }}
              className={`rounded-full border px-3 py-1.5 text-sm font-medium transition ${
                on
                  ? "border-ink-900 bg-ink-900 text-paper-50"
                  : "border-paper-300 text-ink-700 hover:border-ink-300"
              }`}
            >
              {e}×{b}
            </button>
          );
        })}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <label className="block">
          <span className="mb-1 block text-xs text-ink-500">En (cm)</span>
          <input
            type="number"
            min={1}
            inputMode="numeric"
            value={en}
            onChange={(e) => set("en", e.target.value)}
            className={inputCls}
            placeholder="Özel ölçü"
          />
        </label>
        <label className="block">
          <span className="mb-1 block text-xs text-ink-500">Boy (cm)</span>
          <input
            type="number"
            min={1}
            inputMode="numeric"
            value={boy}
            onChange={(e) => set("boy", e.target.value)}
            className={inputCls}
            placeholder="Özel ölçü"
          />
        </label>
      </div>

      <label className="block">
        <span className="mb-1 block text-xs text-ink-500">Adet</span>
        <input
          type="number"
          min={1}
          inputMode="numeric"
          value={adet}
          onChange={(e) => set("adet", e.target.value)}
          className={inputCls}
        />
      </label>

      {alan > 0 && (
        <p className="text-xs text-ink-500">
          Alan:{" "}
          <strong className="text-ink-900">
            {toplamAlan.toLocaleString("tr-TR", { maximumFractionDigits: 2 })} m²
          </strong>
          {minApplied && (
            <span className="ml-2 rounded bg-paper-200 px-1.5 py-0.5 text-[11px] font-medium text-ink-700">
              min 1 m² uygulandı
            </span>
          )}
        </p>
      )}
    </div>
  );
}
