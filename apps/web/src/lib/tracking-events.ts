import type { TrackingEvent } from "@markala/types";

/**
 * Sipariş durum slug'ından + GERÇEK zaman damgalarından takip adımlarını üretir.
 * Uydurma lokasyon/tarih YOK (eski tracking-mock.ts kaldırıldı) — yalnız gerçekten olan
 * kilometre taşları ve elde varsa zaman damgaları gösterilir. Hem public kargo-takip hem de
 * hesabım/sipariş-detay tarafından kullanılır.
 */
export interface TrackingSource {
  status: string;
  createdAt: string;
  shippedAt?: string | null;
  deliveredAt?: string | null;
}

function statusRank(slug: string): number {
  if (slug === "uretimde") return 1;
  if (slug === "kargoya-verildi") return 2;
  if (slug === "teslim-edildi") return 3;
  return 0; // siparis-alindi / tasarim-*
}

export function buildTrackingEvents(src: TrackingSource): TrackingEvent[] {
  const cancelled = src.status === "iptal-edildi";
  const rank = statusRank(src.status);
  const steps: Array<{ status: TrackingEvent["status"]; label: string; timestamp: string }> = [
    { status: "siparis-alindi", label: "Siparişin alındı", timestamp: src.createdAt },
    { status: "uretimde", label: "Üretimde", timestamp: "" },
    { status: "kargoya-verildi", label: "Kargoya verildi", timestamp: src.shippedAt ?? "" },
    { status: "teslim-edildi", label: "Teslim edildi", timestamp: src.deliveredAt ?? "" },
  ];
  return steps.map((s, i) => ({
    ...s,
    // İptal: yalnız "alındı" tamam, gerisi beklemede — aktif "üretimde" yanılsaması olmasın
    // (durum rozeti zaten "İptal Edildi" gösterir).
    state: cancelled
      ? i === 0
        ? "done"
        : "pending"
      : i < rank
        ? "done"
        : i === rank
          ? rank === 3
            ? "done"
            : "active"
          : "pending",
  }));
}
