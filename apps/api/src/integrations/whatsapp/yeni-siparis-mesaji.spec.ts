import { describe, it, expect } from "vitest";
import {
  odemeDurumu,
  tutarYaz,
  urunOzeti,
  tekSatir,
  numarayiNormalize,
  yeniSiparisParametreleri,
} from "./yeni-siparis-mesaji";

/**
 * Bu testlerin koruduğu iki şey:
 * 1) ÖDEME DURUMU asla yanlış olumlu olmasın — Hasan mesaja bakıp "ödeme alındı" diye baskıya
 *    veriyor. Bilinmeyen durum "alındı" gibi görünmemeli.
 * 2) Şablon parametreleri satır sonu/çoklu boşluk İÇERMESİN — Meta bu mesajları reddediyor
 *    (#132000) ve bildirim sessizce kaybolurdu.
 */
describe("odemeDurumu", () => {
  it("başarılı ödeme AÇIKÇA alındı der", () => {
    expect(odemeDurumu("basarili", "kart")).toBe("✅ ALINDI — kredi kartı");
  });

  it("bekleyen havalede 'ödeme alınmadı' yazar", () => {
    const s = odemeDurumu("beklemede", "havale");
    expect(s).toContain("BEKLİYOR");
    expect(s).toContain("ödeme alınmadı");
  });

  it("cari sipariş ödendi gibi GÖRÜNMEZ", () => {
    const s = odemeDurumu("beklemede", "cari");
    expect(s).toContain("CARİ");
    expect(s).not.toContain("ALINDI");
  });

  it("başarısız ve iade durumları ayırt edilir", () => {
    expect(odemeDurumu("basarisiz", "kart")).toContain("BAŞARISIZ");
    expect(odemeDurumu("iade_edildi", "kart")).toContain("İADE");
  });

  it("bilinmeyen durum ASLA 'alındı' demez", () => {
    for (const d of ["", null, "yeni_bir_durum"]) {
      const s = odemeDurumu(d as string | null, "kart");
      expect(s).toContain("bilinmiyor");
      expect(s).not.toContain("ALINDI");
    }
  });
});

describe("tutarYaz", () => {
  it("Türkçe biçimde yazar", () => {
    expect(tutarYaz(3480)).toBe("3.480,00 TL");
    expect(tutarYaz("1234.5")).toBe("1.234,50 TL");
  });

  it("Prisma Decimal gibi toString'i olan nesneyi çözer", () => {
    expect(tutarYaz({ toString: () => "99.9" })).toBe("99,90 TL");
  });

  it("sayıya çevrilemeyen değerde tutar UYDURMAZ", () => {
    expect(tutarYaz("abc")).toBe("—");
    expect(tutarYaz(null)).toBe("—");
  });
});

describe("urunOzeti", () => {
  it("tek ürünü adediyle yazar", () => {
    expect(urunOzeti([{ productName: "Klasik Kartvizit", quantity: 1000 }])).toBe(
      "1000 adet Klasik Kartvizit",
    );
  });

  it("sığmayan ürünleri '+N ürün' olarak sayar (sessizce kaybetmez)", () => {
    const kalemler = Array.from({ length: 12 }, (_, i) => ({
      productName: `Çok Uzun Ürün Adı Numara ${i}`,
      quantity: 5,
    }));
    const ozet = urunOzeti(kalemler);
    expect(ozet).toMatch(/\+\d+ ürün$/);
    expect(ozet.length).toBeLessThanOrEqual(160);
  });

  it("ürün yoksa uydurmaz", () => {
    expect(urunOzeti([])).toBe("ürün bilgisi yok");
  });
});

describe("tekSatir", () => {
  it("satır sonu ve sekmeleri temizler (Meta şablon parametresi kabul etmiyor)", () => {
    expect(tekSatir("a\nb\tc")).toBe("a b c");
  });

  it("art arda boşlukları teke indirir", () => {
    expect(tekSatir("a     b")).toBe("a b");
  });

  it("tavanı aşan metni kırpar", () => {
    expect(tekSatir("x".repeat(300)).length).toBeLessThanOrEqual(160);
  });
});

describe("numarayiNormalize", () => {
  it("yerel biçimleri ülke koduna çevirir", () => {
    expect(numarayiNormalize("0531 900 41 02")).toBe("905319004102");
    expect(numarayiNormalize("5319004102")).toBe("905319004102");
    expect(numarayiNormalize("+90 531 900 41 02")).toBe("905319004102");
  });

  it("geçersiz numarada null döner (uydurulmuş numaraya mesaj gitmesin)", () => {
    expect(numarayiNormalize("")).toBeNull();
    expect(numarayiNormalize("123")).toBeNull();
    expect(numarayiNormalize(null)).toBeNull();
  });
});

describe("yeniSiparisParametreleri", () => {
  const siparis = {
    orderNumber: "MK-MTPW0ACH-APSO",
    totalAmount: 3480,
    paymentStatus: "basarili",
    paymentMethod: "kart",
    items: [{ productName: "Klasik Kartvizit", quantity: 1000 }],
    musteriAdi: "Ahmet Yılmaz",
    email: "a@x.com",
  };

  it("şablon sırasına göre 5 parametre üretir", () => {
    const p = yeniSiparisParametreleri(siparis);
    expect(p).toHaveLength(5);
    expect(p[0]).toBe("MK-MTPW0ACH-APSO");
    expect(p[1]).toContain("ALINDI");
    expect(p[2]).toBe("3.480,00 TL");
    expect(p[3]).toBe("Ahmet Yılmaz");
    expect(p[4]).toContain("Klasik Kartvizit");
  });

  it("HİÇBİR parametrede satır sonu olmaz", () => {
    const p = yeniSiparisParametreleri({
      ...siparis,
      musteriAdi: "Ahmet\nYılmaz",
      items: [{ productName: "Afiş\n70x100", quantity: 5 }],
    });
    for (const deger of p) expect(deger).not.toMatch(/[\r\n\t]/);
  });

  it("müşteri adı yoksa e-postaya düşer, o da yoksa tire", () => {
    expect(yeniSiparisParametreleri({ ...siparis, musteriAdi: null })[3]).toBe("a@x.com");
    expect(yeniSiparisParametreleri({ ...siparis, musteriAdi: null, email: null })[3]).toBe("—");
  });
});
