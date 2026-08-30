"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { Star } from "@phosphor-icons/react";
import { Price, cn } from "@markala/ui";
import type { BadgeKind, Product } from "@markala/types";
import { WishlistButton } from "@/components/product/wishlist-button";
import { ProductImageFallback } from "@/components/product/product-image-fallback";
import { getDisplayPrice } from "@/lib/configurator";

const badgeStyles: Record<BadgeKind, { label: string; className: string }> = {
  yeni: { label: "Yeni", className: "bg-ink-900 text-paper-50" },
  firsat: { label: "Fırsat", className: "bg-error text-paper-50" },
  "hizli-sevkiyat": { label: "Hızlı Sevkiyat", className: "bg-success text-paper-50" },
  "cok-satilan": { label: "Çok Satılan", className: "bg-brand-500 text-ink-900" },
  "tukenmek-uzere": { label: "Tükenmek Üzere", className: "bg-warning text-paper-50" },
};

interface ProductCardProps {
  product: Product;
  /** Geriye dönük uyum için kaldı; artık her iki değer de aynı görünür. */
  surface?: "light" | "dark";
  /**
   * LCP adayı kartlar için (kategori sayfası ilk ekran). true → görsel eager +
   * fetchpriority=high yüklenir; yoksa next/image varsayılanı (lazy) kalır.
   * 2026-08-20 hız şartnamesi P1: reklam iniş sayfalarında LCP 8,8sn'ydi çünkü
   * ekran üstü kartlar dahil TÜM görseller lazy'ydi ve JS ile ağ yarışı yapıyordu.
   */
  priority?: boolean;
}

