"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Container } from "@markala/ui";
import { Heart, ArrowRight, ShoppingBag } from "@phosphor-icons/react";
import type { Product } from "@markala/types";
import { ProductCard } from "@/components/product-card";
import { apiClient } from "@/lib/api";
import { getWishlist } from "@/lib/client-storage";

export default function WishlistPage() {
  const [items, setItems] = useState<Product[]>([]);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    let cancelled = false;

    // Favori slug'ları CANLI API'den çöz; API-only/admin ürünleri de görünsün,
    // admin güncellemeleri anında yansısın. Mock yalnız fallback.
    async function resolve(slugs: string[]): Promise<Product[]> {
      let live: Product[] = [];
      try {
        live = await apiClient.products.list({ take: 500 });
      } catch {
        live = [];
      }
      const liveBySlug = new Map(live.map((p) => [p.slug, p]));
      return slugs
        .map((s) => liveBySlug.get(s))
        .filter((p): p is Product => p !== undefined);
    }

    function load() {
      const slugs = getWishlist();
      resolve(slugs).then((resolved) => {
        if (!cancelled) setItems(resolved);
      });
    }
    load();
    window.addEventListener("markala:wishlist-changed", load);
    return () => {
      cancelled = true;
      window.removeEventListener("markala:wishlist-changed", load);
    };
  }, []);

  return (
    <>
      <div className="bg-paper-100 border-b border-paper-200">
        <Container className="py-10 md:py-14">
          <div className="flex items-center gap-3 mb-2">
            <Heart size={28} weight="fill" className="text-error" />
            <h1 className="text-3xl md:text-4xl font-semibold text-ink-900">
              Favorilerim
            </h1>
          </div>
          <p className="text-ink-700 max-w-xl">
            Beğendiğin ürünleri buraya ekle, sonra kaldığın yerden devam et.
            Cihazına kayıtlı, hesap açmadan çalışır.
          </p>
        </Container>
      </div>

      <Container className="py-12 md:py-16">
        {!mounted ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="space-y-3 animate-pulse">
                <div className="aspect-square bg-paper-200 rounded-lg" />
                <div className="h-4 bg-paper-200 rounded w-3/4" />
                <div className="h-3 bg-paper-200 rounded w-1/2" />
              </div>
            ))}
          </div>
        ) : items.length === 0 ? (
          <div className="py-20 text-center bg-paper-100 rounded-xl border border-paper-200 max-w-xl mx-auto">
            <Heart size={40} className="mx-auto text-paper-200" weight="fill" />
            <h2 className="mt-4 text-xl font-semibold text-ink-900">
              Henüz favori ürünün yok
            </h2>
            <p className="mt-2 text-ink-500 max-w-sm mx-auto">
              Ürün sayfalarındaki kalp ikonuna tıklayarak listeyi
              oluşturmaya başla.
            </p>
            <Link
              href="/urunler"
              className="mt-6 inline-flex items-center gap-2 px-5 py-2.5 bg-brand-500 hover:bg-brand-600 text-ink-900 rounded-md text-sm font-semibold"
            >
              <ShoppingBag size={14} /> Ürünlere göz at
              <ArrowRight size={14} weight="bold" />
            </Link>
          </div>
        ) : (
          <>
            <div className="text-sm text-ink-500 mb-6">
              <span className="font-semibold text-ink-900">{items.length}</span>{" "}
              favori ürün
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-5">
              {items.map((p) => (
                <ProductCard key={p.slug} product={p} />
              ))}
            </div>
          </>
        )}
      </Container>
    </>
  );
}
