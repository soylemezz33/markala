/**
 * SİPARİŞ ZAMAN ÇİZELGESİ — saf kurgu (2026-09-16, Hasan: "kargoya verildiği gün, ödeme zamanı,
 * tasarıma alınma zamanı… her hareketi gün ve saatiyle sipariş detayında görmek istiyorum").
 *
 * Kaynaklar: Order kolonları (createdAt, shippedAt, deliveredAt, invoiceIssuedAt, invoiceMailedAt),
 * audit_logs (status_change, havale_odeme_onay, manuel_odeme_onay, manuel_siparis, tracking_update,
 * refund, design_upload/design_delete), order_notes (iç not, Chatwoot), notification_logs
 * (müşteriye/ekibe giden e-posta ve WhatsApp). Parasal alan YAZILMAZ (kargo rolü de görür).
 */
export type ZamanOlayTuru = "olusturma" | "odeme" | "durum" | "kargo" | "fatura" | "bildirim" | "not" | "tasarim" | "iade" | "diger";

export interface ZamanOlayi {
  at: string; // ISO
  tur: ZamanOlayTuru;
  baslik: string;
  detay?: string;
  aktor?: string;
}

export const DURUM_ADI: Record<string, string> = {
  "siparis-alindi": "Sipariş alındı",
  "tasarim-bekleniyor": "Tasarım bekleniyor",
  "tasarim-onayindi": "Tasarım onayında",
  "tasarim-onaylandi": "Tasarım onaylandı",
  uretimde: "Üretimde",
  "kargoya-verildi": "Kargoya verildi",
  "teslim-edildi": "Teslim edildi",
  "iptal-edildi": "İptal edildi",
};
const durumAdi = (s: unknown) => DURUM_ADI[String(s ?? "").replace(/_/g, "-")] ?? String(s ?? "");

const BILDIRIM_ADI: Record<string, string> = {
  "order-confirmation": "Sipariş onayı e-postası (müşteri)",
  "order-in-production": "Üretime alındı e-postası (müşteri)",
  "order-shipped": "Kargoya verildi e-postası (müşteri)",
  "order-delivered": "Teslim edildi e-postası (müşteri)",
  "order-cancelled": "İptal e-postası (müşteri)",
  "review-invitation": "Yorum daveti e-postası (müşteri)",
  "ikinci-siparis-kod": "İkinci sipariş kuponu e-postası (müşteri)",
  "ikinci-siparis-hatirlatma": "Kupon hatırlatma e-postası (müşteri)",
  "payment-recovery-1": "Ödeme hatırlatma e-postası 1 (müşteri)",
  "payment-recovery-2": "Ödeme hatırlatma e-postası 2 (müşteri)",
  "new-order-admin": "Yeni sipariş e-postası (ekip)",
  "whatsapp-new-order": "Yeni sipariş WhatsApp bildirimi (ekip)",
  "whatsapp-tasarim-bekleniyor": "Tasarım bekleniyor WhatsApp bildirimi (ekip)",
  "invoice-email": "Fatura e-postası (müşteri)",
};

export interface ZamanGirdisi {
  order: {
    createdAt: Date; paymentMethod?: string | null; paymentStatus?: string; notes?: string | null;
    shippedAt?: Date | null; deliveredAt?: Date | null; trackingNumber?: string | null; trackingCarrier?: string | null;
    invoiceIssuedAt?: Date | null; invoiceMailedAt?: Date | null; invoiceNumber?: string | null; invoiceType?: string | null;
  };
  auditler: Array<{ createdAt: Date; action: string; diff: unknown; actorAd?: string | null; entityType?: string }>;
  notlar: Array<{ createdAt: Date; body: string; authorName: string; authorRole?: string | null }>;
  bildirimler: Array<{ createdAt: Date; channel: string; template: string; recipient: string; status: string }>;
}

const iso = (d: Date) => new Date(d).toISOString();

