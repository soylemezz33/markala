import { describe, it, expect } from "vitest";
import {
  ONAY_GORSEL_MAX_BAYT,
  ONAY_SABLON_ADI,
  ONAY_SABLON_DILI,
  WA_ONAY_KAYDI,
  gorselUygunMu,
  tasarimOnayParametreleri,
} from "./tasarim-onay-mesaji";
import { tekSatir } from "./yeni-siparis-mesaji";

/**
 * TASARIM ONAYI ŞABLONU (2026-09-21).
 *
 * Bu testler mesajın SÖZLEŞMESİNİ kilitler. Şablon Meta'da yaşıyor, kod ona parametre
 * besliyor; sıra ya da biçim kayarsa müşteriye adı yerine sipariş numarasıyla hitap eden
 * bir mesaj gider ve bunu üretimde fark ederiz. Bu yüzden sıra testle sabitlendi.
 */
describe("tasarim_onay şablon sözleşmesi", () => {
  it("şablon adı ve dili sabit", () => {
    expect(ONAY_SABLON_ADI).toBe("tasarim_onay");
    expect(ONAY_SABLON_DILI).toBe("tr");
    expect(WA_ONAY_KAYDI).toBe("whatsapp-design-approval");
  });

  it("parametre SIRASI: [müşteri adı, sipariş no]", () => {
    const p = tasarimOnayParametreleri(
      { orderNumber: "MK-2026-1234", musteriAdi: "Ayşe Yılmaz", email: "a@b.com" },
      tekSatir,
    );
    expect(p).toEqual(["Ayşe Yılmaz", "MK-2026-1234"]);
  });

  it("ad yoksa e-postaya, o da yoksa nazik bir hitaba düşer", () => {
    expect(
      tasarimOnayParametreleri({ orderNumber: "MK-1", musteriAdi: null, email: "x@y.com" }, tekSatir)[0],
    ).toBe("x@y.com");
    expect(
      tasarimOnayParametreleri({ orderNumber: "MK-1", musteriAdi: null, email: null }, tekSatir)[0],
    ).toBe("değerli müşterimiz");
  });

  it("parametrede satır sonu KALMAZ — WhatsApp #132000 ile reddeder", () => {
    const p = tasarimOnayParametreleri(
      { orderNumber: "MK-2", musteriAdi: "Ali\nVeli\tKırk", email: null },
      tekSatir,
    );
    expect(p[0]).toBe("Ali Veli Kırk");
    expect(p.join("")).not.toMatch(/[\r\n\t]/);
  });

  /**
   * Görsel biçimi: WhatsApp başlığı yalnız JPG/PNG kabul eder. Tasarımcının yüklediği
   * PDF/AI gönderilirse müşteri hiçbir şey göremez — sessizce "gitti" demektense reddedilir.
   */
  it("yalnız JPG/PNG görsel kabul edilir", () => {
    expect(gorselUygunMu("image/jpeg")).toBe(true);
    expect(gorselUygunMu("image/png")).toBe(true);
    expect(gorselUygunMu("IMAGE/PNG")).toBe(true);
    expect(gorselUygunMu("application/pdf")).toBe(false);
    expect(gorselUygunMu("image/webp")).toBe(false);
    expect(gorselUygunMu(null)).toBe(false);
  });

  it("görsel üst sınırı 5 MB (Meta #131052)", () => {
    expect(ONAY_GORSEL_MAX_BAYT).toBe(5 * 1024 * 1024);
    // Önizleme akışı zaten 2 MB ile sınırlı → sınıra takılmaz, bu ikinci emniyet.
    expect(2 * 1024 * 1024).toBeLessThan(ONAY_GORSEL_MAX_BAYT);
  });
});
