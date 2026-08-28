import { describe, it, expect, vi } from "vitest";
import { NotFoundException } from "@nestjs/common";
import { CategoriesService } from "./categories.service";

function makePrisma() {
  return {
    category: {
      findMany: vi.fn().mockResolvedValue([
        { id: "cat1", slug: "kartvizit", name: "Kartvizit", isActive: true, sortOrder: 1, _count: { products: 5 } },
        { id: "cat2", slug: "etiket", name: "Etiket", isActive: false, sortOrder: 2, _count: { products: 2 } },
      ]),
      findUnique: vi.fn().mockResolvedValue({
        id: "cat1", slug: "kartvizit", name: "Kartvizit", isActive: true, products: [],
      }),
      create: vi.fn().mockImplementation(({ data }) => Promise.resolve({ id: "new-cat", ...data })),
      update: vi.fn().mockImplementation(({ where, data }) => Promise.resolve({ id: where.id, ...data })),
    },
    // findAll artık başlangıç fiyatını ürünlerden HESAPLIYOR (2026-08-28) — bu iki
    // sorgu da mocklanmalı, yoksa findAll mock eksikliğinden patlar.
    product: { findMany: vi.fn().mockResolvedValue([]) },
    productPrice: { groupBy: vi.fn().mockResolvedValue([]) },
  };
}

/** SettingsService mock — m² ürünleri için kur/marj/KDV. */
const settingsMock = () => ({
  getPricing: vi.fn().mockResolvedValue({ kur: 49, marj: 1.2, kdv: 0.2, minM2: 1 }),
});

describe("CategoriesService.findAll", () => {
  it("varsayılan: yalnızca aktif kategoriler (isActive filter)", async () => {
    const prisma = makePrisma();
    const svc = new CategoriesService(prisma as never, settingsMock() as never);
    await svc.findAll();
    const callArg = prisma.category.findMany.mock.calls[0][0];
    expect(callArg.where).toEqual({ isActive: true });
  });

  it("includeInactive=true → where boş obje (hepsini getirir)", async () => {
    const prisma = makePrisma();
    const svc = new CategoriesService(prisma as never, settingsMock() as never);
    await svc.findAll(true);
    const callArg = prisma.category.findMany.mock.calls[0][0];
    expect(callArg.where).toEqual({});
  });

  it("sortOrder asc sıralı", async () => {
    const prisma = makePrisma();
    const svc = new CategoriesService(prisma as never, settingsMock() as never);
    await svc.findAll();
    const callArg = prisma.category.findMany.mock.calls[0][0];
    expect(callArg.orderBy).toEqual({ sortOrder: "asc" });
  });

  it("ürün sayısı (_count.products) select edilir", async () => {
    const prisma = makePrisma();
    const svc = new CategoriesService(prisma as never, settingsMock() as never);
    await svc.findAll();
    const callArg = prisma.category.findMany.mock.calls[0][0];
    expect(callArg.include._count.select.products).toBe(true);
  });
});

describe("CategoriesService.findBySlug", () => {
  it("mevcut slug → kategoriyi döner", async () => {
    const prisma = makePrisma();
    const svc = new CategoriesService(prisma as never, settingsMock() as never);
    const res = await svc.findBySlug("kartvizit");
    expect(res.slug).toBe("kartvizit");
  });

  it("bulunamayan slug → NotFoundException", async () => {
    const prisma = makePrisma();
    prisma.category.findUnique.mockResolvedValue(null);
    const svc = new CategoriesService(prisma as never, settingsMock() as never);
    await expect(svc.findBySlug("yok")).rejects.toBeInstanceOf(NotFoundException);
  });

  it("sadece aktif ürünleri include eder", async () => {
    const prisma = makePrisma();
    const svc = new CategoriesService(prisma as never, settingsMock() as never);
    await svc.findBySlug("kartvizit");
    const callArg = prisma.category.findUnique.mock.calls[0][0];
    expect(callArg.include.products.where).toEqual({ isActive: true });
  });
});

