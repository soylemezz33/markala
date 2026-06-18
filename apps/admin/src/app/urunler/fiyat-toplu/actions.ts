"use server";
import { getAdminApi } from "@/lib/api";
import { revalidatePath } from "next/cache";
import { revalidateStorefront } from "@/lib/revalidate-web";

/**
 * Toplu fiyat güncelleme. Operasyonu SUNUCUYA gönderiyoruz; sunucu hedef ürünlerin
 * basePrice + startingPrice + KONFİGÜRATÖR PARAMETRELERİNİ (matris hücreleri, birim/m² fiyatı,
 * ek ücretler) birlikte ölçekler. Böylece matrisli üründe de fiyat sitede yansır.
 * (Eskiden client tek tek `startingPrice` yazıyordu → matrisli üründe görünen fiyat değişmiyordu.)
 */
export async function bulkUpdatePrices(input: {
  scope: "all" | "category";
  categoryId?: string;
  op: "percent" | "fixed";
  direction: "increase" | "decrease";
  value: number;
  round?: string;
}) {
  const api = await getAdminApi();
  const result = await api.products.bulkPrice(input);
  revalidatePath("/urunler");
  await revalidateStorefront();
  return result;
}
