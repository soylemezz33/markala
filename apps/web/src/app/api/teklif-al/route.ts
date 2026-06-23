import { NextRequest, NextResponse } from "next/server";
import { getContactTo, isMailConfigured, sendMail } from "@/lib/mailer";
import { renderEmail, emailRow, emailTable } from "@/lib/email-template";

// nodemailer Node.js API'lerine ihtiyaç duyar — edge runtime'da çalışmaz.
export const runtime = "nodejs";

interface QuotePayload {
  name?: string;
  email?: string;
  phone?: string;
  companyName?: string;
  sector?: string;
  products?: unknown;
  budget?: string;
  quantity?: string;
  message?: string;
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/** Talebi NestJS API'ye (DB) kalıcı yazar — SMTP'den BAĞIMSIZ, lead kaybolmaz (iletisim deseni). */
async function persistQuote(payload: {
  ticketId: string;
  name: string;
  email: string;
  phone: string;
  companyName?: string;
  sector?: string;
  products: string[];
  budget?: string;
  quantity?: string;
  message?: string;
}): Promise<void> {
  const apiBase =
    process.env.API_INTERNAL_URL || process.env.NEXT_PUBLIC_API_URL || "http://api:4000";
  try {
    const res = await fetch(`${apiBase}/api/quote-requests`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...payload, source: "teklif-al" }),
      cache: "no-store",
    });
    if (!res.ok) {
      console.error(`[teklif-al] DB kaydı başarısız (${payload.ticketId}): HTTP ${res.status}`);
    }
  } catch (err) {
    console.error(`[teklif-al] DB kaydı hatası (${payload.ticketId}):`, (err as Error).message);
  }
}

/**
 * Teklif talebi endpoint.
 * 1) Talep NestJS API'ye yazılır → admin "Teklif Talepleri"ne düşer (SMTP'den BAĞIMSIZ).
 * 2) Ayrıca CONTACT_TO adresine e-posta gönderilir (best-effort). Mail gitmese bile talep DB'de.
 */
export async function POST(req: NextRequest) {
  let body: QuotePayload;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Geçersiz istek." }, { status: 400 });
  }

  const name = (body.name ?? "").trim();
  const email = (body.email ?? "").trim();
  const phone = (body.phone ?? "").trim();
  const companyName = (body.companyName ?? "").trim();
  const sector = (body.sector ?? "").trim();
  const budget = (body.budget ?? "").trim();
  const quantity = (body.quantity ?? "").trim();
  const message = (body.message ?? "").trim();
  const products = Array.isArray(body.products)
    ? body.products.map((p) => String(p).trim()).filter((p) => p.length > 0).slice(0, 30)
    : [];

  if (name.length < 2) {
    return NextResponse.json({ error: "Ad soyad zorunlu." }, { status: 400 });
  }
  if (!email.includes("@")) {
    return NextResponse.json({ error: "Geçerli e-posta zorunlu." }, { status: 400 });
  }
  if (phone.length < 7) {
    return NextResponse.json({ error: "Geçerli telefon zorunlu." }, { status: 400 });
  }
  if (products.length === 0) {
    return NextResponse.json({ error: "En az bir ürün seçin." }, { status: 400 });
  }

  const ticketId = `TQ-${Date.now().toString(36).toUpperCase()}`;

  // DB'ye kalıcı yaz (admin Teklif Talepleri'ne düşsün) — SMTP durumundan BAĞIMSIZ, HER ZAMAN.
  await persistQuote({
    ticketId,
    name,
    email,
    phone,
    companyName: companyName || undefined,
    sector: sector || undefined,
    products,
    budget: budget || undefined,
    quantity: quantity || undefined,
    message: message || undefined,
  });

  // SMTP yapılandırılmamışsa (dev): mock davranışı koru
  if (!isMailConfigured()) {
    console.log(`[teklif-al] new submission (SMTP devre dışı, mock): ticketId=${ticketId}`);
    return NextResponse.json({
      ok: true,
      ticketId,
      message: "Teklif talebin bize ulaştı. 24 saat içinde dönüş yapacağız.",
    });
  }

  const text = [
    `Yeni teklif talebi (${ticketId})`,
    "",
    `Ad Soyad: ${name}`,
    `E-posta: ${email}`,
    `Telefon: ${phone}`,
    `İşletme: ${companyName || "-"}`,
    `Sektör: ${sector || "-"}`,
    `Ürünler: ${products.join(", ")}`,
    `Sıklık: ${quantity || "-"}`,
    `Bütçe: ${budget || "-"}`,
    "",
    "Not:",
    message || "-",
  ].join("\n");

  const rows = emailTable(
    emailRow("Ad Soyad", `<strong>${escapeHtml(name)}</strong>`) +
      emailRow("E-posta", `<a href="mailto:${escapeHtml(email)}" style="color:#5C4100">${escapeHtml(email)}</a>`) +
      emailRow("Telefon", `<a href="tel:${escapeHtml(phone)}" style="color:#5C4100">${escapeHtml(phone)}</a>`) +
      emailRow("İşletme", escapeHtml(companyName || "-")) +
      emailRow("Sektör", escapeHtml(sector || "-")) +
      emailRow("Ürünler", escapeHtml(products.join(", "))) +
      emailRow("Sıklık", escapeHtml(quantity || "-")) +
      emailRow("Bütçe", escapeHtml(budget || "-")),
  );
  const html = renderEmail({
    title: "Yeni Teklif Talebi",
    intro: `Talep No: ${escapeHtml(ticketId)}`,
    preheader: `${escapeHtml(name)} — ${escapeHtml(companyName || sector || "teklif")}`,
    bodyHtml: `${rows}
      <div style="margin-top:18px;padding-top:16px;border-top:1px solid #e7e5e4">
        <p style="margin:0 0 6px;color:#78716c;font-size:13px">Not</p>
        <p style="margin:0;white-space:pre-wrap;font-size:14px;line-height:1.6;color:#1A1410">${escapeHtml(message || "-")}</p>
      </div>`,
    footnote:
      "Bu e-postaya doğrudan yanıtlayarak müşteriye dönüş yapabilirsiniz (Yanıtla → müşteri e-postası).",
  });

  try {
    await sendMail({
      to: getContactTo(),
      subject: `Yeni teklif talebi: ${companyName || sector || name}`,
      text,
      html,
      replyTo: email,
    });
  } catch (err) {
    console.error(
      `[teklif-al] mail gönderilemedi (${ticketId}) — talep LOGLANDI:`,
      (err as Error).message,
      JSON.stringify({ ticketId, name, email, phone, companyName, sector, products, budget, quantity, message }),
    );
    return NextResponse.json({
      ok: true,
      ticketId,
      degraded: true,
      message:
        "Talebini aldık. En hızlı dönüş için WhatsApp hattımızdan da yazabilirsin: 0531 900 41 02",
    });
  }

  return NextResponse.json({
    ok: true,
    ticketId,
    message: "Teklif talebin bize ulaştı. 24 saat içinde dönüş yapacağız.",
  });
}
