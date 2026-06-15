import { NextRequest, NextResponse } from "next/server";
import { verifySession, SESSION_COOKIE } from "@/lib/admin-auth";

// nodejs: API'ye refresh token revoke çağrısı için.
export const runtime = "nodejs";

const API_URL = process.env.API_URL ?? process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

export async function POST(req: NextRequest) {
  // Refresh token'ı API tarafında da revoke et (rotation güvenliği).
  const session = await verifySession(req.cookies.get(SESSION_COOKIE)?.value);
  if (session?.refreshToken) {
    try {
      await fetch(`${API_URL}/api/auth/logout`, {
        method: "POST",
        headers: { Cookie: `mk_refresh=${session.refreshToken}` },
      });
    } catch {
      /* API'ye ulaşılamasa da yerel cookie temizlenir */
    }
  }
  const res = NextResponse.json({ ok: true });
  res.cookies.set(SESSION_COOKIE, "", { path: "/", maxAge: 0 });
  return res;
}
