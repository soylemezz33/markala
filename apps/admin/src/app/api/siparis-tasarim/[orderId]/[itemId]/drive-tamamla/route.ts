import { NextRequest, NextResponse } from "next/server";
import { getAdminSession } from "@/lib/api";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const API_URL = process.env.API_URL ?? process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";
const CUID = /^[a-z0-9]{20,40}$/i;

/**
 * Doğrudan Drive yüklemesi — 2. adım: tamamla (2026-09-03).
 * Tarayıcı parçaları Drive'a PUT edip dosya kimliğini aldıktan sonra buraya bildirir;
 * API dosyayı Drive'da doğrular (klasör + boyut) ve DesignUpload kaydını yazar.
 */
export async function POST(req: NextRequest, { params }: { params: { orderId: string; itemId: string } }) {
  const session = await getAdminSession();
  if (!session?.accessToken) return NextResponse.json({ message: "Oturum geçersiz." }, { status: 401 });
  if (!CUID.test(params.orderId) || !CUID.test(params.itemId)) {
    return NextResponse.json({ message: "Geçersiz sipariş/satır kimliği." }, { status: 400 });
  }
  const body = await req.json().catch(() => null);
  if (!body || typeof body !== "object") return NextResponse.json({ message: "Gövde okunamadı." }, { status: 400 });
  let res: Response;
  try {
    res = await fetch(`${API_URL}/api/orders/${params.orderId}/items/${params.itemId}/tasarim/drive-tamamla`, {
      method: "POST",
      headers: { Authorization: `Bearer ${session.accessToken}`, "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
  } catch {
    return NextResponse.json({ message: "Sunucuya ulaşılamadı." }, { status: 502 });
  }
  const data = await res.json().catch(() => ({ message: "İstek başarısız." }));
  if (!res.ok && Array.isArray((data as { message?: unknown }).message)) {
    (data as { message: unknown }).message = (data as { message: string[] }).message.join(", ");
  }
  return NextResponse.json(data, { status: res.status });
}
