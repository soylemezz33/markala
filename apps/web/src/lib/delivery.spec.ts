import { describe, it, expect } from "vitest";
import { parseBusinessDayRange, teslimAraligi, gunAraligiMetni, KARGO_SURESI, KARGO_ARALIGI, URETIM_SURESI, TOPLAM_SURE } from "./delivery";

describe("parseBusinessDayRange", () => {
  it("aralık ve tek sayı", () => {
    expect(parseBusinessDayRange("6-7 iş günü")).toEqual({ min: 6, max: 7 });
    expect(parseBusinessDayRange("3 iş günü")).toEqual({ min: 3, max: 3 });
    expect(parseBusinessDayRange("")).toBeNull();
    expect(parseBusinessDayRange(undefined)).toBeNull();
  });
});

describe("teslimAraligi", () => {
  it("KARGO_ARALIGI, KARGO_SURESI metniyle tutarlı", () => {
    expect(gunAraligiMetni(KARGO_ARALIGI)).toBe(KARGO_SURESI);
  });
  it("tek kalem: üretim + kargo", () => {
    const t = teslimAraligi(["6-7 iş günü"]);
    expect(t.uretim).toEqual({ min: 6, max: 7 });
    expect(t.toplam).toEqual({ min: 8, max: 11 });
    expect(t.toplamMetni).toBe("8-11 iş günü");
  });
  it("çok kalem: en uzun üretim belirler", () => {
    const t = teslimAraligi(["1-2 iş günü", "6-7 iş günü", undefined]);
    expect(t.uretim).toEqual({ min: 6, max: 7 });
    // "1-2" ile "6-7" birlikte 6-7; varsayılan (3-5) bunu aşmaz.
  });
  it("boş liste site geneli varsayılana düşer ve TOPLAM_SURE ile tutarlıdır", () => {
    const t = teslimAraligi([]);
    expect(t.uretimMetni).toBe(URETIM_SURESI);
    expect(t.toplamMetni).toBe(TOPLAM_SURE);
  });
});
