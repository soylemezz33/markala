"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import type { Product } from "@markala/types";
import { useCartStore } from "@/lib/cart-store";
import { apiClient } from "@/lib/api";
import { ProductImageFallback } from "@/components/product/product-image-fallback";
import { getDisplayPrice } from "@/lib/configurator";
import { formatPriceDisplay } from "@/lib/format";

/**
 * Sepet cross-sell — "Bunlar da yanında iyi gider".
 * Sepetteki EN PAHALI kalemin kategorisine göre statik eşleme haritasından 2 tamamlayıcı
 * ürün önerir. Ürünler canlı public API'den (/api/products?category=X&take=6) çekilir;
 * sepette zaten olan ürünler asla önerilmez. Eşleşme/veri yoksa bölüm hiç görünmez.
 */

/** Kategori → tamamlayıcı kategoriler (slug'lar canlı /api/categories'ten doğrulandı, 2026-07-20). */
const CROSS_SELL_MAP: Record<string, string[]> = {
  kartvizit: ["brosur", "antetli-kagit"],
  brosur: ["kartvizit", "etiket"],
  "antetli-kagit": ["zarf", "kartvizit"],
  zarf: ["antetli-kagit", "kartvizit"],
  makbuz: ["antetli-kagit", "zarf"],
  "cepli-dosya": ["antetli-kagit", "kartvizit"],
  bloknot: ["kartvizit", "antetli-kagit"],
  "vinil-branda-afis": ["rollup", "afis"],
  rollup: ["vinil-branda-afis", "afis"],
  afis: ["vinil-branda-afis", "rollup"],
  "dekota-baski": ["folyo", "afis"],
  folyo: ["dekota-baski", "arac-magneti"],
  "arac-magneti": ["magnet", "folyo"],
  "oto-paspas": ["arac-magneti", "magnet"],
  magnet: ["etiket", "arac-magneti"],
  etiket: ["magnet", "brosur"],
  "amerikan-servis": ["brosur", "kartvizit"],
  "kapi-aski-brosur": ["brosur", "etiket"],
  "canta-kese": ["etiket", "brosur"],
  "yelken-bayrak": ["kirlangic-bayrak", "makam-bayragi"],
  "kirlangic-bayrak": ["yelken-bayrak", "masa-bayragi"],
  "masa-bayragi": ["makam-bayragi", "yelken-bayrak"],
  "makam-bayragi": ["masa-bayragi", "yelken-bayrak"],
};

/** İSG kategorileri kendi aralarında çapraz satar (ör. uyarı levhası alana yasaklayıcı öner). */
const ISG_PREFIX = "is-guvenligi-";
const ISG_SIBLINGS = [
  "is-guvenligi-uyari-ikaz",
  "is-guvenligi-yasaklayici",
  "is-guvenligi-emredici-kkd",
  "is-guvenligi-acil-ilk-yardim",
  "is-guvenligi-yangin",
  "is-guvenligi-bilgilendirme-talimat",
];

function targetsFor(categorySlug: string): string[] {
  if (categorySlug.startsWith(ISG_PREFIX)) {
    return ISG_SIBLINGS.filter((s) => s !== categorySlug).slice(0, 2);
  }
  return CROSS_SELL_MAP[categorySlug] ?? [];
}

export function CartCrossSell() {
  const items = useCartStore((s) => s.items);
  const [suggestions, setSuggestions] = useState<Product[]>([]);

  // En pahalı kalem (satır toplamı) — öneriler onun kategorisine göre.
  const top = items.reduce<(typeof items)[number] | null>(
    (best, i) =>
      !best ||
      i.configuration.totalPrice * i.quantity >
        best.configuration.totalPrice * best.quantity
        ? i
        : best,
    null,
  );
  const topSlug = top?.productSlug;
  // Effect bağımlılığı için deterministik sepet imzası (satır ekle/çıkar → öneriler tazelenir).
  const cartSlugs = items
    .map((i) => i.productSlug)
    .sort()
    .join(",");

  useEffect(() => {
    if (!topSlug) {
      setSuggestions([]);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        // Kalemde kategori bilgisi yok → en pahalı ürünün detayından kategori slug'ı çözülür.
        const detail = await apiClient.products.detail(topSlug);
        const catSlug =
          (detail as unknown as { category?: { slug?: string } }).category?.slug ??
          detail.categorySlug ??
          "";
        const targets = targetsFor(catSlug);
        if (targets.length === 0) {
          if (!cancelled) setSuggestions([]);
          return;
        }
        const lists = await Promise.all(
          targets.map((t) =>
            apiClient.products.list({ category: t, take: 6 }).catch(() => [] as Product[]),
          ),
        );
        // Sepettekiyle aynı ürünü önerme; her hedef kategoriden dönüşümlü 1'er al (çeşitlilik).
        const inCart = new Set(cartSlugs.split(","));
        const pools = lists.map((l) => l.filter((p) => !inCart.has(p.slug)));
        const picked: Product[] = [];
        while (picked.length < 2 && pools.some((p) => p.length > 0)) {
          for (const pool of pools) {
            const candidate = pool.shift();
            if (candidate && !picked.some((p) => p.slug === candidate.slug)) {
              picked.push(candidate);
            }
            if (picked.length >= 2) break;
          }
        }
        if (!cancelled) setSuggestions(picked);
      } catch {
        if (!cancelled) setSuggestions([]); // API hatası → bölüm sessizce gizli kalır
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [topSlug, cartSlugs]);

  if (suggestions.length === 0) return null;

  return (
    <section aria-labelledby="cross-sell-title" className="mt-8">
      <h2 id="cross-sell-title" className="text-lg font-semibold text-ink-900">
        Bunlar da yanında iyi gider
      </h2>
      <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4">
        {suggestions.map((p) => (
          <Link
            key={p.slug}
            href={`/urun/${p.slug}`}
            className="group flex gap-3 p-3 bg-paper-50 border border-paper-200 rounded-xl hover:border-ink-300 hover:shadow-md transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink-900 focus-visible:ring-offset-2"
          >
            <div className="relative w-16 h-16 md:w-20 md:h-20 rounded-lg bg-paper-100 overflow-hidden flex-none">
              {p.images[0] ? (
                <Image
                  src={p.images[0]}
                  alt={p.name}
                  fill
                  sizes="80px"
                  className="object-cover transition-transform duration-300 group-hover:scale-105"
                />
              ) : (
                <ProductImageFallback name={p.name} />
              )}
            </div>
            <div className="min-w-0 flex flex-col py-0.5">
              <h3 className="text-sm font-medium text-ink-900 line-clamp-2 group-hover:text-brand-700 transition-colors">
                {p.name}
              </h3>
              <p className="mt-auto text-xs text-ink-500 tabular-nums">
                {getDisplayPrice(p) > 0
                  ? `${formatPriceDisplay(getDisplayPrice(p))}'den`
                  : "Teklif Al"}
              </p>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
