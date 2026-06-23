import { describe, it, expect } from "vitest";
import { extractSelections, pickConfigurationSummary, computeConfiguredPrice, resolveRules, effectiveSelections, normalizeSelections } from "./pricing";

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

// ---------------------------------------------------------------------------
// Fix 1+2 — Web parity: resolveRules / effectiveSelections / normalizeSelections
// ---------------------------------------------------------------------------

const optWithRules = (
  groupKey: string,
  groupRole: "dimension" | "priced",
  optionKey: string,
  groupSort = 0,
  optionSort = 0,
  rules?: { disablesGroups?: string[]; forcesOption?: { groupKey: string; optionKey: string } } | null,
  locked = false,
) => ({ groupKey, groupLabel: groupKey, groupRole, groupSort, optionKey, optionLabel: optionKey, optionSort, rules: rules ?? null, locked });

describe("resolveRules (web parity)", () => {
  it("seçili olmayan option'ın rules'ı uygulanmaz", () => {
    const opts = [
      optWithRules("malzeme", "priced", "kuse", 0, 0, { disablesGroups: ["laminasyon"] }),
      optWithRules("malzeme", "priced", "dokusuz", 0, 1),
    ];
    // malzeme=dokusuz seçili — kuse seçili değil → laminasyon disabled olmaz
    const result = resolveRules(opts, { malzeme: "dokusuz" });
    expect(result.disabledGroups.size).toBe(0);
    expect(result.forced).toEqual({});
  });

  it("seçili option'ın disablesGroups doğru toplanır", () => {
    const opts = [
      optWithRules("malzeme", "priced", "kuse", 0, 0, { disablesGroups: ["laminasyon", "selefon"] }),
      optWithRules("malzeme", "priced", "dokusuz", 0, 1),
    ];
    const result = resolveRules(opts, { malzeme: "kuse" });
    expect(result.disabledGroups).toContain("laminasyon");
    expect(result.disabledGroups).toContain("selefon");
  });

  it("seçili option'ın forcesOption doğru uygulanır", () => {
    const opts = [
      optWithRules("malzeme", "priced", "kuse", 0, 0, {
        forcesOption: { groupKey: "laminasyon", optionKey: "parlak" },
      }),
    ];
    const result = resolveRules(opts, { malzeme: "kuse" });
    expect(result.forced).toEqual({ laminasyon: "parlak" });
  });
});

describe("effectiveSelections (web parity)", () => {
  it("disabled grubun seçimi çıkarılır — disabled group fiyata katılmaz", () => {
    const opts = [
      optWithRules("malzeme", "priced", "kuse"),
      optWithRules("laminasyon", "priced", "parlak"),
    ];
    const resolved = { disabledGroups: new Set(["laminasyon"]), forced: {} };
    const eff = effectiveSelections(opts, { malzeme: "kuse", laminasyon: "parlak" }, resolved);
    expect(eff).not.toHaveProperty("laminasyon");
    expect(eff.malzeme).toBe("kuse");
  });

  it("forced seçim rawSelections'ı override eder", () => {
    const opts = [
      optWithRules("malzeme", "priced", "kuse"),
      optWithRules("laminasyon", "priced", "mat"),
      optWithRules("laminasyon", "priced", "parlak"),
    ];
    const resolved = { disabledGroups: new Set<string>(), forced: { laminasyon: "parlak" } };
    const eff = effectiveSelections(opts, { malzeme: "kuse", laminasyon: "mat" }, resolved);
    expect(eff.laminasyon).toBe("parlak");
  });

  it("locked grup client seçimini yok sayar; optionSort en küçük default zorlanır", () => {
    const opts = [
      optWithRules("malzeme", "priced", "kuse", 0, 0, null, true),   // locked, sort=0 → default
      optWithRules("malzeme", "priced", "dokusuz", 0, 1, null, true), // locked, sort=1
    ];
    const resolved = { disabledGroups: new Set<string>(), forced: {} };
    // client "dokusuz" seçmiş; locked olduğu için sort=0 olan "kuse" zorlanmalı
    const eff = effectiveSelections(opts, { malzeme: "dokusuz" }, resolved);
    expect(eff.malzeme).toBe("kuse");
  });
});

