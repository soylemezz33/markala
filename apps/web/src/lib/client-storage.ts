/**
 * Cookie/localStorage tabanlı client-side state yöneticileri.
 * Server-rendered context'te (SSR) değer dönmez, hydration sonrası dolar.
 */

const RECENT_KEY = "markala_recent_products";
const WISHLIST_KEY = "markala_wishlist";
const MAX_RECENT = 12;

/** Sırada en yeni en başta */
export function getRecentlyViewed(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(RECENT_KEY);
    if (!raw) return [];
    const list = JSON.parse(raw) as string[];
    return Array.isArray(list) ? list : [];
  } catch {
    return [];
  }
}

export function addRecentlyViewed(slug: string): void {
  if (typeof window === "undefined") return;
  const list = getRecentlyViewed().filter((s) => s !== slug);
  list.unshift(slug);
  localStorage.setItem(RECENT_KEY, JSON.stringify(list.slice(0, MAX_RECENT)));
  window.dispatchEvent(new Event("markala:recent-changed"));
}

export function clearRecentlyViewed(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(RECENT_KEY);
  window.dispatchEvent(new Event("markala:recent-changed"));
}

// === Wishlist (Favoriler) ===

export function getWishlist(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(WISHLIST_KEY);
    if (!raw) return [];
    const list = JSON.parse(raw) as string[];
    return Array.isArray(list) ? list : [];
  } catch {
    return [];
  }
}

export function isInWishlist(slug: string): boolean {
  return getWishlist().includes(slug);
}

export function toggleWishlist(slug: string): boolean {
  if (typeof window === "undefined") return false;
  const list = getWishlist();
  const idx = list.indexOf(slug);
  if (idx >= 0) {
    list.splice(idx, 1);
  } else {
    list.unshift(slug);
  }
  localStorage.setItem(WISHLIST_KEY, JSON.stringify(list));
  window.dispatchEvent(new Event("markala:wishlist-changed"));
  return idx < 0; // true: eklendi, false: çıkarıldı
}

export function removeFromWishlist(slug: string): void {
  if (typeof window === "undefined") return;
  const list = getWishlist().filter((s) => s !== slug);
  localStorage.setItem(WISHLIST_KEY, JSON.stringify(list));
  window.dispatchEvent(new Event("markala:wishlist-changed"));
}
