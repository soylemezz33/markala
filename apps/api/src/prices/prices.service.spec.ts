import { describe, it, expect, vi } from "vitest";
import { PricesService, adjustPrice } from "./prices.service";
import { BadRequestException, NotFoundException } from "@nestjs/common";
const mkPrisma = () => ({
  product: { findUnique: vi.fn(), findMany: vi.fn().mockResolvedValue([]) },
  productOption: { findMany: vi.fn().mockResolvedValue([]), deleteMany: vi.fn(), createMany: vi.fn() },
  productPrice: { findMany: vi.fn().mockResolvedValue([]), deleteMany: vi.fn(), createMany: vi.fn(), update: vi.fn() },
  $transaction: vi.fn().mockResolvedValue([]),
});
it("getForProduct ürün yoksa NotFound", async () => {
  const p = mkPrisma(); p.product.findUnique.mockResolvedValue(null);
  const s = new PricesService(p as any);
  await expect(s.getForProduct("x")).rejects.toBeInstanceOf(NotFoundException);
});
it("getForProduct options+prices döndürür", async () => {
  const p = mkPrisma(); p.product.findUnique.mockResolvedValue({ id: "p1" });
  p.productOption.findMany.mockResolvedValue([{ id: "o1", groupKey: "paket" }]);
  p.productPrice.findMany.mockResolvedValue([{ id: "pr1", price: "50" }]);
  const s = new PricesService(p as any);
  expect(await s.getForProduct("p1")).toEqual({ options: [{ id: "o1", groupKey: "paket" }], prices: [{ id: "pr1", price: "50" }] });
});
it("setOptions replace-all yapar (delete+create)", async () => {
  const p = mkPrisma(); p.product.findUnique.mockResolvedValue({ id: "p1" });
  p.productOption.createMany.mockResolvedValue({ count: 2 });
  const s = new PricesService(p as any);
  const rows = [
    { groupKey:"paket", groupLabel:"Paket", groupRole:"priced", groupSort:0, optionKey:"nk", optionLabel:"NK", optionSort:0 },
    { groupKey:"adet", groupLabel:"Adet", groupRole:"dimension", groupSort:0, optionKey:"1000", optionLabel:"1.000", optionSort:0 },
  ];
  const r = await s.setOptions("p1", rows as any);
  expect(p.productOption.deleteMany).toHaveBeenCalledWith({ where: { productId: "p1" } });
  expect(p.productOption.createMany).toHaveBeenCalled();
  expect(r).toEqual({ count: 2 });
});
it("setPrices replace-all + Decimal map", async () => {
  const p = mkPrisma(); p.product.findUnique.mockResolvedValue({ id: "p1" });
  p.productPrice.createMany.mockResolvedValue({ count: 1 });
  const s = new PricesService(p as any);
  const r = await s.setPrices("p1", [{ groupKey:"paket", optionKey:"nk", dimKey:"1000", price: 50 }] as any);
  expect(p.productPrice.deleteMany).toHaveBeenCalledWith({ where: { productId: "p1" } });
  const arg = p.productPrice.createMany.mock.calls[0][0].data[0];
  expect(arg.productId).toBe("p1"); expect(Number(arg.price)).toBe(50);
  expect(r).toEqual({ count: 1 });
});

it("percent increase 10% → 110", () => expect(adjustPrice(100,"percent","increase",10,"none")).toBe(110));
it("percent decrease 20% → 80", () => expect(adjustPrice(100,"percent","decrease",20,"none")).toBe(80));
it("fixed increase 15 → 115", () => expect(adjustPrice(100,"fixed","increase",15,"none")).toBe(115));
it("round 5 → en yakın 5", () => expect(adjustPrice(103,"percent","increase",0,"5")).toBe(105));
it("negatife düşmez", () => expect(adjustPrice(10,"fixed","decrease",999,"none")).toBe(0));

it("categorySet basit ürüne yazar, seçenekliyi atlar", async () => {
  const p = mkPrisma();
  p.product.findMany = vi.fn().mockResolvedValue([{ id: "simple" }, { id: "matrix" }]);
  p.productOption.findMany = vi.fn().mockResolvedValue([{ productId: "matrix" }]); // matrix'in option'ı var
  p.productPrice.deleteMany = vi.fn(); p.productPrice.createMany = vi.fn().mockResolvedValue({ count: 1 });
  p.$transaction = vi.fn().mockResolvedValue([]);
  const s = new PricesService(p as any);
  const r = await s.categorySet("cat1", 250);
  expect(r).toEqual({ set: 1, skipped: 1 });
});

