import { describe, it, expect } from "vitest";
import {
  kurtarmaAsamasi,
  kurtarilabilirDurumMu,
  minimumYasSaat,
  KURTARMA_SURELERI,
} from "./odeme-kurtarma-kurali";

const g = (o: Partial<Parameters<typeof kurtarmaAsamasi>[0]> = {}) => ({
  odemeDurumu: "beklemede",
  yasSaat: 5,
  gonderilenAsama: 0,
  sonrakiOdenmisSiparisVar: false,
  ...o,
});

describe("kurtarilabilirDurumMu", () => {
  it("bekleyen ve BAŞARISIZ ödeme kapsamda", () => {
    expect(kurtarilabilirDurumMu("beklemede")).toBe(true);
    expect(kurtarilabilirDurumMu("basarisiz")).toBe(true);
  });

  it("ödenmiş, iade ve bilinmeyen durum kapsam dışı", () => {
    for (const d of ["basarili", "iade_edildi", "iade-edildi", ""]) expect(kurtarilabilirDurumMu(d)).toBe(false);
  });
});

describe("minimumYasSaat", () => {
  it("başarısız ödeme çok daha erken dürtülür", () => {
    expect(minimumYasSaat("basarisiz")).toBe(KURTARMA_SURELERI.basarisizMinSaat);
    expect(minimumYasSaat("beklemede")).toBe(KURTARMA_SURELERI.beklemedeMinSaat);
    expect(minimumYasSaat("basarisiz")).toBeLessThan(minimumYasSaat("beklemede"));
  });
});

describe("kurtarmaAsamasi — bekleyen ödeme (eski davranış korunur)", () => {
  it("2 saatten taze sipariş dürtülmez", () => {
    expect(kurtarmaAsamasi(g({ yasSaat: 1.9 }))).toBeNull();
  });

  it("2-24 saat arası ilk hatırlatma", () => {
    expect(kurtarmaAsamasi(g({ yasSaat: 2 }))).toBe(1);
    expect(kurtarmaAsamasi(g({ yasSaat: 23.9 }))).toBe(1);
  });

  it("ilk hatırlatma gittiyse 24 saate kadar tekrar gönderilmez", () => {
    expect(kurtarmaAsamasi(g({ yasSaat: 10, gonderilenAsama: 1 }))).toBeNull();
  });

  it("24 saati geçince son hatırlatma", () => {
    expect(kurtarmaAsamasi(g({ yasSaat: 25, gonderilenAsama: 1 }))).toBe(2);
  });

  it("hiç mail almamış eski sipariş aşama ATLAR, doğrudan 2 alır", () => {
    expect(kurtarmaAsamasi(g({ yasSaat: 30, gonderilenAsama: 0 }))).toBe(2);
  });

  it("72 saatten eskiye dokunulmaz", () => {
    expect(kurtarmaAsamasi(g({ yasSaat: 72.1, gonderilenAsama: 0 }))).toBeNull();
  });

  it("son aşama gönderildiyse biter", () => {
    expect(kurtarmaAsamasi(g({ yasSaat: 50, gonderilenAsama: 2 }))).toBeNull();
  });
});

describe("kurtarmaAsamasi — BAŞARISIZ ödeme (yeni)", () => {
  const b = (o = {}) => g({ odemeDurumu: "basarisiz", ...o });

  it("15 dakika dolmadan gönderilmez — müşteri aynı oturumda tekrar deniyor olabilir", () => {
    expect(kurtarmaAsamasi(b({ yasSaat: 0.2 }))).toBeNull();
  });

  it("15 dakika sonra ilk hatırlatma gider", () => {
    expect(kurtarmaAsamasi(b({ yasSaat: 0.25 }))).toBe(1);
    expect(kurtarmaAsamasi(b({ yasSaat: 1 }))).toBe(1);
  });

  it("bekleyen ödemeden ÇOK daha erken yakalanır", () => {
    expect(kurtarmaAsamasi(b({ yasSaat: 1 }))).toBe(1);
    expect(kurtarmaAsamasi(g({ yasSaat: 1 }))).toBeNull();
  });
});

describe("mükerrer sipariş koruması", () => {
  it("müşteri sonradan ödeme yaptıysa ESKİ siparişe mail gitmez", () => {
    expect(kurtarmaAsamasi(g({ odemeDurumu: "basarisiz", yasSaat: 1, sonrakiOdenmisSiparisVar: true }))).toBeNull();
    expect(kurtarmaAsamasi(g({ yasSaat: 5, sonrakiOdenmisSiparisVar: true }))).toBeNull();
  });

  it("koruma her aşamada geçerli", () => {
    expect(kurtarmaAsamasi(g({ yasSaat: 40, gonderilenAsama: 1, sonrakiOdenmisSiparisVar: true }))).toBeNull();
  });
});
