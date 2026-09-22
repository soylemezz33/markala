import { OrderStatus } from "@prisma/client";
import { describe, it, expect } from "vitest";
import {
  whatsappKimligi, konusmaEtiketi, ozelNotMetni, siparisNotuTemizle, icNotMetni,
  durumEtiketleriniUygula, durumEtiketiBul, konusmaIdNottan, durumNotu, CHATWOOTTAN_PANELE, URETIM_SONRASI,
  DURUM_ETIKETLERI,
  chatwootNotuAktarilirMi, chatwootNotuPanele, panelNotuAktarilirMi, panelNotuChatwoota,
} from "./chatwoot-kural";

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

describe("sipariş durumu ↔ konuşma", () => {
  // 22 Eyl 2026: listede "tasarim-onayindi" yoktu; eski etiket silinmeyip konuşmada üç
  // durum etiketi birikti ve Chatwoot→panel yönü o durumu hiç tanımadı. Liste OrderStatus
  // enumundan sapmasın diye şema doğrudan okunuyor.
  it("DURUM_ETIKETLERI, OrderStatus enumunun tamamını kapsar", () => {
    // Prisma üye adları alt çizgili (tasarim_onayindi), DB/slug karşılıkları tireli
    // (@map("tasarim-onayindi")) — dönüşüm birebir bu kuralla yapılıyor.
    const durumlar = Object.values(OrderStatus).map((d) => String(d).replace(/_/g, "-"));
    expect(durumlar.length).toBeGreaterThan(5);
    expect([...DURUM_ETIKETLERI].sort()).toEqual([...durumlar].sort());
  });
  it("durumEtiketleriniUygula: durum dışı etiketler kalır, tek durum etiketi olur", () => {
    expect(durumEtiketleriniUygula(["dosya-bekleniyor", "tasarim-bekleniyor"], "uretimde")).toEqual(["dosya-bekleniyor", "uretimde"]);
    expect(durumEtiketleriniUygula([], "teslim-edildi")).toEqual(["teslim-edildi"]);
    // onaydan onaylandıya geçiş: eski durum etiketi silinmeli
    expect(durumEtiketleriniUygula(["tasarim-asamasina-hazir", "tasarim-onayindi"], "tasarim-onaylandi"))
      .toEqual(["tasarim-asamasina-hazir", "tasarim-onaylandi"]);
  });
  it("durumEtiketiBul: tek etiket / işaretli olmayanı seç / yok", () => {
    expect(durumEtiketiBul(["teklif", "uretimde"])).toBe("uretimde");
    expect(durumEtiketiBul(["tasarim-bekleniyor", "uretimde"], "tasarim-bekleniyor")).toBe("uretimde");
    expect(durumEtiketiBul(["teklif"])).toBeNull();
  });
  it("konusmaIdNottan yalnız Chatwoot notundan okur", () => {
    expect(konusmaIdNottan("Chatwoot konuşması #15 (müşterinin mevcut konuşmasına eklendi, grafik tasarım ekibine atandı): https://x")).toBe(15);
    expect(konusmaIdNottan("Chatwoot konuşması açılamadı: telefon WhatsApp'a uygun değil (-)")).toBeNull();
    expect(konusmaIdNottan("müşteri aradı #3")).toBeNull();
  });
  it("kapsam sabitleri", () => {
    expect(CHATWOOTTAN_PANELE).not.toContain("kargoya-verildi");
    expect(URETIM_SONRASI).toContain("uretimde");
    expect(durumNotu("uretimde")).toContain("Üretimde");
  });
});

describe("iç not ↔ Chatwoot özel notu", () => {
  it("yalnız özel (private) ve sistem dışı Chatwoot notları panele aktarılır", () => {
    expect(chatwootNotuAktarilirMi("Gül Hanım'ın siparişinde germe payı bırakılmış", true)).toBe(true);
    expect(chatwootNotuAktarilirMi("müşteriye giden mesaj", false)).toBe(false);
    expect(chatwootNotuAktarilirMi("🧾 Sipariş MK-1 — ödeme alındı", true)).toBe(false);
    expect(chatwootNotuAktarilirMi("📦 Sipariş durumu: Üretimde (panel)", true)).toBe(false);
    expect(chatwootNotuAktarilirMi("📝 Panel notu (Hasan): x", true)).toBe(false);
    expect(chatwootNotuAktarilirMi("   ", true)).toBe(false);
  });
  it("gövde biçimleri ve döngü koruması", () => {
    const p = chatwootNotuPanele("Hasan Söylemez", "germe payı var");
    expect(p).toBe("💬 Chatwoot notu (Hasan Söylemez): germe payı var");
    expect(panelNotuAktarilirMi(p)).toBe(false);
    expect(panelNotuAktarilirMi("Chatwoot konuşması #15 (yeni açıldı, …): url")).toBe(false);
    expect(panelNotuAktarilirMi("dekont bekleniyor")).toBe(true);
    expect(panelNotuChatwoota("Oğuzhan Ateş", "kutu ezik")).toBe("📝 Panel notu (Oğuzhan Ateş): kutu ezik");
  });
});
