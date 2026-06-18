"use client";

import { useMemo } from "react";
import { Plus, Trash } from "@phosphor-icons/react";

/**
 * Yeni ürün oluştururken FİYAT MATRİSİ kurma bileşeni (satır × sütun × fiyat).
 *
 * Çıktı şekli (storefront `calculatePrice` matris dalıyla birebir uyumlu):
 *   { id:"varyant", kind:"matrix", label, required:false,
 *     rows:[{id,label,sublabel?,group?}], cols:[{id,label}],
 *     cells:[{id:`${rowId}-${colId}`, rowId, colId, price}] }
 *
 * Semantik (UYULMASI ZORUNLU — configurator.ts):
 *   - col.id = ADET (saf rakam string "100"/"1000"); parseInt edilip adede çevrilir.
 *   - cell.price = o satır×sütun'un TAM (KDV dahil) toplam fiyatı; total += cell.price.
 *   - Bu yüzden matris varsa ürün basePrice = 0 olmalı (çift sayım olmaz).
 *
 * Bu bileşen yalnız taslak/builder durumunu tutar; nihai parameters dizisini
 * `buildMatrixParameter()` üretir (yalnız fiyatı dolu hücreler cell olur).
 */

export interface MatrixRowDraft {
  /** Geçici satır anahtarı (React key + grid hücre eşleştirme). row.id slug'tan türetilir. */
  key: string;
  label: string;
  sublabel: string;
  group: string;
}

export interface MatrixColDraft {
  key: string;
  /** Adet — saf rakam string (col.id). Örn "1000". */
  qty: string;
  /** Otomatik "{qty} Adet" — admin override edebilir. Boşsa otomatik üretilir. */
  label: string;
}

export interface MatrixDraft {
  enabled: boolean;
  label: string;
  rows: MatrixRowDraft[];
  cols: MatrixColDraft[];
  /** Fiyat ızgarası: anahtar `${rowKey}::${colKey}`, değer string ("" = hücre yok). */
  prices: Record<string, string>;
}

export interface MatrixParameterOutput {
  id: string;
  kind: "matrix";
  label: string;
  required: boolean;
  rows: Array<{ id: string; label: string; sublabel?: string; group?: string }>;
  cols: Array<{ id: string; label: string }>;
  cells: Array<{ id: string; rowId: string; colId: string; price: number }>;
}

let keySeq = 0;
function nextKey(): string {
  keySeq += 1;
  return `k${keySeq}-${Date.now().toString(36)}`;
}

export function emptyMatrixDraft(): MatrixDraft {
  return {
    enabled: false,
    label: "Paket × Adet",
    rows: [{ key: nextKey(), label: "", sublabel: "", group: "" }],
    cols: [{ key: nextKey(), qty: "", label: "" }],
    prices: {},
  };
}

