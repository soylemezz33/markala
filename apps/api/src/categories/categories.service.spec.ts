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
  };
}

describe("CategoriesService.findAll", () => {
  it("varsayılan: yalnızca aktif kategoriler (isActive filter)", async () => {
    const prisma = makePrisma();
    const svc = new CategoriesService(prisma as never);
    await svc.findAll();
    const callArg = prisma.category.findMany.mock.calls[0][0];
    expect(callArg.where).toEqual({ isActive: true });
  });

  it("includeInactive=true → where boş obje (hepsini getirir)", async () => {
    const prisma = makePrisma();
    const svc = new CategoriesService(prisma as never);
    await svc.findAll(true);
    const callArg = prisma.category.findMany.mock.calls[0][0];
    expect(callArg.where).toEqual({});
  });

  it("sortOrder asc sıralı", async () => {
    const prisma = makePrisma();
    const svc = new CategoriesService(prisma as never);
    await svc.findAll();
    const callArg = prisma.category.findMany.mock.calls[0][0];
    expect(callArg.orderBy).toEqual({ sortOrder: "asc" });
  });

  it("ürün sayısı (_count.products) select edilir", async () => {
    const prisma = makePrisma();
    const svc = new CategoriesService(prisma as never);
    await svc.findAll();
    const callArg = prisma.category.findMany.mock.calls[0][0];
    expect(callArg.include._count.select.products).toBe(true);
  });
});

describe("CategoriesService.findBySlug", () => {
  it("mevcut slug → kategoriyi döner", async () => {
    const prisma = makePrisma();
    const svc = new CategoriesService(prisma as never);
    const res = await svc.findBySlug("kartvizit");
    expect(res.slug).toBe("kartvizit");
  });

  it("bulunamayan slug → NotFoundException", async () => {
    const prisma = makePrisma();
    prisma.category.findUnique.mockResolvedValue(null);
    const svc = new CategoriesService(prisma as never);
    await expect(svc.findBySlug("yok")).rejects.toBeInstanceOf(NotFoundException);
  });

  it("sadece aktif ürünleri include eder", async () => {
    const prisma = makePrisma();
    const svc = new CategoriesService(prisma as never);
    await svc.findBySlug("kartvizit");
    const callArg = prisma.category.findUnique.mock.calls[0][0];
    expect(callArg.include.products.where).toEqual({ isActive: true });
  });
});

describe("CategoriesService.create", () => {
  it("startingPrice Decimal'e dönüştürülür", async () => {
    const prisma = makePrisma();
    const svc = new CategoriesService(prisma as never);
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
    const svc = new CategoriesService(prisma as never);
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
    const svc = new CategoriesService(prisma as never);
    await svc.update("cat1", { name: "Yeni İsim" });
    const callArg = prisma.category.update.mock.calls[0][0];
    expect(callArg.data.name).toBe("Yeni İsim");
    expect(callArg.data.slug).toBeUndefined();
  });
});
