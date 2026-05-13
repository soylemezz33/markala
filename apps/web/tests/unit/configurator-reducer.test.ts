import { describe, it, expect } from "vitest";
import type { Product } from "@markala/types";
import {
  configuratorReducer,
  initState,
  type ConfiguratorState,
} from "@/components/product/configurator-fields/reducer";
import type { DimensionValue } from "@/lib/configurator";

/**
 * Configurator reducer — saf state machine.
 * Tüm transition'ları tek noktadan test ediyoruz; component layer'a güvenmek yerine
 * iş mantığını bu reducer'da kilitliyoruz (ekran kaybolabilir, kurallar kalır).
 */

const buildMockProduct = (): Product => ({
  slug: "test-product",
  name: "Test Ürün",
  categorySlug: "test",
  shortDescription: "test",
  description: "test",
  basePrice: 100,
  productionTime: "2 gün",
  images: ["/test.jpg"],
  parameters: [
    {
      id: "kaplama",
      label: "Kaplama",
      kind: "radio",
      required: true,
      defaultOptionId: "lak-mat",
      options: [
        { id: "lak-mat", label: "Lak Mat", priceModifier: 0 },
        { id: "lak-parlak", label: "Lak Parlak", priceModifier: 50 },
      ],
    },
    {
      id: "ekler",
      label: "Ek özellikler",
      kind: "checkbox-group",
      required: false,
      options: [
        { id: "yuvarlak-kose", label: "Yuvarlak Köşe", priceModifier: 25 },
        { id: "uv-lak", label: "UV Lak", priceModifier: 40 },
        { id: "gold-folyo", label: "Gold Folyo", priceModifier: 80 },
      ],
    },
    {
      id: "adet",
      label: "Adet",
      kind: "quantity",
      required: true,
      quantityPresets: [100, 500, 1000],
      unitPrice: 0.5,
    },
    {
      id: "ebat",
      label: "Ebat",
      kind: "dimension",
      required: true,
      pricePerSqm: 300,
      defaultWidth: 100,
      defaultHeight: 50,
      extras: [
        { id: "kolon-dikis", label: "Kolon Dikiş", perimeterPricePerM: 15 },
      ],
    },
  ],
});

