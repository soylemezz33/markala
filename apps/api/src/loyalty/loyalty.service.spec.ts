import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { LoyaltyService } from "./loyalty.service";

/**
 * refundForOrder + saf hesap fonksiyonları için birim testler.
 * Program bayrağı (LOYALTY_ENABLED) her testte açık; bir test kapalı davranışı doğrular.
 */
function mockPrisma(entries: Array<{ userId: string; kind: string; points: number }>, currentBalance = 1000) {
  const tx = {
    user: {
      findUnique: vi.fn().mockResolvedValue({ loyaltyPoints: currentBalance }),
      update: vi.fn().mockResolvedValue({}),
    },
    loyaltyLedger: { create: vi.fn().mockResolvedValue({}) },
  };
  return {
    _tx: tx,
    loyaltyLedger: { findMany: vi.fn().mockResolvedValue(entries) },
    $transaction: vi.fn().mockImplementation((cb: (t: typeof tx) => unknown) => cb(tx)),
  };
}

describe("LoyaltyService", () => {
  beforeEach(() => {
    process.env.LOYALTY_ENABLED = "true";
  });
  afterEach(() => {
    delete process.env.LOYALTY_ENABLED;
  });

  it("maxRedeemablePoints: bakiye, %50 tavan ve tam TL ile sınırlar", () => {
    const svc = new LoyaltyService({} as never);
    // subtotal 1000 → %50 = 500 TL = 50.000 puan; bakiye 30.000 puan (=300 TL) → min = 30.000
    expect(svc.maxRedeemablePoints(30_000, 1000)).toBe(30_000);
    // bakiye 100.000 (=1000 TL) ama %50 tavanı 500 TL = 50.000 puan → 50.000
    expect(svc.maxRedeemablePoints(100_000, 1000)).toBe(50_000);
    // bakiye 12.345 → tam TL'ye yuvarla = 12.300 (123 TL)
    expect(svc.maxRedeemablePoints(12_345, 100_000)).toBe(12_300);
  });

  it("pointsForOrderTotal: TL başına 1 puan (aşağı yuvarlar)", () => {
    const svc = new LoyaltyService({} as never);
    expect(svc.pointsForOrderTotal(1234.9)).toBe(1234);
    expect(svc.pointsForOrderTotal(0)).toBe(0);
  });

  it("refundForOrder: harcanan puanı iade eder (net +), adjust defter kaydı yazar", async () => {
    const prisma = mockPrisma([{ userId: "u1", kind: "spend", points: 500 }], 1000);
    const svc = new LoyaltyService(prisma as never);
    await svc.refundForOrder("o1");
    expect(prisma._tx.user.update).toHaveBeenCalledWith({ where: { id: "u1" }, data: { loyaltyPoints: 1500 } });
    expect(prisma._tx.loyaltyLedger.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ orderId: "o1", kind: "adjust", points: 500, balanceAfter: 1500 }),
      }),
    );
  });

  it("refundForOrder: ödenmiş-sonra-iptalde net (harcanan - kazanılan) uygular", async () => {
    // spent 500, earned 200 → net +300 → 1000+300=1300
    const prisma = mockPrisma(
      [
        { userId: "u1", kind: "spend", points: 500 },
        { userId: "u1", kind: "earn", points: 200 },
      ],
      1000,
    );
    const svc = new LoyaltyService(prisma as never);
    await svc.refundForOrder("o1");
    expect(prisma._tx.user.update).toHaveBeenCalledWith({ where: { id: "u1" }, data: { loyaltyPoints: 1300 } });
  });

  it("refundForOrder: negatif bakiyeyi önler (clamp 0)", async () => {
    // earned 500 > spent 0, mevcut bakiye 100 → net -500 → clamp 0 (applied -100)
    const prisma = mockPrisma([{ userId: "u1", kind: "earn", points: 500 }], 100);
    const svc = new LoyaltyService(prisma as never);
    await svc.refundForOrder("o1");
    expect(prisma._tx.user.update).toHaveBeenCalledWith({ where: { id: "u1" }, data: { loyaltyPoints: 0 } });
    expect(prisma._tx.loyaltyLedger.create).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ points: -100 }) }),
    );
  });

  it("refundForOrder: puan hareketi yoksa hiçbir şey yapmaz", async () => {
    const prisma = mockPrisma([]);
    const svc = new LoyaltyService(prisma as never);
    await svc.refundForOrder("o1");
    expect(prisma.$transaction).not.toHaveBeenCalled();
  });

  it("refundForOrder: program KAPALIYKEN DB'ye hiç dokunmaz", async () => {
    delete process.env.LOYALTY_ENABLED;
    const prisma = mockPrisma([{ userId: "u1", kind: "spend", points: 500 }]);
    const svc = new LoyaltyService(prisma as never);
    await svc.refundForOrder("o1");
    expect(prisma.loyaltyLedger.findMany).not.toHaveBeenCalled();
  });
});
