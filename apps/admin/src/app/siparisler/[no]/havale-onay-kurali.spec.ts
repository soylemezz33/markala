import { describe, it, expect } from "vitest";
import { havaleOnayBekliyorMu, ibandanTahsilEdilebilirMi } from "./havale-onay-kurali";

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

/**
 * "IBAN'dan alındı, ödemeyi kaydet" butonunun görünme kuralı (2026-09-08).
 *
 * Canlı olay MK-MTLKC7SW-RWUT: kart 10202 ile reddedildi, müşteri parayı IBAN'a
 * gönderdi, panelde ödemeyi "alındı" yapacak buton YOKTU — havale onayı yalnız
 * paymentMethod="havale" siparişlerde çıkıyordu.
 */
describe("IBAN'dan tahsilat butonu ne zaman görünür", () => {
  const kart = { paymentMethod: "iyzico", paymentStatus: "basarisiz", status: "siparis_alindi" };

  it("kartı reddedilen siparişte GÖRÜNÜR", () => {
    expect(ibandanTahsilEdilebilirMi(kart)).toBe(true);
  });

  it("kartlı ama ödemesi hiç başlamamış (beklemede) siparişte de görünür", () => {
    expect(ibandanTahsilEdilebilirMi({ ...kart, paymentStatus: "beklemede" })).toBe(true);
  });

  it("HAVALE siparişinde görünmez — onun kendi butonu var, ikisi çakışmamalı", () => {
    const havaleSiparisi = { ...kart, paymentMethod: "havale", paymentStatus: "beklemede" };
    expect(ibandanTahsilEdilebilirMi(havaleSiparisi)).toBe(false);
    expect(havaleOnayBekliyorMu(havaleSiparisi)).toBe(true); // tam olarak biri görünür
  });

  it("CARİ (açık hesap) siparişte görünmez — tahsilat cari defterden yürür", () => {
    expect(ibandanTahsilEdilebilirMi({ ...kart, paymentMethod: "cari" })).toBe(false);
  });

  it("ödemesi zaten başarılıysa görünmez", () => {
    expect(ibandanTahsilEdilebilirMi({ ...kart, paymentStatus: "basarili" })).toBe(false);
  });

  it("iade edilmişse görünmez (iki yazım da)", () => {
    expect(ibandanTahsilEdilebilirMi({ ...kart, paymentStatus: "iade_edildi" })).toBe(false);
    expect(ibandanTahsilEdilebilirMi({ ...kart, paymentStatus: "iade-edildi" })).toBe(false);
  });

  it("İPTAL EDİLMİŞ siparişte görünmez — iptal edilmiş iş üretime girmemeli", () => {
    expect(ibandanTahsilEdilebilirMi({ ...kart, status: "iptal_edildi" })).toBe(false);
    expect(ibandanTahsilEdilebilirMi({ ...kart, status: "iptal-edildi" })).toBe(false);
  });

  it("iki buton ASLA aynı anda görünmez", () => {
    const ornekler = [
      { paymentMethod: "havale", paymentStatus: "beklemede", status: "siparis_alindi" },
      { paymentMethod: "iyzico", paymentStatus: "basarisiz", status: "siparis_alindi" },
      { paymentMethod: "iyzico", paymentStatus: "beklemede", status: "siparis_alindi" },
      { paymentMethod: null, paymentStatus: "basarisiz", status: "siparis_alindi" },
      { paymentMethod: "cari", paymentStatus: "beklemede", status: "siparis_alindi" },
    ];
    for (const o of ornekler) {
      expect(havaleOnayBekliyorMu(o) && ibandanTahsilEdilebilirMi(o)).toBe(false);
    }
  });
});
