"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Heart } from "@phosphor-icons/react";
import { isInWishlist } from "@/lib/client-storage";
import { toggleFavorite } from "@/lib/wishlist";
import { useAuthStore } from "@/lib/auth-store";

interface WishlistButtonProps {
  slug: string;
  /** Sade icon mı, yoksa label'lı buton mu */
  variant?: "icon" | "labeled";
  className?: string;
}

/**
 * Favori (wishlist) düğmesi — ÜYELİK GEREKTİRİR (2026-09-01, Hasan).
 *
 * Oturumsuz ziyaretçi tıklayınca favoriye eklenmez; /giris'e (üzerinde "üye ol" bağlantısı
 * ile) `next` taşıyarak yönlendirilir, girişten sonra aynı sayfaya döner.
 *
 * Liste HESAPTA tutulur (cihazlar arası senkron); localStorage yalnız ilk boyama aynasıdır —
 * bkz. lib/wishlist.ts. Oturumsuzken ayna okunmaz: çıkış yapmış kullanıcının cihazda kalan
 * kayıtları kalpleri dolu göstermesin, aksi hâlde tıklayınca anlamsızca giriş ekranına düşerdi.
 */
export function WishlistButton({
  slug,
  variant = "icon",
  className = "",
}: WishlistButtonProps) {
  const router = useRouter();
  // persist'ten (localStorage "markala-auth") anında gelir; bootstrap beklenmez.
  const user = useAuthStore((s) => s.user);
  const [stored, setStored] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    setStored(isInWishlist(slug));
    function handler() {
      setStored(isInWishlist(slug));
    }
    window.addEventListener("markala:wishlist-changed", handler);
    return () => window.removeEventListener("markala:wishlist-changed", handler);
  }, [slug]);

  const active = Boolean(user) && stored;

  function onClick(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (!user) {
      // Kart liste sayfalarında da kullanılıyor — filtre/sayfa parametreleri korunsun ki
      // girişten sonra kullanıcı tam olarak aynı görünüme dönsün.
      const next = `${window.location.pathname}${window.location.search}`;
      router.push(`/giris?next=${encodeURIComponent(next)}`);
      return;
    }
    // İyimser: ayna hemen güncellenir, sunucu yanıtı gelince liste sunucununkiyle eşitlenir.
    // Çağrı düşerse yalnız bu slug eski hâline döner (kalp geri söner) — sessiz yalan olmaz.
    void toggleFavorite(slug, !stored);
  }

  if (!mounted) {
    // SSR uyumlu placeholder
    return variant === "icon" ? (
      <span
        aria-hidden
        className={`w-11 h-11 rounded-full bg-paper-50/90 ${className}`}
      />
    ) : null;
  }

  const label = !user
    ? "Favorilere eklemek için giriş yapın"
    : active
      ? "Favorilerden çıkar"
      : "Favorilere ekle";

  if (variant === "icon") {
    return (
      <button
        onClick={onClick}
        type="button"
        aria-label={label}
        title={!user ? label : undefined}
        aria-pressed={active}
        className={`w-11 h-11 rounded-full bg-paper-50/90 backdrop-blur grid place-items-center transition-all hover:scale-105 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink-900 focus-visible:ring-offset-2 ${
          active ? "text-error" : "text-ink-700 hover:text-error"
        } ${className}`}
      >
        <Heart size={16} weight={active ? "fill" : "regular"} />
      </button>
    );
  }

  return (
    <button
      onClick={onClick}
      type="button"
      aria-label={label}
      aria-pressed={active}
      className={`inline-flex items-center justify-center gap-2 px-4 py-2 rounded-md border text-sm font-medium transition-all ${
        active
          ? "border-error/30 bg-error/5 text-error"
          : "border-paper-200 text-ink-700 hover:border-ink-300 hover:bg-paper-100"
      } ${className}`}
    >
      <Heart size={16} weight={active ? "fill" : "regular"} />
      {active ? "Favorilerimde" : "Favorilere Ekle"}
    </button>
  );
}
