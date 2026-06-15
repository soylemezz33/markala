import { NextRequest, NextResponse } from "next/server";
import { signSession, SESSION_COOKIE, SESSION_MAX_AGE, type AdminSession } from "@/lib/admin-session";

export const runtime = "nodejs"; // getSetCookie + fetch; nodejs en güvenli

const API_URL = process.env.API_URL ?? process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

function parseRefreshFromSetCookie(setCookies: string[]): string | null {
  for (const c of setCookies) {
    const m = c.match(/(?:^|;\s*)mk_refresh=([^;]+)/);
    if (m) return decodeURIComponent(m[1]!);
  }
  return null;
}

export async function POST(req: NextRequest) {
  let body: { email?: string; password?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Geçersiz istek." }, { status: 400 });
  }
  const { email, password } = body;
  if (!email || !password) {
    return NextResponse.json({ error: "E-posta ve şifre zorunlu." }, { status: 400 });
  }

  let apiRes: Response;
  try {
    apiRes = await fetch(`${API_URL}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
  } catch {
    return NextResponse.json({ error: "API'ye ulaşılamadı." }, { status: 502 });
  }

  const data = (await apiRes.json().catch(() => ({}))) as {
    accessToken?: string;
    user?: { email: string; role: string };
    message?: string;
  };

  if (!apiRes.ok || !data.accessToken || !data.user) {
    return NextResponse.json({ error: data.message ?? "Giriş başarısız." }, { status: apiRes.status || 401 });
  }

  if (data.user.role !== "admin" && data.user.role !== "super_admin") {
    return NextResponse.json({ error: "Bu hesabın yönetim paneline erişim yetkisi yok." }, { status: 403 });
  }

  const refreshToken = parseRefreshFromSetCookie(apiRes.headers.getSetCookie?.() ?? []) ?? "";

  const secret = process.env.ADMIN_SESSION_SECRET;
  if (!secret || secret.length < 32) {
    return NextResponse.json({ error: "ADMIN_SESSION_SECRET eksik/kısa." }, { status: 500 });
  }

  const session: AdminSession = {
    accessToken: data.accessToken,
    refreshToken,
    email: data.user.email,
    name: data.user.email,
    role: data.user.role as "admin" | "super_admin",
    iat: Math.floor(Date.now() / 1000),
  };
  const token = await signSession(session, secret);

  const res = NextResponse.json({ ok: true, user: { email: session.email, role: session.role } });
  res.cookies.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_MAX_AGE,
  });
  return res;
}
