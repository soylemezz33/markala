"use client";

import { TR_PROVINCES, ilcelerOf } from "@/lib/tr-locations";

/**
 * İl/İlçe seçici — kullanıcılar elle yazmaz, 81 il + 972 ilçe listesinden seçer.
 * İl değişince ilçe otomatik sıfırlanır ve o ilin ilçeleriyle dolar.
 */
interface IlIlceSelectProps {
  il: string;
  ilce: string;
  onIlChange: (v: string) => void;
  onIlceChange: (v: string) => void;
  required?: boolean;
  className?: string;
  selectClassName?: string;
  ilLabel?: string;
  ilceLabel?: string;
}

export function IlIlceSelect({
  il,
  ilce,
  onIlChange,
  onIlceChange,
  required,
  className,
  selectClassName,
  ilLabel = "İl",
  ilceLabel = "İlçe",
}: IlIlceSelectProps) {
  const ilceler = il ? ilcelerOf(il) : [];
  const sel =
    selectClassName ??
    "mt-1.5 w-full px-3 py-2.5 rounded border border-paper-200 bg-paper-50 text-sm text-ink-900 focus:border-ink-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-300/30";

  return (
    <div className={className ?? "grid sm:grid-cols-2 gap-3"}>
      <label className="block">
        <span className="text-sm font-medium text-ink-900">
          {ilLabel}
          {required && " *"}
        </span>
        <select
          value={il}
          onChange={(e) => {
            onIlChange(e.target.value);
            onIlceChange(""); // il değişti → ilçeyi sıfırla
          }}
          className={sel}
        >
          <option value="">İl seçin</option>
          {TR_PROVINCES.map((p) => (
            <option key={p.il} value={p.il}>
              {p.il}
            </option>
          ))}
        </select>
      </label>
      <label className="block">
        <span className="text-sm font-medium text-ink-900">
          {ilceLabel}
          {required && " *"}
        </span>
        <select
          value={ilce}
          onChange={(e) => onIlceChange(e.target.value)}
          disabled={!il}
          aria-disabled={!il}
          className={`${sel} disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-paper-100 disabled:text-ink-400 disabled:border-paper-300`}
        >
          <option value="">{il ? "İlçe seçin" : "Önce il seçin"}</option>
          {ilceler.map((d) => (
            <option key={d} value={d}>
              {d}
            </option>
          ))}
        </select>
      </label>
    </div>
  );
}
