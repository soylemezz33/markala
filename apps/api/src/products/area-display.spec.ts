import { describe, it, expect, vi } from "vitest";

// computeAreaPrice gerçek motordur; mock YOK — regresyon gerçek hesapla doğrulanır.
import { ProductsService } from "./products.service";

/**
 * 2026-08-28 REGRESYON: ürünlere "Ek İşlem" grubu eklenince m² başlangıç fiyatı
 * ek işlemin fiyatına düşüyordu (Pleksi 3.175 ₺ → 177 ₺). Başlangıç fiyatı yalnız
 * BİRİNCİL malzeme grubundan hesaplanmalı.
 */
const PRICING = { kur: 49, marj: 1.2, kdv: 0.2, minM2: 1 };

function svc(product: Record<string, unknown>) {
  const prisma = {
    product: {
      findUnique: vi.fn().mockResolvedValue(product),
      findMany: vi.fn().mockResolvedValue([]),
    },
  };
  const settings = { getPricing: vi.fn().mockResolvedValue(PRICING) };
  return new ProductsService(prisma as never, settings as never);
}

const PLEKSI = {
  id: "p1", slug: "pleksi-baski", pricingMode: "area",
  options: [
    { groupKey: "malzeme", groupRole: "priced", groupSort: 0, optionKey: "3mm", rules: { effect: "perM2", birim: "dolar" } },
    { groupKey: "ekislem", groupRole: "priced", groupSort: 5, optionKey: "cnc", rules: { effect: "perM2", birim: "dolar" } },
  ],
  prices: [
    { groupKey: "malzeme", optionKey: "3mm", dimKey: null, price: 0, cost: 45 },
    { groupKey: "ekislem", optionKey: "cnc", dimKey: null, price: 0, cost: 2.5 },
  ],
};

describe("m² başlangıç fiyatı — ek işlem grubu adaya girmez", () => {
  it("ana malzemeden hesaplar, CNC kesime düşmez", async () => {
    const s = svc(PLEKSI);
    const r = (await s.findBySlug("pleksi-baski")) as { displayPrice: number };
    // 45 $ × 49 kur = 2.205,00 — fiyat satırı KDV DAHİL son satış tutar, marj/KDV EKLENMEZ (2026-09-01)
    expect(r.displayPrice).toBeCloseTo(2205, 1);
    expect(r.displayPrice).not.toBeCloseTo(122.5, 1); // CNC kesimin fiyatı (2,50 $ × 49)
  });

  it("ek işlem grubu YOKSA sonuç değişmez", async () => {
    const s = svc({ ...PLEKSI, options: [PLEKSI.options[0]], prices: [PLEKSI.prices[0]] });
    const r = (await s.findBySlug("pleksi-baski")) as { displayPrice: number };
    expect(r.displayPrice).toBeCloseTo(2205, 1);
  });

  // 2026-09-04: Ayaklı Dekota — kilitli "ayak" grubu (perPiece, TL 400) her siparişe otomatik
  // eklenir; başlangıç fiyatı da onu içermeli (kart 564 yerine 964 göstermeli).
  it("KİLİTLİ perPiece grubu başlangıç fiyatına dahil edilir", async () => {
    const AYAKLI = {
      ...PLEKSI, slug: "ayakli",
      options: [
        ...PLEKSI.options,
        { groupKey: "ayak", groupRole: "priced", groupSort: 3, optionKey: "cift-ayak", optionSort: 0, locked: true, rules: { effect: "perPiece", birim: "tl" } },
      ],
      prices: [...PLEKSI.prices, { groupKey: "ayak", optionKey: "cift-ayak", dimKey: null, price: 0, cost: 400 }],
    };
    const s = svc(AYAKLI);
    const r = (await s.findBySlug("ayakli")) as { displayPrice: number };
    expect(r.displayPrice).toBeCloseTo(2205 + 400, 1);
  });

  it("kilitli OLMAYAN ek grup başlangıç fiyatına girmez (mevcut davranış)", async () => {
    const s = svc({ ...PLEKSI, options: [...PLEKSI.options, { groupKey: "ayak", groupRole: "priced", groupSort: 3, optionKey: "cift-ayak", optionSort: 0, locked: false, rules: { effect: "perPiece", birim: "tl" } }], prices: [...PLEKSI.prices, { groupKey: "ayak", optionKey: "cift-ayak", dimKey: null, price: 0, cost: 400 }] });
    const r = (await s.findBySlug("pleksi-baski")) as { displayPrice: number };
    expect(r.displayPrice).toBeCloseTo(2205, 1);
  });
});
