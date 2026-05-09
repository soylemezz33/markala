import { NextRequest, NextResponse } from "next/server";
import {
  verifyCredentials,
  signSession,
  SESSION_COOKIE,
  SESSION_MAX_AGE,
} from "@/lib/admin-auth";

export const runtime = "edge";

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

  try {
    const session = await verifyCredentials(email, password);
    if (!session) {
      return NextResponse.json(
        { error: "E-posta veya şifre hatalı." },
        { status: 401 },
      );
    }

    const token = await signSession(session);
    const res = NextResponse.json({
      ok: true,
      user: { email: session.email, name: session.name, role: session.role },
    });
    res.cookies.set(SESSION_COOKIE, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: SESSION_MAX_AGE,
    });
    return res;
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Sunucu hatası.";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
