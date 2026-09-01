import { describe, it, expect } from "vitest";
import {
  getCityBySlug,
  getDistrictBySlug,
  getAllDistrictParams,
  getNearbyCities,
  cities,
} from "@/lib/cities";

/**
 * City/District helpers — local SEO landing page'leri için kritik.
 * Bu fonksiyonlar Next.js generateStaticParams'ta kullanılıyor;
 * kırılırsa /matbaa/[city] ve /matbaa/[city]/[district] route'ları
 * build'de patlar.
 */

describe("getCityBySlug", () => {
  it("mersin merkez şehri bulunur", () => {
    const c = getCityBySlug("mersin");
    expect(c).toBeDefined();
    expect(c?.name).toBe("Mersin");
    // Aynı gün kurye artık hiçbir şehirde sunulmuyor (operasyonel vaat düzeltmesi).
    expect(c?.sameDayCourier).toBe(false);
    expect(c?.districts?.length).toBeGreaterThan(0);
  });

  it("olmayan şehir için undefined", () => {
    expect(getCityBySlug("istanbul-yok")).toBeUndefined();
  });

  it("tüm şehirler unique slug'a sahip", () => {
    const slugs = cities.map((c) => c.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
  });

  it("elle yazılan illerde geo koordinatı dolu", () => {
    const curated = cities.filter((c) => c.curated);
    expect(curated.length).toBeGreaterThan(0);
    for (const c of curated) {
      expect(c.geo?.lat).toBeGreaterThan(0);
      expect(c.geo?.lng).toBeGreaterThan(0);
    }
  });
});

/**
 * 81 il düzeninin değişmezleri (2026-09-01).
 *
 * Şablonla üretilen 74 il, elle yazılan 7 ilin İDDİALARINI TAŞIMAMALI:
 * o illerde müşterimiz olduğunu söyleyemeyiz ve uydurma koordinat basamayız.
 * Ayrıca ilçelerine alt sayfa açılmamalı — açılsaydı 972 ince sayfa üretilirdi.
 */
describe("81 il düzeni", () => {
  const curated = cities.filter((c) => c.curated);
  const generated = cities.filter((c) => !c.curated);

  it("81 ilin tamamı var, 7'si elle yazılmış", () => {
    expect(cities.length).toBe(81);
    expect(curated.length).toBe(7);
    expect(generated.length).toBe(74);
  });

  it("şablon iller uydurma veri taşımaz (geo/nüfus yok, referans boş)", () => {
    for (const c of generated) {
      expect(c.geo).toBeUndefined();
      expect(c.population).toBeUndefined();
      expect(c.localReferences).toEqual([]);
    }
  });

  it("şablon illerin ilçelerine ALT SAYFA açılmaz", () => {
    for (const c of generated) {
      expect(c.districts).toBeUndefined();
      // İlçeler yalnız düz liste olarak taşınır.
      expect(c.districtNames?.length ?? 0).toBeGreaterThan(0);
    }
    // Alt sayfa üreten tek il elle yazılan Mersin olmalı.
    const altSayfaIlleri = new Set(getAllDistrictParams().map((p) => p.city));
    expect([...altSayfaIlleri]).toEqual(["mersin"]);
  });

  it("her ilin içeriği dolu ve bölgesi tanımlı", () => {
    for (const c of cities) {
      expect(c.intro.length).toBeGreaterThan(80);
      expect(c.faqs.length).toBeGreaterThan(0);
      expect(c.region).toBeTruthy();
      expect(c.deliveryDays.min).toBeGreaterThan(0);
      expect(c.deliveryDays.max).toBeGreaterThanOrEqual(c.deliveryDays.min);
    }
  });

  it("İstanbul gibi büyük iller gerçekten sayfaya sahip", () => {
    for (const slug of ["istanbul", "ankara", "izmir", "bursa", "konya"]) {
      expect(getCityBySlug(slug)).toBeDefined();
    }
  });
});

describe("getDistrictBySlug", () => {
  it("mersin/tarsus ilçesi bulunur", () => {
    const d = getDistrictBySlug("mersin", "tarsus");
    expect(d).toBeDefined();
    expect(d?.name).toBe("Tarsus");
    expect(d?.parentCity).toBe("mersin");
    // Aynı gün teslim artık hiçbir ilçede sunulmuyor (operasyonel vaat düzeltmesi).
    expect(d?.sameDayDelivery).toBe(false);
  });

  it("yanlış şehir/ilçe kombosu için undefined", () => {
    expect(getDistrictBySlug("mersin", "yok-ilce")).toBeUndefined();
    expect(getDistrictBySlug("antalya", "tarsus")).toBeUndefined();
  });
});

describe("getAllDistrictParams", () => {
  it("tüm ilçeler için { city, district } üretir", () => {
    const params = getAllDistrictParams();
    expect(params.length).toBeGreaterThan(0);

    // Her param objesi gerekli alanlara sahip
    for (const p of params) {
      expect(p.city).toBeDefined();
      expect(p.district).toBeDefined();
      // Bu kombinasyon gerçekten getDistrictBySlug'ta bulunmalı
      expect(getDistrictBySlug(p.city, p.district)).toBeDefined();
    }
  });

  it("mersin'in tüm ilçelerini içerir", () => {
    const params = getAllDistrictParams();
    const mersinDistricts = params.filter((p) => p.city === "mersin");
    // Mersin'de en az 8 ilçe tanımlı (Tarsus, Yenişehir, Akdeniz, Toroslar, ...)
    expect(mersinDistricts.length).toBeGreaterThanOrEqual(8);
  });
});

describe("getNearbyCities", () => {
  it("mersin için aynı bölgeden komşu şehir döner", () => {
    const nearby = getNearbyCities("mersin", 3);
    expect(nearby.length).toBeLessThanOrEqual(3);
    expect(nearby.every((c) => c.slug !== "mersin")).toBe(true);
    // Mersin akdeniz bölgesinde — komşular da akdeniz olmalı
    expect(nearby.every((c) => c.region === "akdeniz")).toBe(true);
  });

  it("olmayan şehir için boş array", () => {
    expect(getNearbyCities("yok-sehir")).toEqual([]);
  });
});
