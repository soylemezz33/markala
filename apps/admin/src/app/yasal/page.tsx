import { getAdminApi } from "@/lib/api";
import { LoadErrorBanner } from "@/components/load-error-banner";
import { LegalClient } from "./legal-client";

export default async function YasalAdminPage() {
  let pages: unknown[] = [];
  let loadError = false;
  try {
    const api = await getAdminApi();
    pages = await api.legal.list();
  } catch {
    loadError = true;
  }
  return (
    <>
      {loadError && <LoadErrorBanner />}
      <LegalClient pages={pages as never} />
    </>
  );
}
