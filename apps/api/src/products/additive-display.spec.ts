import { describe, it, expect, vi } from "vitest";

import { additiveStartingPrice } from "./display-price";
import { ProductsService } from "./products.service";

/**
 * 2026-09-05 REGRESYON: toplamsal ürünlerde "…₺'den başlar" MIN(price>0) ile hesaplanıyordu.
 * Birden fazla fiyatlı grubu olan üründe bu EK SEÇENEĞİN satırını yakalıyor: Makam Bayrağı
 * kategorisi "105 ₺'den başlayan" yazıyordu (saçak satırı), bayrağın kendisi 2.116,80 ₺.
 * Başlangıç fiyatı = en ucuz TAM konfigürasyon, sipariş motoruyla aynı yoldan.
 */

const opt = (groupKey: string, groupRole: "priced" | "dimension", groupSort: number, optionKey: string, optionSort: number, extra: Record<string, unknown> = {}) =>
  ({ groupKey, groupLabel: groupKey, groupRole, groupSort, optionKey, optionLabel: optionKey, optionSort, ...extra });
const row = (groupKey: string | null, optionKey: string | null, dimKey: string | null, price: number) =>
  ({ groupKey, optionKey, dimKey, price, cost: null });

// Makam Bayrağı (canlı veri, 2026-09-05): püskül "yok" seçeneğinin satırı yok → 0 katkı.
const MAKAM_OPTIONS = [
  opt("icindekiler", "priced", 0, "sadece-bayrak", 0),
  opt("icindekiler", "priced", 0, "krom-direk", 1),
  opt("icindekiler", "priced", 0, "gold-direk", 2),
  opt("puskul", "priced", 1, "yok", 0),
  opt("puskul", "priced", 1, "sarmasi", 1),
  opt("puskul", "priced", 1, "metalik", 2),
];
const MAKAM_ROWS = [
  row("icindekiler", "sadece-bayrak", null, 2116.8),
  row("icindekiler", "krom-direk", null, 3528),
  row("icindekiler", "gold-direk", null, 3880.8),
  row("puskul", "sarmasi", null, 105),
  row("puskul", "metalik", null, 105),
];

describe("additiveStartingPrice — toplamsal ürün başlangıç fiyatı", () => {
  it("Makam Bayrağı: saçak satırına (105) değil, en ucuz tam konfigürasyona (2.116,80) iner", () => {
    expect(additiveStartingPrice(MAKAM_OPTIONS, MAKAM_ROWS)).toBe(2116.8);
  });

  it("satırsız 'yok' seçeneği olmayan ek grupta en ucuz ek seçenek toplama girer", () => {
    const opts = MAKAM_OPTIONS.filter((o) => o.optionKey !== "yok");
    expect(additiveStartingPrice(opts, MAKAM_ROWS)).toBe(2116.8 + 105);
  });

  it("tek fiyatlı grup: eski davranışla aynı (min pozitif satır)", () => {
    const opts = [opt("malzeme", "priced", 0, "a", 0), opt("malzeme", "priced", 0, "b", 1)];
    const rows = [row("malzeme", "a", null, 450), row("malzeme", "b", null, 150)];
    expect(additiveStartingPrice(opts, rows)).toBe(150);
  });

  it("matris ürün (kartvizit): adet fiyat-boyutudur, en ucuz paket × en ucuz adet kademesi", () => {
    const opts = [
      opt("adet", "dimension", 0, "1000", 0),
      opt("adet", "dimension", 0, "500", 1),
      opt("paket", "priced", 1, "standart", 0),
      opt("paket", "priced", 1, "premium", 1),
    ];
    const rows = [
      row("paket", "standart", "1000", 480), row("paket", "standart", "500", 350),
      row("paket", "premium", "1000", 900), row("paket", "premium", "500", 700),
    ];
    expect(additiveStartingPrice(opts, rows)).toBe(350);
  });

  it("İSG levhası: ebat fiyat-boyutu, adet çarpanı EN KÜÇÜK adet (1 adet), malzeme+baskı toplanır", () => {
    const opts = [
      opt("ebat", "dimension", 0, "25x35", 0),
      opt("ebat", "dimension", 0, "35x50", 1),
      opt("adet", "dimension", 1, "10", 1),
      opt("adet", "dimension", 1, "1", 0),
      opt("malzeme", "priced", 2, "dekota", 0),
      opt("malzeme", "priced", 2, "aluminyum", 1),
      opt("baski", "priced", 3, "dijital", 0),
    ];
    const rows = [
      row("malzeme", "dekota", "25x35", 60), row("malzeme", "dekota", "35x50", 110),
      row("malzeme", "aluminyum", "25x35", 90), row("malzeme", "aluminyum", "35x50", 160),
      row("baski", "dijital", "25x35", 20), row("baski", "dijital", "35x50", 30),
    ];
    // 25x35 dekota + dijital = 80, ×1 adet, hacim indirimi yok
    expect(additiveStartingPrice(opts, rows)).toBe(80);
  });

  it("kilitli grup her konfigürasyona zorunlu eklenir (Ayaklı Dekota ayak ücreti deseni)", () => {
    const opts = [
      opt("malzeme", "priced", 0, "7mm", 0),
      opt("ayak", "priced", 1, "cift-ayak", 0, { locked: true }),
      opt("ayak", "priced", 1, "tek-ayak", 1, { locked: true }),
    ];
    const rows = [row("malzeme", "7mm", null, 1000), row("ayak", "cift-ayak", null, 400), row("ayak", "tek-ayak", null, 200)];
    // locked → optionSort en küçük (cift-ayak) zorlanır; tek-ayak seçilemez
    expect(additiveStartingPrice(opts, rows)).toBe(1400);
  });

  it("gruplu seçenek yok, tek satır: satır fiyatı", () => {
    expect(additiveStartingPrice([], [row(null, null, null, 250)])).toBe(250);
  });

  it("hiç pozitif satır yok → null (Teklif Al)", () => {
    expect(additiveStartingPrice(MAKAM_OPTIONS, [row("icindekiler", "sadece-bayrak", null, 0)])).toBeNull();
  });
});

describe("findBySlug — toplamsal üründe displayPrice tam konfigürasyondur", () => {
  it("makam-bayragi-puskullu → 2116.8", async () => {
    const prisma = {
      product: {
        findUnique: vi.fn().mockResolvedValue({
          id: "m1", slug: "makam-bayragi-puskullu", pricingMode: "additive",
          options: MAKAM_OPTIONS, prices: MAKAM_ROWS,
        }),
        findMany: vi.fn().mockResolvedValue([]),
      },
    };
    const settings = { getPricing: vi.fn() };
    const s = new ProductsService(prisma as never, settings as never);
    const r = (await s.findBySlug("makam-bayragi-puskullu")) as { displayPrice: number };
    expect(r.displayPrice).toBe(2116.8);
    expect(settings.getPricing).not.toHaveBeenCalled();
  });
});
