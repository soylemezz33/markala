import { describe, it, expect } from "vitest";
import fs from "fs";
import path from "path";
import { cities } from "./cities";
import { ilIndekslenir, urunIndekslenir, NOINDEX } from "./seo-index";

describe("urunIndekslenir", () => {
  it("promosyon SKU'larını dışarıda bırakır, asıl kataloğu tutar", () => {
    expect(urunIndekslenir("promosyon-kristal-masa-isimligi-6765")).toBe(false);
    expect(urunIndekslenir("promosyon-cep-bloknot-6490")).toBe(false);
    expect(urunIndekslenir("rollup")).toBe(true);
    expect(urunIndekslenir("gonder-bayragi")).toBe(true);
    // "promosyon" kelimesi adın ortasında geçen ürün etkilenmez
    expect(urunIndekslenir("kurumsal-promosyon-seti")).toBe(true);
  });
});

describe("ilIndekslenir", () => {
  it("yalnız elle yazılmış illeri indekse sunar", () => {
    const acik = cities.filter((c) => ilIndekslenir(c.curated)).map((c) => c.slug);
    const kapali = cities.filter((c) => !ilIndekslenir(c.curated));
    expect(acik.sort()).toEqual(
      ["adana", "antalya", "gaziantep", "hatay", "mersin", "osmaniye", "sanliurfa"].sort(),
    );
    expect(kapali.length).toBe(cities.length - 7);
  });

  it("ilçesi olan tek il (Mersin) indekste — ilçeler onunla birlikte açık kalır", () => {
    const ilceli = cities.filter((c) => (c.districts?.length ?? 0) > 0);
    expect(ilceli.length).toBeGreaterThan(0);
    for (const il of ilceli) expect(ilIndekslenir(il.curated)).toBe(true);
  });
});

describe("noindex sayfaları taranmaya açık kalır", () => {
  it("follow açık — iç bağlantı akışı kesilmez", () => {
    expect(NOINDEX).toEqual({ index: false, follow: true });
  });
});

describe("sitemap ve sayfa robots'u aynı kaynaktan beslenir", () => {
  it("sitemap.ts ve ilgili sayfalar seo-index'i kullanıyor", () => {
    const oku = (p: string) => fs.readFileSync(path.resolve(__dirname, "..", p), "utf8");
    for (const dosya of [
      "app/sitemap.ts",
      "app/urun/[slug]/page.tsx",
      "app/matbaa/[city]/page.tsx",
      "app/matbaa/[city]/[district]/page.tsx",
    ]) {
      expect(oku(dosya), `${dosya} lib/seo-index'ten beslenmiyor`).toContain("@/lib/seo-index");
    }
  });
});
