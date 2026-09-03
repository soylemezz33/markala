import { describe, it, expect } from "vitest";
import { iptalMailiGonderilirMi } from "./iptal-mail-kurali";

describe("iptalMailiGonderilirMi", () => {
  it("kartla ödenmiş sipariş iptalinde mail GİDER (iade beklentisi)", () => {
    expect(iptalMailiGonderilirMi({ paymentMethod: "kart", paymentStatus: "basarili" })).toBe(true);
  });

  it("ödemesi onaylanmış havale iptalinde mail GİDER", () => {
    expect(iptalMailiGonderilirMi({ paymentMethod: "havale", paymentStatus: "basarili" })).toBe(
      true,
    );
  });

  it("iade edilmiş sipariş iptalinde mail GİDER", () => {
    expect(iptalMailiGonderilirMi({ paymentMethod: "kart", paymentStatus: "iade_edildi" })).toBe(
      true,
    );
  });

  it("cari (açık hesap) siparişte mail GİDER — peşin ödeme yok ama sipariş onaylı", () => {
    expect(iptalMailiGonderilirMi({ paymentMethod: "cari", paymentStatus: "beklemede" })).toBe(
      true,
    );
  });

  it("ödeme bekleyen kart siparişinde mail GİTMEZ", () => {
    expect(iptalMailiGonderilirMi({ paymentMethod: "kart", paymentStatus: "beklemede" })).toBe(
      false,
    );
  });

  it("ödenmemiş havale siparişinde mail GİTMEZ", () => {
    expect(iptalMailiGonderilirMi({ paymentMethod: "havale", paymentStatus: "beklemede" })).toBe(
      false,
    );
  });

  it("başarısız ödeme denemesinde mail GİTMEZ", () => {
    expect(iptalMailiGonderilirMi({ paymentMethod: "kart", paymentStatus: "basarisiz" })).toBe(
      false,
    );
  });

  it("ödeme yöntemi hiç yazılmamış, ödenmemiş kayıtta mail GİTMEZ", () => {
    expect(iptalMailiGonderilirMi({ paymentMethod: null, paymentStatus: null })).toBe(false);
  });
});
