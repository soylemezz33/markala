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
  const { state, dispatch, product } = useConfigurator();
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

  // Seçili malzemenin maxM2 sınırı (tek parça) — aşılırsa uyarı.
  const matOpt = ((product.options ?? []) as Array<{ groupKey: string; optionKey: string; rules?: { maxM2?: number } | null }>).find(
    (o) => o.groupKey === "malzeme" && o.optionKey === sel.malzeme,
  );
  const maxM2 = matOpt?.rules?.maxM2;
  const maxExceeded = typeof maxM2 === "number" && maxM2 > 0 && alan > maxM2;

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

      {minApplied && (
        <p className="text-[11px] text-ink-500">
          Üretim minimumu 1 m² olduğundan, daha küçük işler 1 m² üzerinden fiyatlanır.
        </p>
      )}

      {maxExceeded && (
        <p className="text-xs font-medium text-red-600">
          Bu malzeme tek parçada en fazla {maxM2} m² basılabilir. Daha küçük ölçü girin ya da işi bölün.
        </p>
      )}
    </div>
  );
}
