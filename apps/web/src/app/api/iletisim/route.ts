import { NextRequest, NextResponse } from "next/server";
import { getContactTo, isMailConfigured, sendMail } from "@/lib/mailer";
import { renderEmail, emailRow, emailTable } from "@/lib/email-template";
import { verifyTurnstile } from "@/lib/turnstile";

// nodemailer Node.js API'lerine ihtiyaç duyar — edge runtime'da çalışmaz.
export const runtime = "nodejs";

interface ContactPayload {
  name?: string;
  email?: string;
  phone?: string;
  subject?: string;
  message?: string;
  consent?: boolean;
  turnstileToken?: string;
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/** Mesajı NestJS API'ye (DB) kalıcı yazar — SMTP'den BAĞIMSIZ, lead kaybolmaz (kurumsal-basvuru deseni). */
async function persistContact(payload: {
  ticketId: string;
  name: string;
  email: string;
  phone?: string;
  subject: string;
  message: string;
}): Promise<void> {
  const apiBase =
    process.env.API_INTERNAL_URL || process.env.NEXT_PUBLIC_API_URL || "http://api:4000";
  try {
    const res = await fetch(`${apiBase}/api/contact`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...payload, source: "iletisim" }),
      cache: "no-store",
    });
    if (!res.ok) {
      console.error(`[iletisim] DB kaydı başarısız (${payload.ticketId}): HTTP ${res.status}`);
    }
  } catch (err) {
    console.error(`[iletisim] DB kaydı hatası (${payload.ticketId}):`, (err as Error).message);
  }
}

/**
 * İletişim formu endpoint.
 * 1) Mesaj NestJS API'ye yazılır → admin "Gelen Kutusu"na düşer (SMTP'den BAĞIMSIZ).
 * 2) Ayrıca CONTACT_TO adresine e-posta gönderilir (best-effort). Mail gitmese bile mesaj DB'de.
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

  // Bot koruması: Turnstile token doğrula (prod'da fail-closed) → spam persist+mail'den ÖNCE reddedilir.
  const ip =
    req.headers.get("cf-connecting-ip") ||
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    undefined;
  if (!(await verifyTurnstile(body.turnstileToken, ip))) {
    return NextResponse.json(
      { error: "Güvenlik doğrulaması başarısız. Sayfayı yenileyip tekrar deneyin." },
      { status: 400 },
    );
  }

  const ticketId = `TK-${Date.now().toString(36).toUpperCase()}`;

  // DB'ye kalıcı yaz (admin Gelen Kutusu'na düşsün) — SMTP durumundan BAĞIMSIZ, HER ZAMAN.
  await persistContact({ ticketId, name, email, phone, subject, message });

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

  const rows = emailTable(
    emailRow("Ad Soyad", `<strong>${escapeHtml(name)}</strong>`) +
      emailRow("E-posta", `<a href="mailto:${escapeHtml(email)}" style="color:#5C4100">${escapeHtml(email)}</a>`) +
      emailRow("Telefon", escapeHtml(phone || "-")) +
      emailRow("Konu", escapeHtml(subject)),
  );
  const html = renderEmail({
    title: "Yeni İletişim Formu Mesajı",
    intro: `Talep No: ${escapeHtml(ticketId)}`,
    preheader: `${escapeHtml(name)} — ${escapeHtml(subject)}`,
    bodyHtml: `${rows}
      <div style="margin-top:18px;padding-top:16px;border-top:1px solid #e7e5e4">
        <p style="margin:0 0 6px;color:#78716c;font-size:13px">Mesaj</p>
        <p style="margin:0;white-space:pre-wrap;font-size:14px;line-height:1.6;color:#1A1410">${escapeHtml(message)}</p>
      </div>`,
    footnote: "Bu mesaja doğrudan yanıtlayarak müşteriye dönüş yapabilirsiniz (Yanıtla → müşteri e-postası).",
  });

  try {
    await sendMail({
      to: getContactTo(),
      subject: `Yeni iletişim formu: ${subject}`,
      text,
      html,
      replyTo: email,
    });
  } catch (err) {
    // SMTP geçici sorunu kullanıcıyı BLOKE ETMEMELİ (eski davranış 502 → "ulaşmıyor").
    // Mesajın tamamı sunucu loglarına yazılır (kaybolmaz, ekip ulaşır) + kullanıcı WhatsApp'a yönlendirilir.
    console.error(
      `[iletisim] mail gönderilemedi (${ticketId}) — mesaj LOGLANDI:`,
      (err as Error).message,
      JSON.stringify({ ticketId, name, email, phone, subject, message }),
    );
    return NextResponse.json({
      ok: true,
      ticketId,
      degraded: true,
      message:
        "Mesajını aldık. En hızlı dönüş için WhatsApp hattımızdan da yazabilirsin: 0531 900 41 02",
    });
  }

  return NextResponse.json({
    ok: true,
    ticketId,
    message: "Mesajınız bize ulaştı. 24 saat içinde dönüş yapacağız.",
  });
}
