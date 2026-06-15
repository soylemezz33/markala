import { NextRequest, NextResponse } from "next/server";
import { signSession, SESSION_COOKIE, SESSION_MAX_AGE, type AdminSession } from "@/lib/admin-auth";

// nodejs runtime: API'nin Set-Cookie (mk_refresh) başlığını getSetCookie() ile güvenle okumak için.
export const runtime = "nodejs";

const API_URL = process.env.API_URL ?? process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

function extractRefresh(setCookies: string[]): string | null {
  for (const c of setCookies) {
    const m = c.match(/(?:^|;\s*)mk_refresh=([^;]+)/);
    if (m?.[1]) return decodeURIComponent(m[1]);
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
    return NextResponse.json({ error: "Sunucuya ulaşılamadı." }, { status: 502 });
  }

  if (!apiRes.ok) {
    // 401 (hatalı kimlik) dahil tüm hatalar generic.
    return NextResponse.json({ error: "E-posta veya şifre hatalı." }, { status: 401 });
  }

  const data = (await apiRes.json()) as {
    accessToken: string;
    user: { id: string; email: string; fullName?: string; role: string };
  };

  const role = data.user?.role;
  if (role !== "admin" && role !== "super_admin") {
    return NextResponse.json(
      { error: "Bu hesabın yönetim paneline erişim yetkisi yok." },
      { status: 403 },
    );
  }

  const setCookies = apiRes.headers.getSetCookie?.() ?? [];
  const refreshToken = extractRefresh(setCookies);
  if (!refreshToken) {
    return NextResponse.json(
      { error: "Oturum başlatılamadı (refresh token alınamadı)." },
      { status: 502 },
    );
  }

  const session: AdminSession = {
    accessToken: data.accessToken,
    refreshToken,
    user: {
      id: data.user.id,
      email: data.user.email,
      fullName: data.user.fullName ?? data.user.email,
      role,
    },
    iat: Math.floor(Date.now() / 1000),
  };

  const token = await signSession(session);
  const res = NextResponse.json({
    ok: true,
    user: { email: session.user.email, name: session.user.fullName, role },
  });
  res.cookies.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_MAX_AGE,
  });
  return res;
}
