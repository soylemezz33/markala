"use client";

import { apiClient, withRefresh } from "@/lib/api";
import {
  getWishlist,
  getWishlistOwner,
  setWishlist,
  setWishlistMembership,
  setWishlistOwner,
} from "@/lib/client-storage";

/**
 * Favori senkronu — DOĞRULUK KAYNAĞI SUNUCU (2026-09-01, Hasan: cihazlar arası senkron).
 *
 * localStorage yalnız AYNA: ilk boyamada kalpler anında doğru görünsün, ağ turu beklenmesin.
 * Yazma iyimser (optimistic) yapılır, sunucu yanıtı gelince liste sunucununkiyle değiştirilir;
 * çağrı düşerse yalnız o slug eski hâline döner (bkz. setWishlistMembership).
 */

/** İlk senkron turu bitti (başarılı ya da değil) — Favorilerim iskeletini bu kapatır. */
export const WISHLIST_SYNCED_EVENT = "markala:wishlist-synced";

/**
 * Girişten sonra (ve her sayfa açılışında) aynayı hesapla hizalar.
 *
 * - Ayna zaten bu kullanıcıya aitse: sunucu listesi çekilir, ayna yenilenir.
 * - Ayna BAŞKA kullanıcıya aitse: yerel liste ATILIR (ortak cihaz), sunucu listesi yazılır.
 * - Sahip bilgisi YOKSA ve liste doluysa: bu, favorilerin cihazda tutulduğu döneme ait ESKİ
 *   listedir — bir kez hesaba taşınır (merge), sonra sunucu tek doğruluk kaynağı olur.
 *
 * Hata durumunda ayna OLDUĞU GİBİ bırakılır: geçici ağ hatası kullanıcının listesini silmesin.
 */
export async function syncWishlistForUser(userId: string): Promise<void> {
  const owner = getWishlistOwner();
  const local = getWishlist();
  const eskiCihazListesi = !owner && local.length > 0;

  try {
    const slugs = eskiCihazListesi
      ? await withRefresh(() => apiClient.users.mergeFavorites(local.slice(0, 200)))
      : await withRefresh(() => apiClient.users.listFavorites());
    setWishlistOwner(userId);
    setWishlist(slugs);
  } catch {
    // Sunucuya ulaşılamadı. Ayna başkasına aitse yine de gösterme — yanlış kullanıcının
    // listesi ekranda kalmasın; sahibi biz/bilinmiyorsa mevcut ayna korunur.
    if (owner && owner !== userId) {
      setWishlistOwner(userId);
      setWishlist([]);
    }
  } finally {
    // Favorilerim sayfası bunu bekler: BAŞARISIZ turda da atılır, aksi hâlde ağ hatasında
    // iskelet ekranda sonsuza kadar dönerdi.
    window.dispatchEvent(new Event(WISHLIST_SYNCED_EVENT));
  }
}

/**
 * Favoriye ekle/çıkar. Aynayı hemen günceller, sunucuya yazar, dönen listeyle senkronlar.
 * @returns işlem sunucuda kalıcı oldu mu
 */
export async function toggleFavorite(slug: string, ekle: boolean): Promise<boolean> {
  setWishlistMembership(slug, ekle); // iyimser
  try {
    const slugs = await withRefresh(() =>
      ekle ? apiClient.users.addFavorite(slug) : apiClient.users.removeFavorite(slug),
    );
    setWishlist(slugs);
    return true;
  } catch {
    setWishlistMembership(slug, !ekle); // yalnız bu slug geri alınır
    return false;
  }
}
