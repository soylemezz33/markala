import { describe, expect, it } from "vitest";
import { resolveMargin, priceFromCost, actualMargin, MIN_MARGIN, MAX_MARGIN } from "./margin";

describe("resolveMargin — öncelik: ürün → kategori → global", () => {
  it("ürün marjı varsa o kazanır", () => {
    expect(resolveMargin({ product: 2.1, category: 1.8, global: 1.2 })).toEqual({ margin: 2.1, source: "product" });
  });
  it("ürün yoksa kategori", () => {
    expect(resolveMargin({ product: null, category: 1.8, global: 1.2 })).toEqual({ margin: 1.8, source: "category" });
  });
  it("ürün+kategori yoksa global", () => {
    expect(resolveMargin({ global: 1.2 })).toEqual({ margin: 1.2, source: "global" });
  });
  it("hiçbiri yoksa güvenli varsayılan", () => {
    expect(resolveMargin({})).toEqual({ margin: 1.8, source: "default" });
  });
  it("SINIR DIŞI değer YOK SAYILIR — 1.8 yerine 18 yazılırsa katalog mahvolmasın", () => {
    expect(resolveMargin({ product: 45, category: 1.9 })).toEqual({ margin: 1.9, source: "category" });
    expect(resolveMargin({ product: 0.4, global: 1.2 })).toEqual({ margin: 1.2, source: "global" });
  });
  it("string gelen değer (Prisma Decimal) sayıya çevrilir", () => {
    expect(resolveMargin({ product: "2.5" as unknown as number })).toEqual({ margin: 2.5, source: "product" });
  });
  it("sınırlar dahil kabul edilir", () => {
    expect(resolveMargin({ product: MIN_MARGIN }).source).toBe("product");
    expect(resolveMargin({ product: MAX_MARGIN }).source).toBe("product");
  });
});

describe("priceFromCost", () => {
  it("maliyet × marj, 2 ondalık", () => {
    expect(priceFromCost(750, 1.8)).toBe(1350);
    expect(priceFromCost(220, 1.85)).toBe(407);
  });
  it("maliyet yok/sıfır → null (fiyat UYDURULMAZ)", () => {
    expect(priceFromCost(0, 1.8)).toBeNull();
    expect(priceFromCost(null, 1.8)).toBeNull();
    expect(priceFromCost(undefined, 1.8)).toBeNull();
  });
});

describe("actualMargin — mevcut fiyattan gerçekleşen marj", () => {
  it("fiyat/maliyet oranı", () => {
    expect(actualMargin(750, 1350)).toBe(1.8);
    expect(actualMargin(240, 480)).toBe(2);
  });
  it("maliyet yoksa null", () => {
    expect(actualMargin(0, 500)).toBeNull();
    expect(actualMargin(null, 500)).toBeNull();
  });
});
