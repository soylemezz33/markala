import { describe, it, expect } from "vitest";
import { siparisAnindaMailGonderilir } from "./orders.service";

/**
 * Sipariş onay mailinin HANGİ akışta, NE ZAMAN gittiğini sabitler.
 *
 * Neden test var (2026-09-02): havale eklendiğinde koşul `onAccount && userId`
 * olarak kalmıştı. Havale ne cari ne kartlı olduğu için sipariş HİÇBİR mail
 * almıyordu — müşteri IBAN'ı e-postayla hiç görmüyor, yönetici de bekleyen
 * havaleden haberdar olmuyordu. Başarı sayfası "bilgiler e-postanıza gönderildi"
 * diyordu ve bu DOĞRU DEĞİLDİ. Kural buraya çakılıyor ki sessizce bozulmasın.
 */
describe("sipariş anında mail gönderilir mi", () => {
  it("kartlı sipariş: HAYIR — maili ödeme başarısında alır (payments.handleCallback)", () => {
    expect(siparisAnindaMailGonderilir("iyzico", "user1")).toBe(false);
    expect(siparisAnindaMailGonderilir("iyzico", null)).toBe(false);
    // paymentMethod hiç gelmezse varsayılan online akıştır → yine hayır.
    expect(siparisAnindaMailGonderilir(undefined, "user1")).toBe(false);
    expect(siparisAnindaMailGonderilir(null, null)).toBe(false);
  });

  it("havale: EVET — iyzico callback'inden geçmez, IBAN'ı bu mail taşır", () => {
    expect(siparisAnindaMailGonderilir("havale", "user1")).toBe(true);
  });

  it("havale MİSAFİRDE de mail gönderir (üyelik şartı yok — Hasan kararı)", () => {
    expect(siparisAnindaMailGonderilir("havale", null)).toBe(true);
    expect(siparisAnindaMailGonderilir("havale", undefined)).toBe(true);
  });

  it("cari: yalnız ÜYEDE — açık hesap üyeye bağlıdır", () => {
    expect(siparisAnindaMailGonderilir("cari", "user1")).toBe(true);
    expect(siparisAnindaMailGonderilir("cari", null)).toBe(false);
    expect(siparisAnindaMailGonderilir("cari", undefined)).toBe(false);
  });

  it("tanınmayan yöntem: HAYIR (güvenli varsayılan)", () => {
    expect(siparisAnindaMailGonderilir("kapida-odeme", "user1")).toBe(false);
  });
});
