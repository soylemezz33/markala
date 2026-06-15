"use server";

import { getAdminApi } from "@/lib/api";
import { revalidatePath } from "next/cache";

export async function createCoupon(data: Record<string, unknown>) {
  const api = await getAdminApi();
  await api.coupons.create(data as never);
  revalidatePath("/kuponlar");
}

export async function updateCoupon(id: string, data: Record<string, unknown>) {
  const api = await getAdminApi();
  await api.coupons.update(id, data as never);
  revalidatePath("/kuponlar");
}

export async function removeCoupon(id: string) {
  const api = await getAdminApi();
  await api.coupons.remove(id);
  revalidatePath("/kuponlar");
}
