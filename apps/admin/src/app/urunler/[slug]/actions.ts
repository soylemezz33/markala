"use server";
import { getAdminApi } from "@/lib/api";
import { revalidatePath } from "next/cache";
import { revalidateStorefront } from "@/lib/revalidate-web";
import type { OptionInput, PriceInput } from "@markala/api-client";

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

export async function updateProductOptions(id: string, options: OptionInput[]) {
  const api = await getAdminApi();
  const res = await api.products.setOptions(id, options);
  revalidatePath(`/urunler`);
  await revalidateStorefront();
  return res;
}

export async function updateProductPrices(id: string, prices: PriceInput[]) {
  const api = await getAdminApi();
  const res = await api.products.setPrices(id, prices);
  revalidatePath(`/urunler`);
  await revalidateStorefront();
  return res;
}

/**
 * ŞABLON IZGARA → KATEGORİYE UYGULA: önce kaynak ürünün ızgarasını kaydeder
 * (uygulanan = ekranda görülen), sonra aynı kategori+yapıdaki kardeşlere kopyalar.
 */
export async function applyGridToCategory(id: string, prices: PriceInput[]) {
  const api = await getAdminApi();
  await api.products.setPrices(id, prices); // kaynak ızgarayı kaydet
  const res = await api.prices.applyToCategory(id); // kategoriye kopyala
  revalidatePath(`/urunler`);
  await revalidateStorefront();
  return res; // { applied, skipped, priceRowsPerProduct }
}
