import { NextRequest, NextResponse } from "next/server";

// Editör tasarımını backend'e (NestJS /api/designs) kaydet/güncelle. Sunucu-içi çağrı (CORS yok).
// Üye → Authorization header geçer (userId); misafir → sessionId body'de.
export const runtime = "nodejs";

const API_BASE =
  process.env.API_INTERNAL_URL || process.env.NEXT_PUBLIC_API_URL || "http://api:4000";

interface SavePayload {
  id?: string; // varsa güncelle (PUT), yoksa oluştur (POST)
  name?: string;
  document?: unknown;
  widthMm?: number;
  heightMm?: number;
  bleedMm?: number;
  previewUrl?: string;
  sessionId?: string;
  templateId?: string;
  productId?: string;
}

export async function POST(req: NextRequest) {
  let body: SavePayload;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "invalid_json" }, { status: 400 });
  }

  if (!body.document || typeof body.document !== "object") {
    return NextResponse.json({ ok: false, error: "empty_document" }, { status: 400 });
  }

  const auth = req.headers.get("authorization") ?? undefined;
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (auth) headers.Authorization = auth;

  const isUpdate = Boolean(body.id);
  const url = isUpdate
    ? `${API_BASE}/api/designs/${encodeURIComponent(body.id as string)}`
    : `${API_BASE}/api/designs`;

  // PUT (güncelle): yalnız değişebilir alanlar. POST (oluştur): tam payload + dims zorunlu.
  const payload = isUpdate
    ? { name: body.name, document: body.document, previewUrl: body.previewUrl, sessionId: body.sessionId }
    : {
        name: body.name,
        document: body.document,
        widthMm: body.widthMm,
        heightMm: body.heightMm,
        bleedMm: body.bleedMm,
        previewUrl: body.previewUrl,
        sessionId: body.sessionId,
        templateId: body.templateId,
        productId: body.productId,
      };

  try {
    const res = await fetch(url, {
      method: isUpdate ? "PUT" : "POST",
      headers,
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      let detail: unknown;
      try {
        detail = await res.json();
      } catch {}
      const m = (detail as { message?: unknown })?.message;
      const errMsg = Array.isArray(m) ? m.join(", ") : typeof m === "string" ? m : undefined;
      return NextResponse.json({ ok: false, status: res.status, error: errMsg }, { status: 502 });
    }
    const data = (await res.json()) as { id?: string };
    return NextResponse.json({ ok: true, id: data.id });
  } catch (err) {
    console.error("[tasarim-kaydet] backend erişilemedi:", (err as Error).message);
    return NextResponse.json({ ok: false, error: "backend_unreachable" }, { status: 502 });
  }
}
