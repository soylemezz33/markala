import { describe, it, expect, vi, beforeEach } from "vitest";
import { AdminService } from "./admin.service";

const Decimal = (n: number) => ({ toString: () => String(n), valueOf: () => n });

function makePrisma(overrides: Partial<ReturnType<typeof defaultPrisma>> = {}) {
  return { ...defaultPrisma(), ...overrides } as any;
}

function defaultPrisma() {
  return {
    order: {
      count: vi.fn().mockResolvedValue(0),
      groupBy: vi.fn().mockResolvedValue([]),
      aggregate: vi.fn().mockResolvedValue({ _sum: { total: null } }),
      findMany: vi.fn().mockResolvedValue([]),
    },
    user: {
      count: vi.fn().mockResolvedValue(0),
    },
    corporateApplication: {
      count: vi.fn().mockResolvedValue(0),
    },
    review: {
      count: vi.fn().mockResolvedValue(0),
    },
  };
}

describe("AdminService.getStats", () => {
  it("tüm prisma sorguları çağrılır (9 paralel işlem)", async () => {
    const prisma = makePrisma();
    const svc = new AdminService(prisma);
    await svc.getStats();

    expect(prisma.order.count).toHaveBeenCalledTimes(2); // total + today
    expect(prisma.order.groupBy).toHaveBeenCalledOnce();
    expect(prisma.order.aggregate).toHaveBeenCalledTimes(2); // total rev + today rev
    expect(prisma.user.count).toHaveBeenCalledOnce();
    expect(prisma.corporateApplication.count).toHaveBeenCalledOnce();
    expect(prisma.review.count).toHaveBeenCalledOnce();
    expect(prisma.order.findMany).toHaveBeenCalledOnce();
  });

  it("null revenue (hiç ödeme yok) → 0 döner (Decimal null-safe)", async () => {
    const prisma = makePrisma({
      order: {
        ...defaultPrisma().order,
        aggregate: vi.fn().mockResolvedValue({ _sum: { total: null } }),
      },
    });
    const svc = new AdminService(prisma);
    const result = await svc.getStats();
    expect(result.revenue.total).toBe(0);
    expect(result.revenue.today).toBe(0);
  });

  it("Decimal revenue değerleri Number'a çevrilir", async () => {
    const prisma = makePrisma({
      order: {
        ...defaultPrisma().order,
        aggregate: vi
          .fn()
          .mockResolvedValueOnce({ _sum: { total: Decimal(1500.75) } })
          .mockResolvedValueOnce({ _sum: { total: Decimal(250.5) } }),
      },
    });
    const svc = new AdminService(prisma);
    const result = await svc.getStats();
    expect(result.revenue.total).toBe(1500.75);
    expect(result.revenue.today).toBe(250.5);
    expect(typeof result.revenue.total).toBe("number");
  });

  it("byStatus gruplar doğru şekilde objeye dönüştürülür", async () => {
    const prisma = makePrisma({
      order: {
        ...defaultPrisma().order,
        groupBy: vi.fn().mockResolvedValue([
          { status: "uretimde", _count: { _all: 5 } },
          { status: "siparis-alindi", _count: { _all: 10 } },
        ]),
        count: vi.fn().mockResolvedValue(15),
        aggregate: vi.fn().mockResolvedValue({ _sum: { total: null } }),
        findMany: vi.fn().mockResolvedValue([]),
      },
    });
    const svc = new AdminService(prisma);
    const result = await svc.getStats();
    expect(result.orders.byStatus["uretimde"]).toBe(5);
    expect(result.orders.byStatus["siparis-alindi"]).toBe(10);
    expect(result.orders.inProduction).toBe(5);
  });

  it("recentOrders user adı yoksa email kullanılır (guest sipariş)", async () => {
    const prisma = makePrisma({
      order: {
        ...defaultPrisma().order,
        findMany: vi.fn().mockResolvedValue([
          {
            orderNumber: "MK-TEST-001",
            email: "misafir@ornek.com",
            total: Decimal(100),
            status: "siparis-alindi",
            paymentStatus: "basarili",
            createdAt: new Date("2026-01-01"),
            user: null,
          },
        ]),
        count: vi.fn().mockResolvedValue(0),
        aggregate: vi.fn().mockResolvedValue({ _sum: { total: null } }),
        groupBy: vi.fn().mockResolvedValue([]),
      },
    });
    const svc = new AdminService(prisma);
    const result = await svc.getStats();
    expect(result.recentOrders[0].customer).toBe("misafir@ornek.com");
    expect(result.recentOrders[0].isCorporate).toBe(false);
  });

  it("kurumsal müşteri işaretlenir (accountType === corporate)", async () => {
    const prisma = makePrisma({
      order: {
        ...defaultPrisma().order,
        findMany: vi.fn().mockResolvedValue([
          {
            orderNumber: "MK-CORP-001",
            email: "kurumsal@firma.com",
            total: Decimal(5000),
            status: "uretimde",
            paymentStatus: "basarili",
            createdAt: new Date("2026-01-01"),
            user: { fullName: "Firma Yetkilisi", accountType: "corporate" },
          },
        ]),
        count: vi.fn().mockResolvedValue(0),
        aggregate: vi.fn().mockResolvedValue({ _sum: { total: null } }),
        groupBy: vi.fn().mockResolvedValue([]),
      },
    });
    const svc = new AdminService(prisma);
    const result = await svc.getStats();
    expect(result.recentOrders[0].customer).toBe("Firma Yetkilisi");
    expect(result.recentOrders[0].isCorporate).toBe(true);
    expect(result.recentOrders[0].total).toBe(5000);
  });

  it("recentOrders findMany take: 8 ile çağrılır", async () => {
    const prisma = makePrisma();
    const svc = new AdminService(prisma);
    await svc.getStats();
    expect(prisma.order.findMany.mock.calls[0][0].take).toBe(8);
  });
});
