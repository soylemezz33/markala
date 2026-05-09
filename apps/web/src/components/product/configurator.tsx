"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Button, Price, cn } from "@markala/ui";
import { ShoppingBagOpen, Check, UploadSimple, CheckCircle } from "@phosphor-icons/react";
import type { Product, ProductOption, ProductParameter } from "@markala/types";
import { calculatePrice, getInstallmentAmount, initConfig, isDimensionValue, type ConfigState, type DimensionValue } from "@/lib/configurator";
import { useCartStore } from "@/lib/cart-store";
import { DimensionField } from "./dimension-field";

function buildSummary(product: Product, state: ConfigState, needsDesign: boolean): string {
  const parts: string[] = [];
  for (const param of product.parameters) {
    const sel = state.selections[param.id];
    if ((param.kind === "radio" || param.kind === "select") && typeof sel === "string") {
      const opt = param.options?.find((o) => o.id === sel);
      if (opt) parts.push(opt.label);
    } else if (param.kind === "checkbox-group" && Array.isArray(sel) && sel.length > 0) {
      const labels = sel.map((id) => param.options?.find((o) => o.id === id)?.label).filter(Boolean);
      if (labels.length > 0) parts.push(labels.join(", "));
    } else if (param.kind === "quantity" && typeof sel === "number") {
      parts.push(`${sel.toLocaleString("tr-TR")} adet`);
    } else if (param.kind === "dimension" && isDimensionValue(sel)) {
      parts.push(`${sel.width} × ${sel.height} cm`);
      if (sel.extras.length > 0) {
        const labels = sel.extras
          .map((id) => param.extras?.find((e) => e.id === id)?.label)
          .filter(Boolean);
        if (labels.length > 0) parts.push(labels.join(", "));
      }
    } else if (param.kind === "matrix" && typeof sel === "string") {
      const cell = param.cells?.find((c) => c.id === sel);
      if (cell) {
        const row = param.rows?.find((r) => r.id === cell.rowId);
        const col = param.cols?.find((c) => c.id === cell.colId);
        const segments: string[] = [];
        if (row?.label) segments.push(row.sublabel ? `${row.label} (${row.sublabel})` : row.label);
        if (col?.label) segments.push(col.label);
        if (cell.code) segments.unshift(cell.code);
        parts.push(segments.join(" · "));
      }
    }
  }
  if (needsDesign) parts.push("Tasarım desteği isteniyor");
  return parts.join(" · ");
}

