"use server";
import { getAdminApi } from "@/lib/api";
import { revalidatePath } from "next/cache";
import { revalidateStorefront } from "@/lib/revalidate-web";

/**
 * Toplu fiyat güncelleme. NOT: storefront ürün kartları/detayı `startingPrice ?? basePrice`
 * gösterdiğinden, görünen fiyatı değiştirmek için `startingPrice`'a yazıyoruz (eskiden basePrice'a
 * yazılıyordu → konfigüratör ürünlerinde değişiklik sitede HİÇ görünmüyordu).
 */
export async function bulkUpdatePrices(
  updates: Array<{ id: string; basePrice: number }>,
) {
  const api = await getAdminApi();
  await Promise.all(
    updates.map(({ id, basePrice }) =>
      api.products.update(id, { startingPrice: basePrice } as never),
    ),
  );
  revalidatePath("/urunler");
  await revalidateStorefront();
}
