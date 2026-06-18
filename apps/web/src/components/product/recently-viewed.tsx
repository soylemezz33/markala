"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Container } from "@markala/ui";
import { Clock, ArrowRight } from "@phosphor-icons/react";
import { products as mockProducts } from "@markala/mock-data";
import type { Product } from "@markala/types";
import { apiClient } from "@/lib/api";
import { ProductImageFallback } from "@/components/product/product-image-fallback";
import { getDisplayPrice } from "@/lib/configurator";
import { formatPriceDisplay } from "@/lib/format";
import {
  addRecentlyViewed,
  getRecentlyViewed,
} from "@/lib/client-storage";

/**
 * Sayfa yüklendiğinde mevcut ürünü recent listesine ekler.
 * Görsel yok — sadece tracking. Listing component'i ayrı.
 */
export function TrackRecentlyViewed({ slug }: { slug: string }) {
  useEffect(() => {
    addRecentlyViewed(slug);
  }, [slug]);
  return null;
}

/**
 * Son baktığın ürünleri yatay listeler.
 * Mevcut ürünü dışarıda bırakır (currentSlug).
 */
export function RecentlyViewedRail({
  currentSlug,
  title = "Son Baktığın Ürünler",
}: {
  currentSlug?: string;
  title?: string;
}) {
  const [items, setItems] = useState<Product[]>([]);

  useEffect(() => {
    let cancelled = false;

    // Slug'ları CANLI API'den çöz; admin güncellemeleri (görsel/isim/fiyat) anında yansısın.
    // Mock yalnızca API'de bulunamayan slug için fallback.
    async function resolve(slugs: string[]): Promise<Product[]> {
      let live: Product[] = [];
      try {
        live = await apiClient.products.list({ take: 500 });
      } catch {
        live = [];
      }
      const liveBySlug = new Map(live.map((p) => [p.slug, p]));
      return slugs
        .map((s) => liveBySlug.get(s) ?? mockProducts.find((p) => p.slug === s))
        .filter((p): p is Product => p !== undefined)
        .slice(0, 8);
    }

    function load() {
      const slugs = getRecentlyViewed().filter((s) => s !== currentSlug);
      resolve(slugs).then((found) => {
        if (!cancelled) setItems(found);
      });
    }
    load();
    window.addEventListener("markala:recent-changed", load);
    return () => {
      cancelled = true;
      window.removeEventListener("markala:recent-changed", load);
    };
  }, [currentSlug]);

  if (items.length === 0) return null;

  return (
    <section className="bg-paper-100 border-y border-paper-200 py-10 md:py-12">
      <Container>
        <header className="flex items-end justify-between gap-4 mb-5">
          <div className="flex items-center gap-2.5">
            <Clock size={20} className="text-ink-700" />
            <h2 className="text-lg md:text-xl font-semibold text-ink-900">
              {title}
            </h2>
          </div>
          <Link
            href="/urunler"
            className="text-sm text-brand-700 hover:text-brand-900 font-medium inline-flex items-center gap-1"
          >
            Tümünü gör <ArrowRight size={11} weight="bold" />
          </Link>
        </header>

        <div className="flex gap-3 md:gap-4 overflow-x-auto scrollbar-hide -mx-4 px-4 md:mx-0 md:px-0 pb-1">
          {items.map((p) => (
            <Link
              key={p.slug}
              href={`/urun/${p.slug}`}
              className="group shrink-0 w-[160px] md:w-[180px] flex flex-col"
            >
              <div className="relative aspect-square rounded-lg overflow-hidden bg-paper-50 border border-paper-200 group-hover:border-ink-300 transition-colors">
                {p.images[0] ? (
                  <Image
                    src={p.images[0]}
                    alt={p.name}
                    fill
                    unoptimized
                    sizes="(max-width: 640px) 160px, 180px"
                    className="object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                ) : (
                  <ProductImageFallback name={p.name} />
                )}
              </div>
              <h3 className="mt-2 text-sm font-medium text-ink-900 line-clamp-2 group-hover:text-brand-700 transition-colors">
                {p.name}
              </h3>
              <p className="text-xs text-ink-500 tabular-nums mt-0.5">
                {getDisplayPrice(p) > 0
                  ? `${formatPriceDisplay(getDisplayPrice(p))}'den`
                  : "Teklif Al"}
              </p>
            </Link>
          ))}
        </div>
      </Container>
    </section>
  );
}
