"use server";

import { getAdminApi } from "@/lib/api";
import { revalidatePath } from "next/cache";

export async function setReviewApproval(id: string, isApproved: boolean) {
  const api = await getAdminApi();
  await api.reviews.setApproval(id, isApproved);
  revalidatePath("/yorumlar");
}

export async function removeReview(id: string) {
  const api = await getAdminApi();
  await api.reviews.remove(id);
  revalidatePath("/yorumlar");
}
