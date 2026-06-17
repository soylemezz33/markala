import { describe, it, expect } from "vitest";
import { paymentNonce, verifyPaymentNonce } from "./payment-nonce";

const SECRET = "test-secret-en-az-otuziki-karakter-uzunlugunda!!";

describe("paymentNonce / verifyPaymentNonce", () => {
  it("doğru sipariş+secret ile üretilen nonce doğrulanır", () => {
    const n = paymentNonce(SECRET, "order-123");
    expect(verifyPaymentNonce(SECRET, "order-123", n)).toBe(true);
  });

  it("farklı sipariş id'si reddedilir (IDOR koruması)", () => {
    const n = paymentNonce(SECRET, "order-123");
    expect(verifyPaymentNonce(SECRET, "order-999", n)).toBe(false);
  });

  it("yanlış secret ile üretilen nonce reddedilir", () => {
    const n = paymentNonce("baska-secret-baska-secret-baska-secret!", "order-123");
    expect(verifyPaymentNonce(SECRET, "order-123", n)).toBe(false);
  });

  it("eksik/boş/bozuk nonce reddedilir", () => {
    expect(verifyPaymentNonce(SECRET, "order-123", undefined)).toBe(false);
    expect(verifyPaymentNonce(SECRET, "order-123", "")).toBe(false);
    expect(verifyPaymentNonce(SECRET, "order-123", "deadbeef")).toBe(false);
  });

  it("nonce deterministik (aynı girdi → aynı çıktı, saklanmaya gerek yok)", () => {
    expect(paymentNonce(SECRET, "x")).toBe(paymentNonce(SECRET, "x"));
  });
});
