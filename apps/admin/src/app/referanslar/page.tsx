import { getAdminApi } from "@/lib/api";
import { LoadErrorBanner } from "@/components/load-error-banner";
import { ReferanslarClient } from "./referanslar-client";

export default async function ReferanslarAdminPage() {
  let brands: unknown[] = [];
  let loadError = false;
  try {
    const api = await getAdminApi();
    brands = await api.brands.list();
  } catch {
    loadError = true;
  }
  return (
    <>
      {loadError && <LoadErrorBanner />}
      <ReferanslarClient brands={brands as never} />
    </>
  );
}
