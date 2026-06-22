import { getAdminApi } from "@/lib/api";
import { LoadErrorBanner } from "@/components/load-error-banner";
import { GenelClient } from "./genel-client";

export default async function GeneralSettingsPage() {
  let initial: Record<string, unknown> = {};
  let loadError = false;
  let shipping: Record<string, unknown> = {};
  try {
    const api = await getAdminApi();
    initial = await api.settings.get("general");
    try {
      shipping = await api.settings.get("shipping");
    } catch {
      shipping = {};
    }
  } catch {
    loadError = true;
  }
  return (
    <>
      {loadError && <LoadErrorBanner />}
      <GenelClient initial={initial} initialShipping={shipping} />
    </>
  );
}
