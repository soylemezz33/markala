"use server";

import { getAdminApi } from "@/lib/api";
import { revalidatePath } from "next/cache";

export async function createFaq(data: Record<string, unknown>) {
  const api = await getAdminApi();
  await api.faqs.create(data as never);
  revalidatePath("/sss");
}

export async function updateFaq(id: string, data: Record<string, unknown>) {
  const api = await getAdminApi();
  await api.faqs.update(id, data as never);
  revalidatePath("/sss");
}

export async function removeFaq(id: string) {
  const api = await getAdminApi();
  await api.faqs.remove(id);
  revalidatePath("/sss");
}
