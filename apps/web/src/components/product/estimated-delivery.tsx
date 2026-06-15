"use client";

import { useEffect, useState } from "react";
import { Truck, Clock } from "@phosphor-icons/react";
import { estimateDelivery, type DeliveryEstimate } from "@/lib/delivery";

/**
 * "En geç X tarihinde kargoda" — dinamik teslim tahmini.
 * Client-side: gerçek "şimdi" ile hesaplanır (cutoff/hafta sonu doğru yansır).
 */
export function EstimatedDelivery({ productionTime }: { productionTime: string }) {
  const [est, setEst] = useState<DeliveryEstimate | null>(null);

  useEffect(() => {
    setEst(estimateDelivery(productionTime));
    // Dakika başı tazele (cutoff sınırını geçerse güncellensin)
    const t = setInterval(() => setEst(estimateDelivery(productionTime)), 60_000);
    return () => clearInterval(t);
  }, [productionTime]);

  if (!est) return null;

  return (
    <div className="rounded-lg border border-success/30 bg-success/5 px-3 py-2.5 text-sm">
      <div className="flex items-center gap-2 text-success font-semibold">
        <Truck size={16} weight="bold" />
        En geç <span className="text-ink-900">{est.label}</span> kargoda
      </div>
      {est.sameDayIntake && (
        <div className="mt-1 flex items-center gap-1.5 text-xs text-ink-600">
          <Clock size={12} />
          Bugün <strong>14:00</strong>&apos;a kadar sipariş verirsen üretime bugün girer.
        </div>
      )}
    </div>
  );
}
