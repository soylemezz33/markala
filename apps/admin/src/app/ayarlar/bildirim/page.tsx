import { getAdminApi } from "@/lib/api";
import { BildirimClient } from "./bildirim-client";

export default async function NotificationSettingsPage() {
  const api = await getAdminApi();
  const initial = await api.settings.get("notification");

  return <BildirimClient initial={initial} />;
}
