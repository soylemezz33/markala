import { NextRequest, NextResponse } from 'next/server';
import nodemailer from 'nodemailer';

// Simple in-memory rate limiter (resets on restart — production: use Redis)
const requestCounts = new Map<string, { count: number; reset: number }>();
const RATE_LIMIT = 3; // max per IP per 10 min
const WINDOW_MS = 10 * 60 * 1000;

function getClientIp(req: NextRequest): string {
  return (
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
    req.headers.get('x-real-ip') ??
    'unknown'
  );
}

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const record = requestCounts.get(ip);
  if (!record || now > record.reset) {
    requestCounts.set(ip, { count: 1, reset: now + WINDOW_MS });
    return false;
  }
  if (record.count >= RATE_LIMIT) return true;
  record.count++;
  return false;
}

export async function POST(req: NextRequest) {
  const ip = getClientIp(req);
  if (isRateLimited(ip)) {
    return NextResponse.json(
      { error: 'Çok fazla istek gönderdiniz. Lütfen 10 dakika sonra tekrar deneyin.' },
      { status: 429 }
    );
  }

  let body: { ad?: string; email?: string; telefon?: string; konu?: string; mesaj?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Geçersiz istek.' }, { status: 400 });
  }

  const { ad, email, telefon, konu, mesaj } = body;

  if (!ad || !email || !mesaj) {
    return NextResponse.json({ error: 'Ad, e-posta ve mesaj zorunludur.' }, { status: 422 });
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: 'Geçerli bir e-posta adresi giriniz.' }, { status: 422 });
  }
  if (mesaj.length < 10) {
    return NextResponse.json({ error: 'Mesaj en az 10 karakter olmalıdır.' }, { status: 422 });
  }

  const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS } = process.env;
  if (!SMTP_HOST || !SMTP_PORT || !SMTP_USER || !SMTP_PASS) {
    console.error('SMTP env vars eksik');
    return NextResponse.json(
      { error: 'E-posta sistemi yapılandırılmamış. Lütfen WhatsApp üzerinden ulaşın.' },
      { status: 503 }
    );
  }

  const transporter = nodemailer.createTransport({
    host: SMTP_HOST,
    port: Number(SMTP_PORT),
    secure: Number(SMTP_PORT) === 465,
    auth: { user: SMTP_USER, pass: SMTP_PASS },
  });

  const html = `
    <h2>Yeni İletişim Formu Mesajı</h2>
    <table cellpadding="8" style="border-collapse:collapse;font-family:sans-serif">
      <tr><td><strong>Ad Soyad:</strong></td><td>${ad}</td></tr>
      <tr><td><strong>E-posta:</strong></td><td><a href="mailto:${email}">${email}</a></td></tr>
      ${telefon ? `<tr><td><strong>Telefon:</strong></td><td>${telefon}</td></tr>` : ''}
      ${konu ? `<tr><td><strong>Konu:</strong></td><td>${konu}</td></tr>` : ''}
      <tr><td><strong>Mesaj:</strong></td><td style="white-space:pre-wrap">${mesaj.replace(/</g, '&lt;')}</td></tr>
    </table>
  `;

  try {
    await transporter.sendMail({
      from: '"Markala İletişim" <' + SMTP_USER + '>',
      to: SMTP_USER,
      replyTo: email,
      subject: '[Markala] ' + (konu ?? 'Yeni mesaj') + ' — ' + ad,
      html,
    });
  } catch (err) {
    console.error('Mail gönderim hatası:', err);
    return NextResponse.json(
      { error: 'Mesajınız gönderilemedi. Lütfen daha sonra tekrar deneyin veya WhatsApp üzerinden ulaşın.' },
      { status: 500 }
    );
  }

  return NextResponse.json({ success: true });
}
