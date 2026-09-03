import { describe, it, expect } from "vitest";
import { izinliDurumGecisi, KARGO_ROLU_GECISLERI } from "./status-yetki";

/**
 * Kargo rolünün durum yetkisi (2026-09-03): üretime alma + kargoya verme serbest, gerisi kapalı.
 * Bu kural hem API controller'ında (403) hem panel düğmelerinde (disabled) kullanılır.
 */
describe("izinliDurumGecisi", () => {
  it("tam yetki (ORDERS_STATUS) her geçişi yapar", () => {
    for (const s of ["siparis-alindi", "tasarim-onaylandi", "uretimde", "kargoya-verildi", "iptal-edildi"]) {
      expect(izinliDurumGecisi({ tamYetki: true, status: s })).toBe(true);
    }
  });
  it("kargo rolü yalnız Üretimde ve Kargoda geçişlerini yapar", () => {
    expect(KARGO_ROLU_GECISLERI).toEqual(["uretimde", "kargoya-verildi"]);
    expect(izinliDurumGecisi({ tamYetki: false, status: "uretimde" })).toBe(true);
    expect(izinliDurumGecisi({ tamYetki: false, status: "kargoya-verildi" })).toBe(true);
    for (const s of ["siparis-alindi", "tasarim-bekleniyor", "tasarim-onayindi", "tasarim-onaylandi", "teslim-edildi", "iptal-edildi"]) {
      expect(izinliDurumGecisi({ tamYetki: false, status: s })).toBe(false);
    }
  });
});
