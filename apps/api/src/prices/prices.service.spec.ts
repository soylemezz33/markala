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
