import { describe, it, expect } from "vitest";
import {
  HATIRLATMA_BEKLEME_SAAT,
  hatirlatmaMetni,
  hatirlatmaOnizleme,
  hatirlatmaParametreleri,
  hatirlatmaUygunMu,
  hitap,
} from "./odeme-hatirlatma-mesaji";

const simdi = new Date("2026-10-09T12:00:00Z");
const saatOnce = (s: number) => new Date(simdi.getTime() - s * 3600_000);
const temel = {
  paymentStatus: "beklemede",
  status: "siparis-alindi",
  createdAt: saatOnce(5),
  sonHatirlatma: null as Date | null,
  simdi,
};

describe("hatirlatmaUygunMu", () => {
  it("ödemesi bekleyen, 30 dk'dan eski siparişe gönderilir", () => {
    expect(hatirlatmaUygunMu(temel).uygun).toBe(true);
  });

  it("başarısız ödemeye de gönderilir (banka reddi sonrası müşteri tekrar deneyebilir)", () => {
    expect(hatirlatmaUygunMu({ ...temel, paymentStatus: "basarisiz" }).uygun).toBe(true);
  });

  it("ödenmiş siparişe gönderilmez", () => {
    const k = hatirlatmaUygunMu({ ...temel, paymentStatus: "basarili" });
    expect(k.uygun).toBe(false);
    expect(k.sebep).toContain("ödemesi beklemiyor");
  });

  it("iptal edilmiş siparişe gönderilmez (her iki yazım)", () => {
    expect(hatirlatmaUygunMu({ ...temel, status: "iptal_edildi" }).uygun).toBe(false);
    expect(hatirlatmaUygunMu({ ...temel, status: "iptal-edildi" }).uygun).toBe(false);
  });

  it("çok yeni siparişe gönderilmez — müşteri hâlâ ödeme ekranında olabilir", () => {
    const k = hatirlatmaUygunMu({ ...temel, createdAt: new Date(simdi.getTime() - 5 * 60_000) });
    expect(k.uygun).toBe(false);
    expect(k.sebep).toContain("çok yeni");
  });

  it("12 saat dolmadan ikinci hatırlatma gönderilmez", () => {
    const k = hatirlatmaUygunMu({ ...temel, sonHatirlatma: saatOnce(3) });
    expect(k.uygun).toBe(false);
    expect(k.sebep).toContain("3 saat önce");
  });

  it("12 saat geçtiyse yeniden gönderilebilir", () => {
    expect(hatirlatmaUygunMu({ ...temel, sonHatirlatma: saatOnce(HATIRLATMA_BEKLEME_SAAT + 1) }).uygun).toBe(true);
  });
});

describe("metin", () => {
  it("havalede 'hesabımıza ulaşmadı' der", () => {
    expect(hatirlatmaMetni("MK-1", "havale")).toContain("havale ödemesi henüz hesabımıza ulaşmadı");
  });

  it("kartta 'tamamlamadığınızı görüyoruz' der", () => {
    expect(hatirlatmaMetni("MK-1", "iyzico")).toContain("tamamlamadığınızı görüyoruz");
  });

  it("hitap: ilk ad, Türkçe büyük/küçük harf", () => {
    expect(hitap("FATİH ÜSTÜNDAĞ")).toBe("Fatih");
    expect(hitap("derya karzan")).toBe("Derya");
    expect(hitap("  ")).toBe("değerli müşterimiz");
    expect(hitap(null)).toBe("değerli müşterimiz");
  });

  it("önizleme şablonun birebir gövdesidir (cümle akışı bozulmaz)", () => {
    const { parametreler, onizleme } = hatirlatmaParametreleri("Davut Alkan", "MK-X", "havale");
    expect(parametreler).toEqual(["Davut", "MK-X numaralı siparişinizin havale ödemesi henüz hesabımıza ulaşmadı"]);
    expect(onizleme).toBe(
      "Merhaba Davut, Markala.com.tr olarak hatırlatmak istedik: MK-X numaralı siparişinizin havale ödemesi henüz hesabımıza ulaşmadı. Yardımcı olmamızı ister misiniz?",
    );
    expect(hatirlatmaOnizleme("Ali", "x")).toContain("Yardımcı olmamızı ister misiniz?");
  });
});
