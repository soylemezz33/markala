import { getAdminApi } from "@/lib/api";
import { LoadErrorBanner } from "@/components/load-error-banner";
import { MessagesClient } from "./messages-client";

export const dynamic = "force-dynamic";

export default async function ContactInboxPage() {
  let messages: unknown[] = [];
  let loadError = false;
  try {
    const api = await getAdminApi();
    messages = await api.contact.list();
  } catch {
    loadError = true;
  }
  return (
    <>
      {loadError && <LoadErrorBanner />}
      <MessagesClient messages={messages as never} />
    </>
  );
}
