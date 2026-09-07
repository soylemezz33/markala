import { describe, it, expect } from "vitest";
import {
  enKotuSeviye,
  veritabaniSeviyesi,
  epostaSeviyesi,
  hataSeviyesi,
  diskSeviyesi,
  isSeviyesi,
} from "./saglik-kurallari";
import { sunucuHatasiKaydet, hataOzeti, hataSayaciniSifirla } from "./hata-sayaci";

/**
 * Bu testlerin koruduğu tek şey: sağlık göstergesi YANLIŞ YERE YEŞİL yanmasın.
 * 7 Eylül 2026'da site 45 dakika 500 döndü ve panel "Operasyonel" dedi; kesinti ancak
 * Hasan giriş yapamayınca fark edildi. Ölçülemeyen hiçbir şey "sağlıklı" sayılmamalı.
 */
describe("enKotuSeviye", () => {
  it("bir bileşen arızalıysa sistem ARIZALI", () => {
    expect(enKotuSeviye(["saglikli", "uyari", "arizali"])).toBe("arizali");
  });
  it("arıza yoksa ama uyarı varsa UYARI", () => {
    expect(enKotuSeviye(["saglikli", "uyari"])).toBe("uyari");
  });
  it("hepsi sağlıklıysa SAĞLIKLI", () => {
    expect(enKotuSeviye(["saglikli", "saglikli"])).toBe("saglikli");
  });
});

describe("veritabaniSeviyesi", () => {
  it("bağlanamıyorsa ARIZALI", () => {
    expect(veritabaniSeviyesi({ baglanti: false, gecikmeMs: null, acik: null, limit: 17 })).toBe("arizali");
  });

  it("7 EYLÜL SENARYOSU: havuz dolduğunda ARIZALI", () => {
    // 17/17 — o gün tam olarak bu oldu ve hiçbir gösterge kırmızıya dönmedi.
    expect(veritabaniSeviyesi({ baglanti: true, gecikmeMs: 5, acik: 17, limit: 17 })).toBe("arizali");
  });

  it("havuz dolmaya yaklaşınca UYARI (kesintiden ÖNCE görünsün)", () => {
    expect(veritabaniSeviyesi({ baglanti: true, gecikmeMs: 5, acik: 13, limit: 17 })).toBe("uyari");
  });

  it("havuz rahatken SAĞLIKLI", () => {
    expect(veritabaniSeviyesi({ baglanti: true, gecikmeMs: 5, acik: 4, limit: 17 })).toBe("saglikli");
  });

  it("yavaş veritabanı UYARI verir", () => {
    expect(veritabaniSeviyesi({ baglanti: true, gecikmeMs: 3000, acik: 2, limit: 17 })).toBe("uyari");
  });

  it("limit ölçülemediyse havuz sessizce yok sayılır ama bağlantı yine değerlendirilir", () => {
    expect(veritabaniSeviyesi({ baglanti: true, gecikmeMs: 5, acik: 99, limit: null })).toBe("saglikli");
  });
});

describe("epostaSeviyesi", () => {
  it("aktif arızada ARIZALI", () => {
    expect(epostaSeviyesi({ ok: false, failedLast24h: 3 })).toBe("arizali");
  });
  it("toparlamış ama son 24 saatte hata varsa UYARI (iz kaybolmasın)", () => {
    expect(epostaSeviyesi({ ok: true, failedLast24h: 25 })).toBe("uyari");
  });
  it("hata yoksa SAĞLIKLI", () => {
    expect(epostaSeviyesi({ ok: true, failedLast24h: 0 })).toBe("saglikli");
  });
});

describe("hataSeviyesi", () => {
  it("son 5 dakikada 500 varsa ARIZALI", () => {
    expect(hataSeviyesi({ son5dk: 2, son1saat: 2 })).toBe("arizali");
  });
  it("saat içinde olmuş ama şimdi durmuşsa UYARI", () => {
    expect(hataSeviyesi({ son5dk: 0, son1saat: 40 })).toBe("uyari");
  });
  it("hiç hata yoksa SAĞLIKLI", () => {
    expect(hataSeviyesi({ son5dk: 0, son1saat: 0 })).toBe("saglikli");
  });
});

describe("diskSeviyesi", () => {
  it("ölçülemediyse ASLA sağlıklı demez", () => {
    expect(diskSeviyesi(null)).toBe("uyari");
  });
  it("eşiklere göre uyarı/arıza", () => {
    expect(diskSeviyesi(55)).toBe("saglikli");
    expect(diskSeviyesi(85)).toBe("uyari");
    expect(diskSeviyesi(95)).toBe("arizali");
  });
});

describe("isSeviyesi", () => {
  const simdi = new Date("2026-09-07T10:00:00Z");

  it("hiç kayıtlı iş yoksa UYARI (zamanlayıcı ayakta değil)", () => {
    expect(isSeviyesi([], simdi)).toBe("uyari");
  });

  it("bir işin çalışma anı geçmişte kaldıysa UYARI (zamanlayıcı durmuş)", () => {
    expect(isSeviyesi([{ sonrakiCalisma: "2026-09-07T09:00:00Z" }], simdi)).toBe("uyari");
  });

  it("işler ileri tarihliyse SAĞLIKLI", () => {
    expect(isSeviyesi([{ sonrakiCalisma: "2026-09-07T11:00:00Z" }], simdi)).toBe("saglikli");
  });

  it("sonraki çalışma hesaplanamayan iş tek başına uyarı üretmez", () => {
    expect(isSeviyesi([{ sonrakiCalisma: null }], simdi)).toBe("saglikli");
  });
});

describe("hata sayacı", () => {
  it("5xx'leri sayar, 4xx'leri saymaz", () => {
    hataSayaciniSifirla();
    sunucuHatasiKaydet("/api/products", 500);
    sunucuHatasiKaydet("/api/products", 503);
    sunucuHatasiKaydet("/api/giris", 401); // istemci hatası — sayılmamalı
    const o = hataOzeti();
    expect(o.son1saat).toBe(2);
    expect(o.son5dk).toBe(2);
    expect(o.enSikYollar[0]).toEqual({ yol: "/api/products", adet: 2 });
  });

  it("bir saatten eski kayıtlar düşer", () => {
    hataSayaciniSifirla();
    sunucuHatasiKaydet("/api/eski", 500);
    const ileri = Date.now() + 61 * 60 * 1000;
    expect(hataOzeti(ileri).son1saat).toBe(0);
  });

  it("hata fırtınasında bellek sınırsız büyümez", () => {
    hataSayaciniSifirla();
    for (let i = 0; i < 5000; i++) sunucuHatasiKaydet("/api/x", 500);
    expect(hataOzeti().son1saat).toBeLessThanOrEqual(500);
  });
});
