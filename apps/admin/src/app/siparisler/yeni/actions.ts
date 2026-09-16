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
      id: string; name: string; slug: string; startingPrice?: number | string | null; basePrice?: number | string | null; images?: string[]; pricingMode?: string;
    }>;
    return arr.map((p) => ({ id: p.id, name: p.name, slug: p.slug, fiyat: Number(p.startingPrice ?? p.basePrice ?? 0) || 0, pricingMode: p.pricingMode ?? "additive" }));
  } catch (e) {
    console.error("[urunAra]", e);
    return [];
  }
}

export type UrunSecenek = { groupKey: string; groupLabel: string; groupRole: "dimension" | "priced"; groupSort: number; optionKey: string; optionLabel: string; optionSublabel?: string | null; optionSort: number; locked?: boolean; rules?: Record<string, unknown> | null };

/** Katalog ürününün konfigüratör seçenekleri (sitedeki ile aynı veri). */
export async function urunDetay(slug: string) {
  try {
    const api = await getAdminApi();
    const p = (await api.products.detail(slug)) as unknown as { id: string; name: string; slug: string; pricingMode?: string; options?: UrunSecenek[] };
    return { id: p.id, name: p.name, slug: p.slug, pricingMode: p.pricingMode ?? "additive", options: (p.options ?? []).map((o) => ({ ...o, rules: (o.rules ?? null) as Record<string, unknown> | null })) };
  } catch (e) {
    console.error("[urunDetay]", e);
    return null;
  }
}

/** Sunucu fiyatı (sitedeki motor): birim, satır, özet. Hata → { error }. */
export async function kalemFiyatla(data: { productId: string; selections: Record<string, string>; quantity: number }) {
  try {
    const api = await getAdminApi();
    const r = await api.orders.manualPrice(data);
    return { ok: true as const, ...r };
  } catch (e) {
    return { ok: false as const, error: (e as Error).message || "Fiyat hesaplanamadı." };
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
