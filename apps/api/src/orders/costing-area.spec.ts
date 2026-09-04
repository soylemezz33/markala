import { describe, it, expect } from "vitest";
import { computeItemCostTotal } from "./costing";

/**
 * AREA (m²) MALİYETİ — canlı veriyle doğrulanmış senaryolar.
 *
 * 2026-09-02'ye kadar bu ürünler "maliyeti girilmemiş" görünüyordu: costing
 * area modunda koşulsuz null dönüyordu. Oysa gerçek maliyet ürünün
 * `content.maliyetUsd` alanında duruyordu (fiyat Excel'inin MALİYET kolonu).
 *
 * Rakamlar ÜRETİM verisinden: Çin Vinil Branda, maliyetUsd cin-280gr = 1,75 $/m²,
 * kur 49, minM2 1. Satış satırı 3,50 $/m² (KDV dahil son satış) — yani kâr
 * çarpanı 2,00; bu yüzden "satış ÷ marj" varsayımı yanlış sonuç veriyordu.
 */
const PRICING = { kur: 49, marj: 1.2, kdv: 0.2, minM2: 1 };

const cinBranda = {
  pricingMode: "area",
  content: { maliyetUsd: { "cin-280gr": 1.75, "cin-440gr": 2.2, germe: 0, "dikis-kopca": 0.2 } },
  options: [
    { groupKey: "malzeme", optionKey: "cin-280gr", groupRole: "priced", rules: { effect: "perM2" } },
    { groupKey: "malzeme", optionKey: "cin-440gr", groupRole: "priced", rules: { effect: "perM2" } },
    { groupKey: "ekislem", optionKey: "germe", groupRole: "priced", rules: { effect: "perPerimeter" } },
    { groupKey: "ekislem", optionKey: "dikis-kopca", groupRole: "priced", rules: { effect: "perPerimeter" } },
  ],
  prices: [
    { groupKey: "malzeme", optionKey: "cin-280gr", price: 0, cost: 3.5 },
    { groupKey: "malzeme", optionKey: "cin-440gr", price: 0, cost: 4.4 },
    { groupKey: "ekislem", optionKey: "germe", price: 0, cost: 0 },
    { groupKey: "ekislem", optionKey: "dikis-kopca", price: 0, cost: 0.4 },
  ],
};

const sel = (o: Record<string, string>) => ({ selections: o });

