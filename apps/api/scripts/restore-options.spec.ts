import { describe, it, expect, vi, beforeEach } from "vitest";
import { convertParametersToOptions, restoreOptionsForProducts, type OptionRow } from "./restore-options";

// ──────────────────────────────────────────────
// TEST VERİLERİ
// ──────────────────────────────────────────────

const matrixParam = {
  id: "baski",
  label: "Baskı Paketi",
  kind: "matrix",
  required: true,
  rows: [
    { id: "a4", label: "A4", sublabel: "21×30 cm", group: "EKO" },
    { id: "a5", label: "A5", sublabel: "15×21 cm", group: "LAK" },
  ],
  cols: [
    { id: "100", label: "100 Adet" },
    { id: "250", label: "250 Adet" },
  ],
  cells: [
    { id: "a4-100", rowId: "a4", colId: "100", price: 150 },
    { id: "a4-250", rowId: "a4", colId: "250", price: 300 },
    { id: "a5-100", rowId: "a5", colId: "100", price: 120 },
    { id: "a5-250", rowId: "a5", colId: "250", price: 240 },
  ],
};

const radioEbatParam = {
  id: "ebat",
  label: "Ebat",
  kind: "radio",
  required: true,
  options: [
    { id: "kucuk", label: "Küçük", priceModifier: 0 },
    { id: "orta",  label: "Orta",  priceModifier: 50 },
    { id: "buyuk", label: "Büyük", priceModifier: 100, sublabel: "A3" },
  ],
};

const radioMalzemeParam = {
  id: "malzeme",
  label: "Malzeme / Zemin",
  kind: "radio",
  required: true,
  options: [
    { id: "kuşe",   label: "Kuşe Kağıt",  priceModifier: 0 },
    { id: "selefon",label: "Selefon Mat",  priceModifier: 20 },
  ],
};

const quantityPresetParam = {
  id: "adet",
  label: "Adet",
  kind: "quantity",
  required: true,
  quantityPresets: [100, 250, 500],
};

const quantityNoPresetParam = {
  id: "miktar",
  label: "Miktar",
  kind: "quantity",
  required: true,
};

const dimensionParam = {
  id: "boyut",
  label: "Boyut",
  kind: "dimension",
  required: true,
  pricePerSqm: 80,
};

const checkboxParam = {
  id: "katlamaSekli",
  label: "Katlama Şekli",
  kind: "checkbox-group",
  required: false,
  options: [
    { id: "iki", label: "İki Kat",   priceModifier: 0 },
    { id: "uc",  label: "Üç Kat",    priceModifier: 10 },
  ],
};

// ──────────────────────────────────────────────
// 1. MATRİS TESTLER
// ──────────────────────────────────────────────