describe("CategoriesService.create", () => {
  it("startingPrice Decimal'e dönüştürülür", async () => {
    const prisma = makePrisma();
    const svc = new CategoriesService(prisma as never, settingsMock() as never);
    await svc.create({
      slug: "tabela",
      name: "Tabela",
      shortDescription: "kısa",
      longDescription: "uzun",
      imageUrl: "img.jpg",
      startingPrice: 199,
      productionTime: "3-5 gün",
    });
    const callArg = prisma.category.create.mock.calls[0][0].data;
    expect(callArg.startingPrice.toString()).toBe("199");
    expect(callArg.slug).toBe("tabela");
  });
});

describe("CategoriesService.remove", () => {
  it("soft delete — isActive=false", async () => {
    const prisma = makePrisma();
    const svc = new CategoriesService(prisma as never, settingsMock() as never);
    await svc.remove("cat1");
    expect(prisma.category.update).toHaveBeenCalledWith({
      where: { id: "cat1" },
      data: { isActive: false },
    });
  });
});

describe("CategoriesService.update", () => {
  it("kısmi güncelleme — yalnızca verilen alanlar gönderilir", async () => {
    const prisma = makePrisma();
    const svc = new CategoriesService(prisma as never, settingsMock() as never);
    await svc.update("cat1", { name: "Yeni İsim" });
    const callArg = prisma.category.update.mock.calls[0][0];
    expect(callArg.data.name).toBe("Yeni İsim");
    expect(callArg.data.slug).toBeUndefined();
  });
});

/**
 * 2026-08-28: `categories.starting_price` elle tutuluyordu ve katalog değiştikçe
 * bayatlıyordu — 7 kategoride yanlış rakam çıktı (masa bayrağı 450 ₺ yazıp gerçekte
 * 150 ₺'den başlıyordu). Artık aktif ürünlerden hesaplanıyor.
 */
describe("CategoriesService.findAll — başlangıç fiyatı ürünlerden hesaplanır", () => {
  function prismaWithProducts() {
    const p = makePrisma();
    p.category.findMany.mockResolvedValue([
      { id: "cat1", slug: "masa-bayragi", startingPrice: 450, _count: { products: 1 } },
      { id: "cat2", slug: "bos-kategori", startingPrice: 999, _count: { products: 0 } },
    ]);
    p.product.findMany.mockResolvedValue([
      { id: "u1", categoryId: "cat1", pricingMode: "additive" },
      { id: "u2", categoryId: "cat1", pricingMode: "additive" },
    ]);
    p.productPrice.groupBy.mockResolvedValue([
      { productId: "u1", _min: { price: 150 } },
      { productId: "u2", _min: { price: 430 } },
    ]);
    return p;
  }

  it("kategorideki EN UCUZ ürünün fiyatını kullanır, sütundaki bayat değeri değil", async () => {
    const svc = new CategoriesService(prismaWithProducts() as never, settingsMock() as never);
    const res = (await svc.findAll()) as { slug: string; startingPrice: number }[];
    expect(res.find((c) => c.slug === "masa-bayragi")!.startingPrice).toBe(150);
  });

  it("fiyatlı ürünü olmayan kategoride sütundaki yedeğe düşer", async () => {
    const svc = new CategoriesService(prismaWithProducts() as never, settingsMock() as never);
    const res = (await svc.findAll()) as { slug: string; startingPrice: number }[];
    expect(res.find((c) => c.slug === "bos-kategori")!.startingPrice).toBe(999);
  });

  it("fiyatı 0 olan satır aday olmaz (0 ₺ gösterilmez)", async () => {
    const p = prismaWithProducts();
    p.productPrice.groupBy.mockResolvedValue([
      { productId: "u1", _min: { price: 0 } },
      { productId: "u2", _min: { price: 430 } },
    ]);
    const svc = new CategoriesService(p as never, settingsMock() as never);
    const res = (await svc.findAll()) as { slug: string; startingPrice: number }[];
    expect(res.find((c) => c.slug === "masa-bayragi")!.startingPrice).toBe(430);
  });
});
