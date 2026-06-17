"use server";

import { getAdminApi } from "@/lib/api";
import { revalidatePath } from "next/cache";
import { revalidateStorefront } from "@/lib/revalidate-web";

export async function createCategory(data: Record<string, unknown>) {
  const api = await getAdminApi();
  await api.categories.create(data as never);
  revalidatePath("/kategoriler");
  await revalidateStorefront();
}

export async function updateCategory(id: string, data: Record<string, unknown>) {
  const api = await getAdminApi();
  await api.categories.update(id, data as never);
  revalidatePath("/kategoriler");
  await revalidateStorefront();
}

export async function removeCategory(id: string) {
  const api = await getAdminApi();
  await api.categories.remove(id);
  revalidatePath("/kategoriler");
  await revalidateStorefront();
}
