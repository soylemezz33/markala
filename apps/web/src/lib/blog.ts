/**
 * Blog veri katmanı — CANLI API (admin "Blog"dan yönetir).
 *
 * Tasarım (catalog.ts deseniyle tutarlı):
 * - Server-only: bu fonksiyonlar SUNUCUDA çağrılır (server component'ler async). apiClient KULLANILMAZ.
 * - API container-içi adresten çekilir (CF round-trip yok); yoksa public URL'e düşer.
 * - API hatası/boş yanıtta [] / undefined döner — mock fallback yok.
 * - BlogPostDto/BlogCategoryDto → mevcut BlogPost/BlogCategory şekline maplenir (tip korunur).
 * - Sadece yayınlanmış içerik (/blog/public/*) çekilir; admin yayınladığı yazı sitede görünür.
 */

const API_BASE =
  process.env.API_INTERNAL_URL ||
  process.env.NEXT_PUBLIC_API_URL ||
  "http://api:4000";

export interface BlogCategory {
  slug: string;
  name: string;
  description: string;
}

export interface BlogPost {
  slug: string;
  title: string;
  excerpt: string;
  content: string;
  coverTheme: string; // /api/mockup?theme=...
  authorName: string;
  authorRole: string;
  categorySlug: string;
  tags: string[];
  publishedAt: string; // ISO
  readingMinutes: number;
  seoTitle?: string;
  seoDescription?: string;
  /** Yazıya özel raster OG görseli (admin'den). Sosyal paylaşımda kullanılır; yoksa /og-default.png. */
  ogImage?: string;
}

// Mock içerik kaldırıldı — API'den gelir; hata/boş → [] / undefined.

// ─────────────────────────────────────────────────────────────────────────────
// API mapping (BlogPostDto/BlogCategoryDto → BlogPost/BlogCategory)
// ─────────────────────────────────────────────────────────────────────────────

/** Yaklaşık okuma süresi (dk) — DTO'da yok, içerik kelime sayısından türetilir (200 kelime/dk). */
function estimateReadingMinutes(content: string): number {
  const words = content.trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / 200));
}

/**
 * API blog yazısını (BlogPostDto) storefront BlogPost şekline eşler.
 * coverImage doluysa onu coverTheme alanına geçiriyoruz (sayfa /api/mockup?theme=<değer> kurar);
 * dolu URL ise sayfa onu olduğu gibi kullanır — bkz. blogCoverSrc().
 */
function mapPost(p: Record<string, unknown>): BlogPost {
  const slug = String(p.slug);
  const content = String(p.content ?? "");
  const category = (p.category ?? {}) as Record<string, unknown>;
  return {
    slug,
    title: String(p.title ?? slug),
    excerpt: String(p.excerpt ?? ""),
    content,
    coverTheme: String(p.coverImage || "brand"),
    authorName: String(p.authorName ?? "Markala"),
    authorRole: String(p.authorRole ?? ""),
    categorySlug: String(category.slug ?? p.categorySlug ?? ""),
    tags: Array.isArray(p.tags) ? (p.tags as string[]) : [],
    publishedAt: String(p.publishedAt ?? p.createdAt ?? new Date().toISOString()),
    readingMinutes: estimateReadingMinutes(content),
    seoTitle: (p.seoTitle as string | null) ?? undefined,
    seoDescription: (p.seoDescription as string | null) ?? undefined,
    ogImage: (p.ogImage as string | null) ?? undefined,
  };
}

function mapCategory(c: Record<string, unknown>): BlogCategory {
  return {
    slug: String(c.slug),
    name: String(c.name ?? c.slug),
    description: String(c.description ?? ""),
  };
}

async function fetchJson(path: string): Promise<unknown> {
  const res = await fetch(`${API_BASE}/api${path}`, { next: { revalidate: 60 } });
  if (!res.ok) throw new Error(`blog API ${path} -> ${res.status}`);
  return res.json();
}

/**
 * Bir blog yazısının kapak görseli kaynağı.
 * - coverTheme dolu bir URL ise (http veya / ile başlar) → doğrudan kullan.
 * - aksi halde mock theme adı → /api/mockup?theme=<ad>&w=<w>&h=<h>.
 */
export function blogCoverSrc(coverTheme: string, w: number, h: number): string {
  if (/^(https?:)?\/\//.test(coverTheme) || coverTheme.startsWith("/")) {
    return coverTheme;
  }
  return `/api/mockup?theme=${coverTheme}&w=${w}&h=${h}`;
}

// ─────────────────────────────────────────────────────────────────────────────
// CANLI veri erişimcileri (server). Hata/boş → [] / undefined.
// ─────────────────────────────────────────────────────────────────────────────

/** Tüm yayınlanmış yazılar (en yeni önce). API hatası/boş → []. */
export async function getBlogPosts(): Promise<BlogPost[]> {
  try {
    const data = await fetchJson("/blog/public/posts");
    if (!Array.isArray(data) || data.length === 0) return [];
    return (data as Record<string, unknown>[])
      .map(mapPost)
      .sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime());
  } catch {
    return [];
  }
}

/** Tek yazı (slug). API'de yoksa/hata → undefined. */
export async function getBlogPostBySlug(slug: string): Promise<BlogPost | undefined> {
  try {
    const data = await fetchJson(`/blog/public/posts/${encodeURIComponent(slug)}`);
    if (!data || typeof data !== "object") return undefined;
    return mapPost(data as Record<string, unknown>);
  } catch {
    return undefined;
  }
}

/** Tüm blog kategorileri. API hatası/boş → []. */
export async function getBlogCategories(): Promise<BlogCategory[]> {
  try {
    const data = await fetchJson("/blog/public/categories");
    if (!Array.isArray(data) || data.length === 0) return [];
    return (data as Record<string, unknown>[]).map(mapCategory);
  } catch {
    return [];
  }
}

/** Tek kategori (slug). Bulunamazsa undefined. */
export async function getBlogCategoryBySlug(slug: string): Promise<BlogCategory | undefined> {
  const list = await getBlogCategories();
  return list.find((c) => c.slug === slug);
}

/** Bir kategorinin yazıları (en yeni önce). */
export async function getBlogPostsByCategory(slug: string): Promise<BlogPost[]> {
  const posts = await getBlogPosts();
  return posts.filter((p) => p.categorySlug === slug);
}

/** Benzer yazılar — aynı kategori + ortak etiket puanlamasıyla. */
export async function getRelatedPosts(slug: string, count = 3): Promise<BlogPost[]> {
  const posts = await getBlogPosts();
  const post = posts.find((p) => p.slug === slug);
  if (!post) return [];
  return posts
    .filter((p) => p.slug !== slug)
    .map((p) => {
      let score = 0;
      if (p.categorySlug === post.categorySlug) score += 5;
      score += p.tags.filter((t) => post.tags.includes(t)).length * 2;
      return { post: p, score };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, count)
    .map((x) => x.post);
}
