import { describe, it, expect } from "vitest";
import fs from "fs";
import path from "path";
import { metaKirp } from "./meta-kirp";

describe("metaKirp", () => {
  it("sınırın altındaki metne dokunmaz", () => {
    expect(metaKirp("Kısa açıklama.", 160)).toBe("Kısa açıklama.");
  });

  it("kelimeyi ortadan bölmez", () => {
    const s = "Kartvizit baskı: 1.000-10.000 adet, KDV dahil anlık fiyat, 2-3 iş günü üretim";
    const k = metaKirp(s, 70);
    expect(k.length).toBeLessThanOrEqual(70);
    expect(s.startsWith(k)).toBe(true);
    // kırpılan yerden sonrası ya bitmiştir ya da boşlukla başlar → kelime bölünmedi
    expect(s.slice(k.length)).toMatch(/^(\s|$)/);
  });

  it("sonda kalan bağlayıcı noktalamayı atar", () => {
    expect(metaKirp("Adet başına sabit fiyat, minimum 5 adet, kargo dahil", 40)).not.toMatch(/[,;:\s]$/);
  });

  it("cümle sonu noktasını korur", () => {
    expect(metaKirp("Bir cümle. İkinci cümle burada devam ediyor", 12)).toBe("Bir cümle.");
  });
});

describe("meta açıklamaları sert slice ile kırpılmıyor", () => {
  it("kategori, ürün ve hizmet sayfaları metaKirp kullanıyor", () => {
    const oku = (p: string) => fs.readFileSync(path.resolve(__dirname, "..", p), "utf8");
    for (const dosya of [
      "app/kategori/[slug]/page.tsx",
      "app/urun/[slug]/page.tsx",
      "app/hizmetler/[slug]/page.tsx",
    ]) {
      const s = oku(dosya);
      expect(s, `${dosya} metaKirp kullanmıyor`).toContain("metaKirp");
      // description alanında ham slice kalmamalı
      const hamSlice = /description:\s*[A-Za-z_.]+\.slice\(/.test(s);
      expect(hamSlice, `${dosya} hâlâ description'da ham .slice() kullanıyor`).toBe(false);
    }
  });
});
