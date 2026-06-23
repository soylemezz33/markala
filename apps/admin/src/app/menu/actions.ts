"use server";
import { getAdminApi } from "@/lib/api";
import { revalidatePath } from "next/cache";
import { revalidateStorefront } from "@/lib/revalidate-web";
import type { NavCategory } from "./default-nav";

/**
 * Header menüsünü kaydet (header_nav SiteSetting). Header her sayfada olduğu için
 * storefront'un TAMAMI tazelenir (ISR 30sn yedek). Admin /menu de revalidate edilir.
 */
export async function saveHeaderNav(nav: NavCategory[]) {
  const api = await getAdminApi();
  await api.settings.upsert("header", { header_nav: nav });
  revalidatePath("/menu");
  await revalidateStorefront();
}

/** Öne çıkan ürün seçici — admin ürün araması (pasif dahil). En az 2 karakter. */
export async function searchProducts(q: string): Promise<Array<{ slug: string; name: string }>> {
  const term = q.trim();
  if (term.length < 2) return [];
  try {
    const api = await getAdminApi();
    const list = await api.products.adminList({ q: term, take: 12 });
    return (Array.isArray(list) ? list : []).map((p) => ({
      slug: String(p.slug),
      name: String(p.name),
    }));
  } catch {
    return [];
  }
}
