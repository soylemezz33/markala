"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  Calculator, Sliders, Plus, Trash, ArrowCounterClockwise,
  ShoppingCart, Ruler, Scissors, CaretDown, Info,
} from "@phosphor-icons/react";
import { cn } from "@markala/ui";
import { toast } from "@/components/toast";

/**
 * Fiyat Hesaplama Şablonu — m² bazlı ürünler (branda/afiş/CNC) için anlık $ / ₺ hesap.
 * Şablon/oyun alanı: malzeme listesi, CNC m fiyatı ve dolar kuru sayfadan düzenlenebilir.
 * Veritabanı/kayıt yok — yenilenince varsayılana döner. Storefront'a taşınabilir prototip.
 */

interface Material {
  id: string;
  label: string;
  pricePerM2: number; // $ / m²
}

const DEFAULT_MATERIALS: Material[] = [
  { id: "m-3mm", label: "3mm", pricePerM2: 8 },
  { id: "m-5mm", label: "5mm", pricePerM2: 11 },
  { id: "m-7mm", label: "7mm", pricePerM2: 14 },
];
const DEFAULT_SELECTED_ID = "m-3mm"; // = DEFAULT_MATERIALS[0].id
const DEFAULT_CNC_PER_M = "2"; // $ / metre (çevre)
const DEFAULT_RATE = "46"; // ₺ / $

