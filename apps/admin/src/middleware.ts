import { NextRequest, NextResponse } from "next/server";
import {
  signSession, verifySession, needsRefresh,
  SESSION_COOKIE, SESSION_MAX_AGE, type AdminSession,
} from "@/lib/admin-session";
import { permForPath } from "@/lib/route-perms";

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

  // ── SAYFA YETKİ KONTROLÜ (2026-08-21) ─────────────────────────────────────────
  // Menü gizlemek yetmiyordu: tasarımcı /ayarlar/genel'e URL'den girip boş form
  // görüyordu (Hasan bildirdi). Erişim artık BURADA, tek yol haritasından zorlanır
  // (lib/route-perms.ts — menü de aynı haritayı kullanır, tutarsızlık imkânsız).
  // /api/* hariç: o uçların kendi kontrolleri var; asıl güvenlik sınırı da zaten
  // API'deki RolesGuard — burası kullanıcıyı anlamsız/boş sayfalardan uzak tutar.
  if (!pathname.startsWith("/api/")) {
    const need = permForPath(pathname);
    if (need && session.role !== "admin" && session.role !== "super_admin") {
      if (!session.perms) {
        // Eski oturum çerezi (perms alanı yok) → çerezi temizleyip yeniden girişe
        // yolla ki oturum izin listesiyle kurulsun. Bir kereye mahsus yaşanır.
        const url = new URL("/giris", req.url);
        url.searchParams.set("redirect", pathname);
        const res = NextResponse.redirect(url);
        res.cookies.set(SESSION_COOKIE, "", { path: "/", maxAge: 0 });
        return res;
      }
      if (!session.perms.includes(need)) {
        // Yetkisi olmayan sayfa → dashboard. ("/" haritada yok = tüm panel rollerine açık.)
        return NextResponse.redirect(new URL("/", req.url));
      }
    }
  }

  // Access token süresi yakınsa proaktif refresh.
  if (needsRefresh(session.accessToken)) {
    try {
      // IP iletimi ZORUNLU: bu çağrı admin konteynerinden gidiyor, /auth/refresh ise
      // 30 istek/dk ile sınırlı (main.ts:75). İletilmezse kova TÜM panel kullanıcıları
      // için ortak olur ve yoğun saatte herkes 429 yiyip panelden düşer (2026-08-31).
      const ip =
        req.headers.get("cf-connecting-ip") ||
        req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
        null;
      const r = await fetch(`${API_URL}/api/auth/refresh`, {
        method: "POST",
        headers: {
          Cookie: `mk_refresh=${encodeURIComponent(session.refreshToken)}`,
          ...(ip ? { "x-forwarded-for": ip } : {}),
        },
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
    } catch (e) {
      // API ulaşılamıyorsa mevcut (muhtemelen geçerli) token ile devam et
      console.warn('[middleware] refresh token API ulaşılamadı, mevcut token ile devam:', (e as Error).message ?? e);
      return NextResponse.next();
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
