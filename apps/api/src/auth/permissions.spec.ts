import { describe, it, expect } from "vitest";
import { PERM, ROLE_PERMISSIONS, PANEL_ROLES, roleHasPerm, permsForRole } from "./permissions";

/**
 * ROL YETKİ SINIRLARI — bu testler "sessiz yetki genişlemesine" karşı bir kilit.
 *
 * Rol tanımına yeni bir izin eklemek tek satırlık, zararsız görünen bir değişikliktir;
 * gözden kaçarsa dar yetkili bir hesap sessizce para/PII görmeye başlar. Aşağıdaki
 * beklentiler kasıtlı olarak "sahip DEĞİL" yönünde yazıldı: biri gevşetilirse test kırılır
 * ve değişikliği yapan kişi ne yaptığını görmek zorunda kalır.
 */
describe("kargo rolü (2026-09-01)", () => {
  it("panele girebilir", () => {
    expect(PANEL_ROLES).toContain("kargo");
  });

  it("siparişi görür ve takip no yazar", () => {
    expect(roleHasPerm("kargo", PERM.ORDERS_READ)).toBe(true);
    expect(roleHasPerm("kargo", PERM.ORDERS_TRACKING)).toBe(true);
  });

  it("TUTAR/MALİYET görmez — ORDERS_AMOUNTS yok", () => {
    // Bu izin yoksa orders.service parasalAlanlariAyikla total/vat/unitPrice/lineTotal ve
    // items[].costTotal (tedarikçi maliyeti) alanlarını yanıttan siler.
    expect(roleHasPerm("kargo", PERM.ORDERS_AMOUNTS)).toBe(false);
    expect(roleHasPerm("kargo", PERM.FINANCE)).toBe(false);
    expect(roleHasPerm("kargo", PERM.PRICING)).toBe(false);
  });

  it("siparişi İPTAL EDEMEZ — ORDERS_STATUS yok", () => {
    // ORDERS_STATUS iptal (sadakat puanı iadesi + müşteriye iptal maili), geri adım ve
    // mail-önizleme ucunu (fiyatlı siparişi keyfi adrese gönderme) da açıyor.
    expect(roleHasPerm("kargo", PERM.ORDERS_STATUS)).toBe(false);
  });

  it("müşteri e-posta günlüğünü toplayamaz — CUSTOMERS_READ yok", () => {
    // Tek açtığı uç /admin/notification-logs: tüm müşterilerin e-posta adresleri,
    // sayfalanabilir ve aranabilir (KVKK'da toplu PII dışa aktarımı).
    expect(roleHasPerm("kargo", PERM.CUSTOMERS_READ)).toBe(false);
  });

  it("içerik/ayar/medya yetkisi yok", () => {
    for (const p of [PERM.SETTINGS, PERM.CATALOG, PERM.MEDIA, PERM.REVIEWS]) {
      expect(roleHasPerm("kargo", p)).toBe(false);
    }
  });

  it("izin listesi tam olarak iki anahtardan ibaret", () => {
    // Yeni izin eklenirse burada görünür — "acaba kargo bunu görmeli mi?" sorusunu zorlar.
    expect(permsForRole("kargo").sort()).toEqual([PERM.ORDERS_READ, PERM.ORDERS_TRACKING].sort());
  });
});

describe("mevcut roller — kargo eklenirken regresyon olmamalı", () => {
  it("tasarımcı ve muhasebe tutarları GÖRMEYE DEVAM eder (Hasan: şimdilik yalnız kargo kısıtlansın)", () => {
    // Filtre FINANCE'e bağlansaydı bu iki rol de anında etkilenirdi; ayrı ORDERS_AMOUNTS
    // anahtarı tam olarak bunu önlemek için var.
    expect(roleHasPerm("tasarimci", PERM.ORDERS_AMOUNTS)).toBe(true);
    expect(roleHasPerm("muhasebe", PERM.ORDERS_AMOUNTS)).toBe(true);
  });

  it("tasarımcı takip no yazmaya devam eder (uç ORDERS_STATUS'tan ORDERS_TRACKING'e taşındı)", () => {
    expect(roleHasPerm("tasarimci", PERM.ORDERS_TRACKING)).toBe(true);
    expect(roleHasPerm("tasarimci", PERM.ORDERS_STATUS)).toBe(true);
  });

  it("muhasebe durum makinesine dokunamaz (eskiden de dokunamıyordu)", () => {
    expect(roleHasPerm("muhasebe", PERM.ORDERS_STATUS)).toBe(false);
    expect(roleHasPerm("muhasebe", PERM.ORDERS_TRACKING)).toBe(false);
  });

  it("admin ve super_admin joker izinli", () => {
    expect(ROLE_PERMISSIONS.admin).toBe("*");
    expect(ROLE_PERMISSIONS.super_admin).toBe("*");
    expect(roleHasPerm("admin", PERM.ORDERS_AMOUNTS)).toBe(true);
  });

  it("müşteri ve tanımsız rol hiçbir panel iznine sahip değil", () => {
    expect(roleHasPerm("customer", PERM.ORDERS_READ)).toBe(false);
    expect(roleHasPerm(undefined, PERM.ORDERS_READ)).toBe(false);
    expect(roleHasPerm("uydurma_rol", PERM.ORDERS_READ)).toBe(false);
  });
});