// ── Yardımcılar ──────────────────────────────────────────────
/** tr-TR para formatı, sembol sonda: "1.234,56 $" */
const money = (n: number) =>
  (Number.isFinite(n) ? n : 0).toLocaleString("tr-TR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
/** ölçü formatı (0–3 ondalık): "1,5" */
const measure = (n: number) =>
  (Number.isFinite(n) ? n : 0).toLocaleString("tr-TR", { maximumFractionDigits: 3 });
const usd = (n: number) => `${money(n)} $`;
const tl = (n: number) => `${money(n)} ₺`;
/** "12,5" / "12.5" / "" → pozitif sayı veya 0 */
const toNum = (s: string) => {
  const v = parseFloat(String(s).replace(",", "."));
  return Number.isFinite(v) && v > 0 ? v : 0;
};

const inputCls =
  "w-full px-3 py-2 rounded-md border border-paper-200 bg-white text-ink-900 text-sm " +
  "outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 transition";

export default function FiyatHesaplamaSablonuPage() {
  // ── Girdiler ──
  const [en, setEn] = useState("");
  const [boy, setBoy] = useState("");
  const [adet, setAdet] = useState("1");
  const [cncEnabled, setCncEnabled] = useState(false);
  const [selectedId, setSelectedId] = useState(DEFAULT_SELECTED_ID);

  // ── Şablon ayarları (düzenlenebilir) ──
  const [materials, setMaterials] = useState<Material[]>(() =>
    DEFAULT_MATERIALS.map((m) => ({ ...m })),
  );
  const [cncPerM, setCncPerM] = useState(DEFAULT_CNC_PER_M);
  const [rate, setRate] = useState(DEFAULT_RATE);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const idSeq = useRef(0);

  // Seçili malzeme silinirse ilk mevcut malzemeye düş
  useEffect(() => {
    if (!materials.some((m) => m.id === selectedId)) {
      setSelectedId(materials[0]?.id ?? "");
    }
  }, [materials, selectedId]);

  const selected = materials.find((m) => m.id === selectedId) ?? materials[0];

  // ── Hesap ──
  const enN = toNum(en);
  const boyN = toNum(boy);
  const adetN = Math.max(1, Math.floor(toNum(adet) || 1));
  const cncN = toNum(cncPerM);
  const rateN = toNum(rate);

  const calc = useMemo(() => {
    const area = (enN * boyN) / 10000; // m²
    const perimeter = (2 * (enN + boyN)) / 100; // m
    const materialCost = area * (selected?.pricePerM2 ?? 0);
    const optionCost = cncEnabled ? perimeter * cncN : 0;
    const unitUsd = materialCost + optionCost;
    const totalUsd = unitUsd * adetN;
    const totalTl = totalUsd * rateN;
    return { area, perimeter, materialCost, optionCost, unitUsd, totalUsd, totalTl };
  }, [enN, boyN, selected?.pricePerM2, cncEnabled, cncN, adetN, rateN]);

  // ── Ayar işleyicileri ──
  const updateMaterial = (id: string, patch: Partial<Material>) =>
    setMaterials((ms) => ms.map((m) => (m.id === id ? { ...m, ...patch } : m)));
  const addMaterial = () =>
    setMaterials((ms) => [
      ...ms,
      { id: `new-${idSeq.current++}`, label: "Yeni", pricePerM2: 0 },
    ]);
  const removeMaterial = (id: string) =>
    setMaterials((ms) => ms.filter((m) => m.id !== id));
  const resetDefaults = () => {
    setMaterials(DEFAULT_MATERIALS.map((m) => ({ ...m })));
    setCncPerM(DEFAULT_CNC_PER_M);
    setRate(DEFAULT_RATE);
    setSelectedId(DEFAULT_SELECTED_ID);
    toast.info("Şablon ayarları varsayılana sıfırlandı.");
  };

  const handleAddToCart = () => {
    if (enN <= 0 || boyN <= 0) {
      toast.error("En ve boy 0'dan büyük olmalı.");
      return;
    }
    if (!selected) {
      toast.error("Lütfen bir malzeme seçin.");
      return;
    }
    toast.success(
      `Sepete eklendi · ${measure(enN)}×${measure(boyN)} cm · ${selected.label}` +
        `${cncEnabled ? " · CNC" : ""} · ${adetN} adet · ${tl(calc.totalTl)}`,
    );
  };

  return (
    <div className="space-y-6">
      {/* Başlık */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <div className="flex items-center gap-2">
            <Calculator size={24} weight="duotone" className="text-brand-600" />
            <h1 className="text-2xl font-semibold text-ink-900">Fiyat Hesaplama Şablonu</h1>
            <span className="px-2 py-0.5 rounded-full bg-brand-100 text-brand-800 text-[11px] font-bold uppercase tracking-wide">
              Şablon
            </span>
          </div>
          <p className="mt-1 text-sm text-ink-500 max-w-2xl">
            m² bazlı ürünler (branda, afiş, sert zemin) için en/boy, malzeme ve opsiyona göre anlık
            dolar &amp; TL fiyat. Ayarlar düzenlenebilir; sayfa yenilenince varsayılana döner (kayıt yok).
          </p>
        </div>
        <button
          onClick={() => setSettingsOpen((v) => !v)}
          className="inline-flex items-center gap-2 px-3 py-2 rounded-md border border-paper-200 bg-paper-50 text-sm font-medium text-ink-700 hover:bg-paper-100 transition"
          aria-expanded={settingsOpen}
        >
          <Sliders size={16} /> Ayarlar (Şablon)
          <CaretDown
            size={14}
            className={cn("transition-transform", settingsOpen && "rotate-180")}
          />
        </button>
      </div>

      {/* Ayarlar paneli */}
      {settingsOpen && (
        <section className="rounded-xl border border-paper-200 bg-paper-50 p-5 space-y-5">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <h2 className="text-sm font-semibold text-ink-900 flex items-center gap-2">
              <Sliders size={16} className="text-brand-600" /> Malzeme &amp; Fiyat Ayarları
            </h2>
            <button
              onClick={resetDefaults}
              className="inline-flex items-center gap-1.5 text-xs font-medium text-ink-500 hover:text-ink-900 transition"
            >
              <ArrowCounterClockwise size={14} /> Varsayılana sıfırla
            </button>
          </div>

          {/* Malzeme satırları */}
          <div className="space-y-2">
            <div className="grid grid-cols-[1fr_auto_auto] gap-3 px-1 text-[11px] font-semibold uppercase tracking-wide text-ink-300">
              <span>Malzeme / Baskı tipi</span>
              <span className="w-32 text-right">Fiyat ($ / m²)</span>
              <span className="w-9" />
            </div>
            {materials.map((m) => (
              <div key={m.id} className="grid grid-cols-[1fr_auto_auto] gap-3 items-center">
                <input
                  value={m.label}
                  onChange={(e) => updateMaterial(m.id, { label: e.target.value })}
                  className={inputCls}
                  placeholder="Etiket (örn. 5mm)"
                  aria-label="Malzeme etiketi"
                />
                <input
                  type="number"
                  min={0}
                  step={0.5}
                  value={m.pricePerM2}
                  onChange={(e) =>
                    updateMaterial(m.id, { pricePerM2: Math.max(0, Number(e.target.value) || 0) })
                  }
                  className={cn(inputCls, "w-32 text-right tabular-nums")}
                  aria-label="m² fiyatı (dolar)"
                />
                <button
                  onClick={() => removeMaterial(m.id)}
                  className="w-9 h-9 grid place-items-center rounded-md border border-paper-200 text-ink-500 hover:text-error hover:border-error/40 transition disabled:opacity-40 disabled:hover:text-ink-500 disabled:hover:border-paper-200"
                  disabled={materials.length <= 1}
                  aria-label="Malzemeyi sil"
                  title={materials.length <= 1 ? "En az bir malzeme olmalı" : "Sil"}
                >
                  <Trash size={16} />
                </button>
              </div>
            ))}
            <button
              onClick={addMaterial}
              className="inline-flex items-center gap-1.5 text-sm font-medium text-brand-700 hover:text-brand-800 transition"
            >
              <Plus size={15} /> Malzeme ekle
            </button>
          </div>

          {/* CNC + Kur */}
          <div className="grid sm:grid-cols-2 gap-4 pt-1">
            <label className="block">
              <span className="text-xs font-medium text-ink-700">CNC Kesim ücreti ($ / metre çevre)</span>
              <input
                type="number"
                min={0}
                step={0.5}
                value={cncPerM}
                onChange={(e) => setCncPerM(e.target.value)}
                className={cn(inputCls, "mt-1 tabular-nums")}
              />
            </label>
            <label className="block">
              <span className="text-xs font-medium text-ink-700">Dolar kuru (1 $ = ? ₺)</span>
              <input
                type="number"
                min={0}
                step={0.1}
                value={rate}
                onChange={(e) => setRate(e.target.value)}
                className={cn(inputCls, "mt-1 tabular-nums")}
              />
            </label>
          </div>
        </section>
      )}

      {/* Ana ızgara: form + özet */}
      <div className="grid lg:grid-cols-3 gap-6 items-start">
        {/* Form */}
        <div className="lg:col-span-2 rounded-xl border border-paper-200 bg-paper-50 p-5 sm:p-6 space-y-6">
          {/* En / Boy */}
          <div className="grid grid-cols-2 gap-4">
            <label className="block">
              <span className="text-sm font-medium text-ink-700">En (cm)</span>
              <input
                type="number"
                min={0}
                inputMode="decimal"
                value={en}
                onChange={(e) => setEn(e.target.value)}
                placeholder="0"
                className={cn(inputCls, "mt-1.5 tabular-nums text-base")}
              />
            </label>
            <label className="block">
              <span className="text-sm font-medium text-ink-700">Boy (cm)</span>
              <input
                type="number"
                min={0}
                inputMode="decimal"
                value={boy}
                onChange={(e) => setBoy(e.target.value)}
                placeholder="0"
                className={cn(inputCls, "mt-1.5 tabular-nums text-base")}
              />
            </label>
          </div>

          {/* Malzeme / Baskı tipi */}
          <div>
            <span className="text-sm font-medium text-ink-700">Malzeme / Baskı tipi</span>
            <div className="mt-2 flex flex-wrap gap-2">
              {materials.map((m) => {
                const active = m.id === selectedId;
                return (
                  <button
                    key={m.id}
                    onClick={() => setSelectedId(m.id)}
                    title={`${usd(m.pricePerM2)} / m²`}
                    aria-pressed={active}
                    className={cn(
                      "group relative flex flex-col items-center min-w-[88px] px-4 py-2.5 rounded-lg border text-center transition",
                      active
                        ? "border-brand-500 bg-brand-500 text-ink-900 shadow-sm"
                        : "border-paper-200 bg-white text-ink-700 hover:border-brand-300 hover:bg-brand-50",
                    )}
                  >
                    <span className="text-sm font-semibold">{m.label}</span>
                    <span className={cn("text-[11px] tabular-nums", active ? "text-ink-900/70" : "text-ink-500")}>
                      {usd(m.pricePerM2)}/m²
                    </span>
                    {/* hover tooltip */}
                    <span className="pointer-events-none absolute -top-9 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-md bg-ink-900 px-2 py-1 text-[11px] font-medium text-paper-50 opacity-0 group-hover:opacity-100 transition-opacity">
                      {usd(m.pricePerM2)} / m²
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* CNC opsiyonu */}
          <div>
            <span className="text-sm font-medium text-ink-700">Ekstra opsiyon</span>
            <button
              onClick={() => setCncEnabled((v) => !v)}
              role="switch"
              aria-checked={cncEnabled}
              className={cn(
                "mt-2 w-full flex items-center justify-between gap-3 px-4 py-3 rounded-lg border transition text-left",
                cncEnabled
                  ? "border-brand-500 bg-brand-50"
                  : "border-paper-200 bg-white hover:border-brand-300",
              )}
            >
              <span className="flex items-center gap-2.5">
                <Scissors size={18} className={cncEnabled ? "text-brand-700" : "text-ink-500"} />
                <span>
                  <span className="block text-sm font-medium text-ink-900">CNC Kesim (sert zemin)</span>
                  <span className="block text-xs text-ink-500">
                    Çevre başına +{usd(cncN)} / m
                  </span>
                </span>
              </span>
              <span
                className={cn(
                  "relative w-11 h-6 rounded-full transition-colors flex-none",
                  cncEnabled ? "bg-brand-500" : "bg-paper-300",
                )}
              >
                <span
                  className={cn(
                    "absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform",
                    cncEnabled && "translate-x-5",
                  )}
                />
              </span>
            </button>
          </div>

          {/* Adet */}
          <div className="max-w-[200px]">
            <label className="block">
              <span className="text-sm font-medium text-ink-700">Adet</span>
              <input
                type="number"
                min={1}
                step={1}
                inputMode="numeric"
                value={adet}
                onChange={(e) => setAdet(e.target.value)}
                className={cn(inputCls, "mt-1.5 tabular-nums text-base")}
              />
            </label>
          </div>
        </div>

        {/* Özet kartı */}
        <aside className="lg:sticky lg:top-24 rounded-xl border border-paper-200 bg-white overflow-hidden">
          {/* Ölçüler */}
          <div className="p-5 border-b border-paper-200">
            <h2 className="text-sm font-semibold text-ink-900 flex items-center gap-2">
              <Ruler size={16} className="text-brand-600" /> Ölçüler
            </h2>
            <div className="mt-3 grid grid-cols-2 gap-3">
              <Measure label="En" value={`${measure(enN)} cm`} />
              <Measure label="Boy" value={`${measure(boyN)} cm`} />
              <Measure label="Alan" value={`${measure(calc.area)} m²`} highlight />
              <Measure label="Çevre" value={`${measure(calc.perimeter)} m`} highlight />
            </div>
          </div>

          {/* Maliyet tablosu */}
          <div className="p-5 border-b border-paper-200">
            <div className="grid grid-cols-[1fr_auto_auto] gap-3 pb-2 text-[11px] font-semibold uppercase tracking-wide text-ink-300">
              <span />
              <span className="w-24 text-right">Birim</span>
              <span className="w-28 text-right">Toplam</span>
            </div>
            <SummaryRow
              label="Malzeme"
              birim={usd(calc.materialCost)}
              toplam={usd(calc.materialCost * adetN)}
            />
            <SummaryRow
              label={`CNC kesim${cncEnabled ? "" : " (kapalı)"}`}
              birim={usd(calc.optionCost)}
              toplam={usd(calc.optionCost * adetN)}
              muted={!cncEnabled}
            />
            <div className="border-t border-paper-200 mt-1 pt-1">
              <SummaryRow label="Toplam ($)" birim={usd(calc.unitUsd)} toplam={usd(calc.totalUsd)} strong />
              <SummaryRow label="Toplam (₺)" birim={tl(calc.unitUsd * rateN)} toplam={tl(calc.totalTl)} strong />
            </div>
          </div>

          {/* Büyük sonuç + Sepete Ekle */}
          <div className="p-5 bg-ink-900 text-paper-50">
            <div className="text-xs uppercase tracking-wide text-paper-50/60">Genel Toplam</div>
            <div className="mt-1 flex items-baseline gap-2 flex-wrap">
              <span className="text-3xl font-bold tabular-nums">{tl(calc.totalTl)}</span>
              <span className="text-sm text-brand-400 tabular-nums">{usd(calc.totalUsd)}</span>
            </div>
            <div className="mt-1 text-[11px] text-paper-50/50 flex items-center gap-1">
              <Info size={12} /> {adetN} adet · kur 1 $ = {money(rateN)} ₺
            </div>
            <button
              onClick={handleAddToCart}
              className="mt-4 w-full inline-flex items-center justify-center gap-2 px-4 py-3 rounded-lg bg-brand-500 text-ink-900 font-semibold hover:bg-brand-400 transition"
            >
              <ShoppingCart size={18} weight="bold" /> Sepete Ekle
            </button>
          </div>
        </aside>
      </div>
    </div>
  );
}

// ── Alt bileşenler ───────────────────────────────────────────
function Measure({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div
      className={cn(
        "rounded-lg px-3 py-2",
        highlight ? "bg-brand-50 border border-brand-100" : "bg-paper-100",
      )}
    >
      <div className="text-[11px] text-ink-500">{label}</div>
      <div className="text-sm font-semibold text-ink-900 tabular-nums">{value}</div>
    </div>
  );
}

function SummaryRow({
  label,
  birim,
  toplam,
  strong,
  muted,
}: {
  label: string;
  birim: string;
  toplam: string;
  strong?: boolean;
  muted?: boolean;
}) {
  return (
    <div
      className={cn(
        "grid grid-cols-[1fr_auto_auto] gap-3 items-center py-1.5 text-sm",
        muted && "opacity-50",
      )}
    >
      <span className={cn(strong ? "font-semibold text-ink-900" : "text-ink-700")}>{label}</span>
      <span className="w-24 text-right tabular-nums text-ink-500">{birim}</span>
      <span className={cn("w-28 text-right tabular-nums", strong ? "font-semibold text-ink-900" : "text-ink-900")}>
        {toplam}
      </span>
    </div>
  );
}
