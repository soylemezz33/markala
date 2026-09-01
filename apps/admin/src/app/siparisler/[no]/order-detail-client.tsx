"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { AdminShell } from "@/components/admin-shell";
import {
  ArrowLeft,
  Package,
  Truck,
  FileText,
  MapPin,
  Phone,
  EnvelopeSimple,
  CheckCircle,
  ClockClockwise,
  Printer,
  XCircle,
  DownloadSimple,
  PaintBrush,
  ArrowCounterClockwise,
} from "@phosphor-icons/react";
import { updateOrderStatus, updateOrderTracking, refundOrder } from "./actions";

/**
 * Kargo firmaları (2026-08-29). Markala fiilen YALNIZ DHL eCommerce kullanıyor
 * (Hasan teyidi) — o yüzden ilk sırada ve varsayılan. Liste yine de açık: istisna
 * gönderilerde elle başka firma yazılabilsin diye "Diğer" serbest metne düşer.
 */
const KARGO_FIRMALARI = ["DHL eCommerce", "Aras Kargo", "MNG Kargo", "Yurtiçi Kargo", "PTT Kargo"];
const VARSAYILAN_KARGO = KARGO_FIRMALARI[0]!;

const STATUSES = [
  { id: "siparis-alindi",     label: "Sipariş Alındı" },
  { id: "tasarim-bekleniyor", label: "Tasarım Bekleniyor" },
  { id: "tasarim-onayindi",   label: "Tasarım Onayında" },
  { id: "uretimde",           label: "Üretimde" },
  { id: "kargoya-verildi",    label: "Kargoda" },
  { id: "teslim-edildi",      label: "Teslim Edildi" },
];

/** Prisma enum (underscore) → STATUSES id (hyphen). API status'ünü tabloyla eşleştirir. */
const toSlug = (s: string) => String(s ?? "").replace(/_/g, "-");

/**
 * Konfigürasyon özetindeki paket adedini çıkarır ("… · 2 Adet · …" → 2, "1.000 Adet" → 1000).
 * Web müşteri panelindeki unitCountFromSummary ile AYNI kural — görünen adet her yerde
 * satır×paket olarak hesaplanır (2026-08-29 adet tutarsızlığı düzeltmesi).
 */
function birimAdet(summary: string | undefined | null): number {
  if (!summary) return 1;
  const m = summary.match(/(\d[\d.]*)\s*adet/i);
  if (!m || !m[1]) return 1;
  const n = Number(m[1].replace(/\./g, ""));
  return Number.isInteger(n) && n >= 1 ? n : 1;
}

/**
 * Hedef durum süreçte geride mi? API'deki isGeriAdim ile AYNI mantık (orders.service.ts).
 * Geri adım = düzeltme → müşteriye mail gitmez; onay metni bunu yazar.
 */
function geriAdimMi(mevcut: string, hedef: string): boolean {
  const a = STATUSES.findIndex((s) => s.id === mevcut);
  const b = STATUSES.findIndex((s) => s.id === hedef);
  return a >= 0 && b >= 0 && b < a;
}

/** Ödeme durumu etiketleri (sipariş durumundan AYRI). */
const PAYMENT_LABELS: Record<string, { label: string; color: string }> = {
  beklemede: { label: "Ödeme Bekliyor", color: "bg-warning/10 text-warning" },
  basarili: { label: "Ödeme Yapıldı", color: "bg-success/10 text-success" },
  basarisiz: { label: "Ödeme Başarısız", color: "bg-error/10 text-error" },
  iade_edildi: { label: "İade Edildi", color: "bg-paper-200 text-ink-500" },
};

export interface OrderDetailProps {
  id: string;
  orderNumber: string;
  email?: string | null;
  customerName?: string | null;
  /** Üye siparişinde dolu; misafir (üyeliksiz) siparişte null. */
  userId?: string | null;
  /** Üye siparişinde API'nin daralttığı kullanıcı özeti (üyelik tarihi rozeti için). */
  user?: { id: string; fullName?: string | null; createdAt?: string } | null;
  createdAt: string;
  status: string;
  paymentStatus?: string | null;
  paymentMethod?: string | null;
  total: unknown;
  subtotal?: unknown;
  shippingFee?: unknown;
  discount?: unknown;
  vat?: unknown;
  trackingNumber?: string | null;
  trackingCarrier?: string | null;
  items: Array<{
    productName: string;
    productSlug?: string;
    productImage?: string | null;
    configurationSummary?: string;
    quantity?: number;
    unitPrice?: unknown;
    lineTotal?: unknown;
    needsDesignSupport?: boolean;
    uploadedFileName?: string | null;
    uploadedFileUrl?: string | null;
    /** Seçimlerin ürün şemasındaki etiket + teknik açıklaması (API findById üretir). */
    optionDetails?: Array<{ group: string; label: string; detail?: string | null }>;
  }>;
  shippingAddress?: {
    fullName?: string;
    fullAddress?: string;
    /** İlçe — kargo için ZORUNLU; tipte eksik olduğu için ekranlara hiç basılmıyordu (2026-09-01). */
    district?: string;
    city?: string;
    zipCode?: string;
    phone?: string;
  } | null;
}

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleString("tr-TR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
}

const TL = (v: unknown) => "₺ " + Number(v ?? 0).toLocaleString("tr-TR", { maximumFractionDigits: 2 });

