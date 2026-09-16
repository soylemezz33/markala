"use server";

import { getAdminApi } from "@/lib/api";
import { revalidatePath } from "next/cache";

/** Panelden manuel sipariş (yüz yüze / telefon / WhatsApp). API: POST /orders/manuel. */
export async function manuelSiparisOlustur(data: Record<string, unknown>) {
  try {
    const api = await getAdminApi();
    const r = await api.orders.createManual(data as never);
    revalidatePath("/siparisler");
    return { ok: true as const, id: r.id, orderNumber: r.orderNumber, total: r.total, epostaYok: r.epostaYok };
  } catch (e) {
    console.error("[manuelSiparisOlustur]", e);
    return { ok: false as const, error: (e as Error).message || "Sipariş oluşturulamadı." };
  }
}

export async function urunAra(q: string) {
  const s = q.trim();
  if (s.length < 2) return [];
  try {
    const api = await getAdminApi();
    const list = await api.products.list({ q: s, take: 8, list: true } as never);
    const arr = (Array.isArray(list) ? list : (list as { items?: unknown[] }).items ?? []) as Array<{
      id: string; name: string; slug: string; startingPrice?: number | string | null; basePrice?: number | string | null; images?: string[];
    }>;
    return arr.map((p) => ({
      id: p.id, name: p.name, slug: p.slug,
      fiyat: Number(p.startingPrice ?? p.basePrice ?? 0) || 0,
      gorsel: p.images?.[0] ?? null,
    }));
  } catch (e) {
    console.error("[urunAra]", e);
    return [];
  }
}

export async function musteriAra(q: string) {
  const s = q.trim();
  if (s.length < 2) return [];
  try {
    const api = await getAdminApi();
    const list = await api.adminUsers.list({ q: s, take: 8 });
    return (list ?? []).map((u) => ({
      id: u.id, fullName: u.fullName, email: u.email, phone: u.phone ?? "", accountType: u.accountType, companyName: u.companyName ?? null,
    }));
  } catch (e) {
    console.error("[musteriAra]", e);
    return [];
  }
}
