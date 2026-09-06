import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { RetentionService } from "./retention.service";

/**
 * RetentionService — mock Prisma/Mail/Loyalty ile akış testleri (2026-09-06 ortak kararları).
 * Saf kurallar sadakat-kurallari.spec.ts'te; burada DB yazımı, mail çağrısı ve idempotens sırası.
 */
const H = 3_600_000;
const now = new Date("2026-09-10T12:00:00Z");

function makePrisma(over: Record<string, unknown> = {}) {
  return {
    order: {
      findMany: vi.fn().mockResolvedValue([]),
      count: vi.fn().mockResolvedValue(1),
      updateMany: vi.fn().mockResolvedValue({ count: 1 }),
      update: vi.fn().mockResolvedValue({}),
    },
    coupon: {
      create: vi.fn().mockResolvedValue({}),
      findUnique: vi.fn().mockResolvedValue(null),
      update: vi.fn().mockResolvedValue({}),
    },
    user: { findMany: vi.fn().mockResolvedValue([]), updateMany: vi.fn().mockResolvedValue({ count: 1 }) },
    ...over,
  };
}
function makeMail() {
  return {
    sendIkinciSiparisKuponEmail: vi.fn().mockResolvedValue(true),
    sendTekrarSiparisEmail: vi.fn().mockResolvedValue(true),
    sendPuanSuresiEmail: vi.fn().mockResolvedValue(true),
  };
}
function makeLoyalty(enabled = true) {
  return { isEnabled: () => enabled, expireForUser: vi.fn().mockResolvedValue(undefined) };
}
const teslim = (saatOnce: number, over: Record<string, unknown> = {}) => ({
  id: "o1", email: "Ali@X.com", userId: "u1", deliveredAt: new Date(now.getTime() - saatOnce * H),
  retentionMailStage: 0, retentionCouponCode: null, marketingConsent: true, user: { marketingConsent: false }, ...over,
});

