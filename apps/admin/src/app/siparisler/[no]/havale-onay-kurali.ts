/**
 * "Ödeme geldi, onayla" butonu hangi siparişte görünür?
 *
 * Kural bileşenin içinde satır arasında duruyordu ve İPTAL kontrolü unutulmuştu:
 * iptal edilmiş havale siparişinde buton çıkmaya devam ediyordu (Hasan bildirdi,
 * 2026-09-02). İptal edilmiş bir siparişi "ödendi" işaretlemek üretim yolunu açar
 * ve iptal edilmiş işi üretime sokar — sessiz kalması kabul edilemez bir hata.
 *
 * Ayrı dosya ve saf fonksiyon: JSX içine gömülü kalırsa yine test edilemez ve
 * yine bir koşul unutulur.
 */
export interface HavaleOnayDurumu {
  paymentMethod?: string | null;
  paymentStatus?: string | null;
  status?: string | null;
}

/** Prisma enum'u "iptal_edildi", API slug'ı "iptal-edildi" — ikisi de gelebilir. */
function iptalMi(status: string | null | undefined): boolean {
  return String(status ?? "").replace(/_/g, "-") === "iptal-edildi";
}

function iadeMi(paymentStatus: string | null | undefined): boolean {
  const s = String(paymentStatus ?? "").replace(/_/g, "-");
  return s === "iade-edildi";
}

/**
 * Havale ödemesi ONAY BEKLİYOR mu?
 *
 * DÖRT ŞART da sağlanmalı:
 *  1. Yöntem havale — kartlı ödeme otomatik onaylanır, cari ay sonu faturalanır.
 *  2. Ödeme henüz başarılı değil — zaten onaylanmışı tekrar onaylamak anlamsız.
 *  3. İade edilmemiş — parası geri gönderilmiş siparişte tahsilat beklenmez.
 *  4. Sipariş iptal edilmemiş — İPTAL EDİLMİŞ İŞ ÜRETİME ALINMAMALI.
 */
export function havaleOnayBekliyorMu(order: HavaleOnayDurumu): boolean {
  if (order.paymentMethod !== "havale") return false;
  if (order.paymentStatus === "basarili") return false;
  if (iadeMi(order.paymentStatus)) return false;
  if (iptalMi(order.status)) return false;
  return true;
}

/**
 * "IBAN'dan alındı, ödemeyi kaydet" butonu hangi siparişte görünür? (2026-09-08)
 *
 * Neden gerekti: kartı reddedilen müşteri (kod 10202) parayı IBAN'a gönderdi, panelde
 * bunu "ödendi" işaretleyecek hiçbir yol yoktu — havale onay butonu yalnız
 * paymentMethod="havale" siparişlerde çıkıyor, bu sipariş kartlı açılmıştı.
 *
 * Havale siparişlerini KAPSAMAZ: onların kendi butonu var (havaleOnayBekliyorMu) ve
 * iki buton yan yana çıkarsa hangisine basılacağı belirsizleşir.
 */
export function ibandanTahsilEdilebilirMi(order: HavaleOnayDurumu): boolean {
  if (order.paymentMethod === "havale") return false; // kendi butonu var
  if (order.paymentMethod === "cari") return false; // tahsilat cari defterden yürür
  if (order.paymentStatus === "basarili") return false; // zaten ödenmiş
  if (iadeMi(order.paymentStatus)) return false;
  if (iptalMi(order.status)) return false;
  return true;
}
