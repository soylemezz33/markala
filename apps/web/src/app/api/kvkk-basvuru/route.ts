import { NextRequest, NextResponse } from "next/server";
import { getContactTo, isMailConfigured, sendMail } from "@/lib/mailer";

// nodemailer Node.js API'leri gerektirir — edge runtime'da çalışmaz.
export const runtime = "nodejs";

const REQUEST_TYPE_LABELS: Record<string, string> = {
  bilgi: "Bilgi talebi",
  silme: "Verilerin silinmesi",
  duzeltme: "Verilerin düzeltilmesi",
  tasima: "Veri taşınabilirliği",
  itiraz: "İşlemeye itiraz",
  aktarim: "Aktarım bilgisi",
  diger: "Diğer",
};

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

interface KvkkPayload {
  fullName?: string;
  tcKimlik?: string;
  email?: string;
  phone?: string;
  requestType?: string;
  details?: string;
  hasIdDocument?: boolean;
  _hp?: string; // honeypot — dolu gelirse bot
}

/**
 * TC Kimlik No checksum doğrulaması.
 * Tek pozisyonlar × 7 - çift pozisyonlar = 10. hane (mod 10)
 * İlk 10 hane toplamı = 11. hane (mod 10)
 */
function isValidTcKimlik(tc: string): boolean {
  if (!/^\d{11}$/.test(tc)) return false;
  if (tc[0] === "0") return false;
  const d = tc.split("").map(Number);
  // noUncheckedIndexedAccess aktif: regex 11 haneyi garantiler, ?? 0 yalnız tip güvenliği
  const at = (i: number): number => d[i] ?? 0;
  const odd = at(0) + at(2) + at(4) + at(6) + at(8);
  const even = at(1) + at(3) + at(5) + at(7);
  const d10 = ((odd * 7) - even + 100) % 10;
  const d11 = (at(0) + at(1) + at(2) + at(3) + at(4) + at(5) + at(6) + at(7) + at(8) + at(9)) % 10;
  return at(9) === d10 && at(10) === d11;
}

const VALID_TYPES = [
  "bilgi",
  "silme",
  "duzeltme",
  "tasima",
  "itiraz",
  "aktarim",
  "diger",
];

/**
 * KVKK m.11 veri sahibi başvuru endpoint'i.
 * Şu an mock — backend bağlandığında:
 *   - prisma.kvkkRequest.create({ data: { ...payload, status: "PENDING", dueDate: +30gün } })
 *   - SendGrid mail → kvkk@markala.com.tr (veri sorumlusu inbox)
 *   - SendGrid mail → başvuru sahibi (alındı onayı + ticketId)
 *   - opsiyonel: Slack #kvkk webhook bildirim
 *
 * Yasal: KVKK 13. madde — 30 gün içinde ücretsiz yanıt zorunluluğu
 */
