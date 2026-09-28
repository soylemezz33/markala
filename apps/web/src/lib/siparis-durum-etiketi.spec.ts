import { describe, it, expect } from "vitest";
import { orderStatusLabel, tasarimBaglamiCikar } from "./format";

/**
 * Sipariş durum etiketi — "Tasarım Bekleniyor" yanlış anlaşılması (2026-09-28).
 *
 * Müşteri geri bildirimi (MK-MUL080NT-C9LN): "şu tasarım bekleniyor yazısı ilk gördüğümde
 * bana sanki ben tasarımımı yükleyememişim hissiyatı oluşturdu". Haklıydı — o siparişte
 * dosyasını çoktan yüklemişti, hatta tasarımcımız da kendi dosyasını yüklemişti.
 * Ödenmiş 89 siparişin 62'sinde müşteri dosyayı göndermiş durumda.
 *
 * Kural: tasarım aşamasında BEKLENEN TARAF siparişe göre değişir. Etiket bunu doğru
 * söylemeli, hiçbir durumda müşteriye "sen eksik bıraktın" dememeli — gerçekten onun
 * dosyasını beklemiyorsak.
 */

describe("orderStatusLabel — tasarım aşaması", () => {
  it("müşteri dosyasını yüklediyse: bekleyen BİZİZ", () => {
    const e = orderStatusLabel("tasarim-bekleniyor", { musteriDosyasiVar: true, tasarimDestegi: false });
    expect(e).toBe("Tasarım Hazırlanıyor");
    expect(e).not.toMatch(/Bekleniyor$/); // "…Bekleniyor" müşteriye görev yükler gibi okunuyor
  });

  it("tasarımı bizden istediyse: yine bekleyen BİZİZ", () => {
    expect(orderStatusLabel("tasarim-bekleniyor", { musteriDosyasiVar: false, tasarimDestegi: true }))
      .toBe("Tasarım Hazırlanıyor");
  });

  it("dosya yok ve destek istenmemişse: gerçekten müşteriyi bekliyoruz, açıkça söyle", () => {
    expect(orderStatusLabel("tasarim-bekleniyor", { musteriDosyasiVar: false, tasarimDestegi: false }))
      .toBe("Dosyanız Bekleniyor");
  });

  it("bağlam yoksa (ör. kargo takip) müşteriyi suçlamayan metin kullanılır", () => {
    expect(orderStatusLabel("tasarim-bekleniyor")).toBe("Tasarım Hazırlanıyor");
  });

  it("underscore'lu enum değeri de çalışır", () => {
    expect(orderStatusLabel("tasarim_bekleniyor", { musteriDosyasiVar: true, tasarimDestegi: false }))
      .toBe("Tasarım Hazırlanıyor");
  });

  it("diğer durumlar değişmedi", () => {
    expect(orderStatusLabel("uretimde")).toBe("Üretimde");
    expect(orderStatusLabel("tasarim-onayindi")).toBe("Tasarım Onayı Bekliyor");
    expect(orderStatusLabel("kargoya-verildi")).toBe("Kargoya Verildi");
    expect(orderStatusLabel("iptal-edildi")).toBe("İptal Edildi");
  });
});

describe("tasarimBaglamiCikar", () => {
  it("kalemlerden bayrakları çıkarır", () => {
    expect(tasarimBaglamiCikar([{ uploadedFileName: "banner.pdf" }]))
      .toEqual({ musteriDosyasiVar: true, tasarimDestegi: false });
    expect(tasarimBaglamiCikar([{ needsDesignSupport: true }]))
      .toEqual({ musteriDosyasiVar: false, tasarimDestegi: true });
    expect(tasarimBaglamiCikar([])).toEqual({ musteriDosyasiVar: false, tasarimDestegi: false });
  });

  it("çok kalemli siparişte kalemlerden BİRİ yeterlidir", () => {
    const b = tasarimBaglamiCikar([{ uploadedFileName: null }, { uploadedFileName: "logo.ai" }]);
    expect(b.musteriDosyasiVar).toBe(true);
  });
});
