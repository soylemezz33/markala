import { NextRequest, NextResponse } from "next/server";
import { getContactTo, isMailConfigured, sendMail } from "@/lib/mailer";

// nodemailer Node.js API'lerine ihtiyaç duyar — edge runtime'da çalışmaz.
export const runtime = "nodejs";

interface ContactPayload {
  name?: string;
  email?: string;
  phone?: string;
  subject?: string;
  message?: string;
  consent?: boolean;
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/**
 * İletişim formu endpoint.
 * Geçerli form, CONTACT_TO adresine (varsayılan merhaba@markala.com.tr) e-posta olarak iletilir.
 * SMTP yapılandırılmamışsa (dev/localhost) sadece console.log yapar ve başarı döner.
 */
export async function POST(req: NextRequest) {
  let body: ContactPayload;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Geçersiz istek." }, { status: 400 });
  }

  const { name, email, phone, subject, message } = body;

  if (!name || name.length < 2) {
    return NextResponse.json({ error: "Ad soyad zorunlu." }, { status: 400 });
  }
  if (!email || !email.includes("@")) {
    return NextResponse.json({ error: "Geçerli e-posta zorunlu." }, { status: 400 });
  }
  if (!subject || subject.length < 2) {
    return NextResponse.json({ error: "Konu zorunlu." }, { status: 400 });
  }
  if (!message || message.length < 10) {
    return NextResponse.json(
      { error: "Mesaj en az 10 karakter olmalı." },
      { status: 400 },
    );
  }

  const ticketId = `TK-${Date.now().toString(36).toUpperCase()}`;

  // SMTP yapılandırılmamışsa (dev): mock davranışı koru
  if (!isMailConfigured()) {
    console.log(`[iletisim] new submission (SMTP devre dışı, mock): ticketId=${ticketId} subject="${subject}"`);
    return NextResponse.json({
      ok: true,
      ticketId,
      message: "Mesajınız bize ulaştı. 24 saat içinde dönüş yapacağız.",
    });
  }

  const text = [
    `Yeni iletişim formu mesajı (${ticketId})`,
    "",
    `Ad Soyad: ${name}`,
    `E-posta: ${email}`,
    `Telefon: ${phone || "-"}`,
    `Konu: ${subject}`,
    "",
    "Mesaj:",
    message,
  ].join("\n");

  const html = `<div style="font-family:system-ui,sans-serif;max-width:560px;margin:0 auto;color:#1a1a1a">
    <h2 style="margin:0 0 4px">Yeni iletişim formu mesajı</h2>
    <p style="color:#999;font-size:12px;margin:0 0 16px">Ticket: ${escapeHtml(ticketId)}</p>
    <table style="border-collapse:collapse;font-size:14px;width:100%">
      <tr><td style="padding:4px 8px;color:#666;white-space:nowrap;vertical-align:top">Ad Soyad</td><td style="padding:4px 8px;font-weight:600">${escapeHtml(name)}</td></tr>
      <tr><td style="padding:4px 8px;color:#666;vertical-align:top">E-posta</td><td style="padding:4px 8px"><a href="mailto:${escapeHtml(email)}">${escapeHtml(email)}</a></td></tr>
      <tr><td style="padding:4px 8px;color:#666;vertical-align:top">Telefon</td><td style="padding:4px 8px">${escapeHtml(phone || "-")}</td></tr>
      <tr><td style="padding:4px 8px;color:#666;vertical-align:top">Konu</td><td style="padding:4px 8px">${escapeHtml(subject)}</td></tr>
    </table>
    <hr style="border:none;border-top:1px solid #eee;margin:16px 0">
    <p style="white-space:pre-wrap;font-size:14px;line-height:1.5">${escapeHtml(message)}</p>
  </div>`;

  try {
    await sendMail({
      to: getContactTo(),
      subject: `Yeni iletişim formu: ${subject}`,
      text,
      html,
      replyTo: email,
    });
  } catch (err) {
    console.error(
      `[iletisim] mail gönderilemedi (${ticketId}):`,
      (err as Error).message,
    );
    return NextResponse.json(
      {
        error:
          "Şu an mesajınızı iletemedik, lütfen telefonla ulaşın veya daha sonra tekrar deneyin.",
      },
      { status: 502 },
    );
  }

  return NextResponse.json({
    ok: true,
    ticketId,
    message: "Mesajınız bize ulaştı. 24 saat içinde dönüş yapacağız.",
  });
}
