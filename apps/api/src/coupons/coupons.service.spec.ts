import { describe, it, expect, vi } from "vitest";
import { CouponsService } from "./coupons.service";

function mockPrisma() {
  return {
    coupon: {
      findMany: vi.fn().mockResolvedValue([
        { id: "c1", code: "SAVE10", type: "percentage", value: "10", isActive: true, createdAt: new Date("2026-01-01") },
      ]),
      create: vi.fn().mockImplementation(({ data }) => Promise.resolve({ id: "new", usedCount: 0, ...data })),
      update: vi.fn().mockImplementation(({ where, data }) => Promise.resolve({ id: where.id, ...data })),
    },
  };
}

describe("CouponsService", () => {
  it("findAll createdAt desc sıralı getirir", async () => {
    const prisma = mockPrisma();
    const svc = new CouponsService(prisma as never);
    const res = await svc.findAll();
    expect(prisma.coupon.findMany).toHaveBeenCalledWith({ orderBy: { createdAt: "desc" } });
    expect(res).toHaveLength(1);
  });

  it("create Decimal alanları dönüştürerek prisma'ya iletir", async () => {
    const prisma = mockPrisma();
    const svc = new CouponsService(prisma as never);
    const res = await svc.create({ code: "TEST20", type: "fixed_amount", value: 20, minOrderAmount: 100 });
    expect(prisma.coupon.create).toHaveBeenCalledOnce();
    const callArg = prisma.coupon.create.mock.calls[0][0].data;
    // value ve minOrderAmount Prisma.Decimal instance'ı olmalı
    expect(callArg.value.toString()).toBe("20");
    expect(callArg.minOrderAmount.toString()).toBe("100");
    expect(res.id).toBe("new");
  });

  it("remove isActive=false yaparak soft delete uygular", async () => {
    const prisma = mockPrisma();
    const svc = new CouponsService(prisma as never);
    await svc.remove("c1");
    expect(prisma.coupon.update).toHaveBeenCalledWith({
      where: { id: "c1" },
      data: { isActive: false },
    });
  });
});
