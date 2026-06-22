import { describe, it, expect } from "vitest";
import { calculateConfiguredPrice, extractSelections, pickConfigurationSummary, computeConfiguredPrice } from "./pricing";

describe("calculateConfiguredPrice", () => {
  it("parametresiz ürün → base_price", () => {
    expect(calculateConfiguredPrice(290, [], {})).toBe(290);
    expect(calculateConfiguredPrice(0, undefined, {})).toBe(0);
  });

  it("matrix: seçili hücre fiyatı base'e eklenir (kartvizit senaryosu, base=0)", () => {
    const params = [{ id: "varyant", kind: "matrix", cells: [{ id: "cyp-1000", price: 290 }, { id: "cyp-2000", price: 480 }] }];
    expect(calculateConfiguredPrice(0, params, { varyant: "cyp-1000" })).toBe(290);
    expect(calculateConfiguredPrice(0, params, { varyant: "cyp-2000" })).toBe(480);
  });

  it("quantity: adet × unitPrice", () => {
    const params = [{ id: "adet", kind: "quantity", unitPrice: 0.29 }];
    expect(calculateConfiguredPrice(0, params, { adet: 1000 })).toBeCloseTo(290, 2);
  });

  it("radio/select priceModifier + checkbox-group toplamı", () => {
    const params = [
      { id: "kagit", kind: "radio", options: [{ id: "mat", priceModifier: 50 }, { id: "parlak", priceModifier: 0 }] },
      { id: "ekstra", kind: "checkbox-group", options: [{ id: "lak", priceModifier: 30 }, { id: "kabartma", priceModifier: 20 }] },
    ];
    expect(calculateConfiguredPrice(100, params, { kagit: "mat", ekstra: ["lak", "kabartma"] })).toBe(200);
  });

  it("dimension: alan(m²) × pricePerSqm + 1m² altı oto ek", () => {
    const params = [
      { id: "olcu", kind: "dimension", pricePerSqm: 100, extras: [{ id: "min", autoBelow1Sqm: true, flatFee: 25 }] },
    ];
    // 50×50cm = 0.25 m² → 25 + oto ek 25 = 50
    expect(calculateConfiguredPrice(0, params, { olcu: { width: 50, height: 50, extras: [] } })).toBeCloseTo(50, 2);
    // 100×100cm = 1 m² → 100, oto ek yok (alan<1 değil)
    expect(calculateConfiguredPrice(0, params, { olcu: { width: 100, height: 100, extras: [] } })).toBeCloseTo(100, 2);
  });

  it("İSG: ebat-bazlı (priceBySize) + perUnit baskı+malzeme × adet", () => {
    const params = [
      {
        id: "ebat", kind: "radio", isSizeDriver: true,
        options: [{ id: "25x35", priceModifier: 0 }, { id: "50x70", priceModifier: 0 }],
      },
      {
        id: "baski", kind: "radio", perUnit: true,
        options: [{ id: "reflektif", priceModifier: 0, priceBySize: { "25x35": 110, "50x70": 430 } }],
      },
      {
        id: "malzeme", kind: "radio", perUnit: true,
        options: [
          { id: "yok", priceModifier: 0, priceBySize: { "25x35": 0, "50x70": 0 } },
          { id: "dekota", priceModifier: 0, priceBySize: { "25x35": 70, "50x70": 270 } },
        ],
      },
      { id: "adet", kind: "quantity", unitPrice: 0 },
    ];
    // 50×70 · Reflektif + Dekota · 1 adet = 430 + 270 = 700
    expect(calculateConfiguredPrice(0, params, { ebat: "50x70", baski: "reflektif", malzeme: "dekota", adet: 1 })).toBe(700);
    // ×2 adet = 1400
    expect(calculateConfiguredPrice(0, params, { ebat: "50x70", baski: "reflektif", malzeme: "dekota", adet: 2 })).toBe(1400);
    // yalnız etiket (malzeme yok): 50×70 Reflektif = 430
    expect(calculateConfiguredPrice(0, params, { ebat: "50x70", baski: "reflektif", malzeme: "yok", adet: 1 })).toBe(430);
    // 25×35 Reflektif + Dekota = 110 + 70 = 180
    expect(calculateConfiguredPrice(0, params, { ebat: "25x35", baski: "reflektif", malzeme: "dekota", adet: 1 })).toBe(180);
  });

  it("negatif sonuç 0'a sabitlenir; geçersiz selection güvenle yok sayılır", () => {
    expect(calculateConfiguredPrice(0, [{ id: "x", kind: "matrix", cells: [] }], { x: "yok" })).toBe(0);
    expect(calculateConfiguredPrice(0, "bozuk" as unknown, {})).toBe(0);
  });
});

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