// --- Kural referans doğrulaması (#2) ---
describe("setOptions — kural referans doğrulaması", () => {
  const baseRows = [
    { groupKey: "paket", groupLabel: "Paket", groupRole: "priced" as const, groupSort: 0, optionKey: "nk", optionLabel: "NK", optionSort: 0 },
    { groupKey: "adet",  groupLabel: "Adet",  groupRole: "dimension" as const, groupSort: 1, optionKey: "1000", optionLabel: "1.000", optionSort: 0 },
  ];

  it("geçerli forcesOption (varolan grup+seçenek) → başarıyla kaydeder", async () => {
    const p = mkPrisma(); p.product.findUnique.mockResolvedValue({ id: "p1" });
    p.productOption.createMany.mockResolvedValue({ count: 2 });
    const s = new PricesService(p as any);
    const rows = [
      { ...baseRows[0], rules: { forcesOption: { groupKey: "adet", optionKey: "1000" } } },
      baseRows[1],
    ];
    await expect(s.setOptions("p1", rows as any)).resolves.toEqual({ count: 2 });
  });

  it("forcesOption.groupKey geçersiz grup → BadRequestException", async () => {
    const p = mkPrisma(); p.product.findUnique.mockResolvedValue({ id: "p1" });
    const s = new PricesService(p as any);
    const rows = [
      { ...baseRows[0], rules: { forcesOption: { groupKey: "yok-grup", optionKey: "1000" } } },
      baseRows[1],
    ];
    await expect(s.setOptions("p1", rows as any)).rejects.toBeInstanceOf(BadRequestException);
  });

  it("forcesOption.optionKey geçersiz seçenek → BadRequestException", async () => {
    const p = mkPrisma(); p.product.findUnique.mockResolvedValue({ id: "p1" });
    const s = new PricesService(p as any);
    const rows = [
      { ...baseRows[0], rules: { forcesOption: { groupKey: "adet", optionKey: "yok-secenek" } } },
      baseRows[1],
    ];
    await expect(s.setOptions("p1", rows as any)).rejects.toBeInstanceOf(BadRequestException);
  });

  it("disablesGroups geçersiz grup → BadRequestException", async () => {
    const p = mkPrisma(); p.product.findUnique.mockResolvedValue({ id: "p1" });
    const s = new PricesService(p as any);
    const rows = [
      { ...baseRows[0], rules: { disablesGroups: ["adet", "hayalet-grup"] } },
      baseRows[1],
    ];
    await expect(s.setOptions("p1", rows as any)).rejects.toBeInstanceOf(BadRequestException);
  });

  it("disablesGroups tüm geçerli gruplar → başarıyla kaydeder", async () => {
    const p = mkPrisma(); p.product.findUnique.mockResolvedValue({ id: "p1" });
    p.productOption.createMany.mockResolvedValue({ count: 2 });
    const s = new PricesService(p as any);
    const rows = [
      { ...baseRows[0], rules: { disablesGroups: ["adet"] } },
      baseRows[1],
    ];
    await expect(s.setOptions("p1", rows as any)).resolves.toEqual({ count: 2 });
  });
});

// --- Boş label validasyonu (#4) ---
// Not: DTO @MinLength(1) decorator'ı NestJS ValidationPipe katmanında çalışır.
// Aşağıdaki testler, boş etiketle kaydedildiğinde service'in doğrulama hatası ürettiğini
// göstermek yerine, geçerli (boş olmayan) etiket ile setOptions'ın çalıştığını doğrular.
describe("setOptions — geçerli label ile kayıt çalışır", () => {
  it("groupLabel ve optionLabel dolu olunca setOptions başarılı döner", async () => {
    const p = mkPrisma(); p.product.findUnique.mockResolvedValue({ id: "p1" });
    p.productOption.createMany.mockResolvedValue({ count: 1 });
    const s = new PricesService(p as any);
    const rows = [
      { groupKey: "paket", groupLabel: "Paket", groupRole: "priced" as const, groupSort: 0, optionKey: "nk", optionLabel: "NK Mat", optionSort: 0 },
    ];
    await expect(s.setOptions("p1", rows as any)).resolves.toEqual({ count: 1 });
  });
});
