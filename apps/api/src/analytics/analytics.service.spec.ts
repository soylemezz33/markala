import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { AnalyticsService } from "./analytics.service";

const DAY = 24 * 60 * 60 * 1000;
// Sabit "şimdi" — segment gün-sınırları deterministik test edilebilsin.
const NOW = new Date("2026-06-17T12:00:00.000Z").getTime();

function daysAgo(d: number): Date {
  return new Date(NOW - d * DAY);
}

/** loadCustomerRows() $queryRaw ile çekilen ham müşteri satırı. */
function customer(over: Partial<Record<string, unknown>> = {}) {
  return {
    id: "u_" + Math.random().toString(36).slice(2),
    fullName: "Test Müşteri",
    email: "t@x.com",
    phone: "+905551112233",
    createdAt: daysAgo(400),
    lastLoginAt: null,
    orderCount: BigInt(0),
    totalSpent: "0",
    lastOrderAt: null,
    ...over,
  };
}

describe("AnalyticsService — collect", () => {
  it("boş olay dizisinde createMany çağırmaz, 0 döner", async () => {
    const createMany = vi.fn();
    const prisma = { analyticsEvent: { createMany } };
    const svc = new AnalyticsService(prisma as never);
    expect(await svc.collect([])).toBe(0);
    expect(createMany).not.toHaveBeenCalled();
  });

  it("olayları map'leyip createMany'e yazar, kabul sayısını döner", async () => {
    const createMany = vi.fn().mockResolvedValue({ count: 2 });
    const prisma = { analyticsEvent: { createMany } };
    const svc = new AnalyticsService(prisma as never);
    const n = await svc.collect(
      [
        { type: "page_view", sessionId: "s1", path: "/" },
        { type: "product_view", sessionId: "s1", productSlug: "kartvizit", dwellMs: 1234.6 },
      ],
      "user-42",
    );
    expect(n).toBe(2);
    const data = createMany.mock.calls[0][0].data;
    expect(data).toHaveLength(2);
    // userId tüm olaylara enjekte edilir
    expect(data[0].userId).toBe("user-42");
    // dwellMs yuvarlanır
    expect(data[1].dwellMs).toBe(1235);
    // verilmeyen alanlar null
    expect(data[0].productSlug).toBeNull();
  });

  it("DB hatası yutulur — asla fırlatmaz, 0 döner", async () => {
    const createMany = vi.fn().mockRejectedValue(new Error("db down"));
    const prisma = { analyticsEvent: { createMany } };
    const svc = new AnalyticsService(prisma as never);
    await expect(svc.collect([{ type: "page_view", sessionId: "s1" }])).resolves.toBe(0);
  });

  it("userId verilmezse null yazılır (anonim ziyaretçi)", async () => {
    const createMany = vi.fn().mockResolvedValue({ count: 1 });
    const prisma = { analyticsEvent: { createMany } };
    const svc = new AnalyticsService(prisma as never);
    await svc.collect([{ type: "page_view", sessionId: "s1" }]);
    expect(createMany.mock.calls[0][0].data[0].userId).toBeNull();
  });
});

describe("AnalyticsService — segment (CRM sınıflandırması)", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(NOW);
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  function svcWithCustomers(rows: ReturnType<typeof customer>[]) {
    const prisma = { $queryRaw: vi.fn().mockResolvedValue(rows) };
    return new AnalyticsService(prisma as never);
  }

  it("bilinmeyen segment anahtarı boş liste döner", async () => {
    const svc = svcWithCustomers([]);
    const res = await svc.segment("yok-boyle-key");
    expect(res.count).toBe(0);
    expect(res.customers).toEqual([]);
  });

  it("yeni müşteri: <=14 gün önce kayıt + 0-1 sipariş", async () => {
    const svc = svcWithCustomers([
      customer({ createdAt: daysAgo(5), orderCount: BigInt(0) }),
      customer({ createdAt: daysAgo(10), orderCount: BigInt(1), lastOrderAt: daysAgo(2) }),
      // 14 günden eski → yeni DEĞİL
      customer({ createdAt: daysAgo(20), orderCount: BigInt(0), lastLoginAt: daysAgo(1) }),
    ]);
    const res = await svc.segment("new");
    expect(res.count).toBe(2);
  });

  it("sadık müşteri: 3+ sipariş ve son 60 günde aktif", async () => {
    const svc = svcWithCustomers([
      customer({ createdAt: daysAgo(200), orderCount: BigInt(4), lastOrderAt: daysAgo(10) }),
      // 3+ sipariş ama 80 gündür sessiz → sadık DEĞİL (dormant)
      customer({ createdAt: daysAgo(200), orderCount: BigInt(5), lastOrderAt: daysAgo(80) }),
    ]);
    expect((await svc.segment("loyal")).count).toBe(1);
  });

  it("riskli: siparişi var, son aktivite 30-60 gün önce", async () => {
    const svc = svcWithCustomers([
      customer({ createdAt: daysAgo(300), orderCount: BigInt(1), lastOrderAt: daysAgo(45) }),
    ]);
    expect((await svc.segment("at_risk")).count).toBe(1);
  });

  it("uyuyan: son aktivite 60-120 gün önce", async () => {
    const svc = svcWithCustomers([
      customer({ createdAt: daysAgo(300), orderCount: BigInt(2), lastOrderAt: daysAgo(90) }),
    ]);
    expect((await svc.segment("dormant")).count).toBe(1);
  });

  it("kayıp: son aktivite 120 günden eski", async () => {
    const svc = svcWithCustomers([
      customer({ createdAt: daysAgo(400), orderCount: BigInt(3), lastOrderAt: daysAgo(200) }),
    ]);
    expect((await svc.segment("lost")).count).toBe(1);
  });

  it("müşteri tek bir segmente atanır (öncelik: new > loyal > lost > dormant > at_risk)", async () => {
    // 5 gün önce kayıt + 4 sipariş: orders>1 → new değil; 3+ & aktif → loyal
    const svc = svcWithCustomers([
      customer({ createdAt: daysAgo(5), orderCount: BigInt(4), lastOrderAt: daysAgo(1) }),
    ]);
    expect((await svc.segment("new")).count).toBe(0);
    expect((await svc.segment("loyal")).count).toBe(1);
  });

  it("segment müşteri listesi iletişim + son aktivite gününü döndürür", async () => {
    const svc = svcWithCustomers([
      customer({
        fullName: "Ayşe Yıldız",
        email: "ayse@x.com",
        phone: "+905550001122",
        createdAt: daysAgo(300),
        orderCount: BigInt(1),
        totalSpent: "1250.50",
        lastOrderAt: daysAgo(45),
      }),
    ]);
    const res = await svc.segment("at_risk");
    expect(res.customers).toHaveLength(1);
    const c = res.customers[0];
    expect(c.fullName).toBe("Ayşe Yıldız");
    expect(c.email).toBe("ayse@x.com");
    expect(c.phone).toBe("+905550001122");
    expect(c.orderCount).toBe(1);
    expect(c.totalSpent).toBe(1250.5);
    expect(c.daysSinceLastActivity).toBe(45);
  });

  it("DB hatasında segment boş döner (panel çökmez)", async () => {
    const prisma = { $queryRaw: vi.fn().mockRejectedValue(new Error("db down")) };
    const svc = new AnalyticsService(prisma as never);
    const res = await svc.segment("at_risk");
    expect(res.count).toBe(0);
    expect(res.customers).toEqual([]);
  });
});

