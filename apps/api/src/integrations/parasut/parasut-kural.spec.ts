import { describe, it, expect } from "vitest";
import { eBelgeKararla, kargoVknBul } from "./parasut-kural";

const T = new Date("2026-09-11T10:00:00Z");

describe("eBelgeKararla — e-Fatura mı e-Arşiv mi", () => {
  it("VKN'li kurumsal + gelen kutusu var → e_invoice, kutu adresiyle", () => {
    const k = eBelgeKararla({ kurumsal: true, vergiNo: "1234567890", eFaturaKutusu: "urn:mail:pk@firma.com", paymentMethod: "iyzico", odemeTarihi: T, kargoFirmasi: "DHL eCommerce", kargoTarihi: T });
    expect(k.tur).toBe("e_invoice");
    expect(k.kutu).toBe("urn:mail:pk@firma.com");
    expect(k.internetSatisi).toBeUndefined();
    expect(k.gonderi).toEqual({ title: "DHL eCommerce", date: "2026-09-11" });
  });

  it("kurumsal ama gelen kutusu yok → e_archive (mükellef değil)", () => {
    expect(eBelgeKararla({ kurumsal: true, vergiNo: "1234567890", eFaturaKutusu: null, paymentMethod: "iyzico", odemeTarihi: T, kargoTarihi: T }).tur).toBe("e_archive");
  });

  it("bireysel kart ödemesi → e_archive, KREDIKARTI + iyzico + ödeme tarihi", () => {
    const k = eBelgeKararla({ kurumsal: false, paymentMethod: "iyzico", odemeTarihi: new Date("2026-09-10T12:00:00Z"), kargoTarihi: T });
    expect(k.internetSatisi).toEqual({ url: "https://markala.com.tr", payment_type: "KREDIKARTI/BANKAKARTI", payment_platform: "iyzico", payment_date: "2026-09-10" });
    expect(k.gonderi).toBeUndefined();
  });

  it("havale → EFT/HAVALE, platform yok", () => {
    const k = eBelgeKararla({ kurumsal: false, paymentMethod: "havale", odemeTarihi: T, kargoTarihi: T });
    expect(k.internetSatisi?.payment_type).toBe("EFT/HAVALE");
    expect(k.internetSatisi?.payment_platform).toBeUndefined();
  });

  it("kargo VKN eşlemesi alt dizeyle, yalnız 10 haneli", () => {
    expect(kargoVknBul("DHL eCommerce Türkiye", { dhl: "1234567890" })).toBe("1234567890");
    expect(kargoVknBul("DHL eCommerce", { dhl: "12345" })).toBeUndefined();
    expect(kargoVknBul("Aras", { dhl: "1234567890" })).toBeUndefined();
    const k = eBelgeKararla({ kurumsal: false, paymentMethod: "iyzico", odemeTarihi: T, kargoFirmasi: "DHL eCommerce", kargoTarihi: T, kargoVkn: { dhl: "1234567890" } });
    expect(k.gonderi).toEqual({ title: "DHL eCommerce", vkn: "1234567890", date: "2026-09-11" });
  });
});
