/**
 * DEV-ONLY: Şifre hash üretmek için yardımcı endpoint.
 * /api/auth/setup-hash?password=YENI_SIFREN ile çağır,
 * dönen "salt$hash" değerini .env'deki ADMIN_PASSWORD_HASH'e yapıştır.
 *
 * Production'da NODE_ENV=production iken otomatik 404 döner.
 */
import { NextRequest, NextResponse } from "next/server";
import { hashPassword } from "@/lib/admin-auth";

export const runtime = "edge";

export async function GET(req: NextRequest) {
  if (process.env.NODE_ENV === "production") {
    return new NextResponse("Not Found", { status: 404 });
  }
  const password = req.nextUrl.searchParams.get("password");
  if (!password || password.length < 8) {
    return NextResponse.json(
      { error: "?password=... parametresi en az 8 karakter olmalı." },
      { status: 400 },
    );
  }
  const hash = await hashPassword(password);
  return NextResponse.json({
    instruction:
      "Aşağıdaki ADMIN_PASSWORD_HASH değerini .env.local dosyana yapıştır (tırnaksız).",
    ADMIN_PASSWORD_HASH: hash,
  });
}
