import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  buildProductCopyPrompt,
  templateProductCopy,
  generateProductCopy,
  PRODUCT_COPY_SCHEMA,
} from "@/lib/ai/product-copy";

/**
 * Ürün açıklaması üretimi — saf prompt/şablon fonksiyonları + AI yolu (fetch mock).
 */

const KEY = "ANTHROPIC_API_KEY";

describe("buildProductCopyPrompt", () => {
  it("ad, kategori, kitle ve anahtar kelimeleri içerir", () => {
    const p = buildProductCopyPrompt({
      name: "Lüks Kartvizit",
      category: "Kartvizit",
      audience: "kurumsal",
      keywords: ["selefon", "kuşe"],
    });
    expect(p).toContain("Lüks Kartvizit");
    expect(p).toContain("Kartvizit");
    expect(p).toContain("kurumsal");
    expect(p).toContain("selefon, kuşe");
  });

  it("opsiyonel alanlar yokken sadece adı içerir", () => {
    const p = buildProductCopyPrompt({ name: "Afiş" });
    expect(p).toContain("Afiş");
    expect(p).not.toContain("Kategori:");
  });
});

describe("templateProductCopy", () => {
  it("tüm alanları doldurur ve uzunluk sınırlarına uyar", () => {
    const c = templateProductCopy({ name: "Roll-up Banner", category: "Stand" });
    expect(c.shortDescription.length).toBeGreaterThan(0);
    expect(c.shortDescription.length).toBeLessThanOrEqual(150);
    expect(c.seoTitle.length).toBeLessThanOrEqual(60);
    expect(c.seoDescription.length).toBeLessThanOrEqual(155);
    expect(c.description).toContain("Roll-up Banner");
  });

  it("anahtar kelimeleri küçük harfe çevirir ve tekilleştirir", () => {
    const c = templateProductCopy({ name: "Magnet", keywords: ["Magnet", "buzdolabı"] });
    // "magnet" hem addan hem keyword'den gelir → tek kez
    expect(c.keywords.filter((k) => k === "magnet")).toHaveLength(1);
    expect(c.keywords).toContain("baskı");
  });
});

describe("PRODUCT_COPY_SCHEMA", () => {
  it("strict yapısal çıktı için additionalProperties:false ve required içerir", () => {
    expect(PRODUCT_COPY_SCHEMA.additionalProperties).toBe(false);
    expect(PRODUCT_COPY_SCHEMA.required).toContain("shortDescription");
    expect(PRODUCT_COPY_SCHEMA.required).toContain("seoTitle");
  });
});

describe("generateProductCopy (AI yolu)", () => {
  beforeEach(() => {
    process.env[KEY] = "sk-test";
  });
  afterEach(() => {
    vi.restoreAllMocks();
    delete process.env[KEY];
  });

  it("geçerli yapısal JSON dönerse source 'ai' ve usage taşır", async () => {
    const aiCopy = {
      shortDescription: "kısa",
      description: "uzun açıklama",
      seoTitle: "seo",
      seoDescription: "seo açıklama",
      keywords: ["a", "b"],
    };
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({
          content: [{ type: "text", text: JSON.stringify(aiCopy) }],
          usage: { input_tokens: 20, output_tokens: 50 },
          model: "claude-haiku-4-5",
        }),
        text: async () => "",
      } as unknown as Response),
    );

    const res = await generateProductCopy({ name: "Kartvizit" });
    expect(res.source).toBe("ai");
    expect(res.copy.shortDescription).toBe("kısa");
    expect(res.usage).toEqual({ inputTokens: 20, outputTokens: 50 });
  });

  it("geçersiz JSON dönerse şablona düşer (source 'fallback')", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({
          content: [{ type: "text", text: "bu json değil" }],
          usage: {},
          model: "m",
        }),
        text: async () => "",
      } as unknown as Response),
    );

    const res = await generateProductCopy({ name: "Broşür" });
    expect(res.source).toBe("fallback");
    expect(res.copy.description).toContain("Broşür");
  });

  it("AI eksik alan dönerse şablon değerleriyle tamamlar", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({
          content: [{ type: "text", text: JSON.stringify({ shortDescription: "yalnız kısa" }) }],
          usage: {},
          model: "m",
        }),
        text: async () => "",
      } as unknown as Response),
    );

    const res = await generateProductCopy({ name: "Etiket" });
    expect(res.source).toBe("ai");
    expect(res.copy.shortDescription).toBe("yalnız kısa");
    // eksik alanlar şablondan dolar
    expect(res.copy.seoTitle.length).toBeGreaterThan(0);
    expect(res.copy.description).toContain("Etiket");
  });
});
