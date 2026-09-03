import { getAdminApi } from "@/lib/api";
import { LoadErrorBanner } from "@/components/load-error-banner";
import { KargodaClient, type KargoSiparis } from "./kargoda-client";

/**
 * Üretim & Kargo ekranı (2026-09-03, üretim ARGE Faz 3; sekmeler Hasan'ın 5. maddesi).
 *
 * NEDEN: Hasan — "kargo hesabı kargodaki ürünleri değil ÜRETİMDEKİ ürünleri görecek ki bunlara
 * bakıp kargoda olarak işaretleyebilsin". Atölyede üretim ve kargo aynı kişide; bu yüzden tek
 * ekran üç sekme: Üretime hazır (tasarım onaylandı, üretime alınacak) · Üretimde · Kargoda.
 * Her kalem tasarımcı ÖNİZLEME görseliyle (yoksa müşteri görseli) listelenir; durum değişikliği
 * sipariş detayından yapılır — tek yazma yeri orası kalır.
 *
 * Veri: GET /orders?status=… (panel rolünde kalemlere designUploads eklenir; müşteri rolünde
 * o alan hiç gelmez). Üç liste paralel çekilir; biri düşerse diğerleri yine gösterilir.
 */
export default async function KargodaPage() {
  const bos: KargoSiparis[] = [];
  let uretimeHazir = bos, uretimde = bos, kargoda = bos;
  let loadError = false;
  try {
    const api = await getAdminApi();
    const [a, b, c] = await Promise.allSettled([
      api.orders.listAll({ status: "tasarim-onaylandi", take: 200 }),
      api.orders.listAll({ status: "uretimde", take: 200 }),
      api.orders.listAll({ status: "kargoya-verildi", take: 200 }),
    ]);
    const al = (r: PromiseSettledResult<unknown>) => {
      if (r.status === "rejected") { loadError = true; return bos; }
      return r.value as KargoSiparis[];
    };
    uretimeHazir = al(a); uretimde = al(b); kargoda = al(c);
  } catch {
    loadError = true;
  }
  return (
    <>
      {loadError && <LoadErrorBanner />}
      <KargodaClient uretimeHazir={uretimeHazir} uretimde={uretimde} kargoda={kargoda} />
    </>
  );
}
