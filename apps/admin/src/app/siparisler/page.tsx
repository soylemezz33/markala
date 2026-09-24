import { getAdminApi } from "@/lib/api";
import { LoadErrorBanner } from "@/components/load-error-banner";
import { OrdersClient } from "./orders-client";

export default async function OrdersAdminPage() {
  let orders: unknown[] = [];
  let loadError = false;
  try {
    const api = await getAdminApi();
    // list: true → kalemler gelmesin; bu ekran onları kullanmıyor ve yanıtı 5 katına çıkarıyorlardı.
    orders = await api.orders.listAll({ take: 100, list: true });
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
