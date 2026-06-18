import { getAdminApi } from "@/lib/api";
import { LoadErrorBanner } from "@/components/load-error-banner";
import { PackagesClient } from "./packages-client";

export default async function KampanyaPaketleriPage() {
  let packages: unknown[] = [];
  let loadError = false;
  try {
    const api = await getAdminApi();
    packages = await api.campaignPackages.list();
  } catch {
    loadError = true;
  }
  return (
    <>
      {loadError && <LoadErrorBanner />}
      <PackagesClient packages={packages as never} />
    </>
  );
}