describe("RetentionService.runIkinciSiparis (karar 1)", () => {
  it("aşama 1: kişiye özel kupon oluşturur (%10, 750 ₺, tek kullanım, 21 gün, küçük harf e-posta), mail atar, aşamayı 1 yapar", async () => {
    const prisma = makePrisma(); prisma.order.findMany.mockResolvedValue([teslim(30)]);
    const mail = makeMail();
    const svc = new RetentionService(prisma as never, mail as never, makeLoyalty() as never);
    const r = await svc.runIkinciSiparis(now);
    expect(r.kod).toBe(1);
    const data = prisma.coupon.create.mock.calls[0][0].data;
    expect(data).toMatchObject({ type: "percentage", value: 10, minOrderAmount: 750, maxUses: 1, isActive: true, assignedEmail: "ali@x.com" });
    expect(data.code).toMatch(/^TESEKKUR-[A-Z2-9]{6}$/);
    expect((data.validUntil.getTime() - now.getTime()) / 86_400_000).toBeCloseTo(21, 5);
    expect(mail.sendIkinciSiparisKuponEmail).toHaveBeenCalledWith("o1", data.code, data.validUntil, 1);
    expect(prisma.order.updateMany).toHaveBeenCalledWith({ where: { id: "o1", retentionMailStage: { lt: 1 } }, data: { retentionMailStage: 1, retentionCouponCode: data.code } });
  });

  it("mail gönderilemezse kupon pasife alınır, aşama ilerlemez (sonraki saat yeniden dener)", async () => {
    const prisma = makePrisma(); prisma.order.findMany.mockResolvedValue([teslim(30)]);
    const mail = makeMail(); mail.sendIkinciSiparisKuponEmail.mockResolvedValue(false);
    const svc = new RetentionService(prisma as never, mail as never, makeLoyalty() as never);
    const r = await svc.runIkinciSiparis(now);
    expect(r.kod).toBe(0);
    expect(prisma.coupon.update).toHaveBeenCalledWith(expect.objectContaining({ data: { isActive: false } }));
    expect(prisma.order.updateMany).not.toHaveBeenCalled();
  });

  it("aşama 2: 72 saat sonra kod kullanılmadıysa hatırlatma; kullanıldıysa hiçbir şey", async () => {
    const prisma = makePrisma();
    prisma.order.findMany.mockResolvedValue([teslim(80, { retentionMailStage: 1, retentionCouponCode: "TESEKKUR-ABC234" })]);
    prisma.coupon.findUnique.mockResolvedValue({ usedCount: 0, validUntil: new Date("2026-09-30T00:00:00Z") });
    const mail = makeMail();
    const svc = new RetentionService(prisma as never, mail as never, makeLoyalty() as never);
    expect((await svc.runIkinciSiparis(now)).hatirlatma).toBe(1);
    expect(mail.sendIkinciSiparisKuponEmail).toHaveBeenCalledWith("o1", "TESEKKUR-ABC234", new Date("2026-09-30T00:00:00Z"), 2);
    expect(prisma.order.updateMany).toHaveBeenCalledWith({ where: { id: "o1", retentionMailStage: { lt: 2 } }, data: { retentionMailStage: 2 } });

    prisma.coupon.findUnique.mockResolvedValue({ usedCount: 1, validUntil: null });
    mail.sendIkinciSiparisKuponEmail.mockClear();
    expect((await svc.runIkinciSiparis(now)).hatirlatma).toBe(0);
    expect(mail.sendIkinciSiparisKuponEmail).not.toHaveBeenCalled();
  });

  it("pazarlama izni yoksa veya ilk sipariş değilse 9 yazılır, mail gitmez", async () => {
    const prisma = makePrisma();
    prisma.order.findMany.mockResolvedValue([teslim(30, { marketingConsent: false }), teslim(30, { id: "o2" })]);
    prisma.order.count.mockResolvedValueOnce(1).mockResolvedValueOnce(3); // o2: 3. sipariş
    const mail = makeMail();
    const svc = new RetentionService(prisma as never, mail as never, makeLoyalty() as never);
    const r = await svc.runIkinciSiparis(now);
    expect(r.uygunDegil).toBe(2);
    expect(mail.sendIkinciSiparisKuponEmail).not.toHaveBeenCalled();
    expect(prisma.coupon.create).not.toHaveBeenCalled();
  });

  it("kullanıcı hesabındaki pazarlama izni de yeterlidir (sipariş izinsiz, hesap izinli)", async () => {
    const prisma = makePrisma(); prisma.order.findMany.mockResolvedValue([teslim(30, { marketingConsent: false, user: { marketingConsent: true } })]);
    const svc = new RetentionService(prisma as never, makeMail() as never, makeLoyalty() as never);
    expect((await svc.runIkinciSiparis(now)).kod).toBe(1);
  });
});

