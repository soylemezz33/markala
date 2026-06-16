import { NextRequest, NextResponse } from "next/server";

export const runtime = "edge";

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

  // Mock kayıt — prod'da DB + mail
  const ticketId = `KVKK-${Date.now().toString(36).toUpperCase()}`;
  const dueDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
    .toISOString()
    .slice(0, 10);

  // PII loglanmaz — sadece ticketId + talep tipi + vade
  console.log(`[kvkk-basvuru] new application: ${ticketId} type=${requestType} dueDate=${dueDate}`);

  // TODO: prod'da
  //   await prisma.kvkkRequest.create({ ... })
  //   await sendgrid.send({ to: "kvkk@markala.com.tr", ... })
  //   await sendgrid.send({ to: email, subject: "Başvurunuz alındı", ... })

  return NextResponse.json({
    ok: true,
    ticketId,
    dueDate,
    message:
      "Başvurunuz alındı. KVKK 13. madde gereği en geç 30 gün içinde e-posta ile dönüş yapılacaktır.",
  });
}
