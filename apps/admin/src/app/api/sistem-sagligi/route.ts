import { NextResponse } from "next/server";
import { getAdminApi } from "@/lib/api";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Sistem sağlığı raporu (2026-09-07). Oturum cookie'si sunucu tarafında accessToken'a
 * çevrilip yetkili API ucuna taşınır — token tarayıcıya hiç inmez.
 *
 * API'ye ULAŞILAMAZSA bu uç 200 + "arizali" döner, 500 DEĞİL: sağlık sayfası tam da API
 * çöktüğünde çalışmak zorunda. Hata fırlatsaydı sayfa boş ekrana düşer, kesintiyi
 * göstermesi gereken araç kesintide kullanılamaz olurdu.
 */
export async function GET() {
  try {
    const api = await getAdminApi();
    const rapor = await api.sistemSagligi();
    return NextResponse.json(rapor, { headers: { "Cache-Control": "no-store" } });
  } catch (e) {
    const mesaj = (e as Error)?.message ?? "bilinmeyen hata";
    return NextResponse.json(
      {
        toplam: "arizali",
        olusturuldu: new Date().toISOString(),
        ulasilamadi: true,
        hataMesaji: mesaj.slice(0, 200),
      },
      { headers: { "Cache-Control": "no-store" } },
    );
  }
}
