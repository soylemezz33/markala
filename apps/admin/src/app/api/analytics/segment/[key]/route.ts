import { NextResponse } from "next/server";
import { getAdminApi } from "@/lib/api";

// nodejs: server-side BFF (session cookie → accessToken). Tarayıcı token görmez.
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Bir segmentin müşteri listesi — analitik sayfasındaki segment kartı tıklamasıyla
 * istemci tarafından çağrılır. Token cookie'den çözülür (BFF), API'ye iletilir.
 */
export async function GET(
  _req: Request,
  { params }: { params: { key: string } },
) {
  try {
    const api = await getAdminApi();
    const result = await api.analytics.segment(params.key);
    return NextResponse.json(result);
  } catch {
    return NextResponse.json(
      { error: "Segment yüklenemedi" },
      { status: 502 },
    );
  }
}
