import { describe, expect, it } from "vitest";

import { adresKaydiSorulsunMu, ayniAdresMi } from "@/app/odeme/adres-kaydet-kurali";

const adres = {
  city: "İstanbul",
  district: "Kadıköy",
  fullAddress: "Caferağa Mah. Moda Cad. No:12 D:3",
};

describe("adresKaydiSorulsunMu", () => {
  it("girişli kullanıcıya, yeni adreste sorulur", () => {
    expect(adresKaydiSorulsunMu({ girisYapildi: true, form: adres, kayitliAdresler: [] })).toBe(
      true,
    );
  });

  it("misafire sorulmaz — kaydedilecek hesap yok", () => {
    expect(adresKaydiSorulsunMu({ girisYapildi: false, form: adres, kayitliAdresler: [] })).toBe(
      false,
    );
  });

  it("adres hesapta zaten kayıtlıysa sorulmaz", () => {
    expect(
      adresKaydiSorulsunMu({ girisYapildi: true, form: adres, kayitliAdresler: [adres] }),
    ).toBe(false);
  });

  it("kayıtlı adres yalnız boşluk/harf farkıyla yazıldıysa yine sorulmaz", () => {
    const yazim = {
      city: "  istanbul ",
      district: "KADIKÖY",
      fullAddress: "Caferağa Mah.   Moda Cad. No:12 D:3  ",
    };
    expect(
      adresKaydiSorulsunMu({ girisYapildi: true, form: yazim, kayitliAdresler: [adres] }),
    ).toBe(false);
  });

  it("başka bir adres kayıtlıyken yeni adres için sorulur", () => {
    const baska = { ...adres, fullAddress: "Fenerbahçe Mah. Bağdat Cad. No:5" };
    expect(
      adresKaydiSorulsunMu({ girisYapildi: true, form: baska, kayitliAdresler: [adres] }),
    ).toBe(true);
  });

  it("il boşken sorulmaz", () => {
    expect(
      adresKaydiSorulsunMu({
        girisYapildi: true,
        form: { ...adres, city: "  " },
        kayitliAdresler: [],
      }),
    ).toBe(false);
  });

  it("açık adres henüz yazılırken (kısa) sorulmaz", () => {
    expect(
      adresKaydiSorulsunMu({
        girisYapildi: true,
        form: { ...adres, fullAddress: "Moda" },
        kayitliAdresler: [],
      }),
    ).toBe(false);
  });

  it("ayniAdresMi ilçe farkını yakalar", () => {
    expect(ayniAdresMi(adres, { ...adres, district: "Üsküdar" })).toBe(false);
  });
});