describe("configuratorReducer", () => {
  const mockProduct = buildMockProduct();
  const initial: ConfiguratorState = initState(mockProduct);

  it("initState defaults — radio defaultOptionId, checkbox [], dimension {w,h,extras:[]}", () => {
    expect(initial.selections.kaplama).toBe("lak-mat");
    expect(initial.selections.ekler).toEqual([]);
    expect(initial.selections.adet).toBe(100); // ilk preset
    expect(initial.selections.ebat).toEqual({ width: 100, height: 50, extras: [] });
    expect(initial.quantity).toBe(1);
    expect(initial.uploadedFile).toBeNull();
    expect(initial.uploadedFileName).toBeUndefined();
    expect(initial.needsDesign).toBe(false);
    expect(initial.justAdded).toBe(false);
  });

  it("SELECT_PARAMETER radio seçimini günceller", () => {
    const next = configuratorReducer(initial, {
      type: "SELECT_PARAMETER",
      paramId: "kaplama",
      value: "lak-parlak",
    });
    expect(next.selections.kaplama).toBe("lak-parlak");
    // Diğer alanlar değişmemeli
    expect(next.selections.adet).toBe(initial.selections.adet);
  });

  it("TOGGLE_CHECKBOX boş listeye optionId ekler", () => {
    const next = configuratorReducer(initial, {
      type: "TOGGLE_CHECKBOX",
      paramId: "ekler",
      optionId: "yuvarlak-kose",
    });
    expect(next.selections.ekler).toEqual(["yuvarlak-kose"]);
  });

  it("TOGGLE_CHECKBOX zaten seçili optionId'yi kaldırır (toggle)", () => {
    const withOne = configuratorReducer(initial, {
      type: "TOGGLE_CHECKBOX",
      paramId: "ekler",
      optionId: "yuvarlak-kose",
    });
    const withoutOne = configuratorReducer(withOne, {
      type: "TOGGLE_CHECKBOX",
      paramId: "ekler",
      optionId: "yuvarlak-kose",
    });
    expect(withoutOne.selections.ekler).toEqual([]);
  });

  it("TOGGLE_CHECKBOX birden fazla optionId'yi yan yana tutar", () => {
    let s = initial;
    s = configuratorReducer(s, { type: "TOGGLE_CHECKBOX", paramId: "ekler", optionId: "uv-lak" });
    s = configuratorReducer(s, { type: "TOGGLE_CHECKBOX", paramId: "ekler", optionId: "gold-folyo" });
    expect(s.selections.ekler).toEqual(["uv-lak", "gold-folyo"]);
  });

  it("SET_DIMENSION değeri (en/boy/extras) günceller", () => {
    const dim: DimensionValue = { width: 200, height: 150, extras: ["kolon-dikis"] };
    const next = configuratorReducer(initial, {
      type: "SET_DIMENSION",
      paramId: "ebat",
      value: dim,
    });
    expect(next.selections.ebat).toEqual(dim);
  });

  it("SET_QUANTITY hem selections[paramId] hem de quantity alanını günceller", () => {
    const next = configuratorReducer(initial, {
      type: "SET_QUANTITY",
      paramId: "adet",
      value: 500,
    });
    expect(next.selections.adet).toBe(500);
    expect(next.quantity).toBe(500);
  });

  it("SET_QUANTITY 0 veya negatif değeri 1'e clamp eder", () => {
    const zero = configuratorReducer(initial, {
      type: "SET_QUANTITY",
      paramId: "adet",
      value: 0,
    });
    expect(zero.quantity).toBe(1);
    expect(zero.selections.adet).toBe(1);

    const neg = configuratorReducer(initial, {
      type: "SET_QUANTITY",
      paramId: "adet",
      value: -5,
    });
    expect(neg.quantity).toBe(1);
  });

  it("UPLOAD_FILE dosyayı ve dosya adını state'e işler", () => {
    const file = new File(["mock-bytes"], "tasarim.pdf", { type: "application/pdf" });
    const next = configuratorReducer(initial, { type: "UPLOAD_FILE", file });
    expect(next.uploadedFile).toBe(file);
    expect(next.uploadedFileName).toBe("tasarim.pdf");
  });

  it("UPLOAD_FILE null geçince file ve fileName temizlenir", () => {
    const file = new File(["x"], "a.pdf", { type: "application/pdf" });
    const withFile = configuratorReducer(initial, { type: "UPLOAD_FILE", file });
    const cleared = configuratorReducer(withFile, { type: "UPLOAD_FILE", file: null });
    expect(cleared.uploadedFile).toBeNull();
    expect(cleared.uploadedFileName).toBeUndefined();
  });

  it("TOGGLE_DESIGN_HELP false → true → false flip eder", () => {
    const on = configuratorReducer(initial, { type: "TOGGLE_DESIGN_HELP" });
    expect(on.needsDesign).toBe(true);
    const off = configuratorReducer(on, { type: "TOGGLE_DESIGN_HELP" });
    expect(off.needsDesign).toBe(false);
  });

  it("SET_DESIGN_HELP explicit değeri set eder", () => {
    const on = configuratorReducer(initial, { type: "SET_DESIGN_HELP", value: true });
    expect(on.needsDesign).toBe(true);
    // Tekrar true gönderince hâlâ true (toggle değil)
    const stillOn = configuratorReducer(on, { type: "SET_DESIGN_HELP", value: true });
    expect(stillOn.needsDesign).toBe(true);
  });

  it("MARK_ADDED justAdded bayrağını set/clear eder", () => {
    const added = configuratorReducer(initial, { type: "MARK_ADDED", value: true });
    expect(added.justAdded).toBe(true);
    const cleared = configuratorReducer(added, { type: "MARK_ADDED", value: false });
    expect(cleared.justAdded).toBe(false);
  });

  it("RESET tüm state'i initial'a döndürür", () => {
    let s: ConfiguratorState = initial;
    s = configuratorReducer(s, { type: "SET_QUANTITY", paramId: "adet", value: 1000 });
    s = configuratorReducer(s, { type: "MARK_ADDED", value: true });
    s = configuratorReducer(s, { type: "SET_DESIGN_HELP", value: true });
    s = configuratorReducer(s, { type: "TOGGLE_CHECKBOX", paramId: "ekler", optionId: "uv-lak" });

    const reset = configuratorReducer(s, { type: "RESET", product: mockProduct });
    expect(reset.quantity).toBe(1);
    expect(reset.justAdded).toBe(false);
    expect(reset.needsDesign).toBe(false);
    expect(reset.selections.ekler).toEqual([]);
    expect(reset.selections.kaplama).toBe("lak-mat");
  });

  it("reducer saf — yeni state objesi döner, eski state mutate olmaz", () => {
    const state1 = initial;
    const state2 = configuratorReducer(state1, {
      type: "SET_QUANTITY",
      paramId: "adet",
      value: 500,
    });
    // Referans eşit olmamalı (immutable update)
    expect(state1).not.toBe(state2);
    // Orijinal state hâlâ ilk halinde
    expect(state1.quantity).toBe(1);
    expect(state1.selections.adet).toBe(100);
    // Yeni state güncel
    expect(state2.quantity).toBe(500);
  });

  it("reducer selections nested object'ini de immutable update eder", () => {
    const state2 = configuratorReducer(initial, {
      type: "SELECT_PARAMETER",
      paramId: "kaplama",
      value: "lak-parlak",
    });
    expect(state2.selections).not.toBe(initial.selections);
    expect(initial.selections.kaplama).toBe("lak-mat"); // dokunulmadı
  });

  it("bilinmeyen action type state'i değiştirmeden döner (default case)", () => {
    // @ts-expect-error — unknown action tipi
    const next = configuratorReducer(initial, { type: "UNKNOWN_ACTION_XYZ" });
    expect(next).toBe(initial);
  });

  it("ardışık SELECT_PARAMETER'lar son seçimi yansıtır", () => {
    let s: ConfiguratorState = initial;
    s = configuratorReducer(s, {
      type: "SELECT_PARAMETER",
      paramId: "kaplama",
      value: "lak-parlak",
    });
    s = configuratorReducer(s, {
      type: "SELECT_PARAMETER",
      paramId: "kaplama",
      value: "lak-mat",
    });
    expect(s.selections.kaplama).toBe("lak-mat");
  });

  it("birden fazla parametreyi bağımsız günceller — cross-contamination yok", () => {
    let s: ConfiguratorState = initial;
    s = configuratorReducer(s, {
      type: "SELECT_PARAMETER",
      paramId: "kaplama",
      value: "lak-parlak",
    });
    s = configuratorReducer(s, {
      type: "SET_QUANTITY",
      paramId: "adet",
      value: 1000,
    });
    s = configuratorReducer(s, {
      type: "TOGGLE_CHECKBOX",
      paramId: "ekler",
      optionId: "uv-lak",
    });
    expect(s.selections.kaplama).toBe("lak-parlak");
    expect(s.selections.adet).toBe(1000);
    expect(s.quantity).toBe(1000);
    expect(s.selections.ekler).toEqual(["uv-lak"]);
  });
});
