import { describe, it, expect } from "vitest";
import { maxBusinessDays, estimateDelivery } from "@/lib/delivery";

/**
 * Teslimat tarihi tahmini — conversion kritik fonksiyon.
 * "En geç X tarihinde kargoda" mesajı ürün sayfasında gösteriliyor;
 * yanlış hesap = müşteri beklentisi yönetimi hatası.
 */

describe("maxBusinessDays", () => {
  it('"1-2 iş günü" → 2 (en yüksek sayı)', () => {
    expect(maxBusinessDays("1-2 iş günü")).toBe(2);
  });

  it('"3 iş günü" → 3', () => {
    expect(maxBusinessDays("3 iş günü")).toBe(3);
  });

  it('"2-3 iş günü" → 3', () => {
    expect(maxBusinessDays("2-3 iş günü")).toBe(3);
  });

  it("sayı içermeyen string → güvenli varsayılan 3", () => {
    expect(maxBusinessDays("belirsiz")).toBe(3);
  });

  it("boş string → 3", () => {
    expect(maxBusinessDays("")).toBe(3);
  });
});

describe("estimateDelivery — cutoff ve iş günü mantığı", () => {
  // Pazartesi 09:00 (cutoff öncesi, hafta içi)
  const monAm = new Date("2026-06-15T09:00:00");

  it("Pazartesi 09:00 + 2 iş günü → Çarşamba (aynı gün üretime girer)", () => {
    const result = estimateDelivery("1-2 iş günü", monAm);
    expect(result.sameDayIntake).toBe(true);
    expect(result.beforeCutoff).toBe(true);
    // Pazartesi + 2 iş günü = Çarşamba
    expect(result.shipDate.getDay()).toBe(3); // 3 = Çarşamba
  });

  it("Pazartesi 15:00 (cutoff sonrası) → üretime Salı giriyor (+1 ofset)", () => {
    const monPm = new Date("2026-06-15T15:00:00");
    const result = estimateDelivery("1-2 iş günü", monPm);
    expect(result.sameDayIntake).toBe(false);
    expect(result.beforeCutoff).toBe(false);
    // cutoff sonrası → +1 ofset → Pazartesi + 3 iş günü = Perşembe
    expect(result.shipDate.getDay()).toBe(4); // 4 = Perşembe
  });

  it("Cuma 13:59 → o gün üretime giriyor, hafta sonu atlanıyor", () => {
    const friAm = new Date("2026-06-19T13:59:00"); // Cuma, cutoff öncesi
    const result = estimateDelivery("1-2 iş günü", friAm);
    expect(result.sameDayIntake).toBe(true);
    // Cuma + 2 iş günü = Salı (Cumartesi+Pazar atlanır)
    expect(result.shipDate.getDay()).toBe(2); // 2 = Salı
  });

  it("Cumartesi → üretime Pazartesi giriyor (hafta sonu)", () => {
    const sat = new Date("2026-06-20T10:00:00"); // Cumartesi
    const result = estimateDelivery("1-2 iş günü", sat);
    expect(result.sameDayIntake).toBe(false);
    // Cumartesi → +1 ofset → efektif başlangıç Pazartesi
    // Pazartesi + 2 iş günü = Çarşamba
    expect(result.shipDate.getDay()).toBe(3); // Çarşamba
  });

  it("label Türkçe gün + ay formatında döner", () => {
    const result = estimateDelivery("3 iş günü", monAm);
    // "D Ay Gün" formatı bekleniyor (örn. "18 Haziran Perşembe")
    expect(result.label).toMatch(/^\d+ \w+ \w+$/);
    expect(result.label).toContain("Haziran");
  });

  it("delivery estimate objesi gerekli alanları içerir", () => {
    const result = estimateDelivery("2-3 iş günü", monAm);
    expect(result).toHaveProperty("shipDate");
    expect(result).toHaveProperty("label");
    expect(result).toHaveProperty("sameDayIntake");
    expect(result).toHaveProperty("beforeCutoff");
    expect(result.shipDate).toBeInstanceOf(Date);
  });
});
