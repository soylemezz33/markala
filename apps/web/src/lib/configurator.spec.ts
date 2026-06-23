import { describe, it, expect } from "vitest";
import {
  computeConfiguredPrice,
  getDisplayPrice,
  initSelections,
  resolveRules,
  effectiveSelections,
  optionPriceHints,
  groupHintMode,
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

  it("sadece dimension gruplar + prices=[] → 0", () => {
    // Dimension-only: ebat + adet, fiyat satırı yok
    const options = [opt("ebat", "dimension", "a4"), opt("adet", "dimension", "10")];
    expect(
      computeConfiguredPrice(options, [], { ebat: "a4", adet: "10" }),
    ).toBe(0);
  });

  it("sadece priced gruplar + prices=[] → 0", () => {
    // Priced-only: baski + laminasyon, fiyat satırı yok
    const options = [
      opt("baski", "priced", "renkli"),
      opt("laminasyon", "priced", "parlak"),
    ];
    expect(
      computeConfiguredPrice(options, [], { baski: "renkli", laminasyon: "parlak" }),
    ).toBe(0);
  });

  it("eksik selection (bir grup seçilmemiş) → 0 katkı (çökmez)", () => {
    // baski seçili, laminasyon SEÇİLMEMİŞ → laminasyon katkısı 0, sadece baski sayılır
    const options = [
      opt("baski", "priced", "renkli"),
      opt("laminasyon", "priced", "parlak"),
    ];
    const prices = [
      { groupKey: "baski", optionKey: "renkli", dimKey: null, price: 100 },
      { groupKey: "laminasyon", optionKey: "parlak", dimKey: null, price: 50 },
    ];
    expect(
      computeConfiguredPrice(options, prices, { baski: "renkli" /* laminasyon yok */ }),
    ).toBe(100);
  });

  it("selections={} (tamamen boş) → 0, çökmez", () => {
    const options = [opt("paket", "priced", "cyp"), opt("adet", "dimension", "1000")];
    const prices = [{ groupKey: "paket", optionKey: "cyp", dimKey: "1000", price: 290 }];
    expect(computeConfiguredPrice(options, prices, {})).toBe(0);
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

// ---------------------------------------------------------------------------
// resolveRules & effectiveSelections — Task 4
// ---------------------------------------------------------------------------

describe("resolveRules", () => {
  it("(a) seçili option disablesGroups → disabledGroups kümesine eklenir", () => {
    const opts = [
      { groupKey: "malzeme", optionKey: "dijital", rules: { disablesGroups: ["laminasyon"] } },
    ];
    const { disabledGroups } = resolveRules(opts, { malzeme: "dijital" });
    expect(disabledGroups.has("laminasyon")).toBe(true);
  });

  it("(b) forcesOption seçili option'da ise forced'a eklenir", () => {
    const opts = [
      { groupKey: "malzeme", optionKey: "kuşe", rules: { forcesOption: { groupKey: "laminasyon", optionKey: "parlak" } } },
    ];
    const { forced } = resolveRules(opts, { malzeme: "kuşe" });
    expect(forced).toEqual({ laminasyon: "parlak" });
  });

  it("(c) seçili olmayan option'ın rules'ları uygulanmaz", () => {
    const opts = [
      { groupKey: "malzeme", optionKey: "dijital", rules: { disablesGroups: ["laminasyon"] } },
    ];
    const { disabledGroups, forced } = resolveRules(opts, { malzeme: "kuşe" }); // dijital seçili değil
    expect(disabledGroups.size).toBe(0);
    expect(Object.keys(forced)).toHaveLength(0);
  });
});

describe("effectiveSelections", () => {
  it("(d) pasif gruplar silinir ve forced değerler uygulanır", () => {
    const selections = { malzeme: "dijital", laminasyon: "parlak", renk: "4+0" };
    const resolved = {
      disabledGroups: new Set(["laminasyon"]),
      forced: { renk: "4+4" },
    };
    const result = effectiveSelections(selections, resolved);
    expect(result.laminasyon).toBeUndefined(); // pasif → çıkarıldı
    expect(result.renk).toBe("4+4");           // forced → uygulandı
    expect(result.malzeme).toBe("dijital");    // dokunulmadı
  });
});

// ---------------------------------------------------------------------------
// optionPriceHints & groupHintMode — Task 5
// ---------------------------------------------------------------------------

describe("optionPriceHints", () => {
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

  it("priced grup: delta (en ucuz=0, pahalı=fark)", () => {
    const product: Product = {
      ...base,
      options: [
        opt("paket", "priced", "ekonomi", 0, 0) as any,
        opt("paket", "priced", "premium", 0, 1) as any,
        opt("adet", "dimension", "100", 1, 0) as any,
        opt("adet", "dimension", "500", 1, 1) as any,
      ] as any,
      prices: [
        { groupKey: "paket", optionKey: "ekonomi", dimKey: "100", price: 200 },
        { groupKey: "paket", optionKey: "premium", dimKey: "100", price: 350 },
      ] as any,
    };
    const hints = optionPriceHints(product, { paket: "ekonomi", adet: "100" });
    // priced: delta — ekonomi=0, premium=150
    expect(hints["paket"]!["ekonomi"]).toBe(0);
    expect(hints["paket"]!["premium"]).toBe(150);
  });

  it("adet dimension (ebat de varsa çarpan): her option için calculateTotal toplam", () => {
    // ISG tipi: ebat=dimension (priceDim), baski=priced, adet=dimension (multiplier)
    // adet priceDim DEĞİL → multiplier → hint = calculateTotal
    const product: Product = {
      ...base,
      options: [
        opt("ebat", "dimension", "a4", 0, 0) as any,
        opt("baski", "priced", "normal", 1, 0) as any,
        opt("adet", "dimension", "10", 2, 0) as any,
        opt("adet", "dimension", "50", 2, 1) as any,
      ] as any,
      prices: [
        { groupKey: "baski", optionKey: "normal", dimKey: "a4", price: 20 },
      ] as any,
    };
    const hints = optionPriceHints(product, { ebat: "a4", baski: "normal", adet: "10" });
    // adet "10" → qty=10, unit=20 → total=200
    expect(hints["adet"]!["10"]).toBe(200);
    // adet "50" → qty=50, unit=20 → total=1000
    expect(hints["adet"]!["50"]).toBe(1000);
  });

  it("priced grup fiyat satırı yoksa hint=null", () => {
    const product: Product = {
      ...base,
      options: [
        opt("paket", "priced", "cyp", 0, 0) as any,
        opt("adet", "dimension", "1000", 1, 0) as any,
      ] as any,
      prices: [] as any,
    };
    const hints = optionPriceHints(product, { paket: "cyp", adet: "1000" });
    expect(hints["paket"]!["cyp"]).toBeNull();
  });

  it("ebat (diğer dimension) → hint=null", () => {
    const product: Product = {
      ...base,
      options: [
        opt("ebat", "dimension", "a4", 0, 0) as any,
        opt("baski", "priced", "reflektif", 1, 0) as any,
        opt("adet", "dimension", "10", 2, 0) as any,
      ] as any,
      prices: [
        { groupKey: "baski", optionKey: "reflektif", dimKey: "a4", price: 100 },
      ] as any,
    };
    const hints = optionPriceHints(product, { ebat: "a4", baski: "reflektif", adet: "10" });
    // ebat = non-adet non-priced dimension → null
    expect(hints["ebat"]!["a4"]).toBeNull();
  });
});

describe("groupHintMode", () => {
  const base: Product = {
    slug: "test",
    name: "Test",
    categorySlug: "test",
    shortDescription: "",
    description: "",
    basePrice: 0,
    productionTime: "1 gün",
    images: [],
    options: [
      opt("paket", "priced", "cyp", 0, 0) as any,
      opt("adet", "dimension", "100", 1, 0) as any,
      opt("ebat", "dimension", "a4", 2, 0) as any,
    ] as any,
  };

  it("priced grup → delta", () => {
    expect(groupHintMode(base, "paket")).toBe("delta");
  });

  it("adet multiplier → total", () => {
    expect(groupHintMode(base, "adet")).toBe("total");
  });

  it("ebat (diğer dim) → none", () => {
    expect(groupHintMode(base, "ebat")).toBe("none");
  });
});

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
