"use client";

import { useConfigurator } from "./context";

const PRESETS: Array<[number, number]> = [
  [60, 150],
  [75, 200],
  [100, 200],
  [200, 300],
];

// Sert giriş tavanları — "150000000000 m²" gibi absürt girişler hem absürt fiyat gösteriyor
// hem taşma/NaN riski yaratıyordu. 9.999 cm (~100 m) hiçbir gerçek işi engellemez; tek parça
// üretim sınırı zaten malzemenin maxM2'si + server'daki 100 m² tavanı ile ayrıca korunur.
const HARD_MAX_CM = 9999;
const HARD_MAX_ADET = 100000;

/** Sayısal girişi [0..cap] aralığına kıstır; sayı olmayanı boşalt (yazmayı bozmadan). */
function clampDim(raw: string, cap: number): string {
  if (raw === "") return raw;
  const n = Number(raw);
  if (!Number.isFinite(n)) return "";
  if (n < 0) return "";
  if (n > cap) return String(cap);
  return raw;
}

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
  // Fiyat PARÇA BAŞINA min uygular (her parça max(minM2, alan), sonra × adet) — configurator.ts
  // + server ile aynı. Gösterim de aynı formülü kullanmalı; eski toplam-alan formülü çok adet +
  // küçük parçada gösterilen alan ≠ ödenen alan yapıyordu.
  const toplamAlan = Math.max(minM2, alan) * adetN;
  const minApplied = alan > 0 && alan < minM2;

  // Seçili malzemenin maxM2 sınırı (tek parça) — aşılırsa uyarı.
  const matOpt = ((product.options ?? []) as Array<{ groupKey: string; optionKey: string; rules?: { maxM2?: number; maxEn?: number } | null }>).find(
    (o) => o.groupKey === "malzeme" && o.optionKey === sel.malzeme,
  );
  const maxM2 = matOpt?.rules?.maxM2;
  const maxExceeded = typeof maxM2 === "number" && maxM2 > 0 && alan > maxM2;

  // En (genişlik) tavanı — örn. araç magneti eni en fazla 60 cm, boy serbest. Preset'ler
  // filtrelenir, En girişi tavana clamp edilir.
  const maxEnRaw = matOpt?.rules?.maxEn;
  const maxEn = typeof maxEnRaw === "number" && maxEnRaw > 0 ? maxEnRaw : undefined;
  const presets = maxEn ? PRESETS.filter(([e]) => e <= maxEn) : PRESETS;
  const enCap = Math.min(maxEn ?? HARD_MAX_CM, HARD_MAX_CM);
  const setEn = (raw: string) => set("en", clampDim(raw, enCap));
  const setBoy = (raw: string) => set("boy", clampDim(raw, HARD_MAX_CM));
  const setAdet = (raw: string) => set("adet", clampDim(raw, HARD_MAX_ADET));
  /**
   * Adet alanı asla 0/boş kalamaz (2026-08-26 UX denetimi #4/İş 1).
   * Önceki davranış: "0" yazınca ekranda 0 kalıyordu ama sepete sessizce 1 adet düşüyordu
   * (`adetN = Math.max(1, …)`) — ekran ile sepet çelişiyordu. Artık alandan çıkınca (blur)
   * görünen değer de 1'e çekilir, yani kullanıcı ne olduğunu GÖRÜR.
   */
  const normalizeAdet = () => {
    const n = Math.floor(Number(adet));
    if (!Number.isFinite(n) || n < 1) set("adet", "1");
    else if (String(n) !== adet) set("adet", String(n));
  };

  const inputCls =
    "w-full rounded-lg border border-paper-300 px-3 py-2.5 text-ink-900 focus:border-brand-300 focus:outline-none focus:ring-2 focus:ring-brand-300/40";

  return (
    <div className="space-y-3">
      <span className="block text-sm font-medium text-ink-900">Ölçü (cm)</span>

      <div className="flex flex-wrap gap-2">
        {presets.map(([e, b]) => {
          const on = en === String(e) && boy === String(b);
          return (
            <button
              key={`${e}x${b}`}
              type="button"
              onClick={() => {
                set("en", String(e));
                set("boy", String(b));
              }}
              className={`rounded-full border px-3 py-1.5 text-sm font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink-900 focus-visible:ring-offset-1 ${
                on
                  ? "border-[#4B3AA0] bg-[#4B3AA0] text-paper-50"
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
          <span className="mb-1 block text-xs text-ink-500">
            En (cm){maxEn ? ` · en fazla ${maxEn}` : ""}
          </span>
          <input
            type="number"
            min={1}
            max={enCap}
            inputMode="numeric"
            value={en}
            onChange={(e) => setEn(e.target.value)}
            className={inputCls}
            placeholder="Özel ölçü"
          />
        </label>
        <label className="block">
          <span className="mb-1 block text-xs text-ink-500">Boy (cm)</span>
          <input
            type="number"
            min={1}
            max={HARD_MAX_CM}
            inputMode="numeric"
            value={boy}
            onChange={(e) => setBoy(e.target.value)}
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
          max={HARD_MAX_ADET}
          inputMode="numeric"
          value={adet}
          onChange={(e) => setAdet(e.target.value)}
          onBlur={normalizeAdet}
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
              parça başına min 1 m²
            </span>
          )}
        </p>
      )}

      {minApplied && (
        <p className="text-[11px] text-ink-500">
          Üretim minimumu parça başına 1 m² olduğundan, daha küçük işler parça başına 1 m² üzerinden fiyatlanır.
        </p>
      )}

      {maxExceeded && (
        <p role="alert" className="text-xs font-medium text-red-600">
          Bu malzeme tek parçada en fazla {maxM2} m² basılabilir. Daha küçük ölçü girin ya da işi bölün.
        </p>
      )}

      {maxEn && (
        <p className="text-[11px] text-ink-500">
          En (genişlik) en fazla {maxEn} cm’dir; boy (uzunluk) istediğiniz kadar olabilir.
        </p>
      )}
    </div>
  );
}
