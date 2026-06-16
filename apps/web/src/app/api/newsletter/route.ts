import { NextRequest, NextResponse } from "next/server";
import { getContactTo, isMailConfigured, sendMail } from "@/lib/mailer";

// nodemailer Node.js API'lerine ihtiyaç duyar — edge runtime'da çalışmaz.
export const runtime = "nodejs";

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/**
 * Newsletter signup endpoint.
 * Geçerli e-posta gelince CONTACT_TO adresine bildirim maili gönderir.
 * Hem JSON hem form-urlencoded kabul eder; form ise /blog?subscribed=1'e redirect eder.
 * Mail gönderimi BÜLTENİ BLOKE ETMEZ — hata olsa bile kullanıcıya başarı gösterilir.
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

  const sourceLabel = source && source.length > 0 ? source : "unknown";

  if (!isMailConfigured()) {
    // SMTP yapılandırılmamışsa (dev): mock davranışı koru
    console.log(`[newsletter] subscribe (SMTP devre dışı, mock): source=${sourceLabel}`);
  } else {
    // Bildirim maili — başarısız olsa bile aboneliği bloke etme
    try {
      await sendMail({
        to: getContactTo(),
        subject: `Yeni bülten aboneliği: ${email} (kaynak: ${sourceLabel})`,
        text: `Yeni bülten aboneliği.\n\nE-posta: ${email}\nKaynak: ${sourceLabel}`,
        html: `<div style="font-family:system-ui,sans-serif;color:#1a1a1a">
          <h2 style="margin:0 0 12px">Yeni bülten aboneliği</h2>
          <p style="margin:0 0 4px"><strong>E-posta:</strong> ${escapeHtml(email)}</p>
          <p style="margin:0"><strong>Kaynak:</strong> ${escapeHtml(sourceLabel)}</p>
        </div>`,
      });
    } catch (err) {
      console.error(
        `[newsletter] bildirim maili gönderilemedi (${email}):`,
        (err as Error).message,
      );
      // Bilerek yutuyoruz — bülten aboneliği kritik değil, kullanıcıya başarı gösterilir.
    }
  }

  // Form submission ise başarı sayfasına redirect
  if (!contentType.includes("application/json")) {
    return NextResponse.redirect(new URL("/blog?subscribed=1", req.url), 303);
  }

  return NextResponse.json({
    ok: true,
    message: "Abone olundu! İlk haberlere göz atmak için e-postanı kontrol et.",
  });
}
