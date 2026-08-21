import { getAdminApi } from "@/lib/api";
import { LoadErrorBanner } from "@/components/load-error-banner";
import { ProfitClient } from "./ciro-client";
import type { AdminProfitDto } from "@markala/api-client";

export const dynamic = "force-dynamic";

const ALLOWED_DAYS = [30, 90, 365] as const;

/** Veri çekilemezse sayfa çökmesin — boş ama tutarlı özet. */
function emptyProfit(days: number | null): AdminProfitDto {
  return {
    kapsam: { gunSayisi: days, kalemSayisi: 0, not: "" },
    toplam: { ciro: 0, maliyet: 0, kar: 0, marjYuzde: null, maliyetiBilinmeyenCiro: 0 },
    urunler: [],
    aylik: [],
  };
}

export default async function CiroPage({
  searchParams,
}: {
  searchParams?: { days?: string };
}) {
  const raw = Number(searchParams?.days);
  // "tümü" = days yok. Geçersiz değer de tümüne düşer.
  const days = (ALLOWED_DAYS as readonly number[]).includes(raw) ? raw : null;

  let data: AdminProfitDto = emptyProfit(days);
  let loadError = false;
  try {
    const api = await getAdminApi();
    data = await api.adminProfit(days ?? undefined);
  } catch {
    loadError = true;
  }

  return (
    <>
      {loadError && <LoadErrorBanner />}
      <ProfitClient data={data} days={days} />
    </>
  );
}
