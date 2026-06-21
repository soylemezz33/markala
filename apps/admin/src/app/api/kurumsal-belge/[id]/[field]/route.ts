import { NextRequest, NextResponse } from "next/server";
import { getAdminSession } from "@/lib/api";

// Binary proxy — admin oturum token'ı SUNUCUDA kalır, tarayıcıya sızmaz.
export const runtime = "nodejs";

const API_URL = process.env.API_URL ?? process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

/**
 * Hassas kurumsal belgeyi indir — admin oturumu doğrulanır, ardından API'nin
 * auth-korumalı GET /corporate-applications/:id/document/:field ucundan bearer
 * token ile çekilip tarayıcıya stream edilir. Belge hiçbir zaman public değildir.
 */
export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string; field: string } },
) {
  const session = await getAdminSession();
  if (!session?.accessToken) {
    return NextResponse.json({ error: "Yetkisiz." }, { status: 401 });
  }
  const { id, field } = params;
  if (field !== "tax" && field !== "signature") {
    return NextResponse.json({ error: "Geçersiz belge türü." }, { status: 400 });
  }

  const upstream = await fetch(
    `${API_URL}/api/corporate-applications/${encodeURIComponent(id)}/document/${field}`,
    { headers: { Authorization: `Bearer ${session.accessToken}` }, cache: "no-store" },
  );
  if (!upstream.ok) {
    return NextResponse.json(
      { error: "Belge bulunamadı." },
      { status: upstream.status === 401 ? 401 : 404 },
    );
  }

  const buf = await upstream.arrayBuffer();
  const headers = new Headers();
  headers.set("Content-Type", upstream.headers.get("content-type") ?? "application/octet-stream");
  const cd = upstream.headers.get("content-disposition");
  if (cd) headers.set("Content-Disposition", cd);
  headers.set("Cache-Control", "private, no-store");
  return new NextResponse(buf, { status: 200, headers });
}
