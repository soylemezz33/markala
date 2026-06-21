import { getAdminApi } from "@/lib/api";
import { LoadErrorBanner } from "@/components/load-error-banner";
import { SubscribersClient } from "./subscribers-client";

export const dynamic = "force-dynamic";

export default async function NewsletterSubscribersPage() {
  let subscribers: unknown[] = [];
  let loadError = false;
  try {
    const api = await getAdminApi();
    subscribers = await api.newsletter.list();
  } catch {
    loadError = true;
  }
  return (
    <>
      {loadError && <LoadErrorBanner />}
      <SubscribersClient subscribers={subscribers as never} />
    </>
  );
}
