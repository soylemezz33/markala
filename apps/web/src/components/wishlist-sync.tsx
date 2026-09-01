"use client";

import { useEffect } from "react";
import { useAuthStore } from "@/lib/auth-store";
import { syncWishlistForUser } from "@/lib/wishlist";

/**
 * Favori listesini hesapla hizalar (2026-09-01) — görsel çıktı yok.
 *
 * Oturumsuzken HİÇBİR ŞEY YAPMAZ; özellikle yerel aynayı SİLMEZ: bu değişiklikten önce
 * cihazda birikmiş eski liste, kullanıcı giriş yapana kadar durmalı ki hesabına taşınabilsin.
 * Temizlik çıkışta yapılır (auth-store.logout → clearWishlistLocal).
 */
export function WishlistSync() {
  const userId = useAuthStore((s) => s.user?.id ?? null);

  useEffect(() => {
    if (!userId) return;
    void syncWishlistForUser(userId);
  }, [userId]);

  return null;
}
