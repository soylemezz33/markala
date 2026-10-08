"use client";

import { useMemo, useState } from "react";
import { CaretUp, CaretDown, CaretUpDown, MagnifyingGlass, X } from "@phosphor-icons/react";
import {
  siralaSatirlar,
  sonrakiSira,
  ilkYon,
  type SortAccessors,
  type SortDir,
} from "@/lib/tablo-siralama";

export { aramaEslesir, katla } from "@/lib/tablo-siralama";
export type { SortAccessors, SortDir } from "@/lib/tablo-siralama";

/**
 * PANEL TABLOLARI İÇİN ORTAK SIRALAMA + FİLTRE KABUĞU (2026-10-08).
 *
 * Hasan: "tablo sıralanabilir olsun, diğer tablolar için de kontrol et; filtre ve
 * sıralama eksik olmasın, modern ve kullanışlı olsun."
 *
 * Neden ortak bileşen: her tablo kendi sıralamasını yazdıkça davranış ayrışıyordu —
 * bir ekranda başlığa tıklanıyor, ötekinde açılır menü vardı, bir kısmında hiç yoktu.
 * Buradaki `useTableSort` + `SortTh` ikilisi tek davranış sunar: başlığa tıkla →
 * sırala, tekrar tıkla → ters çevir; klavyeyle erişilebilir (başlık bir <button>),
 * ekran okuyucuya `aria-sort` ile bildirilir.
 *
 * SIRA YALNIZ GÖRÜNÜMÜ DEĞİŞTİRİR. Kategoriler, banner, SSS gibi "sıra" alanı olan
 * ekranlarda sitedeki gerçek sıra `sortOrder` alanıyla yönetilir; buradaki tıklama
 * o veriyi KAYDETMEZ. İlgili ekranlarda bu not kullanıcıya da yazıldı.
 */

export function useTableSort<T, K extends string>(
  rows: T[],
  accessors: SortAccessors<T, K>,
  // NoInfer: kolon anahtarı kümesi YALNIZ `accessors`tan çıkarılsın. Aksi halde TS, K'yı
  // `initial.key` sabitine daraltıyor ("order") ve diğer başlıklar tip hatası veriyordu.
  initial: { key: NoInfer<K>; dir?: SortDir },
): {
  rows: T[];
  sort: { key: K; dir: SortDir };
  toggle: (key: K) => void;
  /** <SortTh> için hazır prop demeti — her başlıkta sort/onSort tekrar yazılmasın. */
  thProps: { sort: { key: K; dir: SortDir }; onSort: (key: K) => void };
} {
  const [sort, setSort] = useState<{ key: K; dir: SortDir }>({
    key: initial.key,
    dir: initial.dir ?? ilkYon(accessors[initial.key]?.(rows[0] as T)),
  });
  const sorted = useMemo(() => siralaSatirlar(rows, accessors, sort.key, sort.dir), [
    rows,
    accessors,
    sort.key,
    sort.dir,
  ]);
  const toggle = (key: K) => setSort((m) => sonrakiSira(m, key, rows, accessors));
  return { rows: sorted, sort, toggle, thProps: { sort, onSort: toggle } };
}

/**
 * Tıklanabilir tablo başlığı. `className` ile her tablonun kendi hücre stili korunur
 * (panelde iki ayrı başlık stili var: `px-4 py-3 font-semibold` ve `px-3 py-2`).
 */
export function SortTh<K extends string>({
  sortKey,
  sort,
  onSort,
  children,
  className = "",
  align = "left",
  title,
}: {
  sortKey: K;
  sort: { key: K; dir: SortDir };
  onSort: (key: K) => void;
  children: React.ReactNode;
  className?: string;
  align?: "left" | "right" | "center";
  title?: string;
}) {
  const aktif = sort.key === sortKey;
  const hiza = align === "right" ? "justify-end" : align === "center" ? "justify-center" : "";
  return (
    <th
      className={className}
      aria-sort={aktif ? (sort.dir === "asc" ? "ascending" : "descending") : "none"}
    >
      <button
        type="button"
        onClick={() => onSort(sortKey)}
        title={title ?? `${typeof children === "string" ? children : "Kolon"} sırala`}
        className={`group inline-flex w-full items-center gap-1 ${hiza} rounded focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-500 ${
          aktif ? "text-ink-900" : "hover:text-ink-900"
        }`}
      >
        <span className="whitespace-nowrap">{children}</span>
        {aktif ? (
          sort.dir === "asc" ? (
            <CaretUp size={12} weight="bold" className="flex-none" />
          ) : (
            <CaretDown size={12} weight="bold" className="flex-none" />
          )
        ) : (
          <CaretUpDown
            size={12}
            weight="bold"
            className="flex-none opacity-0 transition-opacity group-hover:opacity-50"
          />
        )}
      </button>
    </th>
  );
}

/**
 * Tablo üstü şerit: arama + filtreler + sonuç sayısı + "temizle".
 * Filtreler `children` olarak geçer (her ekranın filtresi farklı); sayım ve temizleme
 * davranışı ortak kalır ki kullanıcı her tabloda aynı yeri arasın.
 */
