import { describe, it, expect } from "vitest";
import { BANKA_HESABI, HAVALE_INDIRIM_YUZDE, ODEME_YONTEMI } from "./banka";
// Web tarafındaki kopya. Bu import YALNIZ TESTTE güvenlidir (vitest TS'i derler);
// üretim kodunda packages/* çalışma zamanı import'u YASAK — bkz. banka.ts başlığı.
import * as web from "@markala/types";

/**
 * IBAN iki dosyada tanımlı (API dist'e derlenmeli, web Next tarafından derleniyor).
 * Bu test ikisinin ayrışmasını imkânsız kılar: biri değişip diğeri unutulursa CI kırılır.
 * Ayrışma sessiz kalsaydı müşteri e-postada bir IBAN, sitede başka bir IBAN görürdü.
 */
describe("banka bilgileri API ↔ web tutarlılığı", () => {
  it("IBAN iki tarafta birebir aynı", () => {
    expect(BANKA_HESABI.iban).toBe(web.BANKA_HESABI.iban);
    expect(BANKA_HESABI.ibanDuz).toBe(web.BANKA_HESABI.ibanDuz);
  });

  it("ünvan ve banka adı aynı", () => {
    expect(BANKA_HESABI.unvan).toBe(web.BANKA_HESABI.unvan);
    expect(BANKA_HESABI.banka).toBe(web.BANKA_HESABI.banka);
  });

  it("indirim oranı ve ödeme yöntemi anahtarları aynı", () => {
    expect(HAVALE_INDIRIM_YUZDE).toBe(web.HAVALE_INDIRIM_YUZDE);
    expect(ODEME_YONTEMI).toEqual(web.ODEME_YONTEMI);
  });

  it("IBAN mod-97 sağlamasından geçer", () => {
    expect(web.ibanGecerliMi(BANKA_HESABI.iban)).toBe(true);
  });
});
