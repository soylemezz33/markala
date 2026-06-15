import { NextResponse } from "next/server";
import { getAdminSession } from "@/lib/api";
import { SESSION_COOKIE } from "@/lib/admin-session";

export const runtime = "nodejs";
const API_URL = process.env.API_URL ?? process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

export async function POST() {
  const session = await getAdminSession();
  if (session?.refreshToken) {
    await fetch(`${API_URL}/api/auth/logout`, {
      method: "POST",
      headers: { Cookie: `mk_refresh=${encodeURIComponent(session.refreshToken)}` },
    }).catch(() => undefined);
  }
  const res = NextResponse.json({ ok: true });
  res.cookies.set(SESSION_COOKIE, "", { path: "/", maxAge: 0 });
  return res;
}
