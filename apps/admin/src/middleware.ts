import { NextRequest, NextResponse } from "next/server";
import {
  signSession, verifySession, needsRefresh,
  SESSION_COOKIE, SESSION_MAX_AGE, type AdminSession,
} from "@/lib/admin-session";

const PUBLIC_PATHS = ["/giris", "/api/auth/login"];
const API_URL = process.env.API_URL ?? process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

function parseRefreshFromSetCookie(setCookies: string[]): string | null {
  for (const c of setCookies) {
    const m = c.match(/(?:^|;\s*)mk_refresh=([^;]+)/);
    if (m) return decodeURIComponent(m[1]!);
  }
  return null;
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (pathname.startsWith("/_next") || pathname.startsWith("/favicon") || pathname === "/robots.txt") {
    return NextResponse.next();
  }
  if (PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(p + "/"))) {
    return NextResponse.next();
  }

  // Fail-closed: imza anahtarı yapılandırılmamışsa kimseyi doğrulama (zayıf/boş anahtarla oturum kabul etme).
  const secret = process.env.ADMIN_SESSION_SECRET;
  if (!secret || secret.length < 32) {
    const url = new URL("/giris", req.url);
    url.searchParams.set("redirect", pathname);
    return NextResponse.redirect(url);
  }

  const token = req.cookies.get(SESSION_COOKIE)?.value;
  const session = await verifySession(token, secret);

  if (!session) {
    const url = new URL("/giris", req.url);
    url.searchParams.set("redirect", pathname);
    return NextResponse.redirect(url);
  }

  // Access token süresi yakınsa proaktif refresh.
  if (needsRefresh(session.accessToken)) {
    try {
      const r = await fetch(`${API_URL}/api/auth/refresh`, {
        method: "POST",
        headers: { Cookie: `mk_refresh=${encodeURIComponent(session.refreshToken)}` },
      });
      if (r.ok) {
        const data = (await r.json()) as { accessToken: string };
        const newRefresh = parseRefreshFromSetCookie(r.headers.getSetCookie?.() ?? []) ?? session.refreshToken;
        const updated: AdminSession = { ...session, accessToken: data.accessToken, refreshToken: newRefresh };
        const newToken = await signSession(updated, secret);
        const res = NextResponse.next();
        res.cookies.set(SESSION_COOKIE, newToken, {
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          sameSite: "lax",
          path: "/",
          maxAge: SESSION_MAX_AGE,
        });
        return res;
      }
      // refresh başarısız → oturumu temizle
      const url = new URL("/giris", req.url);
      const res = NextResponse.redirect(url);
      res.cookies.set(SESSION_COOKIE, "", { path: "/", maxAge: 0 });
      return res;
    } catch {
      // API ulaşılamıyorsa mevcut (muhtemelen geçerli) token ile devam et
      return NextResponse.next();
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
