import { NextRequest, NextResponse } from "next/server";

export const runtime = "edge";

interface ContactPayload {
  name?: string;
  email?: string;
  phone?: string;
  subject?: string;
  message?: string;
  consent?: boolean;
}

/**
 * İletişim formu endpoint.
 * Şu an mock — backend bağlandığında SendGrid + DB log'a yazar.
 *
 * Production:
 *   - prisma.contactSubmission.create({ data: { ... } })
 *   - sendgrid.client.send({ to: "merhaba@markala.com.tr", subject, ... })
 *   - opsiyonel: Slack webhook bildirim
 */
export async function POST(req: NextRequest) {
  let body: ContactPayload;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Geçersiz istek." }, { status: 400 });
  }

  const { name, email, subject, message } = body;

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

  // Mock — prod'da DB + email
  console.log("[iletisim] new submission:", {
    name,
    email,
    subject,
    messagePreview: message.slice(0, 80),
  });

  return NextResponse.json({
    ok: true,
    ticketId: `TK-${Date.now().toString(36).toUpperCase()}`,
    message: "Mesajınız bize ulaştı. 24 saat içinde dönüş yapacağız.",
  });
}