describe("convertParametersToOptions — matrix", () => {
  it("matrix → iki grup üretmeli: priced 'paket' + dimension 'adet'", () => {
    const rows = convertParametersToOptions([matrixParam]);
    const groups = [...new Set(rows.map((r) => r.groupKey))];
    expect(groups).toContain("paket");
    expect(groups).toContain("adet");
    expect(groups).toHaveLength(2);
  });

  it("'paket' grubu groupRole='priced' olmalı", () => {
    const rows = convertParametersToOptions([matrixParam]);
    const paket = rows.filter((r) => r.groupKey === "paket");
    expect(paket.every((r) => r.groupRole === "priced")).toBe(true);
  });

  it("'adet' grubu groupRole='dimension' olmalı", () => {
    const rows = convertParametersToOptions([matrixParam]);
    const adet = rows.filter((r) => r.groupKey === "adet");
    expect(adet.every((r) => r.groupRole === "dimension")).toBe(true);
  });

  it("'paket' satır sayısı rows.length kadar olmalı", () => {
    const rows = convertParametersToOptions([matrixParam]);
    const paket = rows.filter((r) => r.groupKey === "paket");
    expect(paket).toHaveLength(matrixParam.rows.length);
  });

  it("'adet' satır sayısı cols.length kadar olmalı", () => {
    const rows = convertParametersToOptions([matrixParam]);
    const adet = rows.filter((r) => r.groupKey === "adet");
    expect(adet).toHaveLength(matrixParam.cols.length);
  });

  it("paket optionKey'leri rows[i].id olmalı", () => {
    const rows = convertParametersToOptions([matrixParam]);
    const paket = rows.filter((r) => r.groupKey === "paket");
    expect(paket.map((r) => r.optionKey)).toEqual(
      matrixParam.rows.map((row) => row.id),
    );
  });

  it("adet optionKey'leri cols[i].id olmalı", () => {
    const rows = convertParametersToOptions([matrixParam]);
    const adet = rows.filter((r) => r.groupKey === "adet");
    expect(adet.map((r) => r.optionKey)).toEqual(
      matrixParam.cols.map((col) => col.id),
    );
  });

  it("paket optionSublabel rows[i].sublabel'dan gelmeli", () => {
    const rows = convertParametersToOptions([matrixParam]);
    const paket = rows.filter((r) => r.groupKey === "paket");
    expect(paket[0].optionSublabel).toBe("21×30 cm");
  });

  it("FİYAT ALANI OLMAMALI — OptionRow'da price/priceModifier/amount yok", () => {
    const rows = convertParametersToOptions([matrixParam]);
    for (const row of rows) {
      expect(row).not.toHaveProperty("price");
      expect(row).not.toHaveProperty("priceModifier");
      expect(row).not.toHaveProperty("amount");
      expect(row).not.toHaveProperty("unitPrice");
    }
  });

  it("groupSort matrix parametresinin dizideki index'i (0) olmalı", () => {
    const rows = convertParametersToOptions([matrixParam]);
    expect(rows.every((r) => r.groupSort === 0)).toBe(true);
  });

  it("optionSort kendi dizisindeki index olmalı", () => {
    const rows = convertParametersToOptions([matrixParam]);
    const paket = rows.filter((r) => r.groupKey === "paket");
    expect(paket[0].optionSort).toBe(0);
    expect(paket[1].optionSort).toBe(1);
  });

  it("groupLabel — paket için param.label kullanılmalı, adet için 'Adet' sabit", () => {
    const rows = convertParametersToOptions([matrixParam]);
    const paketRow = rows.find((r) => r.groupKey === "paket")!;
    const adetRow  = rows.find((r) => r.groupKey === "adet")!;
    expect(paketRow.groupLabel).toBe("Baskı Paketi");
    expect(adetRow.groupLabel).toBe("Adet");
  });
});

// ──────────────────────────────────────────────
// 2. RADIO TESTLER
// ──────────────────────────────────────────────

describe("convertParametersToOptions — radio", () => {
  it("'Ebat' radio → groupRole='dimension'", () => {
    const rows = convertParametersToOptions([radioEbatParam]);
    expect(rows.every((r) => r.groupRole === "dimension")).toBe(true);
  });

  it("'Malzeme / Zemin' radio → groupRole='priced'", () => {
    const rows = convertParametersToOptions([radioMalzemeParam]);
    expect(rows.every((r) => r.groupRole === "priced")).toBe(true);
  });

  it("radio groupKey = param.id", () => {
    const rows = convertParametersToOptions([radioEbatParam]);
    expect(rows[0].groupKey).toBe("ebat");
  });

  it("radio groupLabel = param.label", () => {
    const rows = convertParametersToOptions([radioEbatParam]);
    expect(rows[0].groupLabel).toBe("Ebat");
  });

  it("radio option sayısı = param.options.length", () => {
    const rows = convertParametersToOptions([radioEbatParam]);
    expect(rows).toHaveLength(radioEbatParam.options.length);
  });

  it("radio optionKey = opt.id", () => {
    const rows = convertParametersToOptions([radioEbatParam]);
    expect(rows.map((r) => r.optionKey)).toEqual(
      radioEbatParam.options.map((o) => o.id),
    );
  });

  it("radio optionSublabel aktarılmalı (varsa)", () => {
    const rows = convertParametersToOptions([radioEbatParam]);
    const buyuk = rows.find((r) => r.optionKey === "buyuk")!;
    expect(buyuk.optionSublabel).toBe("A3");
  });

  it("radio optionSublabel undefined olabilir (yoksa)", () => {
    const rows = convertParametersToOptions([radioEbatParam]);
    const kucuk = rows.find((r) => r.optionKey === "kucuk")!;
    expect(kucuk.optionSublabel).toBeUndefined();
  });

  it("FİYAT ALANI OLMAMALI", () => {
    const rows = convertParametersToOptions([radioEbatParam]);
    for (const row of rows) {
      expect(row).not.toHaveProperty("price");
      expect(row).not.toHaveProperty("priceModifier");
    }
  });
});

