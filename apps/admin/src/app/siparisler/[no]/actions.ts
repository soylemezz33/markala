"use server";

import { getAdminApi } from "@/lib/api";
import { revalidatePath } from "next/cache";

export async function updateOrderStatus(id: string, status: string) {
  const api = await getAdminApi();
  await api.orders.updateStatus(id, { status });
  revalidatePath(`/siparisler`);
}
