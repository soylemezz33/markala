import { NextRequest, NextResponse } from "next/server";
import {
  verifySession,
  signSession,
  decodeJwtExp,
  SESSION_COOKIE,
  SESSION_MAX_AGE,
  type AdminSession,
} from "@/lib/admin-auth";

const PUBLIC_PATHS = ["/giris", "/api/auth/login"];
const API_URL = process.env.API_URL ?? process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";
const REFRESH_BUFFER_SEC = 60; // access token'ın son 60sn'sinde proaktif yenile

function cookieOpts() {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    maxAge: SESSION_MAX_AGE,
  };
}

async function tryRefresh(session: AdminSession): Promise<AdminSession | null> {
  try {
    const apiRes = await fetch(`${API_URL}/api/auth/refresh`, {
      method: "POST",
      headers: { Cookie: `mk_refresh=${session.refreshToken}` },
    });
    if (!apiRes.ok) return null;
    const data = (await apiRes.json()) as { accessToken: string };
    let refreshToken = session.refreshToken;
    for (const c of apiRes.headers.getSetCookie?.() ?? []) {
      const m = c.match(/(?:^|;\s*)mk_refresh=([^;]+)/);
      if (m?.[1]) refreshToken = decodeURIComponent(m[1]);
    }
    return {
      accessToken: data.accessToken,
      refreshToken,
      user: session.user,
      iat: Math.floor(Date.now() / 1000),
    };
  } catch {
    return null;
  }
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon") ||
    pathname === "/robots.txt"
  ) {
    return NextResponse.next();
  }

  if (PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(p + "/"))) {
    return NextResponse.next();
  }

  const token = req.cookies.get(SESSION_COOKIE)?.value;
  const session = await verifySession(token);

  if (!session) {
    const url = new URL("/giris", req.url);
    url.searchParams.set("redirect", pathname);
    return NextResponse.redirect(url);
  }

  // Proaktif refresh — access token süresi dolmak üzereyse yenile, yeni cookie'yi yaz.
  const exp = decodeJwtExp(session.accessToken);
  const now = Math.floor(Date.now() / 1000);
  if (exp !== null && exp - now < REFRESH_BUFFER_SEC) {
    const refreshed = await tryRefresh(session);
    if (refreshed) {
      const res = NextResponse.next();
      res.cookies.set(SESSION_COOKIE, await signSession(refreshed), cookieOpts());
      return res;
    }
    // Refresh başarısız (token revoke/expired) → oturumu kapat, login'e gönder.
    const url = new URL("/giris", req.url);
    url.searchParams.set("redirect", pathname);
    const res = NextResponse.redirect(url);
    res.cookies.set(SESSION_COOKIE, "", { path: "/", maxAge: 0 });
    return res;
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
