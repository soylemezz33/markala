import { describe, it, expect, vi } from "vitest";
import { StatsService } from "./stats.service";

function mockPrisma() {
  return {
    order: {
      count: vi.fn().mockResolvedValue(5),
      aggregate: vi.fn().mockResolvedValue({ _sum: { total: 1200 } }),
      groupBy: vi.fn().mockResolvedValue([{ status: "uretimde", _count: 3 }]),
    },
    user: { count: vi.fn().mockResolvedValue(8) },
    corporateApplication: { count: vi.fn().mockResolvedValue(2) },
  };
}

describe("StatsService", () => {
  it("özet sayıları derler", async () => {
    const prisma = mockPrisma();
    const svc = new StatsService(prisma as never);
    const res = await svc.summary();
    expect(res.orderCount).toBe(5);
    expect(res.revenue).toBe(1200);
    expect(res.customerCount).toBe(8);
    expect(res.pendingCorporate).toBe(2);
    expect(res.ordersByStatus).toEqual([{ status: "uretimde", count: 3 }]);
  });

  it("ciro null ise 0 döner", async () => {
    const prisma = mockPrisma();
    prisma.order.aggregate = vi.fn().mockResolvedValue({ _sum: { total: null } });
    const svc = new StatsService(prisma as never);
    const res = await svc.summary();
    expect(res.revenue).toBe(0);
  });
});
