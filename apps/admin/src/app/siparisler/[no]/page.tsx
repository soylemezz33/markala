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
  } catch {
    notFound();
  }
  return <OrderDetailClient order={order as never} />;
}
