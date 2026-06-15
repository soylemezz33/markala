import { getAdminApi } from "@/lib/api";
import { FaqsClient } from "./faqs-client";

export default async function SssPage() {
  const api = await getAdminApi();
  const faqs = await api.faqs.list();
  return <FaqsClient faqs={faqs as never} />;
}
