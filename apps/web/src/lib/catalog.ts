import type { Product, Category } from "@markala/types";
import { type HeroSlide } from "@markala/mock-data";
import type { NavCategory } from "@/components/site-header";

/**
 * Katalog veri katmanı — storefront ürünleri artık CANLI API'den (admin yönetir).
 *
 * Tasarım:
 * - Sunucu bileşenleri için (server-only). Client bileşenler bunu import EDEMEZ;
 *   onlar veriyi server parent'tan props ile alır.
 * - API container-içi adresten çekilir (CF round-trip yok); yoksa public URL'e düşer.
 * - Ürünler/hero: API hatasında/boş → [] (graceful empty; mock fallback KALDIRILDI).
 * - Kategoriler: API hatasında/boş → [] (graceful empty; mock fallback KALDIRILDI).
 * - ISR: revalidate 30sn — admin değişiklikleri ~30sn içinde storefront'a yansır.
 */

const API_BASE =
  process.env.API_INTERNAL_URL || process.env.NEXT_PUBLIC_API_URL || "http://api:4000";

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
 * - Zengin içerik (features/specs/faqs/seo) → API content JSON; alan yoksa undefined/[].
 *   Mock fallback KALDIRILDI — tüm verinin tek kaynağı API/DB'dir.
 */
function mapProduct(p: ApiProduct): Product {
  const content = (p.content ?? {}) as Record<string, unknown>;
  const category = (p.category ?? {}) as Record<string, unknown>;
  const slug = String(p.slug);
  return {
    slug,
    name: String(p.name),
    categorySlug: String(category.slug ?? p.categorySlug ?? ""),
    shortDescription: String(p.shortDescription ?? ""),
    description: String(p.description ?? ""),
    basePrice: num(p.basePrice),
    startingPrice: p.startingPrice != null ? num(p.startingPrice) : undefined,
    productionTime: String(p.productionTime ?? ""),
    sizeLabel: (p.sizeLabel as string | null) ?? undefined,
    images: Array.isArray(p.images) ? (p.images as string[]) : [],
    badges: Array.isArray(p.badges) ? (p.badges as Product["badges"]) : [],
    options: Array.isArray(p.options) ? (p.options as Product["options"]) : [],
    prices: Array.isArray(p.prices) ? (p.prices as Product["prices"]) : [],
    displayPrice: typeof p.displayPrice === "number" ? p.displayPrice : null,
    bestseller: Boolean(p.bestseller),
    // SAHTE PUAN YOK: content.rating DB'de SEEDED (42 üründe dolu, gerçek yorumla BAĞLANTISIZ) →
    // gösterilince "★4.6 (47 yorum)" derken yorum bölümü "henüz yorum yok" diyordu (çelişki) +
    // sahte JSON-LD aggregateRating (Google cezası). Gerçek yorum aggregate'i (getProductRatingStats)
    // wire edilene kadar HİÇ rating gösterme.
    rating: undefined,
    features: content.features as string[] | undefined,
    useCases: content.useCases as string[] | undefined,
    specifications: content.specifications as Product["specifications"] | undefined,
    faqs: content.faqs as Product["faqs"] | undefined,
    relatedSlugs: content.relatedSlugs as string[] | undefined,
    seo: content.seo as Product["seo"] | undefined,
    brand: content.brand as string | undefined,
    sku: content.sku as string | undefined,
  };
}

async function fetchJson(path: string): Promise<unknown> {
  const res = await fetch(`${API_BASE}/api${path}`, {
    // 30sn ISR + admin düzenlemesinde /api/revalidate ile anlık tazeleme (cross-app).
    next: { revalidate: 30 },
  });
  if (!res.ok) {
    // Sessiz boş-dönüş yerine sunucu logu: API 5xx ile gerçek boş veriyi ayırt edebilmek için.
    console.error(`[catalog] API ${path} -> HTTP ${res.status}`);
    throw new Error(`catalog API ${path} -> ${res.status}`);
  }
  return res.json();
}

/** Tüm aktif ürünler. API hatası/boş → [] (graceful empty; mock fallback kaldırıldı). */
export async function getProducts(): Promise<Product[]> {
  try {
    // list=true → hafif yanıt (content/description hariç, parameters dahil): kart/filtre/fiyat
    // için yeterli, payload ~yarıya iner. Detay sayfası getProductBySlug ile tam veriyi alır.
    const data = await fetchJson("/products?take=5000&list=true");
    if (!Array.isArray(data)) return [];
    return data.map(mapProduct);
  } catch {
    return [];
  }
}

/**
 * Tek ürün (slug). KRİTİK: API 404'ü (ürün silinmiş/pasif) ağ hatasından AYIRIR.
 * - 404 → undefined → sayfa notFound() (silinen ürün görünmez/satılmaz).
 * - 5xx / ağ hatası → undefined (graceful; mock fallback kaldırıldı).
 */
