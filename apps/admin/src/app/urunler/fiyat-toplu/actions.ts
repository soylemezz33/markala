"use server";
import { getAdminApi } from "@/lib/api";
import { revalidatePath } from "next/cache";
import { revalidateStorefront } from "@/lib/revalidate-web";
import type { BulkAdjustInput, CategorySetInput } from "@markala/api-client";

/**
 * Toplu fiyat güncelleme. Model: product_prices.price üzerinde çalışır;
 * saklı (mevcut) fiyat referans alınır. Yüzde veya sabit tutar artış/azalma uygular.
 */
export async function bulkAdjustPrices(input: BulkAdjustInput) {
  const api = await getAdminApi();
  const result = await api.prices.bulkAdjust(input);
  revalidatePath("/urunler");
  await revalidateStorefront();
  return result; // { updated }
}

/**
 * Kategorideki tüm basit ürünlerin fiyatını sabit değere çeker.
 * Matrisli/seçenekli ürünler atlanır (skipped).
 */
export async function categorySetPrices(input: CategorySetInput) {
  const api = await getAdminApi();
  const result = await api.prices.categorySet(input);
  revalidatePath("/urunler");
  await revalidateStorefront();
  return result; // { set, skipped }
}
