"use server";
import { getAdminApi } from "@/lib/api";
import { revalidatePath } from "next/cache";

export async function createSlide(data: Record<string, unknown>) {
  const api = await getAdminApi();
  await api.heroSlides.create(data as never);
  revalidatePath("/slider");
}

export async function updateSlide(id: string, data: Record<string, unknown>) {
  const api = await getAdminApi();
  await api.heroSlides.update(id, data as never);
  revalidatePath("/slider");
}

export async function deleteSlide(id: string) {
  const api = await getAdminApi();
  await api.heroSlides.remove(id);
  revalidatePath("/slider");
}
