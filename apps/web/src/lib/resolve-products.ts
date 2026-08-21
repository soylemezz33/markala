import type { Product } from "@markala/types";
import { apiClient } from "@/lib/api";

/**
 * localStorage'daki slug listesini (önceden gezdiklerim / favoriler) CANLI ürünlere çözer.
 *
 * Her slug tekil `/products/:slug` ile çekilir. Eski yöntem (`list({ take: 500 })` + client-side
 * map) katalog 870+ ürüne çıkınca KIRILDI: liste createdAt-desc ilk 500'ü döndürüyor, ilk
 * seed'deki gerçek ürünler (kartvizit, broşür, cepli dosya...) pencerenin DIŞINDA kalıp sessizce
 * eleniyordu → "Önceden Gezdiklerim" ve "Favorilerim" boş görünüyordu. Tekil çekim pencere
 * sorununu kökten kaldırır ve 500 ürünlük payload'ı da (her ürün sayfasında iniyordu) bitirir.
 *
 * - Sıra korunur (localStorage sırası: en yeni en başta).
 * - Bulunamayan (404) veya yayından kaldırılmış (isActive=false) slug elenir.
 */
export async function resolveProductSlugs(slugs: string[]): Promise<Product[]> {
  if (slugs.length === 0) return [];
  const results = await Promise.allSettled(slugs.map((s) => apiClient.products.detail(s)));
  return results
    .map((r) => (r.status === "fulfilled" ? r.value : undefined))
    .filter((p): p is Product => p != null && (p as { isActive?: boolean }).isActive !== false);
}
