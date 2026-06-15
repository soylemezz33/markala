import { getAdminApi } from "@/lib/api";
import { OrdersClient } from "./orders-client";

export default async function OrdersAdminPage() {
  const api = await getAdminApi();
  const orders = await api.orders.listAll({ take: 100 });
  return <OrdersClient orders={orders as never} />;
}
