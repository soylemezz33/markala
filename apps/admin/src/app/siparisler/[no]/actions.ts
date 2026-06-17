"use server";

import { getAdminApi } from "@/lib/api";
import { revalidatePath } from "next/cache";

/**
 * Sipariş durumunu günceller. Hata olursa (örn. geçersiz geçiş, yetki) sessizce yutmaz —
 * { ok:false, error } döner ki client kullanıcıya gösterip optimistik değişikliği geri alabilsin.
 * Hem liste hem detay sayfası revalidate edilir (kalıcı durum her iki görünümde de tazelensin).
 */
export async function updateOrderStatus(
  id: string,
  status: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    const api = await getAdminApi();
    await api.orders.updateStatus(id, { status });
    revalidatePath("/siparisler");
    revalidatePath(`/siparisler/${id}`);
    return { ok: true };
  } catch (e) {
    const msg = (e as { message?: string })?.message ?? "Durum güncellenemedi";
    return { ok: false, error: msg };
  }
}
