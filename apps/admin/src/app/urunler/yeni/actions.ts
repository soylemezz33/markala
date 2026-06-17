"use server";

import { getAdminApi } from "@/lib/api";
import { revalidatePath } from "next/cache";
import { revalidateStorefront } from "@/lib/revalidate-web";

/**
 * Yeni ürün oluşturur. Başarıda oluşan ürünün slug'ını döner ki client detay sayfasına
 * yönlendirebilsin. Hata olursa sessizce yutmaz → { ok:false, error } ile client'a iletir.
 */
export async function createProduct(
  data: Record<string, unknown>,
): Promise<{ ok: true; slug: string } | { ok: false; error: string }> {
  try {
    const api = await getAdminApi();
    const created = await api.products.create(data as never);
    revalidatePath("/urunler");
    await revalidateStorefront();
    return { ok: true, slug: (created as { slug: string }).slug };
  } catch (e) {
    const msg = (e as { message?: string })?.message ?? "Ürün oluşturulamadı";
    return { ok: false, error: msg };
  }
}
