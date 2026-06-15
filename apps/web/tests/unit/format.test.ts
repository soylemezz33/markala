import { describe, it, expect } from "vitest";
import {
  formatPrice,
  formatPriceWithSymbol,
  orderStatusLabel,
  generateOrderNumber,
} from "@/lib/format";

/**
 * format.ts — Türkçe sayı/tarih/durum formatlama.
 * Checkout sayfasında, sipariş geçmişinde ve e-posta şablonlarında kullanılıyor.
 */

describe("formatPrice", () => {
  it("tam sayı iki ondalıkla formatlanır", () => {
    expect(formatPrice(1000)).toMatch(/1\.000,00|1,000\.00/);
    // Türkçe locale: nokta binlik ayraç, virgül ondalık
    expect(formatPrice(1000)).toContain("1.000");
  });

  it("ondalıklı sayı doğru formatlanır", () => {
    const result = formatPrice(1234.5);
    expect(result).toContain("1.234");
    expect(result).toContain("50");
  });

  it("sıfır formatlanır", () => {
    expect(formatPrice(0)).toContain("0,00");
  });
});

describe("formatPriceWithSymbol", () => {
  it("₺ sembolü sona eklenir", () => {
    const result = formatPriceWithSymbol(500);
    expect(result).toContain("₺");
    expect(result).toMatch(/.*₺$/);
  });

  it("büyük tutar doğru formatlanır", () => {
    const result = formatPriceWithSymbol(10000);
    expect(result).toContain("10.000");
    expect(result).toContain("₺");
  });
});

describe("orderStatusLabel", () => {
  it("bilinen statüler Türkçe etikete çevrilir", () => {
    expect(orderStatusLabel("siparis-alindi")).toBe("Sipariş Alındı");
    expect(orderStatusLabel("uretimde")).toBe("Üretimde");
    expect(orderStatusLabel("teslim-edildi")).toBe("Teslim Edildi");
    expect(orderStatusLabel("kargoya-verildi")).toBe("Kargoya Verildi");
    expect(orderStatusLabel("iptal-edildi")).toBe("İptal Edildi");
  });

  it("bilinmeyen statü aynen döner (fallback)", () => {
    expect(orderStatusLabel("yeni-durum-xyz")).toBe("yeni-durum-xyz");
    expect(orderStatusLabel("")).toBe("");
  });
});

describe("generateOrderNumber", () => {
  it("MK- prefix ile başlar", () => {
    const num = generateOrderNumber();
    expect(num).toMatch(/^MK-/);
  });

  it("her çağrıda farklı order number üretir", () => {
    const nums = new Set(Array.from({ length: 20 }, () => generateOrderNumber()));
    expect(nums.size).toBe(20);
  });

  it("üç parçadan oluşur (MK-timestamp-rand)", () => {
    const parts = generateOrderNumber().split("-");
    expect(parts).toHaveLength(3);
    expect(parts[0]).toBe("MK");
    expect(parts[1].length).toBeGreaterThan(0);
    expect(parts[2].length).toBeGreaterThan(0);
  });
});
