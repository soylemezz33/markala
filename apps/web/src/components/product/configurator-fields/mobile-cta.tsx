"use client";

import { useEffect } from "react";
import { cn, Button } from "@markala/ui";
import { ShoppingBagOpen, CheckCircle, ChatCircleText } from "@phosphor-icons/react";
import { useConfigurator } from "./context";
import { formatPriceDisplay } from "@/lib/format";

interface Props {
  total: number;
  onAddToCart: () => void;
  /** true → "Sepete Ekle"; false → "Teklif Al" (ölçü girilmemiş ya da maxM2 aşımı). */
  canBuy?: boolean;
  /** Masaüstü barında solda gösterilir. */
  productName?: string;
  /** Masaüstünde bar yalnızca bu true iken görünür (gerçek CTA ekran dışındayken). Mobilde daima görünür. */
  visible?: boolean;
}

/**
 * Sabit alt bar — fiyat + Sepete Ekle. Mobilde DAİMA görünür; masaüstünde yalnızca
 * kolon-içi gerçek CTA ekran dışındayken (visible) görünür → footer örtülmez, çift buton olmaz.
 */
export function MobileCta({ total, onAddToCart, canBuy = total > 0, productName, visible = true }: Props) {
  const { state } = useConfigurator();
  const { justAdded } = state;

  // Sabit bar fixed bottom → sayfa sonunda (footer) içeriği örtmesin: bar mount olduğu sürece
  // body'ye alt boşluk ver. Bar zaten yalnızca aşağı kaydırınca (footer'a yakın) görünür olduğundan
  // bu boşluk her breakpoint'te doğru clearance sağlar; sayfadan ayrılınca temizlenir.
  useEffect(() => {
    document.body.style.paddingBottom = "5rem";
    return () => {
      document.body.style.paddingBottom = "";
    };
  }, []);

  return (
    <>
      <div
        className={cn(
          "fixed bottom-0 left-0 right-0 z-30 border-t border-paper-200 bg-paper-50/95 shadow-2xl backdrop-blur",
          "flex", // mobil: daima görünür
          visible ? "lg:block" : "lg:hidden", // masaüstü: yalnızca gerekince
        )}
      >
        <div className="mx-auto flex w-full max-w-7xl items-center gap-3 px-4 py-3 sm:px-6 lg:px-8">
          {productName && (
            <div className="hidden min-w-0 flex-1 lg:block">
              <div className="truncate text-sm font-semibold text-ink-900">{productName}</div>
            </div>
          )}
          <div className="min-w-0 flex-1 lg:flex-none">
            <div className="text-[11px] font-semibold uppercase tracking-wider text-ink-500">
              Toplam · KDV dahil
            </div>
            <div className="truncate text-lg font-bold tabular-nums text-ink-900">
              {total > 0 ? formatPriceDisplay(total) : "—"}
            </div>
          </div>
          <Button onClick={onAddToCart} disabled={justAdded} className="flex-none">
            {justAdded ? (
              <>
                <CheckCircle size={16} weight="bold" /> Eklendi
              </>
            ) : canBuy ? (
              <>
                <ShoppingBagOpen size={16} weight="bold" /> Sepete Ekle
              </>
            ) : (
              <>
                <ChatCircleText size={16} weight="bold" /> Teklif Al
              </>
            )}
          </Button>
        </div>
      </div>
    </>
  );
}
