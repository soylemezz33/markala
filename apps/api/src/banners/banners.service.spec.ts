import { describe, it, expect, vi } from "vitest";
import { BannersService } from "./banners.service";

function mockPrisma() {
  return {
    banner: {
      findMany: vi.fn().mockResolvedValue([
        { id: "b1", title: "Hoş Geldin", location: "hero", sortOrder: 0, isActive: true, createdAt: new Date("2026-01-01") },
        { id: "b2", title: "Sepet Duyurusu", location: "cart", sortOrder: 1, isActive: true, createdAt: new Date("2026-01-02") },
      ]),
      create: vi.fn().mockImplementation(({ data }) => Promise.resolve({ id: "new", clickCount: 0, ...data })),
      update: vi.fn().mockImplementation(({ where, data }) => Promise.resolve({ id: where.id, ...data })),
    },
  };
}

describe("BannersService", () => {
  it("findAll location+sortOrder sıralı getirir", async () => {
    const prisma = mockPrisma();
    const svc = new BannersService(prisma as never);
    const res = await svc.findAll();
    expect(prisma.banner.findMany).toHaveBeenCalledWith({
      orderBy: [{ location: "asc" }, { sortOrder: "asc" }],
    });
    expect(res).toHaveLength(2);
  });

  it("create tarihleri Date nesnesine dönüştürerek prisma'ya iletir", async () => {
    const prisma = mockPrisma();
    const svc = new BannersService(prisma as never);
    const res = await svc.create({
      title: "Test Banner",
      location: "hero",
      imageUrl: "https://cdn.markala.com/hero.jpg",
      startDate: "2026-06-01",
      endDate: "2026-06-30",
    });
    expect(prisma.banner.create).toHaveBeenCalledOnce();
    const callData = prisma.banner.create.mock.calls[0][0].data;
    expect(callData.startDate).toBeInstanceOf(Date);
    expect(callData.endDate).toBeInstanceOf(Date);
    expect(callData.startDate.toISOString()).toContain("2026-06-01");
    expect(res.id).toBe("new");
  });

  it("remove isActive=false yaparak soft delete uygular", async () => {
    const prisma = mockPrisma();
    const svc = new BannersService(prisma as never);
    await svc.remove("b1");
    expect(prisma.banner.update).toHaveBeenCalledWith({
      where: { id: "b1" },
      data: { isActive: false },
    });
  });
});
