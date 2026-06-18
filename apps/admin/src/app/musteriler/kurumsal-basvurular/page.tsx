import { getAdminApi } from "@/lib/api";
import { LoadErrorBanner } from "@/components/load-error-banner";
import { ApplicationsClient } from "./applications-client";
import type { CorporateApplicationDto } from "@markala/api-client";

export default async function KurumsalBasvurularPage() {
  let applications: CorporateApplicationDto[] = [];
  let loadError = false;
  try {
    const api = await getAdminApi();
    applications = await api.corporateApplications.list();
  } catch {
    loadError = true;
  }
  return (
    <>
      {loadError && <LoadErrorBanner />}
      <ApplicationsClient applications={applications} />
    </>
  );
}
