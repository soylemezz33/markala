"use client";

import { Button } from "@markala/ui";
import { ShoppingBagOpen, CheckCircle } from "@phosphor-icons/react";
import { useConfigurator } from "./context";

interface Props {
  total: number;
  onAddToCart: () => void;
}

/**
 * Mobil sticky bottom bar — fiyat + sepete ekle.
 * lg breakpoint altında görünür, üzerinde gizli.
 */
export function MobileCta({ total, onAddToCart }: Props) {
  const { state } = useConfigurator();
  const { justAdded } = state;

  return (
    <>
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-30 bg-paper-50 border-t border-paper-200 shadow-2xl px-4 py-3 flex items-center gap-3">
        <div className="flex-1 min-w-0">
          <div className="text-[10px] uppercase tracking-wider text-ink-500 font-semibold">
            Toplam
          </div>
          <div className="text-lg font-bold text-ink-900 tabular-nums truncate">
            {total.toLocaleString("tr-TR")} ₺
          </div>
        </div>
        <Button onClick={onAddToCart} disabled={justAdded} className="flex-none">
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
    </>
  );
}