// ──────────────────────────────────────────────
// 3. CHECKBOX-GROUP TESTLER
// ──────────────────────────────────────────────

describe("convertParametersToOptions — checkbox-group", () => {
  it("checkbox-group → groupRole='priced'", () => {
    const rows = convertParametersToOptions([checkboxParam]);
    expect(rows.every((r) => r.groupRole === "priced")).toBe(true);
  });

  it("checkbox-group option sayısı doğru", () => {
    const rows = convertParametersToOptions([checkboxParam]);
    expect(rows).toHaveLength(checkboxParam.options.length);
  });
});

// ──────────────────────────────────────────────
// 4. QUANTITY TESTLER
// ──────────────────────────────────────────────

describe("convertParametersToOptions — quantity", () => {
  it("quantity → groupKey='adet', groupRole='dimension'", () => {
    const rows = convertParametersToOptions([quantityPresetParam]);
    expect(rows.every((r) => r.groupKey === "adet")).toBe(true);
    expect(rows.every((r) => r.groupRole === "dimension")).toBe(true);
  });

  it("quantityPresets varsa her preset bir option üretmeli", () => {
    const rows = convertParametersToOptions([quantityPresetParam]);
    expect(rows).toHaveLength(3);
    expect(rows.map((r) => r.optionKey)).toEqual(["100", "250", "500"]);
  });

  it("optionLabel '${preset} Adet' formatında olmalı", () => {
    const rows = convertParametersToOptions([quantityPresetParam]);
    expect(rows[0].optionLabel).toBe("100 Adet");
    expect(rows[2].optionLabel).toBe("500 Adet");
  });

  it("quantityPresets yoksa tek 'custom' option üretmeli", () => {
    const rows = convertParametersToOptions([quantityNoPresetParam]);
    expect(rows).toHaveLength(1);
    expect(rows[0].optionKey).toBe("custom");
  });

  it("quantity groupLabel = param.label", () => {
    const rows = convertParametersToOptions([quantityPresetParam]);
    expect(rows[0].groupLabel).toBe("Adet");
  });
});

// ──────────────────────────────────────────────
// 5. DIMENSION TESTLER
// ──────────────────────────────────────────────

describe("convertParametersToOptions — dimension", () => {
  it("dimension → groupKey='ebat', groupRole='dimension'", () => {
    const rows = convertParametersToOptions([dimensionParam]);
    expect(rows[0].groupKey).toBe("ebat");
    expect(rows[0].groupRole).toBe("dimension");
  });

  it("dimension → tek option optionKey='custom'", () => {
    const rows = convertParametersToOptions([dimensionParam]);
    expect(rows).toHaveLength(1);
    expect(rows[0].optionKey).toBe("custom");
    expect(rows[0].optionLabel).toBe("Özel ebat");
  });

  it("FİYAT ALANI OLMAMALI", () => {
    const rows = convertParametersToOptions([dimensionParam]);
    expect(rows[0]).not.toHaveProperty("pricePerSqm");
    expect(rows[0]).not.toHaveProperty("price");
  });
});

// ──────────────────────────────────────────────
// 6. EDGE CASE TESTLER
// ──────────────────────────────────────────────

describe("convertParametersToOptions — edge cases", () => {
  it("boş dizi → boş sonuç döner, çökmez", () => {
    expect(() => convertParametersToOptions([])).not.toThrow();
    expect(convertParametersToOptions([])).toEqual([]);
  });

  it("bilinmeyen kind → boş sonuç, çökmez", () => {
    const unknown = { id: "x", label: "X", kind: "unknown-kind", required: false };
    expect(() => convertParametersToOptions([unknown])).not.toThrow();
    expect(convertParametersToOptions([unknown])).toEqual([]);
  });

  it("null/undefined elemanlar → çökmez", () => {
    expect(() => convertParametersToOptions([null, undefined])).not.toThrow();
  });

  it("birden fazla parametre → groupSort index'e göre doğru", () => {
    const rows = convertParametersToOptions([radioEbatParam, radioMalzemeParam]);
    const ebatRows    = rows.filter((r) => r.groupKey === "ebat");
    const malzemeRows = rows.filter((r) => r.groupKey === "malzeme");
    expect(ebatRows.every((r)    => r.groupSort === 0)).toBe(true);
    expect(malzemeRows.every((r) => r.groupSort === 1)).toBe(true);
  });
});

