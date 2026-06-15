import { NextRequest, NextResponse } from "next/server";
import { getContactTo, isMailConfigured, sendMail } from "@/lib/mailer";

// nodemailer Node.js API'lerine ihtiyaç duyar — edge runtime'da çalışmaz.
export const runtime = "nodejs";

interface OrderItemPayload {
  name?: string;
  summary?: string;
  quantity?: number;
  lineTotal?: number;
  needsDesign?: boolean;
  uploadedFileName?: string;
}

interface OrderNotifyPayload {
  orderNumber?: string;
  channel?: string; // "whatsapp" | "phone"
  customerName?: string;
  email?: string;
  phone?: string;
  accountType?: string; // "individual" | "corporate"
  taxOffice?: string;
  taxNumber?: string;
  address?: string;
  items?: OrderItemPayload[];
  subtotal?: number;
  shipping?: number;
  total?: number;
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

const tl = (n: number | undefined) => `${Number(n ?? 0).toLocaleString("tr-TR")} ₺`;

/**
 * Web sipariş bildirimi — checkout'ta (WhatsApp/telefon ile) verilen sipariş,
 * ekibe e-posta ile de iletilir (CONTACT_TO). WhatsApp'a EK bir kayıt kanalıdır;
 * admin paneli entegrasyonu (DB'ye yazma) ayrı/sonraki faz.
 *
 * Best-effort: SMTP yoksa veya gönderim başarısızsa bile checkout akışını bloke
 * ETMEZ — her zaman ok döner (asıl sipariş WhatsApp'tan da gidiyor).
 */
export async function POST(req: NextRequest) {
  let body: OrderNotifyPayload;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  const { orderNumber, channel, customerName, email, phone, accountType, taxOffice, taxNumber, address, items = [], subtotal, shipping, total } = body;

  if (!isMailConfigured()) {
    console.log("[siparis-bildirim] yeni sipariş (SMTP devre dışı, mock):", {
      orderNumber,
      customerName,
      total,
      items: items.length,
    });
    return NextResponse.json({ ok: true });
  }

  const itemLines = items.map(
    (i) =>
      `• ${i.name ?? "-"} — ${i.summary ?? ""} ×${i.quantity ?? 1} = ${tl(i.lineTotal)}` +
      (i.needsDesign ? " (tasarım desteği)" : "") +
      (i.uploadedFileName ? ` (dosya: ${i.uploadedFileName})` : ""),
  );

  const text = [
    `Yeni web siparişi — ${orderNumber ?? "-"}`,
    `Kanal: ${channel === "phone" ? "Telefon" : "WhatsApp"}`,
    "",
    ...itemLines,
    "",
    `Ara toplam: ${tl(subtotal)}`,
    `Kargo: ${shipping === 0 ? "Ücretsiz" : tl(shipping)}`,
    `Toplam: ${tl(total)} (KDV dahil)`,
    "",
    `Müşteri: ${customerName ?? "-"} (${accountType === "corporate" ? "Kurumsal" : "Bireysel"})`,
    `Telefon: ${phone ?? "-"}`,
    `E-posta: ${email ?? "-"}`,
    ...(accountType === "corporate" ? [`Vergi: ${taxOffice ?? "-"} / ${taxNumber ?? "-"}`] : []),
    `Teslimat: ${address ?? "-"}`,
  ].join("\n");

  const html = `<div style="font-family:system-ui,sans-serif;max-width:600px;margin:0 auto;color:#1a1a1a">
    <h2 style="margin:0 0 4px">Yeni web siparişi</h2>
    <p style="color:#999;font-size:12px;margin:0 0 12px">No: ${escapeHtml(orderNumber ?? "-")} · Kanal: ${escapeHtml(channel === "phone" ? "Telefon" : "WhatsApp")}</p>
    <ul style="font-size:14px;padding-left:18px;margin:0 0 12px">
      ${items.map((i) => `<li>${escapeHtml(i.name ?? "-")} — ${escapeHtml(i.summary ?? "")} ×${i.quantity ?? 1} = <b>${tl(i.lineTotal)}</b>${i.needsDesign ? " <em>(tasarım desteği)</em>" : ""}${i.uploadedFileName ? ` <em>(dosya: ${escapeHtml(i.uploadedFileName)})</em>` : ""}</li>`).join("")}
    </ul>
    <table style="border-collapse:collapse;font-size:14px;margin-bottom:12px">
      <tr><td style="padding:2px 8px;color:#666">Ara toplam</td><td style="padding:2px 8px">${tl(subtotal)}</td></tr>
      <tr><td style="padding:2px 8px;color:#666">Kargo</td><td style="padding:2px 8px">${shipping === 0 ? "Ücretsiz" : tl(shipping)}</td></tr>
      <tr><td style="padding:2px 8px;color:#666"><b>Toplam</b></td><td style="padding:2px 8px"><b>${tl(total)}</b> (KDV dahil)</td></tr>
    </table>
    <table style="border-collapse:collapse;font-size:14px">
      <tr><td style="padding:2px 8px;color:#666">Müşteri</td><td style="padding:2px 8px">${escapeHtml(customerName ?? "-")} (${accountType === "corporate" ? "Kurumsal" : "Bireysel"})</td></tr>
      <tr><td style="padding:2px 8px;color:#666">Telefon</td><td style="padding:2px 8px">${escapeHtml(phone ?? "-")}</td></tr>
      <tr><td style="padding:2px 8px;color:#666">E-posta</td><td style="padding:2px 8px">${escapeHtml(email ?? "-")}</td></tr>
      ${accountType === "corporate" ? `<tr><td style="padding:2px 8px;color:#666">Vergi</td><td style="padding:2px 8px">${escapeHtml(taxOffice ?? "-")} / ${escapeHtml(taxNumber ?? "-")}</td></tr>` : ""}
      <tr><td style="padding:2px 8px;color:#666;vertical-align:top">Teslimat</td><td style="padding:2px 8px">${escapeHtml(address ?? "-")}</td></tr>
    </table>
  </div>`;

  try {
    await sendMail({
      to: getContactTo(),
      subject: `Yeni web siparişi: ${orderNumber ?? "-"} — ${tl(total)}`,
      text,
      html,
      replyTo: email && email.includes("@") ? email : undefined,
    });
  } catch (err) {
    // Best-effort: sipariş WhatsApp'tan da gidiyor; bildirim maili başarısız olsa da akışı bloke etme.
    console.error(`[siparis-bildirim] mail gönderilemedi (${orderNumber}):`, (err as Error).message);
  }

  return NextResponse.json({ ok: true });
}
