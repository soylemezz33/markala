"use client";

import { useState, useTransition } from "react";
import type { OptionInput, ApiPrice } from "@markala/api-client";
import { toast } from "@/components/toast";
import { Plus, Trash, FloppyDisk, Ruler } from "@phosphor-icons/react";
import { updateProduct, updateProductOptions, updateProductPrices } from "./actions";

interface Props {
  productId: string;
  initialPricingMode?: string;
  initialOptions: OptionInput[];
  initialPrices: ApiPrice[];
  pricing: { kur: number; marj: number; kdv: number };
}

interface MaterialRow {
  key: string;
  label: string;
  cost: number; // $/m² (birim=dolar) veya ₺ (birim=tl)
  birim: "dolar" | "tl";
  maxM2: number; // 0 = sınırsız
}

function slugify(s: string): string {
  return s
    .toLowerCase()
    .replace(/ı/g, "i").replace(/ğ/g, "g").replace(/ü/g, "u").replace(/ş/g, "s").replace(/ö/g, "o").replace(/ç/g, "c")
    .replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
}

export function AreaPricingEditor({ productId, initialPricingMode, initialOptions, initialPrices, pricing }: Props) {
  const [isPending, startTransition] = useTransition();
  const [areaMode, setAreaMode] = useState(initialPricingMode === "area");

  // Mevcut malzeme satırlarını options+prices'tan çıkar
  const priceByOpt = new Map(
    initialPrices.filter((p) => p.groupKey === "malzeme").map((p) => [p.optionKey, p]),
  );
  const [materials, setMaterials] = useState<MaterialRow[]>(() =>
    initialOptions
      .filter((o) => o.groupKey === "malzeme")
      .sort((a, b) => a.optionSort - b.optionSort)
      .map((o) => ({
        key: o.optionKey,
        label: o.optionLabel,
        cost: Number(priceByOpt.get(o.optionKey)?.cost ?? 0),
        birim: (o.rules?.birim as "dolar" | "tl") ?? "dolar",
        maxM2: Number(o.rules?.maxM2 ?? 0),
      })),
  );

  // Ekstra grupları (malzeme dışı) AYNEN korunur — kaydederken kaybolmasın
  const preservedOptions = initialOptions.filter((o) => o.groupKey !== "malzeme");
  const preservedPrices = initialPrices.filter((p) => p.groupKey !== "malzeme");

  const sellPerM2 = (m: MaterialRow): number => {
    const tl = m.birim === "tl" ? m.cost : m.cost * pricing.kur;
    return tl * pricing.marj * (1 + pricing.kdv);
  };

  const update = (i: number, patch: Partial<MaterialRow>) =>
    setMaterials((prev) => prev.map((m, idx) => (idx === i ? { ...m, ...patch } : m)));
  const addRow = () =>
    setMaterials((prev) => [...prev, { key: "", label: "", cost: 0, birim: "dolar", maxM2: 0 }]);
  const removeRow = (i: number) => setMaterials((prev) => prev.filter((_, idx) => idx !== i));

  function handleSave() {
    startTransition(async () => {
      try {
        // Malzeme option + price payload'ları
        const matOptions: OptionInput[] = materials.map((m, i) => {
          const key = m.key || slugify(m.label) || `malzeme-${i + 1}`;
          return {
            groupKey: "malzeme", groupLabel: "Malzeme", groupRole: "priced", groupSort: 1,
            optionKey: key, optionLabel: m.label || key, optionSort: i,
            rules: { effect: "perM2", birim: m.birim, ...(m.maxM2 ? { maxM2: m.maxM2 } : {}) },
          };
        });
        const matPrices: ApiPrice[] = materials.map((m, i) => {
          const key = m.key || slugify(m.label) || `malzeme-${i + 1}`;
          return { groupKey: "malzeme", optionKey: key, dimKey: null, cost: m.cost, price: 0 };
        });

        await updateProduct(productId, { pricingMode: areaMode ? "area" : "additive" });
        if (areaMode) {
          await updateProductOptions(productId, [...matOptions, ...preservedOptions]);
          await updateProductPrices(productId, [...matPrices, ...preservedPrices] as never);
        }
        toast.success("m² fiyatlandırma kaydedildi.");
      } catch {
        toast.error("Kayıt başarısız. Lütfen tekrar deneyin.");
      }
    });
  }

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <label className="flex items-center gap-2 text-sm font-medium text-ink-900">
          <input
            type="checkbox"
            checked={areaMode}
            onChange={(e) => setAreaMode(e.target.checked)}
            className="h-4 w-4 rounded border-paper-300"
          />
          m² (area) modu — özel ölçü + malzeme maliyeti
        </label>
        <span className="text-xs text-ink-500 tabular-nums">
          kur {pricing.kur} · marj ×{pricing.marj} · KDV %{Math.round(pricing.kdv * 100)}
        </span>
      </div>

      {areaMode && (
        <>
          <div className="overflow-x-auto rounded-lg border border-paper-200">
            <table className="w-full text-sm">
              <thead className="bg-paper-100/50 text-ink-500">
                <tr>
                  <th className="px-3 py-2 text-left font-medium">Malzeme</th>
                  <th className="px-3 py-2 text-right font-medium">Maliyet</th>
                  <th className="px-3 py-2 text-left font-medium">Birim</th>
                  <th className="px-3 py-2 text-right font-medium">Maks m²</th>
                  <th className="px-3 py-2 text-right font-medium">Satış ₺/m² (KDV dahil)</th>
                  <th className="px-3 py-2"></th>
                </tr>
              </thead>
              <tbody>
                {materials.map((m, i) => (
                  <tr key={i} className="border-t border-paper-200">
                    <td className="px-3 py-1.5">
                      <input className={inp} value={m.label} onChange={(e) => update(i, { label: e.target.value })} placeholder="Örn. Çin 440 Gr." />
                    </td>
                    <td className="px-3 py-1.5">
                      <input type="number" step="0.05" className={inp + " text-right w-24"} value={m.cost} onChange={(e) => update(i, { cost: Number(e.target.value) })} />
                    </td>
                    <td className="px-3 py-1.5">
                      <select className={inp + " w-20"} value={m.birim} onChange={(e) => update(i, { birim: e.target.value as "dolar" | "tl" })}>
                        <option value="dolar">$/m²</option>
                        <option value="tl">₺/m²</option>
                      </select>
                    </td>
                    <td className="px-3 py-1.5">
                      <input type="number" step="1" className={inp + " text-right w-20"} value={m.maxM2} onChange={(e) => update(i, { maxM2: Number(e.target.value) })} />
                    </td>
                    <td className="px-3 py-1.5 text-right tabular-nums font-medium text-ink-900">
                      {sellPerM2(m).toLocaleString("tr-TR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>
                    <td className="px-3 py-1.5 text-right">
                      <button onClick={() => removeRow(i)} className="text-ink-300 hover:text-red-600" title="Sil">
                        <Trash size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
                {materials.length === 0 && (
                  <tr><td colSpan={6} className="px-3 py-4 text-center text-ink-500">Henüz malzeme yok. "Malzeme Ekle" ile başla.</td></tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="mt-3 flex items-center gap-2 text-xs text-ink-500">
            <Ruler size={14} /> Maks m² = 0 → sınırsız. Satış = maliyet × kur × marj × (1+KDV), anlık.
          </div>

          <button onClick={addRow} className="mt-3 inline-flex items-center gap-1.5 rounded-lg border border-paper-300 px-3 py-1.5 text-sm font-medium text-ink-700 hover:border-ink-300">
            <Plus size={15} /> Malzeme Ekle
          </button>

          {preservedOptions.length > 0 && (
            <p className="mt-3 text-xs text-ink-500">
              + {new Set(preservedOptions.map((o) => o.groupKey)).size} ekstra grup korunuyor (dikiş/kesim/kuşgözü vb. — kaydederken silinmez).
            </p>
          )}
        </>
      )}

      <button onClick={handleSave} disabled={isPending}
        className="mt-5 inline-flex items-center gap-2 rounded-lg bg-ink-900 px-5 py-2.5 text-paper-50 font-medium disabled:opacity-60">
        <FloppyDisk size={18} /> {isPending ? "Kaydediliyor…" : "m² Fiyatlandırmayı Kaydet"}
      </button>
    </div>
  );
}

const inp = "w-full rounded border border-paper-300 px-2 py-1 text-ink-900 focus:border-ink-900 focus:outline-none";
