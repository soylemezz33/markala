import { describe, it, expect } from "vitest";
import { havaleOdemeBekliyorMu } from "@/components/banka-bilgileri";

/**
 * Müşteri panelinde "ödemeni bekliyoruz + IBAN" uyarısının görünme kuralı.
 *
 * Yanlış tarafa düşmesi PARA sorunudur: ödenmiş ya da iptal edilmiş siparişte
 * banka bilgisi göstermek müşteriyi İKİNCİ KEZ ödemeye itebilir.
 */
describe("havale ödeme uyarısı ne zaman görünür", () => {
  const havale = { paymentMethod: "havale", paymentStatus: "beklemede", status: "siparis-alindi" };

  it("havale + ödenmemiş + iptal değil → GÖRÜNÜR", () => {
    expect(havaleOdemeBekliyorMu(havale)).toBe(true);
  });

  it("ödeme onaylanmışsa GÖRÜNMEZ", () => {
    expect(havaleOdemeBekliyorMu({ ...havale, paymentStatus: "basarili" })).toBe(false);
  });

  it("sipariş iptal edilmişse GÖRÜNMEZ (iki yazım da)", () => {
    expect(havaleOdemeBekliyorMu({ ...havale, status: "iptal-edildi" })).toBe(false);
    expect(havaleOdemeBekliyorMu({ ...havale, status: "iptal_edildi" })).toBe(false);
  });

  it("kartlı veya cari siparişte GÖRÜNMEZ", () => {
    expect(havaleOdemeBekliyorMu({ ...havale, paymentMethod: "iyzico" })).toBe(false);
    expect(havaleOdemeBekliyorMu({ ...havale, paymentMethod: "cari" })).toBe(false);
    expect(havaleOdemeBekliyorMu({ ...havale, paymentMethod: null })).toBe(false);
  });

  it("iade edilmiş havale siparişinde GÖRÜNMEZ değil — iade ayrı durum, ödeme yine yok", () => {
    // paymentStatus "iade_edildi" ise basarili DEĞİL → uyarı çıkar. Bu bilinçli:
    // iade edilmiş ama iptal edilmemiş sipariş pratikte iptal ile birlikte gelir,
    // iptal kontrolü zaten yakalar. Tek başına iade durumunda müşteriye hesap
    // bilgisi göstermek yanlış olmaz (yeniden ödeyecekse gerekli).
    expect(havaleOdemeBekliyorMu({ ...havale, paymentStatus: "iade_edildi" })).toBe(true);
  });
});
