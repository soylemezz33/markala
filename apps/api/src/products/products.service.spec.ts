import { describe, it, expect, vi, beforeEach } from "vitest";
import { NotFoundException } from "@nestjs/common";
import { ProductsService } from "./products.service";

// ─── Prisma mock factory ─────────────────────────────────────────────────────

function makeProduct(over: Partial<Record<string, unknown>> = {}) {
  return {
    id: "prod-1",
    slug: "klasik-kartvizit",
    name: "Klasik Kartvizit",
    shortDescription: "Standart kartvizit",
    description: "Açıklama",
    basePrice: 290,
    productionTime: "1-2 gün",
    images: ["/kartvizit.jpg"],
    isActive: true,
    bestseller: false,
    category: { id: "cat-1", slug: "kartvizit", name: "Kartvizit" },
    ...over,
  };
}

function makePrisma(over: Partial<Record<string, unknown>> = {}) {
  return {
    product: {
      findMany: vi.fn().mockResolvedValue([makeProduct()]),
      findUnique: vi.fn().mockResolvedValue(makeProduct()),
      create: vi.fn().mockResolvedValue(makeProduct()),
      update: vi.fn().mockResolvedValue(makeProduct()),
    },
    ...over,
  } as any;
}

// ─── ProductsService.findAll ──────────────────────────────────────────────────

describe("ProductsService.findAll", () => {
  let service: ProductsService;
  let prisma: ReturnType<typeof makePrisma>;

  beforeEach(() => {
    prisma = makePrisma();
    service = new ProductsService(prisma);
    vi.restoreAllMocks();
  });

  it("varsayılan: isActive:true filtreli, en fazla 50 kayıt", async () => {
    await service.findAll();
    expect(prisma.product.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { isActive: true },
        take: 50,
        skip: 0,
      }),
    );
  });

  it("categorySlug filtresi geçirilince where'e eklenir", async () => {
    await service.findAll({ categorySlug: "kartvizit" });
    const callArgs = prisma.product.findMany.mock.calls[0][0];
    expect(callArgs.where).toMatchObject({ category: { slug: "kartvizit" } });
  });

  it("bestseller:true filtresi geçirilince where'e eklenir", async () => {
    await service.findAll({ bestseller: true });
    const callArgs = prisma.product.findMany.mock.calls[0][0];
    expect(callArgs.where).toMatchObject({ bestseller: true });
  });

  it("take/skip pagination argümanları iletilir", async () => {
    await service.findAll({ take: 10, skip: 20 });
    expect(prisma.product.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ take: 10, skip: 20 }),
    );
  });

  it("bulunan ürünleri döndürür", async () => {
    const products = [makeProduct(), makeProduct({ id: "prod-2", slug: "promosyon-kalem" })];
    prisma.product.findMany.mockResolvedValue(products);
    const result = await service.findAll();
    expect(result).toHaveLength(2);
  });
});

// ─── ProductsService.findBySlug ───────────────────────────────────────────────

describe("ProductsService.findBySlug", () => {
  let service: ProductsService;
  let prisma: ReturnType<typeof makePrisma>;

  beforeEach(() => {
    prisma = makePrisma();
    service = new ProductsService(prisma);
  });

  it("var olan slug → ürünü döner", async () => {
    const product = makeProduct();
    prisma.product.findUnique.mockResolvedValue(product);
    const result = await service.findBySlug("klasik-kartvizit");
    expect(result).toBe(product);
  });

  it("olmayan slug → NotFoundException", async () => {
    prisma.product.findUnique.mockResolvedValue(null);
    await expect(service.findBySlug("yok")).rejects.toBeInstanceOf(NotFoundException);
  });

  it("slug ve kategori ile birlikte çekilir", async () => {
    await service.findBySlug("klasik-kartvizit");
    expect(prisma.product.findUnique).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { slug: "klasik-kartvizit" },
        include: { category: true },
      }),
    );
  });
});

// ─── ProductsService.create ───────────────────────────────────────────────────

describe("ProductsService.create", () => {
  let service: ProductsService;
  let prisma: ReturnType<typeof makePrisma>;

  beforeEach(() => {
    prisma = makePrisma();
    service = new ProductsService(prisma);
  });

  const dto = {
    slug: "yeni-urun",
    name: "Yeni Ürün",
    shortDescription: "Kısa",
    description: "Uzun",
    basePrice: 150,
    productionTime: "3 gün",
    images: ["/yeni.jpg"],
    categoryId: "cat-1",
  };

  it("create çağrılır ve slug geçirilir", async () => {
    await service.create(dto);
    const callArg = prisma.product.create.mock.calls[0][0];
    expect(callArg.data.slug).toBe("yeni-urun");
  });

  it("basePrice Decimal'e sarılır", async () => {
    await service.create(dto);
    const callArg = prisma.product.create.mock.calls[0][0];
    expect(typeof callArg.data.basePrice).toBe("object");
  });

  it("categoryId connect olarak geçirilir", async () => {
    await service.create(dto);
    const callArg = prisma.product.create.mock.calls[0][0];
    expect(callArg.data.category).toEqual({ connect: { id: "cat-1" } });
  });

  it("opsiyonel bestseller alanı geçirilince eklenir", async () => {
    await service.create({ ...dto, bestseller: true });
    const callArg = prisma.product.create.mock.calls[0][0];
    expect(callArg.data.bestseller).toBe(true);
  });

  it("opsiyonel bestseller verilmeyince data'ya eklenmez", async () => {
    await service.create(dto);
    const callArg = prisma.product.create.mock.calls[0][0];
    expect(callArg.data).not.toHaveProperty("bestseller");
  });
});

// ─── ProductsService.update ───────────────────────────────────────────────────

describe("ProductsService.update", () => {
  let service: ProductsService;
  let prisma: ReturnType<typeof makePrisma>;

  beforeEach(() => {
    prisma = makePrisma();
    service = new ProductsService(prisma);
  });

  it("id ile update çağrılır", async () => {
    await service.update("prod-1", { name: "Yeni Ad" });
    expect(prisma.product.update).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: "prod-1" } }),
    );
  });

  it("sadece verilen alanlar data'ya eklenir (partial update)", async () => {
    await service.update("prod-1", { name: "Değişti" });
    const callArg = prisma.product.update.mock.calls[0][0];
    expect(callArg.data).toHaveProperty("name", "Değişti");
    expect(callArg.data).not.toHaveProperty("slug");
  });
});

// ─── ProductsService.remove ───────────────────────────────────────────────────

describe("ProductsService.remove", () => {
  let service: ProductsService;
  let prisma: ReturnType<typeof makePrisma>;

  beforeEach(() => {
    prisma = makePrisma();
    service = new ProductsService(prisma);
  });

  it("isActive:false yaparak soft-delete uygular (gerçek silme yok)", async () => {
    await service.remove("prod-1");
    expect(prisma.product.update).toHaveBeenCalledWith({
      where: { id: "prod-1" },
      data: { isActive: false },
    });
  });
});
