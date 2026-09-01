import { describe, it, expect } from "vitest";
import type { Product } from "@markala/types";
import {
  resolveProductImage,
  isRealImage,
  galleryIndexOfId,
  nextFallbackSrc,
} from "./product-image";

/** Test ürünü — yalnız resolver'ın okuduğu alanlar doldurulur. */
function makeProduct(over: Partial<Product>): Product {
  return {
    slug: "test-urun",
    name: "Test Ürünü",
    categorySlug: "kartvizit",
    shortDescription: "",
    description: "",
    basePrice: 0,
    productionTime: "",
    images: [],
    ...over,
  };
}

describe("resolveProductImage", () => {
  it("gerçek görselleri (images: string[]) cover + gallery olarak çözer", () => {
    const p = makeProduct({
      images: ["https://cdn.markala.com.tr/a.webp", "https://cdn.markala.com.tr/b.webp"],
    });
    const { cover, gallery } = resolveProductImage(p);
    expect(gallery).toHaveLength(2);
    expect(cover.fallback).toBe(false);
    expect(cover.src).toBe("https://cdn.markala.com.tr/a.webp");
    // İlk görselin alt'ı ürün adı, ikincisi benzersizleşir (SEO).
    expect(cover.alt).toBe("Test Ürünü");
    expect(gallery[1]!.alt).toContain("görsel 2");
  });

  it("yeni kontrat (coverImage + gallery) öncelikli kullanılır", () => {
    const p = makeProduct({
      images: ["https://cdn.markala.com.tr/legacy.webp"],
      coverImage: {
        id: "cover-1",
        src: "https://cdn.markala.com.tr/cover.webp",
        alt: "Kapak",
        width: 1200,
        height: 1200,
      },
      gallery: [
        {
          id: "cover-1",
          src: "https://cdn.markala.com.tr/cover.webp",
          alt: "Kapak",
          width: 1200,
          height: 1200,
        },
        {
          id: "g-2",
          src: "https://cdn.markala.com.tr/g2.webp",
          alt: "Detay",
          width: 1200,
          height: 1200,
        },
      ],
    });
    const { cover, gallery } = resolveProductImage(p);
    expect(cover.id).toBe("cover-1");
    expect(gallery).toHaveLength(2); // coverImage + gallery dedup edilir (aynı id iki kez eklenmez)
  });

  it("bug #4: gerçek görsel yoksa kategori-bazlı fallback döner", () => {
    const p = makeProduct({ categorySlug: "brosur", images: [] });
    const { cover, gallery } = resolveProductImage(p);
    expect(cover.fallback).toBe(true);
    expect(cover.src).toBe("/images/categories/brosur.jpg");
    expect(cover.alt).toContain("kategori görseli");
    expect(gallery).toHaveLength(1);
  });

  it("kategori fotosu yoksa marka jenerik mockup placeholder'a düşer", () => {
    const p = makeProduct({ categorySlug: "bilinmeyen-kategori", images: [] });
    const { cover } = resolveProductImage(p);
    expect(cover.fallback).toBe(true);
    expect(cover.src).toContain("/api/mockup");
    expect(cover.src).toContain("test-urun");
  });

  it("mockup SVG'leri gerçek görsel sayılmaz → fallback zincirine düşer", () => {
    const p = makeProduct({ categorySlug: "kartvizit", images: ["/api/mockup?slug=test-urun"] });
    const { cover } = resolveProductImage(p);
    expect(cover.fallback).toBe(true);
    expect(cover.src).toBe("/images/categories/kartvizit.jpg");
  });

  it("her zaman en az bir görsel döner (asla boş galeri)", () => {
    const { gallery } = resolveProductImage(makeProduct({ images: [] }));
    expect(gallery.length).toBeGreaterThanOrEqual(1);
  });
});

describe("isRealImage", () => {
  it("mockup ve boş değerleri eler", () => {
    expect(isRealImage("https://cdn.markala.com.tr/a.webp")).toBe(true);
    expect(isRealImage("/api/mockup?slug=x")).toBe(false);
    expect(isRealImage("")).toBe(false);
    expect(isRealImage(null)).toBe(false);
  });
});

describe("galleryIndexOfId / nextFallbackSrc", () => {
  it("görsel id'sini galerideki index'e çevirir", () => {
    const { gallery } = resolveProductImage(
      makeProduct({
        images: ["https://cdn.markala.com.tr/a.webp", "https://cdn.markala.com.tr/b.webp"],
      }),
    );
    expect(galleryIndexOfId(gallery, "img-1")).toBe(1);
    expect(galleryIndexOfId(gallery, "yok")).toBe(-1);
  });

  it("nextFallbackSrc bilinen kategoride kategori fotosunu verir", () => {
    expect(nextFallbackSrc(makeProduct({ categorySlug: "kupa" }))).toBe(
      "/images/categories/kupa.jpg",
    );
    expect(nextFallbackSrc(makeProduct({ categorySlug: "yok" }))).toContain("/api/mockup");
  });
});
