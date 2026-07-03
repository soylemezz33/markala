import { NextResponse } from "next/server";

/**
 * CSP ihlal raporu toplayıcı — Report-Only fazı.
 *
 * next.config.mjs'deki `Content-Security-Policy-Report-Only` başlığı ihlalleri buraya POST eder.
 * Amaç: enforce'a (engelleme) geçmeden ÖNCE gerçekte hangi kaynakların yüklendiğini görmek.
 * Gürültüyü sınırlamak için yalnız özet (yönerge + engellenen URI + sayfa) loglanır;
 * tarayıcı eklentisi kaynaklı gürültü olabilir, o yüzden bu geçicidir.
 */
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface CspReport {
  "violated-directive"?: string;
  "effective-directive"?: string;
  "blocked-uri"?: string;
  "document-uri"?: string;
}

export async function POST(req: Request) {
  try {
    const body = (await req.json().catch(() => null)) as
      | { "csp-report"?: CspReport }
      | CspReport
      | null;
    const r: CspReport | undefined =
      (body && "csp-report" in body ? body["csp-report"] : (body as CspReport)) ?? undefined;
    if (r) {
      console.warn(
        "[csp-report]",
        JSON.stringify({
          directive: r["effective-directive"] || r["violated-directive"],
          blocked: r["blocked-uri"],
          page: r["document-uri"],
        }),
      );
    }
  } catch {
    // Rapor toplama asla hata döndürmemeli — sessizce yut.
  }
  // 204: tarayıcı yanıt gövdesi beklemiyor.
  return new NextResponse(null, { status: 204 });
}
