"use server";

import { getAdminApi } from "@/lib/api";
import { revalidatePath } from "next/cache";

export async function setContactStatus(id: string, status: "new" | "read" | "archived") {
  const api = await getAdminApi();
  await api.contact.setStatus(id, status);
  revalidatePath("/iletisim-mesajlari");
}
