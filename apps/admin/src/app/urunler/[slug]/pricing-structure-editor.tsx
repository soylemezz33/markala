"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { OptionInput } from "@markala/api-client";
import { toast } from "@/components/toast";
import { updateProductOptions } from "./actions";

// ===== Tipler =====

interface OptionRow {
  /** Orijinal key (mevcut kayıttan geldiyse korunur; yeni ise label'dan türetilir). */
  _originalKey: string | null;
  optionKey: string;
  optionLabel: string;
  optionSublabel: string;
  optionSort: number;
}

interface GroupRow {
  /** Orijinal key (mevcut kayıttan geldiyse korunur). */
  _originalKey: string | null;
  groupKey: string;
  groupLabel: string;
  groupRole: "dimension" | "priced";
  groupSort: number;
  options: OptionRow[];
}

interface Props {
  productId: string;
  initialOptions: OptionInput[];
}

// ===== Yardımcı: Türkçe slug üretici =====

function slugify(text: string): string {
  return (
    text
      .toLowerCase()
      .replace(/ç/g, "c")
      .replace(/ğ/g, "g")
      .replace(/ı/g, "i")
      .replace(/ö/g, "o")
      .replace(/ş/g, "s")
      .replace(/ü/g, "u")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "") || "grup"
  );
}

// ===== OptionInput[] → GroupRow[] dönüşümü =====

function buildGroups(options: OptionInput[]): GroupRow[] {
  const map = new Map<string, GroupRow>();
  for (const o of options) {
    if (!map.has(o.groupKey)) {
      map.set(o.groupKey, {
        _originalKey: o.groupKey,
        groupKey: o.groupKey,
        groupLabel: o.groupLabel,
        groupRole: o.groupRole,
        groupSort: o.groupSort,
        options: [],
      });
    }
    const g = map.get(o.groupKey);
    if (g) {
      g.options.push({
        _originalKey: o.optionKey,
        optionKey: o.optionKey,
        optionLabel: o.optionLabel,
        optionSublabel: o.optionSublabel ?? "",
        optionSort: o.optionSort,
      });
    }
  }
  const groups = Array.from(map.values()).sort((a, b) => a.groupSort - b.groupSort);
  for (const g of groups) {
    g.options.sort((a, b) => a.optionSort - b.optionSort);
  }
  return groups;
}

// ===== GroupRow[] → OptionInput[] düzleştirme =====

function flattenGroups(groups: GroupRow[]): OptionInput[] {
  const result: OptionInput[] = [];
  groups.forEach((g, gi) => {
    g.options.forEach((o, oi) => {
      result.push({
        groupKey: g.groupKey,
        groupLabel: g.groupLabel,
        groupRole: g.groupRole,
        groupSort: gi,
        optionKey: o.optionKey,
        optionLabel: o.optionLabel,
        optionSublabel: o.optionSublabel || undefined,
        optionSort: oi,
      });
    });
  });
  return result;
}

// ===== Immutable grup güncelleme yardımcısı =====

function mapGroups(
  prev: GroupRow[],
  gi: number,
  fn: (g: GroupRow) => GroupRow,
): GroupRow[] {
  return prev.map((g, i) => (i === gi ? fn(g) : g));
}

function mapOptions(
  g: GroupRow,
  oi: number,
  fn: (o: OptionRow) => OptionRow,
): GroupRow {
  return { ...g, options: g.options.map((o, i) => (i === oi ? fn(o) : o)) };
}

// ===== Ana bileşen =====

