import { NextRequest, NextResponse } from "next/server";
import { getAdminSession } from "@/lib/api";

// Binary proxy — admin oturum token'ı SUNUCUDA kalır, tarayıcıya sızmaz.
export const runtime = "nodejs";

const API_URL = process.env.API_URL ?? process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

/** Yalnız önizleme görselleri: jpg/jpeg/png. Başka uzantı buradan ASLA servis edilmez. */
const ONIZLEME_KEY = /^[0-9a-f-]{36}\.(jpe?g|png)$/i;

/**
 * Tasarım ÖNİZLEMESİNİ panelde satır içi göster (2026-09-02, üretim ARGE Faz 2).
 *
 * API'nin GET /uploads/design/:key ucu her dosyayı `attachment` olarak verir (yüklenen
 * HTML/SVG tarayıcı bağlamında çalışmasın diye — doğru karar). Ama panelde "hangi bayrak
 * kimin" için küçük görsel GÖRÜNMELİ; bu route aynı korumalı uçtan çekip yalnız görsel
 * anahtarlar için `inline` verir. İçerik tipi upstream'e değil UZANTIYA göre yazılır:
 * .jpg adıyla yüklenmiş bir HTML dosyası bile image/jpeg olarak döner ve render olmaz.
 *
 * Aynı origin → CSP img-src 'self' ile uyumlu. Anahtar uuid olduğundan değişmez;
 * kullanıcıya özel önbellek güvenli (private).
 */
export async function GET(_req: NextRequest, { params }: { params: { key: string } }) {
  const session = await getAdminSession();
  if (!session?.accessToken) {
    return NextResponse.json({ error: "Yetkisiz." }, { status: 401 });
  }
  const key = params.key;
  if (!ONIZLEME_KEY.test(key)) {
    return NextResponse.json({ error: "Geçersiz önizleme." }, { status: 400 });
  }

  const upstream = await fetch(`${API_URL}/api/uploads/design/${encodeURIComponent(key)}`, {
    headers: { Authorization: `Bearer ${session.accessToken}` },
    cache: "no-store",
  });
  if (!upstream.ok) {
    return NextResponse.json(
      { error: "Önizleme bulunamadı." },
      { status: upstream.status === 401 || upstream.status === 403 ? 401 : 404 },
    );
  }

  const ext = key.split(".").pop()!.toLowerCase();
  const headers = new Headers();
  headers.set("Content-Type", ext === "png" ? "image/png" : "image/jpeg");
  headers.set("Content-Disposition", "inline");
  headers.set("X-Content-Type-Options", "nosniff");
  headers.set("Cache-Control", "private, max-age=3600");
  return new NextResponse(await upstream.arrayBuffer(), { status: 200, headers });
}
