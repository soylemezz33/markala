import { describe, it, expect } from "vitest";
import {
  ikinciSiparisAsamasi, ikinciSiparisKodu, puanSonTarihi, puanSuresiAsamasi, tekrarSiparisZamaniMi,
  IKINCI_SIPARIS_KUPON, type TeslimatAdayi,
} from "./sadakat-kurallari";

const H = 3_600_000;
const now = new Date("2026-09-10T12:00:00Z");
const aday = (p: Partial<TeslimatAdayi> & { saatOnce: number }): TeslimatAdayi => ({
  id: "o1", deliveredAt: new Date(now.getTime() - p.saatOnce * H), retentionMailStage: 0, retentionCouponCode: null,
  kuponKullanildi: false, tamamlanmisSiparis: 1, pazarlamaIzni: true, email: "a@b.com", ...p,
});

describe("ikinciSiparisAsamasi (karar 1)", () => {
  it("teslimattan 24 saat geçmeden hiçbir şey yapmaz", () => {
    expect(ikinciSiparisAsamasi(aday({ saatOnce: 10 }), now)).toBeNull();
  });
  it("24 saat sonra aşama 1 (kod maili)", () => {
    expect(ikinciSiparisAsamasi(aday({ saatOnce: 25 }), now)).toBe(1);
  });
  it("72 saat sonra, kod kullanılmadıysa aşama 2 (hatırlatma)", () => {
    expect(ikinciSiparisAsamasi(aday({ saatOnce: 80, retentionMailStage: 1 }), now)).toBe(2);
  });
  it("kod kullanıldıysa hatırlatma GİTMEZ", () => {
    expect(ikinciSiparisAsamasi(aday({ saatOnce: 80, retentionMailStage: 1, kuponKullanildi: true }), now)).toBeNull();
  });
  it("aşama 1 atlanmışsa 72 saatte doğrudan aşama 1 gönderilmez, önce kod (1) gider", () => {
    expect(ikinciSiparisAsamasi(aday({ saatOnce: 80, retentionMailStage: 0 }), now)).toBe(1);
  });
  it("pazarlama izni yoksa 9 (uygun değil)", () => {
    expect(ikinciSiparisAsamasi(aday({ saatOnce: 30, pazarlamaIzni: false }), now)).toBe(9);
  });
  it("ikinci ve sonraki siparişlerde teşvik yok (yalnız ilk sipariş)", () => {
    expect(ikinciSiparisAsamasi(aday({ saatOnce: 30, tamamlanmisSiparis: 2 }), now)).toBe(9);
  });
  it("14 günden eski teslimata geç mail gitmez", () => {
    expect(ikinciSiparisAsamasi(aday({ saatOnce: 24 * 20 }), now)).toBe(9);
  });
  it("aşama 2 veya 9 olan adaya dokunulmaz", () => {
    expect(ikinciSiparisAsamasi(aday({ saatOnce: 100, retentionMailStage: 2 }), now)).toBeNull();
    expect(ikinciSiparisAsamasi(aday({ saatOnce: 100, retentionMailStage: 9 }), now)).toBeNull();
  });
});

describe("ikinciSiparisKodu", () => {
  it("TESEKKUR-XXXXXX biçiminde, karışan harfler (0/O/1/I) yok", () => {
    for (let i = 0; i < 50; i++) expect(ikinciSiparisKodu()).toMatch(/^TESEKKUR-[ABCDEFGHJKLMNPQRSTUVWXYZ23456789]{6}$/);
  });
  it("sabitler ortak kararla uyumlu: %10, 21 gün, min 750 ₺", () => {
    expect(IKINCI_SIPARIS_KUPON.yuzde).toBe(10);
    expect(IKINCI_SIPARIS_KUPON.gecerlilikGun).toBe(21);
    expect(IKINCI_SIPARIS_KUPON.minSepetTl).toBe(750);
  });
});

describe("puan süresi (karar 2)", () => {
  it("son kazanımdan 12 ay sonra dolar", () => {
    expect(puanSonTarihi(new Date("2026-09-06T10:00:00Z")).toISOString().slice(0, 10)).toBe("2027-09-06");
  });
  it("30 gün kala 1, 7 gün kala 2, dolunca sıfırla; bakiye yoksa hiçbir şey", () => {
    const g = (gun: number) => new Date(now.getTime() + gun * 86_400_000);
    expect(puanSuresiAsamasi(g(60), 0, 500, now)).toBeNull();
    expect(puanSuresiAsamasi(g(25), 0, 500, now)).toBe(1);
    expect(puanSuresiAsamasi(g(25), 1, 500, now)).toBeNull();
    expect(puanSuresiAsamasi(g(5), 1, 500, now)).toBe(2);
    expect(puanSuresiAsamasi(g(5), 2, 500, now)).toBeNull();
    expect(puanSuresiAsamasi(g(-1), 2, 500, now)).toBe("sifirla");
    expect(puanSuresiAsamasi(g(-1), 2, 0, now)).toBeNull();
    expect(puanSuresiAsamasi(null, 0, 500, now)).toBeNull();
  });
});

describe("tekrarSiparisZamaniMi (karar 5)", () => {
  const gun = (n: number) => new Date(now.getTime() - n * 86_400_000);
  it("kartvizit 90. gün ile 104. gün arasında", () => {
    expect(tekrarSiparisZamaniMi("kartvizit", gun(89), now)).toBe(false);
    expect(tekrarSiparisZamaniMi("kartvizit", gun(90), now)).toBe(true);
    expect(tekrarSiparisZamaniMi("kartvizit", gun(104), now)).toBe(true);
    expect(tekrarSiparisZamaniMi("kartvizit", gun(120), now)).toBe(false);
  });
  it("broşür/etiket 60 gün, İSG 11 ay", () => {
    expect(tekrarSiparisZamaniMi("brosur", gun(61), now)).toBe(true);
    expect(tekrarSiparisZamaniMi("etiket", gun(30), now)).toBe(false);
    expect(tekrarSiparisZamaniMi("is-guvenligi-yangin", gun(336), now)).toBe(true);
    expect(tekrarSiparisZamaniMi("is-guvenligi-yangin", gun(200), now)).toBe(false);
  });
  it("branda/bayrak yalnız Mart ve Eylül'ün ilk haftası, teslimattan 30+ gün sonra", () => {
    const eylul3 = new Date("2026-09-03T09:00:00Z");
    expect(tekrarSiparisZamaniMi("vinil-branda-afis", new Date("2026-07-01T00:00:00Z"), eylul3)).toBe(true);
    expect(tekrarSiparisZamaniMi("vinil-branda-afis", new Date("2026-08-20T00:00:00Z"), eylul3)).toBe(false); // 30 gün olmadı
    expect(tekrarSiparisZamaniMi("vinil-branda-afis", new Date("2026-07-01T00:00:00Z"), new Date("2026-09-15T09:00:00Z"))).toBe(false); // pencere dışı
    expect(tekrarSiparisZamaniMi("yelken-bayrak", new Date("2026-01-01T00:00:00Z"), new Date("2026-03-02T09:00:00Z"))).toBe(true);
  });
  it("döngüsü tanımsız kategoride hatırlatma yok", () => {
    expect(tekrarSiparisZamaniMi("plaket", gun(90), now)).toBe(false);
  });
});
