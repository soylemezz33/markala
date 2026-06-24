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
      update: vi.fn().mockImplementation(({ where, data }) =>
        Promise.resolve({ id: where.id, ...data }),
      ),
      delete: vi.fn().mockResolvedValue({ id: "r1" }),
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
  });
});
