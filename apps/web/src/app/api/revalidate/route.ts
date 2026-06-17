import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";

export const runtime = "nodejs";

/**
 * Admin → storefront ANLIK cache temizleme. Admin (ayrı Next app) bir ürün/kategori düzenleyince
 * bu endpoint'i çağırır; storefront ISR cache'i hemen tazelenir (60sn beklemeden). Paylaşılan
 * gizli anahtar (REVALIDATE_SECRET) ile korunur. Secret yoksa endpoint devre dışıdır (no-op 200).
 */
export async function POST(req: NextRequest) {
  const expected = process.env.REVALIDATE_SECRET;
  if (!expected) return NextResponse.json({ ok: false, reason: "disabled" });

  const got = req.headers.get("x-revalidate-secret") ?? new URL(req.url).searchParams.get("secret");
  if (got !== expected) return NextResponse.json({ ok: false }, { status: 401 });

  let body: { paths?: string[] } = {};
  try {
    body = await req.json();
  } catch {
    // gövde opsiyonel
  }

  // Katalog değişiklikleri tüm ürün-içeren sayfaları etkileyebilir → topluca tazele.
  const staticPaths = body.paths?.length
    ? body.paths
    : ["/", "/urunler", "/kategoriler", "/fiyat-listesi"];
  for (const p of staticPaths) {
    try {
      revalidatePath(p);
    } catch {
      /* yoksay */
    }
  }
  // Dinamik ürün/kategori sayfalarının TÜMÜ
  try {
    revalidatePath("/urun/[slug]", "page");
    revalidatePath("/kategori/[slug]", "page");
  } catch {
    /* yoksay */
  }

  return NextResponse.json({ ok: true, revalidated: staticPaths });
}
