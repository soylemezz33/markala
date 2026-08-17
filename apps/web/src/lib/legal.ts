/**
 * Yasal sayfa veri katmanı — CANLI API (admin "Yasal"dan yönetir).
 *
 * Tasarım (catalog.ts/blog.ts deseniyle tutarlı):
 * - Server-only: bu fonksiyonlar SUNUCUDA çağrılır. apiClient KULLANILMAZ.
 * - LegalPageDto (slug/title/content/version/updatedAt) → storefront LegalPage (slug/title/body/lastUpdated) şekline maplenir.
 * - HER fonksiyon API hatası/boş → @markala/mock-data fallback'ine düşer → yasal sayfalar ASLA boş kalmaz.
 * - Sadece aktif sayfalar (/legal/public) çekilir; admin düzenlemesi siteye yansır.
 */

import { getLegalPage as getMockLegalPage, getAllLegalSlugs as getMockLegalSlugs, type LegalPage } from "@markala/mock-data";

export type { LegalPage };

const API_BASE =
  process.env.API_INTERNAL_URL ||
  process.env.NEXT_PUBLIC_API_URL ||
  "http://api:4000";

/** LegalPageDto → storefront LegalPage. content→body, updatedAt→lastUpdated. */
function mapPage(p: Record<string, unknown>): LegalPage {
  const slug = String(p.slug);
  const mock = getMockLegalPage(slug);
  const updated = String(p.updatedAt ?? p.createdAt ?? "");
  return {
    slug,
    title: String(p.title ?? mock?.title ?? slug),
    body: String(p.content ?? mock?.body ?? ""),
    // updatedAt ISO → YYYY-MM-DD (lastUpdated mock formatıyla aynı); yoksa mock'a düş.
    lastUpdated: updated ? updated.slice(0, 10) : (mock?.lastUpdated ?? ""),
  };
}

async function fetchJson(path: string): Promise<unknown> {
  const res = await fetch(`${API_BASE}/api${path}`, { next: { revalidate: 60 } });
  if (!res.ok) throw new Error(`legal API ${path} -> ${res.status}`);
  return res.json();
}

/** Tüm aktif yasal sayfalar. API hatası/boş → mock fallback. */
export async function getLegalPages(): Promise<LegalPage[]> {
  try {
    const data = await fetchJson("/legal/public");
    if (!Array.isArray(data) || data.length === 0) return mockLegalPages();
    return (data as Record<string, unknown>[]).map(mapPage);
  } catch {
    return mockLegalPages();
  }
}

/** Tek yasal sayfa (slug). API'de yoksa/hata → mock fallback. */
export async function getLegalPage(slug: string): Promise<LegalPage | undefined> {
  try {
    const data = await fetchJson(`/legal/public/${encodeURIComponent(slug)}`);
    if (!data || typeof data !== "object") throw new Error("boş yanıt");
    return mapPage(data as Record<string, unknown>);
  } catch {
    return getMockLegalPage(slug);
  }
}

/**
 * generateStaticParams / sitemap için slug listesi — API ∪ mock BİRLEŞİMİ.
 *
 * getLegalPage() API'de bulunmayan slug'ı sessizce mock'tan servis eder (yukarıdaki catch).
 * Yani API'de olmayan ama mock'ta olan sayfalar canlıda 200 döner ve footer'dan linklidir.
 * Yalnız API listesini dönmek bu sayfaları sitemap'ten ve prerender'dan dışarıda bırakıyordu:
 * 2026-08 denetiminde iade, kargo, on-bilgilendirme, kullanim-kosullari, cerez sitemap'te
 * YOKTU — iade ve kargo politikasının keşfedilebilirliği Merchant Center incelemesinde
 * doğrudan değerlendirilen bir kriter. Birleşim, "servis edilen her yasal sayfa sitemap'te"
 * garantisini verir; admin bir sayfayı API'ye eklediğinde Set tekilleştirmesi çift kayıt önler.
 */
export async function getLegalSlugs(): Promise<string[]> {
  const mockSlugs = getMockLegalSlugs();
  try {
    const data = await fetchJson("/legal/public");
    if (!Array.isArray(data) || data.length === 0) return mockSlugs;
    const apiSlugs = (data as Record<string, unknown>[]).map((p) => String(p.slug));
    return [...new Set([...apiSlugs, ...mockSlugs])];
  } catch {
    return mockSlugs;
  }
}

/** Mock yasal sayfaların tamamı (LegalPage[]). */
function mockLegalPages(): LegalPage[] {
  return getMockLegalSlugs()
    .map((slug) => getMockLegalPage(slug))
    .filter((p): p is LegalPage => Boolean(p));
}
