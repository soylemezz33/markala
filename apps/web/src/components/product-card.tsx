import Image from "next/image";
import Link from "next/link";
import { Star } from "@phosphor-icons/react/dist/ssr";
import { Price, cn } from "@markala/ui";
import type { BadgeKind, Product } from "@markala/types";
import { WishlistButton } from "@/components/product/wishlist-button";

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
}

export function ProductCard({ product }: ProductCardProps) {
  const startingPrice = product.startingPrice ?? product.basePrice;

  return (
    <Link
      href={`/urun/${product.slug}`}
      className={cn(
        "group flex flex-col rounded-lg overflow-hidden bg-paper-50 border border-paper-200",
        "transition-all duration-200 ease-out",
        "hover:border-ink-300 hover:shadow-md hover:-translate-y-0.5",
      )}
    >
      <div className="relative aspect-square overflow-hidden bg-paper-100">
        <Image
          src={product.images[0] ?? ""}
          alt={product.name}
          fill
          unoptimized
          sizes="(min-width:1024px) 25vw, (min-width:640px) 33vw, 50vw"
          className="object-cover transition-transform duration-500 ease-out group-hover:scale-[1.04]"
        />
        {product.badges && product.badges.length > 0 && (
          <div className="absolute top-3 left-3 flex flex-col gap-1.5 items-start">
            {product.badges.map((b) => {
              const style = badgeStyles[b];
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

        {/* Wishlist butonu — sağ üst köşe */}
        <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity">
          <WishlistButton slug={product.slug} variant="icon" />
        </div>
      </div>

      <div className="p-4 flex flex-col flex-1">
        <div className="flex items-start justify-between gap-3">
          <h3 className="font-medium leading-snug line-clamp-2 flex-1 text-ink-900">
            {product.name}
          </h3>
          {product.rating && (
            <span className="flex items-center gap-1 text-xs tabular-nums shrink-0 mt-0.5 text-ink-500">
              <Star size={12} weight="fill" className="text-brand-500" />
              {product.rating.average.toFixed(1)}
            </span>
          )}
        </div>

        {product.sizeLabel && (
          <p className="mt-1 text-xs text-ink-500">{product.sizeLabel}</p>
        )}

        <div className="mt-3 pt-3 border-t border-paper-200 flex items-baseline justify-between gap-2">
          <div className="flex flex-col">
            <Price amount={startingPrice} size="md" className="text-ink-900" />
            <span className="text-[11px] mt-0.5 text-ink-500">
              'den başlayan · KDV dahil
            </span>
          </div>
          <span className="text-xs font-medium opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap text-brand-700">
            Yapılandır →
          </span>
        </div>
      </div>
    </Link>
  );
}
