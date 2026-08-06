"use client";

import Link from "next/link";
import { useRef } from "react";
import { CaretLeft, CaretRight, ArrowRight } from "@phosphor-icons/react";
import { Container } from "@markala/ui";
import type { Product } from "@markala/types";
import { ProductCard } from "@/components/product-card";

interface ProductRailProps {
  title: string;
  eyebrow?: string;
  description?: string;
  products: Product[];
  viewAllHref?: string;
  viewAllLabel?: string;
}

/**
 * Yatay kaydırılabilir ürün listesi — anasayfada "Yeni Gelenler",
 * "Çok Satılanlar", "Fırsatlar" gibi ürün stripleri için.
 */
export function ProductRail({
  title,
  eyebrow,
  description,
  products,
  viewAllHref,
  viewAllLabel = "Tümünü gör",
}: ProductRailProps) {
  const scrollerRef = useRef<HTMLDivElement>(null);

  function scroll(dir: 1 | -1) {
    const el = scrollerRef.current;
    if (!el) return;
    // Tam "sayfa" kaydır: görünür alan kadar — kartlar tam sayı sığdığından
    // hiçbir kart yarıda kalmaz (bkz. aşağıdaki calc tabanlı kart genişlikleri).
    el.scrollBy({ left: dir * el.clientWidth, behavior: "smooth" });
  }

  if (products.length === 0) return null;

  return (
    <section className="py-12 md:py-16">
      <Container>
        <div className="flex items-end justify-between gap-6 mb-6 md:mb-8">
          <div>
            {eyebrow && (
              <p className="text-sm text-brand-700 font-semibold uppercase tracking-wider">
                {eyebrow}
              </p>
            )}
            <h2 className="mt-1 text-2xl md:text-3xl font-semibold text-ink-900 leading-tight">
              {title}
            </h2>
            {description && (
              <p className="mt-2 text-ink-700 max-w-xl">{description}</p>
            )}
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => scroll(-1)}
              aria-label="Önceki ürünler"
              className="hidden md:grid place-items-center w-10 h-10 rounded-full border border-paper-200 bg-paper-50 text-ink-700 hover:bg-paper-100 hover:border-ink-300 transition-colors"
            >
              <CaretLeft size={16} weight="bold" />
            </button>
            <button
              onClick={() => scroll(1)}
              aria-label="Sonraki ürünler"
              className="hidden md:grid place-items-center w-10 h-10 rounded-full border border-paper-200 bg-paper-50 text-ink-700 hover:bg-paper-100 hover:border-ink-300 transition-colors"
            >
              <CaretRight size={16} weight="bold" />
            </button>
            {viewAllHref && (
              <Link
                href={viewAllHref}
                className="hidden sm:inline-flex items-center gap-1.5 ml-2 px-3 py-2 text-sm font-medium text-ink-900 hover:text-brand-700 transition-colors"
              >
                {viewAllLabel} <ArrowRight size={12} weight="bold" />
              </Link>
            )}
          </div>
        </div>

        {/* Responsive rail: kart genişliği calc ile görünür alana TAM SAYIDA bölünür
            (2 / 3 / 4 / 5 kart) — son kart asla yarıda kalmaz. calc paydaki toplam gap'i
            düşer: gap-4 = 1rem (mobil), gap-5 = 1.25rem (md+). */}
        <div
          ref={scrollerRef}
          className="flex gap-4 md:gap-5 overflow-x-auto scrollbar-hide snap-x snap-mandatory -mx-4 px-4 scroll-px-4 md:mx-0 md:px-0 md:scroll-px-0 pb-2"
          style={{ scrollbarWidth: "none" }}
        >
          {products.map((p) => (
            <div
              key={p.slug}
              data-rail-item
              className="snap-start shrink-0 w-[calc((100%-1rem)/2)] md:w-[calc((100%-2.5rem)/3)] lg:w-[calc((100%-3.75rem)/4)] 2xl:w-[calc((100%-5rem)/5)]"
            >
              <ProductCard product={p} />
            </div>
          ))}
        </div>

        {viewAllHref && (
          <div className="sm:hidden mt-4 text-center">
            <Link
              href={viewAllHref}
              className="inline-flex items-center gap-1.5 text-sm font-medium text-brand-700"
            >
              {viewAllLabel} <ArrowRight size={12} weight="bold" />
            </Link>
          </div>
        )}
      </Container>
    </section>
  );
}
