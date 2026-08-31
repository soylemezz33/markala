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
  // MARKA KURALI (2026-08-31): tam sayıda ondalık YOK, kuruş varsa HER ZAMAN iki basamak.
  // Eskiden her tutar iki ondalıkla yazılıyordu; packages/ui'daki Price ise minimum 0
  // kullandığı için 632.40 "632,4" çıkıyordu ve sepet ekranında iki biçim yan yana
  // görünüyordu. Kural iki tarafta da aynı hale getirildi.
  it("tam sayıda ondalık gösterilmez", () => {
    expect(formatPrice(1000)).toBe("1.000");
    expect(formatPrice(480)).toBe("480");
  });

  it("kuruş varsa DAİMA iki basamak — asla tek", () => {
    expect(formatPrice(34.9)).toBe("34,90");
    expect(formatPrice(632.4)).toBe("632,40");
    expect(formatPrice(34.95)).toBe("34,95");
  });

  it("ondalıklı sayı doğru formatlanır", () => {
    const result = formatPrice(1234.5);
    expect(result).toContain("1.234");
    expect(result).toContain("50");
  });

  it("sıfır formatlanır", () => {
    expect(formatPrice(0)).toBe("0");
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

  it("bilinmeyen statü → 'Bilinmeyen Durum' (fallback; ham anahtar UI'de gösterilmez)", () => {
    expect(orderStatusLabel("yeni-durum-xyz")).toBe("Bilinmeyen Durum");
    expect(orderStatusLabel("")).toBe("Bilinmeyen Durum");
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
