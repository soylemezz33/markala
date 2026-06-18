"use server";

import { getAdminApi } from "@/lib/api";
import { revalidatePath } from "next/cache";

export async function createBrand(data: Record<string, unknown>) {
  const api = await getAdminApi();
  await api.brands.create(data as never);
  revalidatePath("/referanslar");
}

export async function updateBrand(id: string, data: Record<string, unknown>) {
  const api = await getAdminApi();
  await api.brands.update(id, data as never);
  revalidatePath("/referanslar");
}

export async function removeBrand(id: string) {
  const api = await getAdminApi();
  await api.brands.remove(id);
  revalidatePath("/referanslar");
}