describe("RetentionService.runTekrarSiparis (karar 5)", () => {
  const kalem = (slug: string, kategori: string) => ({ productSlug: slug, productName: slug, product: { category: { slug: kategori } } });
  it("döngüsü gelen ilk (en değerli) ürün için tek mail, sipariş işaretlenir", async () => {
    const prisma = makePrisma();
    prisma.order.findMany.mockResolvedValue([{ ...teslim(24 * 95), items: [kalem("kup", "kupa"), kalem("kv", "kartvizit")] }]);
    const mail = makeMail();
    const svc = new RetentionService(prisma as never, mail as never, makeLoyalty() as never);
    expect((await svc.runTekrarSiparis(now)).sent).toBe(1);
    expect(mail.sendTekrarSiparisEmail).toHaveBeenCalledWith("o1", { productSlug: "kv", productName: "kv" });
    expect(prisma.order.update).toHaveBeenCalledWith({ where: { id: "o1" }, data: { reorderMailSentAt: now } });
  });
  it("aynı e-postaya aynı turda tek mail; izinsiz müşteriye hiç", async () => {
    const prisma = makePrisma();
    prisma.order.findMany.mockResolvedValue([
      { ...teslim(24 * 95), items: [kalem("kv", "kartvizit")] },
      { ...teslim(24 * 92, { id: "o2", email: "ALI@x.com" }), items: [kalem("kv", "kartvizit")] },
      { ...teslim(24 * 92, { id: "o3", email: "b@x.com", marketingConsent: false, user: null }), items: [kalem("kv", "kartvizit")] },
    ]);
    const mail = makeMail();
    const svc = new RetentionService(prisma as never, mail as never, makeLoyalty() as never);
    expect((await svc.runTekrarSiparis(now)).sent).toBe(1);
    expect(mail.sendTekrarSiparisEmail).toHaveBeenCalledTimes(1);
  });
  it("döngüsü gelmemişse mail yok, sipariş işaretlenmez (sonraki gün yeniden bakılır)", async () => {
    const prisma = makePrisma();
    prisma.order.findMany.mockResolvedValue([{ ...teslim(24 * 30), items: [kalem("kv", "kartvizit")] }]);
    const svc = new RetentionService(prisma as never, makeMail() as never, makeLoyalty() as never);
    expect((await svc.runTekrarSiparis(now)).sent).toBe(0);
    expect(prisma.order.update).not.toHaveBeenCalled();
  });
});

describe("RetentionService.runPuanSuresi (karar 2)", () => {
  const kul = (kalanGun: number, stage = 0, over: Record<string, unknown> = {}) => ({
    id: "u1", email: "a@x.com", fullName: "Ayşe", loyaltyPoints: 500, loyaltyExpiryMailStage: stage,
    loyaltyExpiresAt: new Date(now.getTime() + kalanGun * 86_400_000), marketingConsent: true, ...over,
  });
  it("30 gün kala hatırlatma 1, 7 gün kala hatırlatma 2, aşama kaydedilir", async () => {
    const prisma = makePrisma(); prisma.user.findMany.mockResolvedValue([kul(25), kul(5, 1, { id: "u2" })]);
    const mail = makeMail();
    const svc = new RetentionService(prisma as never, mail as never, makeLoyalty() as never);
    const r = await svc.runPuanSuresi(now);
    expect(r).toEqual({ hatirlatma1: 1, hatirlatma2: 1, sifirlanan: 0 });
    expect(mail.sendPuanSuresiEmail).toHaveBeenCalledWith("a@x.com", "Ayşe", 500, expect.any(Date), 1);
    expect(prisma.user.updateMany).toHaveBeenCalledWith({ where: { id: "u1", loyaltyExpiryMailStage: { lt: 1 } }, data: { loyaltyExpiryMailStage: 1 } });
  });
  it("süre dolunca bakiye sıfırlanır (izinden bağımsız), hatırlatma izinsize gitmez", async () => {
    const prisma = makePrisma(); prisma.user.findMany.mockResolvedValue([kul(-1, 2, { marketingConsent: false }), kul(20, 0, { id: "u2", marketingConsent: false })]);
    const mail = makeMail(); const loyalty = makeLoyalty();
    const svc = new RetentionService(prisma as never, mail as never, loyalty as never);
    const r = await svc.runPuanSuresi(now);
    expect(r).toEqual({ hatirlatma1: 0, hatirlatma2: 0, sifirlanan: 1 });
    expect(loyalty.expireForUser).toHaveBeenCalledWith("u1");
    expect(mail.sendPuanSuresiEmail).not.toHaveBeenCalled();
  });
  it("program kapalıysa hiçbir şey yapmaz", async () => {
    const prisma = makePrisma(); prisma.user.findMany.mockResolvedValue([kul(-1)]);
    const loyalty = makeLoyalty(false);
    const svc = new RetentionService(prisma as never, makeMail() as never, loyalty as never);
    await svc.runPuanSuresi(now);
    expect(loyalty.expireForUser).not.toHaveBeenCalled();
    expect(prisma.user.findMany).not.toHaveBeenCalled();
  });
});
