import { describe, it, expect, vi } from "vitest";
import { NotFoundException } from "@nestjs/common";
import { ProductsService } from "./products.service";

function makePrisma() {
  return {
    productPrice: {
      groupBy: vi.fn().mockResolvedValue([]),
    },
    product: {
      findMany: vi.fn().mockResolvedValue([
        { id: "p1", slug: "kartvizit", name: "Kartvizit", basePrice: "290", isActive: true, category: { slug: "kartvizit" } },
        { id: "p2", slug: "etiket", name: "Etiket", basePrice: "150", isActive: true, category: { slug: "etiket" } },
      ]),
      findUnique: vi.fn().mockResolvedValue({
        id: "p1", slug: "kartvizit", name: "Kartvizit", basePrice: "290", isActive: true, category: { slug: "kartvizit" },
      }),
      create: vi.fn().mockImplementation(({ data }) =>
        Promise.resolve({ id: "new-p", ...data }),
      ),
      update: vi.fn().mockImplementation(({ where, data }) =>
        Promise.resolve({ id: where.id, ...data }),
      ),
    },
  };
}

function makeSettings() {
  return { getPricing: vi.fn().mockResolvedValue({ kur: 46, marj: 1.5, kdv: 0.2, minM2: 1 }) };
}

describe("ProductsService.findAll", () => {
  it("aktif ürünleri döner", async () => {
    const prisma = makePrisma();
    const svc = new ProductsService(prisma as never, makeSettings() as never);
    const res = await svc.findAll();
    expect(prisma.product.findMany).toHaveBeenCalled();
    expect(res).toHaveLength(2);
  });

  it("categorySlug filtresi iletilir", async () => {
    const prisma = makePrisma();
    const svc = new ProductsService(prisma as never, makeSettings() as never);
    await svc.findAll({ categorySlug: "kartvizit" });
    const callArg = prisma.product.findMany.mock.calls[0][0];
    expect(callArg.where.category).toEqual({ slug: "kartvizit" });
  });

  it("bestseller=true filtresi iletilir", async () => {
    const prisma = makePrisma();
    const svc = new ProductsService(prisma as never, makeSettings() as never);
    await svc.findAll({ bestseller: true });
    const callArg = prisma.product.findMany.mock.calls[0][0];
    expect(callArg.where.bestseller).toBe(true);
  });

  it("take ve skip varsayılan 50 ve 0", async () => {
    const prisma = makePrisma();
    const svc = new ProductsService(prisma as never, makeSettings() as never);
    await svc.findAll();
    const callArg = prisma.product.findMany.mock.calls[0][0];
    expect(callArg.take).toBe(50);
    expect(callArg.skip).toBe(0);
  });
});

describe("ProductsService.findBySlug", () => {
  it("slug eşleşirse ürünü döner", async () => {
    const prisma = makePrisma();
    const svc = new ProductsService(prisma as never, makeSettings() as never);
    const res = await svc.findBySlug("kartvizit");
    expect(res.slug).toBe("kartvizit");
  });

  it("bulunamayan slug → NotFoundException", async () => {
    const prisma = makePrisma();
    prisma.product.findUnique.mockResolvedValue(null);
    const svc = new ProductsService(prisma as never, makeSettings() as never);
    await expect(svc.findBySlug("yok")).rejects.toBeInstanceOf(NotFoundException);
  });
});

describe("ProductsService.create", () => {
  it("basePrice Decimal'e dönüştürülür", async () => {
    const prisma = makePrisma();
    const svc = new ProductsService(prisma as never, makeSettings() as never);
    await svc.create({
      slug: "yeni",
      name: "Yeni Ürün",
      shortDescription: "kısa",
      description: "uzun",
      basePrice: 299.9,
      productionTime: "1-2 gün",
      images: [],
      categoryId: "cat1",
    });
    const callArg = prisma.product.create.mock.calls[0][0].data;
    expect(callArg.basePrice.toString()).toBe("299.9");
  });

  it("startingPrice opsiyonel; verilince Decimal'e dönüştürülür", async () => {
    const prisma = makePrisma();
    const svc = new ProductsService(prisma as never, makeSettings() as never);
    await svc.create({
      slug: "yeni2",
      name: "Yeni 2",
      shortDescription: "x",
      description: "x",
      basePrice: 100,
      startingPrice: 50,
      productionTime: "1 gün",
      images: [],
      categoryId: "cat1",
    });
    const callArg = prisma.product.create.mock.calls[0][0].data;
    expect(callArg.startingPrice.toString()).toBe("50");
  });
});

describe("ProductsService.remove", () => {
  it("soft delete — isActive=false", async () => {
    const prisma = makePrisma();
    const svc = new ProductsService(prisma as never, makeSettings() as never);
    await svc.remove("p1");
    expect(prisma.product.update).toHaveBeenCalledWith({
      where: { id: "p1" },
      data: { isActive: false },
    });
  });
});

describe("ProductsService.update", () => {
  it("kısmi güncelleme — sadece verilen alanlar gönderilir", async () => {
    const prisma = makePrisma();
    const svc = new ProductsService(prisma as never, makeSettings() as never);
    await svc.update("p1", { name: "Yeni İsim" });
    const callArg = prisma.product.update.mock.calls[0][0];
    expect(callArg.data.name).toBe("Yeni İsim");
    expect(callArg.data.slug).toBeUndefined();
  });
});

describe("ProductsService.findBySlug options+prices", () => {
  it("findBySlug options+prices içerir", async () => {
    const prisma = makePrisma();
    prisma.product.findUnique.mockResolvedValue({ id: "p1", slug: "x", category: {},
      options: [{ id: "o1" }], prices: [{ id: "pr1", price: "50" }] } as any);
    const svc = new ProductsService(prisma as never, makeSettings() as never);
    const r = await svc.findBySlug("x");
    expect((r as any).options).toBeDefined();
    expect((r as any).prices).toBeDefined();
  });
});

describe("ProductsService.findAll displayPrice", () => {
  it("findAll displayPrice = MIN(price), satır yoksa null", async () => {
    const prisma = makePrisma();
    prisma.product.findMany.mockResolvedValue([{ id: "a" }, { id: "b" }] as any);
    prisma.productPrice.groupBy = vi.fn().mockResolvedValue([{ productId: "a", _min: { price: "30" } }]);
    const svc = new ProductsService(prisma as never, makeSettings() as never);
    const r = await svc.findAll({ list: true });
    expect(r.find((x: any) => x.id === "a")!.displayPrice).toBe(30);
    expect(r.find((x: any) => x.id === "b")!.displayPrice).toBeNull();
  });
});
