import { describe, it, expect, vi } from "vitest";
import { ReviewsService } from "./reviews.service";

function mockPrisma() {
  return {
    review: {
      findMany: vi.fn().mockResolvedValue([
        {
          id: "r1",
          productId: "p1",
          userName: "Ali Veli",
          rating: 5,
          comment: "Harika ürün",
          isApproved: false,
          createdAt: new Date("2026-01-01"),
          product: { slug: "urun-1", name: "Ürün 1" },
        },
      ]),
      // setApproval/remove artık recomputeProductRating çağırır → dönen kayıtta productId olmalı.
      update: vi.fn().mockImplementation(({ where, data }) =>
        Promise.resolve({ id: where.id, productId: "p1", ...data }),
      ),
      delete: vi.fn().mockResolvedValue({ id: "r1", productId: "p1" }),
      // recomputeProductRating: onaylı yorumlardan ortalama + adet aggregate'i.
      aggregate: vi.fn().mockResolvedValue({ _avg: { rating: 4.5 }, _count: { _all: 2 } }),
    },
    // recomputeProductRating denormalize rating'i Product'a yazar.
    product: {
      update: vi.fn().mockResolvedValue({ id: "p1" }),
    },
  };
}

describe("ReviewsService", () => {
  it("findAll onaylı filtresiyle isApproved:true where koşulu gönderir", async () => {
    const prisma = mockPrisma();
    const svc = new ReviewsService(prisma as never);
    await svc.findAll({ approved: true });
    expect(prisma.review.findMany).toHaveBeenCalledWith({
      where: { isApproved: true },
      include: { product: { select: { slug: true, name: true } } },
      orderBy: { createdAt: "desc" },
      take: 500,
    });
  });

  it("findAll filtre olmadan where:{} gönderir", async () => {
    const prisma = mockPrisma();
    const svc = new ReviewsService(prisma as never);
    await svc.findAll();
    expect(prisma.review.findMany).toHaveBeenCalledWith({
      where: {},
      include: { product: { select: { slug: true, name: true } } },
      orderBy: { createdAt: "desc" },
      take: 500,
    });
  });

  it("setApproval isApproved alanını günceller", async () => {
    const prisma = mockPrisma();
    const svc = new ReviewsService(prisma as never);
    const res = await svc.setApproval("r1", true);
    expect(prisma.review.update).toHaveBeenCalledWith({
      where: { id: "r1" },
      data: { isApproved: true },
    });
    expect(res.id).toBe("r1");
    // Onay değişince ürünün denormalize rating'i (yalnız onaylı yorumlardan) yeniden yazılır.
    expect(prisma.review.aggregate).toHaveBeenCalledWith({
      where: { productId: "p1", isApproved: true },
      _avg: { rating: true },
      _count: { _all: true },
    });
    expect(prisma.product.update).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: "p1" }, data: expect.objectContaining({ ratingCount: 2 }) }),
    );
  });
});
