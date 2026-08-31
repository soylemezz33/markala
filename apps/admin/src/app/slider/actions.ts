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

/**
 * Eylem sonucu. 2026-08-31: eskiden bu eylemler hatayı fırlatıyor, istemci de `catch`
 * içinde "Güncelleme başarısız." gibi genel bir mesaj gösteriyordu. Next, sunucu eylemi
 * hatalarının mesajını PRODUCTION'da temizlediği için API'nin gerçek gerekçesi
 * (örn. "Aynı anda en fazla 4 slayt yayında olabilir") panele hiç ulaşmıyordu.
 * Artık hata mesajı sonuç nesnesiyle taşınıyor.
 */
export type SlideResult = { ok: true } | { ok: false; message: string };

function hata(e: unknown, varsayilan: string): SlideResult {
  const m = e instanceof Error && e.message.trim() ? e.message.trim() : varsayilan;
  return { ok: false, message: m };
}

export async function createSlide(data: Record<string, unknown>): Promise<SlideResult> {
  try {
    const api = await getAdminApi();
    await api.heroSlides.create(data as never);
  } catch (e) {
    return hata(e, "Slide oluşturulamadı.");
  }
  revalidatePath("/slider");
  await revalidateStorefront(HERO_PATHS);
  return { ok: true };
}

export async function updateSlide(
  id: string,
  data: Record<string, unknown>,
): Promise<SlideResult> {
  try {
    const api = await getAdminApi();
    await api.heroSlides.update(id, data as never);
  } catch (e) {
    return hata(e, "Slide güncellenemedi.");
  }
  revalidatePath("/slider");
  await revalidateStorefront(HERO_PATHS);
  return { ok: true };
}

export async function removeSlide(id: string): Promise<SlideResult> {
  try {
    const api = await getAdminApi();
    await api.heroSlides.remove(id);
  } catch (e) {
    return hata(e, "Slide silinemedi.");
  }
  revalidatePath("/slider");
  await revalidateStorefront(HERO_PATHS);
  return { ok: true };
}
