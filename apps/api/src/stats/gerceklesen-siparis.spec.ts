import { describe, it, expect, vi } from "vitest";
import { GERCEKLESEN_SIPARIS, gerceklesenSiparis } from "./gerceklesen-siparis";
import { StatsService } from "./stats.service";
import { ProfitService } from "./profit.service";

/**
 * Panel ile kâr analizi AYNI sipariş kümesini saymalı.
 *
 * 2026-09-02'de üç ayrı tanım vardı ve canlı veride çelişiyorlardı: panel
 * "26 sipariş / 25.401,63 ₺" gösteriyordu — sayı iptal edilmiş 529 ₺'lik bir
 * siparişi içeriyor, ciro içermiyordu. Ayrıca ciro cari (açık hesap) siparişlerini
 * hiç saymıyordu. Bu test tanımın tekrar kopyalanıp ayrışmasını engeller.
 */
describe("gerçekleşen sipariş tanımı", () => {
  it("iptal edilmiş siparişi DIŞLAR", () => {
    expect(GERCEKLESEN_SIPARIS.status).toEqual({ not: "iptal_edildi" });
  });

  it("silinmiş siparişi DIŞLAR", () => {
    expect(GERCEKLESEN_SIPARIS.deletedAt).toBeNull();
  });

  it("ödemesi başarılı VEYA cari siparişi sayar", () => {
    expect(GERCEKLESEN_SIPARIS.OR).toEqual([
      { paymentStatus: "basarili" },
      { paymentMethod: "cari" },
    ]);
  });

  it("tarih aralığı eklendiğinde diğer koşullar korunur", () => {
    const t = new Date("2026-08-01");
    const f = gerceklesenSiparis(t);
    expect(f.createdAt).toEqual({ gte: t });
    expect(f.status).toEqual({ not: "iptal_edildi" });
    expect(f.OR).toEqual(GERCEKLESEN_SIPARIS.OR);
  });

  it("tarih verilmezse createdAt koşulu EKLENMEZ", () => {
    expect(gerceklesenSiparis(undefined).createdAt).toBeUndefined();
  });
});

describe("panel ve kâr analizi aynı kümeyi sayar", () => {
  it("StatsService sipariş sayısı ve cirosu AYNI filtreyi kullanır", async () => {
    const count = vi.fn().mockResolvedValue(25);
    const aggregate = vi.fn().mockResolvedValue({ _sum: { total: 25401.63 } });
    const prisma = {
      order: { count, aggregate, groupBy: vi.fn().mockResolvedValue([]) },
      user: { count: vi.fn().mockResolvedValue(0) },
      corporateApplication: { count: vi.fn().mockResolvedValue(0) },
      contactMessage: { count: vi.fn().mockResolvedValue(0) },
      quoteRequest: { count: vi.fn().mockResolvedValue(0) },
      review: { count: vi.fn().mockResolvedValue(0) },
    };
    await new StatsService(prisma as never, { get: () => undefined } as never).summary();

    // İlk count çağrısı = sipariş sayısı; aggregate = ciro. İkisinin where'i AYNI olmalı.
    const sayimWhere = count.mock.calls[0][0].where;
    const ciroWhere = aggregate.mock.calls[0][0].where;
    expect(sayimWhere).toBe(ciroWhere);
    expect(sayimWhere).toEqual(GERCEKLESEN_SIPARIS);
  });

  it("ProfitService de aynı tanımı kullanır", async () => {
    const findMany = vi.fn().mockResolvedValue([]);
    const prisma = {
      orderItem: { findMany },
      product: { findMany: vi.fn().mockResolvedValue([]) },
      order: {
        aggregate: vi.fn().mockResolvedValue({
          _count: 0,
          _sum: { total: 0, subtotal: 0, discount: 0, shippingFee: 0, vat: 0 },
        }),
      },
    };
    await new ProfitService(prisma as never, {
      getPricing: vi.fn().mockResolvedValue({ marj: 1.2 }),
    } as never).summary();

    expect(findMany.mock.calls[0][0].where.order).toEqual(GERCEKLESEN_SIPARIS);
  });
});
