import { describe, it, expect } from "vitest";
import {
  katla,
  aramaEslesir,
  karsilastir,
  siralaSatirlar,
  ilkYon,
  sonrakiSira,
  type SortAccessors,
} from "./tablo-siralama";

describe("katla (Türkçe harf katlaması)", () => {
  it("aksanlı ve büyük harfleri aynı forma indirir", () => {
    expect(katla("Ürün")).toBe("urun");
    expect(katla("İŞ GÜVENLİĞİ")).toBe("is guvenligi");
    expect(katla("ÇİÇEKÇİ")).toBe("cicekci");
    expect(katla("  Boşluk  ")).toBe("bosluk");
  });
  it("null/undefined'ı boş metne çevirir", () => {
    expect(katla(null)).toBe("");
    expect(katla(undefined)).toBe("");
  });
});

describe("aramaEslesir", () => {
  it("aksansız yazılan sorgu aksanlı metni bulur", () => {
    expect(aramaEslesir("urun", "Ürün Kutusu")).toBe(true);
    expect(aramaEslesir("ÜRÜN", "urun kutusu")).toBe(true);
  });
  it("kelimelerin hepsini arar, sıra önemsiz", () => {
    expect(aramaEslesir("bayrak yelken", "Yelken Bayrak 75x300")).toBe(true);
    expect(aramaEslesir("bayrak kupa", "Yelken Bayrak")).toBe(false);
  });
  it("birden çok alanda arar", () => {
    expect(aramaEslesir("mk-123", "Kartvizit", "MK-123")).toBe(true);
  });
  it("boş sorgu her satırı geçirir", () => {
    expect(aramaEslesir("", "herhangi")).toBe(true);
    expect(aramaEslesir("   ", null)).toBe(true);
  });
});

describe("karsilastir", () => {
  it("boş değerleri her iki yönde de sona atar", () => {
    expect(karsilastir(null, 5, "asc")).toBeGreaterThan(0);
    expect(karsilastir(null, 5, "desc")).toBeGreaterThan(0);
    expect(karsilastir("", "a", "desc")).toBeGreaterThan(0);
  });
  it("sayı gibi duran metinleri sayısal karşılaştırır", () => {
    expect(karsilastir("1000", "9", "asc")).toBeGreaterThan(0);
    expect(karsilastir("719.99", "1440", "asc")).toBeLessThan(0);
  });
  it("Türkçe alfabe sırasını kullanır", () => {
    // Türkçede ç, c'den sonra gelir; ö, o'dan sonra.
    expect(karsilastir("ocak", "öncelik", "asc")).toBeLessThan(0);
    expect(karsilastir("zebra", "çilek", "asc")).toBeGreaterThan(0);
  });
  it("tarihleri zaman damgasına göre karşılaştırır", () => {
    expect(karsilastir(new Date("2026-01-01"), new Date("2026-06-01"), "desc")).toBeGreaterThan(0);
  });
});

type Satir = { ad: string; adet: number | null; tarih: string };
const accessors: SortAccessors<Satir, "ad" | "adet" | "tarih"> = {
  ad: (r) => r.ad,
  adet: (r) => r.adet,
  tarih: (r) => new Date(r.tarih),
};
const rows: Satir[] = [
  { ad: "Çanta", adet: 3, tarih: "2026-03-01" },
  { ad: "Bayrak", adet: null, tarih: "2026-01-01" },
  { ad: "Afiş", adet: 10, tarih: "2026-02-01" },
];

describe("siralaSatirlar", () => {
  it("metni Türkçe sıraya göre dizer", () => {
    expect(siralaSatirlar(rows, accessors, "ad", "asc").map((r) => r.ad)).toEqual([
      "Afiş",
      "Bayrak",
      "Çanta",
    ]);
  });
  it("sayıda boş değer sona gider (azalan sırada da)", () => {
    expect(siralaSatirlar(rows, accessors, "adet", "desc").map((r) => r.ad)).toEqual([
      "Afiş",
      "Çanta",
      "Bayrak",
    ]);
  });
  it("girdi dizisini değiştirmez", () => {
    const kopya = rows.slice();
    siralaSatirlar(rows, accessors, "ad", "desc");
    expect(rows).toEqual(kopya);
  });
  it("eşit değerlerde girdi sırasını korur (kararlı)", () => {
    const esit: Satir[] = [
      { ad: "B", adet: 1, tarih: "2026-01-01" },
      { ad: "A", adet: 1, tarih: "2026-01-01" },
    ];
    expect(siralaSatirlar(esit, accessors, "adet", "asc").map((r) => r.ad)).toEqual(["B", "A"]);
  });
});

describe("ilkYon / sonrakiSira", () => {
  it("metin kolonunda A→Z, sayı ve tarihte büyükten küçüğe başlar", () => {
    expect(ilkYon("abc")).toBe("asc");
    expect(ilkYon(5)).toBe("desc");
    expect(ilkYon(new Date())).toBe("desc");
    expect(ilkYon("1200")).toBe("desc");
  });
  it("aynı kolona tekrar tıklayınca yön döner", () => {
    expect(sonrakiSira({ key: "ad", dir: "asc" }, "ad", rows, accessors)).toEqual({
      key: "ad",
      dir: "desc",
    });
  });
  it("başka kolona geçince o kolonun doğal yönü seçilir", () => {
    expect(sonrakiSira({ key: "ad", dir: "desc" }, "adet", rows, accessors)).toEqual({
      key: "adet",
      dir: "desc",
    });
    expect(sonrakiSira({ key: "adet", dir: "asc" }, "ad", rows, accessors)).toEqual({
      key: "ad",
      dir: "asc",
    });
  });
  it("kolonun tüm değerleri boşsa yön seçimi çökmez", () => {
    const bos: Satir[] = [{ ad: "A", adet: null, tarih: "2026-01-01" }];
    expect(sonrakiSira({ key: "ad", dir: "asc" }, "adet", bos, accessors)).toEqual({
      key: "adet",
      dir: "asc",
    });
  });
});
