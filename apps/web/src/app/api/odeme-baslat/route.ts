import { NextRequest, NextResponse } from "next/server";

// Backend'e (NestJS) sunucu-içinden çağrı — guest checkout, token gerekmez.
export const runtime = "nodejs";

const API_BASE =
  process.env.API_INTERNAL_URL ||
  process.env.NEXT_PUBLIC_API_URL ||
  "http://api:4000";

/**
 * iyzico ödemesini başlatır: backend /api/payments/iyzico/init çağrılır, hosted ödeme
 * sayfası URL'i (paymentPageUrl) döner. Storefront kullanıcıyı oraya yönlendirir; kart
 * bilgisi iyzico'da girilir (PCI kapsamı bizde değil).
 *
 * Gerçek müşteri IP'sini backend'e iletiriz (fraud skoru) — aksi halde backend yalnız
 * sunucu-içi (Next container) IP'sini görürdü.
 */
export async function POST(req: NextRequest) {
  let body: { orderId?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "invalid_json" }, { status: 400 });
  }
  if (!body.orderId) {
    return NextResponse.json({ ok: false, error: "missing_orderId" }, { status: 400 });
  }

  const clientIp =
    (req.headers.get("x-forwarded-for") ?? "").split(",")[0]?.trim() ||
    req.headers.get("x-real-ip") ||
    undefined;

  try {
    const res = await fetch(`${API_BASE}/api/payments/iyzico/init`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ orderId: body.orderId, clientIp }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      console.error(`[odeme-baslat] backend ${res.status}:`, data);
      return NextResponse.json(
        { ok: false, status: res.status, error: (data as { message?: string })?.message ?? "init_failed" },
        { status: 502 },
      );
    }
    return NextResponse.json({
      ok: true,
      paymentPageUrl: (data as { paymentPageUrl?: string }).paymentPageUrl,
      checkoutFormContent: (data as { checkoutFormContent?: string }).checkoutFormContent,
    });
  } catch (err) {
    console.error("[odeme-baslat] backend erişilemedi:", (err as Error).message);
    return NextResponse.json({ ok: false, error: "backend_unreachable" }, { status: 502 });
  }
}
