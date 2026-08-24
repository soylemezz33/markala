import { describe, expect, it } from "vitest";
import { computeItemCostTotal } from "./costing";

/** Kalem maliyeti (snapshot + kâr raporu fallback'i) — orders/costing.ts */
describe("computeItemCostTotal", () => {
  const areaProduct = { pricingMode: "area", options: [], prices: [] };

  it("ürün yoksa (kampanya paketi) null döner", () => {
    expect(computeItemCostTotal(undefined, {}, 1, 100, 1.2)).toBeNull();
    expect(computeItemCostTotal(null, {}, 1, 100, 1.2)).toBeNull();
  });

  it("area: KDV hariç satış ÷ marj (satış motoru maliyet×marj ürettiği için)", () => {
    expect(computeItemCostTotal(areaProduct, {}, 1, 120, 1.2)).toBe(100);
  });

  it("area: marj geçersizse null (0'a bölme/uydurma yok)", () => {
    expect(computeItemCostTotal(areaProduct, {}, 1, 120, 0)).toBeNull();
  });

  it("seçenek grubu olmayan ürün: taban satır maliyeti × kalem adedi (boş selections NORMAL)", () => {
    const p = {
      pricingMode: "additive",
      options: [],
      prices: [{ groupKey: null, optionKey: null, dimKey: null, price: 450, cost: 220 }],
    };
    expect(computeItemCostTotal(p, {}, 1, 375, 1.2)).toBe(220);
    expect(computeItemCostTotal(p, {}, 2, 750, 1.2)).toBe(440);
  });

  it("seçenek grubu olmayan üründe cost girilmemişse null", () => {
    const p = {
      pricingMode: "additive",
      options: [],
      prices: [{ groupKey: null, optionKey: null, dimKey: null, price: 450, cost: null }],
    };
    expect(computeItemCostTotal(p, {}, 1, 375, 1.2)).toBeNull();
  });

  it("hiçbir satırda cost yoksa (İSG kataloğu) null — %100 kâr yanılsaması üretilmez", () => {
    const p = {
      pricingMode: "additive",
      options: [{ groupKey: "malzeme", groupRole: "priced", groupSort: 1, optionKey: "pvc" }],
      prices: [{ groupKey: "malzeme", optionKey: "pvc", dimKey: "25x35", price: 49.9 }],
    };
    expect(
      computeItemCostTotal(p, { selections: { malzeme: "pvc", ebat: "25x35" } }, 1, 40, 1.2),
    ).toBeNull();
  });

  it("seçenekli ürün: motor cost ile çalışır, sonuç kalem adediyle çarpılır", () => {
    const p = {
      pricingMode: "additive",
      options: [
        { groupKey: "ebat", groupRole: "dimension", groupSort: 0, optionKey: "25x35" },
        { groupKey: "malzeme", groupRole: "priced", groupSort: 1, optionKey: "pvc" },
      ],
      prices: [{ groupKey: "malzeme", optionKey: "pvc", dimKey: "25x35", price: 49.9, cost: 30 }],
    };
    const config = { selections: { ebat: "25x35", malzeme: "pvc" } };
    expect(computeItemCostTotal(p, config, 1, 41.58, 1.2)).toBe(30);
    expect(computeItemCostTotal(p, config, 3, 124.75, 1.2)).toBe(90);
  });

  it("eski selections ürünün değişmiş şemasıyla eşleşmiyorsa null (0 = %100 kâr yanılsaması OLMAZ)", () => {
    const p = {
      pricingMode: "additive",
      options: [
        { groupKey: "ebat", groupRole: "dimension", groupSort: 0, optionKey: "25x35" },
        { groupKey: "malzeme", groupRole: "priced", groupSort: 1, optionKey: "pvc" },
      ],
      prices: [{ groupKey: "malzeme", optionKey: "pvc", dimKey: "25x35", price: 49.9, cost: 30 }],
    };
    // sipariş anındaki eski anahtarlar artık yok → motor satır bulamaz → null
    expect(
      computeItemCostTotal(p, { selections: { ebat: "eski-ebat", malzeme: "eski-malzeme" } }, 1, 40, 1.2),
    ).toBeNull();
  });

  it("seçenekli üründe selections boşsa null (hangi kombinasyon satıldığı bilinemez)", () => {
    const p = {
      pricingMode: "additive",
      options: [{ groupKey: "malzeme", groupRole: "priced", groupSort: 1, optionKey: "pvc" }],
      prices: [{ groupKey: "malzeme", optionKey: "pvc", dimKey: null, price: 49.9, cost: 30 }],
    };
    expect(computeItemCostTotal(p, {}, 1, 40, 1.2)).toBeNull();
  });
});