export async function POST(req: NextRequest) {
  let body: KvkkPayload;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Geçersiz istek." }, { status: 400 });
  }

  // Honeypot kontrolü — dolu gelirse sessiz red (bota hata mesajı verme)
  if (body._hp) {
    return NextResponse.json({ ok: true, ticketId: "KVKK-BOT", dueDate: "", message: "" });
  }

  const { fullName, tcKimlik, email, requestType, details } = body;

  // Validation
  if (!fullName || fullName.trim().length < 2) {
    return NextResponse.json({ error: "Ad soyad zorunlu." }, { status: 400 });
  }
  if (!email || !email.includes("@") || email.length < 5) {
    return NextResponse.json(
      { error: "Geçerli e-posta adresi zorunlu." },
      { status: 400 },
    );
  }
  if (tcKimlik && !isValidTcKimlik(tcKimlik)) {
    return NextResponse.json(
      { error: "TC Kimlik No geçersiz. Lütfen kontrol edin." },
      { status: 400 },
    );
  }
  if (!requestType || !VALID_TYPES.includes(requestType)) {
    return NextResponse.json(
      { error: "Geçersiz talep türü." },
      { status: 400 },
    );
  }
  if (!details || details.trim().length < 30) {
    return NextResponse.json(
      { error: "Talep detayı en az 30 karakter olmalı." },
      { status: 400 },
    );
  }

  const ticketId = `KVKK-${Date.now().toString(36).toUpperCase()}`;
  const dueDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
    .toISOString()
    .slice(0, 10);

  // PII loglanmaz — sadece ticketId + talep tipi + vade
  console.log(`[kvkk-basvuru] new application: ${ticketId} type=${requestType} dueDate=${dueDate}`);

  // SMTP yapılandırılmamışsa (dev/localhost) mock davranışı koru — geliştirmeyi bloke etme.
  if (!isMailConfigured()) {
    console.log(`[kvkk-basvuru] SMTP devre dışı (mock): ${ticketId}`);
    return NextResponse.json({
      ok: true,
      ticketId,
      dueDate,
      message:
        "Başvurunuz alındı. KVKK 13. madde gereği en geç 30 gün içinde e-posta ile dönüş yapılacaktır.",
    });
  }

  const typeLabel = REQUEST_TYPE_LABELS[requestType] ?? requestType;
  const text = [
    `Yeni KVKK m.11 veri sahibi başvurusu (${ticketId})`,
    `Yasal yanıt vadesi: ${dueDate} (KVKK m.13 — 30 gün)`,
    "",
    `Ad Soyad: ${fullName}`,
    `E-posta: ${email}`,
    `Telefon: ${body.phone || "-"}`,
    `TC Kimlik: ${tcKimlik ? tcKimlik.slice(0, 3) + "****" + tcKimlik.slice(-2) : "-"}`,
    `Kimlik belgesi ekli beyanı: ${body.hasIdDocument ? "Evet" : "Hayır"}`,
    `Talep türü: ${typeLabel}`,
    "",
    "Talep detayı:",
    details,
  ].join("\n");

  const html = `<div style="font-family:system-ui,sans-serif;max-width:560px;margin:0 auto;color:#1a1a1a">
    <h2 style="margin:0 0 4px">Yeni KVKK veri sahibi başvurusu</h2>
    <p style="color:#999;font-size:12px;margin:0 0 4px">Başvuru No: ${escapeHtml(ticketId)}</p>
    <p style="color:#b00;font-size:13px;margin:0 0 16px"><strong>Yasal yanıt vadesi: ${escapeHtml(dueDate)}</strong> (KVKK m.13 — 30 gün)</p>
    <table style="border-collapse:collapse;font-size:14px;width:100%">
      <tr><td style="padding:4px 8px;color:#666;white-space:nowrap;vertical-align:top">Ad Soyad</td><td style="padding:4px 8px;font-weight:600">${escapeHtml(fullName)}</td></tr>
      <tr><td style="padding:4px 8px;color:#666;vertical-align:top">E-posta</td><td style="padding:4px 8px"><a href="mailto:${escapeHtml(email)}">${escapeHtml(email)}</a></td></tr>
      <tr><td style="padding:4px 8px;color:#666;vertical-align:top">Telefon</td><td style="padding:4px 8px">${escapeHtml(body.phone || "-")}</td></tr>
      <tr><td style="padding:4px 8px;color:#666;vertical-align:top">Talep türü</td><td style="padding:4px 8px;font-weight:600">${escapeHtml(typeLabel)}</td></tr>
    </table>
    <hr style="border:none;border-top:1px solid #eee;margin:16px 0">
    <p style="white-space:pre-wrap;font-size:14px;line-height:1.5">${escapeHtml(details)}</p>
  </div>`;

  try {
    await sendMail({
      to: process.env.KVKK_TO || getContactTo(),
      subject: `[KVKK] ${typeLabel} — ${ticketId} (vade ${dueDate})`,
      text,
      html,
      replyTo: email,
    });
  } catch (err) {
    console.error(`[kvkk-basvuru] mail gönderilemedi ${ticketId}:`, (err as Error).message);
    return NextResponse.json(
      {
        error:
          "Başvurunuz şu an iletilemedi. Lütfen birkaç dakika sonra tekrar deneyin veya doğrudan kvkk@markala.com.tr adresine yazın.",
      },
      { status: 502 },
    );
  }

  return NextResponse.json({
    ok: true,
    ticketId,
    dueDate,
    message:
      "Başvurunuz alındı. KVKK 13. madde gereği en geç 30 gün içinde e-posta ile dönüş yapılacaktır.",
  });
}
