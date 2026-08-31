import { NextResponse } from "next/server";

/**
 * CSP ihlal raporu toplayıcı — Report-Only fazı.
 *
 * next.config.mjs'deki `Content-Security-Policy-Report-Only` başlığı ihlalleri buraya
 * POST eder. Amaç: enforce'a (engelleme) geçmeden ÖNCE gerçekte hangi kaynakların
 * yüklendiğini görmek.
 *
 * 2026-08-31 — KALICI DEPOLAMAYA GEÇİLDİ. Eskiden yalnız `console.warn` ile konteyner
 * loguna yazılıyordu; her deploy'da konteyner yeniden yaratıldığı için loglar
 * SIFIRLANIYORDU. "Son 30 gün" diye bakılan 13 kaydın aslında 18 dakikalık olduğu
 * fark edildi — böyle bir pencereyle "başka ihlal yok" sonucuna varılamaz.
 * Rapor artık API'ye iletiliyor ve `csp_violations` tablosunda (directive, blockedUri)
 * başına tek satır olarak sayaçla birikiyor.
 *
 * SÖZLEŞME: her koşulda 204. API ulaşılamazsa rapor kaybolur ama sayfa etkilenmez.
 */
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const API_BASE = (
  process.env.API_INTERNAL_URL ||
  process.env.NEXT_PUBLIC_API_URL ||
  "http://api:4000"
).replace(/\/$/, "");

export async function POST(req: Request) {
  try {
    const govde = await req.text();
    if (govde) {
      // Bekletmiyoruz: tarayıcı 204'ü hemen almalı, iletim arka planda tamamlansın.
      void fetch(`${API_BASE}/api/csp/report`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: govde,
        // Rapor iletimi sayfayı asla bekletmemeli.
        signal: AbortSignal.timeout(3000),
      }).catch(() => {
        // API kapalıysa sessizce geç — rapor kaybı kabul edilebilir, hata değil.
      });
    }
  } catch {
    // Gövde okunamadıysa da sessizce yut.
  }
  // 204: tarayıcı yanıt gövdesi beklemiyor.
  return new NextResponse(null, { status: 204 });
}
