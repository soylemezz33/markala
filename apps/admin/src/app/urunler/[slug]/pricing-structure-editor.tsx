"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { OptionInput, OptionRules } from "@markala/api-client";
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
  rules?: OptionRules;
}

interface GroupRow {
  /** Orijinal key (mevcut kayıttan geldiyse korunur). */
  _originalKey: string | null;
  groupKey: string;
  groupLabel: string;
  groupRole: "dimension" | "priced";
  groupSort: number;
  locked: boolean;
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
        locked: !!o.locked,
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
        rules: o.rules ?? undefined,
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
      const rules = o.rules && (
        (o.rules.disablesGroups && o.rules.disablesGroups.length > 0) ||
        o.rules.forcesOption
      ) ? o.rules : undefined;
      result.push({
        groupKey: g.groupKey,
        groupLabel: g.groupLabel,
        groupRole: g.groupRole,
        groupSort: gi,
        optionKey: o.optionKey,
        optionLabel: o.optionLabel,
        optionSublabel: o.optionSublabel || undefined,
        optionSort: oi,
        locked: g.locked || undefined,
        rules: rules ?? undefined,
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

// ===== Kural editörü bileşeni =====

interface RulesEditorProps {
  rules: OptionRules | undefined;
  ownGroupKey: string;
  groups: GroupRow[];
  onChange: (rules: OptionRules | undefined) => void;
}

function RulesEditor({ rules, ownGroupKey, groups, onChange }: RulesEditorProps) {
  const otherGroups = groups.filter((g) => g.groupKey !== ownGroupKey);
  const disablesGroups = rules?.disablesGroups ?? [];
  const forcesOption = rules?.forcesOption;

  function toggleDisables(groupKey: string) {
    const current = disablesGroups;
    const next = current.includes(groupKey)
      ? current.filter((k) => k !== groupKey)
      : [...current, groupKey];
    const newRules: OptionRules = {
      ...rules,
      disablesGroups: next.length > 0 ? next : undefined,
    };
    onChange(
      !newRules.disablesGroups && !newRules.forcesOption ? undefined : newRules,
    );
  }

  function updateForcesGroup(groupKey: string) {
    if (!groupKey) {
      const newRules: OptionRules = { ...rules, forcesOption: undefined };
      onChange(!newRules.disablesGroups?.length ? undefined : newRules);
      return;
    }
    const targetGroup = groups.find((g) => g.groupKey === groupKey);
    const firstOption = targetGroup?.options[0];
    onChange({
      ...rules,
      forcesOption: {
        groupKey,
        optionKey: forcesOption?.groupKey === groupKey ? (forcesOption.optionKey) : (firstOption?.optionKey ?? ""),
      },
    });
  }

  function updateForcesOptionKey(optionKey: string) {
    if (!forcesOption) return;
    onChange({ ...rules, forcesOption: { ...forcesOption, optionKey } });
  }

  const forcesTargetGroup = forcesOption
    ? groups.find((g) => g.groupKey === forcesOption.groupKey)
    : undefined;

  const labelCls = "text-[11px] font-medium text-ink-500 mb-1 block";
  const selectCls =
    "px-2 py-1 rounded border border-paper-200 bg-paper-50 text-ink-900 text-xs focus:border-ink-900 focus:outline-none";

  return (
    <div className="mt-2 p-2 rounded bg-paper-50 border border-paper-200 space-y-2 text-xs">
      <div>
        <span className={labelCls}>Bu seçilince pasifleştir (gruplar):</span>
        {otherGroups.length === 0 ? (
          <span className="text-ink-400 text-[11px]">Başka grup yok.</span>
        ) : (
          <div className="flex flex-wrap gap-x-3 gap-y-1">
            {otherGroups.map((og) => (
              <label key={og.groupKey} className="flex items-center gap-1 cursor-pointer">
                <input
                  type="checkbox"
                  checked={disablesGroups.includes(og.groupKey)}
                  onChange={() => toggleDisables(og.groupKey)}
                  className="rounded"
                />
                <span className="text-ink-700">
                  {og.groupLabel || og.groupKey}
                </span>
              </label>
            ))}
          </div>
        )}
      </div>

      <div>
        <span className={labelCls}>Zorla seç (opsiyonel):</span>
        <div className="flex items-center gap-2 flex-wrap">
          <select
            value={forcesOption?.groupKey ?? ""}
            onChange={(e) => updateForcesGroup(e.target.value)}
            className={selectCls}
          >
            <option value="">— Grup seç —</option>
            {otherGroups.map((og) => (
              <option key={og.groupKey} value={og.groupKey}>
                {og.groupLabel || og.groupKey}
              </option>
            ))}
          </select>
          {forcesTargetGroup && (
            <select
              value={forcesOption?.optionKey ?? ""}
              onChange={(e) => updateForcesOptionKey(e.target.value)}
              className={selectCls}
            >
              <option value="">— Seçenek —</option>
              {forcesTargetGroup.options.map((fo) => (
                <option key={fo.optionKey} value={fo.optionKey}>
                  {fo.optionLabel || fo.optionKey}
                </option>
              ))}
            </select>
          )}
          {forcesOption && (
            <button
              type="button"
              onClick={() => updateForcesGroup("")}
              className="text-[11px] text-error hover:underline"
            >
              Temizle
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ===== Ana bileşen =====

export function PricingStructureEditor({ productId, initialOptions }: Props) {
  const router = useRouter();
  const [groups, setGroups] = useState<GroupRow[]>(() => buildGroups(initialOptions));
  const [isPending, startTransition] = useTransition();
  const [expandedRules, setExpandedRules] = useState<Set<string>>(new Set());

  function toggleRulesPanel(key: string) {
    setExpandedRules((prev) => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  }

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
        locked: false,
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

  function toggleGroupLocked(gi: number) {
    setGroups((prev) =>
      mapGroups(prev, gi, (g): GroupRow => ({ ...g, locked: !g.locked })),
    );
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

  function updateOptionRules(gi: number, oi: number, rules: OptionRules | undefined) {
    setGroups((prev) =>
      mapGroups(prev, gi, (g) =>
        mapOptions(g, oi, (o): OptionRow => ({ ...o, rules })),
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

            {/* Kilit toggle */}
            <label className="flex items-center gap-1.5 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={g.locked}
                onChange={() => toggleGroupLocked(gi)}
                className="rounded"
              />
              <span className="text-xs text-ink-700">Kilitle 🔒</span>
            </label>

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
            {g.options.map((o, oi) => {
              const rulesPanelKey = `${gi}-${oi}`;
              const rulesOpen = expandedRules.has(rulesPanelKey);
              const hasRules =
                (o.rules?.disablesGroups && o.rules.disablesGroups.length > 0) ||
                !!o.rules?.forcesOption;
              return (
                <div
                  key={`${o._originalKey ?? "new"}-${oi}`}
                  className="border border-paper-100 rounded p-2"
                >
                  <div className="flex items-start gap-2 flex-wrap">
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
                    {/* Kural toggle */}
                    <button
                      type="button"
                      onClick={() => toggleRulesPanel(rulesPanelKey)}
                      title="Koşullu kurallar"
                      className={`mt-0.5 px-2 py-1.5 rounded text-xs border flex-none ${
                        hasRules
                          ? "border-brand-400 text-brand-700 bg-brand-50 hover:bg-brand-100"
                          : "border-paper-200 text-ink-500 hover:bg-paper-100"
                      }`}
                    >
                      {rulesOpen ? "▲ Kural" : "▼ Kural"}{hasRules ? " ●" : ""}
                    </button>
                    <button
                      type="button"
                      onClick={() => removeOption(gi, oi)}
                      title="Seçeneği sil"
                      className="mt-0.5 px-2 py-1.5 rounded text-xs border border-error/30 text-error hover:bg-error/10 flex-none"
                    >
                      ×
                    </button>
                  </div>

                  {/* Kural editörü (açılır/kapanır) */}
                  {rulesOpen && (
                    <RulesEditor
                      rules={o.rules}
                      ownGroupKey={g.groupKey}
                      groups={groups}
                      onChange={(newRules) => updateOptionRules(gi, oi, newRules)}
                    />
                  )}
                </div>
              );
            })}

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
