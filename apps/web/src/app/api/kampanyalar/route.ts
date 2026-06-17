import { NextResponse } from "next/server";

export const runtime = "nodejs";

const API_BASE =
  process.env.API_INTERNAL_URL ||
  process.env.NEXT_PUBLIC_API_URL ||
  "http://api:4000";

const CATS = ["esnaf", "kurumsal", "etkinlik", "acilis", "promosyon"];

/**
 * Storefront kampanya paketleri — CANLI API (admin yönetir). Mock yerine DB'den okunur ki
 * sepete eklenen paketin slug'ı backend'de çözülebilsin (checkout çalışsın). Hata → client mock'a düşer.
 * API CampaignPackage (contents: TEXT) → web CampaignBundle şekline maplenir.
 */
export async function GET() {
  try {
    const res = await fetch(`${API_BASE}/api/campaign-packages/active`, { next: { revalidate: 30 } });
    if (!res.ok) return NextResponse.json({ ok: false }, { status: 502 });
    const data = await res.json();
    if (!Array.isArray(data)) return NextResponse.json({ ok: false }, { status: 502 });

    const bundles = data.map((p: Record<string, unknown>) => {
      const original = Number(p.listPrice ?? p.packagePrice) || 0;
      const bundle = Number(p.packagePrice) || 0;
      const contentsText = String(p.contents ?? "");
      const contents = contentsText
        .split(/\s*[+,]\s*/)
        .map((s) => s.trim())
        .filter(Boolean)
        .map((part) => ({ quantity: 1, productName: part }));
      const category = CATS.includes(String(p.category)) ? String(p.category) : "promosyon";
      const savings = original > bundle ? Math.round((1 - bundle / original) * 100) : 0;
      return {
        slug: String(p.slug),
        name: String(p.name),
        tagline: savings > 0 ? `%${savings} indirim` : "Hazır paket",
        description: contentsText,
        contents: contents.length ? contents : [{ quantity: 1, productName: contentsText || p.name }],
        originalPrice: original,
        bundlePrice: bundle,
        // Bundle'lar için ayrı görsel dosyası yok → mockup endpoint kategori bazlı branded
        // SVG üretir (her zaman 200). Statik /images/bundles/*.jpg DB slug'larında 404 veriyordu.
        imageUrl: `/api/mockup?category=${category}&w=800&h=600&theme=brand`,
        badge: "FIRSAT",
        category,
        isActive: true,
        designSupport: Boolean(p.designSupport),
      };
    });

    return NextResponse.json({ ok: true, bundles });
  } catch {
    return NextResponse.json({ ok: false }, { status: 502 });
  }
}
