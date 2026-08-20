"use server";

import { getAdminApi } from "@/lib/api";
import { revalidatePath } from "next/cache";
import { revalidateStorefront } from "@/lib/revalidate-web";

// 2026-08-20: slider düzenlemeleri storefront'a HABER VERİLMİYORDU. revalidatePath("/slider")
// yalnız ADMIN'in kendi listesini tazeler; markala.com.tr ayrı bir Next app olduğu için
// etkilenmez. Sonuç: hero değiştirilince ana sayfa 5 dk (page revalidate=300) eski görseli
// göstermeye devam ediyordu ve "değişiklik canlıya geçmedi" sanılıyordu. Katalog tarafı
// (ürün/kategori/menü) zaten revalidateStorefront çağırıyordu — slider atlanmış.
// Hero ana sayfada olduğu için "/" yolunu tazelemek yeterli.
const HERO_PATHS = ["/"];

export async function createSlide(data: Record<string, unknown>) {
  const api = await getAdminApi();
  await api.heroSlides.create(data as never);
  revalidatePath("/slider");
  await revalidateStorefront(HERO_PATHS);
}

export async function updateSlide(id: string, data: Record<string, unknown>) {
  const api = await getAdminApi();
  await api.heroSlides.update(id, data as never);
  revalidatePath("/slider");
  await revalidateStorefront(HERO_PATHS);
}

export async function removeSlide(id: string) {
  const api = await getAdminApi();
  await api.heroSlides.remove(id);
  revalidatePath("/slider");
  await revalidateStorefront(HERO_PATHS);
}
