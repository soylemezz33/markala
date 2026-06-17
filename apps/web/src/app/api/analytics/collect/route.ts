import { NextRequest, NextResponse } from "next/server";

// Backend'e (NestJS) sunucu-içinden ilet — public endpoint, token zorunlu değil.
export const runtime = "nodejs";

/**
 * Birinci-parti ziyaretçi olaylarını backend POST /api/analytics/collect'e iletir.
 *
 * İzleme ASLA kullanıcıyı etkilemez: backend yavaş/erişilemez/hatalı olsa bile client'a
 * her zaman { ok: true } (200) döner. Kısa timeout ile request'i bekletmeyiz.
 *
 * sendBeacon ile gelen istek genelde header'sız + text/plain'dir → body'yi req.text()
 * sonra JSON.parse ile okuruz (hem JSON fetch hem beacon çalışsın).
 *
 * Authorization header VARSA backend'e geçiririz (giriş yapmış kullanıcı → backend userId ekler).
 */

const API_BASE =
  process.env.API_INTERNAL_URL ||
  process.env.NEXT_PUBLIC_API_URL ||
  "http://api:4000";

const FORWARD_TIMEOUT_MS = 2500;

export async function POST(req: NextRequest) {
  // Beacon (text/plain) veya JSON — her ikisi de düz metin olarak okunup parse edilir.
  let parsed: unknown;
  try {
    const raw = await req.text();
    if (!raw) return NextResponse.json({ ok: true });
    parsed = JSON.parse(raw);
  } catch {
    // Bozuk gövde → izlemeyi sessizce yut, client'ı etkileme.
    return NextResponse.json({ ok: true });
  }

  const authHeader = req.headers.get("authorization") ?? undefined;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FORWARD_TIMEOUT_MS);

  try {
    await fetch(`${API_BASE}/api/analytics/collect`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(authHeader ? { Authorization: authHeader } : {}),
      },
      body: JSON.stringify(parsed),
      signal: controller.signal,
    });
  } catch {
    // timeout / backend erişilemez → yut. İzleme best-effort.
  } finally {
    clearTimeout(timer);
  }

  return NextResponse.json({ ok: true });
}
