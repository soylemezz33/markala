import { NextRequest, NextResponse } from "next/server";
import { getContactTo, isMailConfigured, sendMail } from "@/lib/mailer";
import { renderEmail, emailRow, emailTable } from "@/lib/email-template";
import { verifyTurnstile } from "@/lib/turnstile";

// nodemailer Node.js API'lerine ihtiyaç duyar — edge runtime'da çalışmaz.
export const runtime = "nodejs";

interface SamplePayload {
  name?: string;
  email?: string;
  phone?: string;
  address?: string;
  productInterest?: string;
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

/**
 * Numune talebini NestJS API'ye (DB) kalıcı yazar — SMTP'den BAĞIMSIZ, lead kaybolmaz.
 * İletişim/teklif ile AYNI ContactMessage tablosu kullanılır; ayrımı `source: "numune"` sağlar
 * (admin Gelen Kutusu'nda kaynağa göre filtrelenebilir). Yeni tablo/migration gerekmez.
 */
async function persistSample(payload: {
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
      body: JSON.stringify({ ...payload, source: "numune" }),
      cache: "no-store",
    });
    if (!res.ok) {
      console.error(`[numune] DB kaydı başarısız (${payload.ticketId}): HTTP ${res.status}`);
    }
  } catch (err) {
    console.error(`[numune] DB kaydı hatası (${payload.ticketId}):`, (err as Error).message);
  }
}

/**
 * Numune kutusu talebi endpoint.
 * 1) Talep NestJS API'ye yazılır → admin "Gelen Kutusu"na (source=numune) düşer.
 * 2) Ayrıca CONTACT_TO adresine e-posta gönderilir (best-effort). Mail gitmese bile talep DB'de.
 */
export async function POST(req: NextRequest) {
  let body: SamplePayload;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Geçersiz istek." }, { status: 400 });
  }

  const name = (body.name ?? "").slice(0, 120);
  const email = body.email ?? "";
  const phone = (body.phone ?? "").slice(0, 32);
  const address = (body.address ?? "").slice(0, 1000);
  const productInterest = (body.productInterest ?? "").slice(0, 200);

  if (!name || name.length < 2) {
    return NextResponse.json({ error: "Ad soyad zorunlu." }, { status: 400 });
  }
  if (!email || !email.includes("@")) {
    return NextResponse.json({ error: "Geçerli e-posta zorunlu." }, { status: 400 });
  }
  if (!phone || phone.length < 7) {
    return NextResponse.json({ error: "Kargo için telefon zorunlu." }, { status: 400 });
  }
  if (!address || address.length < 10) {
    return NextResponse.json(
      { error: "Numunenin gönderileceği adresi eksiksiz yazın." },
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

  const ticketId = `NM-${Date.now().toString(36).toUpperCase()}`;
  const subject = "Numune Kutusu Talebi";
  // ContactMessage.message tek metin alanı → adres + ilgi alanını yapılandırılmış yaz.
  const message = [
    "Numune kutusu talebi.",
    "",
    `İlgilenilen ürünler: ${productInterest || "-"}`,
    "",
    "Kargo adresi:",
    address,
  ].join("\n");

  // DB'ye kalıcı yaz (admin Gelen Kutusu'na, source=numune) — SMTP durumundan BAĞIMSIZ.
  await persistSample({ ticketId, name, email, phone, subject, message });

  if (!isMailConfigured()) {
    console.log(`[numune] new submission (SMTP devre dışı, mock): ticketId=${ticketId}`);
    return NextResponse.json({
      ok: true,
      ticketId,
      message: "Numune talebiniz alındı. Kutunuz 2-3 iş günü içinde kargolanır.",
    });
  }

  const text = [
    `Yeni numune kutusu talebi (${ticketId})`,
    "",
    `Ad Soyad: ${name}`,
    `E-posta: ${email}`,
    `Telefon: ${phone}`,
    `İlgilenilen ürünler: ${productInterest || "-"}`,
    "",
    "Kargo adresi:",
    address,
  ].join("\n");

  const rows = emailTable(
    emailRow("Ad Soyad", `<strong>${escapeHtml(name)}</strong>`) +
      emailRow(
        "E-posta",
        `<a href="mailto:${escapeHtml(email)}" style="color:#5C4100">${escapeHtml(email)}</a>`,
      ) +
      emailRow("Telefon", escapeHtml(phone)) +
      emailRow("İlgilenilen ürünler", escapeHtml(productInterest || "-")),
  );
  const html = renderEmail({
    title: "Yeni Numune Kutusu Talebi",
    intro: `Talep No: ${escapeHtml(ticketId)}`,
    preheader: `${escapeHtml(name)} — numune kutusu`,
    bodyHtml: `${rows}
      <div style="margin-top:18px;padding-top:16px;border-top:1px solid #e7e5e4">
        <p style="margin:0 0 6px;color:#78716c;font-size:13px">Kargo Adresi</p>
        <p style="margin:0;white-space:pre-wrap;font-size:14px;line-height:1.6;color:#1A1410">${escapeHtml(address)}</p>
      </div>`,
    footnote:
      "Numune kutusunu bu adrese kargolayın; müşteriye dönüş için e-postayı yanıtlayabilirsiniz.",
  });

  try {
    await sendMail({
      to: getContactTo(),
      subject: `Yeni numune kutusu talebi: ${name}`,
      text,
      html,
      replyTo: email,
    });
  } catch (err) {
    console.error(
      `[numune] mail gönderilemedi (${ticketId}) — talep LOGLANDI:`,
      (err as Error).message,
      JSON.stringify({ ticketId, name, email, phone, productInterest, address }),
    );
    return NextResponse.json({
      ok: true,
      ticketId,
      degraded: true,
      message:
        "Numune talebini aldık. En hızlı dönüş için WhatsApp hattımızdan da yazabilirsin: 0531 900 41 02",
    });
  }

  return NextResponse.json({
    ok: true,
    ticketId,
    message: "Numune talebiniz alındı. Kutunuz 2-3 iş günü içinde kargolanır.",
  });
}
