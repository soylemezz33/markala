import { NextResponse } from "next/server";
import { getAdminApi, getAdminSession } from "@/lib/api";

/**
 * 2026-08-21 DÜZELTME: bu uç yalnız oturum çerezindeki rolü dönüyordu; `permissions`
 * hiç gelmiyordu. Sonuç: admin-shell'deki menü filtresi SESSİZCE DEVRE DIŞIYDI
 * (perms undefined → her şey görünür) ve tasarımcı tüm menüyü görüyordu (Hasan bildirdi).
 *
 * İzinler API'den alınıyor — rol→izin haritasını panelde KOPYALAMAMAK için. Kopyalasaydık
 * iki kaynak zamanla birbirinden ayrılır ve menü, gerçek yetkiyle çelişirdi.
 * API'ye ulaşılamazsa izinler boş geçilir; menü tam görünür ama GÜVENLİK SINIRI
 * uçlardaki RolesGuard olduğu için erişim yine engellenir.
 */
export async function GET() {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ user: null }, { status: 401 });

  let permissions: string[] | undefined;
  try {
    const api = await getAdminApi();
    const me = (await api.auth.me()) as unknown as { permissions?: string[] };
    if (Array.isArray(me?.permissions)) permissions = me.permissions;
  } catch {
    // yut — aşağıda rolle birlikte izinsiz dönülür
  }

  return NextResponse.json({
    user: { email: session.email, name: session.name, role: session.role, permissions },
  });
}
