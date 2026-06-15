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
  return <OrderDetailClient order={order as never} />;
}
