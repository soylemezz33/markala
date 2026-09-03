import { notFound } from "next/navigation";
import { getAdminApi } from "@/lib/api";
import { OrderDetailClient } from "./order-detail-client";

interface Props {
  params: { no: string };
}

export default async function OrderDetailPage({ params }: Props) {
  const { no: id } = params;
  const api = await getAdminApi();
  let order;
  try {
    order = await api.orders.detail(id);
  } catch (e) {
    // Yalnız gerçek 404 → bulunamadı; auth/sunucu hataları (401/500) yutulmasın.
    if ((e as { status?: number })?.status === 404) notFound();
    throw e;
  }
  // İç notlar burada çekilir: ilk boyamada dolu gelsin (client'ta ikinci tur beklenmesin).
  // Not defteri ikincil bir bilgi — çekilemezse sipariş detayı yine açılır, kart boş görünür.
  let notes: Awaited<ReturnType<typeof api.orders.notes>> = [];
  try {
    notes = await api.orders.notes(id);
  } catch {
    /* yetkisiz rol veya geçici hata — kart boş açılır */
  }
  return <OrderDetailClient order={order as never} initialNotes={notes} />;
}
