"use server";

import { getAdminApi } from "@/lib/api";
import { revalidatePath } from "next/cache";

export async function createBanner(data: Record<string, unknown>) {
  try {
    const api = await getAdminApi();
    await api.banners.create(data as never);
    revalidatePath("/banner");
  } catch (e) {
    console.error("[createBanner]", e);
    throw e;
  }
}

export async function updateBanner(id: string, data: Record<string, unknown>) {
  try {
    const api = await getAdminApi();
    await api.banners.update(id, data as never);
    revalidatePath("/banner");
  } catch (e) {
    console.error("[updateBanner]", e);
    throw e;
  }
}

export async function removeBanner(id: string) {
  try {
    const api = await getAdminApi();
    await api.banners.remove(id);
    revalidatePath("/banner");
  } catch (e) {
    console.error("[removeBanner]", e);
    throw e;
  }
}
