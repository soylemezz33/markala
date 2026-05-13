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
  if (tcKimlik && !/^\d{11}$/.test(tcKimlik)) {
    return NextResponse.json(
      { error: "TC Kimlik No 11 haneli rakam olmalı." },
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

  console.log("[kvkk-basvuru] new application:", {
    ticketId,
    fullName,
    email,
    requestType,
    hasTc: Boolean(tcKimlik),
    hasIdDoc: Boolean(body.hasIdDocument),
    detailsPreview: details.slice(0, 80),
    dueDate,
  });

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
