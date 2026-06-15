"use server";
import { getAdminApi } from "@/lib/api";
import { revalidatePath } from "next/cache";

export async function saveSettings(
  group: string,
  values: Record<string, unknown>,
  revalidate: string,
) {
  const api = await getAdminApi();
  await api.settings.upsert(group, values);
  revalidatePath(revalidate);
}
