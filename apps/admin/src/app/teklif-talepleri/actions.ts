"use server";

import { getAdminApi } from "@/lib/api";
import { revalidatePath } from "next/cache";

export async function setQuoteStatus(
  id: string,
  status: "new" | "contacted" | "quoted" | "closed",
) {
  const api = await getAdminApi();
  await api.quoteRequests.setStatus(id, status);
  revalidatePath("/teklif-talepleri");
}
