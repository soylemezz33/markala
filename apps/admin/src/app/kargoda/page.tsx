import { getAdminApi } from "@/lib/api";
import { LoadErrorBanner } from "@/components/load-error-banner";
import { KargodaClient, type KargoSiparis } from "./kargoda-client";

/**
 * Kargodaki ürünler (2026-09-03, üretim ARGE Faz 3).
 *
 * NEDEN: Hasan — "kargoya verilenleri tek ekranda görselleriyle görmek istiyorum; şu an
 * tek tek siparişe girip tasarımlara bakıyoruz, hangi bayrak kimin karışıyor". Bu sayfa
 * yalnız `kargoya_verildi` durumundaki siparişleri, kalem başına tasarımcı ÖNİZLEME
 * görseliyle (yoksa müşterinin yüklediği görselle) listeler. Durum burada değiştirilmez;
 * kart sipariş detayına götürür — tek yazma yeri orası kalır.
 *
 * Veri: GET /orders?status=kargoya-verildi — panel rolünde kalemlere designUploads eklenir
 * (orders.service listAll, 2026-09-03). Müşteri rolünde o alan hiç gelmez.
 */
export default async function KargodaPage() {
  let orders: KargoSiparis[] = [];
  let loadError = false;
  try {
    const api = await getAdminApi();
    orders = (await api.orders.listAll({ status: "kargoya-verildi", take: 200 })) as unknown as KargoSiparis[];
  } catch {
    loadError = true;
  }
  return (
    <>
      {loadError && <LoadErrorBanner />}
      <KargodaClient orders={orders} />
    </>
  );
}