describe("normalizeSelections (web parity — uçtan uca)", () => {
  it("rules/locked yoksa selections değişmeden döner (geriye uyumlu)", () => {
    const opts = [opt("paket", "priced", "cyp"), opt("adet", "dimension", "1000")];
    const raw = { paket: "cyp", adet: "1000" };
    expect(normalizeSelections(opts, raw)).toBe(raw); // referans aynı (early-return)
  });

  it("disablesGroups: disabled grubun fiyatına katılmaz (API=web parity)", () => {
    // malzeme=kuse → laminasyon disabled
    // client laminasyon:parlak göndermiş — server ignore etmeli
    const opts = [
      optWithRules("malzeme", "priced", "kuse", 0, 0, { disablesGroups: ["laminasyon"] }),
      optWithRules("laminasyon", "priced", "parlak", 1, 0),
    ];
    const prices = [
      { groupKey: "malzeme", optionKey: "kuse", dimKey: null, price: 100 },
      { groupKey: "laminasyon", optionKey: "parlak", dimKey: null, price: 50 },
    ];
    const raw = { malzeme: "kuse", laminasyon: "parlak" };
    const normalized = normalizeSelections(opts, raw);
    // laminasyon disabled → normalizeSelections çıkarmış olmalı
    expect(normalized).not.toHaveProperty("laminasyon");
    // Fiyat sadece malzeme = 100
    const price = computeConfiguredPrice(opts, prices, normalized);
    expect(price).toBe(100);
  });

  it("forcesOption: server forced seçimi uygular (API=web parity)", () => {
    const opts = [
      optWithRules("malzeme", "priced", "kuse", 0, 0, {
        forcesOption: { groupKey: "laminasyon", optionKey: "parlak" },
      }),
      optWithRules("laminasyon", "priced", "mat", 1, 0),
      optWithRules("laminasyon", "priced", "parlak", 1, 1),
    ];
    const prices = [
      { groupKey: "malzeme", optionKey: "kuse", dimKey: null, price: 100 },
      { groupKey: "laminasyon", optionKey: "mat", dimKey: null, price: 30 },
      { groupKey: "laminasyon", optionKey: "parlak", dimKey: null, price: 50 },
    ];
    // client laminasyon:mat göndermiş; malzeme:kuse → forcesOption laminasyon:parlak
    const raw = { malzeme: "kuse", laminasyon: "mat" };
    const normalized = normalizeSelections(opts, raw);
    expect(normalized.laminasyon).toBe("parlak");
    // Fiyat: malzeme(100) + laminasyon:parlak(50) = 150
    const price = computeConfiguredPrice(opts, prices, normalized);
    expect(price).toBe(150);
  });

  it("locked grup: client seçimini yok sayar, default zorlanır ve doğru fiyatlanır", () => {
    const opts = [
      optWithRules("paket", "priced", "standard", 0, 0, null, true), // locked default (sort=0)
      optWithRules("paket", "priced", "premium", 0, 1, null, true),  // locked, sort=1
      optWithRules("adet", "dimension", "500", 1, 0),
    ];
    const prices = [
      { groupKey: "paket", optionKey: "standard", dimKey: "500", price: 200 },
      { groupKey: "paket", optionKey: "premium", dimKey: "500", price: 350 },
    ];
    // client "premium" seçmiş; locked olduğu için "standard" (sort=0) zorlanmalı
    const raw = { paket: "premium", adet: "500" };
    const normalized = normalizeSelections(opts, raw);
    expect(normalized.paket).toBe("standard");
    const price = computeConfiguredPrice(opts, prices, normalized);
    expect(price).toBe(200);
  });
});
