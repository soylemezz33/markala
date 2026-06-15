import { getAdminApi } from "@/lib/api";
import { PackagesClient } from "./packages-client";

export default async function KampanyaPaketleriPage() {
  const api = await getAdminApi();
  const packages = await api.campaignPackages.list();
  return <PackagesClient packages={packages as never} />;
}
