import { describe, it, expect } from "vitest";
import {
  computeConfiguredPrice,
  getDisplayPrice,
  initSelections,
} from "./configurator";
import type { Product } from "@markala/types";

// ---------------------------------------------------------------------------
// Yardımcı: API pricing.spec.ts'deki opt() fabrikası ile aynı imza
// ---------------------------------------------------------------------------
const opt = (
  groupKey: string,
  groupRole: "dimension" | "priced",
  optionKey: string,
  groupSort = 0,
  optionSort = 0,
) => ({
  groupKey,
  groupLabel: groupKey,
  groupRole,
  groupSort,
  optionKey,
  optionLabel: optionKey,
  optionSort,
});

// ---------------------------------------------------------------------------
// computeConfiguredPrice — API pricing.spec.ts ile aynı 5 vaka
// ---------------------------------------------------------------------------

describe("computeConfiguredPrice", () => {
  it("basit ürün: tek null-key satır", () => {
    expect(
      computeConfiguredPrice(
        [],
        [{ groupKey: null, optionKey: null, dimKey: null, price: 250 }],
        {},
      ),
    ).toBe(250);
  });

  it("matris (kartvizit): paket×adet = hücre", () => {
    const options = [opt("paket", "priced", "cyp"), opt("adet", "dimension", "1000")];
    const prices = [{ groupKey: "paket", optionKey: "cyp", dimKey: "1000", price: 290 }];
    expect(
      computeConfiguredPrice(options, prices, { paket: "cyp", adet: "1000" }),
    ).toBe(290);
  });

  it("İSG additive: (malzeme[ebat]+baski[ebat]) × adet", () => {
    const options = [
      opt("ebat", "dimension", "50x70"),
      opt("baski", "priced", "reflektif"),
      opt("malzeme", "priced", "dekota"),
      opt("adet", "dimension", "2"),
    ];
    const prices = [
      { groupKey: "baski", optionKey: "reflektif", dimKey: "50x70", price: 110 },
      { groupKey: "malzeme", optionKey: "dekota", dimKey: "50x70", price: 70 },
    ];
    expect(
      computeConfiguredPrice(options, prices, {
        ebat: "50x70",
        baski: "reflektif",
        malzeme: "dekota",
        adet: "2",
      }),
    ).toBe(360);
  });

  it("malzeme yok (satır yok) = 0 katkı", () => {
    const options = [
      opt("ebat", "dimension", "25x35"),
      opt("baski", "priced", "reflektif"),
      opt("malzeme", "priced", "yok"),
      opt("adet", "dimension", "1"),
    ];
    const prices = [{ groupKey: "baski", optionKey: "reflektif", dimKey: "25x35", price: 110 }];
    expect(
      computeConfiguredPrice(options, prices, {
        ebat: "25x35",
        baski: "reflektif",
        malzeme: "yok",
        adet: "1",
      }),
    ).toBe(110);
  });

  it("fiyat satırı yoksa 0 (Teklif Al)", () => {
    const options = [opt("paket", "priced", "cyp"), opt("adet", "dimension", "1000")];
    expect(
      computeConfiguredPrice(options, [], { paket: "cyp", adet: "1000" }),
    ).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// getDisplayPrice
// ---------------------------------------------------------------------------

describe("getDisplayPrice", () => {
  const base: Product = {
    slug: "test",
    name: "Test",
    categorySlug: "test",
    shortDescription: "",
    description: "",
    basePrice: 0,
    productionTime: "1 gün",
    images: [],
  };

  it("product.displayPrice döndürür", () => {
    expect(getDisplayPrice({ ...base, displayPrice: 299 })).toBe(299);
  });

  it("displayPrice null ise 0 döndürür", () => {
    expect(getDisplayPrice({ ...base, displayPrice: null })).toBe(0);
  });

  it("displayPrice undefined ise 0 döndürür", () => {
    expect(getDisplayPrice({ ...base })).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// initSelections
// ---------------------------------------------------------------------------

describe("initSelections", () => {
  const base: Product = {
    slug: "test",
    name: "Test",
    categorySlug: "test",
    shortDescription: "",
    description: "",
    basePrice: 0,
    productionTime: "1 gün",
    images: [],
  };

  it("her grup için optionSort en küçük option'ı seçer", () => {
    const product: Product = {
      ...base,
      options: [
        opt("paket", "priced", "cyp", 0, 1) as any,
        opt("paket", "priced", "mat", 0, 0) as any,  // sort=0 → seçilmeli
        opt("adet", "dimension", "500", 1, 1) as any,
        opt("adet", "dimension", "1000", 1, 0) as any, // sort=0 → seçilmeli
      ],
    };
    const sel = initSelections(product);
    expect(sel).toEqual({ paket: "mat", adet: "1000" });
  });

  it("options yoksa boş obje döner", () => {
    expect(initSelections(base)).toEqual({});
  });
});
