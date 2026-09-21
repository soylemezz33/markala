import { NextRequest, NextResponse } from "next/server";
import { getAdminSession } from "@/lib/api";

// nodejs BFF: tarayıcı token görmez; session cookie → bearer ile API'ye multipart proxy.
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const API_URL = process.env.API_URL ?? process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

const CUID = /^[a-z0-9]{20,40}$/i;
/** Önizleme kuralıyla aynı: 2 MB. WhatsApp 5 MB'a kadar kabul eder, dar olan bizim kuralımız. */
const MAX_BYTES = 2 * 1024 * 1024;
const MIME = new Set(["image/jpeg", "image/png"]);

/**
 * Tasarım onayını müşteriye WhatsApp'tan gönder (2026-09-21).
 *
 * Tarayıcı → bu route → POST /api/orders/:id/tasarim-onay (NestJS, ORDERS_DESIGN).
 * Server action DEĞİL: serverActions.bodySizeLimit varsayılanı 1 MB, görsel oradan geçmez —
 * siparis-tasarim route'uyla aynı gerekçe ve aynı desen.
 *
 * Dosya OPSİYONEL: gönderilirse o görsel yollanır ve siparişe önizleme olarak kaydedilir;
 * gönderilmezse API siparişteki en son önizlemeye düşer.
 */
export async function POST(req: NextRequest, { params }: { params: { orderId: string } }) {
  const session = await getAdminSession();
  if (!session?.accessToken) {
    return NextResponse.json({ message: "Oturum geçersiz." }, { status: 401 });
  }
  const { orderId } = params;
  if (!CUID.test(orderId)) {
    return NextResponse.json({ message: "Geçersiz sipariş kimliği." }, { status: 400 });
  }

  let form: FormData | null = null;
  try {
    form = await req.formData();
  } catch {
    form = null; // gövdesiz çağrı = dosyasız gönderim, geçerli
  }
  const file = form?.get("file");

  const upstream = new FormData();
  if (file instanceof File) {
    // ERKEN 400: yanlış tür/boyutu API'ye taşımadan burada kes (siparis-tasarim deseni).
    if (!MIME.has(file.type)) {
      return NextResponse.json(
        { message: "Tasarım görseli JPG veya PNG olmalı." },
        { status: 400 },
      );
    }
    if (file.size > MAX_BYTES) {
      return NextResponse.json(
        { message: "Görsel en fazla 2 MB olabilir." },
        { status: 400 },
      );
    }
    upstream.append("file", file, file.name);
  }

  let res: Response;
  try {
    res = await fetch(`${API_URL}/api/orders/${orderId}/tasarim-onay`, {
      method: "POST",
      headers: { Authorization: `Bearer ${session.accessToken}` },
      body: upstream,
    });
  } catch {
    return NextResponse.json({ message: "Sunucuya ulaşılamadı." }, { status: 502 });
  }

  const data = await res.json().catch(() => ({ message: "Gönderim başarısız." }));
  // Nest ValidationPipe hata mesajını dizi olarak verebilir — tek satıra indir.
  if (!res.ok && Array.isArray((data as { message?: unknown }).message)) {
    (data as { message: unknown }).message = (data as { message: string[] }).message.join(", ");
  }
  return NextResponse.json(data, { status: res.status });
}
