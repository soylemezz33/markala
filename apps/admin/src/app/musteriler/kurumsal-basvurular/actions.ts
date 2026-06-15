"use server";

import { getAdminApi } from "@/lib/api";
import { revalidatePath } from "next/cache";

export async function setApplicationStatus(
  id: string,
  status: "approved" | "rejected" | "pending",
) {
  const api = await getAdminApi();
  await api.corporateApplications.setStatus(id, { status });
  revalidatePath("/musteriler/kurumsal-basvurular");
}
