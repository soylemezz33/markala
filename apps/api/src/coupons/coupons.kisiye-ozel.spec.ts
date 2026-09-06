import { describe, it, expect, vi } from "vitest";
import { CouponsService } from "./coupons.service";

/** Kişiye özel kupon + misafir→üye dönüşümü (2026-09-06, karar 1 ve 6) — validate kuralları. */
const KUPON = {
  code: "TESEKKUR-ABC234", type: "percentage", value: "10", isActive: true, validFrom: null, validUntil: null,
  maxUses: 1, usedCount: 0, minOrderAmount: "750", firstOrderOnly: false, assignedEmail: "ali@x.com",
};
function svc(over: Record<string, unknown> = {}) {
  const prisma = {
    coupon: { findUnique: vi.fn().mockResolvedValue(KUPON) },
    user: { findUnique: vi.fn().mockResolvedValue({ email: "Ali@X.com", guestConvertedAt: null }) },
    order: { count: vi.fn().mockResolvedValue(0) },
    ...over,
  };
  return { s: new CouponsService(prisma as never), prisma };
}

describe("CouponsService.validate — kişiye özel kupon", () => {
  it("atanmış e-postanın hesabıyla giriş yapan müşteri kullanabilir (büyük/küçük harf duyarsız)", async () => {
    const { s } = svc();
    const r = await s.validate("tesekkur-abc234", 1000, { userId: "u1" });
    expect(r.valid).toBe(true);
    if (r.valid) expect(r.discount).toBe(100);
  });
  it("misafir, sipariş e-postası eşleşiyorsa kullanabilir", async () => {
    const { s } = svc();
    expect((await s.validate("TESEKKUR-ABC234", 1000, { email: "ALI@x.com" })).valid).toBe(true);
  });
  it("başka müşteri reddedilir", async () => {
    const { s } = svc({ user: { findUnique: vi.fn().mockResolvedValue({ email: "veli@x.com", guestConvertedAt: null }) } });
    const r = await s.validate("TESEKKUR-ABC234", 1000, { userId: "u2" });
    expect(r.valid).toBe(false);
    if (!r.valid) expect(r.reason).toMatch(/başka bir müşteriye özel/);
  });
  it("e-posta bilgisi yoksa reddedilir", async () => {
    const { s } = svc();
    expect((await s.validate("TESEKKUR-ABC234", 1000, {})).valid).toBe(false);
  });
  it("minimum sepet (750 ₺) altında reddedilir", async () => {
    const { s } = svc();
    const r = await s.validate("TESEKKUR-ABC234", 500, { userId: "u1" });
    expect(r.valid).toBe(false);
    if (!r.valid) expect(r.reason).toMatch(/750/);
  });
});

describe("CouponsService.validate — HOSGELDIN ve misafir→üye dönüşümü (karar 6)", () => {
  const HOS = { ...KUPON, code: "HOSGELDIN", assignedEmail: null, firstOrderOnly: true, maxUses: null, minOrderAmount: null };
  it("dönüşüm tarihi varsa ondan ÖNCEKİ siparişler sayılmaz (createdAt > guestConvertedAt filtresi)", async () => {
    const donusum = new Date("2026-09-05T10:00:00Z");
    const { s, prisma } = svc({
      coupon: { findUnique: vi.fn().mockResolvedValue(HOS) },
      user: { findUnique: vi.fn().mockResolvedValue({ email: "ali@x.com", guestConvertedAt: donusum }) },
    });
    const r = await s.validate("HOSGELDIN", 1000, { userId: "u1", email: "ali@x.com" });
    expect(r.valid).toBe(true);
    const where = prisma.order.count.mock.calls[0][0].where;
    expect(where.createdAt).toEqual({ gt: donusum });
  });
  it("dönüşüm yoksa filtre eklenmez ve önceki sipariş varsa reddedilir", async () => {
    const { s, prisma } = svc({ coupon: { findUnique: vi.fn().mockResolvedValue(HOS) }, order: { count: vi.fn().mockResolvedValue(1) } });
    const r = await s.validate("HOSGELDIN", 1000, { userId: "u1" });
    expect(r.valid).toBe(false);
    expect(prisma.order.count.mock.calls[0][0].where.createdAt).toBeUndefined();
  });
});
