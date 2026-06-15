"use server";

import { getAdminApi } from "@/lib/api";
import { revalidatePath } from "next/cache";

export async function createPackage(data: Record<string, unknown>) {
  const api = await getAdminApi();
  await api.campaignPackages.create(data as never);
  revalidatePath("/kampanya-paketleri");
}

export async function updatePackage(id: string, data: Record<string, unknown>) {
  const api = await getAdminApi();
  await api.campaignPackages.update(id, data as never);
  revalidatePath("/kampanya-paketleri");
}

export async function removePackage(id: string) {
  const api = await getAdminApi();
  await api.campaignPackages.remove(id);
  revalidatePath("/kampanya-paketleri");
}
