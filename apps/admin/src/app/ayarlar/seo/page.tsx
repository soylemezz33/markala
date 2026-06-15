import { getAdminApi } from "@/lib/api";
import { SeoClient } from "./seo-client";

export default async function SeoSettingsPage() {
  const api = await getAdminApi();
  const initial = await api.settings.get("seo");

  return <SeoClient initial={initial} />;
}