// ──────────────────────────────────────────────
// 7. DIMENSION KEYWORD EŞLEŞMESİ (regex)
// ──────────────────────────────────────────────

describe("convertParametersToOptions — radio dimension keyword detection", () => {
  it("'boyut' içeren radio → groupRole='dimension'", () => {
    const param = { id: "boyut", label: "Boyut Seçimi", kind: "radio", required: true, options: [{ id: "k", label: "Küçük" }] };
    const rows = convertParametersToOptions([param]);
    expect(rows[0].groupRole).toBe("dimension");
  });

  it("'adet' içeren radio id → groupRole='dimension'", () => {
    const param = { id: "adet", label: "Miktar", kind: "radio", required: true, options: [{ id: "k", label: "100" }] };
    const rows = convertParametersToOptions([param]);
    expect(rows[0].groupRole).toBe("dimension");
  });
});

// ──────────────────────────────────────────────
// 8. restoreOptionsForProducts TESTLER
// ──────────────────────────────────────────────

describe("restoreOptionsForProducts", () => {
  const makePrismaMock = () => ({
    productOption: {
      deleteMany: vi.fn().mockResolvedValue({ count: 0 }),
      createMany:  vi.fn().mockResolvedValue({ count: 3 }),
    },
  });

  it("her ürün için deleteMany + createMany çağrılmalı", async () => {
    const prismaMock = makePrismaMock();
    const items = [
      { productId: "prod-1", parameters: [radioEbatParam] },
      { productId: "prod-2", parameters: [quantityPresetParam] },
    ];
    await restoreOptionsForProducts(prismaMock as any, items);
    expect(prismaMock.productOption.deleteMany).toHaveBeenCalledTimes(2);
    expect(prismaMock.productOption.createMany).toHaveBeenCalledTimes(2);
  });

  it("deleteMany productId ile filtreli çağrılmalı", async () => {
    const prismaMock = makePrismaMock();
    await restoreOptionsForProducts(prismaMock as any, [
      { productId: "prod-abc", parameters: [radioEbatParam] },
    ]);
    expect(prismaMock.productOption.deleteMany).toHaveBeenCalledWith({
      where: { productId: "prod-abc" },
    });
  });

  it("createMany data'sı productId + option alanları içermeli", async () => {
    const prismaMock = makePrismaMock();
    await restoreOptionsForProducts(prismaMock as any, [
      { productId: "prod-xyz", parameters: [radioEbatParam] },
    ]);
    const callArg = prismaMock.productOption.createMany.mock.calls[0][0];
    expect(callArg.data).toBeDefined();
    expect(callArg.data.length).toBe(radioEbatParam.options.length);
    expect(callArg.data[0]).toMatchObject({
      productId: "prod-xyz",
      groupKey: "ebat",
    });
  });

  it("dönen istatistik products = item sayısı, options = toplam insert sayısı", async () => {
    const prismaMock = {
      productOption: {
        deleteMany: vi.fn().mockResolvedValue({ count: 0 }),
        createMany:  vi.fn().mockResolvedValue({ count: 3 }),
      },
    };
    const result = await restoreOptionsForProducts(prismaMock as any, [
      { productId: "p1", parameters: [radioEbatParam] },
      { productId: "p2", parameters: [quantityPresetParam] },
    ]);
    expect(result.products).toBe(2);
    // createMany mock'u her seferinde count:3 döndürüyor → 2×3=6
    expect(result.options).toBe(6);
  });

  it("boş items → products:0, options:0", async () => {
    const prismaMock = makePrismaMock();
    const result = await restoreOptionsForProducts(prismaMock as any, []);
    expect(result).toEqual({ products: 0, options: 0 });
  });
});