export function ProductCard({ product, priority = false }: ProductCardProps) {
  // Detayın açılıştaki fiyatıyla AYNI (tek kaynak: configurator). startingPrice'a güvenme.
  const startingPrice = getDisplayPrice(product);
  const [imgError, setImgError] = useState(false);

  /**
   * Hover'da 2. görsel (2026-08-31, Hasan: rakip sitelerdeki gibi) — yalnız masaüstünde
   * ve yalnız ürünün gerçekten 2. görseli varsa.
   *
   * PERFORMANS: ikinci görsel ilk hover'a KADAR DOM'a girmez (ikinciYuklendi state).
   * Doğrudan render edilseydi listelerde görsel isteği ikiye katlanır, LCP/veri maliyeti
   * artardı (2026-08-20 hız şartnamesinin tersine iş). Hover'dan sonra DOM'da kalır ki
   * fareyle girip çıkarken tekrar tekrar indirilmesin.
   * MOBİL: sarmalayıcı `hidden lg:block` → dokunmatikte hiç mount edilmez, ekstra veri yok.
   */
  const ikinciGorsel = product.images[1];
  const [ikinciYuklendi, setIkinciYuklendi] = useState(false);
  const [ikinciHata, setIkinciHata] = useState(false);
  const ikinciGoster = Boolean(ikinciGorsel) && !imgError && !ikinciHata;

  return (
    <Link
      href={`/urun/${product.slug}`}
      className={cn(
        // h-full: rail/grid'de komşu kartlarla AYNI yükseklik — içerik kısa da olsa kart
        // satırı doldurur, fiyat satırı (mt-auto) tüm kartlarda aynı hizada durur.
        "group flex flex-col h-full rounded-lg overflow-hidden bg-paper-50 border border-paper-200",
        "transition-all duration-200 ease-out",
        "hover:border-ink-300 hover:shadow-md hover:-translate-y-0.5",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink-900 focus-visible:ring-offset-2",
      )}
      // İkinci görseli ilk temasta DOM'a al (mouse VE klavye ile gezinen için).
      onPointerEnter={ikinciGoster ? () => setIkinciYuklendi(true) : undefined}
      onFocus={ikinciGoster ? () => setIkinciYuklendi(true) : undefined}
    >
      <div className="relative aspect-square overflow-hidden bg-paper-100">
        {product.images[0] && !imgError ? (
          <Image
            src={product.images[0]}
            alt={product.name}
            fill
            sizes="(min-width:1024px) 25vw, (min-width:640px) 33vw, 50vw"
            // priority: yalnız LCP adayı kartlarda (kategori/katalog ilk ekran). next/image
            // priority=true → preload + fetchpriority="high" + eager. Diğer kartlarda
            // varsayılan lazy KORUNUR (ana sayfa railleri etkilenmez — şartname P1).
            priority={priority}
            fetchPriority={priority ? "high" : undefined}
            className={cn(
              "object-cover transition-all duration-500 ease-out group-hover:scale-[1.04]",
              // 2. görsel varsa kapak hover'da soluklaşır (çapraz geçiş).
              ikinciGoster && "lg:group-hover:opacity-0 lg:group-focus-within:opacity-0",
            )}
            onError={() => setImgError(true)}
          />
        ) : (
          <ProductImageFallback name={product.name} />
        )}

        {/* Hover'daki 2. görsel — masaüstü (lg+), ilk temastan sonra mount edilir. */}
        {ikinciGoster && ikinciYuklendi && (
          <Image
            src={ikinciGorsel!}
            alt=""
            aria-hidden="true"
            fill
            sizes="(min-width:1024px) 25vw, (min-width:640px) 33vw, 50vw"
            className={cn(
              "hidden lg:block object-cover opacity-0 transition-all duration-500 ease-out",
              "group-hover:opacity-100 group-hover:scale-[1.04]",
              "group-focus-within:opacity-100 group-focus-within:scale-[1.04]",
            )}
            onError={() => setIkinciHata(true)}
          />
        )}
        {product.badges && product.badges.length > 0 && (
          <div className="absolute top-3 left-3 flex flex-col gap-1.5 items-start">
            {product.badges.map((b) => {
              // Bilinmeyen rozet (admin'in girdiği serbest metin) tüm kartı çökertmesin.
              const style = badgeStyles[b];
              if (!style) return null;
              return (
                <span
                  key={b}
                  className={cn(
                    "px-2 py-0.5 rounded text-[11px] font-medium tracking-wide",
                    style.className,
                  )}
                >
                  {style.label}
                </span>
              );
            })}
          </div>
        )}

        {/* Wishlist butonu — sağ üst köşe. Mobile/tablet'te sürekli görünür, lg+ hover-only. */}
        <div className="absolute top-3 right-3 lg:opacity-0 lg:group-hover:opacity-100 lg:focus-within:opacity-100 transition-opacity">
          <WishlistButton slug={product.slug} variant="icon" />
        </div>
      </div>

      <div className="p-4 flex flex-col flex-1">
        <div className="flex items-start justify-between gap-3">
          <h3 className="font-medium leading-snug line-clamp-2 min-h-[2.5rem] flex-1 text-ink-900">
            {product.name}
          </h3>
          {product.rating && (
            <span className="flex items-center gap-1 text-xs tabular-nums shrink-0 mt-0.5 text-ink-500">
              <Star size={12} weight="fill" className="text-brand-500" />
              {product.rating.average.toFixed(1)}
            </span>
          )}
        </div>

        {/* Tek satıra kilitli — uzun meta ("210 gr A.Bristol · ... · 6 Ebat") kartı
            uzatıp komşularla orantıyı bozmasın; tam bilgi ürün detayında. */}
        {product.sizeLabel && (
          <p className="mt-1 text-xs text-ink-500 line-clamp-1">{product.sizeLabel}</p>
        )}

        {/* Fiyat SAĞDA — e-ticaret okuma alışkanlığı (göz fiyatı sağda arar, 2026-08-06). */}
        <div className="mt-auto pt-3 border-t border-paper-200 flex items-baseline justify-between gap-2">
          <span className="text-xs font-medium opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap text-brand-700">
            Yapılandır →
          </span>
          <div className="flex flex-col items-end text-right">
            {startingPrice > 0 ? (
              <>
                <Price amount={startingPrice} size="md" className="text-ink-900" />
                <span className="text-[11px] mt-0.5 text-ink-500">
                  başlangıç fiyatı · KDV dahil
                </span>
              </>
            ) : (
              <span className="text-base font-medium tabular-nums tracking-tight text-ink-900">
                Teklif Al
              </span>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}
