import { NextResponse } from "next/server";
import { getAdminApi } from "@/lib/api";

export const runtime = "nodejs";

/**
 * Entegrasyonların GERÇEK yapılandırma durumu (env'den). ayarlar/api (client) bunu çekip
 * "Bağlı / Bağlı Değil" rozetini gerçeğe göre gösterir (eskiden sabit "connected" idi).
 * Admin oturum cookie'si sunucu tarafında getAdminApi ile taşınır.
 */
export async function GET() {
  try {
    const api = await getAdminApi();
    const stats = await api.adminStats();
    return NextResponse.json({ integrations: stats.integrations ?? null });
  } catch (e) {
    console.error('[integration-status] API bağlantı hatası:', (e as Error).message ?? e);
    return NextResponse.json({ integrations: null }, { status: 200 });
  }
}
