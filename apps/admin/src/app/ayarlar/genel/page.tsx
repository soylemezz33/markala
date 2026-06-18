import { getAdminApi } from "@/lib/api";
import { LoadErrorBanner } from "@/components/load-error-banner";
import { GenelClient } from "./genel-client";

export default async function GeneralSettingsPage() {
  let initial: Record<string, unknown> = {};
  let loadError = false;
  try {
    const api = await getAdminApi();
    initial = await api.settings.get("general");
  } catch {
    loadError = true;
  }
  return (
    <>
      {loadError && <LoadErrorBanner />}
      <GenelClient initial={initial} />
    </>
  );
}
