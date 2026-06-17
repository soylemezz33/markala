import { NextResponse } from "next/server";
import { getAdminApi } from "@/lib/api";

// nodejs: session cookie → accessToken ile backend health'ini (DB kontrolü dahil) sorgular.
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Sistem sağlığı — backend GET /api/health'i proxy'ler (API process ayakta mı?).
 * Admin footer rozeti bu sonuca bağlanır: API erişilemezse "Sorun var" gösterilir
 * (önceden sabit yeşil "Operasyonel" idi — API/DB çökse bile yeşil kalıyordu).
 */
export async function GET() {
  try {
    const api = await getAdminApi();
    const res = await api.health();
    const ok = res?.status === "ok";
    return NextResponse.json(
      { ok, status: res?.status ?? "unknown" },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch {
    return NextResponse.json({ ok: false, status: "down" }, { headers: { "Cache-Control": "no-store" } });
  }
}