export function Configurator({ product }: { product: Product }) {
  const router = useRouter();
  const addItem = useCartStore((s) => s.addItem);
  const [state, setState] = useState<ConfigState>(() => initConfig(product));
  const [needsDesign, setNeedsDesign] = useState(false);
  const [uploadedFileName, setUploadedFileName] = useState<string | undefined>();
  const [justAdded, setJustAdded] = useState(false);

  const breakdown = useMemo(() => calculatePrice(product, state), [product, state]);

  function handleAddToCart() {
    addItem({
      productSlug: product.slug,
      productName: product.name,
      productImage: product.images[0] ?? "",
      configuration: {
        selections: state.selections,
        summary: buildSummary(product, state, needsDesign),
        totalPrice: breakdown.total,
        needsDesign,
        uploadedFileName,
      },
    });
    setJustAdded(true);
    setTimeout(() => setJustAdded(false), 1500);
  }

  function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) setUploadedFileName(file.name);
  }

  function setRadio(paramId: string, optionId: string) {
    setState((s) => ({ ...s, selections: { ...s.selections, [paramId]: optionId } }));
  }

  function toggleCheckbox(paramId: string, optionId: string) {
    setState((s) => {
      const current = (s.selections[paramId] as string[]) ?? [];
      const next = current.includes(optionId)
        ? current.filter((id) => id !== optionId)
        : [...current, optionId];
      return { ...s, selections: { ...s.selections, [paramId]: next } };
    });
  }

  function setQuantity(paramId: string, value: number) {
    setState((s) => ({ ...s, selections: { ...s.selections, [paramId]: Math.max(1, value) } }));
  }

  function setDimension(paramId: string, value: DimensionValue) {
    setState((s) => ({ ...s, selections: { ...s.selections, [paramId]: value } }));
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-display-md font-serif text-ink-900">{product.name}</h1>
        {product.rating && (
          <div className="mt-2 flex items-center gap-2 text-sm text-ink-500">
            <span className="text-brand-500">★</span>
            <span className="font-medium text-ink-900">{product.rating.average.toFixed(1)}</span>
            <span>({product.rating.count} yorum)</span>
            <span className="mx-1 text-paper-200">·</span>
            <span>Üretim: {product.productionTime}</span>
          </div>
        )}
      </div>

      <p className="text-ink-700 leading-relaxed">{product.shortDescription}</p>

      <div className="space-y-6 pt-2">
        {product.parameters.map((param) => (
          <ParameterField
            key={param.id}
            param={param}
            value={state.selections[param.id]}
            onRadio={(id) => setRadio(param.id, id)}
            onCheckbox={(id) => toggleCheckbox(param.id, id)}
            onQuantity={(n) => setQuantity(param.id, n)}
            onDimension={(v) => setDimension(param.id, v)}
          />
        ))}

        <DesignUpload
          needsDesign={needsDesign}
          onToggle={setNeedsDesign}
          uploadedFileName={uploadedFileName}
          onFileChange={handleFileUpload}
        />
      </div>

      <PriceCard breakdown={breakdown} />

      <Button size="lg" fullWidth onClick={handleAddToCart} disabled={justAdded}>
        {justAdded ? (
          <>
            <CheckCircle size={20} weight="bold" /> Sepete Eklendi
          </>
        ) : (
          <>
            <ShoppingBagOpen size={20} weight="bold" /> Sepete Ekle
          </>
        )}
      </Button>

      {/* Mobile sticky bottom bar — fiyat + sepete ekle */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-30 bg-paper-50 border-t border-paper-200 shadow-2xl px-4 py-3 flex items-center gap-3">
        <div className="flex-1 min-w-0">
          <div className="text-[10px] uppercase tracking-wider text-ink-500 font-semibold">Toplam</div>
          <div className="text-lg font-bold text-ink-900 tabular-nums truncate">
            {breakdown.total.toLocaleString("tr-TR")} ₺
          </div>
        </div>
        <Button onClick={handleAddToCart} disabled={justAdded} className="flex-none">
          {justAdded ? (
            <>
              <CheckCircle size={16} weight="bold" /> Eklendi
            </>
          ) : (
            <>
              <ShoppingBagOpen size={16} weight="bold" /> Sepete Ekle
            </>
          )}
        </Button>
      </div>
      {/* Sticky bar için alt boşluk — mobilde içerik kapanmasın */}
      <div className="lg:hidden h-20" />

      <p className="text-xs text-ink-500 text-center">
        Sepete eklediğinizde üretim başlamaz — onay sonrası matbaa süreci başlar.
      </p>
    </div>
  );
}

interface FieldProps {
  param: ProductParameter;
  value: string | string[] | number | DimensionValue | undefined;
  onRadio: (optionId: string) => void;
  onCheckbox: (optionId: string) => void;
  onQuantity: (n: number) => void;
  onDimension: (v: DimensionValue) => void;
}

