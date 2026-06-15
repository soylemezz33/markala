"use server";

import { getAdminApi } from "@/lib/api";
import { revalidatePath } from "next/cache";

export async function createLegal(data: Record<string, unknown>) {
  const api = await getAdminApi();
  await api.legal.create(data as never);
  revalidatePath("/yasal");
}

export async function updateLegal(id: string, data: Record<string, unknown>) {
  const api = await getAdminApi();
  await api.legal.update(id, data as never);
  revalidatePath("/yasal");
}

export async function removeLegal(id: string) {
  const api = await getAdminApi();
  await api.legal.remove(id);
  revalidatePath("/yasal");
}
