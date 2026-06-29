import { NextRequest, NextResponse } from "next/server";

// Baskı-PDF'i indir — backend /api/designs/:id/print proxy (secure, sahiplik kontrollü).
export const runtime = "nodejs";

const API_BASE =
  process.env.API_INTERNAL_URL || process.env.NEXT_PUBLIC_API_URL || "http://api:4000";

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const sessionId = req.nextUrl.searchParams.get("sessionId") ?? "";
  const auth = req.headers.get("authorization") ?? undefined;
  const headers: Record<string, string> = {};
  if (auth) headers.Authorization = auth;

  const url = `${API_BASE}/api/designs/${encodeURIComponent(params.id)}/print${
    sessionId ? `?sessionId=${encodeURIComponent(sessionId)}` : ""
  }`;

  try {
    const res = await fetch(url, { headers, cache: "no-store" });
    if (!res.ok) {
      return NextResponse.json({ ok: false, status: res.status }, { status: res.status === 404 ? 404 : 502 });
    }
    const buf = await res.arrayBuffer();
    return new NextResponse(buf, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": 'attachment; filename="tasarim-baski.pdf"',
        "Cache-Control": "private, no-store",
      },
    });
  } catch (err) {
    console.error("[tasarim-baski] backend erişilemedi:", (err as Error).message);
    return NextResponse.json({ ok: false, error: "backend_unreachable" }, { status: 502 });
  }
}
