import { getAdminApi } from "@/lib/api";
import { LoadErrorBanner } from "@/components/load-error-banner";
import { UrunSatisClient } from "./urun-satis-client";
import type { AdminUrunSatisDto } from "@markala/api-client";

export const dynamic = "force-dynamic";

const ALLOWED_DAYS = [30, 90, 365] as const;

/**
 * Ürün Satışları (2026-10-08, Hasan: "hangi üründen totalde kaç tane satılmış, panelde bir
 * sayfa"). Sipariş kümesi dashboard ve Ciro & Kâr ile aynı tanımdan gelir (gerçekleşen
 * sipariş: ödenmiş veya cari, iptal ve silinmiş hariç). Adet = kalem adedi; paket ürünlerde
 * paket sayısıdır, varyant sütunu paketi gösterir.
 */
function bos(days: number | null): AdminUrunSatisDto {
  return { gunSayisi: days, siparis: 0, adet: 0, ciro: 0, urunSayisi: 0, urunler: [] };
}

export default async function UrunSatislariPage({
  searchParams,
}: {
  searchParams?: { days?: string };
}) {
  const raw = Number(searchParams?.days);
  const days = (ALLOWED_DAYS as readonly number[]).includes(raw) ? raw : null;

  let data: AdminUrunSatisDto = bos(days);
  let loadError = false;
  try {
    const api = await getAdminApi();
    data = await api.adminUrunSatis(days ?? undefined);
  } catch {
    loadError = true;
  }

  return (
    <>
      {loadError && <LoadErrorBanner />}
      <UrunSatisClient data={data} days={days} />
    </>
  );
}
