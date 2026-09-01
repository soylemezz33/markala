/**
 * Cookie/localStorage tabanlı client-side state yöneticileri.
 * Server-rendered context'te (SSR) değer dönmez, hydration sonrası dolar.
 */

const RECENT_KEY = "markala_recent_products";
const WISHLIST_KEY = "markala_wishlist";
/**
 * Yerel favori aynasının SAHİBİ (kullanıcı id'si). Favoriler 2026-09-01'den beri hesapta
 * tutuluyor; localStorage yalnız ilk boyamada anında liste gösterebilmek için AYNA.
 * Sahip bilgisi olmadan ortak cihazda A'nın listesi B'nin hesabına taşınabilirdi.
 * Değer YOK + liste DOLU = bu değişiklikten önceki eski cihaz listesi (bir kez hesaba taşınır).
 */
const WISHLIST_OWNER_KEY = "markala_wishlist_owner";
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

/** Sunucudan gelen listeyi aynaya yazar (senkron sonucu). */
export function setWishlist(list: string[]): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(WISHLIST_KEY, JSON.stringify(list));
  window.dispatchEvent(new Event("markala:wishlist-changed"));
}

/**
 * Slug'ı listeye ALIR ya da ÇIKARIR (toggle DEĞİL — idempotent).
 * Sunucu çağrısı başarısız olunca iyimser değişikliği geri alırken kullanılır: iki hızlı
 * tıklama yarışsa bile yanlış yöne "geri alma" yapmaz.
 */
export function setWishlistMembership(slug: string, member: boolean): void {
  if (typeof window === "undefined") return;
  const list = getWishlist().filter((s) => s !== slug);
  if (member) list.unshift(slug);
  localStorage.setItem(WISHLIST_KEY, JSON.stringify(list));
  window.dispatchEvent(new Event("markala:wishlist-changed"));
}

export function getWishlistOwner(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(WISHLIST_OWNER_KEY);
}

export function setWishlistOwner(userId: string): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(WISHLIST_OWNER_KEY, userId);
}

/** Çıkışta çağrılır — ortak cihazda sonraki kullanıcı öncekinin listesini görmesin/devralmasın. */
export function clearWishlistLocal(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(WISHLIST_KEY);
  localStorage.removeItem(WISHLIST_OWNER_KEY);
  window.dispatchEvent(new Event("markala:wishlist-changed"));
}
