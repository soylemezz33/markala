"use server";
import { getAdminApi } from "@/lib/api";
import { revalidatePath } from "next/cache";

export async function updateProduct(id: string, data: Record<string, unknown>) {
  const api = await getAdminApi();
  await api.products.update(id, data as never);
  revalidatePath(`/urunler`);
}
