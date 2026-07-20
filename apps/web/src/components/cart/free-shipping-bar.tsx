"use client";

import { useEffect, useState } from "react";
import { Truck } from "@phosphor-icons/react";
import { Price } from "@markala/ui";
import { apiClient } from "@/lib/api";

/**
 * Bedava kargo ilerleme çubuğu — /sepet özeti ve sepet çekmecesinde ORTAK (AOV artırıcı CRO).
 * Eşik sabit yazılmaz: `threshold` prop'u verilirse o kullanılır (sepet sayfası /settings/shipping
 * fetch'ini zaten yapıyor, ikinci istek atılmaz); verilmezse bileşen eşiği kendisi
 * /settings/shipping'ten çeker (çekmece kullanımı). API hatasında 1500 fallback korunur.
 */
export function FreeShippingBar({
  subtotal,
  threshold,
  unlocked = false,
  className,
}: {
  subtotal: number;
  /** Ücretsiz kargo eşiği — verilmezse /settings/shipping'ten çekilir. */
  threshold?: number;
  /** Kupon vb. ile kargo zaten ücretsizse eşikten bağımsız kutlama gösterilir. */
  unlocked?: boolean;
  className?: string;
}) {
  const [fetched, setFetched] = useState<number | null>(null);
  useEffect(() => {
    if (threshold != null) return; // eşik dışarıdan geldi → istek atma
    apiClient.settings
      .shipping()
      .then((s) => setFetched(s.freeThreshold))
      .catch(() => {}); // hata → fallback eşikle devam
  }, [threshold]);

  const limit = threshold ?? fetched ?? 1500;
  if (subtotal <= 0 || limit <= 0) return null;

  if (unlocked || subtotal >= limit) {
    // Eşik aşıldı → kutlama; müşteri kazanımı hissetsin.
    return (
      <div
        className={`flex items-center gap-2 p-2.5 bg-success/10 border border-success/30 rounded-md text-xs font-medium text-success ${className ?? ""}`}
      >
        <Truck size={14} className="flex-none" /> 🎉 Kargon ücretsiz — teslimat bizden!
      </div>
    );
  }

  // Eşiğe ne kadar kaldığını görselleştirir.
  return (
    <div className={className}>
      <div className="flex items-center gap-1.5 text-xs text-ink-700 mb-1.5">
        <Truck size={14} className="text-brand-700 flex-none" />
        <span>
          Ücretsiz kargoya{" "}
          <Price
            amount={limit - subtotal}
            size="sm"
            className="font-semibold text-brand-700 align-baseline"
          />{" "}
          kaldı
        </span>
      </div>
      <div
        className="h-2 rounded-full bg-paper-200 overflow-hidden"
        role="progressbar"
        aria-label="Ücretsiz kargo ilerlemesi"
        aria-valuenow={Math.round((subtotal / limit) * 100)}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        <div
          className="h-full rounded-full bg-brand-500 transition-[width] duration-500 ease-out"
          style={{ width: `${Math.min(100, Math.round((subtotal / limit) * 100))}%` }}
        />
      </div>
    </div>
  );
}
