import { NextRequest, NextResponse } from "next/server";
import { getContactTo, isMailConfigured, sendMail } from "@/lib/mailer";

// nodemailer Node.js API'lerine ihtiyaç duyar — edge runtime'da çalışmaz.
export const runtime = "nodejs";

interface CorporatePayload {
  companyName?: string;
  taxOffice?: string;
  taxNumber?: string;
  sector?: string;
  annualVolume?: string;
  contactName?: string;
  contactRole?: string;
  email?: string;
  phone?: string;
  address?: string;
  notes?: string;
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
 * Kurumsal (B2B) başvuru endpoint.
 * 1) Başvuru NestJS API'ye yazılır → admin "Kurumsal Başvurular" listesine "pending" düşer.
 * 2) Ayrıca CONTACT_TO adresine e-posta bildirimi gönderilir (best-effort).
 * DB kaydı SMTP'den bağımsızdır; e-posta gitmese bile başvuru panelde görünür.
 */
async function persistApplication(refId: string, payload: CorporatePayload): Promise<void> {
  const apiBase =
    process.env.API_INTERNAL_URL || process.env.NEXT_PUBLIC_API_URL || "http://api:4000";
  try {
    const res = await fetch(`${apiBase}/corporate-applications`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      cache: "no-store",
    });
    if (!res.ok) {
      console.error(`[kurumsal-basvuru] DB kaydı başarısız (${refId}): HTTP ${res.status}`);
    }
  } catch (err) {
    console.error(`[kurumsal-basvuru] DB kaydı hatası (${refId}):`, (err as Error).message);
  }
}

export async function POST(req: NextRequest) {
  let body: CorporatePayload;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Geçersiz istek." }, { status: 400 });
  }

  const { companyName, taxOffice, taxNumber, sector, annualVolume, contactName, contactRole, email, phone, address, notes } = body;

  if (!companyName || companyName.length < 2) {
    return NextResponse.json({ error: "Firma ünvanı zorunlu." }, { status: 400 });
  }
  if (!taxNumber || taxNumber.length < 9) {
    return NextResponse.json({ error: "Geçerli vergi numarası zorunlu." }, { status: 400 });
  }
  if (!contactName || contactName.length < 2) {
    return NextResponse.json({ error: "Yetkili adı zorunlu." }, { status: 400 });
  }
  if (!email || !email.includes("@")) {
    return NextResponse.json({ error: "Geçerli e-posta zorunlu." }, { status: 400 });
  }
  if (!phone || phone.length < 10) {
    return NextResponse.json({ error: "Geçerli telefon zorunlu." }, { status: 400 });
  }

  const refId = `KB-${Date.now().toString(36).toUpperCase()}`;

  // DB'ye yaz (panele düşsün) — SMTP durumundan bağımsız, her zaman.
  await persistApplication(refId, {
    companyName, taxOffice, taxNumber, sector, annualVolume,
    contactName, contactRole, email, phone, address, notes,
  });

  if (!isMailConfigured()) {
    console.log(`[kurumsal-basvuru] yeni başvuru (SMTP devre dışı, mock): refId=${refId}`);
    return NextResponse.json({
      ok: true,
      refId,
      message: "Başvurunuz alındı. Satış ekibimiz en kısa sürede dönüş yapacak.",
    });
  }

  const rows: Array<[string, string]> = [
    ["Firma Ünvanı", companyName],
    ["Vergi Dairesi / No", `${taxOffice || "-"} / ${taxNumber}`],
    ["Sektör", sector || "-"],
    ["Yıllık Hacim", annualVolume || "-"],
    ["Yetkili", `${contactName}${contactRole ? " (" + contactRole + ")" : ""}`],
    ["E-posta", email],
    ["Telefon", phone],
    ["Adres", address || "-"],
    ["Notlar", notes || "-"],
  ];

  const text = [
    `Yeni kurumsal başvuru (${refId})`,
    "",
    ...rows.map(([k, v]) => `${k}: ${v}`),
  ].join("\n");

  const html = `<div style="font-family:system-ui,sans-serif;max-width:580px;margin:0 auto;color:#1a1a1a">
    <h2 style="margin:0 0 4px">Yeni kurumsal (B2B) başvuru</h2>
    <p style="color:#999;font-size:12px;margin:0 0 16px">Ref: ${escapeHtml(refId)}</p>
    <table style="border-collapse:collapse;font-size:14px;width:100%">
      ${rows.map(([k, v]) => `<tr><td style="padding:4px 8px;color:#666;white-space:nowrap;vertical-align:top">${escapeHtml(k)}</td><td style="padding:4px 8px">${escapeHtml(v)}</td></tr>`).join("")}
    </table>
  </div>`;

  try {
    await sendMail({
      to: getContactTo(),
      subject: `Yeni kurumsal başvuru: ${companyName}`,
      text,
      html,
      replyTo: email,
    });
  } catch (err) {
    console.error(`[kurumsal-basvuru] mail gönderilemedi (${refId}):`, (err as Error).message);
    return NextResponse.json(
      { error: "Şu an başvurunuzu iletemedik, lütfen telefonla ulaşın veya daha sonra tekrar deneyin." },
      { status: 502 },
    );
  }

  return NextResponse.json({
    ok: true,
    refId,
    message: "Başvurunuz alındı. Satış ekibimiz en kısa sürede dönüş yapacak.",
  });
}
