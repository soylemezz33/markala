import { getAdminApi } from "@/lib/api";
import { ApplicationsClient } from "./applications-client";

export default async function KurumsalBasvurularPage() {
  const api = await getAdminApi();
  const applications = await api.corporateApplications.list();
  return <ApplicationsClient applications={applications} />;
}
