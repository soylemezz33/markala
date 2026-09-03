import { NextRequest, NextResponse } from 'next/server';
import { isMailConfigured, sendMail, getContactTo } from '@/lib/mailer';
import { renderEmail, emailRow, emailTable } from '@/lib/email-template';
import { verifyTurnstile } from '@/lib/turnstile';

// nodemailer Node.js stream API'lerine ihtiyaç duyar — edge runtime'da çalışmaz.
export const runtime = 'nodejs';

// ─── Rate limiter (in-memory, 1 istek / IP / dakika) ──────────────────────
const rateMap = new Map<string, { count: number; reset: number }>();
const RATE_WINDOW_MS = 60_000; // 1 dakika
const RATE_LIMIT = 1;

function getClientIp(req: NextRequest): string {
  return (
    req.headers.get('cf-connecting-ip') ??
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
    req.headers.get('x-real-ip') ??
    'unknown'
  );
}

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const rec = rateMap.get(ip);
  if (!rec || now > rec.reset) {
    rateMap.set(ip, { count: 1, reset: now + RATE_WINDOW_MS });
    return false;
  }
  if (rec.count >= RATE_LIMIT) return true;
  rec.count++;
  return false;
}

// ─── XSS-güvenli HTML escape ──────────────────────────────────────────────
function esc(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

// ─── Admin bildirim e-postası ──────────────────────────────────────────────
function buildAdminHtml(params: {
  ad: string;
  email: string;
  telefon?: string;
  konu: string;
  mesaj: string;
}): string {
  const rows = [
    emailRow('Ad Soyad', esc(params.ad)),
    emailRow(
      'E-posta',
      `<a href="mailto:${esc(params.email)}" style="color:#4B3AA0">${esc(params.email)}</a>`,
    ),
    ...(params.telefon ? [emailRow('Telefon', esc(params.telefon))] : []),
    emailRow('Konu', esc(params.konu)),
    emailRow('Mesaj', `<span style="white-space:pre-wrap">${esc(params.mesaj)}</span>`),
  ].join('');

  return renderEmail({
    title: 'Yeni İletişim Formu Mesajı',
    preheader: `${params.ad} yazdı: ${params.konu}`,
    bodyHtml: emailTable(rows),
    footnote:
      'Bu mesajı yanıtlamak için Reply-To adresi otomatik ayarlandı; doğrudan yanıtlayabilirsiniz.',
  });
}

// ─── Müşteri otomatik yanıt e-postası ─────────────────────────────────────
function buildAutoReplyHtml(ad: string, konu: string): string {
  return renderEmail({
    title: 'Mesajınız Alındı',
    preheader: 'Markala, en kısa sürede size dönüş yapacağız',
    bodyHtml: `
      <p style="margin:0 0 12px">Merhaba <strong>${esc(ad)}</strong>,</p>
      <p style="margin:0 0 12px">
        "<strong>${esc(konu)}</strong>" konusundaki mesajınız tarafımıza iletildi.
        Ekibimiz en geç <strong>1 iş günü</strong> içinde size dönüş yapacak.
      </p>
      <p style="margin:0 0 20px">
        Acil durumlar için WhatsApp hattımızdan ulaşabilirsiniz:
        <a href="https://wa.me/905319004102" style="color:#4B3AA0;font-weight:600">
          0531 900 41 02
        </a>
      </p>
      <p style="margin:0;color:#78716c;font-size:13px">İyi günler dileriz,<br>Markala Ekibi</p>
    `,
  });
}

// ─── POST handler ──────────────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  const ip = getClientIp(req);

  if (isRateLimited(ip)) {
    return NextResponse.json(
      { error: 'Çok fazla istek gönderdiniz. Lütfen bir dakika sonra tekrar deneyin.' },
      { status: 429 },
    );
  }

  let body: {
    ad?: string;
    email?: string;
    telefon?: string;
    konu?: string;
    mesaj?: string;
    turnstileToken?: string;
  };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Geçersiz istek.' }, { status: 400 });
  }

  const { ad, email, telefon, konu, mesaj, turnstileToken } = body;

  // Alan doğrulama
  if (!ad || ad.trim().length < 2) {
    return NextResponse.json(
      { error: 'Ad Soyad zorunludur (en az 2 karakter).' },
      { status: 422 },
    );
  }
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json(
      { error: 'Geçerli bir e-posta adresi giriniz.' },
      { status: 422 },
    );
  }
  if (!mesaj || mesaj.trim().length < 10) {
    return NextResponse.json(
      { error: 'Mesaj en az 10 karakter olmalıdır.' },
      { status: 422 },
    );
  }

  // Turnstile bot koruması
  if (!(await verifyTurnstile(turnstileToken, ip))) {
    return NextResponse.json(
      { error: 'Güvenlik doğrulaması başarısız. Sayfayı yenileyip tekrar deneyin.' },
      { status: 400 },
    );
  }

  // SMTP yapılandırılmamışsa (dev/test) logla ve başarı dön
  if (!isMailConfigured()) {
    console.log('[iletisim] SMTP devre dışı — form verisi:', { ad, email, telefon, konu, mesaj });
    return NextResponse.json({ success: true });
  }

  const adTrimmed = ad.trim();
  const emailTrimmed = email.trim();
  const konuLabel = konu?.trim() || 'Genel Bilgi';

  // 1) Admin bildirimi — başarısız olursa 500 dön
  try {
    await sendMail({
      to: getContactTo(),
      subject: `[Markala İletişim] ${konuLabel} - ${adTrimmed}`,
      html: buildAdminHtml({
        ad: adTrimmed,
        email: emailTrimmed,
        telefon: telefon?.trim() || undefined,
        konu: konuLabel,
        mesaj: mesaj.trim(),
      }),
      replyTo: emailTrimmed,
    });
  } catch (err) {
    console.error('[iletisim] admin mail gönderilemedi:', (err as Error).message);
    return NextResponse.json(
      {
        error:
          'Mesajınız gönderilemedi. Lütfen daha sonra tekrar deneyin veya WhatsApp üzerinden ulaşın.',
      },
      { status: 500 },
    );
  }

  // 2) Müşteri otomatik yanıt — best-effort, başarısız olsa bile 200 dön
  try {
    await sendMail({
      to: emailTrimmed,
      subject: 'Markala - Mesajınız alındı',
      html: buildAutoReplyHtml(adTrimmed, konuLabel),
    });
  } catch (err) {
    console.warn('[iletisim] otomatik yanıt gönderilemedi (best-effort):', (err as Error).message);
  }

  return NextResponse.json({ success: true });
}
