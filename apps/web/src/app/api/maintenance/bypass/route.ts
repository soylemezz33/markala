import { NextRequest, NextResponse } from "next/server";
import {
  BYPASS_COOKIE,
  BYPASS_MAX_AGE_S,
  getApiBase,
  signBypass,
} from "@/lib/maintenance";

/**
 * Bakım modu bypass çerezi yönetimi (same-origin, markala.com.tr).
 *
 * Storefront auth client-side olduğundan sunucu geleni admin tanıyamaz. Admin storefront'a giriş
 * yaptığında auth-store burayı Bearer token ile çağırır; biz token'ı API /auth/me ile DOĞRULARIZ
 * (kullanıcı rolü sahteleyemesin) ve admin ise imzalı httpOnly `mk_preview` çerezi yazarız.
 * Middleware bu çerezi okuyup bakım ekranını atlar.
 */

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function cookieOptions(maxAge: number) {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    maxAge,
  };
}

export async function POST(req: NextRequest) {
  const auth = req.headers.get("authorization");
  if (!auth?.startsWith("Bearer ")) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }

  // Rolü API'ye doğrulat — istemci "ben adminim" diyemesin.
  let role: string | undefined;
  try {
    const r = await fetch(`${getApiBase()}/api/auth/me`, {
      headers: { authorization: auth },
      cache: "no-store",
    });
    if (!r.ok) return NextResponse.json({ ok: false }, { status: 401 });
    const user = (await r.json()) as { role?: string };
    role = user?.role;
  } catch {
    return NextResponse.json({ ok: false }, { status: 502 });
  }

  if (role !== "admin" && role !== "super_admin") {
    // Admin değil → varsa eski bypass çerezini temizle, reddet.
    const res = NextResponse.json({ ok: false }, { status: 403 });
    res.cookies.set(BYPASS_COOKIE, "", cookieOptions(0));
    return res;
  }

  const value = await signBypass(Date.now() + BYPASS_MAX_AGE_S * 1000);
  const res = NextResponse.json({ ok: true });
  res.cookies.set(BYPASS_COOKIE, value, cookieOptions(BYPASS_MAX_AGE_S));
  return res;
}

export async function DELETE() {
  const res = NextResponse.json({ ok: true });
  res.cookies.set(BYPASS_COOKIE, "", cookieOptions(0));
  return res;
}
