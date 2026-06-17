"use server";

import { getAdminApi } from "@/lib/api";
import { revalidatePath } from "next/cache";
import { revalidateStorefront } from "@/lib/revalidate-web";

export async function removeProduct(id: string) {
  const api = await getAdminApi();
  await api.products.remove(id);
  revalidatePath("/urunler");
  await revalidateStorefront(); // storefront'tan da kaldır (silinen ürün sitede görünmesin)
}
