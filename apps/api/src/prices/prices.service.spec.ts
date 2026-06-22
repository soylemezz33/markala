import { describe, it, expect, vi } from "vitest";
import { PricesService } from "./prices.service";
import { NotFoundException } from "@nestjs/common";
const mkPrisma = () => ({
  product: { findUnique: vi.fn() },
  productOption: { findMany: vi.fn().mockResolvedValue([]), deleteMany: vi.fn(), createMany: vi.fn() },
  productPrice: { findMany: vi.fn().mockResolvedValue([]), deleteMany: vi.fn(), createMany: vi.fn() },
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
