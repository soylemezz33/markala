import { describe, it, expect } from "vitest";

import { iptalMailiGonderilirMi } from "./iptal-mail-kurali";

/** API'deki kuralın aynısı — tablo da bilerek aynı (bkz. iptal-mail-kurali.ts başlığı). */
describe("iptalMailiGonderilirMi (admin onay metni)", () => {
  const tablo: Array<[string, string | null, string | null, boolean]> = [
    ["ödenmiş kart", "kart", "basarili", true],
    ["onaylanmış havale", "havale", "basarili", true],
    ["iade edilmiş", "kart", "iade_edildi", true],
    ["cari (açık hesap)", "cari", "beklemede", true],
    ["ödeme bekleyen kart", "kart", "beklemede", false],
    ["ödenmemiş havale", "havale", "beklemede", false],
    ["başarısız ödeme", "kart", "basarisiz", false],
    ["yöntemi belirsiz, ödenmemiş", null, null, false],
  ];

  for (const [ad, paymentMethod, paymentStatus, beklenen] of tablo) {
    it(`${ad} → ${beklenen ? "mail GİDER" : "mail GİTMEZ"}`, () => {
      expect(iptalMailiGonderilirMi({ paymentMethod, paymentStatus })).toBe(beklenen);
    });
  }
});
