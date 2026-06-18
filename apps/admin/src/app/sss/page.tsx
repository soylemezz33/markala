import { getAdminApi } from "@/lib/api";
import { LoadErrorBanner } from "@/components/load-error-banner";
import { FaqsClient } from "./faqs-client";

export default async function SssPage() {
  let faqs: unknown[] = [];
  let loadError = false;
  try {
    const api = await getAdminApi();
    faqs = await api.faqs.list();
  } catch {
    loadError = true;
  }
  return (
    <>
      {loadError && <LoadErrorBanner />}
      <FaqsClient faqs={faqs as never} />
    </>
  );
}
