import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Health check endpoint — Cloudflare uptime monitor + Docker healthcheck için.
 * Hızlı, lightweight, dependency yok. 200 = sağlıklı.
 */
export async function GET() {
  return NextResponse.json(
    {
      status: "ok",
      service: "markala-web",
      timestamp: new Date().toISOString(),
      uptime: process.uptime?.() ?? null,
      version: process.env.NEXT_PUBLIC_APP_VERSION ?? "0.9.0",
    },
    {
      headers: {
        "Cache-Control": "no-store, no-cache, must-revalidate",
      },
    },
  );
}
