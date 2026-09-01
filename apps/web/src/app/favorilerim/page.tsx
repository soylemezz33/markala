"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Heart, ArrowRight, ShoppingBag, SignIn, UserPlus } from "@phosphor-icons/react";
import type { Product } from "@markala/types";
import { ProductCard } from "@/components/product-card";
import { resolveProductSlugs } from "@/lib/resolve-products";
import { getWishlist, getWishlistOwner } from "@/lib/client-storage";
import { WISHLIST_SYNCED_EVENT } from "@/lib/wishlist";
import { useAuthStore } from "@/lib/auth-store";

export default function WishlistPage() {
  // Favoriler ÜYELİK GEREKTİRİR (2026-09-01, Hasan) — bkz. WishlistButton.
  // persist'ten gelen `user` hidrasyonda hazır olur, bootstrap beklenmez.
  const user = useAuthStore((s) => s.user);
  const [items, setItems] = useState<Product[]>([]);
  const [mounted, setMounted] = useState(false);
  // Liste sunucudan gelir (WishlistSync). Yeni cihazda ayna boş başlar; ilk senkron bitmeden
  // "Henüz favori ürünün yok" BASILMAZ — iskelet durur, aksi hâlde dolu liste bir an boş görünür.
  const [synced, setSynced] = useState(false);

  useEffect(() => {
    if (!user) return;
    // Ayna zaten bu kullanıcıya aitse bekletme; tazeleme arka planda sürer.
    if (getWishlistOwner() === user.id) setSynced(true);
    function done() {
      setSynced(true);
    }
    window.addEventListener(WISHLIST_SYNCED_EVENT, done);
    return () => window.removeEventListener(WISHLIST_SYNCED_EVENT, done);
  }, [user]);

  useEffect(() => {
    setMounted(true);
    if (!user) {
      setItems([]);
      return;
    }
    let cancelled = false;

    function load() {
      // Slug'lar tekil /products/:slug ile çözülür — bkz. resolveProductSlugs (eski
      // take:500 liste penceresi katalog 870+ olunca eski ürünleri kaçırıyordu).
      const slugs = getWishlist();
      resolveProductSlugs(slugs).then((resolved) => {
        if (!cancelled) setItems(resolved);
      });
    }
    load();
    window.addEventListener("markala:wishlist-changed", load);
    return () => {
      cancelled = true;
      window.removeEventListener("markala:wishlist-changed", load);
    };
  }, [user]);

  // Kendi tam-genişlik hero'su ve Container'ı KALDIRILDI: sayfa artık hesap kabuğunun
  // (layout.tsx → Container + AccountShell) içinde render ediliyor, ikinci bir Container
  // çift padding ve iç içe max-width üretiyordu. Başlık hesap sayfalarının diliyle
  // hizalandı (2026-08-31, Hasan: "Favorilerim'e geldiğimde soldaki menü kayboluyor").
  return (
    <>
      <header className="mb-6">
        <div className="flex items-center gap-2.5">
          <Heart size={24} weight="fill" className="text-error" />
          <h1 className="text-2xl md:text-3xl font-semibold text-ink-900">Favorilerim</h1>
        </div>
        <p className="mt-1 text-sm text-ink-500 max-w-xl">
          Beğendiğin ürünleri buraya ekle, sonra kaldığın yerden devam et. Liste hesabına
          kayıtlı — telefonda eklediğin ürün bilgisayarında da görünür.
        </p>
      </header>

      <div>
        {!mounted || (user && !synced) ? (
          <div
            role="status"
            aria-busy="true"
            aria-label="Favoriler yükleniyor"
            className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
          >
            <span className="sr-only">Favoriler yükleniyor…</span>
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="space-y-3 animate-pulse" aria-hidden="true">
                <div className="aspect-square bg-paper-200 rounded-lg" />
                <div className="h-4 bg-paper-200 rounded w-3/4" />
                <div className="h-3 bg-paper-200 rounded w-1/2" />
              </div>
            ))}
          </div>
        ) : !user ? (
          <div className="py-16 text-center bg-paper-100 rounded-xl border border-paper-200 max-w-xl mx-auto px-6">
            <Heart size={40} className="mx-auto text-paper-200" weight="fill" />
            <h2 className="mt-4 text-xl font-semibold text-ink-900">
              Favoriler için giriş yapın
            </h2>
            <p className="mt-2 text-ink-500 max-w-sm mx-auto">
              Beğendiğin ürünleri favorilerine eklemek ve burada görmek için üye girişi
              yapman gerekiyor. Üyelik ücretsiz, 30 saniye sürer.
            </p>
            <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
              <Link
                href="/giris?next=%2Ffavorilerim"
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-brand-500 hover:bg-brand-600 text-ink-900 rounded-md text-sm font-semibold"
              >
                <SignIn size={14} weight="bold" /> Giriş Yap
              </Link>
              <Link
                href="/kayit?next=%2Ffavorilerim"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-md border border-paper-200 bg-paper-50 hover:border-ink-300 hover:bg-paper-100 text-ink-900 text-sm font-semibold"
              >
                <UserPlus size={14} weight="bold" /> Üye Ol
              </Link>
            </div>
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
      </div>
    </>
  );
}