export function PricingStructureEditor({ productId, initialOptions }: Props) {
  const router = useRouter();
  const [groups, setGroups] = useState<GroupRow[]>(() => buildGroups(initialOptions));
  const [isPending, startTransition] = useTransition();

  // ----- Grup işlemleri -----

  function addGroup() {
    setGroups((prev): GroupRow[] => [
      ...prev,
      {
        _originalKey: null,
        groupKey: `yeni-grup-${prev.length + 1}`,
        groupLabel: "",
        groupRole: "dimension",
        groupSort: prev.length,
        options: [],
      },
    ]);
  }

  function removeGroup(gi: number) {
    setGroups((prev) => prev.filter((_, i) => i !== gi));
  }

  function moveGroup(gi: number, dir: -1 | 1) {
    setGroups((prev): GroupRow[] => {
      const next = [...prev];
      const target = gi + dir;
      if (target < 0 || target >= next.length) return prev;
      const a = next[gi];
      const b = next[target];
      if (!a || !b) return prev;
      next[gi] = b;
      next[target] = a;
      return next;
    });
  }

  function updateGroupLabel(gi: number, label: string) {
    setGroups((prev) =>
      mapGroups(prev, gi, (g): GroupRow => {
        const newKey = g._originalKey === null ? slugify(label) || `grup-${gi + 1}` : g.groupKey;
        return { ...g, groupLabel: label, groupKey: newKey };
      }),
    );
  }

  function updateGroupRole(gi: number, role: "dimension" | "priced") {
    setGroups((prev) => mapGroups(prev, gi, (g): GroupRow => ({ ...g, groupRole: role })));
  }

  // ----- Seçenek işlemleri -----

  function addOption(gi: number) {
    setGroups((prev) =>
      mapGroups(prev, gi, (g): GroupRow => ({
        ...g,
        options: [
          ...g.options,
          {
            _originalKey: null,
            optionKey: `yeni-${g.options.length + 1}`,
            optionLabel: "",
            optionSublabel: "",
            optionSort: g.options.length,
          },
        ],
      })),
    );
  }

  function removeOption(gi: number, oi: number) {
    setGroups((prev) =>
      mapGroups(prev, gi, (g): GroupRow => ({
        ...g,
        options: g.options.filter((_, i) => i !== oi),
      })),
    );
  }

  function updateOptionLabel(gi: number, oi: number, label: string) {
    setGroups((prev) =>
      mapGroups(prev, gi, (g) =>
        mapOptions(g, oi, (o): OptionRow => {
          const newKey =
            o._originalKey === null ? slugify(label) || `secnek-${oi + 1}` : o.optionKey;
          return { ...o, optionLabel: label, optionKey: newKey };
        }),
      ),
    );
  }

  function updateOptionSublabel(gi: number, oi: number, sublabel: string) {
    setGroups((prev) =>
      mapGroups(prev, gi, (g) =>
        mapOptions(g, oi, (o): OptionRow => ({ ...o, optionSublabel: sublabel })),
      ),
    );
  }

  // ----- Kaydet -----

  function handleSave() {
    startTransition(async () => {
      try {
        await updateProductOptions(productId, flattenGroups(groups));
        toast.success("Yapı kaydedildi.");
        router.refresh();
      } catch {
        toast.error("Yapı kaydedilemedi.");
      }
    });
  }

  // ===== UI =====

  const inputCls =
    "w-full px-2.5 py-1.5 rounded border border-paper-200 bg-paper-50 text-ink-900 text-sm focus:border-ink-900 focus:outline-none focus:ring-2 focus:ring-brand-300/30";

  return (
    <div className="space-y-4">
      {groups.length === 0 && (
        <p className="text-sm text-ink-500 text-center py-4">
          Henüz seçenek grubu yok. "Grup Ekle" ile başlayın.
        </p>
      )}

      {groups.map((g, gi) => (
        <div
          key={`${g._originalKey ?? "new"}-${gi}`}
          className="border border-paper-200 rounded-lg overflow-hidden"
        >
          {/* Grup başlığı */}
          <div className="px-4 py-2.5 bg-paper-100/60 border-b border-paper-200 flex items-center gap-2 flex-wrap">
            <div className="flex-1 min-w-0">
              <input
                value={g.groupLabel}
                onChange={(e) => updateGroupLabel(gi, e.target.value)}
                placeholder="Grup adı (örn. Ebat)"
                className={inputCls}
              />
              {g._originalKey !== null && (
                <span className="text-[10px] text-ink-400 font-mono mt-0.5 block">
                  key: {g.groupKey}
                </span>
              )}
              {g._originalKey === null && g.groupLabel && (
                <span className="text-[10px] text-ink-400 font-mono mt-0.5 block">
                  key: {slugify(g.groupLabel) || `grup-${gi + 1}`}
                </span>
              )}
            </div>

            {/* Rol seçici */}
            <select
              value={g.groupRole}
              onChange={(e) =>
                updateGroupRole(gi, e.target.value as "dimension" | "priced")
              }
              className="px-2 py-1.5 rounded border border-paper-200 bg-paper-50 text-ink-900 text-xs focus:border-ink-900 focus:outline-none"
            >
              <option value="dimension">dimension</option>
              <option value="priced">priced</option>
            </select>

            {/* Sıralama butonları */}
            <div className="flex gap-1">
              <button
                type="button"
                onClick={() => moveGroup(gi, -1)}
                disabled={gi === 0}
                title="Yukarı taşı"
                className="px-2 py-1 rounded text-xs border border-paper-200 hover:bg-paper-200 disabled:opacity-30"
              >
                ↑
              </button>
              <button
                type="button"
                onClick={() => moveGroup(gi, 1)}
                disabled={gi === groups.length - 1}
                title="Aşağı taşı"
                className="px-2 py-1 rounded text-xs border border-paper-200 hover:bg-paper-200 disabled:opacity-30"
              >
                ↓
              </button>
            </div>

            {/* Grup sil */}
            <button
              type="button"
              onClick={() => removeGroup(gi)}
              title="Grubu sil"
              className="px-2 py-1 rounded text-xs border border-error/30 text-error hover:bg-error/10"
            >
              Sil
            </button>
          </div>

          {/* Seçenekler */}
          <div className="p-3 space-y-2">
            {g.options.length === 0 && (
              <p className="text-xs text-ink-400 text-center py-2">
                Bu grupta seçenek yok.
              </p>
            )}
            {g.options.map((o, oi) => (
              <div
                key={`${o._originalKey ?? "new"}-${oi}`}
                className="flex items-start gap-2 flex-wrap"
              >
                <div className="flex-1 min-w-[160px]">
                  <input
                    value={o.optionLabel}
                    onChange={(e) => updateOptionLabel(gi, oi, e.target.value)}
                    placeholder="Seçenek adı (örn. A4)"
                    className={inputCls}
                  />
                  {o._originalKey !== null && (
                    <span className="text-[10px] text-ink-400 font-mono mt-0.5 block">
                      key: {o.optionKey}
                    </span>
                  )}
                  {o._originalKey === null && o.optionLabel && (
                    <span className="text-[10px] text-ink-400 font-mono mt-0.5 block">
                      key: {slugify(o.optionLabel) || `secnek-${oi + 1}`}
                    </span>
                  )}
                </div>
                <div className="flex-1 min-w-[120px]">
                  <input
                    value={o.optionSublabel}
                    onChange={(e) => updateOptionSublabel(gi, oi, e.target.value)}
                    placeholder="Alt etiket (opsiyonel)"
                    className={inputCls}
                  />
                </div>
                <button
                  type="button"
                  onClick={() => removeOption(gi, oi)}
                  title="Seçeneği sil"
                  className="mt-0.5 px-2 py-1.5 rounded text-xs border border-error/30 text-error hover:bg-error/10 flex-none"
                >
                  ×
                </button>
              </div>
            ))}

            <button
              type="button"
              onClick={() => addOption(gi)}
              className="mt-1 text-xs px-3 py-1.5 rounded border border-dashed border-paper-300 text-ink-600 hover:bg-paper-100 w-full"
            >
              + Seçenek Ekle
            </button>
          </div>
        </div>
      ))}

      {/* Alt araç çubuğu */}
      <div className="flex items-center gap-3 pt-1">
        <button
          type="button"
          onClick={addGroup}
          className="text-sm px-4 py-2 rounded border border-dashed border-paper-300 text-ink-700 hover:bg-paper-100"
        >
          + Grup Ekle
        </button>

        <button
          type="button"
          onClick={handleSave}
          disabled={isPending}
          className="ml-auto inline-flex items-center gap-2 bg-ink-900 text-paper-50 px-4 py-2 rounded text-sm font-medium hover:bg-ink-700 disabled:opacity-60"
        >
          {isPending ? "Kaydediliyor…" : "Yapıyı Kaydet"}
        </button>
      </div>
    </div>
  );
}