function ParameterField({ param, value, onRadio, onCheckbox, onQuantity, onDimension }: FieldProps) {
  return (
    <div>
      <div className="flex items-baseline justify-between mb-3">
        <label className="text-sm font-medium text-ink-900">
          {param.label}
          {param.required && <span className="text-error ml-0.5">*</span>}
        </label>
      </div>

      {param.kind === "radio" && param.options && (
        <div className="grid grid-cols-1 gap-2">
          {param.options.map((opt) => (
            <RadioCard
              key={opt.id}
              option={opt}
              selected={value === opt.id}
              onSelect={() => onRadio(opt.id)}
            />
          ))}
        </div>
      )}

      {param.kind === "checkbox-group" && param.options && (
        <div className="space-y-2">
          {param.options.map((opt) => {
            const checked = Array.isArray(value) && value.includes(opt.id);
            return (
              <CheckboxCard
                key={opt.id}
                option={opt}
                checked={checked}
                onToggle={() => onCheckbox(opt.id)}
              />
            );
          })}
        </div>
      )}

      {param.kind === "quantity" && (
        <QuantityField
          value={typeof value === "number" ? value : 1}
          presets={param.quantityPresets ?? []}
          unitPrice={param.unitPrice ?? 0}
          onChange={onQuantity}
        />
      )}

      {param.kind === "dimension" && isDimensionValue(value) && (
        <DimensionField param={param} value={value} onChange={onDimension} />
      )}

      {param.kind === "matrix" && (
        <MatrixField
          param={param}
          value={typeof value === "string" ? value : ""}
          onSelect={(id) => onRadio(id)}
        />
      )}
    </div>
  );
}

function MatrixField({
  param,
  value,
  onSelect,
}: {
  param: ProductParameter;
  value: string;
  onSelect: (cellId: string) => void;
}) {
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

function RadioCard({
  option,
  selected,
  onSelect,
}: {
  option: ProductOption;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        "flex items-center justify-between gap-3 px-4 py-3 rounded-md border text-left transition-all duration-200 ease-out-expo",
        selected
          ? "border-ink-900 bg-paper-50 shadow-sm"
          : "border-paper-200 bg-paper-50 hover:border-ink-300",
      )}
    >
      <div className="flex items-center gap-3">
        <span
          className={cn(
            "w-4 h-4 rounded-full border-2 grid place-items-center",
            selected ? "border-ink-900" : "border-paper-300",
          )}
        >
          {selected && <span className="w-2 h-2 rounded-full bg-ink-900" />}
        </span>
        <span className="font-medium text-ink-900 text-sm">{option.label}</span>
      </div>
      {option.priceModifier !== 0 && (
        <span className="text-sm tabular-nums text-ink-500">
          {option.priceModifier > 0 ? "+" : ""}
          {option.priceModifier.toLocaleString("tr-TR")} ₺
        </span>
      )}
    </button>
  );
}

function CheckboxCard({
  option,
  checked,
  onToggle,
}: {
  option: ProductOption;
  checked: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className={cn(
        "w-full flex items-center justify-between gap-3 px-4 py-3 rounded-md border text-left transition-all duration-200 ease-out-expo",
        checked
          ? "border-ink-900 bg-brand-50"
          : "border-paper-200 bg-paper-50 hover:border-ink-300",
      )}
    >
      <div className="flex items-center gap-3">
        <span
          className={cn(
            "w-4 h-4 rounded border-2 grid place-items-center",
            checked ? "bg-ink-900 border-ink-900 text-paper-50" : "border-paper-300",
          )}
        >
          {checked && <Check size={10} weight="bold" />}
        </span>
        <span className="font-medium text-ink-900 text-sm">{option.label}</span>
      </div>
      {option.priceModifier !== 0 && (
        <span className="text-sm tabular-nums text-ink-500">
          +{option.priceModifier.toLocaleString("tr-TR")} ₺
        </span>
      )}
    </button>
  );
}

