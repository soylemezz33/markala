import type { Product } from "@markala/types";
import { products as mockProducts } from "@markala/mock-data";

/**
 * Katalog veri katmanı — storefront ürünleri artık CANLI API'den (admin yönetir).
 *
 * Tasarım:
 * - Sunucu bileşenleri için (server-only). Client bileşenler bunu import EDEMEZ;
 *   onlar veriyi server parent'tan props ile alır.
 * - API container-içi adresten çekilir (CF round-trip yok); yoksa public URL'e düşer.
 * - HER fonksiyon API hatasında mock-data'ya düşer → storefront ASLA kırılmaz.
 * - ISR: revalidate 60sn — admin değişiklikleri ~1dk içinde storefront'a yansır.
 * - Kategoriler MOCK'ta kalır (API'de SEO alanları yok + düşük değişim); yalnız ürünler API.
 */

const API_BASE =
  process.env.API_INTERNAL_URL ||
  process.env.NEXT_PUBLIC_API_URL ||
  "http://api:4000";

type ApiProduct = Record<string, unknown>;

function num(v: unknown, fallback = 0): number {
  const n = typeof v === "string" || typeof v === "number" ? Number(v) : NaN;
  return Number.isFinite(n) ? n : fallback;
}

/**
 * API ürününü (Prisma şekli + content JSON) storefront Product şekline eşler.
 *
 * Veri kaynağı stratejisi:
 * - Base alanlar (fiyat, isim, görsel, badge, bestseller) → API (admin canlı yönetir).
 * - Zengin içerik (features/specs/faqs/seo) → API content varsa o, YOKSA mock'tan (slug ile).
 *   Böylece API image'i content'i henüz dönmese bile ürün detay sayfası dolu kalır;
 *   API rebuild edilince API content otomatik öne geçer.
 */
function mapProduct(p: ApiProduct): Product {
  const content = (p.content ?? {}) as Record<string, unknown>;
  const category = (p.category ?? {}) as Record<string, unknown>;
  const slug = String(p.slug);
  const mock = mockProducts.find((m) => m.slug === slug); // statik içerik fallback
  return {
    slug,
    name: String(p.name),
    categorySlug: String(category.slug ?? p.categorySlug ?? mock?.categorySlug ?? ""),
    shortDescription: String(p.shortDescription ?? ""),
    description: String(p.description ?? ""),
    basePrice: num(p.basePrice),
    startingPrice: p.startingPrice != null ? num(p.startingPrice) : undefined,
    productionTime: String(p.productionTime ?? ""),
    sizeLabel: (p.sizeLabel as string | null) ?? undefined,
    images: Array.isArray(p.images) && p.images.length > 0 ? (p.images as string[]) : (mock?.images ?? []),
    badges: Array.isArray(p.badges) ? (p.badges as Product["badges"]) : [],
    parameters:
      Array.isArray(p.parameters) && p.parameters.length > 0
        ? (p.parameters as Product["parameters"])
        : (mock?.parameters ?? []),
    bestseller: Boolean(p.bestseller),
    rating: (content.rating as Product["rating"]) ?? mock?.rating,
    features: (content.features as string[]) ?? mock?.features,
    useCases: (content.useCases as string[]) ?? mock?.useCases,
    specifications: (content.specifications as Product["specifications"]) ?? mock?.specifications,
    faqs: (content.faqs as Product["faqs"]) ?? mock?.faqs,
    relatedSlugs: (content.relatedSlugs as string[]) ?? mock?.relatedSlugs,
    seo: (content.seo as Product["seo"]) ?? mock?.seo,
    brand: (content.brand as string) ?? mock?.brand,
    sku: (content.sku as string) ?? mock?.sku,
  };
}

async function fetchJson(path: string): Promise<unknown> {
  const res = await fetch(`${API_BASE}/api${path}`, {
    // 30sn ISR + admin düzenlemesinde /api/revalidate ile anlık tazeleme (cross-app).
    next: { revalidate: 30 },
  });
  if (!res.ok) throw new Error(`catalog API ${path} -> ${res.status}`);
  return res.json();
}

/** Tüm aktif ürünler. API hatası/boş → mock fallback. */
export async function getProducts(): Promise<Product[]> {
  try {
    const data = await fetchJson("/products?take=200");
    if (!Array.isArray(data) || data.length === 0) return mockProducts;
    return data.map(mapProduct);
  } catch {
    return mockProducts;
  }
}

/** Tek ürün (slug). Bulunamazsa/hata → mock fallback. */
export async function getProductBySlug(slug: string): Promise<Product | undefined> {
  try {
    return mapProduct((await fetchJson(`/products/${encodeURIComponent(slug)}`)) as ApiProduct);
  } catch {
    return mockProducts.find((p) => p.slug === slug);
  }
}

/** Bir kategorinin ürünleri. API hatası → mock fallback (boş sonuç gerçek kabul edilir). */
export async function getProductsByCategory(categorySlug: string): Promise<Product[]> {
  try {
    const data = await fetchJson(`/products?category=${encodeURIComponent(categorySlug)}&take=200`);
    if (!Array.isArray(data)) throw new Error("beklenmeyen yanıt");
    return data.map(mapProduct);
  } catch {
    return mockProducts.filter((p) => p.categorySlug === categorySlug);
  }
}
