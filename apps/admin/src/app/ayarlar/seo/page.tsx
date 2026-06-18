import { getAdminApi } from "@/lib/api";
import { LoadErrorBanner } from "@/components/load-error-banner";
import { SeoClient } from "./seo-client";

export default async function SeoSettingsPage() {
  let initial: Record<string, unknown> = {};
  let loadError = false;
  try {
    const api = await getAdminApi();
    initial = await api.settings.get("seo");
  } catch {
    loadError = true;
  }
  return (
    <>
      {loadError && <LoadErrorBanner />}
      <SeoClient initial={initial} />
    </>
  );
}
