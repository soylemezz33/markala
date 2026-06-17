import { createHmac, timingSafeEqual } from "crypto";

/**
 * Sipariş ödeme nonce'u — guest checkout'ta /payments/iyzico/init IDOR'unu kapatır.
 *
 * Sipariş oluşturma yanıtında (POST /orders, /orders/guest) verilir; ödeme başlatmada
 * zorunludur. Gizli anahtar (JWT_SECRET) olmadan üretilemez → saldırgan başkasının
 * sipariş id'sini (cuid) bilse bile o sipariş için ödeme başlatamaz/statüsünü bozamaz.
 * Deterministik HMAC olduğu için DB'de saklanmaz; doğrulama yeniden hesaplayarak yapılır.
 */
export function paymentNonce(secret: string, orderId: string): string {
  return createHmac("sha256", secret).update(`pay:${orderId}`).digest("hex");
}

/** Sabit-zamanlı karşılaştırma ile nonce doğrular. */
export function verifyPaymentNonce(secret: string, orderId: string, nonce: string | undefined): boolean {
  if (!nonce) return false;
  const expected = Buffer.from(paymentNonce(secret, orderId));
  const provided = Buffer.from(nonce);
  if (expected.length !== provided.length) return false;
  return timingSafeEqual(expected, provided);
}
