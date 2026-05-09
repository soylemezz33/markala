import { NextRequest, NextResponse } from "next/server";

export const runtime = "edge";

/**
 * Newsletter signup endpoint.
 * Şu an mock — geçerli e-posta kabul eder, prod'da SendGrid/Mailchimp'e POST eder.
 *
 * Backend bağlandığında burası:
 *   prisma.newsletterSubscriber.create({ data: { email, source } })
 *   sendgrid.client.contactdb.add({ email })
 */
export async function POST(req: NextRequest) {
  let body: { email?: string; source?: string };

  const contentType = req.headers.get("content-type") ?? "";
  if (contentType.includes("application/json")) {
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: "Geçersiz istek." }, { status: 400 });
    }
  } else {
    // form-urlencoded
    const form = await req.formData();
    body = {
      email: String(form.get("email") ?? ""),
      source: String(form.get("source") ?? ""),
    };
  }

  const { email, source } = body;
  if (!email || !email.includes("@") || email.length < 5) {
    return NextResponse.json(
      { error: "Geçerli bir e-posta adresi girin." },
      { status: 400 },
    );
  }

  // TODO: prod'da SendGrid/Mailchimp/Brevo'ya gönder
  console.log(`[newsletter] subscribe: ${email} (source: ${source ?? "unknown"})`);

  // Form submission ise basarı sayfasına redirect
  if (!contentType.includes("application/json")) {
    return NextResponse.redirect(new URL("/blog?subscribed=1", req.url), 303);
  }

  return NextResponse.json({
    ok: true,
    message: "Abone olundu! İlk haberlere göz atmak için e-postanı kontrol et.",
  });
}