describe("AnalyticsService — overview", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(NOW);
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it("tüm DB blokları hata verse bile çökmez, varsayılan yapı döner", async () => {
    const reject = vi.fn().mockRejectedValue(new Error("db down"));
    const prisma = {
      analyticsEvent: { count: reject, findMany: reject, groupBy: reject, aggregate: reject },
      order: { count: reject },
      orderItem: { groupBy: reject },
      product: { findMany: reject },
      $queryRaw: reject,
    };
    const svc = new AnalyticsService(prisma as never);
    const res = await svc.overview(30);
    expect(res.kpis.sessions).toBe(0);
    expect(res.kpis.conversionRate).toBe(0);
    expect(res.topProducts).toEqual([]);
    expect(res.customers.total).toBe(0);
    // funnel her zaman 5 aşama döner
    expect(res.funnel.map((f) => f.key)).toEqual([
      "sessions",
      "product_view",
      "add_to_cart",
      "begin_checkout",
      "order",
    ]);
    // segment tanımları her zaman dolu
    expect(res.customers.segments).toHaveLength(5);
  });

  it("KPI matematiği: conversionRate = sipariş / oturum × 100", async () => {
    const prisma = {
      analyticsEvent: {
        // sessions: distinct sessionId — 10 oturum
        findMany: vi
          .fn()
          .mockResolvedValue(Array.from({ length: 10 }, (_, i) => ({ sessionId: "s" + i }))),
        count: vi.fn().mockResolvedValue(100), // pageViews/productViews/... ve collecting
        groupBy: vi.fn().mockResolvedValue([]),
        aggregate: vi.fn().mockResolvedValue({ _avg: { dwellMs: 4321 } }),
      },
      order: { count: vi.fn().mockResolvedValue(2) }, // 2 sipariş
      orderItem: { groupBy: vi.fn().mockResolvedValue([]) },
      product: { findMany: vi.fn().mockResolvedValue([]) },
      $queryRaw: vi.fn().mockResolvedValue([]),
    };
    const svc = new AnalyticsService(prisma as never);
    const res = await svc.overview(30);
    expect(res.kpis.sessions).toBe(10);
    expect(res.kpis.orders).toBe(2);
    expect(res.kpis.conversionRate).toBe(20); // 2/10*100
    expect(res.kpis.avgDwellMs).toBe(4321);
    // 100 event >= 5 → "veri toplanıyor" kapalı
    expect(res.collecting).toBe(false);
  });

  it("days parametresi 1-365 ile sınırlanır (geçersiz → 30)", async () => {
    const reject = vi.fn().mockRejectedValue(new Error("x"));
    const prisma = {
      analyticsEvent: { count: reject, findMany: reject, groupBy: reject, aggregate: reject },
      order: { count: reject },
      orderItem: { groupBy: reject },
      product: { findMany: reject },
      $queryRaw: reject,
    };
    const svc = new AnalyticsService(prisma as never);
    expect((await svc.overview(NaN)).range.days).toBe(30);
    expect((await svc.overview(99999)).range.days).toBe(365);
    expect((await svc.overview(7)).range.days).toBe(7);
  });
});
