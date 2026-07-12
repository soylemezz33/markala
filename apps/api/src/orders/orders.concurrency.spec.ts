import { describe, it, expect, vi } from "vitest";
import { BadRequestException, ConflictException } from "@nestjs/common";
import { OrdersService } from "./orders.service";

/**
 * EŞZAMANLILIK / IDEMPOTENCY testleri (audit batch-C).
 *
 * Kapsam:
 *  - Cari (B2B açık hesap) kredi limiti kontrolü transaction İÇİNDE, kilitli bakiye ile yapılır.
 *    → Limit aşan sipariş, debit yazılmadan ÖNCE (transaction içinde) reddedilir.
 *  - assertCariLimitWithinTx kullanıcı satırını FOR UPDATE ile kilitler (serileştirme).
 *  - Kupon maxUses yarışı: transaction içindeki koşullu updateMany count===0 → ConflictException.
 *
 * NOT: Bu testler gerçek DB yarışını simüle edemez (mock); ancak kontrol-ve-yazma'nın
 * AYNI transaction içinde, kilit alındıktan SONRA ve KİLİTLİ bakiye ile yapıldığını kanıtlar.
 * Gerçek serileştirme PostgreSQL'in FOR UPDATE + transaction izolasyonuyla sağlanır.
 */

const BASE_PRODUCT = {
  id: "p1",
  slug: "kartvizit",
  name: "Kartvizit",
  basePrice: 290,
  images: ["img.jpg"],
  isActive: true,
  options: [],
  prices: [{ groupKey: null, optionKey: null, dimKey: null, price: "290" }],
};

const CORPORATE_USER = {
  accountType: "corporate",
  corporateStatus: "approved",
  corporateDiscount: 0,
  corporateCreditLimit: "1000", // 1000₺ kredi limiti
  corporatePaymentTermDays: 30,
};

function makeParasut() {
  return { createInvoiceFromOrder: vi.fn().mockResolvedValue({ invoiceId: "", status: "skipped" }) };
}
function makeSettings() {
  return { getShipping: vi.fn().mockResolvedValue({ fee: 0, freeThreshold: 0 }) }; // kargo karışmasın
}

/**
 * Cari akış için zengin transaction mock'u: order.create, corporateLedgerEntry.{groupBy,create},
 * $queryRaw (kilit) ve coupon. groupBy değeri ledgerBalance ile bakiyeyi (borç−tahsilat) kontrol eder.
 */
function makeCariTx(opts: { debitSum?: number; creditSum?: number } = {}) {
  const debit = opts.debitSum ?? 0;
  const credit = opts.creditSum ?? 0;
  return {
    $queryRaw: vi.fn().mockResolvedValue([{ id: "user-1" }]),
    coupon: {
      findUnique: vi.fn().mockResolvedValue({ id: "cp1", isActive: true, maxUses: null, usedCount: 0 }),
      updateMany: vi.fn().mockResolvedValue({ count: 1 }),
    },
    corporateLedgerEntry: {
      groupBy: vi.fn().mockResolvedValue([
        { kind: "debit", _sum: { amount: debit } },
        { kind: "credit", _sum: { amount: credit } },
      ]),
      create: vi.fn().mockResolvedValue({ id: "le1" }),
    },
    order: {
      create: vi.fn().mockResolvedValue({ id: "ord1", orderNumber: "MK-CARI-1", items: [] }),
    },
  };
}

function makeCariPrisma(tx: ReturnType<typeof makeCariTx>) {
  return {
    order: {
      findFirst: vi.fn().mockResolvedValue(null),
    },
    address: { findFirst: vi.fn().mockResolvedValue({ id: "addr1" }) },
    product: { findMany: vi.fn().mockResolvedValue([BASE_PRODUCT]) },
    coupon: { findUnique: vi.fn().mockResolvedValue(null) },
    user: { findUnique: vi.fn().mockResolvedValue(CORPORATE_USER) },
    campaignPackage: { findMany: vi.fn().mockResolvedValue([]) },
    $transaction: vi.fn().mockImplementation((fn: (t: typeof tx) => Promise<unknown>) => fn(tx)),
    _tx: tx,
  };
}

