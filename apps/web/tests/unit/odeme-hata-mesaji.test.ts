import { describe, expect, it } from "vitest";

import { odemeHataMesaji, bilinenHataKodu } from "@/app/odeme/hata/odeme-hata-mesaji";

describe("odemeHataMesaji", () => {
  it("limit yetersizliğinde somut sebep ve çıkış yolu verir", () => {
    const m = odemeHataMesaji("10051");
    expect(m.baslik).toBe("Kartın limiti yetmedi");
    expect(m.oneri).toMatch(/havale/i); // %5 indirimli alternatif önerilir
  });

  it("bilinmeyen kod UYDURMA açıklama üretmez, genele düşer", () => {
    const m = odemeHataMesaji("99999");
    expect(m.baslik).toBe("Ödeme tamamlanamadı");
    expect(m.oneri).toBeUndefined();
    expect(bilinenHataKodu("99999")).toBe(false);
  });

  it("kod yoksa genel mesaj", () => {
    expect(odemeHataMesaji(null).baslik).toBe("Ödeme tamamlanamadı");
    expect(odemeHataMesaji("").baslik).toBe("Ödeme tamamlanamadı");
    expect(odemeHataMesaji(undefined).baslik).toBe("Ödeme tamamlanamadı");
  });

  it("boşluklu kod da eşleşir (URL'den gelebilir)", () => {
    expect(odemeHataMesaji(" 10051 ").baslik).toBe("Kartın limiti yetmedi");
  });

  it("canlıda görülen iki kod da tabloda ya da genelde karşılanır", () => {
    // Üretimde şu ana kadar 10051 ve 10202 görüldü.
    expect(bilinenHataKodu("10051")).toBe(true);
    expect(odemeHataMesaji("10202").baslik).toBe("Ödeme tamamlanamadı"); // "genel hata" → genel metin doğru
  });

  it("her tanımlı mesajda başlık ve açıklama dolu", () => {
    for (const kod of ["10005", "10012", "10041", "10052", "10054", "10084", "10201"]) {
      const m = odemeHataMesaji(kod);
      expect(m.baslik.length).toBeGreaterThan(3);
      expect(m.aciklama.length).toBeGreaterThan(10);
    }
  });
});
