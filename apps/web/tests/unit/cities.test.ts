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
    expect(c?.sameDayCourier).toBe(true);
    expect(c?.districts?.length).toBeGreaterThan(0);
  });

  it("olmayan şehir için undefined", () => {
    expect(getCityBySlug("istanbul-yok")).toBeUndefined();
  });

  it("tüm şehirler unique slug ve geo bilgisine sahip", () => {
    const slugs = cities.map((c) => c.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
    for (const c of cities) {
      expect(c.geo.lat).toBeGreaterThan(0);
      expect(c.geo.lng).toBeGreaterThan(0);
    }
  });
});

describe("getDistrictBySlug", () => {
  it("mersin/tarsus ilçesi bulunur", () => {
    const d = getDistrictBySlug("mersin", "tarsus");
    expect(d).toBeDefined();
    expect(d?.name).toBe("Tarsus");
    expect(d?.parentCity).toBe("mersin");
    expect(d?.sameDayDelivery).toBe(true);
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
