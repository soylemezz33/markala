import { getAdminApi } from "@/lib/api";
import { LoadErrorBanner } from "@/components/load-error-banner";
import { BildirimClient } from "./bildirim-client";

export default async function NotificationSettingsPage() {
  let initial: Record<string, unknown> = {};
  let loadError = false;
  try {
    const api = await getAdminApi();
    initial = await api.settings.get("notification");
  } catch {
    loadError = true;
  }
  return (
    <>
      {loadError && <LoadErrorBanner />}
      <BildirimClient initial={initial} />
    </>
  );
}