export async function getProductBySlug(slug: string): Promise<Product | undefined> {
  try {
    const res = await fetch(`${API_BASE}/api/products/${encodeURIComponent(slug)}`, {
      next: { revalidate: 30 },
    });
    if (res.status === 404) return undefined; // ürün yok/silinmiş → notFound
    if (!res.ok) return undefined; // geçici sunucu hatası → undefined
    return mapProduct((await res.json()) as ApiProduct);
  } catch {
    return undefined; // ağ hatası → undefined
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
 * yoksa/hata → [] (graceful empty; mock fallback kaldırıldı).
 */
export async function getHeroSlides(): Promise<HeroSlide[]> {
  try {
    const data = await fetchJson("/hero-slides");
    if (!Array.isArray(data)) return [];
    return (data as Record<string, unknown>[]).map(mapHeroSlide);
  } catch {
    return [];
  }
}

/** Tam-banner hero görselleri (admin "Anasayfa Slider"). Yalnız AKTİF + görseli olan slide'lar;
 *  mock fallback YOK (boşsa anasayfa yapısal hero'ya düşer). Banner'lar tasarımın kendisidir. */
export interface HeroBannerData {
  id: string;
  imageUrl: string;
  mobileImageUrl?: string | null;
  ctaHref?: string | null;
  title: string;
}
/** ctaHref güvenlik süzgeci: yalnız site-içi mutlak yol VEYA http(s) URL. javascript:/data:
 *  gibi şemalar (admin/DB ele geçse bile XSS yüzeyi) reddedilir → link basılmaz. */
function safeHref(v: unknown): string | null {
  if (typeof v !== "string" || !v.trim()) return null;
  const t = v.trim();
  if (t.startsWith("/") && !t.startsWith("//")) return t;
  try {
    const u = new URL(t);
    return u.protocol === "http:" || u.protocol === "https:" ? u.toString() : null;
  } catch {
    return null;
  }
}
export async function getHeroBanners(): Promise<HeroBannerData[]> {
  try {
    const data = await fetchJson("/hero-slides");
    if (!Array.isArray(data)) return [];
    return (data as Record<string, unknown>[])
      .filter((s) => typeof s.imageUrl === "string" && s.imageUrl)
      .map((s) => ({
        id: String(s.id),
        imageUrl: String(s.imageUrl),
        mobileImageUrl: s.mobileImageUrl ? String(s.mobileImageUrl) : null,
        ctaHref: safeHref(s.ctaHref),
        title: String(s.title ?? ""),
      }));
  } catch {
    return [];
  }
}

/**
 * API kategorisini storefront Category şekline eşler. Zengin alanlar (seoIntro/features/faqs/seo)
 * API'nin content JSON alanından; productCount API'nin _count.products'tan gelir. Mock fallback YOK.
 */
function mapCategory(c: Record<string, unknown>): Category {
  const slug = String(c.slug);
  const content = (c.content ?? {}) as Record<string, unknown>;
  return {
    slug,
    name: String(c.name ?? slug),
    shortDescription: String(c.shortDescription ?? ""),
    longDescription: String(c.longDescription ?? ""),
    imageUrl: String(c.imageUrl || `/api/mockup?category=${slug}&w=1200&h=900`),
    accentColor: (c.accentColor as string) ?? undefined,
    startingPrice: c.startingPrice != null ? num(c.startingPrice) : 0,
    productionTime: String(c.productionTime ?? "1-3 iş günü"),
    productCount: (c._count as { products?: number } | undefined)?.products ?? 0,
    seoIntro: content.seoIntro as string | undefined,
    features: content.features as string[] | undefined,
    faqs: content.faqs as Category["faqs"],
    seo: content.seo as Category["seo"],
  };
}

/**
 * Tüm aktif kategoriler — CANLI API (admin "Kategoriler"den yönetir).
 * Hata veya boş yanıt → [] döner (graceful empty; mock fallback kaldırıldı).
 */
export async function getCategories(): Promise<Category[]> {
  try {
    const data = await fetchJson("/categories");
    if (!Array.isArray(data) || data.length === 0) return [];
    return (data as Record<string, unknown>[]).map(mapCategory);
  } catch {
    return [];
  }
}

/** Tek kategori (slug). API'de yoksa → undefined (mock fallback kaldırıldı). */
export async function getCategoryBySlug(slug: string): Promise<Category | undefined> {
  const list = await getCategories();
  return list.find((c) => c.slug === slug);
}

/**
 * Header menüsü — CANLI API (admin /menu yönetir → header_nav SiteSetting).
 * Geçerli (her öğede label+href olan) bir dizi DEĞİLSE null → SiteHeader koddaki
 * DEFAULT_NAV yedeğine düşer (kayıt yokken/bozukken site eskisi gibi çalışır).
 */
export async function getHeaderNav(): Promise<NavCategory[] | null> {
  try {
    const data = await fetchJson("/settings/header-nav");
    if (!Array.isArray(data) || data.length === 0) return null;
    const valid = data.every(
      (c) =>
        c != null &&
        typeof c === "object" &&
        typeof (c as NavCategory).label === "string" &&
        typeof (c as NavCategory).href === "string",
    );
    return valid ? (data as NavCategory[]) : null;
  } catch {
    return null;
  }
}

/** Bir kategorinin ürünleri. API hatası → [] (graceful empty; mock fallback kaldırıldı). */
export async function getProductsByCategory(categorySlug: string): Promise<Product[]> {
  try {
    const data = await fetchJson(
      `/products?category=${encodeURIComponent(categorySlug)}&take=2000&list=true`,
    );
    if (!Array.isArray(data)) return [];
    return data.map(mapProduct);
  } catch {
    return [];
  }
}
