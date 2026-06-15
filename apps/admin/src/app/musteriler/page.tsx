import { getAdminApi } from "@/lib/api";
import { CustomersClient } from "./customers-client";

export default async function CustomersAdminPage() {
  const api = await getAdminApi();
  const customers = await api.adminUsers.list({ take: 100 });
  return <CustomersClient customers={customers} />;
}
