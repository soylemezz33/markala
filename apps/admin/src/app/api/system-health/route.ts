import { NextResponse } from "next/server";
import { getAdminApi } from "@/lib/api";

// nodejs: session cookie → accessToken ile backend health'ini (DB kontrolü dahil) sorgular.
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
const API_URL = process.env.API_URL ?? process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

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
    // E-posta arızası (2026-09-03): herkese açık /api/health/mail; 503 = arızalı. Gövde her iki
    // durumda da JSON (ok, lastFailureAt, failedLast15m, lastError).
    let mail: Record<string, unknown> | null = null;
    try {
      const r = await fetch(`${API_URL}/api/health/mail`, { cache: "no-store" });
      mail = (await r.json().catch(() => null)) as Record<string, unknown> | null;
      if (mail && typeof mail.ok !== "boolean") mail.ok = r.ok;
    } catch {
      mail = null;
    }
    return NextResponse.json(
      { ok, status: res?.status ?? "unknown", mail },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch {
    return NextResponse.json({ ok: false, status: "down" }, { headers: { "Cache-Control": "no-store" } });
  }
}
