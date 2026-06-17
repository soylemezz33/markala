"use server";
import { getAdminApi } from "@/lib/api";
import { revalidatePath } from "next/cache";
import { revalidateStorefront } from "@/lib/revalidate-web";

export async function updateProduct(id: string, data: Record<string, unknown>) {
  const api = await getAdminApi();
  await api.products.update(id, data as never);
  revalidatePath(`/urunler`);
  await revalidateStorefront(); // storefront'u ANINDA tazele (fiyat/isim değişikliği sitede görünsün)
}

export async function removeProduct(id: string) {
  const api = await getAdminApi();
  await api.products.remove(id);
  revalidatePath(`/urunler`);
  await revalidateStorefront(); // silinen ürün storefront'tan da kalksın
}
