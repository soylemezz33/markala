import { describe, it, expect } from "vitest";
import { cronAcikMi } from "./cron-anahtari";

/**
 * 7 Eylül 2026 kesintisinden sonra eklendi. Bu anahtarın varlık sebebi bir kesinti
 * şüphesi, o yüzden en kritik davranış: BELİRSİZ HER DURUMDA KAPALI kalmak. Yanlışlıkla
 * açılan bir iş, kapatma kararını sessizce geçersiz kılardı.
 */
describe("cronAcikMi", () => {
  it("yalnız açık onayla AÇAR", () => {
    for (const v of ["true", "TRUE", " True ", "1", "evet", "EVET"]) {
      expect(cronAcikMi(v), `"${v}" açmalı`).toBe(true);
    }
  });

  it("env TANIMSIZ ise KAPALI — unutulursa kendiliğinden açılmasın", () => {
    expect(cronAcikMi(undefined)).toBe(false);
    expect(cronAcikMi(null)).toBe(false);
    expect(cronAcikMi("")).toBe(false);
    expect(cronAcikMi("   ")).toBe(false);
  });

  it("açık kapatma değerlerinde KAPALI", () => {
    for (const v of ["false", "FALSE", "0", "hayir", "off", "no"]) {
      expect(cronAcikMi(v), `"${v}" kapatmalı`).toBe(false);
    }
  });

  it("anlamsız/beklenmedik değerde KAPALI (fail-safe)", () => {
    // Örn. env'e yanlışlıkla "yes" ya da "acik" yazılırsa: iş çalışmaz ve log uyarır.
    // Sessizce çalışmasındansa çalışmaması yeğdir.
    expect(cronAcikMi("yes")).toBe(false);
    expect(cronAcikMi("acik")).toBe(false);
    expect(cronAcikMi("truee")).toBe(false);
  });
});
