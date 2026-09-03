import { describe, expect, it } from "vitest";

import { computeAreaPrice } from "@/lib/configurator";

/**
 * "Ek İşlem" gibi malzeme DIŞI ücretli grupların fiyat farkı (2026-09-03).
 *
 * Konfigüratör bu farkı "+245,00 ₺" olarak basıyor. Burada test edilen şey farkın
 * KENDİSİ: fiyat açıklama metnine yazılmadığı için (kur/ölçüye bağlı) doğru
 * hesaplanması tek güvence.
 *
 * Fiyat satırlarında m² ürünlerde tutar `cost` sütunundadır ve KDV DAHİL SON SATIŞ
 * fiyatıdır — `price` sütunu bu üründe kullanılmaz.
 */
const AYAR = { kur: 49, marj: 1.2, kdv: 0.2, minM2: 1 };

const opts = [
  { groupKey: "malzeme", optionKey: "kompozit", groupRole: "priced" as const, rules: { birim: "dolar", effect: "perM2" } },
  { groupKey: "ekislem", optionKey: "yok", groupRole: "priced" as const, rules: {} },
  { groupKey: "ekislem", optionKey: "cnc-kesim", groupRole: "priced" as const, rules: { birim: "dolar", effect: "perM2" } },
  { groupKey: "ekislem", optionKey: "laminasyon", groupRole: "priced" as const, rules: { birim: "dolar", effect: "perPiece" } },
  { groupKey: "ekislem", optionKey: "germe", groupRole: "priced" as const, rules: { birim: "dolar", effect: "perPiece" } },
];

const rows = [
  { groupKey: "malzeme", optionKey: "kompozit", dimKey: null, price: 0, cost: 20 },
  { groupKey: "ekislem", optionKey: "yok", dimKey: null, price: 0, cost: 0 },
  { groupKey: "ekislem", optionKey: "cnc-kesim", dimKey: null, price: 0, cost: 3.6 },
  { groupKey: "ekislem", optionKey: "laminasyon", dimKey: null, price: 0, cost: 5 },
  { groupKey: "ekislem", optionKey: "germe", dimKey: null, price: 0, cost: 0 },
];

/** Konfigüratördeki hesabın aynısı: taban = grup seçilmemiş hâl. */
function fark(sel: Record<string, string>, optionKey: string, adet = 1) {
  const taban = computeAreaPrice(opts as never, rows as never, { ...sel, adet: "1", ekislem: "" }, AYAR).dahil;
  const ile = computeAreaPrice(opts as never, rows as never, { ...sel, adet: "1", ekislem: optionKey }, AYAR).dahil;
  return Math.round((ile - taban) * adet * 100) / 100;
}

describe("Ek İşlem fiyat farkı", () => {
  const birM2 = { malzeme: "kompozit", en: "100", boy: "100" };

  it("m² başına ücretlenen CNC Kesim: 1 m²'de 3,60 $ × kur", () => {
    expect(fark(birM2, "cnc-kesim")).toBe(176.4);
  });

  it("CNC Kesim alanla büyür — 2 m²'de iki katı", () => {
    expect(fark({ malzeme: "kompozit", en: "200", boy: "100" }, "cnc-kesim")).toBe(352.8);
  });

  it("adet başına ücretlenen Laminasyon alandan bağımsız", () => {
    expect(fark(birM2, "laminasyon")).toBe(245);
    expect(fark({ malzeme: "kompozit", en: "300", boy: "200" }, "laminasyon")).toBe(245);
  });

  it("adet arttıkça fark çarpılır", () => {
    expect(fark(birM2, "laminasyon", 3)).toBe(735);
  });

  it("ücretsiz seçenekte fark 0 → arayüz ipucu basmaz", () => {
    expect(fark(birM2, "germe")).toBe(0);
    expect(fark(birM2, "yok")).toBe(0);
  });

  it("KUR DEĞİŞİNCE fark da değişir — bu yüzden fiyat açıklama metnine yazılmaz", () => {
    const taban = computeAreaPrice(opts as never, rows as never, { ...birM2, adet: "1", ekislem: "" }, { ...AYAR, kur: 60 }).dahil;
    const ile = computeAreaPrice(opts as never, rows as never, { ...birM2, adet: "1", ekislem: "cnc-kesim" }, { ...AYAR, kur: 60 }).dahil;
    expect(Math.round((ile - taban) * 100) / 100).toBe(216);
  });
});
