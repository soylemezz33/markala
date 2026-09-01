import { NextRequest, NextResponse } from "next/server";
import { getAdminSession } from "@/lib/api";

// Binary proxy — admin oturum token'ı SUNUCUDA kalır, tarayıcıya sızmaz.
export const runtime = "nodejs";

const API_URL = process.env.API_URL ?? process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

/**
 * Müşterinin yüklediği tasarım dosyasını indir (2026-09-01).
 *
 * Neden proxy: dosya artık API'de auth+ORDERS_READ korumalı bir uçtan servis ediliyor,
 * yani düz bir <a href> Authorization başlığı gönderemez. Bu rota aynı origin'de olduğu
 * için çerezle kimliklenir, token'ı sunucuda bearer'a çevirir ve dosyayı stream eder.
 * (Kurumsal belge indirmedeki kanıtlanmış desenin aynısı — bkz. kurumsal-belge rotası.)
 *
 * `key` = dosya adı (uuid.uzantı). Sipariş kaleminde tam URL saklandığı için çağıran
 * taraf son yol parçasını gönderir; eski (uploads/<uuid>) ve yeni (uploads/design/<uuid>)
 * kayıtların ikisi de aynı anahtara çözülür.
 */
export async function GET(_req: NextRequest, { params }: { params: { key: string } }) {
  const session = await getAdminSession();
  if (!session?.accessToken) {
    return NextResponse.json({ error: "Yetkisiz." }, { status: 401 });
  }

  // Path traversal savunması — API tarafında da doğrulanıyor, burada erken kes.
  const key = params.key;
  if (!/^[0-9a-f-]{36}\.[a-z0-9]{1,5}$/i.test(key)) {
    return NextResponse.json({ error: "Geçersiz dosya." }, { status: 400 });
  }

  const upstream = await fetch(`${API_URL}/api/uploads/design/${encodeURIComponent(key)}`, {
    headers: { Authorization: `Bearer ${session.accessToken}` },
    cache: "no-store",
  });
  if (!upstream.ok) {
    return NextResponse.json(
      { error: "Dosya bulunamadı." },
      { status: upstream.status === 401 || upstream.status === 403 ? 401 : 404 },
    );
  }

  const buf = await upstream.arrayBuffer();
  const headers = new Headers();
  headers.set("Content-Type", upstream.headers.get("content-type") ?? "application/octet-stream");
  const cd = upstream.headers.get("content-disposition");
  if (cd) headers.set("Content-Disposition", cd);
  headers.set("Cache-Control", "private, no-store");
  return new NextResponse(buf, { status: 200, headers });
}
