import { describe, it, expect } from "vitest";
import { DescriptionGeneratorService } from "./description-generator.service";

/**
 * Sözleşme: taslak üretici deterministik, maliyetsiz (provider="template").
 * Prod'da Claude sağlayıcısı devreye girince bu kontrat korunur:
 *  - shortDescription ≤280 (Product.shortDescription kısıtı)
 *  - description ad + (varsa) kategori + anahtar kelimeleri içerir
 *  - en az 2 SSS, her biri q + a
 *  - aynı girdi → aynı çıktı (tekrarlanabilir, cache'lenebilir)
 */
describe("DescriptionGeneratorService.generate", () => {
  const svc = new DescriptionGeneratorService();

  it("provider=template, model=null (maliyetsiz, dış AI yok)", async () => {
    const res = await svc.generate({ name: "Kartvizit" });
    expect(res.provider).toBe("template");
    expect(res.model).toBeNull();
  });

  it("shortDescription boş değil ve ≤280 karakter", async () => {
    const res = await svc.generate({ name: "Roll-up Banner 85x200" });
    expect(res.shortDescription.length).toBeGreaterThan(0);
    expect(res.shortDescription.length).toBeLessThanOrEqual(280);
    expect(res.shortDescription).toContain("Roll-up Banner 85x200");
  });

  it("uzun ürün adında bile shortDescription ≤280 (güvenli kırpma)", async () => {
    const res = await svc.generate({ name: "X".repeat(300) });
    expect(res.shortDescription.length).toBeLessThanOrEqual(280);
  });

  it("kategori verilince description'da geçer", async () => {
    const res = await svc.generate({ name: "Broşür A4", categoryName: "Broşür" });
    expect(res.description).toContain("Broşür");
    expect(res.description).toContain("Broşür A4");
  });

  it("anahtar kelimeler description'a yansır", async () => {
    const res = await svc.generate({
      name: "Sticker",
      keywords: ["UV baskı", "su geçirmez"],
    });
    expect(res.description).toContain("UV baskı");
    expect(res.description).toContain("su geçirmez");
  });

  it("ton (kurumsal vs samimi) açılış cümlesini değiştirir", async () => {
    const kurumsal = await svc.generate({ name: "Afiş", tone: "kurumsal" });
    const samimi = await svc.generate({ name: "Afiş", tone: "samimi" });
    expect(kurumsal.description).not.toBe(samimi.description);
  });

  it("en az 2 SSS üretir, her biri q + a içerir", async () => {
    const res = await svc.generate({ name: "Magnet" });
    expect(res.faqs.length).toBeGreaterThanOrEqual(2);
    for (const f of res.faqs) {
      expect(f.q.length).toBeGreaterThan(0);
      expect(f.a.length).toBeGreaterThan(0);
    }
  });

  it("deterministik: aynı girdi aynı çıktıyı verir (cache uyumlu)", async () => {
    const a = await svc.generate({ name: "Kese Kağıdı", categoryName: "Ambalaj" });
    const b = await svc.generate({ name: "Kese Kağıdı", categoryName: "Ambalaj" });
    expect(a).toEqual(b);
  });
});