export function TableToolbar({
  search,
  count,
  onClear,
  children,
  right,
}: {
  search?: {
    value: string;
    onChange: (v: string) => void;
    placeholder?: string;
    /** Form değerleri republish/yenileme arası korunsun diye sabit id. */
    id: string;
    className?: string;
  };
  /** `gosterilen` filtre sonrası, `toplam` filtresiz kayıt sayısı. */
  count?: { gosterilen: number; toplam: number; birim?: string };
  /** Verilirse ve filtre aktifse "Filtreleri temizle" düğmesi çıkar. */
  onClear?: (() => void) | null;
  children?: React.ReactNode;
  right?: React.ReactNode;
}) {
  const birim = count?.birim ?? "kayıt";
  const filtreli = count ? count.gosterilen !== count.toplam : false;
  return (
    <div className="flex flex-wrap items-center gap-2 px-4 py-3 border-b border-paper-200">
      {search && (
        <label className="relative block">
          <span className="sr-only">Ara</span>
          <MagnifyingGlass
            size={14}
            className="absolute left-2.5 top-1/2 -translate-y-1/2 text-ink-400 pointer-events-none"
          />
          <input
            id={search.id}
            type="search"
            value={search.value}
            onChange={(e) => search.onChange(e.target.value)}
            placeholder={search.placeholder ?? "Ara…"}
            className={`w-56 max-w-full rounded-md border border-paper-200 bg-paper-50 py-1.5 pl-8 pr-3 text-sm text-ink-900 placeholder:text-ink-400 focus:border-ink-400 focus:outline-none ${
              search.className ?? ""
            }`}
          />
        </label>
      )}
      {children}
      {onClear && filtreli && (
        <button
          type="button"
          onClick={onClear}
          className="inline-flex items-center gap-1 rounded-md border border-paper-200 px-2.5 py-1.5 text-xs font-medium text-ink-700 hover:bg-paper-100"
        >
          <X size={12} weight="bold" /> Filtreleri temizle
        </button>
      )}
      <div className="ml-auto flex items-center gap-3">
        {count && (
          <span className="text-xs tabular-nums text-ink-500">
            {filtreli ? `${count.gosterilen} / ${count.toplam} ${birim}` : `${count.toplam} ${birim}`}
          </span>
        )}
        {right}
      </div>
    </div>
  );
}

/** Şeritteki açılır filtre — tüm tablolarda aynı görünsün diye tek yerde. */
export function FilterSelect({
  id,
  label,
  value,
  onChange,
  options,
  className = "",
}: {
  id: string;
  /** Ekranda görünmez; ekran okuyucu için zorunlu. */
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: Array<{ value: string; label: string }>;
  className?: string;
}) {
  const aktif = value !== (options[0]?.value ?? "");
  return (
    <label className="block">
      <span className="sr-only">{label}</span>
      <select
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={`rounded-md border px-2.5 py-1.5 text-sm focus:outline-none focus:border-ink-400 ${
          aktif
            ? "border-brand-500/50 bg-brand-500/5 text-ink-900 font-medium"
            : "border-paper-200 bg-paper-50 text-ink-700"
        } ${className}`}
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </label>
  );
}

/** Az sayıda seçenek için segment düğmeleri (durum filtreleri gibi). */
export function FilterChips<V extends string>({
  value,
  onChange,
  options,
  label,
}: {
  value: V;
  onChange: (v: V) => void;
  options: Array<{ value: V; label: string; count?: number }>;
  label: string;
}) {
  return (
    <div role="group" aria-label={label} className="inline-flex flex-wrap items-center gap-1">
      {options.map((o) => {
        const aktif = o.value === value;
        return (
          <button
            key={o.value}
            type="button"
            onClick={() => onChange(o.value)}
            aria-pressed={aktif}
            className={`rounded-full border px-2.5 py-1 text-xs font-medium transition-colors ${
              aktif
                ? "border-ink-900 bg-ink-900 text-paper-50"
                : "border-paper-200 bg-paper-50 text-ink-700 hover:border-ink-300"
            }`}
          >
            {o.label}
            {o.count !== undefined && (
              <span className={`ml-1 tabular-nums ${aktif ? "opacity-70" : "text-ink-400"}`}>
                {o.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

/** Boş durum satırı: filtre yüzünden mi boş, gerçekten veri yok mu — ayırır. */
export function TableEmpty({
  colSpan,
  filtreli,
  onClear,
  bosMesaj,
}: {
  colSpan: number;
  filtreli: boolean;
  onClear?: () => void;
  bosMesaj: string;
}) {
  return (
    <tr>
      <td colSpan={colSpan} className="px-4 py-10 text-center text-sm text-ink-500">
        {filtreli ? (
          <>
            Aramayla eşleşen kayıt yok.
            {onClear && (
              <button
                type="button"
                onClick={onClear}
                className="ml-2 font-medium text-brand-700 hover:underline"
              >
                Filtreleri temizle
              </button>
            )}
          </>
        ) : (
          bosMesaj
        )}
      </td>
    </tr>
  );
}
