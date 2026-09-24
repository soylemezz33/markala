import { describe, it, expect } from "vitest";
import { siparisListedeGorunur, IPTAL_DURUMU } from "./liste-gorunurluk-kurali";

describe("siparisListedeGorunur", () => {
  it("'Tümü' görünümünde iptaller gizlenir", () => {
    expect(siparisListedeGorunur(IPTAL_DURUMU, "all")).toBe(false);
  });

  it("'Tümü' görünümünde iptal dışındaki her durum görünür", () => {
    for (const d of ["siparis-alindi", "tasarim-bekleniyor", "uretimde", "kargoya-verildi", "teslim-edildi"]) {
      expect(siparisListedeGorunur(d, "all"), d).toBe(true);
    }
  });

  it("İptal filtresi seçilince yalnız iptaller görünür", () => {
    expect(siparisListedeGorunur(IPTAL_DURUMU, IPTAL_DURUMU)).toBe(true);
    expect(siparisListedeGorunur("uretimde", IPTAL_DURUMU)).toBe(false);
  });

  it("başka bir durum filtresi seçilince yalnız o durum görünür", () => {
    expect(siparisListedeGorunur("uretimde", "uretimde")).toBe(true);
    expect(siparisListedeGorunur("teslim-edildi", "uretimde")).toBe(false);
    // iptal, "Tümü" dışında da yalnız kendi filtresinde çıkar
    expect(siparisListedeGorunur(IPTAL_DURUMU, "uretimde")).toBe(false);
  });
});