/** Türkçe karakterleri sadeleştirip slug üretir (backend SLUG_REGEX: a-z0-9 ve tire). */
function slugify(input: string): string {
  const map: Record<string, string> = {
    ç: "c", ğ: "g", ı: "i", ö: "o", ş: "s", ü: "u",
    Ç: "c", Ğ: "g", İ: "i", Ö: "o", Ş: "s", Ü: "u",
  };
  return input
    .replace(/[çğıöşüÇĞİÖŞÜ]/g, (c) => map[c] ?? c)
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

const priceKey = (rowKey: string, colKey: string) => `${rowKey}::${colKey}`;

/**
 * Taslaktan nihai matris parametresini üretir. Geçersizse null döner.
 * Geçerlilik: en az 1 satır (slug üretilebilir label) + 1 sütun (rakam adet) + 1 dolu hücre.
 * Yalnız fiyatı geçerli (>0) dolu hücreler cell olur.
 * Aynı slug'a çıkan satırlar -2,-3 ekiyle benzersizleştirilir.
 */
export function buildMatrixParameter(draft: MatrixDraft): MatrixParameterOutput | null {
  if (!draft.enabled) return null;

  // Satırlar → benzersiz slug id
  const usedRowIds = new Set<string>();
  const rowKeyToId = new Map<string, string>();
  const rows: MatrixParameterOutput["rows"] = [];
  for (const r of draft.rows) {
    const baseSlug = slugify(r.label);
    if (!baseSlug) continue; // boş/geçersiz label → satır atlanır
    let id = baseSlug;
    let n = 2;
    while (usedRowIds.has(id)) {
      id = `${baseSlug}-${n}`;
      n += 1;
    }
    usedRowIds.add(id);
    rowKeyToId.set(r.key, id);
    rows.push({
      id,
      label: r.label.trim(),
      ...(r.sublabel.trim() ? { sublabel: r.sublabel.trim() } : {}),
      ...(r.group.trim() ? { group: r.group.trim() } : {}),
    });
  }

  // Sütunlar → adet (saf rakam) id; çakışan adetler atlanır
  const usedColIds = new Set<string>();
  const colKeyToId = new Map<string, string>();
  const cols: MatrixParameterOutput["cols"] = [];
  for (const c of draft.cols) {
    const qty = c.qty.trim();
    if (!/^\d+$/.test(qty) || Number(qty) <= 0) continue;
    if (usedColIds.has(qty)) continue;
    usedColIds.add(qty);
    colKeyToId.set(c.key, qty);
    const label = c.label.trim() || `${Number(qty).toLocaleString("tr-TR")} Adet`;
    cols.push({ id: qty, label });
  }

  if (rows.length === 0 || cols.length === 0) return null;

  // Hücreler — yalnız fiyatı dolu ve geçerli (>0) kombinasyonlar
  const cells: MatrixParameterOutput["cells"] = [];
  for (const r of draft.rows) {
    const rowId = rowKeyToId.get(r.key);
    if (!rowId) continue;
    for (const c of draft.cols) {
      const colId = colKeyToId.get(c.key);
      if (!colId) continue;
      const raw = draft.prices[priceKey(r.key, c.key)];
      if (raw == null || raw.trim() === "") continue;
      const price = Number(raw);
      if (!Number.isFinite(price) || price <= 0) continue;
      cells.push({ id: `${rowId}-${colId}`, rowId, colId, price });
    }
  }

  if (cells.length === 0) return null;

  return {
    id: "varyant",
    kind: "matrix",
    label: draft.label.trim() || "Paket × Adet",
    required: false,
    rows,
    cols,
    cells,
  };
}

const inputCls =
  "w-full px-3 py-2 rounded-md border border-paper-200 bg-paper-50 text-ink-900 text-sm focus:border-ink-900 focus:outline-none focus:ring-2 focus:ring-brand-300/30";

function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className={`relative w-11 h-6 rounded-full transition-colors flex-none ${
        checked ? "bg-brand-500" : "bg-paper-200"
      }`}
      role="switch"
      aria-checked={checked}
    >
      <span
        className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-paper-50 shadow transition-transform ${
          checked ? "translate-x-5" : ""
        }`}
      />
    </button>
  );
}

export function MatrixBuilder({
  value,
  onChange,
}: {
  value: MatrixDraft;
  onChange: (v: MatrixDraft) => void;
}) {
  // Geçerli satır/sütun sayıları (uyarı/önizleme için).
  const built = useMemo(() => buildMatrixParameter(value), [value]);

  function patch(p: Partial<MatrixDraft>) {
    onChange({ ...value, ...p });
  }

  function addRow() {
    patch({ rows: [...value.rows, { key: nextKey(), label: "", sublabel: "", group: "" }] });
  }
  function removeRow(key: string) {
    const prices = { ...value.prices };
    for (const c of value.cols) delete prices[priceKey(key, c.key)];
    patch({ rows: value.rows.filter((r) => r.key !== key), prices });
  }
  function updateRow(key: string, p: Partial<MatrixRowDraft>) {
    patch({ rows: value.rows.map((r) => (r.key === key ? { ...r, ...p } : r)) });
  }

  function addCol() {
    patch({ cols: [...value.cols, { key: nextKey(), qty: "", label: "" }] });
  }
  function removeCol(key: string) {
    const prices = { ...value.prices };
    for (const r of value.rows) delete prices[priceKey(r.key, key)];
    patch({ cols: value.cols.filter((c) => c.key !== key), prices });
  }
  function updateCol(key: string, p: Partial<MatrixColDraft>) {
    patch({ cols: value.cols.map((c) => (c.key === key ? { ...c, ...p } : c)) });
  }

  function setPrice(rowKey: string, colKey: string, val: string) {
    patch({ prices: { ...value.prices, [priceKey(rowKey, colKey)]: val } });
  }

  return (
    <div className="space-y-4">
      <label className="flex items-center justify-between gap-3 cursor-pointer">
        <span className="text-sm font-medium text-ink-900">
          Bu üründe fiyat matrisi var mı?
          <span className="block text-xs font-normal text-ink-500 mt-0.5">
            Açıkça satır (tür/paket) × sütun (adet) için sabit fiyat tablosu kurulur. Kapalıysa basit ürün (yalnız taban fiyat).
          </span>
        </span>
        <Toggle checked={value.enabled} onChange={(v) => patch({ enabled: v })} />
      </label>

      {value.enabled && (
        <div className="space-y-5 pt-1">
          <label className="block">
            <span className="block text-xs font-semibold text-ink-700 uppercase tracking-wider mb-1.5">
              Matris Başlığı
            </span>
            <input
              value={value.label}
              onChange={(e) => patch({ label: e.target.value })}
              placeholder="Paket × Adet"
              className={inputCls}
            />
          </label>

          {/* Satırlar */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-ink-700 uppercase tracking-wider">
                Satırlar (Tür / Paket)
              </span>
              <button
                type="button"
                onClick={addRow}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-medium border border-paper-200 hover:bg-paper-100"
              >
                <Plus size={12} weight="bold" /> Satır Ekle
              </button>
            </div>
            <div className="space-y-2">
              {value.rows.map((r) => (
                <div
                  key={r.key}
                  className="grid grid-cols-1 sm:grid-cols-[1fr_1fr_120px_auto] gap-2 items-start"
                >
                  <input
                    value={r.label}
                    onChange={(e) => updateRow(r.key, { label: e.target.value })}
                    placeholder="Etiket * (örn. A4 Mat)"
                    className={inputCls}
                  />
                  <input
                    value={r.sublabel}
                    onChange={(e) => updateRow(r.key, { sublabel: e.target.value })}
                    placeholder="Alt etiket (örn. 21x30 cm)"
                    className={inputCls}
                  />
                  <input
                    value={r.group}
                    onChange={(e) => updateRow(r.key, { group: e.target.value })}
                    placeholder="Grup"
                    className={inputCls}
                  />
                  <button
                    type="button"
                    onClick={() => removeRow(r.key)}
                    disabled={value.rows.length <= 1}
                    aria-label="Satırı sil"
                    className="p-2 rounded-md text-ink-500 hover:bg-paper-100 hover:text-red-600 disabled:opacity-40 disabled:hover:bg-transparent disabled:hover:text-ink-500"
                  >
                    <Trash size={16} />
                  </button>
                </div>
              ))}
            </div>
            <p className="text-[11px] text-ink-500 mt-1.5">
              row.id, etikettan otomatik slug üretir (küçük harf, tire; çakışırsa -2, -3).
            </p>
          </div>

          {/* Sütunlar */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-ink-700 uppercase tracking-wider">
                Sütunlar (Adet)
              </span>
              <button
                type="button"
                onClick={addCol}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-medium border border-paper-200 hover:bg-paper-100"
              >
                <Plus size={12} weight="bold" /> Sütun Ekle
              </button>
            </div>
            <div className="space-y-2">
              {value.cols.map((c) => (
                <div
                  key={c.key}
                  className="grid grid-cols-1 sm:grid-cols-[140px_1fr_auto] gap-2 items-start"
                >
                  <input
                    type="number"
                    min={1}
                    step={1}
                    value={c.qty}
                    onChange={(e) => updateCol(c.key, { qty: e.target.value })}
                    placeholder="Adet * (1000)"
                    className={inputCls + " tabular-nums"}
                  />
                  <input
                    value={c.label}
                    onChange={(e) => updateCol(c.key, { label: e.target.value })}
                    placeholder={
                      /^\d+$/.test(c.qty.trim()) && Number(c.qty) > 0
                        ? `${Number(c.qty.trim()).toLocaleString("tr-TR")} Adet (otomatik)`
                        : "Etiket (otomatik)"
                    }
                    className={inputCls}
                  />
                  <button
                    type="button"
                    onClick={() => removeCol(c.key)}
                    disabled={value.cols.length <= 1}
                    aria-label="Sütunu sil"
                    className="p-2 rounded-md text-ink-500 hover:bg-paper-100 hover:text-red-600 disabled:opacity-40 disabled:hover:bg-transparent disabled:hover:text-ink-500"
                  >
                    <Trash size={16} />
                  </button>
                </div>
              ))}
            </div>
            <p className="text-[11px] text-ink-500 mt-1.5">
              col.id = adet (saf rakam). Etiket boşsa otomatik &quot;{"{adet}"} Adet&quot; yazılır.
            </p>
          </div>

          {/* Fiyat ızgarası */}
          <div>
            <span className="block text-xs font-semibold text-ink-700 uppercase tracking-wider mb-2">
              Fiyat Izgarası (₺ — KDV dahil tam fiyat)
            </span>
            <div className="overflow-x-auto border border-paper-200 rounded-md">
              <table className="w-full text-xs">
                <thead className="bg-paper-100/60 text-ink-500">
                  <tr>
                    <th className="text-left px-3 py-2 font-semibold sticky left-0 bg-paper-100/60 z-10">
                      Tür / Paket
                    </th>
                    {value.cols.map((c) => (
                      <th
                        key={c.key}
                        className="text-center px-2 py-2 font-semibold whitespace-nowrap"
                      >
                        {/^\d+$/.test(c.qty.trim()) && Number(c.qty) > 0
                          ? c.label.trim() || `${Number(c.qty.trim()).toLocaleString("tr-TR")} Adet`
                          : "Adet ?"}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-paper-200">
                  {value.rows.map((r) => (
                    <tr key={r.key} className="hover:bg-paper-100/40">
                      <th
                        scope="row"
                        className="text-left px-3 py-2 font-medium text-ink-900 sticky left-0 bg-paper-50"
                      >
                        {r.label.trim() || (
                          <span className="text-ink-400 font-normal">(etiket?)</span>
                        )}
                      </th>
                      {value.cols.map((c) => (
                        <td key={c.key} className="px-1.5 py-1 text-center">
                          <input
                            type="number"
                            min={0}
                            step={0.01}
                            value={value.prices[priceKey(r.key, c.key)] ?? ""}
                            onChange={(e) => setPrice(r.key, c.key, e.target.value)}
                            placeholder="—"
                            className="w-20 px-1.5 py-1 rounded border border-paper-200 text-xs tabular-nums text-center focus:border-ink-900 focus:outline-none"
                          />
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="text-[11px] text-ink-500 mt-1.5">
              Boş hücre = o kombinasyon satışa çıkmaz. Hücre fiyatı, o satır×sütun&apos;un TAM toplam fiyatıdır.
            </p>
          </div>

          {/* Durum/uyarı satırı */}
          <div
            className={`text-xs rounded-md px-3 py-2 border ${
              built
                ? "border-green-200 bg-green-50 text-green-800"
                : "border-amber-200 bg-amber-50 text-amber-800"
            }`}
          >
            {built ? (
              <>
                Matris geçerli: {built.rows.length} satır × {built.cols.length} sütun,{" "}
                {built.cells.length} dolu hücre. Matris tam fiyat sağladığı için taban fiyat 0 olarak
                kaydedilecek.
              </>
            ) : (
              <>En az 1 satır (etiketli) + 1 sütun (adet) + 1 dolu fiyat hücresi gerekli.</>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
