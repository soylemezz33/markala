"use server";

import { getAdminApi } from "@/lib/api";
import { revalidatePath } from "next/cache";

export async function createPost(data: Record<string, unknown>) {
  const api = await getAdminApi();
  await api.blog.createPost(data as never);
  revalidatePath("/blog");
}

export async function updatePost(id: string, data: Record<string, unknown>) {
  const api = await getAdminApi();
  await api.blog.updatePost(id, data as never);
  revalidatePath("/blog");
}

export async function removePost(id: string) {
  const api = await getAdminApi();
  await api.blog.removePost(id);
  revalidatePath("/blog");
}

export async function publishPost(id: string) {
  const api = await getAdminApi();
  await api.blog.publishPost(id);
  revalidatePath("/blog");
}
