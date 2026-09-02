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

/**
 * Havale/EFT ödemesini ONAYLA — para hesaba geçtiği GÖRÜLDÜKTEN sonra çağrılır.
 *
 * PARA KARARI: bu işaret siparişi "ödendi" sayar ve üretim yolunu açar. Onaylamadan
 * önce banka ekstresinde tutarın VE açıklamadaki sipariş numarasının tuttuğu
 * doğrulanmalı. Sunucu idempotent: iki kez basmak ikinci bir onay logu üretmez.
 */
export async function confirmHavalePayment(
  id: string,
): Promise<{ ok: true; message: string } | { ok: false; error: string }> {
  try {
    const api = await getAdminApi();
    await api.orders.odemeOnayla(id);
    revalidatePath("/siparisler");
    revalidatePath(`/siparisler/${id}`);
    return { ok: true, message: "Havale ödemesi onaylandı." };
  } catch (e) {
    const msg = (e as { message?: string })?.message ?? "Ödeme onaylanamadı";
    return { ok: false, error: msg };
  }
}

/**
 * Sipariş durumunu günceller. "kargoya-verildi"ye geçerken takip bilgisi de gönderilir —
 * müşteriye giden kargo e-postası takip numarasını İÇİNDE taşısın diye (2026-08-29).
 * Takip alanları opsiyonel: diğer durum geçişlerinde boş geçilir.
 */
export async function updateOrderStatus(
  id: string,
  status: string,
  tracking?: { trackingNumber?: string; trackingCarrier?: string },
): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    const api = await getAdminApi();
    await api.orders.updateStatus(id, {
      status,
      ...(tracking?.trackingNumber ? { trackingNumber: tracking.trackingNumber } : {}),
      ...(tracking?.trackingCarrier ? { trackingCarrier: tracking.trackingCarrier } : {}),
    });
    revalidatePath("/siparisler");
    revalidatePath(`/siparisler/${id}`);
    return { ok: true };
  } catch (e) {
    const msg = (e as { message?: string })?.message ?? "Durum güncellenemedi";
    return { ok: false, error: msg };
  }
}

/**
 * Takip no/firmayı durumdan bağımsız günceller — MÜŞTERİYE MAİL GİTMEZ.
 * Kargoya verilmiş ama takip numarası girilmemiş eski siparişleri tamamlamak ve
 * yanlış girilen numarayı düzeltmek için.
 */
export async function updateOrderTracking(
  id: string,
  tracking: { trackingNumber?: string; trackingCarrier?: string },
): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    const api = await getAdminApi();
    await api.orders.updateTracking(id, tracking);
    revalidatePath("/siparisler");
    revalidatePath(`/siparisler/${id}`);
    return { ok: true };
  } catch (e) {
    const msg = (e as { message?: string })?.message ?? "Takip bilgisi güncellenemedi";
    return { ok: false, error: msg };
  }
}
