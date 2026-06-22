import { getAdminApi } from "@/lib/api";
import { LoadErrorBanner } from "@/components/load-error-banner";
import { BakimClient } from "./bakim-client";

export default async function MaintenanceSettingsPage() {
  let initial: Record<string, unknown> = {};
  let loadError = false;
  try {
    const api = await getAdminApi();
    initial = await api.settings.get("maintenance");
  } catch {
    loadError = true;
  }
  return (
    <>
      {loadError && <LoadErrorBanner />}
      <BakimClient initial={initial} />
    </>
  );
}
