"use client";

import { useEffect, useState } from "react";
import { Heart } from "@phosphor-icons/react";
import { isInWishlist, toggleWishlist } from "@/lib/client-storage";

interface WishlistButtonProps {
  slug: string;
  /** Sade icon mı, yoksa label'lı buton mu */
  variant?: "icon" | "labeled";
  className?: string;
}

export function WishlistButton({
  slug,
  variant = "icon",
  className = "",
}: WishlistButtonProps) {
  const [active, setActive] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    setActive(isInWishlist(slug));
    function handler() {
      setActive(isInWishlist(slug));
    }
    window.addEventListener("markala:wishlist-changed", handler);
    return () => window.removeEventListener("markala:wishlist-changed", handler);
  }, [slug]);

  function onClick(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    toggleWishlist(slug);
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

  if (variant === "icon") {
    return (
      <button
        onClick={onClick}
        type="button"
        aria-label={active ? "Favorilerden çıkar" : "Favorilere ekle"}
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
