import { NextRequest, NextResponse } from "next/server";
import { BYPASS_COOKIE, getApiBase, verifyBypass } from "@/lib/maintenance";

/**
 * Bakım modu choke point'i.
 *
 * Her istekte public config'i (kısa TTL) okur; `enabled` ise VE geçerli `mk_preview` bypass çerezi
 * yoksa markalı bir 503 sayfası döner. Admin storefront'a giriş yaptığında bypass çerezi yazılır
 * (bkz. /api/maintenance/bypass) ve siteyi canlı gezebilir.
 *
 * Kurallar:
 * - `/giris*` ve `/api/*` bakımda da AÇIK kalır (admin giriş yapıp bypass çerezini alabilsin).
 * - Config fetch hatası → FAIL-OPEN: geçici bir API hatası tüm siteyi karartmasın.
 */

interface PublicConfig {
  maintenance: { enabled: boolean; title: string; message: string };
  contact: { phone: string; whatsapp: string; email: string };
}

// Best-effort in-memory cache (Node standalone'da process içinde kalıcı; edge'de kalmazsa
// API'nin kendi 10sn cache'i zaten ucuz tutar).
let cache: { at: number; data: PublicConfig } | null = null;
const TTL_MS = 8_000;

async function getConfig(): Promise<PublicConfig | null> {
  if (cache && Date.now() - cache.at < TTL_MS) return cache.data;
  try {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 2000);
    const res = await fetch(`${getApiBase()}/api/settings/public`, {
      cache: "no-store",
      signal: ctrl.signal,
    });
    clearTimeout(timer);
    if (!res.ok) return null;
    const data = (await res.json()) as PublicConfig;
    cache = { at: Date.now(), data };
    return data;
  } catch {
    return null; // fail-open
  }
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Login akışı bakımda da açık olmalı — admin giriş yapıp bypass çerezini alabilsin.
  if (pathname === "/giris" || pathname.startsWith("/giris/")) {
    return NextResponse.next();
  }

  const cfg = await getConfig();
  if (!cfg || !cfg.maintenance.enabled) return NextResponse.next();

  const token = req.cookies.get(BYPASS_COOKIE)?.value;
  if (await verifyBypass(token)) return NextResponse.next();

  return new NextResponse(renderMaintenanceHtml(cfg), {
    status: 503,
    headers: {
      "content-type": "text/html; charset=utf-8",
      "cache-control": "no-store, no-cache, must-revalidate",
      "retry-after": "3600",
    },
  });
}

export const config = {
  // _next, statik (dotlu) dosyalar ve /api hariç her yol middleware'den geçer.
  // Statik dosyalar hariç tutulur → 503 sayfası favicon/og görselini yükleyebilir.
  matcher: ["/((?!_next/|api/|.*\\..*).*)"],
};

function esc(s: string): string {
  return s.replace(
    /[&<>"']/g,
    (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!,
  );
}

function renderMaintenanceHtml(cfg: PublicConfig): string {
  const title = cfg.maintenance.title.trim() || "Kısa bir aradayız";
  const message =
    cfg.maintenance.message.trim() ||
    "Sitemizde kısa süreli bir bakım çalışması yapıyoruz. Çok yakında tekrar buradayız — anlayışınız için teşekkürler.";
  const { phone, whatsapp, email } = cfg.contact;
  const waDigits = whatsapp.replace(/\D/g, "");

  const buttons: string[] = [];
  if (waDigits)
    buttons.push(`<a class="btn btn-primary" href="https://wa.me/${waDigits}">WhatsApp'tan yazın</a>`);
  if (phone)
    buttons.push(`<a class="btn" href="tel:${esc(phone.replace(/\s/g, ""))}">${esc(phone)}</a>`);
  if (email) buttons.push(`<a class="btn btn-ghost" href="mailto:${esc(email)}">${esc(email)}</a>`);
  const contactBlock = buttons.length
    ? `<div class="contact">${buttons.join("")}</div>`
    : "";

  return `<!doctype html>
<html lang="tr">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex">
<title>${esc(title)} · Markala</title>
<link rel="icon" href="/favicon.ico">
<style>
  *{box-sizing:border-box;margin:0;padding:0}
  body{min-height:100vh;display:flex;align-items:center;justify-content:center;
    background:#F8F4E8;color:#1A1410;
    font-family:"DM Sans",system-ui,-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;
    padding:24px;line-height:1.6}
  .card{max-width:520px;width:100%;background:#fff;border:1px solid #ECE4D0;border-radius:20px;
    padding:48px 40px;text-align:center;box-shadow:0 12px 40px rgba(26,20,16,.08)}
  .logo{display:inline-flex;align-items:center;font-size:30px;font-weight:700;letter-spacing:-.02em;
    margin-bottom:28px}
  .logo .dot{width:12px;height:12px;border-radius:50%;background:#F5C518;margin-left:4px;
    margin-top:14px}
  .badge{display:inline-block;font-size:12px;font-weight:600;text-transform:uppercase;
    letter-spacing:.08em;color:#9A7B1E;background:#FCF3D2;border:1px solid #F3E2A0;
    padding:6px 14px;border-radius:999px;margin-bottom:20px}
  h1{font-size:26px;font-weight:700;letter-spacing:-.02em;margin-bottom:12px}
  p{font-size:16px;color:#5C5346;max-width:42ch;margin:0 auto}
  .contact{display:flex;flex-wrap:wrap;gap:10px;justify-content:center;margin-top:32px}
  .btn{display:inline-block;padding:11px 20px;border-radius:12px;font-size:14px;font-weight:600;
    text-decoration:none;border:1px solid #E3D9C3;color:#1A1410;background:#fff;transition:.15s}
  .btn:hover{background:#F8F4E8}
  .btn-primary{background:#1A1410;color:#fff;border-color:#1A1410}
  .btn-primary:hover{background:#000}
  .btn-ghost{background:transparent;border-color:transparent;color:#8A7E6B}
  .btn-ghost:hover{color:#1A1410}
  .admin-link{display:inline-block;margin-top:28px;font-size:13px;color:#A99F8C;text-decoration:none}
  .admin-link:hover{color:#1A1410;text-decoration:underline}
</style>
</head>
<body>
  <main class="card">
    <div class="logo">markala<span class="dot"></span></div>
    <div class="badge">Bakım Çalışması</div>
    <h1>${esc(title)}</h1>
    <p>${esc(message)}</p>
    ${contactBlock}
    <a class="admin-link" href="/giris">Yönetici girişi</a>
  </main>
</body>
</html>`;
}
