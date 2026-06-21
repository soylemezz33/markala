import type { Product, Category } from "@markala/types";
import { products as mockProducts, heroSlides as mockHeroSlides, categories as mockCategories, type HeroSlide } from "@markala/mock-data";

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
    // SAHTE PUAN YOK: content.rating DB'de SEEDED (42 üründe dolu, gerçek yorumla BAĞLANTISIZ) →
    // gösterilince "★4.6 (47 yorum)" derken yorum bölümü "henüz yorum yok" diyordu (çelişki) +
    // sahte JSON-LD aggregateRating (Google cezası). Gerçek yorum aggregate'i (getProductRatingStats)
    // wire edilene kadar HİÇ rating gösterme. content.rating + mock fallback ikisi de KULLANILMAZ.
    rating: undefined,
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
    // list=true → hafif yanıt (content/description hariç, parameters dahil): kart/filtre/fiyat
    // için yeterli, payload ~yarıya iner. Detay sayfası getProductBySlug ile tam veriyi alır.
    const data = await fetchJson("/products?take=5000&list=true");
    if (!Array.isArray(data) || data.length === 0) return mockProducts;
    return data.map(mapProduct);
  } catch {
    return mockProducts;
  }
}

/**
 * Tek ürün (slug). KRİTİK: API 404'ü (ürün silinmiş/pasif) ağ hatasından AYIRIR.
 * - 404 → undefined → sayfa notFound() (silinen ürün stale mock fiyatla GÖRÜNMEZ/satılmaz).
 * - 5xx / ağ hatası → mock fallback (geçici sorunda storefront kırılmasın, dayanıklılık).
 */
export async function getProductBySlug(slug: string): Promise<Product | undefined> {
  try {
    const res = await fetch(`${API_BASE}/api/products/${encodeURIComponent(slug)}`, {
      next: { revalidate: 30 },
    });
    if (res.status === 404) return undefined; // ürün yok/silinmiş → notFound (mock'a DÜŞME)
    if (!res.ok) return mockProducts.find((p) => p.slug === slug); // geçici sunucu hatası → fallback
    return mapProduct((await res.json()) as ApiProduct);
  } catch {
    return mockProducts.find((p) => p.slug === slug); // ağ hatası → fallback
  }
}

const HERO_THEMES: HeroSlide["theme"][] = ["yellow", "ink", "cyan", "cream"];
/** Görseli henüz yüklenmemiş slide'lar boş/kırık görünmesin diye dönüşümlü animasyonlu görsel. */
const HERO_FALLBACK_VISUALS: NonNullable<HeroSlide["visualType"]>[] = [
  "design-stack",
  "card-stack",
  "mug-3d",
  "banner-display",
];

/**
 * Admin'in DB'deki hero slide'ı (HeroSlideDto) → storefront HeroCarousel şekli.
 * DB minimal (title/subtitle/imageUrl/cta/sortOrder); zengin alanlar (eyebrow/theme/visual)
 * için nötr varsayılan. Görsel varsa sağda o render edilir (visualType="image");
 * görsel YOKSA slide yine gösterilir ama boş alan yerine animasyonlu bespoke visual atanır
 * (admin görsel yükleyince otomatik gerçek görsele geçer).
 */
function mapHeroSlide(s: Record<string, unknown>, i: number): HeroSlide {
  const imageUrl = String(s.imageUrl ?? "");
  return {
    id: String(s.id ?? `db-${i}`),
    eyebrow: "Öne Çıkan",
    title: String(s.title ?? ""),
    description: String(s.subtitle ?? ""),
    ctaLabel: String(s.ctaLabel || "İncele"),
    ctaHref: String(s.ctaHref || "/urunler"),
    productImage: imageUrl,
    theme: HERO_THEMES[i % HERO_THEMES.length]!,
    visualType: imageUrl ? "image" : HERO_FALLBACK_VISUALS[i % HERO_FALLBACK_VISUALS.length]!,
  };
}

/**
 * Anasayfa hero slide'ları — CANLI API (admin "Anasayfa Slider"dan yönetir).
 * TÜM aktif slide'lar gösterilir (görseli olmayanlar bespoke visual ile). Aktif slide
 * yoksa/hata → mock slide'lara düşer (anasayfa hero ASLA boş kalmaz).
 */
export async function getHeroSlides(): Promise<HeroSlide[]> {
  try {
    const data = await fetchJson("/hero-slides");
    if (!Array.isArray(data) || data.length === 0) return mockHeroSlides;
    return (data as Record<string, unknown>[]).map(mapHeroSlide);
  } catch {
    return mockHeroSlides;
  }
}

/**
 * API kategorisini storefront Category şekline eşler. Zengin alanlar (seoIntro/features/faqs/seo/
 * productCount) API'de yok → mock'tan (slug ile) doldurulur; görsel yoksa mockup'a düşer.
 */
function mapCategory(c: Record<string, unknown>): Category {
  const slug = String(c.slug);
  const mock = mockCategories.find((m) => m.slug === slug);
  return {
    slug,
    name: String(c.name ?? mock?.name ?? slug),
    shortDescription: String(c.shortDescription ?? mock?.shortDescription ?? ""),
    longDescription: String(c.longDescription ?? mock?.longDescription ?? ""),
    imageUrl: String(c.imageUrl || mock?.imageUrl || `/api/mockup?category=${slug}&w=1200&h=900`),
    accentColor: (c.accentColor as string) ?? mock?.accentColor,
    startingPrice: c.startingPrice != null ? num(c.startingPrice) : (mock?.startingPrice ?? 0),
    productionTime: String(c.productionTime ?? mock?.productionTime ?? "1-3 iş günü"),
    productCount: mock?.productCount ?? 0,
    seoIntro: mock?.seoIntro,
    features: mock?.features,
    faqs: mock?.faqs,
    seo: mock?.seo,
  };
}

/**
 * Tüm aktif kategoriler — CANLI API (admin "Kategoriler"den yönetir). Hata/boş → mock fallback.
 * Böylece admin'in eklediği yeni kategori (örn. İş Güvenliği) sitede görünür.
 */
export async function getCategories(): Promise<Category[]> {
  try {
    const data = await fetchJson("/categories");
    if (!Array.isArray(data) || data.length === 0) return mockCategories;
    return (data as Record<string, unknown>[]).map(mapCategory);
  } catch {
    return mockCategories;
  }
}

/** Tek kategori (slug). API'de yoksa/hata → mock fallback. */
export async function getCategoryBySlug(slug: string): Promise<Category | undefined> {
  const list = await getCategories();
  return list.find((c) => c.slug === slug) ?? mockCategories.find((c) => c.slug === slug);
}

/** Bir kategorinin ürünleri. API hatası → mock fallback (boş sonuç gerçek kabul edilir). */
export async function getProductsByCategory(categorySlug: string): Promise<Product[]> {
  try {
    const data = await fetchJson(`/products?category=${encodeURIComponent(categorySlug)}&take=2000&list=true`);
    if (!Array.isArray(data)) throw new Error("beklenmeyen yanıt");
    return data.map(mapProduct);
  } catch {
    return mockProducts.filter((p) => p.categorySlug === categorySlug);
  }
}