describe("area (m²) maliyeti content.maliyetUsd'den hesaplanır", () => {
  it("1 m² · cin-280gr · germe → 1,75 $ × 49 = 85,75 ₺", () => {
    // 60×150 = 0,9 m² ama minM2 1 → 1 m². Germe maliyeti 0.
    const r = computeItemCostTotal(
      cinBranda, sel({ en: "60", boy: "150", adet: "1", malzeme: "cin-280gr", ekislem: "germe" }),
      1, 142.92, 1.2, PRICING,
    );
    expect(r).toBe(85.75);
  });

  it("2 m² · cin-280gr → 1,75 × 49 × 2 = 171,50 ₺", () => {
    const r = computeItemCostTotal(
      cinBranda, sel({ en: "100", boy: "200", adet: "1", malzeme: "cin-280gr", ekislem: "germe" }),
      1, 205.8, 1.2, PRICING,
    );
    expect(r).toBe(171.5);
  });

  it("çevre bazlı ek işlem maliyeti de eklenir (dikiş+kopça)", () => {
    // 100×200 → alan 2 m², çevre 6 m. Malzeme 1,75×49×2 = 171,50 ; dikiş 0,2×49×6 = 58,80
    const r = computeItemCostTotal(
      cinBranda, sel({ en: "100", boy: "200", adet: "1", malzeme: "cin-280gr", ekislem: "dikis-kopca" }),
      1, 205.8, 1.2, PRICING,
    );
    expect(r).toBe(230.3);
  });

  it("satır adedi ile çarpılır (lineTotal ile aynı kapsam) — 1 m² üstünde doğrusal", () => {
    const bir = computeItemCostTotal(
      cinBranda, sel({ en: "100", boy: "200", adet: "1", malzeme: "cin-280gr", ekislem: "germe" }),
      1, 205.8, 1.2, PRICING,
    );
    const uc = computeItemCostTotal(
      cinBranda, sel({ en: "100", boy: "200", adet: "1", malzeme: "cin-280gr", ekislem: "germe" }),
      3, 617.4, 1.2, PRICING,
    );
    expect(uc).toBe(round2(Number(bir) * 3));
  });

  // 2026-09-04: 1 m² tabanı TOPLAM alana uygulanır — parça başına değil (satışla aynı kural).
  it("min alan toplamda: 80×100 × 2 = 1,6 m² → 1,75 × 49 × 1,6 = 137,20 ₺ (2 × 1 m² DEĞİL)", () => {
    const r = computeItemCostTotal(
      cinBranda, sel({ en: "80", boy: "100", adet: "1", malzeme: "cin-280gr", ekislem: "germe" }),
      2, 274.4, 1.2, PRICING,
    );
    expect(r).toBe(137.2);
  });

  it("min alan toplamda: 10×10 × 10 = 0,1 m² → 1 m² tabanı → 85,75 ₺ (10 × 1 m² DEĞİL)", () => {
    const r = computeItemCostTotal(
      cinBranda, sel({ en: "10", boy: "10", adet: "1", malzeme: "cin-280gr", ekislem: "germe" }),
      10, 171.5, 1.2, PRICING,
    );
    expect(r).toBe(85.75);
  });

  it("selections.adet ne olursa olsun satır adedi (qty) geçerlidir", () => {
    const a = computeItemCostTotal(
      cinBranda, sel({ en: "80", boy: "100", adet: "5", malzeme: "cin-280gr", ekislem: "germe" }),
      2, 274.4, 1.2, PRICING,
    );
    expect(a).toBe(137.2);
  });

  it("seçili seçeneğin maliyeti YOKSA null döner (eksik maliyet göstermez)", () => {
    const eksik = { ...cinBranda, content: { maliyetUsd: { germe: 0 } } };
    const r = computeItemCostTotal(
      eksik, sel({ en: "100", boy: "200", adet: "1", malzeme: "cin-280gr", ekislem: "germe" }),
      1, 205.8, 1.2, PRICING,
    );
    expect(r).toBeNull();
  });

  it("satış değeri 0 olan seçenek maliyetUsd'de olmasa da engel değil", () => {
    // CANLI ÖRNEK: Kompozit Baskı'da "ekislem: yok" seçeneği `priced` grupta
    // tanımlı ve fiyatı 0; maliyetUsd'de karşılığı YOK. Bu istisna olmadan TÜM
    // kalem "maliyeti bilinmiyor" sayılıyordu.
    const kompozit = {
      pricingMode: "area",
      content: { maliyetUsd: { "3mm": 26, "cnc-kesim": 2.5 } },
      options: [
        { groupKey: "malzeme", optionKey: "3mm", groupRole: "priced", rules: { birim: "dolar", effect: "perM2" } },
        { groupKey: "ekislem", optionKey: "yok", groupRole: "priced", rules: {} },
        { groupKey: "ekislem", optionKey: "cnc-kesim", groupRole: "priced", rules: { birim: "dolar", effect: "perM2" } },
      ],
      prices: [
        { groupKey: "malzeme", optionKey: "3mm", price: 0, cost: 37.44 },
        { groupKey: "ekislem", optionKey: "yok", price: 0, cost: 0 },
        { groupKey: "ekislem", optionKey: "cnc-kesim", price: 0, cost: 3.6 },
      ],
    };
    // 30×40 = 0,12 m² → minM2 1 → 1 m². Maliyet 26 × 49 × 1 = 1.274 ₺
    const r = computeItemCostTotal(
      kompozit, sel({ en: "30", boy: "40", adet: "1", malzeme: "3mm", ekislem: "yok" }),
      1, 1528.8, 1.2, PRICING,
    );
    expect(r).toBe(1274);
  });

  it("satış değeri SIFIR DEĞİLKEN maliyet yoksa yine null", () => {
    // cnc-kesim satılıyor (3,6 $) ama maliyeti tabloda yok → gerçekten bilinmiyor.
    const eksik = {
      pricingMode: "area",
      content: { maliyetUsd: { "3mm": 26 } },
      options: [
        { groupKey: "malzeme", optionKey: "3mm", groupRole: "priced", rules: { effect: "perM2" } },
        { groupKey: "ekislem", optionKey: "cnc-kesim", groupRole: "priced", rules: { effect: "perM2" } },
      ],
      prices: [
        { groupKey: "malzeme", optionKey: "3mm", price: 0, cost: 37.44 },
        { groupKey: "ekislem", optionKey: "cnc-kesim", price: 0, cost: 3.6 },
      ],
    };
    const r = computeItemCostTotal(
      eksik, sel({ en: "30", boy: "40", adet: "1", malzeme: "3mm", ekislem: "cnc-kesim" }),
      1, 1528.8, 1.2, PRICING,
    );
    expect(r).toBeNull();
  });

  it("maliyetUsd hiç yoksa null (eski davranış)", () => {
    const bos = { ...cinBranda, content: {} };
    const r = computeItemCostTotal(
      bos, sel({ en: "100", boy: "200", adet: "1", malzeme: "cin-280gr" }), 1, 205.8, 1.2, PRICING,
    );
    expect(r).toBeNull();
  });

  it("pricing verilmezse null — kur olmadan USD maliyet TL'ye çevrilemez", () => {
    const r = computeItemCostTotal(
      cinBranda, sel({ en: "100", boy: "200", adet: "1", malzeme: "cin-280gr", ekislem: "germe" }),
      1, 205.8, 1.2,
    );
    expect(r).toBeNull();
  });
});

function round2(n: number) {
  return Math.round(n * 100) / 100;
}
