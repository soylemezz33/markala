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
export async function GET(req: NextRequest, { params }: { params: { key: string } }) {
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
  /**
   * İNDİRİLEN DOSYANIN ADI (2026-09-02 üretim ARGE).
   *
   * Sorun: API dosyayı ham depolama anahtarıyla veriyor —
   *   design-uploads.controller.ts: `attachment; filename="${key}"`
   *   storage.service.ts:            `${randomUUID()}.${ext}`
   * yani operatörün eline "9f3c1a72-...-2c5e91d4f6ab.pdf" geçiyor. Baskı kuyruğunda,
   * yazıcı diyaloğunda ve indirilenler klasöründe görünen isim bu; hangi siparişe ait
   * olduğu anlaşılmıyor ve üretimde işler bu yüzden karışıyor.
   *
   * Çözüm BURADA, API'de değil: sipariş bağlamını yalnız panel biliyor (hangi sipariş,
   * hangi satır, hangi ürün, kaç adet). API'ye taşımak dosya→sipariş ters aramasi
   * gerektirirdi; panel adı hazır gönderiyor.
   *
   * MÜŞTERİ ADI BİLEREK YOK: eşleştirme için sipariş numarası zaten yeterli, isim iş
   * emri kâğıdında duruyor. Dosya adları paylaşılabilir/loglanabilir olduğu için
   * kişisel veriyi oraya taşımıyoruz.
   */
  const ham = req.nextUrl.searchParams.get("ad");
  const uzanti = key.split(".").pop() ?? "";
  // Sanitize: başlık enjeksiyonuna (CR/LF, tırnak) ve yol ayracına karşı beyaz liste.
  const ad = ham
    ? ham.replace(/[^A-Za-z0-9._-]+/g, "-").replace(/-{2,}/g, "-").replace(/^-|-$/g, "").slice(0, 120)
    : "";
  if (ad) {
    headers.set("Content-Disposition", `attachment; filename="${ad}.${uzanti}"`);
  } else {
    const cd = upstream.headers.get("content-disposition");
    if (cd) headers.set("Content-Disposition", cd);
  }
  headers.set("Cache-Control", "private, no-store");
  return new NextResponse(buf, { status: 200, headers });
}