const CARI_INPUT = {
  userId: "user-1",
  email: "kurumsal@markala.test",
  phone: "05001234567",
  items: [{ productId: "p1", configuration: {}, quantity: 1 }], // 290₺
  shippingAddressId: "addr1",
  billingAddressId: "addr1",
  paymentMethod: "cari",
};

describe("OrdersService.create — cari kredi limiti ATOMİK kontrol (transaction içinde)", () => {
  it("limit dahilinde cari sipariş: bakiye kontrolü tx içinde geçer, debit yazılır", async () => {
    // Mevcut borç 0, yeni sipariş 290 → 290 ≤ 1000 limit → kabul.
    const tx = makeCariTx({ debitSum: 0, creditSum: 0 });
    const prisma = makeCariPrisma(tx);
    const svc = new OrdersService(prisma as never, makeParasut() as never, makeSettings() as never, { sendOrderConfirmationEmail: vi.fn().mockResolvedValue(true), sendOrderShippedEmail: vi.fn().mockResolvedValue(true), sendOrderDeliveredEmail: vi.fn().mockResolvedValue(true) } as never, { isEnabled: () => false } as never);

    await svc.create(CARI_INPUT);

    // Bakiye transaction İÇİNDEN okundu (tx.corporateLedgerEntry.groupBy çağrıldı).
    expect(tx.corporateLedgerEntry.groupBy).toHaveBeenCalled();
    // Kullanıcı satırı kilitlendi (FOR UPDATE).
    expect(tx.$queryRaw).toHaveBeenCalled();
    // Sipariş + debit defter kaydı oluşturuldu.
    expect(tx.order.create).toHaveBeenCalledOnce();
    expect(tx.corporateLedgerEntry.create).toHaveBeenCalledOnce();
    const debitData = tx.corporateLedgerEntry.create.mock.calls[0][0].data;
    expect(debitData.kind).toBe("debit");
    expect(Number(debitData.amount)).toBeCloseTo(290, 2);
  });

  it("limit aşan cari sipariş tx İÇİNDE reddedilir; sipariş/debit OLUŞTURULMAZ", async () => {
    // Mevcut borç 800, yeni sipariş 290 → 1090 > 1000 limit → red.
    const tx = makeCariTx({ debitSum: 800, creditSum: 0 });
    const prisma = makeCariPrisma(tx);
    const svc = new OrdersService(prisma as never, makeParasut() as never, makeSettings() as never, { sendOrderConfirmationEmail: vi.fn().mockResolvedValue(true), sendOrderShippedEmail: vi.fn().mockResolvedValue(true), sendOrderDeliveredEmail: vi.fn().mockResolvedValue(true) } as never, { isEnabled: () => false } as never);

    await expect(svc.create(CARI_INPUT)).rejects.toBeInstanceOf(BadRequestException);

    // KRİTİK: kontrol order.create'ten ÖNCE çalıştığı için ne sipariş ne debit yazıldı.
    expect(tx.order.create).not.toHaveBeenCalled();
    expect(tx.corporateLedgerEntry.create).not.toHaveBeenCalled();
    // Kilit yine de alındı (serileştirme garantisi).
    expect(tx.$queryRaw).toHaveBeenCalled();
  });

  it("kontrol KİLİTLİ (tx içi) bakiye ile yapılır — kilit, bakiye okumasından ÖNCE çağrılır", async () => {
    const tx = makeCariTx({ debitSum: 0, creditSum: 0 });
    const order: string[] = [];
    tx.$queryRaw.mockImplementation(async () => {
      order.push("lock");
      return [{ id: "user-1" }];
    });
    tx.corporateLedgerEntry.groupBy.mockImplementation(async () => {
      order.push("balance");
      return [
        { kind: "debit", _sum: { amount: 0 } },
        { kind: "credit", _sum: { amount: 0 } },
      ];
    });
    const prisma = makeCariPrisma(tx);
    const svc = new OrdersService(prisma as never, makeParasut() as never, makeSettings() as never, { sendOrderConfirmationEmail: vi.fn().mockResolvedValue(true), sendOrderShippedEmail: vi.fn().mockResolvedValue(true), sendOrderDeliveredEmail: vi.fn().mockResolvedValue(true) } as never, { isEnabled: () => false } as never);

    await svc.create(CARI_INPUT);

    // Önce kilit, sonra bakiye okuması (FOR UPDATE → serileştirilmiş okuma).
    expect(order).toEqual(["lock", "balance"]);
  });

  it("kredi limiti null (sınırsız) ise kilit/bakiye kontrolü atlanır, sipariş geçer", async () => {
    const tx = makeCariTx({ debitSum: 999999, creditSum: 0 });
    const prisma = makeCariPrisma(tx);
    prisma.user.findUnique.mockResolvedValue({ ...CORPORATE_USER, corporateCreditLimit: null });
    const svc = new OrdersService(prisma as never, makeParasut() as never, makeSettings() as never, { sendOrderConfirmationEmail: vi.fn().mockResolvedValue(true), sendOrderShippedEmail: vi.fn().mockResolvedValue(true), sendOrderDeliveredEmail: vi.fn().mockResolvedValue(true) } as never, { isEnabled: () => false } as never);

    await svc.create(CARI_INPUT);

    // Limit yok → kilit ve bakiye okuması gereksiz, atlanır.
    expect(tx.$queryRaw).not.toHaveBeenCalled();
    expect(tx.corporateLedgerEntry.groupBy).not.toHaveBeenCalled();
    // Sipariş + debit yine de yazılır (cari hesap).
    expect(tx.order.create).toHaveBeenCalledOnce();
    expect(tx.corporateLedgerEntry.create).toHaveBeenCalledOnce();
  });
});