function QuantityField({
  value,
  presets,
  unitPrice,
  onChange,
}: {
  value: number;
  presets: number[];
  unitPrice: number;
  onChange: (n: number) => void;
}) {
  return (
    <div>
      <div className="flex flex-wrap gap-2">
        {presets.map((preset) => (
          <button
            key={preset}
            type="button"
            onClick={() => onChange(preset)}
            className={cn(
              "px-4 h-10 rounded-md border text-sm font-medium tabular-nums transition-all",
              value === preset
                ? "border-ink-900 bg-ink-900 text-paper-50"
                : "border-paper-200 text-ink-700 hover:border-ink-300",
            )}
          >
            {preset.toLocaleString("tr-TR")}
          </button>
        ))}
        <input
          type="number"
          min={1}
          value={value}
          onChange={(e) => onChange(parseInt(e.target.value, 10) || 1)}
          className="w-24 h-10 px-3 rounded-md border border-paper-200 bg-paper-50 text-ink-900 text-sm tabular-nums focus:border-ink-900 focus:outline-none"
        />
      </div>
      {unitPrice > 0 && (
        <p className="mt-2 text-xs text-ink-500">
          Birim fiyat: {unitPrice.toLocaleString("tr-TR", { minimumFractionDigits: 2 })} ₺
        </p>
      )}
    </div>
  );
}

function DesignUpload({
  needsDesign,
  onToggle,
  uploadedFileName,
  onFileChange,
}: {
  needsDesign: boolean;
  onToggle: (v: boolean) => void;
  uploadedFileName: string | undefined;
  onFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}) {
  return (
    <div className="border-t border-paper-200 pt-6">
      <label className="flex items-center justify-between gap-3 cursor-pointer">
        <span className="text-sm font-medium text-ink-900">
          Tasarım desteği istiyorum
          <span className="block text-xs text-ink-500 font-normal mt-0.5">
            Profesyonel grafik ekibimiz sizin için hazırlasın — ücretsiz.
          </span>
        </span>
        <button
          type="button"
          onClick={() => onToggle(!needsDesign)}
          className={cn(
            "relative w-11 h-6 rounded-full transition-colors flex-none",
            needsDesign ? "bg-brand-500" : "bg-paper-200",
          )}
          role="switch"
          aria-checked={needsDesign}
        >
          <span
            className={cn(
              "absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-paper-50 shadow transition-transform",
              needsDesign && "translate-x-5",
            )}
          />
        </button>
      </label>

      {!needsDesign && (
        <label className="mt-4 block border-2 border-dashed border-paper-200 rounded-md p-6 text-center hover:border-ink-300 transition-colors cursor-pointer">
          <input
            type="file"
            className="hidden"
            accept=".ai,.pdf,.cdr,.psd,.jpg,.jpeg,.png"
            onChange={onFileChange}
          />
          {uploadedFileName ? (
            <>
              <CheckCircle size={28} className="mx-auto text-success" />
              <p className="mt-2 text-sm font-medium text-ink-900 break-all">{uploadedFileName}</p>
              <p className="mt-1 text-xs text-ink-500">Dosya hazır — sepete eklerken yüklenecek</p>
            </>
          ) : (
            <>
              <UploadSimple size={28} className="mx-auto text-ink-500" />
              <p className="mt-2 text-sm font-medium text-ink-900">Tasarım dosyanızı yükleyin</p>
              <p className="mt-1 text-xs text-ink-500">
                AI, PDF, CDR, PSD, JPG, PNG · Maks. 200 MB
              </p>
            </>
          )}
        </label>
      )}
    </div>
  );
}

function PriceCard({ breakdown }: { breakdown: ReturnType<typeof calculatePrice> }) {
  const installment = getInstallmentAmount(breakdown.total, 3);
  return (
    <div className="bg-ink-900 text-paper-50 rounded-lg p-5 md:p-6">
      <div className="flex items-baseline justify-between">
        <span className="text-sm text-paper-100/70">Toplam</span>
        <Price amount={breakdown.total} size="xl" className="text-brand-300 transition-all duration-200" />
      </div>
      <div className="mt-2 flex items-center justify-between text-xs text-paper-100/60">
        <span>{breakdown.vatIncluded ? "KDV dahil" : "KDV hariç"}</span>
        {breakdown.total > 100 && (
          <span>
            3 taksitle <Price amount={installment} size="sm" className="text-paper-100" />'den
          </span>
        )}
      </div>
    </div>
  );
}
