import { getAdminApi } from "@/lib/api";
import { AnalyticsClient } from "./analitik-client";
import type { AnalyticsOverviewDto } from "@markala/api-client";

export const dynamic = "force-dynamic";

const ALLOWED_DAYS = [7, 30, 90] as const;

export default async function AnalitikPage({
  searchParams,
}: {
  searchParams?: { days?: string };
}) {
  // days searchParam — yalnızca 7/30/90 kabul; geçersizse 30.
  const raw = Number(searchParams?.days);
  const days = (ALLOWED_DAYS as readonly number[]).includes(raw) ? raw : 30;

  const api = await getAdminApi();
  const overview: AnalyticsOverviewDto = await api.analytics.overview(days);

  return <AnalyticsClient overview={overview} days={days} />;
}
