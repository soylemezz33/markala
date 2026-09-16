import { describe, it, expect } from "vitest";
import { zamanCizelgesiKur } from "./zaman-cizelgesi-kural";

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
