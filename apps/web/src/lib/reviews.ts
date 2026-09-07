import { cache } from "react";
/**
 * Yorum veri katmanı.
 *
 * Tasarım:
 * - Ürün yorumları (server): /reviews/public?productSlug= → yalnız ONAYLI yorumlar (canlı).
 *   Yorum yoksa BOŞ döner — sahte yorum gösterme (mock'a DÜŞMEZ). UI "henüz yorum yok" gösterir.
 * - Anasayfa öne çıkan yorumlar (getFeaturedReviews): /reviews/public/featured → ürün-bağımsız
 *   GERÇEK onaylı yorumlar. Yorum yoksa BOŞ döner (anasayfa bölümü gizlenir). MOCK YOK.
 * - rating ortalaması/sayısı/dağılımı GERÇEK onaylı yorumlardan hesaplanır.
 * - Server-only fonksiyonlar apiClient KULLANMAZ (catalog.ts deseni: fetch + revalidate).
 */

const API_BASE =
  process.env.API_INTERNAL_URL ||
  process.env.NEXT_PUBLIC_API_URL ||
  "http://api:4000";

export interface Review {
  id: string;
  authorName: string;
  authorCompany?: string;
  authorRole?: string;
  productSlug?: string;
  rating: 1 | 2 | 3 | 4 | 5;
  title?: string;
  comment: string;
  verified: boolean;
  createdAt: string; // ISO
  helpful: number;
}

export interface ProductRatingStats {
  average: number;
  count: number;
  distribution: Record<1 | 2 | 3 | 4 | 5, number>;
}

// ─────────────────────────────────────────────────────────────────────────────
// API mapping + fetch
// ─────────────────────────────────────────────────────────────────────────────

function clampRating(v: unknown): 1 | 2 | 3 | 4 | 5 {
  const n = Math.round(Number(v));
  if (n <= 1) return 1;
  if (n >= 5) return 5;
  return n as 1 | 2 | 3 | 4 | 5;
}

/** ReviewDto → storefront Review. userName→authorName, comment→comment; onaylı yorumlar "verified". */
function mapReview(r: Record<string, unknown>): Review {
  const product = (r.product ?? {}) as Record<string, unknown>;
  return {
    id: String(r.id),
    authorName: String(r.userName ?? "Müşteri"),
    authorCompany: (r.userCompany as string | null) ?? undefined,
    productSlug: product.slug ? String(product.slug) : undefined,
    rating: clampRating(r.rating),
    comment: String(r.comment ?? ""),
    // Onaylı yorum = doğrulanmış sipariş kabul edilir (admin moderasyonundan geçti).
    verified: Boolean(r.isApproved),
    createdAt: String(r.createdAt ?? new Date().toISOString()),
    helpful: 0,
  };
}

async function fetchJson(path: string): Promise<unknown> {
  const res = await fetch(`${API_BASE}/api${path}`, { next: { revalidate: 60 } });
  if (!res.ok) throw new Error(`reviews API ${path} -> ${res.status}`);
  return res.json();
}

function computeStats(list: Review[]): ProductRatingStats {
  if (list.length === 0) {
    return { average: 0, count: 0, distribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 } };
  }
  const distribution: Record<1 | 2 | 3 | 4 | 5, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  let sum = 0;
  for (const r of list) {
    distribution[r.rating]++;
    sum += r.rating;
  }
  return {
    average: Math.round((sum / list.length) * 10) / 10,
    count: list.length,
    distribution,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Server erişimcileri
// ─────────────────────────────────────────────────────────────────────────────

/**
 * TÜM onaylı yorumlar, ürün slug'ına göre gruplanmış — SÜREÇ BAŞINA TEK istek.
 *
 * NEDEN (2026-09-07 ölçümü): her ürün sayfası yorumlarını ayrı ayrı çekiyordu. Bir ürün
 * sayfası bu veriyi ÜÇ ayrı yerden istiyor (sayfa + yorum bölümü + puan özeti) ve CI'da
 * build iki kez koşuyor; 793 ürünle her deploy canlı API'ye ~4.000 istek gönderiyordu.
 * Üstelik o gün sitede onaylı yorum sayısı SIFIRDI — dört bin istek boş dizi için.
 *
 * `cache()` React'in istek-başına belleğidir: aynı render içinde kaç kez çağrılırsa
 * çağrılsın ağa BİR kez çıkılır. `revalidate` ile de süreç boyunca tazelik korunur.
 */
const tumYorumlar = cache(async (): Promise<Map<string, Review[]>> => {
  const harita = new Map<string, Review[]>();
  try {
    const data = (await fetchJson("/reviews/public/tumu")) as {
      tavanAsildi?: boolean;
      yorumlar?: Record<string, unknown>[];
    };
    for (const ham of data?.yorumlar ?? []) {
      const yorum = mapReview(ham);
      if (!yorum.productSlug) continue;
      const mevcut = harita.get(yorum.productSlug);
      if (mevcut) mevcut.push(yorum);
      else harita.set(yorum.productSlug, [yorum]);
    }
  } catch {
    // Uç erişilemezse boş harita: yorum bölümü kendini gizler, sayfa yine açılır.
  }
  return harita;
});

/**
 * Bir ürünün ONAYLI yorumları (en yeni önce). API hatası/yorum yoksa → BOŞ dizi.
 * Mock'a DÜŞMEZ (sahte yorum gösterme); UI boş durumu kendi yönetir.
 */
export async function getProductReviews(productSlug: string, limit?: number): Promise<Review[]> {
  const harita = await tumYorumlar();
  const list = [...(harita.get(productSlug) ?? [])].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );
  return limit ? list.slice(0, limit) : list;
}

/** Ürün rating istatistikleri — GERÇEK onaylı yorumlardan. Yorum yoksa count=0. */
export async function getProductRatingStats(productSlug: string): Promise<ProductRatingStats> {
  const list = await getProductReviews(productSlug);
  return computeStats(list);
}

/**
 * Anasayfa öne çıkan yorumlar — ürün-bağımsız GERÇEK onaylı yorumlar (/reviews/public/featured).
 * Onaylı yorum yoksa BOŞ döner; anasayfa bölümü kendini gizler. Sahte testimonial KULLANILMAZ.
 */
export async function getFeaturedReviews(limit = 6): Promise<Review[]> {
  try {
    const data = await fetchJson(`/reviews/public/featured?limit=${limit}`);
    if (!Array.isArray(data)) return [];
    return (data as Record<string, unknown>[]).map(mapReview);
  } catch {
    return [];
  }
}
