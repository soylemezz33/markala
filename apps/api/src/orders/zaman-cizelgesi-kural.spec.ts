import { describe, it, expect } from "vitest";
import { zamanCizelgesiKur, olaylariSadelestir, kilometreTaslari, type ZamanOlayi } from "./zaman-cizelgesi-kural";

const t = (s: string) => new Date(s);

describe("zamanCizelgesiKur — sipariş hareketleri tek listede, tarih sıralı", () => {
  it("havale siparişi: oluşturma → ödeme onayı → durumlar → kargo → fatura → bildirimler → notlar", () => {
    const o = zamanCizelgesiKur({
      order: {
        createdAt: t("2026-09-15T08:34:00Z"), paymentMethod: "havale", paymentStatus: "basarili",
        notes: "__idem:ab__\nKanal: WhatsApp", shippedAt: t("2026-09-16T11:00:00Z"), trackingNumber: "TR123", trackingCarrier: "DHL",
        invoiceIssuedAt: t("2026-09-16T11:02:00Z"), invoiceMailedAt: t("2026-09-16T11:02:30Z"), invoiceNumber: "MS12026000000009", invoiceType: "e_archive",
      },
      auditler: [
        { createdAt: t("2026-09-15T09:11:00Z"), action: "havale_odeme_onay", diff: { paymentStatus: { from: "beklemede", to: "basarili" }, role: "super_admin" }, actorAd: "Hasan Söylemez" },
        { createdAt: t("2026-09-15T13:04:00Z"), action: "status_change", diff: { from: "siparis-alindi", to: "tasarim-bekleniyor" }, actorAd: "Hasan Söylemez" },
        { createdAt: t("2026-09-16T05:45:00Z"), action: "status_change", diff: { from: "tasarim-onaylandi", to: "uretimde" }, actorAd: null },
        { createdAt: t("2026-09-16T11:00:00Z"), action: "status_change", diff: { from: "uretimde", to: "kargoya-verildi", tracking: { number: "TR123", carrier: "DHL" } }, actorAd: "Furkan Söylemez" },
        { createdAt: t("2026-09-15T14:00:00Z"), action: "design_upload", diff: { kind: "baski", fileName: "afis.pdf" }, actorAd: "Oğuzhan Ateş", entityType: "OrderItem" },
      ],
      notlar: [
        { createdAt: t("2026-09-15T09:12:00Z"), body: "Chatwoot konuşması #15 (müşterinin mevcut konuşmasına eklendi, grafik tasarım ekibine atandı): https://x", authorName: "Sistem", authorRole: "chatwoot" },
        { createdAt: t("2026-09-16T10:05:00Z"), body: "💬 Chatwoot notu (Hasan Söylemez): germe payı bırakıldı", authorName: "Hasan Söylemez", authorRole: "chatwoot" },
      ],
      bildirimler: [
        { createdAt: t("2026-09-16T11:00:30Z"), channel: "email", template: "order-shipped", recipient: "a@b.com", status: "sent" },
        { createdAt: t("2026-09-15T08:34:10Z"), channel: "whatsapp", template: "whatsapp-new-order", recipient: "9053...", status: "failed" },
      ],
    });
    const basliklar = o.map((x) => x.baslik);
    expect(basliklar[0]).toBe("Sipariş oluşturuldu");
    expect(o[0]!.detay).toBe("Kanal: WhatsApp");
    expect(basliklar).toContain("Ödeme alındı (havale/EFT onayı)");
    expect(basliklar).toContain("Durum: Sipariş alındı → Tasarım bekleniyor");
    expect(basliklar).toContain("Durum: Üretimde → Kargoya verildi");
    expect(o.find((x) => x.baslik.includes("Kargoya verildi"))?.detay).toContain("TR123");
    expect(o.find((x) => x.baslik.startsWith("Durum: Tasarım onaylandı"))?.aktor).toBe("Sistem");
    expect(basliklar).toContain("Tasarım dosyası yüklendi (baski)");
    expect(basliklar).toContain("Chatwoot konuşması bağlandı");
    expect(o.find((x) => x.baslik === "Chatwoot notu")?.detay).toBe("germe payı bırakıldı");
    expect(basliklar).toContain("e-Arşiv kesildi");
    expect(basliklar).toContain("Kargoya verildi e-postası (müşteri)");
    expect(basliklar).toContain("Yeni sipariş WhatsApp bildirimi (ekip) — FAILED");
    // tarih sıralı
    const ats = o.map((x) => x.at);
    expect([...ats].sort()).toEqual(ats);
    // kargoya verildi audit varken shippedAt'tan ikinci kayıt üretilmez
    expect(basliklar.filter((b) => b === "Kargoya verildi")).toHaveLength(0);
  });

  it("kart ödemesi: audit yok → sipariş onayı e-postası anı 'ödeme alındı' sayılır; manuel sipariş kanal ve oluşturan", () => {
    const o = zamanCizelgesiKur({
      order: { createdAt: t("2026-09-10T10:00:00Z"), paymentMethod: "iyzico", paymentStatus: "basarili", notes: null },
      auditler: [], notlar: [],
      bildirimler: [{ createdAt: t("2026-09-10T10:00:40Z"), channel: "email", template: "order-confirmation", recipient: "a@b.com", status: "sent" }],
    });
    expect(o.map((x) => x.baslik)).toContain("Ödeme alındı (kart, iyzico)");
    const m = zamanCizelgesiKur({
      order: { createdAt: t("2026-09-16T12:00:00Z"), paymentMethod: "nakit", paymentStatus: "basarili", notes: "Kanal: Yüz yüze · Manuel sipariş (Hasan Söylemez) · Ödeme: Nakit (alındı)" },
      auditler: [{ createdAt: t("2026-09-16T12:00:01Z"), action: "manuel_siparis", diff: { odemeAlindi: true, odemeYontemi: "nakit" }, actorAd: "Hasan Söylemez" }],
      notlar: [], bildirimler: [],
    });
    expect(m[0]).toMatchObject({ baslik: "Manuel sipariş oluşturuldu", detay: "Kanal: Yüz yüze", aktor: "Hasan Söylemez" });
    expect(m.map((x) => x.baslik)).toContain("Ödeme alındı (nakit)");
  });
});

