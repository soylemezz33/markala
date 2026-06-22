import { describe, it, expect } from "vitest";
import { extractSelections, pickConfigurationSummary, computeConfiguredPrice } from "./pricing";

const opt = (groupKey: string, groupRole: "dimension"|"priced", optionKey: string, groupSort=0, optionSort=0) =>
  ({ groupKey, groupLabel: groupKey, groupRole, groupSort, optionKey, optionLabel: optionKey, optionSort });

describe("computeConfiguredPrice", () => {
  it("basit ürün: tek null-key satır", () => {
    expect(computeConfiguredPrice([], [{ groupKey:null, optionKey:null, dimKey:null, price:250 }], {})).toBe(250);
  });
  it("matris (kartvizit): paket×adet = hücre", () => {
    const options = [opt("paket","priced","cyp"), opt("adet","dimension","1000")];
    const prices = [{ groupKey:"paket", optionKey:"cyp", dimKey:"1000", price:290 }];
    expect(computeConfiguredPrice(options, prices, { paket:"cyp", adet:"1000" })).toBe(290);
  });
  it("İSG additive: (malzeme[ebat]+baski[ebat]) × adet", () => {
    const options = [opt("ebat","dimension","50x70"), opt("baski","priced","reflektif"), opt("malzeme","priced","dekota"), opt("adet","dimension","2")];
    const prices = [
      { groupKey:"baski", optionKey:"reflektif", dimKey:"50x70", price:110 },
      { groupKey:"malzeme", optionKey:"dekota", dimKey:"50x70", price:70 },
    ];
    expect(computeConfiguredPrice(options, prices, { ebat:"50x70", baski:"reflektif", malzeme:"dekota", adet:"2" })).toBe(360);
  });
  it("malzeme yok (satır yok) = 0 katkı", () => {
    const options = [opt("ebat","dimension","25x35"), opt("baski","priced","reflektif"), opt("malzeme","priced","yok"), opt("adet","dimension","1")];
    const prices = [{ groupKey:"baski", optionKey:"reflektif", dimKey:"25x35", price:110 }];
    expect(computeConfiguredPrice(options, prices, { ebat:"25x35", baski:"reflektif", malzeme:"yok", adet:"1" })).toBe(110);
  });
  it("fiyat satırı yoksa 0 (Teklif Al)", () => {
    const options = [opt("paket","priced","cyp"), opt("adet","dimension","1000")];
    expect(computeConfiguredPrice(options, [], { paket:"cyp", adet:"1000" })).toBe(0);
  });
});

describe("extractSelections / pickConfigurationSummary", () => {
  it("configuration.selections çıkarılır, yoksa boş", () => {
    expect(extractSelections({ selections: { a: "b" } })).toEqual({ a: "b" });
    expect(extractSelections({ adet: 5 })).toEqual({});
    expect(extractSelections(null)).toEqual({});
  });

  it("client summary varsa kullanılır, yoksa fallback", () => {
    expect(pickConfigurationSummary({ summary: "CYP · 1000 Adet" }, "fb")).toBe("CYP · 1000 Adet");
    expect(pickConfigurationSummary({ summary: "  " }, "fb")).toBe("fb");
    expect(pickConfigurationSummary({}, "fb")).toBe("fb");
  });
});
