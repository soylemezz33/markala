import { describe, it, expect } from "vitest";
import { havaleOnayBekliyorMu } from "./havale-onay-kurali";

/**
 * "Ödeme geldi, onayla" butonunun görünme kuralı.
 *
 * 2026-09-02'de İPTAL kontrolü unutulmuştu: iptal edilmiş havale siparişinde
 * buton çıkıyordu (canlıda MK-MTK0V2WI-MC7O). O butona basmak iptal edilmiş bir
 * işi "ödendi" sayıp üretim yoluna sokardı.
 */
const havale = { paymentMethod: "havale", paymentStatus: "beklemede", status: "siparis_alindi" };

describe("havale onay butonu ne zaman görünür", () => {
  it("havale + ödenmemiş + iptal değil → GÖRÜNÜR", () => {
    expect(havaleOnayBekliyorMu(havale)).toBe(true);
  });

  it("KARTLI ödemede görünmez", () => {
    expect(havaleOnayBekliyorMu({ ...havale, paymentMethod: "iyzico" })).toBe(false);
    expect(havaleOnayBekliyorMu({ ...havale, paymentMethod: "iyzico", paymentStatus: "beklemede" })).toBe(false);
    expect(havaleOnayBekliyorMu({ ...havale, paymentMethod: "iyzico", paymentStatus: "basarili" })).toBe(false);
  });

  it("CARİ (açık hesap) siparişte görünmez", () => {
    expect(havaleOnayBekliyorMu({ ...havale, paymentMethod: "cari" })).toBe(false);
  });

  it("ödeme yöntemi boş/bilinmeyen ise görünmez", () => {
    expect(havaleOnayBekliyorMu({ ...havale, paymentMethod: null })).toBe(false);
    expect(havaleOnayBekliyorMu({ ...havale, paymentMethod: undefined })).toBe(false);
    expect(havaleOnayBekliyorMu({})).toBe(false);
  });

  it("ödeme zaten onaylanmışsa görünmez", () => {
    expect(havaleOnayBekliyorMu({ ...havale, paymentStatus: "basarili" })).toBe(false);
  });

  it("iade edilmişse görünmez (iki yazım da)", () => {
    expect(havaleOnayBekliyorMu({ ...havale, paymentStatus: "iade_edildi" })).toBe(false);
    expect(havaleOnayBekliyorMu({ ...havale, paymentStatus: "iade-edildi" })).toBe(false);
  });

  it("İPTAL EDİLMİŞ siparişte görünmez — asıl hata buydu (iki yazım da)", () => {
    expect(havaleOnayBekliyorMu({ ...havale, status: "iptal_edildi" })).toBe(false);
    expect(havaleOnayBekliyorMu({ ...havale, status: "iptal-edildi" })).toBe(false);
  });

  it("canlıdaki altı siparişin tamamında doğru sonuç", () => {
    const canli = [
      { o: { paymentMethod: "havale", paymentStatus: "beklemede", status: "siparis_alindi" }, bekle: true },
      { o: { paymentMethod: "iyzico", paymentStatus: "basarili", status: "siparis_alindi" }, bekle: false },
      { o: { paymentMethod: "havale", paymentStatus: "basarili", status: "siparis_alindi" }, bekle: false },
      { o: { paymentMethod: "iyzico", paymentStatus: "basarili", status: "siparis_alindi" }, bekle: false },
      { o: { paymentMethod: "havale", paymentStatus: "beklemede", status: "iptal_edildi" }, bekle: false },
      { o: { paymentMethod: "iyzico", paymentStatus: "beklemede", status: "siparis_alindi" }, bekle: false },
    ];
    for (const { o, bekle } of canli) expect(havaleOnayBekliyorMu(o)).toBe(bekle);
  });
});
