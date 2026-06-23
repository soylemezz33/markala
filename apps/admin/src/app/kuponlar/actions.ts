"use server";

import { getAdminApi } from "@/lib/api";
import { revalidatePath } from "next/cache";

export async function createCoupon(data: Record<string, unknown>) {
  try {
    const api = await getAdminApi();
    await api.coupons.create(data as never);
    revalidatePath("/kuponlar");
  } catch (e) {
    console.error("[createCoupon]", e);
    throw e;
  }
}

export async function updateCoupon(id: string, data: Record<string, unknown>) {
  try {
    const api = await getAdminApi();
    await api.coupons.update(id, data as never);
    revalidatePath("/kuponlar");
  } catch (e) {
    console.error("[updateCoupon]", e);
    throw e;
  }
}

export async function removeCoupon(id: string) {
  try {
    const api = await getAdminApi();
    await api.coupons.remove(id);
    revalidatePath("/kuponlar");
  } catch (e) {
    console.error("[removeCoupon]", e);
    throw e;
  }
}
