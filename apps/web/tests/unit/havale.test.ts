import { describe, it, expect } from "vitest";
import {
  BANKA_HESABI,
  HAVALE_INDIRIM_YUZDE,
  ODEME_YONTEMI,
  ibanGecerliMi,
} from "@markala/types";

/**
 * Havale/EFT sabitleri ve indirim formülü.
 *
 * En kritik test IBAN doğrulaması: sabitte tek karakterlik bir yazım hatası
 * müşterinin parasını YANLIŞ HESABA gönderir ve geri dönüşü zordur. mod-97
 * sağlaması bu tür hataların neredeyse tamamını yakalar.
 */
describe("havale banka bilgileri", () => {
  it("IBAN mod-97 sağlamasından geçer", () => {
    expect(ibanGecerliMi(BANKA_HESABI.iban)).toBe(true);
  });

  it("boşluklu ve boşluksuz IBAN aynı hesabı gösterir", () => {
    expect(BANKA_HESABI.iban.replace(/\s+/g, "")).toBe(BANKA_HESABI.ibanDuz);
    expect(BANKA_HESABI.ibanDuz).toHaveLength(26);
  });

  it("bozuk IBAN'ı reddeder", () => {
    // Son hane değiştirildi → sağlama tutmamalı.
    expect(ibanGecerliMi("TR210015700000000131985022")).toBe(false);
    expect(ibanGecerliMi("TR21 0015 7000")).toBe(false);
    expect(ibanGecerliMi("DE21001570000000013198")).toBe(false);
  });

  it("alıcı ünvanı ve banka adı boş değil", () => {
    expect(BANKA_HESABI.unvan.length).toBeGreaterThan(10);
    expect(BANKA_HESABI.banka.length).toBeGreaterThan(3);
  });

  it("ödeme yöntemi anahtarları DB'ye yazılan değerlerle aynı", () => {
    expect(ODEME_YONTEMI.havale).toBe("havale");
    expect(ODEME_YONTEMI.cari).toBe("cari");
    expect(ODEME_YONTEMI.kart).toBe("iyzico");
  });
});

describe("havale indirimi", () => {
  const round2 = (n: number) => Math.round(n * 100) / 100;
  /** orders.service.ts ile BİREBİR aynı formül: kupon+kurumsal sonrası kalana %5. */
  const havaleIndirimi = (subtotal: number, oncekiIndirim: number) =>
    round2(((subtotal - oncekiIndirim) * HAVALE_INDIRIM_YUZDE) / 100);

  it("indirim oranı %5", () => {
    expect(HAVALE_INDIRIM_YUZDE).toBe(5);
  });

  it("başka indirim yokken ara toplamın %5'i", () => {
    expect(havaleIndirimi(1000, 0)).toBe(50);
  });

  it("kupon/kurumsal indirim SONRASI kalan tutara uygulanır", () => {
    // 1000 ₺ sepet, 200 ₺ kupon → kalan 800 ₺ üzerinden %5 = 40 ₺ (50 ₺ DEĞİL).
    expect(havaleIndirimi(1000, 200)).toBe(40);
  });

  it("toplam indirim ara toplamı aşmaz", () => {
    const subtotal = 500;
    const onceki = 500; // tamamı kuponla karşılanmış
    const havale = havaleIndirimi(subtotal, onceki);
    expect(havale).toBe(0);
    expect(onceki + havale).toBeLessThanOrEqual(subtotal);
  });

  it("kuruş yuvarlaması iki haneye sabitlenir", () => {
    // 333.33 → %5 = 16.6665 → 16.67
    expect(havaleIndirimi(333.33, 0)).toBe(16.67);
  });
});
