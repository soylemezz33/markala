import { NextRequest, NextResponse } from "next/server";

// Tasarımı baskıya-hazır CMYK PDF'e dönüştür — backend /api/designs/:id/render proxy.
// Client 300dpi PNG gönderir; backend pdf-lib + Ghostscript ile PDF üretir, secure saklar.
export const runtime = "nodejs";

const API_BASE =
  process.env.API_INTERNAL_URL || process.env.NEXT_PUBLIC_API_URL || "http://api:4000";

interface RenderPayload {
  id?: string;
  pngBase64?: string;
  sessionId?: string;
}

export async function POST(req: NextRequest) {
  let body: RenderPayload;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "invalid_json" }, { status: 400 });
  }
  if (!body.id || !body.pngBase64) {
    return NextResponse.json({ ok: false, error: "missing_fields" }, { status: 400 });
  }

  const auth = req.headers.get("authorization") ?? undefined;
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (auth) headers.Authorization = auth;

  try {
    const res = await fetch(`${API_BASE}/api/designs/${encodeURIComponent(body.id)}/render`, {
      method: "POST",
      headers,
      body: JSON.stringify({ pngBase64: body.pngBase64, sessionId: body.sessionId }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      const m = (data as { message?: unknown })?.message;
      const errMsg = Array.isArray(m) ? m.join(", ") : typeof m === "string" ? m : undefined;
      return NextResponse.json({ ok: false, status: res.status, error: errMsg }, { status: 502 });
    }
    return NextResponse.json(data);
  } catch (err) {
    console.error("[tasarim-render] backend erişilemedi:", (err as Error).message);
    return NextResponse.json({ ok: false, error: "backend_unreachable" }, { status: 502 });
  }
}
