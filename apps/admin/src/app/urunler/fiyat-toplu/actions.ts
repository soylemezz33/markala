"use server";
import { getAdminApi } from "@/lib/api";
import { revalidatePath } from "next/cache";

export async function bulkUpdatePrices(
  updates: Array<{ id: string; basePrice: number }>,
) {
  const api = await getAdminApi();
  await Promise.all(
    updates.map(({ id, basePrice }) =>
      api.products.update(id, { basePrice } as never),
    ),
  );
  revalidatePath("/urunler");
}
