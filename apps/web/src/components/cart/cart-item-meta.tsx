"use client";

import Link from "next/link";
import { PencilSimple, Clock, ClockCountdown } from "@phosphor-icons/react";
import type { CartItem } from "@markala/types";
import { itemUnitCount } from "@/lib/cart-store";
import { URETIM_SURESI } from "@/lib/delivery";

/**
 * Sepet satırı meta bloğu (2026-09-17, dış rapor 6. bölüm) — /sepet ve çekmece ortak.
 *
 *  - m² ürünlerde "2 baskı × 60×150 cm = 1,8 m²" (eskiden area satırında adet 1 sayıldığı için
 *    paket satırı hiç çıkmıyordu; ölçü yalnız özet metnindeydi)
 *  - paket ürünlerde "1.000 adetlik paket × 2 = 2.000 adet"
 *  - tasarım durumu: destek istendi / dosya sonra gönderilecek (materyal sayacı CartDesignSlots'ta)
 *  - ürün bazlı üretim süresi (satır snapshot'ı; eski satırda yoksa site geneli)
 *  - "Düzenle": ürün sayfasını ?duzenle=<id> ile açar, satır yerinde güncellenir
 */
export function areaOlcu(item: Pick<CartItem, "configuration" | "quantity">): { en: number; boy: number; alan: number; toplam: number } | null {
  if (item.configuration.pricingMode !== "area") return null;
  const en = Number(item.configuration.selections?.en) || 0;
  const boy = Number(item.configuration.selections?.boy) || 0;
  if (en <= 0 || boy <= 0) return null;
  const alan = (en * boy) / 10000;
  return { en, boy, alan, toplam: alan * item.quantity };
}

const m2 = (n: number) => n.toLocaleString("tr-TR", { maximumFractionDigits: 2 });

export function CartItemMeta({ item, compact = false, onNavigate }: { item: CartItem; compact?: boolean; onNavigate?: () => void }) {
  const cfg = item.configuration;
  const olcu = areaOlcu(item);
  const birim = itemUnitCount(item);
  const txt = compact ? "text-[11px]" : "text-xs";

  return (
    <div className={`${compact ? "mt-1 space-y-0.5" : "mt-1.5 space-y-1"} ${txt} text-ink-500`}>
      {olcu && (
        <p>
          {item.quantity} baskı × {olcu.en}×{olcu.boy} cm{" "}
          <span className="font-medium text-ink-700">= {m2(olcu.toplam)} m²</span>
        </p>
      )}
      {/* Tiraj netleştirme — tiraj quantity'ye TAŞINAMAZ (mimari kısıt); stepper'daki büyük
          sayının "paket × set" olduğunu açıkla. */}
      {!olcu && birim > 1 && (
        <p>
          {birim.toLocaleString("tr-TR")} adetlik paket × {item.quantity}
          {item.quantity > 1 && (
            <>
              {" "}= <span className="font-medium text-ink-700">{(item.quantity * birim).toLocaleString("tr-TR")} adet</span>
            </>
          )}
        </p>
      )}
      {cfg.needsDesign && (
        <p className="text-brand-700">
          ✦ Tasarım desteği isteniyor
          <span className="text-ink-500"> · üretim tasarım onayından sonra başlar</span>
        </p>
      )}
      {!cfg.needsDesign && cfg.designLater && (
        <p className="text-warning font-medium inline-flex items-center gap-1">
          <ClockCountdown size={12} weight="fill" /> Dosya sonra gönderilecek · üretim dosya gelince başlar
        </p>
      )}
      <p className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
        <span className="inline-flex items-center gap-1">
          <Clock size={12} /> Üretim {cfg.productionTime || URETIM_SURESI}
        </span>
        <span aria-hidden>·</span>
        <Link
          href={`/urun/${item.productSlug}?duzenle=${encodeURIComponent(item.id)}`}
          onClick={onNavigate}
          className="inline-flex items-center gap-1 font-medium text-brand-700 underline hover:text-brand-900"
        >
          <PencilSimple size={12} /> Düzenle
        </Link>
      </p>
    </div>
  );
}
