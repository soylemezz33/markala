import { getAdminApi } from "@/lib/api";
import { LoadErrorBanner } from "@/components/load-error-banner";
import { CustomersClient } from "./customers-client";
import type { AdminUserDto } from "@markala/api-client";

export default async function CustomersAdminPage() {
  let customers: AdminUserDto[] = [];
  let loadError = false;
  try {
    const api = await getAdminApi();
    customers = await api.adminUsers.list({ take: 100 });
  } catch {
    // Geçici backend hatası — sayfayı çökertme, boş listeyle + uyarıyla render et.
    loadError = true;
  }
  return (
    <>
      {loadError && <LoadErrorBanner />}
      <CustomersClient customers={customers} />
    </>
  );
}
