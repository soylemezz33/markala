"use server";

import { getAdminApi } from "@/lib/api";
import { revalidatePath } from "next/cache";

export async function createPost(data: Record<string, unknown>) {
  try {
    const api = await getAdminApi();
    await api.blog.createPost(data as never);
    revalidatePath("/blog");
  } catch (e) {
    console.error("[createPost]", e);
    throw e;
  }
}

export async function updatePost(id: string, data: Record<string, unknown>) {
  try {
    const api = await getAdminApi();
    await api.blog.updatePost(id, data as never);
    revalidatePath("/blog");
  } catch (e) {
    console.error("[updatePost]", e);
    throw e;
  }
}

export async function removePost(id: string) {
  try {
    const api = await getAdminApi();
    await api.blog.removePost(id);
    revalidatePath("/blog");
  } catch (e) {
    console.error("[removePost]", e);
    throw e;
  }
}

export async function publishPost(id: string) {
  try {
    const api = await getAdminApi();
    await api.blog.publishPost(id);
    revalidatePath("/blog");
  } catch (e) {
    console.error("[publishPost]", e);
    throw e;
  }
}
