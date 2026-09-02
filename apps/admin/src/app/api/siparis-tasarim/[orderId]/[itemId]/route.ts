import { NextRequest, NextResponse } from "next/server";
import { getAdminSession } from "@/lib/api";

// nodejs BFF: tarayıcı token görmez; session cookie → bearer ile API'ye multipart proxy.
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const API_URL = process.env.API_URL ?? process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

const KINDS = new Set(["onizleme", "calisma", "baski"]);
const CUID = /^[a-z0-9]{20,40}$/i;
const MAX_BYTES = 50 * 1024 * 1024;
const ONIZLEME_MAX_BYTES = 2 * 1024 * 1024;

/**
 * Sipariş SATIRINA tasarımcı dosyası yükle (2026-09-02, üretim ARGE Faz 2).
 *
 * Tarayıcı → bu route → POST /api/orders/:id/items/:itemId/tasarim (NestJS, ORDERS_DESIGN).
 * /api/uploads route'uyla aynı desen. Server action KULLANILMADI: serverActions.bodySizeLimit
 * varsayılanı 1 MB, 50 MB dosya oradan geçmez; route handler formData() ise bellekte tutar
 * (admin ölçeğinde kabul edilebilir).
 *
 * ERKEN 400'ler bilerek burada: yanlış tür/boyutlu dosyayı 50 MB taşıyıp API'den 400 almak
 * yerine burada kesilir. Asıl otorite yine API (kural + sahiplik kontrolü serviste).
 */
export async function POST(
  req: NextRequest,
  { params }: { params: { orderId: string; itemId: string } },
) {
  const session = await getAdminSession();
  if (!session?.accessToken) {
    return NextResponse.json({ message: "Oturum geçersiz." }, { status: 401 });
  }
  const { orderId, itemId } = params;
  if (!CUID.test(orderId) || !CUID.test(itemId)) {
    return NextResponse.json({ message: "Geçersiz sipariş/satır kimliği." }, { status: 400 });
  }

  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return NextResponse.json({ message: "Form okunamadı." }, { status: 400 });
  }
  const file = form.get("file");
  const kind = String(form.get("kind") ?? "");
  if (!(file instanceof File)) {
    return NextResponse.json({ message: "Dosya bulunamadı." }, { status: 400 });
  }
  if (!KINDS.has(kind)) {
    return NextResponse.json({ message: "Geçersiz dosya türü." }, { status: 400 });
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json({ message: "Dosya en fazla 50 MB olabilir." }, { status: 400 });
  }
  if (kind === "onizleme" && file.size > ONIZLEME_MAX_BYTES) {
    return NextResponse.json({ message: "Önizleme en fazla 2 MB olabilir." }, { status: 400 });
  }

  const upstream = new FormData();
  upstream.append("file", file, file.name);
  upstream.append("kind", kind);

  let res: Response;
  try {
    res = await fetch(`${API_URL}/api/orders/${orderId}/items/${itemId}/tasarim`, {
      method: "POST",
      headers: { Authorization: `Bearer ${session.accessToken}` },
      body: upstream,
    });
  } catch {
    return NextResponse.json({ message: "Yükleme sunucusuna ulaşılamadı." }, { status: 502 });
  }

  const data = await res.json().catch(() => ({ message: "Yükleme başarısız." }));
  // Nest ValidationPipe hata mesajını dizi olarak verebilir — tek satıra indir.
  if (!res.ok && Array.isArray((data as { message?: unknown }).message)) {
    (data as { message: unknown }).message = (data as { message: string[] }).message.join(", ");
  }
  return NextResponse.json(data, { status: res.status });
}
