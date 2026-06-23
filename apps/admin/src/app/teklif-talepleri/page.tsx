import { getAdminApi } from "@/lib/api";
import { LoadErrorBanner } from "@/components/load-error-banner";
import { QuotesClient } from "./quotes-client";

export const dynamic = "force-dynamic";

export default async function QuoteRequestsPage() {
  let quotes: unknown[] = [];
  let loadError = false;
  try {
    const api = await getAdminApi();
    quotes = await api.quoteRequests.list();
  } catch {
    loadError = true;
  }
  return (
    <>
      {loadError && <LoadErrorBanner />}
      <QuotesClient quotes={quotes as never} />
    </>
  );
}
