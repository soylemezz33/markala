import type { Order, TrackingEvent } from "@markala/types";

/**
 * Mock tracking events üretir — sipariş status'üne göre tüm geçmiş + sıradaki adımlar.
 * Gerçek implementasyon DHL Tracking API'den çekecek.
 */

const DEFAULT_TIMELINE: Array<{ status: TrackingEvent["status"]; label: string; description: string; location?: string }> = [
  {
    status: "siparis-alindi",
    label: "Sipariş Alındı",
    description: "Siparişiniz sistemimize ulaştı.",
  },
  {
    status: "siparis-onaylandi",
    label: "Sipariş Onaylandı",
    description: "Ödeme alındı, üretim sırasına eklendi.",
  },
  {
    status: "uretimde",
    label: "Üretimde",
    description: "Atölyemizde üretim sürecindedir.",
    location: "Mersin Atölye",
  },
  {
    status: "kalite-kontrol",
    label: "Kalite Kontrolü",
    description: "Ürünleriniz kontrol edildi, paketleme aşamasına geçti.",
    location: "Mersin Atölye",
  },
  {
    status: "paketlendi",
    label: "Paketlendi",
    description: "Kargoya hazır, teslim alınmayı bekliyor.",
    location: "Mersin Atölye",
  },
  {
    status: "kargoya-verildi",
    label: "Kargoya Verildi",
    description: "DHL kuryesine teslim edildi.",
    location: "Mersin Aktarma Merkezi",
  },
  {
    status: "transfer-merkezinde",
    label: "Transfer Merkezinde",
    description: "Hedef şehre yönlendirildi.",
    location: "Adana Transfer Merkezi",
  },
  {
    status: "dagitima-cikti",
    label: "Dağıtıma Çıktı",
    description: "Kurye bugün adresinize teslim edecek.",
  },
  {
    status: "teslim-edildi",
    label: "Teslim Edildi",
    description: "Siparişiniz teslim alındı. Markala'yı tercih ettiğiniz için teşekkürler.",
  },
];

const STATUS_TO_INDEX: Record<Order["status"], number> = {
  "siparis-alindi": 1,
  "tasarim-bekleniyor": 2,
  "tasarim-onayindi": 2,
  uretimde: 4,
  "kargoya-verildi": 6,
  "teslim-edildi": 8,
  "iptal-edildi": -1,
};

export function generateMockTrackingEvents(order: Order): TrackingEvent[] {
  const now = Date.now();
  const orderTime = new Date(order.createdAt).getTime();
  const completedIndex = STATUS_TO_INDEX[order.status] ?? 0;

  return DEFAULT_TIMELINE.map((step, i) => {
    let state: TrackingEvent["state"] = "pending";
    if (i < completedIndex) state = "done";
    else if (i === completedIndex) state = "active";

    // Geçmiş adımlar için: zaman dağılımı (son 24-48 saatten geriye)
    const offsetHours = (completedIndex - i) * 6;
    const timestamp =
      i <= completedIndex
        ? new Date(Math.max(orderTime, now - offsetHours * 3600 * 1000)).toISOString()
        : new Date(now + (i - completedIndex) * 12 * 3600 * 1000).toISOString();

    return {
      status: step.status,
      label: step.label,
      description: step.description,
      location: step.location,
      timestamp,
      state,
    };
  });
}

export function getTrackingProgressPercent(events: TrackingEvent[]): number {
  const done = events.filter((e) => e.state === "done").length;
  const active = events.filter((e) => e.state === "active").length;
  return Math.round(((done + active * 0.5) / events.length) * 100);
}