export function zamanCizelgesiKur(g: ZamanGirdisi): ZamanOlayi[] {
  const o: ZamanOlayi[] = [];
  const notlar = String(g.order.notes ?? "");
  const kanal = /Kanal:\s*([^·\n]+)/.exec(notlar)?.[1]?.trim();
  const manuel = /Manuel sipariş \(([^)]+)\)/.exec(notlar)?.[1];
  o.push({
    at: iso(g.order.createdAt), tur: "olusturma",
    baslik: manuel ? "Manuel sipariş oluşturuldu" : "Sipariş oluşturuldu",
    detay: kanal ? `Kanal: ${kanal}` : "Kanal: web sitesi",
    aktor: manuel ?? "Müşteri",
  });

  let odemeYazildi = false;
  for (const a of g.auditler) {
    const d = (a.diff ?? {}) as Record<string, unknown>;
    const aktor = a.actorAd ?? (d.role === "chatwoot" ? "Chatwoot" : d.otomatik ? "Sistem" : d.role ? String(d.role) : "Sistem");
    switch (a.action) {
      case "status_change": {
        const to = String(d.to ?? "").replace(/_/g, "-");
        const tur: ZamanOlayTuru = to === "kargoya-verildi" ? "kargo" : to === "iptal-edildi" ? "iade" : "durum";
        const tracking = d.tracking as { number?: string; carrier?: string } | null | undefined;
        o.push({
          at: iso(a.createdAt), tur,
          baslik: `Durum: ${durumAdi(d.from)} → ${durumAdi(d.to)}`,
          detay: [d.sebep === "odeme_tamamlandi" ? "Ödeme tamamlanınca otomatik" : null, tracking?.number ? `Takip: ${tracking.number}${tracking.carrier ? ` (${tracking.carrier})` : ""}` : null].filter(Boolean).join(" · ") || undefined,
          aktor,
        });
        break;
      }
      case "havale_odeme_onay":
        o.push({ at: iso(a.createdAt), tur: "odeme", baslik: "Ödeme alındı (havale/EFT onayı)", aktor }); odemeYazildi = true; break;
      case "manuel_odeme_onay":
        o.push({ at: iso(a.createdAt), tur: "odeme", baslik: "Ödeme alındı (IBAN, elle işaretlendi)", aktor }); odemeYazildi = true; break;
      case "manuel_siparis":
        if (d.odemeAlindi) { o.push({ at: iso(a.createdAt), tur: "odeme", baslik: `Ödeme alındı (${String(d.odemeYontemi ?? "")})`, aktor }); odemeYazildi = true; }
        break;
      case "tracking_update":
        o.push({ at: iso(a.createdAt), tur: "kargo", baslik: "Kargo takip bilgisi girildi", detay: [d.trackingNumber ?? d.number, d.trackingCarrier ?? d.carrier].filter(Boolean).join(" · ") || undefined, aktor });
        break;
      case "refund":
        o.push({ at: iso(a.createdAt), tur: "iade", baslik: "Ödeme iade edildi", aktor }); break;
      case "design_upload":
        o.push({ at: iso(a.createdAt), tur: "tasarim", baslik: `Tasarım dosyası yüklendi${d.kind ? ` (${String(d.kind)})` : ""}`, detay: d.fileName ? String(d.fileName) : undefined, aktor }); break;
      case "design_delete":
        o.push({ at: iso(a.createdAt), tur: "tasarim", baslik: "Tasarım dosyası silindi", detay: d.fileName ? String(d.fileName) : undefined, aktor }); break;
      case "iptal":
      case "cancel":
        o.push({ at: iso(a.createdAt), tur: "iade", baslik: "Sipariş iptal edildi", aktor }); break;
      default:
        o.push({ at: iso(a.createdAt), tur: "diger", baslik: a.action, aktor });
    }
  }

  // Kart ödemesi: audit yok → sipariş onayı e-postası ödeme başarısında gider; o an "ödeme alındı" sayılır.
  if (!odemeYazildi && g.order.paymentStatus === "basarili" && g.order.paymentMethod === "iyzico") {
    const onay = g.bildirimler.find((b) => b.template === "order-confirmation" && b.status === "sent");
    if (onay) o.push({ at: iso(onay.createdAt), tur: "odeme", baslik: "Ödeme alındı (kart, iyzico)", aktor: "Sistem" });
  }

  for (const n of g.notlar) {
    const b = n.body.trim();
    if (b.startsWith("Chatwoot konuşması")) {
      o.push({ at: iso(n.createdAt), tur: "not", baslik: b.includes("açılamadı") ? "Chatwoot konuşması açılamadı" : "Chatwoot konuşması bağlandı", detay: b.replace(/^Chatwoot konuşması\s*/, "").slice(0, 160), aktor: n.authorName });
    } else {
      o.push({ at: iso(n.createdAt), tur: "not", baslik: b.startsWith("💬") ? "Chatwoot notu" : "İç not", detay: b.replace(/^💬 Chatwoot notu \([^)]*\):\s*/, "").slice(0, 200), aktor: n.authorName });
    }
  }

  for (const b of g.bildirimler) {
    const ad = BILDIRIM_ADI[b.template] ?? `${b.channel === "whatsapp" ? "WhatsApp" : "E-posta"}: ${b.template}`;
    o.push({ at: iso(b.createdAt), tur: "bildirim", baslik: b.status === "sent" ? ad : `${ad} — ${b.status.toUpperCase()}`, detay: b.recipient, aktor: "Sistem" });
  }

  const durumVar = (to: string) => g.auditler.some((a) => a.action === "status_change" && String((a.diff as Record<string, unknown> | null)?.to ?? "").replace(/_/g, "-") === to);
  if (g.order.shippedAt && !durumVar("kargoya-verildi")) o.push({ at: iso(g.order.shippedAt), tur: "kargo", baslik: "Kargoya verildi", detay: [g.order.trackingNumber, g.order.trackingCarrier].filter(Boolean).join(" · ") || undefined });
  if (g.order.deliveredAt && !durumVar("teslim-edildi")) o.push({ at: iso(g.order.deliveredAt), tur: "durum", baslik: "Teslim edildi" });
  if (g.order.invoiceIssuedAt) o.push({ at: iso(g.order.invoiceIssuedAt), tur: "fatura", baslik: `${g.order.invoiceType === "e_invoice" ? "e-Fatura" : "e-Arşiv"} kesildi`, detay: g.order.invoiceNumber ?? undefined, aktor: "Sistem (Paraşüt)" });
  if (g.order.invoiceMailedAt) o.push({ at: iso(g.order.invoiceMailedAt), tur: "fatura", baslik: "Fatura e-postası gönderildi (müşteri)", aktor: "Sistem" });

  return o.sort((x, y) => x.at.localeCompare(y.at));
}
