import { describe, it, expect, vi } from "vitest";
import { HeroSlidesService } from "./hero-slides.service";

function mockPrisma() {
  return {
    heroSlide: {
      findMany: vi.fn().mockResolvedValue([{ id: "a", title: "T", sortOrder: 0, isActive: true }]),
      create: vi.fn().mockImplementation(({ data }) => Promise.resolve({ id: "new", ...data })),
      update: vi.fn().mockImplementation(({ where, data }) => Promise.resolve({ id: where.id, ...data })),
      delete: vi.fn().mockResolvedValue({ id: "a" }),
    },
  };
}

describe("HeroSlidesService", () => {
  it("findAll yalnız aktifleri sortOrder'a göre döner (default)", async () => {
    const prisma = mockPrisma();
    const svc = new HeroSlidesService(prisma as never);
    const res = await svc.findAll(false);
    expect(prisma.heroSlide.findMany).toHaveBeenCalledWith({
      where: { isActive: true },
      orderBy: { sortOrder: "asc" },
    });
    expect(res).toHaveLength(1);
  });

  it("findAll(includeInactive=true) hepsini döner", async () => {
    const prisma = mockPrisma();
    const svc = new HeroSlidesService(prisma as never);
    await svc.findAll(true);
    expect(prisma.heroSlide.findMany).toHaveBeenCalledWith({ orderBy: { sortOrder: "asc" } });
  });

  it("create dto'yu prisma'ya iletir", async () => {
    const prisma = mockPrisma();
    const svc = new HeroSlidesService(prisma as never);
    const res = await svc.create({ title: "Yeni", imageUrl: "/x.jpg" });
    expect(res.title).toBe("Yeni");
  });
});
