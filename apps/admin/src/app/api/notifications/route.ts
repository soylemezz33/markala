import { NextResponse } from "next/server";
import { getAdminApi } from "@/lib/api";

// nodejs: server-side BFF (session cookie → accessToken).
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Bildirim çanı kaynağı — bekleyen işleri admin stats'tan türetir.
 * Tarayıcı token görmez; bu route session cookie ile API'yi çağırır (BFF).
 */
export async function GET() {
  try {
    const api = await getAdminApi();
    const s = await api.adminStats();

    const byStatus: Record<string, number> = {};
    for (const r of s.ordersByStatus ?? []) byStatus[r.status] = r.count;

    const items: Array<{ label: string; href: string }> = [];
    if ((s.pendingCorporate ?? 0) > 0)
      items.push({ label: `${s.pendingCorporate} bekleyen kurumsal başvuru`, href: "/musteriler/kurumsal-basvurular" });
    const tasarim = byStatus["tasarim-bekleniyor"] ?? 0;
    if (tasarim > 0) items.push({ label: `${tasarim} tasarım bekleyen sipariş`, href: "/siparisler" });
    const yeni = byStatus["siparis-alindi"] ?? 0;
    if (yeni > 0) items.push({ label: `${yeni} yeni sipariş`, href: "/siparisler" });
    const uretim = byStatus["uretimde"] ?? 0;
    if (uretim > 0) items.push({ label: `${uretim} üretimdeki sipariş`, href: "/siparisler" });

    return NextResponse.json({ count: items.length, items });
  } catch {
    return NextResponse.json({ count: 0, items: [] });
  }
}
