import { describe, it, expect } from "vitest";
import { urunSatisToplamlari, type SatisKalemi } from "./urun-satis";

const k = (
  o: Partial<SatisKalemi> & { orderId: string; gun: string },
): SatisKalemi => ({
  productId: "p1",
  productSlug: "arac-magneti-30x40",
  productName: "Araç Magneti",
  configurationSummary: "30 × 40 cm",
  quantity: 1,
  lineTotal: "719.99",
  ...o,
  order: { id: o.orderId, createdAt: new Date(o.gun) },
});

describe("ürün satış toplamları", () => {
  it("aynı siparişteki iki kalemi 1 sipariş / 2 adet sayar", () => {
    const r = urunSatisToplamlari(
      [
        k({ orderId: "A", gun: "2026-09-10" }),
        k({ orderId: "B", gun: "2026-09-22" }),
        k({ orderId: "B", gun: "2026-09-22" }),
      ],
      null,
    );
    expect(r.urunler).toHaveLength(1);
    const u = r.urunler[0];
    expect(u.siparis).toBe(2);
    expect(u.adet).toBe(3);
    expect(u.ciro).toBe(2159.97);
    expect(u.ilkSatis.slice(0, 10)).toBe("2026-09-10");
    expect(u.sonSatis.slice(0, 10)).toBe("2026-09-22");
    expect(r.siparis).toBe(2);
    expect(r.adet).toBe(3);
  });

  it("varyantları özet metnine göre ayırır ve adete göre sıralar", () => {
    const r = urunSatisToplamlari(
      [
        k({ orderId: "A", gun: "2026-09-01", configurationSummary: "20 × 30 cm", quantity: 5, lineTotal: 1800 }),
        k({ orderId: "B", gun: "2026-09-02", configurationSummary: "30 × 40 cm", quantity: 1 }),
      ],
      30,
    );
    expect(r.gunSayisi).toBe(30);
    expect(r.urunler[0].varyantlar.map((v) => v.ozet)).toEqual(["20 × 30 cm", "30 × 40 cm"]);
    expect(r.urunler[0].varyantlar[0].adet).toBe(5);
  });

  it("ürünleri adete göre sıralar; en son görülen ürün adını kullanır", () => {
    const r = urunSatisToplamlari(
      [
        k({ orderId: "A", gun: "2026-08-01", productSlug: "kartvizit", productName: "Kartvizit (eski ad)", quantity: 1 }),
        k({ orderId: "B", gun: "2026-09-01", productSlug: "kartvizit", productName: "Klasik Kartvizit", quantity: 1 }),
        k({ orderId: "C", gun: "2026-09-05", quantity: 4 }),
      ],
      null,
    );
    expect(r.urunler.map((u) => u.productSlug)).toEqual(["arac-magneti-30x40", "kartvizit"]);
    expect(r.urunler[1].productName).toBe("Klasik Kartvizit");
    expect(r.urunSayisi).toBe(2);
  });

  it("boş girdiyle sıfır döner", () => {
    const r = urunSatisToplamlari([], null);
    expect(r).toEqual({ gunSayisi: null, siparis: 0, adet: 0, ciro: 0, urunSayisi: 0, urunler: [] });
  });
});
