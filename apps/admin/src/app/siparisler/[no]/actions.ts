"use server";

import { getAdminApi } from "@/lib/api";
import { revalidatePath } from "next/cache";

/**
 * Sipariş durumunu günceller. Hata olursa (örn. geçersiz geçiş, yetki) sessizce yutmaz —
 * { ok:false, error } döner ki client kullanıcıya gösterip optimistik değişikliği geri alabilsin.
 * Hem liste hem detay sayfası revalidate edilir (kalıcı durum her iki görünümde de tazelensin).
 */
/**
 * Siparişin ödemesini iyzico'dan iade eder (2026-08-20, Hasan talebi).
 *
 * PARA HAREKETİ — prod'da CANLI iyzico API'si kullanılıyor. Tutar burada DEĞİL sunucuda
 * belirlenir; istemciden tutar alınmaz. Sunucu tarafı atomik kilitli: butona iki kez
 * basmak ikinci bir iade üretmez ({ alreadyRefunded: true } döner).
 */
export async function refundOrder(
  id: string,
): Promise<{ ok: true; message: string } | { ok: false; error: string }> {
  try {
    const api = await getAdminApi();
    const res = await api.payments.refund(id);
    revalidatePath("/siparisler");
    revalidatePath(`/siparisler/${id}`);
    if (!res.ok) return { ok: false, error: res.message ?? "İade yapılamadı" };
    if (res.alreadyRefunded) return { ok: true, message: "Bu sipariş zaten iade edilmiş." };
    const tutar = typeof res.refunded === "number" ? ` (${res.refunded.toFixed(2)} ₺)` : "";
    return { ok: true, message: `İade iyzico'ya iletildi${tutar}.` };
  } catch (e) {
    const msg = (e as { message?: string })?.message ?? "İade yapılamadı";
    return { ok: false, error: msg };
  }
}

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
