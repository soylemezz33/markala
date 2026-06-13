import { getAdminApi } from "@/lib/api";
import { GenelClient } from "./genel-client";

export default async function GeneralSettingsPage() {
  const api = await getAdminApi();
  const initial = await api.settings.get("general");

  return <GenelClient initial={initial} />;
}
