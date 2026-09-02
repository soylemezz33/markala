import { describe, it, expect, vi } from "vitest";
import { ProfitService } from "./profit.service";

/**
 * Kâr analizi — PARA HESABI, bu yüzden testle çakılıyor.
 *
 * 2026-09-02'de bulunan hata: ciro = Σ lineTotal ÷ 1,2 idi ve `lineTotal` SİPARİŞ
 * seviyesindeki indirimleri (kupon, kurumsal iskonto, puan, havale %5) içermiyordu.
 * Canlı veride 1.272,11 ₺ indirim yok sayılıyor, ciro ve kâr KDV hariç 1.060 ₺
 * fazla görünüyordu. Panel "Toplam Ciro 25.401,63" derken bu sayfa "20.977,28"
 * diyordu ve iki ekran çelişiyordu.
 */

function mockPrisma(opts: {
  items: unknown[];
  siparisToplam?: Record<string, unknown>;
  products?: unknown[];
}) {
  return {
    orderItem: { findMany: vi.fn().mockResolvedValue(opts.items) },
    product: { findMany: vi.fn().mockResolvedValue(opts.products ?? []) },
    order: {
      aggregate: vi.fn().mockResolvedValue(
        opts.siparisToplam ?? {
          _count: 1,
          _sum: { total: 0, subtotal: 0, discount: 0, shippingFee: 0, vat: 0 },
        },
      ),
    },
  };
}

const settings = { getPricing: vi.fn().mockResolvedValue({ marj: 1.2 }) };

/** KDV dahil 1.200 ₺ kalem → KDV hariç 1.000 ₺. */
function kalem(over: Record<string, unknown> = {}) {
  return {
    productId: "p1",
    productSlug: "kartvizit",
    productName: "Kartvizit",
    quantity: 1,
    lineTotal: 1200,
    costTotal: 400,
    configuration: null,
    order: { createdAt: new Date("2026-09-01T00:00:00Z"), discount: 0, subtotal: 1200 },
    ...over,
  };
}

describe("ProfitService — indirim ciroyu düşürür", () => {
  it("indirim yokken ciro = lineTotal ÷ 1,2", async () => {
    const prisma = mockPrisma({ items: [kalem()] });
    const svc = new ProfitService(prisma as never, settings as never);
    const r = await svc.summary();
    expect(r.toplam.ciro).toBe(1000);
    expect(r.toplam.maliyet).toBe(400);
    expect(r.toplam.kar).toBe(600);
  });

  it("sipariş indirimi cirodan DÜŞÜLÜR (asıl hata buydu)", async () => {
    // 1.200 ₺ kalem, 120 ₺ sipariş indirimi → KDV hariç ciro (1200−120)/1,2 = 900
    const prisma = mockPrisma({
      items: [kalem({ order: { createdAt: new Date("2026-09-01"), discount: 120, subtotal: 1200 } })],
    });
    const svc = new ProfitService(prisma as never, settings as never);
    const r = await svc.summary();
    expect(r.toplam.ciro).toBe(900);
    // Maliyet indirimden ETKİLENMEZ — müşteriye indirim yapmak maliyetimizi değiştirmez.
    expect(r.toplam.maliyet).toBe(400);
    expect(r.toplam.kar).toBe(500);
  });

  it("indirim kalemlere tutarı oranında dağıtılır", async () => {
    // Sipariş: 900 + 300 = 1.200 ₺, indirim 120 ₺.
    // Pahalı kaleme 90 ₺, ucuza 30 ₺ düşmeli.
    const ortak = { createdAt: new Date("2026-09-01"), discount: 120, subtotal: 1200 };
    const prisma = mockPrisma({
      items: [
        kalem({ productSlug: "a", productName: "A", lineTotal: 900, costTotal: 300, order: ortak }),
        kalem({ productSlug: "b", productName: "B", lineTotal: 300, costTotal: 100, order: ortak }),
      ],
    });
    const svc = new ProfitService(prisma as never, settings as never);
    const r = await svc.summary();
    const a = r.urunler.find((u) => u.productSlug === "a")!;
    const b = r.urunler.find((u) => u.productSlug === "b")!;
    expect(a.ciro).toBe(675); // (900 − 90) / 1,2
    expect(b.ciro).toBe(225); // (300 − 30) / 1,2
    expect(r.toplam.ciro).toBe(900);
  });

  it("ara toplam 0 ise bölme yapmaz (indirim 0 sayılır)", async () => {
    const prisma = mockPrisma({
      items: [kalem({ order: { createdAt: new Date("2026-09-01"), discount: 50, subtotal: 0 } })],
    });
    const svc = new ProfitService(prisma as never, settings as never);
    const r = await svc.summary();
    expect(Number.isFinite(r.toplam.ciro)).toBe(true);
    expect(r.toplam.ciro).toBe(1000);
  });

  it("maliyeti bilinmeyen kalem kâra KATILMAZ, ayrı raporlanır", async () => {
    const prisma = mockPrisma({ items: [kalem({ costTotal: null, productId: null })] });
    const svc = new ProfitService(prisma as never, settings as never);
    const r = await svc.summary();
    expect(r.toplam.maliyetiBilinmeyenCiro).toBe(1000);
    expect(r.toplam.kar).toBe(0);
  });
});

describe("ProfitService — mutabakat", () => {
  it("panel Toplam Ciro = ara toplam − indirim + kargo", async () => {
    const prisma = mockPrisma({
      items: [kalem()],
      siparisToplam: {
        _count: 25,
        _sum: { total: 25401.63, subtotal: 25172.74, discount: 1272.11, shippingFee: 1501, vat: 3983.43 },
      },
    });
    const svc = new ProfitService(prisma as never, settings as never);
    const r = await svc.summary();
    const m = r.mutabakat;
    expect(m.siparisSayisi).toBe(25);
    expect(m.tahsilEdilen).toBe(25401.63);
    // Panelin gösterdiği rakam bu üçünden çıkmalı — çıkmıyorsa iki ekran yine çelişir.
    expect(Math.round((m.urunAraToplam - m.indirim + m.kargo) * 100) / 100).toBe(m.tahsilEdilen);
  });
});
