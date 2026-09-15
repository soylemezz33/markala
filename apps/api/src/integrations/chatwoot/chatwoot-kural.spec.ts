import { describe, it, expect } from "vitest";
import { whatsappKimligi, konusmaEtiketi, ozelNotMetni, siparisNotuTemizle, icNotMetni } from "./chatwoot-kural";

describe("whatsappKimligi — telefon → WhatsApp source_id", () => {
  it("+90, 0 ve çıplak biçimleri 905… (12 hane) yapar", () => {
    expect(whatsappKimligi("+90 541 352 73 52")).toBe("905413527352");
    expect(whatsappKimligi("0541 352 73 52")).toBe("905413527352");
    expect(whatsappKimligi("5413527352")).toBe("905413527352");
    expect(whatsappKimligi("00905413527352")).toBe("905413527352");
  });
  it("sabit hat / yabancı / boş → null (WhatsApp kimliği üretilmez)", () => {
    expect(whatsappKimligi("0324 433 33 51")).toBeNull();
    expect(whatsappKimligi("+49 170 1234567")).toBeNull();
    expect(whatsappKimligi("")).toBeNull();
    expect(whatsappKimligi(null)).toBeNull();
  });
});

describe("konusmaEtiketi", () => {
  it("dosyasız kalem varsa dosya-bekleniyor", () => {
    expect(konusmaEtiketi([{ productName: "Kartvizit", quantity: 1, uploadedFileName: "a.pdf" }, { productName: "Afiş", quantity: 2 }])).toBe("dosya-bekleniyor");
  });
  it("her kalemde dosya varsa tasarim-asamasina-hazir (çoklu dosya sayısı da sayılır)", () => {
    expect(konusmaEtiketi([{ productName: "Kartvizit", quantity: 1, uploadedFileName: "a.pdf" }, { productName: "Afiş", quantity: 2, dosyaSayisi: 3 }])).toBe("tasarim-asamasina-hazir");
  });
});

describe("ozelNotMetni", () => {
  it("sipariş, müşteri, kalemler, temizlenmiş not ve panel bağlantısı", () => {
    const m = ozelNotMetni({
      orderId: "id1", orderNumber: "MK-TEST-1", musteriAdi: "Ayşe Yılmaz", telefon: "905413527352", email: "a@b.c",
      siparisNotu: "__idem:abc123__\nKanal: WhatsApp · Vergi: Erciyes / 3101328038",
      kalemler: [
        { productName: "Yelken Bayrak", quantity: 2, configurationSummary: "75x300", needsDesignSupport: true },
        { productName: "Kartvizit", quantity: 1, uploadedFileName: "logo.ai" },
      ],
      panelUrl: "https://admin.markala.com.tr/siparisler/id1",
    });
    expect(m).toContain("Sipariş MK-TEST-1");
    expect(m).toContain("Ayşe Yılmaz · +905413527352 · a@b.c");
    expect(m).toContain("• 2× Yelken Bayrak (75x300) — dosya YOK · tasarım desteği İSTİYOR");
    expect(m).toContain("• 1× Kartvizit — dosya: logo.ai");
    expect(m).toContain("📝 Sipariş notu: Kanal: WhatsApp · Vergi: Erciyes / 3101328038");
    expect(m).not.toContain("__idem");
    expect(m).toContain("https://admin.markala.com.tr/siparisler/id1");
  });
  it("siparisNotuTemizle boşu boş bırakır", () => {
    expect(siparisNotuTemizle("__idem:ff00__")).toBe("");
    expect(siparisNotuTemizle(null)).toBe("");
  });
  it("icNotMetni öneki aranabilir", () => {
    expect(icNotMetni(18, "https://chat.x/app/accounts/1/conversations/18")).toMatch(/^Chatwoot konuşması #18 \(yeni açıldı/);
    expect(icNotMetni(15, "u", false)).toContain("mevcut konuşmasına eklendi");
  });
});
