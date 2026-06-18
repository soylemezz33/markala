import { getAdminApi } from "@/lib/api";
import { LoadErrorBanner } from "@/components/load-error-banner";
import { AnalyticsClient } from "./analitik-client";
import type { AnalyticsOverviewDto } from "@markala/api-client";

export const dynamic = "force-dynamic";

const ALLOWED_DAYS = [7, 30, 90] as const;

/** Veri çekimi başarısızsa kullanılan boş/güvenli özet (sayfa çökmesin diye). */
function emptyOverview(days: number): AnalyticsOverviewDto {
  const today = new Date().toISOString().slice(0, 10);
  return {
    range: { days, from: today, to: today },
    collecting: false,
    kpis: {
      sessions: 0, uniqueVisitors: 0, pageViews: 0, productViews: 0,
      addToCarts: 0, checkouts: 0, orders: 0, conversionRate: 0,
      returningRate: 0, avgDwellMs: 0,
    },
    topProducts: [],
    funnel: [],
    trafficByDay: [],
    visitHeatmap: [],
    deviceBreakdown: [],
    customers: {
      total: 0, withOrders: 0, conversionRate: 0,
      newThisPeriod: 0, returning: 0, segments: [],
    },
  };
}

export default async function AnalitikPage({
  searchParams,
}: {
  searchParams?: { days?: string };
}) {
  // days searchParam — yalnızca 7/30/90 kabul; geçersizse 30.
  const raw = Number(searchParams?.days);
  const days = (ALLOWED_DAYS as readonly number[]).includes(raw) ? raw : 30;

  let overview: AnalyticsOverviewDto = emptyOverview(days);
  let loadError = false;
  try {
    const api = await getAdminApi();
    overview = await api.analytics.overview(days);
  } catch {
    // Geçici backend hatası — sayfayı çökertme, boş özetle + uyarıyla render et.
    loadError = true;
  }

  return (
    <>
      {loadError && <LoadErrorBanner />}
      <AnalyticsClient overview={overview} days={days} />
    </>
  );
}