describe("olaylariSadelestir — art arda aynı dosya hareketleri tek satır", () => {
  const z = (at: string, baslik: string, detay: string, aktor = "Grafik Tasarım"): ZamanOlayi => ({ at, tur: "tasarim", baslik, detay, aktor });
  it("3 önizleme yüklemesi (aynı dosya) → '3 tasarım dosyası yüklendi (onizleme)' + '(3 hareket)'; silme ve sonraki yükleme ayrı kalır", () => {
    const o = olaylariSadelestir([
      z("2026-09-16T11:43:00Z", "Tasarım dosyası yüklendi (onizleme)", "a.png"),
      z("2026-09-16T11:43:10Z", "Tasarım dosyası yüklendi (onizleme)", "a.png"),
      z("2026-09-16T11:43:20Z", "Tasarım dosyası yüklendi (onizleme)", "a.png"),
      z("2026-09-16T11:46:00Z", "Tasarım dosyası silindi", "a.png"),
      z("2026-09-16T11:46:30Z", "Tasarım dosyası yüklendi (onizleme)", "b.png"),
      z("2026-09-16T11:46:40Z", "Tasarım dosyası yüklendi (calisma)", "c.ai"),
    ]);
    expect(o.map((x) => x.baslik)).toEqual(["3 tasarım dosyası yüklendi (onizleme)", "Tasarım dosyası silindi", "Tasarım dosyası yüklendi (onizleme)", "Tasarım dosyası yüklendi (calisma)"]);
    expect(o[0]!.detay).toBe("a.png (3 hareket)");
    expect(o[0]!.at).toBe("2026-09-16T11:43:00Z");
  });
  it("farklı kişi ya da 15 dk'dan uzun ara → birleşmez; dosya dışı olaylar dokunulmaz", () => {
    const o = olaylariSadelestir([
      z("2026-09-16T11:00:00Z", "Tasarım dosyası yüklendi (baski)", "a.pdf", "Emin"),
      z("2026-09-16T11:01:00Z", "Tasarım dosyası yüklendi (baski)", "b.pdf", "Oğuzhan"),
      z("2026-09-16T11:30:00Z", "Tasarım dosyası yüklendi (baski)", "c.pdf", "Oğuzhan"),
      { at: "2026-09-16T11:31:00Z", tur: "not", baslik: "İç not", detay: "x" },
      { at: "2026-09-16T11:31:10Z", tur: "not", baslik: "İç not", detay: "y" },
    ]);
    expect(o).toHaveLength(5);
  });
});

