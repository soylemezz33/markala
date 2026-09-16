import { describe, it, expect } from "vitest";
import { manuelSiparisHesapla, manuelSiparisNotu, epostaYerTutucu, epostaYerTutucuMu, YUZ_YUZE_ODEME, konfigurasyonOzeti } from "./manuel-siparis-kural";

describe("manuelSiparisHesapla — KDV dahil satırlardan ara toplam/KDV/toplam", () => {
  it("2×1000 + 1×500, indirim 100, kargo 115", () => {
    const h = manuelSiparisHesapla([{ quantity: 2, unitPrice: 1000 }, { quantity: 1, unitPrice: 500 }], 100, 115);
    expect(h.satirlar).toEqual([2000, 500]);
    expect(h.subtotal).toBe(2500);
    expect(h.discount).toBe(100);
    expect(h.vat).toBe(400); // 2400 - 2400/1.2
    expect(h.total).toBe(2515);
  });
  it("indirim ara toplamı aşamaz; negatifler sıfırlanır; adet tam sayıya kırpılır", () => {
    const h = manuelSiparisHesapla([{ quantity: 1.9, unitPrice: 100 }], 500, -5);
    expect(h.satirlar).toEqual([100]);
    expect(h.discount).toBe(100);
    expect(h.shippingFee).toBe(0);
    expect(h.total).toBe(0);
  });
});

describe("manuelSiparisNotu / e-posta yer tutucu", () => {
  it("not: kanal + oluşturan + ödeme, ek not yeni satırda", () => {
    expect(manuelSiparisNotu("yuz-yuze", "nakit", "Hasan Söylemez", true, " kasa fişi kesildi ")).toBe(
      "Kanal: Yüz yüze · Manuel sipariş (Hasan Söylemez) · Ödeme: Nakit (alındı)\nkasa fişi kesildi",
    );
    expect(manuelSiparisNotu("telefon", "havale", "Can", false)).toContain("(bekliyor)");
  });
  it("yer tutucu kendi alanımızda ve tanınıyor", () => {
    const e = epostaYerTutucu("+90 541 352 73 52");
    expect(e).toBe("yok+905413527352@markala.com.tr");
    expect(epostaYerTutucuMu(e)).toBe(true);
    expect(epostaYerTutucuMu("a@b.com")).toBe(false);
  });
  it("yüz yüze ödeme yöntemleri", () => {
    expect(YUZ_YUZE_ODEME).toEqual(["nakit", "pos"]);
  });
});

describe("konfigurasyonOzeti — sitedeki buildSelectionSummary eşi", () => {
  it("en×boy + grup sırasıyla seçenek etiketleri", () => {
    const opts = [
      { groupKey: "ekislem", groupSort: 2, optionKey: "germe", optionLabel: "Germe" },
      { groupKey: "malzeme", groupSort: 1, optionKey: "cin-440gr", optionLabel: "Çin Vinil 440 gr" },
      { groupKey: "malzeme", groupSort: 1, optionKey: "cin-280gr", optionLabel: "Çin Vinil 280 gr" },
    ];
    expect(konfigurasyonOzeti(opts, { en: "270", boy: "85", malzeme: "cin-440gr", ekislem: "germe" })).toBe("270×85 cm · Çin Vinil 440 gr · Germe");
    expect(konfigurasyonOzeti(opts, { malzeme: "yok-boyle" })).toBe("");
  });
});