/** HTML enjeksiyonuna karşı basit kaçış (admin print içeriği). */
function esc(s: unknown): string {
  return String(s ?? "").replace(/[&<>"]/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c] as string,
  );
}

/** Yeni pencerede stilize, yazdırılabilir doküman aç. */
function openPrint(title: string, inner: string): void {
  const w = window.open("", "_blank", "width=820,height=920");
  if (!w) {
    alert("Yazdırma penceresi açılamadı. Tarayıcı popup engelleyicisini kapatın.");
    return;
  }
  w.document.write(
    `<!doctype html><html lang="tr"><head><meta charset="utf-8"><title>${esc(title)}</title>
<style>
*{box-sizing:border-box;font-family:system-ui,-apple-system,'Segoe UI',Roboto,sans-serif}
body{margin:0;padding:28px;color:#1a1410;font-size:13px;line-height:1.45}
.brand{font-size:22px;font-weight:800;color:#F5B800;letter-spacing:-.5px}
.muted{color:#777;font-size:11px}
h1{font-size:15px;margin:0}
table{width:100%;border-collapse:collapse;margin-top:10px}
th,td{text-align:left;padding:7px 8px;border-bottom:1px solid #eee;font-size:12px;vertical-align:top}
.r{text-align:right}
.box{border:1px solid #e2ddd0;border-radius:8px;padding:12px 16px;margin-top:12px}
.big{font-size:24px;font-weight:800;letter-spacing:1px;font-family:ui-monospace,monospace}
.row{display:flex;justify-content:space-between;gap:16px;align-items:flex-start}
@media print{.noprint{display:none}body{padding:6px}}
</style></head><body>${inner}
<div class="noprint" style="margin-top:24px;text-align:center">
<button onclick="window.print()" style="padding:9px 20px;font-size:14px;background:#1a1410;color:#fff;border:0;border-radius:6px;cursor:pointer">Yazdır</button></div>
<script>window.onload=function(){setTimeout(function(){window.print()},350)}</script>
</body></html>`,
  );
  w.document.close();
}

export function OrderDetailClient({ order }: { order: OrderDetailProps }) {
  const [currentStatus, setCurrentStatus] = useState(toSlug(order.status));
  const [statusError, setStatusError] = useState<string | null>(null);
  const [internalNote, setInternalNote] = useState("");
  const [isPending, startTransition] = useTransition();
  const [refundMsg, setRefundMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [refunding, setRefunding] = useState(false);

  // Kargo takip bilgisi (2026-08-29). İki giriş noktası var:
  //  · "kargoya-verildi"ye geçerken açılan pencere → numara müşteriye giden maile girer
  //  · Kargo kartındaki "düzenle" → yalnız kolonu günceller, mail göndermez
  const [trackNo, setTrackNo] = useState(order.trackingNumber ?? "");
  const [trackCarrier, setTrackCarrier] = useState(order.trackingCarrier ?? VARSAYILAN_KARGO);
  const [shipModal, setShipModal] = useState(false);
  const [trackEditing, setTrackEditing] = useState(false);
  const [trackMsg, setTrackMsg] = useState<string | null>(null);

  // İade edilebilir mi: ödemesi başarılı + online (cari değil). Zaten iade edilmişse buton yok.
  const payStatus = String(order.paymentStatus ?? "beklemede");
  const canRefund = payStatus === "basarili" && order.paymentMethod !== "cari";
  const alreadyRefunded = payStatus === "iade-edildi" || payStatus === "iade_edildi";

  const handleRefund = () => {
    if (refunding) return;
    // PARA HAREKETİ — geri alınamaz. Tutarı da göstererek onay iste.
    const ok = window.confirm(
      "Bu siparişin ödemesi iyzico üzerinden müşteriye İADE EDİLECEK.\n\n" +
        `Sipariş: ${order.orderNumber}\n` +
        `Tutar: ${Number(order.total ?? 0).toFixed(2)} ₺\n\n` +
        "Bu işlem GERİ ALINAMAZ. Devam edilsin mi?",
    );
    if (!ok) return;
    setRefundMsg(null);
    setRefunding(true);
    startTransition(async () => {
      const res = await refundOrder(order.id);
      setRefunding(false);
      setRefundMsg(res.ok ? { ok: true, text: res.message } : { ok: false, text: res.error });
      // İade → iptal teklifi (2026-08-29, Hasan: "ücret iade edildiyse iptale çekmesi
      // gerekiyor"). OTOMATİK değil — kısmi/istisna iadelerde sipariş sürebilir — ama
      // olağan akışta tek soruyla bağlanır. Hayır denirse durum olduğu gibi kalır.
      if (res.ok && currentStatus !== "iptal-edildi") {
        const iptalDe = window.confirm(
          "İade tamamlandı.\n\nSipariş de İPTAL EDİLSİN Mİ?\n\n" +
            "• Müşteriye iptal e-postası gider.\n" +
            "• Hayır derseniz sipariş mevcut durumunda kalır.",
        );
        if (iptalDe) {
          const prev = currentStatus;
          setCurrentStatus("iptal-edildi"); // optimistik
          const st = await updateOrderStatus(order.id, "iptal-edildi");
          if (!st.ok) {
            setCurrentStatus(prev);
            setStatusError(`İptal işaretlenemedi: ${st.error}`);
          }
        }
      }
    });
  };

  /** Durum değişikliğini API'ye yazar (onay ALINMIŞ kabul edilir). */
  const commitStatus = (
    statusId: string,
    tracking?: { trackingNumber?: string; trackingCarrier?: string },
  ) => {
    const prev = currentStatus;
    setStatusError(null);
    setCurrentStatus(statusId); // optimistik
    startTransition(async () => {
      const res = await updateOrderStatus(order.id, statusId, tracking);
      if (!res.ok) {
        setCurrentStatus(prev); // başarısız → geri al
        setStatusError(res.error);
      }
    });
  };

  const handleStatusChange = (statusId: string) => {
    if (statusId === currentStatus || isPending) return;

    // Kargoya verme İLERİ adımı: takip numarasını burada sor. Numara müşteriye giden
    // kargo e-postasının içine girer — sonradan eklenirse müşteri o maili takipsiz alır.
    if (statusId === "kargoya-verildi" && !geriAdimMi(currentStatus, statusId)) {
      setTrackNo(order.trackingNumber ?? "");
      setTrackCarrier(order.trackingCarrier ?? VARSAYILAN_KARGO);
      setShipModal(true);
      return;
    }

    // HER durum değişikliği onay ister (2026-08-28, Hasan: "tek tıkla yürümesin,
    // çünkü müşteriye mail gidiyor"). Onay metni ne olacağını AÇIKÇA yazar: müşteriye
    // mail gidip gitmeyeceğini ve işlemin geri alınabilir olup olmadığını.
    if (statusId === currentStatus) return;
    const hedef = STATUSES.find((s) => s.id === statusId)?.label ?? statusId;
    const mevcut = STATUSES.find((s) => s.id === currentStatus)?.label ?? currentStatus;

    if (statusId === "iptal-edildi") {
      const ok = window.confirm(
        `Sipariş İPTAL EDİLECEK.\n\n` +
          `• Müşteriye iptal e-postası GİDECEK.\n` +
          `• Bu işlem GERİ ALINAMAZ, iptal edilen sipariş yeniden açılamaz.\n\n` +
          `Devam edilsin mi?`,
      );
      if (!ok) return;
      // İade + iptal bağlama (2026-08-29, UX denetimi İş 5): ödemesi alınmış siparişte
      // iptal, iadeyi de sorar. "Evet" → önce iade, BAŞARILIYSA iptal (iade düşerse iptal
      // DURUR — parası iade edilmemiş "iptal edilmiş" sipariş oluşamaz). "Hayır" → bilinçli
      // ikinci onayla iadesiz iptal (istisna senaryolar: kısmi iade, havale ile manuel iade).
      if (canRefund) {
        const iadeDe = window.confirm(
          `Bu siparişin ödemesi alınmış (${Number(order.total ?? 0).toFixed(2)} ₺).\n\n` +
            `Ödeme de iyzico üzerinden İADE EDİLSİN Mİ?\n\n` +
            `Tamam = iade + iptal birlikte\nVazgeç = iade YAPILMADAN yalnız iptal`,
        );
        if (!iadeDe) {
          const eminMisin = window.confirm(
            `DİKKAT: Sipariş iptal edilecek ama ödeme İADE EDİLMEYECEK.\n\n` +
              `Müşterinin parası sizde kalır; iadeyi ayrıca yapmanız gerekir.\n\n` +
              `Yine de iadesiz iptal edilsin mi?`,
          );
          if (!eminMisin) return;
        } else {
          // İade + iptal zinciri — iade başarısızsa iptal YAPILMAZ.
          const prev = currentStatus;
          setStatusError(null);
          setRefundMsg(null);
          setRefunding(true);
          startTransition(async () => {
            const iade = await refundOrder(order.id);
            setRefunding(false);
            if (!iade.ok) {
              setStatusError(`İade başarısız, sipariş İPTAL EDİLMEDİ: ${iade.error}`);
              return;
            }
            setRefundMsg({ ok: true, text: iade.message });
            setCurrentStatus("iptal-edildi"); // optimistik
            const res = await updateOrderStatus(order.id, "iptal-edildi");
            if (!res.ok) {
              setCurrentStatus(prev);
              setStatusError(`İade yapıldı ama iptal işaretlenemedi: ${res.error}, durumu elle iptal edin.`);
            }
          });
          return;
        }
      }
    } else {
      // Geri adımda müşteriye mail gitmez (API tarafında da böyle) — onay metni bunu söyler.
      const geri = geriAdimMi(currentStatus, statusId);
      const mailliDurumlar = ["uretimde", "kargoya-verildi", "teslim-edildi"];
      const mailGidecek = !geri && mailliDurumlar.includes(statusId);
      const ok = window.confirm(
        `${mevcut} → ${hedef}\n\n` +
          (mailGidecek
            ? `⚠ Müşteriye "${hedef}" bildirimi E-POSTA ile GÖNDERİLECEK.\n\n`
            : geri
              ? `Bu bir geri alma. Müşteriye e-posta GÖNDERİLMEZ.\n\n`
              : `Müşteriye e-posta gönderilmez.\n\n`) +
          `Devam edilsin mi?`,
      );
      if (!ok) return;
    }
    commitStatus(statusId);
  };

  /** Kargo penceresinden onay: takip bilgisiyle birlikte "kargoya-verildi"ye geçir. */
  const confirmShipment = () => {
    const no = trackNo.trim();
    const firma = trackCarrier.trim();
    if (!no) {
      // Takip numarası olmadan da kargolanabilir (elden teslim, kurye) — ama bilinçli olsun.
      const ok = window.confirm(
        "Takip numarası GİRİLMEDİ.\n\n" +
          "Müşteriye giden kargo e-postasında takip numarası olmayacak ve " +
          "kargo takip sayfasında sorgulayamayacak.\n\n" +
          "Yine de devam edilsin mi?",
      );
      if (!ok) return;
    }
    setShipModal(false);
    commitStatus("kargoya-verildi", { trackingNumber: no, trackingCarrier: firma });
  };

  /** Kargo kartından takip bilgisini güncelle — durum değişmez, müşteriye mail GİTMEZ. */
  const saveTracking = () => {
    setTrackMsg(null);
    startTransition(async () => {
      const res = await updateOrderTracking(order.id, {
        trackingNumber: trackNo.trim(),
        trackingCarrier: trackCarrier.trim(),
      });
      setTrackMsg(res.ok ? "Takip bilgisi kaydedildi." : res.error);
      if (res.ok) setTrackEditing(false);
    });
  };

  const customer = order.customerName ?? order.email ?? "-";
  const currentStatusIndex = STATUSES.findIndex((s) => s.id === currentStatus);
  const isCancelled = currentStatus === "iptal-edildi";

  const a = order.shippingAddress;

  // "İlçe / İl" satırı. İlçesiz gönderi kargoya verilemez, bu yüzden tüm çıktılarda
  // birlikte basılır. Eski kayıtlarda ilçe boş olabilir → filter ile tek başına il kalır.
  const ilceIl = [a?.district, a?.city].filter(Boolean).join(" / ");

  // Sevkiyat/paketleme etiketi
  const printLabel = () =>
    openPrint(`Etiket ${order.orderNumber}`, `
      <div class="brand">Markala</div><div class="muted">324 Ajans · Sevkiyat Etiketi</div>
      <div class="box"><div class="muted">Sipariş No</div><div class="big">${esc(order.orderNumber)}</div></div>
      <div class="box"><div class="muted">Alıcı</div>
        <div style="font-size:15px;font-weight:700">${esc(a?.fullName ?? customer)}</div>
        <div>${esc(a?.fullAddress ?? "")}</div>
        <div>${esc(ilceIl)} ${esc(a?.zipCode ?? "")}</div>
        <div>${esc(a?.phone ?? "")}</div></div>
      <div class="box"><div class="muted">İçerik</div>
        ${order.items.map((i) => `<div>• ${esc(i.productName)}${i.quantity != null ? " × " + esc(i.quantity) : ""}</div>`).join("")}</div>`);

  // Proforma fatura (resmi e-fatura Paraşüt ile; bu çıktı interim)
  const printInvoice = () => {
    const rows = order.items
      .map(
        (i) =>
          `<tr><td>${esc(i.productName)}${i.configurationSummary ? `<br><span class="muted">${esc(i.configurationSummary)}</span>` : ""}</td>` +
          `<td class="r">${esc(i.quantity ?? 1)}</td><td class="r">${TL(i.unitPrice)}</td><td class="r">${TL(i.lineTotal ?? i.unitPrice)}</td></tr>`,
      )
      .join("");
    openPrint(`Proforma ${order.orderNumber}`, `
      <div class="row"><div><div class="brand">Markala</div><div class="muted">324 Ajans BT · markala.com.tr</div></div>
      <div style="text-align:right"><h1>PROFORMA FATURA</h1><div class="muted">No: ${esc(order.orderNumber)}<br>${esc(formatDate(order.createdAt))}</div></div></div>
      <div class="box"><div class="muted">Müşteri</div><div style="font-weight:700">${esc(a?.fullName ?? customer)}</div>
        <div>${esc(order.email ?? "")}</div><div>${esc(a?.fullAddress ?? "")} ${esc(ilceIl)}</div></div>
      <table><thead><tr><th>Ürün</th><th class="r">Adet</th><th class="r">Birim</th><th class="r">Tutar</th></tr></thead><tbody>${rows}</tbody></table>
      <div class="box" style="margin-left:auto;max-width:300px">
        <div class="row"><span class="muted">Ara Toplam</span><span>${TL(order.subtotal)}</span></div>
        <div class="row"><span class="muted">Kargo</span><span>${TL(order.shippingFee)}</span></div>
        ${Number(order.discount ?? 0) > 0 ? `<div class="row"><span class="muted">İndirim</span><span>-${TL(order.discount)}</span></div>` : ""}
        <div class="row"><span class="muted">KDV (dahil)</span><span>${TL(order.vat)}</span></div>
        <div class="row" style="font-weight:800;font-size:15px;border-top:1px solid #ddd;padding-top:6px;margin-top:6px"><span>Toplam</span><span>${TL(order.total)}</span></div></div>
      <p class="muted" style="margin-top:22px">Bu bir proforma çıktısıdır; resmi e-fatura değildir. Resmi fatura Paraşüt entegrasyonu ile kesilecektir.</p>`);
  };

  // Kargo etiketi (gerçek DHL etiketi entegrasyon sonrası; bu çıktı interim)
  const printCargo = () =>
    openPrint(`Kargo ${order.orderNumber}`, `
      <div class="row"><div class="brand">Markala</div><div class="muted">${esc(trackCarrier || "Kargo")}</div></div>
      <div class="box"><div class="muted">Takip No</div><div class="big">${esc(trackNo || "-")}</div></div>
      <div class="row" style="gap:12px">
        <div class="box" style="flex:1"><div class="muted">Gönderen</div><div style="font-weight:700">Markala · 324 Ajans</div><div>Yenişehir / Mersin</div><div>0324 433 33 51</div></div>
        <div class="box" style="flex:1"><div class="muted">Alıcı</div><div style="font-weight:700">${esc(a?.fullName ?? customer)}</div>
          <div>${esc(a?.fullAddress ?? "")}</div><div>${esc(ilceIl)} ${esc(a?.zipCode ?? "")}</div><div>${esc(a?.phone ?? "")}</div></div></div>
      <div class="box"><div class="muted">Sipariş No</div><div style="font-weight:700;font-family:ui-monospace,monospace">${esc(order.orderNumber)}</div></div>`);

  return (
    <AdminShell>
      <div className="mb-6 flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <Link href="/siparisler" className="p-2 rounded-md hover:bg-paper-100 text-ink-700">
            <ArrowLeft size={20} />
          </Link>
          <div>
            <h1 className="text-xl md:text-2xl font-semibold text-ink-900 font-mono">
              {order.orderNumber}
            </h1>
            <p className="text-xs text-ink-500 mt-1">
              {formatDate(order.createdAt)} · Müşteri: {customer}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={printLabel} className="inline-flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium border border-paper-200 hover:bg-paper-100">
            <Printer size={14} /> Etiket Yazdır
          </button>
          <button onClick={printInvoice} className="inline-flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium border border-paper-200 hover:bg-paper-100">
            <FileText size={14} /> Fatura Kes
          </button>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-5">
        {/* Sol: ürünler + zaman çizelgesi */}
        <div className="lg:col-span-2 space-y-5">
          <Card title="Sipariş İçeriği">
            <div className="space-y-3">
              {order.items.length === 0 ? (
                <p className="text-sm text-ink-500">Ürün bilgisi bulunamadı.</p>
              ) : (
                order.items.map((item, i) => (
                  <div key={i} className="flex items-start gap-4 p-3 bg-paper-100/50 rounded-lg">
                    <div className="flex-none w-16 h-16 rounded bg-paper-200 overflow-hidden grid place-items-center">
                      {item.productImage ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={item.productImage} alt={item.productName} className="w-full h-full object-cover" />
                      ) : (
                        <Package size={20} className="text-ink-500" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-ink-900 truncate">{item.productName}</div>
                      {item.configurationSummary && (
                        <div className="text-xs text-ink-500 mt-0.5">{item.configurationSummary}</div>
                      )}
                      {/* Seçenek teknik detayları (Hasan 2026-08-25): "Çift yüz · mat"ın
                          ne olduğu — gramaj, kağıt, selefon — üretim için burada görünür. */}
                      {item.optionDetails?.some((d) => d.detail) && (
                        <ul className="mt-1.5 space-y-0.5 border-l-2 border-paper-200 pl-2">
                          {item.optionDetails
                            .filter((d) => d.detail)
                            .map((d, j) => (
                              <li key={j} className="text-[11px] text-ink-500 leading-snug">
                                <span className="font-medium text-ink-700">
                                  {d.group}: {d.label}
                                </span>{" "}
 - {d.detail}
                              </li>
                            ))}
                        </ul>
                      )}
                      {item.quantity != null && (
                        <div className="text-[11px] text-ink-500 mt-1">
                          {/* GERÇEK parça sayısı: satır adedi × konfigürasyondaki paket adedi
                              ("2 Adet"lik yelken takımı × 1 satır = 2). Web müşteri paneliyle
                              aynı kural (unitCountFromSummary) — 2026-08-29 tutarsızlık düzeltmesi. */}
                          Adet: {item.quantity * birimAdet(item.configurationSummary)}
                          {birimAdet(item.configurationSummary) > 1 && (
                            <span className="text-ink-400"> ({item.quantity} satır × {birimAdet(item.configurationSummary)}'li)</span>
                          )}
                        </div>
                      )}
                      {item.needsDesignSupport && (
                        <div className="mt-1.5 inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-brand-500/15 text-brand-700">
                          <PaintBrush size={11} weight="fill" /> Tasarım desteği istendi
                        </div>
                      )}
                      {/* Tasarım dosyası gösterimi ayrı "Tasarım Dosyaları" bölümünde (aşağıda). */}
                    </div>
                    <div className="text-right">
                      <div className="font-semibold text-ink-900 tabular-nums">
                        ₺ {Number(item.lineTotal ?? item.unitPrice ?? 0).toLocaleString("tr-TR")}
                      </div>
                      {item.quantity != null && item.unitPrice != null && (
                        <div className="text-[11px] text-ink-500">
                          {/* Fiyat kırılımı da GERÇEK adetle: 2'li takım × 1 satır → "2 × ₺750"
                              (satır fiyatı / gerçek adet). Adet satırıyla tutarlı (2026-08-29). */}
                          {(() => {
                            const gercekAdet = (item.quantity ?? 1) * birimAdet(item.configurationSummary);
                            const parcaFiyat = Number(item.lineTotal ?? item.unitPrice ?? 0) / (gercekAdet || 1);
                            return `${gercekAdet} × ₺ ${parcaFiyat.toLocaleString("tr-TR", { maximumFractionDigits: 2 })}`;
                          })()}
                        </div>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
            <div className="mt-4 pt-4 border-t border-paper-200 space-y-1.5 text-sm">
              <RowKV label="Ara Toplam" value={`₺ ${Number(order.subtotal ?? 0).toLocaleString("tr-TR")}`} />
              <RowKV label="Kargo" value={`₺ ${Number(order.shippingFee ?? 0).toLocaleString("tr-TR")}`} />
              {Number(order.discount ?? 0) > 0 && (
                <RowKV
                  label="İndirim"
                  value={`-₺ ${Number(order.discount).toLocaleString("tr-TR")}`}
                  muted
                />
              )}
              <RowKV label="KDV (dahil)" value={`₺ ${Number(order.vat ?? 0).toLocaleString("tr-TR")}`} muted />
              <RowKV label="Toplam" value={`₺ ${Number(order.total).toLocaleString("tr-TR")}`} bold />
            </div>
          </Card>

          {/* Tasarım Dosyaları — müşterinin yüklediği baskı dosyaları ayrı, belirgin bölümde + büyük İndir butonu */}
          {order.items.some(
            (it) =>
              /^https?:\/\//i.test(it.uploadedFileUrl ?? "") || it.needsDesignSupport || it.uploadedFileName,
          ) && (
            <Card title="Tasarım Dosyaları">
              <div className="space-y-2">
                {order.items.map((item, i) => {
                  const hasFile = /^https?:\/\//i.test(item.uploadedFileUrl ?? "");
                  if (!hasFile && !item.needsDesignSupport && !item.uploadedFileName) return null;
                  return (
                    <div
                      key={i}
                      className="flex items-center justify-between gap-3 p-3 rounded-lg border border-paper-200 bg-paper-100/40"
                    >
                      <div className="min-w-0">
                        <div className="font-medium text-ink-900 text-sm truncate">{item.productName}</div>
                        {hasFile ? (
                          <div className="mt-0.5 flex items-center gap-1 text-xs text-ink-500 break-all">
                            <FileText size={12} /> {item.uploadedFileName ?? "tasarim"}
                          </div>
                        ) : item.needsDesignSupport ? (
                          <div className="mt-0.5 text-xs text-brand-700">
                            Tasarım desteği istendi, grafik ekibi hazırlayacak
                          </div>
                        ) : (
                          <div className="mt-0.5 text-xs text-warning">
                            Dosya yüklenmedi, müşteriden iste{item.uploadedFileName ? ` (${item.uploadedFileName})` : ""}
                          </div>
                        )}
                      </div>
                      {hasFile && (
                        <a
                          href={item.uploadedFileUrl ?? undefined}
                          target="_blank"
                          rel="noopener noreferrer"
                          download
                          className="flex-none inline-flex items-center gap-1.5 px-3 py-2 rounded-md text-sm font-medium bg-ink-900 text-paper-50 hover:bg-ink-700"
                        >
                          <DownloadSimple size={14} /> İndir
                        </a>
                      )}
                    </div>
                  );
                })}
              </div>
            </Card>
          )}

          <Card title="Sipariş Durumu">
            {isCancelled && (
              <p className="mb-4 text-xs font-semibold text-error bg-error/10 border border-error/20 rounded-md px-3 py-2 flex items-center gap-1.5">
                <XCircle size={14} weight="fill" /> Bu sipariş iptal edildi.
              </p>
            )}
            <div className="flex flex-wrap gap-2 mb-4">
              {STATUSES.map((s) => (
                <button
                  key={s.id}
                  onClick={() => handleStatusChange(s.id)}
                  disabled={isPending || isCancelled}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all disabled:opacity-60 ${
                    currentStatus === s.id
                      ? "bg-ink-900 text-paper-50 border-ink-900"
                      : "bg-paper-50 border-paper-200 text-ink-700 hover:border-ink-400"
                  }`}
                >
                  {s.label}
                </button>
              ))}
            </div>

            {!isCancelled && (
              <div className="mb-4">
                <button
                  onClick={() => handleStatusChange("iptal-edildi")}
                  disabled={isPending}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border border-error/30 text-error hover:bg-error/10 disabled:opacity-60"
                >
                  <XCircle size={14} /> Siparişi İptal Et
                </button>
              </div>
            )}

            {/* İADE — para hareketi. Yalnız ödemesi başarılı ve online (cari değil)
                siparişlerde görünür; zaten iade edilmişse buton yerine durum yazısı çıkar. */}
            {alreadyRefunded ? (
              <div className="mb-4 text-xs text-ink-500 bg-paper-100 border border-paper-200 rounded-md px-3 py-2">
                Bu siparişin ödemesi iade edildi.
              </div>
            ) : canRefund ? (
              <div className="mb-4">
                <button
                  onClick={handleRefund}
                  disabled={refunding || isPending}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border border-warning/40 text-warning hover:bg-warning/10 disabled:opacity-60"
                >
                  <ArrowCounterClockwise size={14} />
                  {refunding ? "İade ediliyor…" : "Ödemeyi İade Et"}
                </button>
                <p className="mt-1.5 text-[11px] text-ink-500">
                  iyzico üzerinden müşteriye geri ödeme yapılır. Geri alınamaz.
                </p>
              </div>
            ) : null}

            {refundMsg && (
              <p
                className={`mb-4 text-xs rounded-md px-3 py-2 border ${
                  refundMsg.ok
                    ? "text-success bg-success/10 border-success/20"
                    : "text-error bg-error/10 border-error/20"
                }`}
              >
                {refundMsg.text}
              </p>
            )}

            {statusError && (
              <p className="mb-4 text-xs text-error bg-error/10 border border-error/20 rounded-md px-3 py-2">
                {statusError}
              </p>
            )}

            {/* Zaman çizelgesi */}
            <ol className="space-y-3">
              {STATUSES.map((s, i) => {
                const isDone = i < currentStatusIndex;
                const isActive = i === currentStatusIndex;
                return (
                  <li key={s.id} className="flex items-start gap-3">
                    <span
                      className={`flex-none w-7 h-7 rounded-full grid place-items-center ${
                        isDone || isActive
                          ? "bg-success text-paper-50"
                          : "bg-paper-200 text-ink-500"
                      }`}
                    >
                      {isDone || isActive ? (
                        <CheckCircle size={14} weight="bold" />
                      ) : (
                        <ClockClockwise size={14} />
                      )}
                    </span>
                    <div className="flex-1">
                      <div
                        className={`font-medium text-sm ${
                          isDone || isActive ? "text-ink-900" : "text-ink-500"
                        }`}
                      >
                        {s.label}
                        {isActive && " (aktif)"}
                      </div>
                    </div>
                  </li>
                );
              })}
            </ol>
          </Card>

          <Card title="İç Not (sadece admin)">
            <textarea
              value={internalNote}
              onChange={(e) => setInternalNote(e.target.value)}
              rows={3}
              disabled
              placeholder="Sipariş notu kaydetme özelliği yakında eklenecek (backend desteği bekleniyor)."
              className="w-full px-3 py-2 rounded-md border border-paper-200 bg-paper-100/50 text-sm text-ink-500 disabled:cursor-not-allowed"
            />
            <button
              type="button"
              disabled
              title="Sipariş notu kaydetme henüz aktif değil"
              className="mt-3 inline-flex items-center gap-2 px-3 py-1.5 rounded text-xs font-medium bg-paper-200 text-ink-500 cursor-not-allowed"
            >
              <ClockClockwise size={12} /> Not Ekle (yakında)
            </button>
          </Card>
        </div>

        {/* Sağ: müşteri + adres + ödeme */}
        <div className="space-y-5">
          <Card title="Müşteri">
            <div className="font-semibold text-ink-900">{customer}</div>
            {/* Üye mi, misafir mi verdi? (Hasan talebi 2026-08-24) — userId üye siparişinde dolu. */}
            <div className="mt-2">
              {order.userId ? (
                <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-success/10 text-success">
                  ● Üye siparişi
                  {order.user?.createdAt && (
                    <span className="font-normal text-ink-500">
                      · üyelik: {new Date(order.user.createdAt).toLocaleDateString("tr-TR")}
                    </span>
                  )}
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-paper-200 text-ink-700">
                  ● Misafir siparişi (üyeliksiz)
                </span>
              )}
            </div>
            <div className="mt-3 space-y-1.5 text-xs">
              {order.email && (
                <div className="flex items-center gap-2 text-ink-700">
                  <EnvelopeSimple size={12} /> {order.email}
                </div>
              )}
              {order.shippingAddress?.phone && (
                <div className="flex items-center gap-2 text-ink-700">
                  <Phone size={12} /> {order.shippingAddress.phone}
                </div>
              )}
            </div>
          </Card>

          {order.shippingAddress && (
            <Card title="Teslimat Adresi">
              <div className="text-sm text-ink-900 font-medium">
                {order.shippingAddress.fullName ?? customer}
              </div>
              <div className="text-xs text-ink-700 mt-1 leading-relaxed flex items-start gap-2">
                <MapPin size={12} className="flex-none mt-0.5 text-ink-500" />
                <span>
                  {order.shippingAddress.fullAddress}
                  {ilceIl && (
                    <>
                      <br />
                      {ilceIl}
                      {order.shippingAddress.zipCode && ` · ${order.shippingAddress.zipCode}`}
                    </>
                  )}
                </span>
              </div>
            </Card>
          )}

          {/* Kargo kartı: takip numarası VARSA ya da sipariş kargolanmış/teslim edilmişse
              görünür. İkinci koşul olmadan, takip numarası girilmemiş kargolu siparişlerde
              kart hiç çıkmıyordu → numarayı sonradan eklemenin yolu yoktu (2026-08-29). */}
          {(trackNo || currentStatus === "kargoya-verildi" || currentStatus === "teslim-edildi") && (
            <Card title="Kargo">
              {trackEditing || !trackNo ? (
                <div className="space-y-2">
                  <label className="block text-xs font-medium text-ink-700">
                    Kargo Firması
                    <select
                      value={KARGO_FIRMALARI.includes(trackCarrier) ? trackCarrier : "__diger"}
                      onChange={(e) =>
                        setTrackCarrier(e.target.value === "__diger" ? "" : e.target.value)
                      }
                      className="mt-1 w-full border border-paper-200 rounded px-2 py-1.5 text-sm bg-paper-50"
                    >
                      {KARGO_FIRMALARI.map((f) => (
                        <option key={f} value={f}>{f}</option>
                      ))}
                      <option value="__diger">Diğer…</option>
                    </select>
                  </label>
                  {!KARGO_FIRMALARI.includes(trackCarrier) && (
                    <input
                      value={trackCarrier}
                      onChange={(e) => setTrackCarrier(e.target.value)}
                      placeholder="Kargo firması adı"
                      maxLength={128}
                      className="w-full border border-paper-200 rounded px-2 py-1.5 text-sm"
                    />
                  )}
                  <label className="block text-xs font-medium text-ink-700">
                    Takip Numarası
                    <input
                      value={trackNo}
                      onChange={(e) => setTrackNo(e.target.value)}
                      placeholder="DHL eCommerce takip no"
                      maxLength={128}
                      className="mt-1 w-full border border-paper-200 rounded px-2 py-1.5 text-sm font-mono"
                    />
                  </label>
                  <p className="text-[11px] text-ink-500 leading-snug">
                    Buradan kaydetmek müşteriye e-posta <strong>göndermez</strong>, yalnız kaydı düzeltir.
                  </p>
                  <div className="flex gap-2">
                    <button
                      onClick={saveTracking}
                      disabled={isPending}
                      className="flex-1 py-2 rounded text-xs font-semibold bg-brand-700 text-paper-50 hover:bg-brand-800 disabled:opacity-50"
                    >
                      {isPending ? "Kaydediliyor…" : "Kaydet"}
                    </button>
                    {trackEditing && (
                      <button
                        onClick={() => {
                          setTrackEditing(false);
                          setTrackNo(order.trackingNumber ?? "");
                          setTrackCarrier(order.trackingCarrier ?? VARSAYILAN_KARGO);
                        }}
                        className="px-3 py-2 rounded text-xs font-medium border border-paper-200 hover:bg-paper-100"
                      >
                        Vazgeç
                      </button>
                    )}
                  </div>
                </div>
              ) : (
                <>
                  <div className="flex items-center gap-2 mb-2">
                    <Truck size={16} className="text-brand-700" />
                    <span className="font-semibold text-ink-900 text-sm">
                      {trackCarrier || "Kargo"}
                    </span>
                  </div>
                  <div className="text-xs text-ink-500">
                    Takip No: <span className="font-mono text-ink-900">{trackNo}</span>
                  </div>
                  <div className="mt-3 flex gap-2">
                    <button onClick={printCargo} className="flex-1 py-2 rounded text-xs font-medium border border-paper-200 hover:bg-paper-100">
                      Etiket Yazdır
                    </button>
                    <button onClick={() => setTrackEditing(true)} className="px-3 py-2 rounded text-xs font-medium border border-paper-200 hover:bg-paper-100">
                      Düzenle
                    </button>
                  </div>
                </>
              )}
              {trackMsg && <p className="mt-2 text-xs text-ink-700">{trackMsg}</p>}
            </Card>
          )}

          <Card title="Ödeme">
            <div className="mt-1 text-xs">
              {(() => {
                const ps = String(order.paymentStatus ?? "beklemede");
                const p = PAYMENT_LABELS[ps] ?? { label: ps, color: "bg-paper-200 text-ink-700" };
                return (
                  <span className={`inline-block px-2 py-0.5 rounded-full font-semibold ${p.color}`}>
                    {p.label}
                  </span>
                );
              })()}
            </div>
            <div className="mt-2 text-sm font-semibold text-ink-900 tabular-nums">
              ₺ {Number(order.total).toLocaleString("tr-TR")}
            </div>
          </Card>
        </div>
      </div>

      {/* Kargoya verme penceresi (2026-08-29). window.confirm YERİNE bu pencere çıkar
          çünkü takip numarasını burada almamız gerekiyor: numara müşteriye giden kargo
          e-postasının içine giriyor, sonradan eklenirse müşteri maili takipsiz alıyor. */}
      {shipModal && (
        <div
          className="fixed inset-0 z-50 bg-ink-900/40 flex items-center justify-center p-4"
          onClick={() => setShipModal(false)}
        >
          <div
            className="bg-paper-50 rounded-lg shadow-xl w-full max-w-md p-5"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="font-semibold text-ink-900 flex items-center gap-2">
              <Truck size={18} className="text-brand-700" /> Kargoya Ver
            </h3>
            <p className="mt-1 text-xs text-ink-500 leading-snug">
              Müşteriye <strong>&ldquo;Kargoya Verildi&rdquo;</strong> e-postası gönderilecek.
              Aşağıdaki takip numarası e-postanın içinde yer alır.
            </p>

            <label className="block mt-4 text-xs font-medium text-ink-700">
              Kargo Firması
              <select
                value={KARGO_FIRMALARI.includes(trackCarrier) ? trackCarrier : "__diger"}
                onChange={(e) => setTrackCarrier(e.target.value === "__diger" ? "" : e.target.value)}
                className="mt-1 w-full border border-paper-200 rounded px-2.5 py-2 text-sm bg-paper-50"
              >
                {KARGO_FIRMALARI.map((f) => (
                  <option key={f} value={f}>{f}</option>
                ))}
                <option value="__diger">Diğer…</option>
              </select>
            </label>
            {!KARGO_FIRMALARI.includes(trackCarrier) && (
              <input
                value={trackCarrier}
                onChange={(e) => setTrackCarrier(e.target.value)}
                placeholder="Kargo firması adı"
                maxLength={128}
                className="mt-2 w-full border border-paper-200 rounded px-2.5 py-2 text-sm"
              />
            )}

            <label className="block mt-3 text-xs font-medium text-ink-700">
              Takip Numarası
              <input
                autoFocus
                value={trackNo}
                onChange={(e) => setTrackNo(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && confirmShipment()}
                placeholder="DHL eCommerce takip no"
                maxLength={128}
                className="mt-1 w-full border border-paper-200 rounded px-2.5 py-2 text-sm font-mono"
              />
            </label>

            <div className="mt-5 flex gap-2">
              <button
                onClick={confirmShipment}
                disabled={isPending}
                className="flex-1 py-2.5 rounded text-sm font-semibold bg-brand-700 text-paper-50 hover:bg-brand-800 disabled:opacity-50"
              >
                Kargoya Ver ve Bildir
              </button>
              <button
                onClick={() => setShipModal(false)}
                className="px-4 py-2.5 rounded text-sm font-medium border border-paper-200 hover:bg-paper-100"
              >
                Vazgeç
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminShell>
  );
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="bg-paper-50 border border-paper-200 rounded-lg overflow-hidden">
      <header className="px-5 py-3 border-b border-paper-200 bg-paper-100/40">
        <h2 className="font-semibold text-ink-900 text-sm">{title}</h2>
      </header>
      <div className="p-5">{children}</div>
    </section>
  );
}

function RowKV({
  label,
  value,
  bold,
  muted,
}: {
  label: string;
  value: string;
  bold?: boolean;
  muted?: boolean;
}) {
  return (
    <div
      className={`flex items-center justify-between text-sm ${
        bold
          ? "font-bold text-ink-900 text-base pt-2 border-t border-paper-200 mt-2"
          : muted
          ? "text-ink-500"
          : "text-ink-700"
      }`}
    >
      <span>{label}</span>
      <span className="tabular-nums">{value}</span>
    </div>
  );
}
