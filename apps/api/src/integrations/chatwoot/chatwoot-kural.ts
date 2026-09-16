/**
 * Chatwoot sipariş konuşması — SAF kurallar (ağ yok, test edilebilir).
 *
 * 2026-09-15 (Hasan): "sipariş gelince Chatwoot'ta otomatik konuşma penceresi açılsın ve tasarım
 * ekibi atansın; e-posta taslaklarına dokunma". Müşteriye mesaj GİTMEZ; konuşma WhatsApp gelen
 * kutusunda açılır, sipariş özeti ÖZEL not olarak düşer, tasarımcı oradan müşteriye yazar
 * (24 saat dışındaysa Chatwoot şablon seçtirir).
 */

/** Türkiye telefonunu WhatsApp source_id biçimine çevirir: yalnız rakam, 90 ile başlar (12 hane). */
export function whatsappKimligi(ham: string | null | undefined): string | null {
  let d = String(ham ?? "").replace(/\D/g, "");
  if (!d) return null;
  if (d.startsWith("0090")) d = d.slice(2);
  if (d.length === 11 && d.startsWith("0")) d = "9" + d; // 05xx… → 905xx…
  if (d.length === 10 && d.startsWith("5")) d = "90" + d; // 5xx… → 905xx…
  return /^905\d{9}$/.test(d) ? d : null;
}

export interface KonusmaKalemi {
  productName: string;
  quantity: number;
  configurationSummary?: string | null;
  needsDesignSupport?: boolean | null;
  uploadedFileName?: string | null;
  /** Müşterinin set başına yüklediği dosya sayısı (DesignUpload kind=musteri). */
  dosyaSayisi?: number;
}

export interface KonusmaGirdisi {
  orderId: string;
  orderNumber: string;
  musteriAdi: string;
  telefon: string | null;
  email: string | null;
  paymentMethod?: string | null;
  siparisNotu?: string | null;
  kalemler: KonusmaKalemi[];
  panelUrl: string;
}

/** Konuşma etiketi: dosyası eksik kalem varsa "dosya-bekleniyor", yoksa "tasarim-asamasina-hazir". */
export function konusmaEtiketi(kalemler: KonusmaKalemi[]): "dosya-bekleniyor" | "tasarim-asamasina-hazir" {
  const dosyasiz = kalemler.some((k) => !k.uploadedFileName && !(k.dosyaSayisi && k.dosyaSayisi > 0));
  return dosyasiz ? "dosya-bekleniyor" : "tasarim-asamasina-hazir";
}

/** Sipariş notundaki idempotency öneki (__idem:<hash>__) sistem içidir, gösterilmez. */
export function siparisNotuTemizle(notes: string | null | undefined): string {
  return String(notes ?? "").replace(/__idem:[a-f0-9]+__\s*/i, "").trim();
}

/** Tasarımcının göreceği özel not (Chatwoot private message, düz metin). */
export function ozelNotMetni(g: KonusmaGirdisi): string {
  const satirlar = [
    `🧾 Sipariş ${g.orderNumber} — ödeme alındı, tasarım bekleniyor`,
    `👤 ${g.musteriAdi}${g.telefon ? ` · +${g.telefon}` : ""}${g.email ? ` · ${g.email}` : ""}`,
    "",
    ...g.kalemler.map((k) => {
      const dosya = k.uploadedFileName || (k.dosyaSayisi && k.dosyaSayisi > 0)
        ? `dosya: ${k.dosyaSayisi && k.dosyaSayisi > 1 ? `${k.dosyaSayisi} dosya` : k.uploadedFileName || "1 dosya"}`
        : "dosya YOK";
      const destek = k.needsDesignSupport ? " · tasarım desteği İSTİYOR" : "";
      return `• ${k.quantity}× ${k.productName}${k.configurationSummary ? ` (${k.configurationSummary})` : ""} — ${dosya}${destek}`;
    }),
  ];
  const not = siparisNotuTemizle(g.siparisNotu);
  if (not) satirlar.push("", `📝 Sipariş notu: ${not}`);
  satirlar.push("", `🔗 Panel: ${g.panelUrl}`);
  return satirlar.join("\n");
}

/** Konuşmayı siparişe bağlayan iç not (OrderNote gövdesi) — tekrar açılmasın diye bu önekle aranır. */
export const CHATWOOT_NOT_ONEKI = "Chatwoot konuşması";
export function icNotMetni(conversationId: number, url: string, yeni = true): string {
  return `${CHATWOOT_NOT_ONEKI} #${conversationId} (${yeni ? "yeni açıldı" : "müşterinin mevcut konuşmasına eklendi"}, grafik tasarım ekibine atandı): ${url}`;
}

// ── Sipariş durumu ↔ konuşma (2026-09-16, Hasan: "panelle birebir entegre") ─────────────────
/** Panel sipariş durumu slug'ları = Chatwoot etiket adları (aynı yazım). */
export const DURUM_ETIKETLERI = [
  "siparis-alindi", "tasarim-bekleniyor", "tasarim-onaylandi", "uretimde", "kargoya-verildi", "teslim-edildi", "iptal-edildi",
] as const;
/** Bu durumlardan itibaren konuşma üretim sorumlusuna (CHATWOOT_URETIM_AGENT_ID) atanır. */
export const URETIM_SONRASI = ["uretimde", "kargoya-verildi", "teslim-edildi"];
/** Bu durumlarda konuşma "çözüldü"ye çekilir. */
export const KAPANIS_DURUMLARI = ["teslim-edildi", "iptal-edildi"];
/** Chatwoot'tan etiketle DEĞİŞTİRİLEBİLEN durumlar; kargo/teslim/iptal yalnız panelden. */
export const CHATWOOTTAN_PANELE = ["tasarim-bekleniyor", "tasarim-onaylandi", "uretimde"];

const DURUM_BASLIK: Record<string, string> = {
  "siparis-alindi": "Sipariş alındı", "tasarim-bekleniyor": "Tasarım bekleniyor", "tasarim-onaylandi": "Tasarım onaylandı",
  "uretimde": "Üretimde", "kargoya-verildi": "Kargoya verildi", "teslim-edildi": "Teslim edildi", "iptal-edildi": "İptal edildi",
};

/** Chatwoot POST /labels listeyi TAMAMEN değiştirir → durum dışı etiketler korunur, tek durum etiketi kalır. */
export function durumEtiketleriniUygula(mevcut: string[], slug: string): string[] {
  const durumDisi = mevcut.filter((l) => !(DURUM_ETIKETLERI as readonly string[]).includes(l));
  return [...durumDisi, slug];
}

/** Konuşmadaki durum etiketi; birden fazlaysa işaretli (eski) olmayanı tercih eder. */
export function durumEtiketiBul(labels: string[], isaretli?: string): string | null {
  const d = labels.filter((l) => (DURUM_ETIKETLERI as readonly string[]).includes(l));
  if (!d.length) return null;
  if (d.length === 1) return d[0];
  return d.find((l) => l !== isaretli) ?? d[0];
}

/** İç nottan konuşma id'si ("Chatwoot konuşması #15 …"). */
export function konusmaIdNottan(body: string | null | undefined): number | null {
  const m = /^Chatwoot konuşması #(\d+)/.exec(String(body ?? ""));
  return m ? Number(m[1]) : null;
}

export function durumNotu(slug: string, kaynak = "panel"): string {
  return `📦 Sipariş durumu: ${DURUM_BASLIK[slug] ?? slug} (${kaynak})`;
}
