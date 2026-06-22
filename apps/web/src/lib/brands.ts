/**
 * Referans (marka) veri katmanı — CANLI API (admin "Referanslar"dan yönetir).
 *
 * Tasarım (catalog.ts deseni):
 * - Server-only: SUNUCUDA çağrılır. apiClient KULLANILMAZ.
 * - BrandDto → storefront Brand ({ name, logoUrl }) şekline maplenir.
 * - Sadece aktif markalar (/brands/public). API hatası → MOCK fallback (boş dizi → "yakında" durumu).
 * - Admin'in eklediği marka sitede görünür.
 */

import { brands as mockBrands } from "@markala/mock-data";
import type { Brand } from "@markala/types";

const API_BASE =
  process.env.API_INTERNAL_URL || process.env.NEXT_PUBLIC_API_URL || "http://api:4000";

export interface StoreBrand extends Brand {
  /** Opsiyonel dış site linki (admin girerse). */
  websiteUrl?: string;
}

function mapBrand(b: Record<string, unknown>): StoreBrand {
  return {
    name: String(b.name ?? ""),
    logoUrl: String(b.logoUrl ?? ""),
    websiteUrl: (b.websiteUrl as string | null) ?? undefined,
  };
}

async function fetchJson(path: string): Promise<unknown> {
  const res = await fetch(`${API_BASE}/api${path}`, { next: { revalidate: 30 } });
  if (!res.ok) throw new Error(`brands API ${path} -> ${res.status}`);
  return res.json();
}

/**
 * Aktif referans markaları. API hatası → mock fallback.
 * Mock şu an boş ([]) → boş dönerse sayfa "yakında" durumunu gösterir.
 */
export async function getBrands(): Promise<StoreBrand[]> {
  try {
    const data = await fetchJson("/brands/public");
    if (!Array.isArray(data)) return mockBrands;
    // Logosuz/adsız kayıtları ele; boş kalırsa "yakında" durumu tetiklenir.
    return (data as Record<string, unknown>[]).map(mapBrand).filter((b) => b.name);
  } catch {
    return mockBrands;
  }
}
