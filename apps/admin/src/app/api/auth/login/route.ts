import { NextRequest, NextResponse } from "next/server";
import { signSession, SESSION_COOKIE, SESSION_MAX_AGE, type AdminSession } from "@/lib/admin-session";

export const runtime = "nodejs"; // getSetCookie + fetch; nodejs en güvenli

const API_URL = process.env.API_URL ?? process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

/**
 * Gerçek ziyaretçi IP'sini API'ye taşır (2026-08-31 denetim bulgusu).
 *
 * Bu rota bir SUNUCU-TARAFI proxy'dir: aşağıdaki fetch API'ye admin konteynerinden gider.
 * IP iletilmezse API'nin `req.ip` değeri HER giriş denemesinde aynı (konteyner IP'si) olur ve
 * `rate-limit.ts:47` kovayı `"/auth/login:<konteyner-ip>"` anahtarıyla tutar — yani kova TÜM
 * panel kullanıcıları için ORTAK hale gelir. İki sonucu vardı:
 *   1) Kimliği doğrulanmamış biri dakikada birkaç istekle kovayı sürekli dolu tutup
 *      super_admin dahil herkesin panele girmesini engelleyebilirdi (429).
 *   2) Başarısız giriş kayıtlarında saldırganın gerçek IP'si hiç görünmüyordu (adli iz kaybı).
 *
 * API tarafında `trust proxy = 1` zaten açık, yani iletilen başlık doğru okunur.
 * Cloudflare arkasında `cf-connecting-ip` en güvenilir kaynak; yoksa XFF'in İLK kaydına düşülür.
 */
function istemciIp(req: NextRequest): string | null {
  const cf = req.headers.get("cf-connecting-ip");
  if (cf) return cf.trim();
  const xff = req.headers.get("x-forwarded-for");
  const ilk = xff?.split(",")[0]?.trim();
  return ilk || null;
}

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
    const ip = istemciIp(req);
    apiRes = await fetch(`${API_URL}/api/auth/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(ip ? { "x-forwarded-for": ip } : {}),
      },
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

  // 2026-08-21: panel grupları eklendi (tasarimci, muhasebe). Müşteri rolü hâlâ giremez.
  const PANEL_ROLES = ["admin", "super_admin", "tasarimci", "muhasebe"];
  if (!PANEL_ROLES.includes(data.user.role)) {
    return NextResponse.json({ error: "Bu hesabın yönetim paneline erişim yetkisi yok." }, { status: 403 });
  }

  const refreshToken = parseRefreshFromSetCookie(apiRes.headers.getSetCookie?.() ?? []) ?? "";

  // İzinleri girişte API'den al ve oturum çerezine yaz (2026-08-21). Middleware her
  // sayfada bunu okur — rol→izin haritası panele KOPYALANMAZ, API kaynak kalır.
  // Alınamazsa perms boş kalır; middleware kısıtlı rolleri yeniden girişe yollar.
  let perms: string[] | undefined;
  try {
    const meRes = await fetch(`${API_URL}/api/auth/me`, {
      headers: { Authorization: `Bearer ${data.accessToken}` },
    });
    if (meRes.ok) {
      const me = (await meRes.json()) as { permissions?: string[] };
      if (Array.isArray(me.permissions)) perms = me.permissions;
    }
  } catch {
    // sessiz — aşağıda perms'siz oturum kurulur
  }

  const secret = process.env.ADMIN_SESSION_SECRET;
  if (!secret || secret.length < 32) {
    return NextResponse.json({ error: "ADMIN_SESSION_SECRET eksik/kısa." }, { status: 500 });
  }

  const session: AdminSession = {
    accessToken: data.accessToken,
    refreshToken,
    email: data.user.email,
    name: data.user.email,
    role: data.user.role as AdminSession["role"],
    perms,
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
