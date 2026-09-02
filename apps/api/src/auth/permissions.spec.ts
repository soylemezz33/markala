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

  it("müşteri kartını görür (Hasan: menüde Siparişler + Müşteriler)", () => {
    expect(roleHasPerm("kargo", PERM.CUSTOMERS_READ)).toBe(true);
  });

  it("müşteri e-posta günlüğünü toplayamaz — INBOX yok", () => {
    // /admin/notification-logs tüm müşterilerin e-posta adresini sayfalayarak veriyor
    // (KVKK'da toplu PII dışa aktarımı). CUSTOMERS_READ'ten ayrılıp INBOX'a taşındı ki
    // kargoya müşteri kartı açılırken bu döküm de açılmasın.
    expect(roleHasPerm("kargo", PERM.INBOX)).toBe(false);
  });

  it("panoyu görmez — DASHBOARD yok (doğrudan Siparişler'e düşer)", () => {
    expect(roleHasPerm("kargo", PERM.DASHBOARD)).toBe(false);
  });

  it("içerik/ayar/medya yetkisi yok", () => {
    for (const p of [PERM.SETTINGS, PERM.CATALOG, PERM.MEDIA, PERM.REVIEWS]) {
      expect(roleHasPerm("kargo", p)).toBe(false);
    }
  });

  it("izin listesi tam olarak üç anahtardan ibaret", () => {
    // Yeni izin eklenirse burada görünür — "acaba kargo bunu görmeli mi?" sorusunu zorlar.
    expect(permsForRole("kargo").sort()).toEqual(
      [PERM.ORDERS_READ, PERM.ORDERS_TRACKING, PERM.CUSTOMERS_READ].sort(),
    );
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

  it("tasarımcı ve muhasebe gelen kutusu + panoyu KAYBETMEDİ (kargo icin ayirma yapildi)", () => {
    // customers.read dört sayfayi birden aciyordu; inbox.read'e ayirinca bu iki rolun
    // yetkisi acikca geri verilmeliydi, yoksa sessizce sayfa kaybederlerdi.
    for (const rol of ["tasarimci", "muhasebe"]) {
      expect(roleHasPerm(rol, PERM.INBOX)).toBe(true);
      expect(roleHasPerm(rol, PERM.DASHBOARD)).toBe(true);
      expect(roleHasPerm(rol, PERM.CUSTOMERS_READ)).toBe(true);
    }
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

describe("tasarım dosyası izni — orders.design (2026-09-02, üretim ARGE Faz 2)", () => {
  it("tasarımcı ve admin yükler/siler", () => {
    expect(roleHasPerm("tasarimci", PERM.ORDERS_DESIGN)).toBe(true);
    expect(roleHasPerm("admin", PERM.ORDERS_DESIGN)).toBe(true);
  });

  it("kargo ve muhasebe YALNIZ görür/indirir — yükleyemez (varsayılan kapalı)", () => {
    expect(roleHasPerm("kargo", PERM.ORDERS_DESIGN)).toBe(false);
    expect(roleHasPerm("muhasebe", PERM.ORDERS_DESIGN)).toBe(false);
    // İndirme ORDERS_READ'e bağlı kalır; ikisi de görmeye devam eder.
    expect(roleHasPerm("kargo", PERM.ORDERS_READ)).toBe(true);
    expect(roleHasPerm("muhasebe", PERM.ORDERS_READ)).toBe(true);
  });

  it("ORDERS_STATUS'tan ayrı bir anahtar — biri diğerini ima etmez", () => {
    expect(PERM.ORDERS_DESIGN).not.toBe(PERM.ORDERS_STATUS);
  });
});
