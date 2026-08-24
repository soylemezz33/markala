import { NextRequest, NextResponse } from "next/server";

// nodemailer yok, sadece NestJS API'ye proxy — edge runtime yeterli ama diğer route'larla
// tutarlılık için nodejs bırakıldı.
export const runtime = "nodejs";

interface CartItemPayload {
  productSlug?: string;
  productName?: string;
  quantity?: number;
}

interface CartLeadPayload {
  sessionId?: string;
  email?: string;
  consent?: boolean;
  cart?: CartItemPayload[];
  _hp?: string;
}

/**
 * Sepet e-posta yakalama (sepet terk hatırlatması) — NestJS API'ye (cart_leads) yazar.
 * Newsletter formuyla AYNI desen: honeypot (görünmez alan) spam koruması, düşük-değerli
 * hedef olduğu için Turnstile yerine sıfır-sürtünmeli koruma tercih edildi.
 */
export async function POST(req: NextRequest) {
  let body: CartLeadPayload;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Geçersiz istek." }, { status: 400 });
  }

  // Honeypot — bot doldurursa sessiz "başarı" (persist YOK).
  if (body._hp) {
    return NextResponse.json({ ok: true });
  }

  const email = (body.email ?? "").trim();
  const sessionId = (body.sessionId ?? "").trim();
  const cart = Array.isArray(body.cart) ? body.cart.slice(0, 50) : [];

  if (!email || !email.includes("@") || email.length < 5) {
    return NextResponse.json({ error: "Geçerli bir e-posta adresi girin." }, { status: 400 });
  }
  if (!sessionId) {
    return NextResponse.json({ error: "Oturum bilgisi eksik, sayfayı yenileyip tekrar dene." }, { status: 400 });
  }
  if (cart.length === 0) {
    return NextResponse.json({ error: "Sepet boş." }, { status: 400 });
  }

  const apiBase = process.env.API_INTERNAL_URL || process.env.NEXT_PUBLIC_API_URL || "http://api:4000";
  try {
    const res = await fetch(`${apiBase}/api/cart-leads`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        sessionId,
        email,
        consent: Boolean(body.consent),
        cart: cart.map((i) => ({
          productSlug: String(i.productSlug ?? "").slice(0, 160),
          productName: String(i.productName ?? "").slice(0, 200),
          quantity: Math.min(100000, Math.max(1, Number(i.quantity) || 1)),
        })),
      }),
      cache: "no-store",
    });
    if (!res.ok) {
      console.error(`[sepet-hatirlatma] API kaydı başarısız (${email}): HTTP ${res.status}`);
      return NextResponse.json({ error: "Şu an kaydedilemedi, lütfen tekrar dene." }, { status: 502 });
    }
  } catch (err) {
    console.error(`[sepet-hatirlatma] API kaydı hatası (${email}):`, (err as Error).message);
    return NextResponse.json({ error: "Şu an kaydedilemedi, lütfen tekrar dene." }, { status: 502 });
  }

  return NextResponse.json({ ok: true, message: "E-postana kaydedildi." });
}