describe("kilometreTaslari — sipariş/ödeme/tasarım onayı/üretim/kargo/teslim/fatura anları", () => {
  it("geri alınıp tekrar verilen durumda SON an; ulaşılmayan aşama tarihsiz; iptal yalnız varsa", () => {
    const o: ZamanOlayi[] = [
      { at: "2026-09-16T09:18:00Z", tur: "olusturma", baslik: "Sipariş oluşturuldu", detay: "Kanal: Web (Kart)", aktor: "Müşteri" },
      { at: "2026-09-16T09:19:00Z", tur: "odeme", baslik: "Ödeme alındı (kart, iyzico)", aktor: "Sistem" },
      { at: "2026-09-16T09:23:00Z", tur: "durum", durum: "tasarim-bekleniyor", baslik: "Durum: Sipariş alındı → Tasarım bekleniyor" },
      { at: "2026-09-16T09:23:30Z", tur: "durum", durum: "siparis-alindi", baslik: "Durum: Tasarım bekleniyor → Sipariş alındı" },
      { at: "2026-09-16T11:33:00Z", tur: "durum", durum: "tasarim-onaylandi", baslik: "Durum: Tasarım bekleniyor → Tasarım onaylandı", aktor: "Grafik Tasarım" },
      { at: "2026-09-16T12:00:00Z", tur: "durum", durum: "uretimde", baslik: "Durum: Tasarım onaylandı → Üretimde" },
      { at: "2026-09-16T12:05:00Z", tur: "durum", durum: "tasarim-onaylandi", baslik: "Durum: Üretimde → Tasarım onaylandı" },
      { at: "2026-09-16T12:10:00Z", tur: "durum", durum: "uretimde", baslik: "Durum: Tasarım onaylandı → Üretimde" },
      { at: "2026-09-17T08:00:00Z", tur: "kargo", durum: "kargoya-verildi", baslik: "Durum: Üretimde → Kargoya verildi", detay: "Takip: TR1 (DHL)", aktor: "Furkan" },
      { at: "2026-09-17T08:01:00Z", tur: "fatura", baslik: "e-Arşiv kesildi", detay: "MS1" },
      { at: "2026-09-17T08:02:00Z", tur: "fatura", baslik: "Fatura e-postası gönderildi (müşteri)" },
    ];
    const k = kilometreTaslari(o);
    expect(k.map((x) => x.anahtar)).toEqual(["siparis", "odeme", "tasarim", "uretim", "kargo", "teslim", "fatura"]);
    expect(k.find((x) => x.anahtar === "odeme")).toMatchObject({ at: "2026-09-16T09:19:00Z", detay: "kart, iyzico" });
    expect(k.find((x) => x.anahtar === "tasarim")?.at).toBe("2026-09-16T12:05:00Z");
    expect(k.find((x) => x.anahtar === "uretim")?.at).toBe("2026-09-16T12:10:00Z");
    expect(k.find((x) => x.anahtar === "kargo")).toMatchObject({ at: "2026-09-17T08:00:00Z", detay: "Takip: TR1 (DHL)", aktor: "Furkan" });
    expect(k.find((x) => x.anahtar === "teslim")?.at).toBeUndefined();
    expect(k.find((x) => x.anahtar === "fatura")).toMatchObject({ at: "2026-09-17T08:01:00Z", detay: "MS1" });
    const ki = kilometreTaslari([...o, { at: "2026-09-18T00:00:00Z", tur: "iade", durum: "iptal-edildi", baslik: "Durum: Kargoya verildi → İptal edildi" }]);
    expect(ki.at(-1)).toMatchObject({ anahtar: "iptal", at: "2026-09-18T00:00:00Z" });
  });
  it("zamanCizelgesiKur çıktısındaki durum alanı kilometre taşlarını besler (kargo audit + shippedAt yedeği)", () => {
    const o = zamanCizelgesiKur({
      order: { createdAt: new Date("2026-09-15T08:00:00Z"), paymentMethod: "havale", paymentStatus: "basarili", shippedAt: new Date("2026-09-16T11:00:00Z"), trackingNumber: "TR9" },
      auditler: [{ createdAt: new Date("2026-09-15T09:00:00Z"), action: "status_change", diff: { from: "siparis-alindi", to: "uretimde" }, actorAd: "Can" }],
      notlar: [], bildirimler: [],
    });
    const k = kilometreTaslari(o);
    expect(k.find((x) => x.anahtar === "uretim")?.at).toBe("2026-09-15T09:00:00.000Z");
    expect(k.find((x) => x.anahtar === "kargo")).toMatchObject({ at: "2026-09-16T11:00:00.000Z", detay: "TR9" });
  });
});
