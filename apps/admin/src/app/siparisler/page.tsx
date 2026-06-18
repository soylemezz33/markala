import { getAdminApi } from "@/lib/api";
import { LoadErrorBanner } from "@/components/load-error-banner";
import { OrdersClient } from "./orders-client";

export default async function OrdersAdminPage() {
  let orders: unknown[] = [];
  let loadError = false;
  try {
    const api = await getAdminApi();
    orders = await api.orders.listAll({ take: 100 });
  } catch {
    // Geçici backend hatası — sayfayı çökertme, boş listeyle + uyarıyla render et.
    loadError = true;
  }
  return (
    <>
      {loadError && <LoadErrorBanner />}
      <OrdersClient orders={orders as never} />
    </>
  );
}
