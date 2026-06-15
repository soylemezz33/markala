"use server";

import { getAdminApi } from "@/lib/api";
import { revalidatePath } from "next/cache";

export async function createBanner(data: Record<string, unknown>) {
  const api = await getAdminApi();
  await api.banners.create(data as never);
  revalidatePath("/banner");
}

export async function updateBanner(id: string, data: Record<string, unknown>) {
  const api = await getAdminApi();
  await api.banners.update(id, data as never);
  revalidatePath("/banner");
}

export async function removeBanner(id: string) {
  const api = await getAdminApi();
  await api.banners.remove(id);
  revalidatePath("/banner");
}
