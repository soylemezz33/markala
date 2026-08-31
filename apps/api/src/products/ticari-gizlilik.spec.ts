import { describe, it, expect } from "vitest";
import { gizliTicariAlanlariAyikla } from "./products.service";

/**
 * 2026-08-31 denetim bulgusu: halka açık ürün uçları tedarikçi MALİYETİNİ ve KÂR MARJINI
 * sızdırıyordu. Bu testler ayıklamanın sessizce geri alınmasını engeller.
 */
describe("gizliTicariAlanlariAyikla", () => {
  it("profitMargin'i HER ZAMAN atar — storefront'ta hiç kullanılmıyor", () => {
    const out = gizliTicariAlanlariAyikla({ slug: "x", profitMargin: "1.65" });
    expect(out).not.toHaveProperty("profitMargin");
    expect(out.slug).toBe("x");
  });

  it("kategori nesnesindeki profitMargin'i de atar", () => {
    const out = gizliTicariAlanlariAyikla({
      slug: "x",
      category: { slug: "kartvizit", name: "Kartvizit", profitMargin: "1.65" },
    }) as { category: Record<string, unknown> };
    expect(out.category).not.toHaveProperty("profitMargin");
    expect(out.category.name).toBe("Kartvizit");
  });

  it("area OLMAYAN üründe cost'u atar, price'ı korur", () => {
    const out = gizliTicariAlanlariAyikla({
      pricingMode: "additive",
      prices: [{ groupKey: "paket", optionKey: "mna", price: "979.2", cost: "480" }],
    }) as { prices: Array<Record<string, unknown>> };
    expect(out.prices[0]).not.toHaveProperty("cost");
    expect(out.prices[0]!.price).toBe("979.2");
  });

  it("area ürününde cost KALIR — m² fiyatı tarayıcıda ondan hesaplanıyor", () => {
    // configurator.ts:515 `row.cost ?? row.price` okuyor; atılırsa m² fiyatları bozulur.
    const out = gizliTicariAlanlariAyikla({
      pricingMode: "area",
      prices: [{ groupKey: "malzeme", optionKey: "lumen", price: "0", cost: "45" }],
    }) as { prices: Array<Record<string, unknown>> };
    expect(out.prices[0]!.cost).toBe("45");
  });

  it("prices/category yoksa çökmez", () => {
    expect(() => gizliTicariAlanlariAyikla({ slug: "x" })).not.toThrow();
    expect(gizliTicariAlanlariAyikla({ slug: "x", category: null })).toHaveProperty("category", null);
  });
});