describe("OrdersService.create — kupon maxUses yarışı (atomik updateMany guard)", () => {
  const COUPON = {
    id: "cp1",
    code: "LIMIT1",
    isActive: true,
    validFrom: null,
    validUntil: null,
    maxUses: 1,
    usedCount: 0,
    minOrderAmount: null,
    type: "percentage",
    value: "10",
  };

  it("updateMany count===0 (kupon az önce doldu) → ConflictException, sipariş açılmaz", async () => {
    const tx = makeCariTx();
    // Kupon tx içinde hâlâ geçerli görünür (findUnique) AMA updateMany 0 satır günceller
    // (başka eşzamanlı sipariş hakkı tükettiği için) → yarış kapanışı.
    tx.coupon.findUnique.mockResolvedValue({ id: "cp1", isActive: true, maxUses: 1, usedCount: 0 });
    tx.coupon.updateMany.mockResolvedValue({ count: 0 });
    const prisma = makeCariPrisma(tx);
    prisma.coupon.findUnique.mockResolvedValue(COUPON);
    prisma.user.findUnique.mockResolvedValue(null); // normal müşteri (cari yok)
    const svc = new OrdersService(prisma as never, makeParasut() as never, makeSettings() as never, { sendOrderConfirmationEmail: vi.fn().mockResolvedValue(true), sendOrderShippedEmail: vi.fn().mockResolvedValue(true), sendOrderDeliveredEmail: vi.fn().mockResolvedValue(true) } as never, { isEnabled: () => false } as never);

    await expect(
      svc.create({
        userId: "user-1",
        email: "m@markala.test",
        phone: "05001234567",
        items: [{ productId: "p1", configuration: {}, quantity: 1 }],
        shippingAddressId: "addr1",
        billingAddressId: "addr1",
        couponCode: "LIMIT1",
      }),
    ).rejects.toBeInstanceOf(ConflictException);

    // Koşullu updateMany guard: usedCount < maxUses koşuluyla çalıştı.
    expect(tx.coupon.updateMany).toHaveBeenCalledOnce();
    const where = tx.coupon.updateMany.mock.calls[0][0].where;
    expect(where.usedCount).toEqual({ lt: 1 });
    // Yarış kaybeden istek siparişi AÇMAZ.
    expect(tx.order.create).not.toHaveBeenCalled();
  });
});
