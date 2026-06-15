import { getAdminApi } from "@/lib/api";
import { LegalClient } from "./legal-client";

export default async function YasalAdminPage() {
  const api = await getAdminApi();
  const pages = await api.legal.list();
  return <LegalClient pages={pages as never} />;
}
