import { describe, it, expect } from "vitest";
import {
  getTermBySlug,
  getTermsByCategory,
  getRelatedTerms,
  glossary,
  glossaryCategories,
} from "@/lib/glossary";

/**
 * Glossary helper'ları — long-tail SEO sayfa render'ı için kritik.
 * Slug eşleşmesi, kategori filtresi ve cross-link related terms.
 */

describe("getTermBySlug", () => {
  it("var olan slug'ı bulur", () => {
    const t = getTermBySlug("cmyk");
    expect(t).toBeDefined();
    expect(t?.term).toBe("CMYK");
    expect(t?.category).toBe("renk");
  });

  it("olmayan slug için undefined döner", () => {
    expect(getTermBySlug("yok-boyle-bir-terim")).toBeUndefined();
  });

  it("tüm glossary terimleri unique slug'a sahip", () => {
    const slugs = glossary.map((t) => t.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
  });
});

describe("getTermsByCategory", () => {
  it("kagit kategorisinde en az 3 terim var", () => {
    const terms = getTermsByCategory("kagit");
    expect(terms.length).toBeGreaterThanOrEqual(3);
    expect(terms.every((t) => t.category === "kagit")).toBe(true);
  });

  it("her kategori için en az 1 terim var (kapsama testi)", () => {
    const cats = Object.keys(glossaryCategories) as Array<keyof typeof glossaryCategories>;
    for (const cat of cats) {
      const terms = getTermsByCategory(cat);
      // En az 1 terim olmalı — boşsa long-tail SEO sayfası boş kalır
      expect(terms.length).toBeGreaterThan(0);
    }
  });
});

describe("getRelatedTerms", () => {
  it("cmyk'nin related terms'i var ve hepsi geçerli terim", () => {
    const related = getRelatedTerms("cmyk");
    expect(related.length).toBeGreaterThan(0);
    // Her ilgili terim aslında glossary'de var olmalı
    for (const r of related) {
      expect(r.slug).toBeDefined();
      expect(r.term).toBeDefined();
    }
  });

  it("olmayan slug için boş array döner", () => {
    expect(getRelatedTerms("yok")).toEqual([]);
  });

  it("relatedTerms referansları kırık değil (referential integrity)", () => {
    // Her terimin relatedTerms'i mevcut bir slug olmalı — yoksa SEO kırık link.
    // Sessiz fail riskini bertaraf etmek için her referansı expect ile doğruluyoruz.
    for (const term of glossary) {
      for (const relatedSlug of term.relatedTerms ?? []) {
        expect(
          glossary.find((t) => t.slug === relatedSlug),
          `"${term.slug}" → "${relatedSlug}" referansı glossary'de bulunamadı`,
        ).toBeDefined();
      }
    }
    // En azından bir terimin işleyen related link'i olmalı
    const cmyk = getTermBySlug("cmyk");
    const validRelated = (cmyk?.relatedTerms ?? []).filter((s) => getTermBySlug(s));
    expect(validRelated.length).toBeGreaterThan(0);
  });
});
