import { NextRequest, NextResponse } from "next/server";
import {
  signSession, verifySession, needsRefresh,
  SESSION_COOKIE, SESSION_MAX_AGE, type AdminSession,
} from "@/lib/admin-session";
import { permForPath, varsayilanRota } from "@/lib/route-perms";

const PUBLIC_PATHS = ["/giris", "/api/auth/login"];
const API_URL = process.env.API_URL ?? process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

/**
 * UÇUŞTAKİ REFRESH'LERİ BİRLEŞTİR (2026-09-03).
 *
 * Bu middleware HER istekte çalışıyor: sayfa, RSC ön-yükleme, /api/*. Access token'ın
 * son 60 saniyesine girildiğinde aynı anda uçan isteklerin HEPSİ refresh'e gidiyordu;
 * ilki rotasyonu yapıp diğerlerini geçersiz token'la bırakıyordu. API tarafına da pay
 * eklendi (auth.service refresh.race_tolerated) ama asıl çözüm isteği ÇOĞALTMAMAK:
 * aynı refresh token için uçuşta olan çağrı varsa yenisi açılmaz, o sözü paylaşırlar.
 *
 * Süreç-içi (tek admin konteyneri) yeterli: yarış aynı örnekte doğuyor. Harita sözden
 * sonra temizlenir, sınırsız büyümez.
 */
const ucustakiRefresh = new Map<string, Promise<{ accessToken: string; refreshToken: string } | null>>();

function refreshiPaylas(
  refreshToken: string,
  calistir: () => Promise<{ accessToken: string; refreshToken: string } | null>,
) {
  const mevcut = ucustakiRefresh.get(refreshToken);
  if (mevcut) return mevcut;
  const soz = calistir().finally(() => ucustakiRefresh.delete(refreshToken));
  ucustakiRefresh.set(refreshToken, soz);
  return soz;
}

function parseRefreshFromSetCookie(setCookies: string[]): string | null {
  for (const c of setCookies) {
    const m = c.match(/(?:^|;\s*)mk_refresh=([^;]+)/);
    if (m) return decodeURIComponent(m[1]!);
  }
  return null;
}

async function middlewareInner(req: NextRequest) {
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
        // Yetkisi olmayan sayfa → rolün girebildiği İLK sayfa.
        // Eskiden koşulsuz "/" idi; pano artık dashboard.read istediği için panosu
        // olmayan rol (kargo) sonsuz yönlendirmeye giriyordu. Ayrıca hedef mevcut yola
        // eşitse hiç yönlendirme yapma — döngüye karşı ikinci emniyet.
        const hedef = varsayilanRota(session.perms);
        if (hedef === pathname) {
          return NextResponse.redirect(new URL("/giris?hata=yetki", req.url));
        }
        return NextResponse.redirect(new URL(hedef, req.url));
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
      const yeni = await refreshiPaylas(session.refreshToken, async () => {
        const r = await fetch(`${API_URL}/api/auth/refresh`, {
          method: "POST",
          headers: {
            Cookie: `mk_refresh=${encodeURIComponent(session.refreshToken)}`,
            ...(ip ? { "x-forwarded-for": ip } : {}),
          },
        });
        if (!r.ok) return null;
        const data = (await r.json()) as { accessToken: string };
        const newRefresh = parseRefreshFromSetCookie(r.headers.getSetCookie?.() ?? []) ?? session.refreshToken;
        return { accessToken: data.accessToken, refreshToken: newRefresh };
      });
      if (yeni) {
        const updated: AdminSession = { ...session, accessToken: yeni.accessToken, refreshToken: yeni.refreshToken };
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

// ── ÖNBELLEK KİLİDİ (2026-09-02, olay) ────────────────────────────────────────
// Cloudflare'da vitrin için yazılmış "path eq /" cache kuralı host koşulu taşımadığı
// için admin.markala.com.tr/ da 120 sn kenar önbelleğine girdi ve giriş yapmış bir
// kullanıcının panosu (izin listesi, son siparişler) OTURUMSUZ isteklere de servis
// edildi (Hasan: "başka makinede admin girince tasarımcı arayüzü karşılıyor").
// Kural düzeltildi; ama panel ARTIK KENDİ KENDİNİ korur: statik varlıklar hariç
// (matcher dışı, immutable önbellekleri kalır) her yanıt — sayfa, yönlendirme,
// /api/* — "private, no-store" taşır. Hiçbir CDN/proxy kuralı bunu aşamaz; ileride
// benzer bir kural yazılsa bile paylaşımlı önbellek hep boş kalır.
export async function middleware(req: NextRequest) {
  const res = await middlewareInner(req);
  res.headers.set("Cache-Control", "private, no-store");
  return res;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
