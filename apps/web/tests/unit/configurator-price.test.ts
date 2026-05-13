import { describe, it, expect } from "vitest";
import type { Product } from "@markala/types";
import {
  calculatePrice,
  initConfig,
  getInstallmentAmount,
  type ConfigState,
} from "@/lib/configurator";

/**
 * Configurator fiyat hesap motoru — 5 kritik senaryo.
 *
 * Tested kinds: matrix, radio (priceModifier), checkbox-group,
 * quantity (qty × unit), dimension (alan × m² + extras).
 */

// === Test fixtures ===

/** 1) Matrix-only ürün (klasik kartvizit benzeri) */
const matrixProduct: Product = {
  slug: "test-matrix",
  name: "Test Matrix",
  categorySlug: "kartvizit",
  shortDescription: "test",
  description: "test",
  basePrice: 0,
  productionTime: "1-2 gün",
  images: [],
  parameters: [
    {
      id: "varyant",
      label: "Paket × Adet",
      kind: "matrix",
      required: true,
      rows: [{ id: "cyp", label: "CYP", group: "EKO" }],
      cols: [
        { id: "1000", label: "1.000" },
        { id: "5000", label: "5.000" },
      ],
      cells: [
        { id: "cyp-1000", rowId: "cyp", colId: "1000", code: "CYP", price: 290 },
        { id: "cyp-5000", rowId: "cyp", colId: "5000", code: "CYP", price: 1450 },
      ],
      defaultCellId: "cyp-1000",
    },
  ],
};

/** 2) Radio + checkbox-group + quantity kombinasyonu */
const radioProduct: Product = {
  slug: "test-radio",
  name: "Test Radio",
  categorySlug: "etiket",
  shortDescription: "test",
  description: "test",
  basePrice: 100,
  productionTime: "1 gün",
  images: [],
  parameters: [
    {
      id: "kagit",
      label: "Kâğıt",
      kind: "radio",
      required: true,
      options: [
        { id: "kuse", label: "Kuşe", priceModifier: 0 },
        { id: "bristol", label: "Bristol", priceModifier: 50 },
      ],
      defaultOptionId: "kuse",
    },
    {
      id: "ekstra",
      label: "Ek",
      kind: "checkbox-group",
      required: false,
      options: [
        { id: "selefon", label: "Selefon", priceModifier: 30 },
        { id: "uv", label: "UV Lak", priceModifier: 80 },
      ],
    },
    {
      id: "adet",
      label: "Adet",
      kind: "quantity",
      required: true,
      quantityPresets: [100, 500],
      unitPrice: 2,
    },
  ],
};

/** 3) Dimension (alan × m² + extras + autoBelow1Sqm) */
const dimensionProduct: Product = {
  slug: "test-vinil",
  name: "Test Vinil",
  categorySlug: "branda",
  shortDescription: "test",
  description: "test",
  basePrice: 0,
  productionTime: "2 gün",
  images: [],
  parameters: [
    {
      id: "olcu",
      label: "Ölçü",
      kind: "dimension",
      required: true,
      pricePerSqm: 200,
      defaultWidth: 100,
      defaultHeight: 100,
      extras: [
        { id: "min", label: "1m² altı ek ücret", flatFee: 50, autoBelow1Sqm: true },
        { id: "kolon", label: "Kolon Dikiş", perimeterPricePerM: 30 },
      ],
    },
  ],
};

// === Tests ===

describe("calculatePrice", () => {
  it("1) matrix: defaultCellId fiyatını base'e ekler ve quantity'i sütun id'sinden okur", () => {
    const state = initConfig(matrixProduct);
    const result = calculatePrice(matrixProduct, state);

    expect(result.total).toBe(290);
    expect(result.quantity).toBe(1000);
    // 290 / 1000 = 0.29
    expect(result.unitPrice).toBeCloseTo(0.29, 2);
    expect(result.modifiers).toHaveLength(1);
    expect(result.vatIncluded).toBe(true);
  });

  it("2) matrix: farklı hücre seçildiğinde fiyat ve adet güncellenir", () => {
    const state: ConfigState = { selections: { varyant: "cyp-5000" } };
    const result = calculatePrice(matrixProduct, state);

    expect(result.total).toBe(1450);
    expect(result.quantity).toBe(5000);
    expect(result.unitPrice).toBeCloseTo(0.29, 2);
  });

  it("3) radio + checkbox + quantity: tüm modifier'lar toplanır", () => {
    // base 100 + bristol 50 + selefon 30 + uv 80 + (qty 500 × 2 unit) = 1260
    const state: ConfigState = {
      selections: {
        kagit: "bristol",
        ekstra: ["selefon", "uv"],
        adet: 500,
      },
    };
    const result = calculatePrice(radioProduct, state);

    expect(result.total).toBe(100 + 50 + 30 + 80 + 500 * 2);
    expect(result.quantity).toBe(500);
    expect(result.unitPrice).toBe(2);
    expect(result.modifiers.length).toBeGreaterThanOrEqual(3);
  });

  it("4) dimension: 100×100 cm = 1m² → pricePerSqm × 1 + 0 ek (1m² sınırında autoBelow tetiklenmez)", () => {
    const state = initConfig(dimensionProduct);
    const result = calculatePrice(dimensionProduct, state);

    expect(result.dimensions?.areaSqm).toBeCloseTo(1, 2);
    expect(result.dimensions?.perimeterM).toBeCloseTo(4, 2);
    // 1m² × 200 ₺/m² = 200, 1m² altı değil
    expect(result.total).toBe(200);
  });

  it("5) dimension: 50×50 cm = 0.25m² → otomatik 1m² altı ek + kullanıcı seçtiği kolon dikiş", () => {
    // alan 0.25 × 200 = 50
    // autoBelow1Sqm flatFee = 50
    // kolon dikiş 30 × çevre(2m) = 60
    // toplam = 50 + 50 + 60 = 160
    const state: ConfigState = {
      selections: {
        olcu: { width: 50, height: 50, extras: ["kolon"] },
      },
    };
    const result = calculatePrice(dimensionProduct, state);

    expect(result.dimensions?.areaSqm).toBeCloseTo(0.25, 2);
    expect(result.dimensions?.perimeterM).toBeCloseTo(2, 2);
    expect(result.total).toBe(50 + 50 + 60);
    // Auto ek + kolon ek modifier'larda görünmeli
    const labels = result.modifiers.map((m) => m.label);
    expect(labels.some((l) => l.includes("otomatik"))).toBe(true);
    expect(labels.some((l) => l.includes("Kolon"))).toBe(true);
  });
});

describe("getInstallmentAmount", () => {
  it("3 taksit varsayılan", () => {
    expect(getInstallmentAmount(300)).toBe(100);
  });

  it("özel taksit sayısı", () => {
    expect(getInstallmentAmount(1200, 6)).toBe(200);
  });
});
