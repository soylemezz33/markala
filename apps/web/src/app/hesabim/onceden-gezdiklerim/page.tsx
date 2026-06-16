"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Clock, ArrowRight } from "@phosphor-icons/react";
import { Button } from "@markala/ui";
import { products } from "@markala/mock-data";
import { getRecentlyViewed } from "@/lib/client-storage";
import { ProductCard } from "@/components/product-card";
import type { Product } from "@markala/types";

export default function RecentlyViewedPage() {
  const [items, setItems] = useState<Product[] | null>(null);

  useEffect(() => {
    function load() {
      const slugs = getRecentlyViewed();
      setItems(
        slugs
          .map((s) => products.find((p) => p.slug === s))
          .filter((p): p is Product => p !== undefined),
      );
    }
    load();
    window.addEventListener("markala:recent-changed", load);
    return () => window.removeEventListener("markala:recent-changed", load);
  }, []);

  return (
    <div className="space-y-6">
      <header>
        <h2 className="text-xl md:text-2xl font-semibold text-ink-900 flex items-center gap-2">
          <Clock size={24} weight="bold" className="text-brand-700" />
          Önceden Gezdiklerim
        </h2>
        <p className="mt-1 text-sm text-ink-500">Son incelediğiniz ürünler — kaldığınız yerden devam edin.</p>
      </header>

      {items === null ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[0, 1, 2].map((i) => <div key={i} className="h-64 bg-paper-100 border border-paper-200 rounded-xl animate-pulse" />)}
        </div>
      ) : items.length === 0 ? (
        <div className="text-center py-16 bg-paper-50 border border-paper-200 rounded-xl">
          <div className="w-16 h-16 mx-auto rounded-full bg-paper-100 grid place-items-center text-ink-500">
            <Clock size={28} />
          </div>
          <h3 className="mt-5 font-semibold text-ink-900 text-lg">Henüz ürün gezmediniz</h3>
          <p className="mt-2 text-sm text-ink-500">Ürünlere göz attıkça burada görünecek.</p>
          <Link href="/urunler"><Button className="mt-5">Ürünleri Keşfet <ArrowRight size={16} weight="bold" /></Button></Link>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {items.map((p) => <ProductCard key={p.slug} product={p} />)}
        </div>
      )}
    </div>
  );
}
