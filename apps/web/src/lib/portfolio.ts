/**
 * Portfolyo veri katmanı — CANLI API (admin "Portfolyo"dan yönetir).
 *
 * Tasarım (brands.ts / catalog.ts deseni):
 * - Server-only: SUNUCUDA çağrılır. apiClient KULLANILMAZ.
 * - PortfolioItemDto → storefront PortfolioItem şekline maplenir.
 * - Sadece aktif öğeler (/portfolio/public). API hatası/boş → [] (sayfa "yakında" durumu gösterir).
 */

const API_BASE =
  process.env.API_INTERNAL_URL || process.env.NEXT_PUBLIC_API_URL || "http://api:4000";

export interface PortfolioItem {
  slug: string;
  title: string;
  description?: string;
  imageUrl: string;
  category?: string;
  client?: string;
  productSlug?: string;
  tags: string[];
}

function mapItem(p: Record<string, unknown>): PortfolioItem {
  return {
    slug: String(p.slug ?? ""),
    title: String(p.title ?? ""),
    description: (p.description as string | null) ?? undefined,
    imageUrl: String(p.imageUrl ?? ""),
    category: (p.category as string | null) ?? undefined,
    client: (p.client as string | null) ?? undefined,
    productSlug: (p.productSlug as string | null) ?? undefined,
    tags: Array.isArray(p.tags) ? (p.tags as string[]) : [],
  };
}

async function fetchJson(path: string): Promise<unknown> {
  const res = await fetch(`${API_BASE}/api${path}`, { next: { revalidate: 60 } });
  if (!res.ok) throw new Error(`portfolio API ${path} -> ${res.status}`);
  return res.json();
}

/**
 * Aktif portfolyo öğeleri. API hatası/boş → [].
 * Boş dönerse sayfa "yakında" durumunu gösterir.
 */
export async function getPortfolioItems(): Promise<PortfolioItem[]> {
  try {
    const data = await fetchJson("/portfolio/public");
    if (!Array.isArray(data)) return [];
    // Görselsiz/başlıksız kayıtları ele; boş kalırsa "yakında" durumu tetiklenir.
    return (data as Record<string, unknown>[]).map(mapItem).filter((p) => p.title && p.imageUrl);
  } catch {
    return [];
  }
}
