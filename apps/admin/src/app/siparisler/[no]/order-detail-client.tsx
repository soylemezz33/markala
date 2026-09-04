"use client";

import { useState, useTransition } from "react";
import { havaleOnayBekliyorMu } from "./havale-onay-kurali";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { DesignFileUploader } from "@/components/design-file-uploader";
import { AdminShell } from "@/components/admin-shell";
import { iptalMailiGonderilirMi } from "./iptal-mail-kurali";
import type { OrderNote } from "@markala/types";
import { confirm } from "@/components/confirm-dialog";
import { toast } from "@/components/toast";
import { useServerPerms } from "@/components/perms-provider";
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
  Trash,
  TrashSimple,
  NotePencil,
  Image as ImageIcon, ArrowSquareOut, WarningCircle } from "@phosphor-icons/react";
import {
  updateOrderStatus,
  updateOrderTracking,
  refundOrder,
  confirmHavalePayment,
  deleteOrderDesign,
  addOrderNote,
  deleteOrderNote,
} from "./actions";

/**
 * Kargo firmaları (2026-08-29). Markala fiilen YALNIZ DHL eCommerce kullanıyor
 * (Hasan teyidi) — o yüzden ilk sırada ve varsayılan. Liste yine de açık: istisna
 * gönderilerde elle başka firma yazılabilsin diye "Diğer" serbest metne düşer.
 */
const KARGO_FIRMALARI = ["DHL eCommerce", "Aras Kargo", "MNG Kargo", "Yurtiçi Kargo", "PTT Kargo"];
const VARSAYILAN_KARGO = KARGO_FIRMALARI[0]!;
/** Kargo rolünün (orders.status yok) yapabildiği geçişler — API status-yetki.ts ile AYNI liste (2026-09-03). */
const KARGO_GECISLERI = ["uretimde", "kargoya-verildi"];

const STATUSES = [
  { id: "siparis-alindi",     label: "Sipariş Alındı" },
  { id: "tasarim-bekleniyor", label: "Tasarım Bekleniyor" },
  { id: "tasarim-onayindi",   label: "Tasarım Onayında" },
  { id: "tasarim-onaylandi",  label: "Tasarım Onaylandı" }, // 2026-09-03: müşteriye mail yok, kargo@'ya bildirim
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
  paymentErrorCode?: string | null;
  paymentErrorMessage?: string | null;
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
    uploadedFileDriveUrl?: string | null;
    /** Satır kimliği — panelden bu satıra tasarım dosyası yüklemek için (2026-09-02). */
    id?: string;
    /** Tasarımcının yüklediği dosyalar (önizleme/çalışma/baskı) — yalnız panel rollerinde gelir. */
    designUploads?: Array<{
      id: string;
      kind: "onizleme" | "calisma" | "baski" | "musteri";
      fileName: string;
      fileSize: number;
      fileUrl: string;
      mimeType: string;
      createdAt: string;
      uploadedBy?: { id: string; fullName?: string | null } | null;
      driveUrl?: string | null;
      designIndex?: number | null;
    }>;
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

/** Onay pencerelerinde tutar: 2646 → "2.646,00 ₺" (tarayıcı yerelinden bağımsız). */
function tl(v: unknown): string {
  return `${Number(v ?? 0).toLocaleString("tr-TR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })} ₺`;
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

/**
 * Tasarım dosyası indirme yolu (2026-09-01). Dosyalar artık public DEĞİL; API'de
 * auth+ORDERS_READ korumalı uçtan geliyor ve düz <a href> Authorization gönderemiyor.
 * Bu yüzden link admin'in kendi BFF rotasından geçer (çerezle kimliklenir).
 * URL'nin son parçası (uuid.uzantı) anahtardır — hem eski hem yeni kayıt için aynı.
 */
/** Dosya URL'inden depolama anahtarını (uuid.uzantı) çıkarır; desen tutmazsa undefined. */
function tasarimAnahtari(url: string | null | undefined): string | undefined {
  const key = String(url ?? "").split("?")[0]?.split("/").pop();
  return key && /^[0-9a-f-]{36}\.[a-z0-9]{1,5}$/i.test(key) ? key : undefined;
}

const KIND_ETIKET: Record<string, string> = { onizleme: "Önizleme", calisma: "Çalışma", baski: "Baskı PDF", musteri: "Müşteri dosyası" };
const boyut = (b: number) => (b >= 1024 * 1024 ? `${(b / 1024 / 1024).toFixed(1)} MB` : `${Math.max(1, Math.round(b / 1024))} KB`);

function tasarimIndirmeYolu(
  url: string | null | undefined,
  ad?: string,
): string | undefined {
  const key = String(url ?? "").split("?")[0]?.split("/").pop();
  if (!key || !/^[0-9a-f-]{36}\.[a-z0-9]{1,5}$/i.test(key)) return undefined;
  return ad
    ? `/api/tasarim-dosya/${key}?ad=${encodeURIComponent(ad)}`
    : `/api/tasarim-dosya/${key}`;
}

/**
 * İndirilecek tasarım dosyasının adı (2026-09-02 üretim ARGE).
 *
 * Eskiden dosya "9f3c1a72-...-2c5e91d4f6ab.pdf" olarak iniyordu (ham depolama anahtarı);
 * operatör baskı kuyruğunda hangi siparişe ait olduğunu göremiyordu ve üretimde işler
 * bu yüzden karışıyordu. Artık:
 *
 *   MK-2026-1234-2__klasik-kartvizit__1000ad
 *
 * SATIR NUMARASI DAHİL: üretim birimi sipariş değil sipariş SATIRIDIR — bir siparişte
 * kartvizit + broşür olabilir, ikisi farklı makinede farklı saatte basılır. Satır numarası
 * olmadan iki dosya aynı adı alırdı.
 *
 * Uzantıyı BFF ekler (anahtardaki gerçek uzantıdan) — burada yazılırsa yanlış uzantı
 * üretme riski olur.
 */
function tasarimDosyaAdi(
  orderNumber: string,
  satirNo: number,
  item: { productSlug?: string; productName: string; quantity?: number },
  /** Tasarımcı dosyalarında tür eki: "onizleme" | "calisma" | "baski" (2026-09-02). Müşteri dosyası eksiz. */
  sonEk?: string,
): string {
  const urun = (item.productSlug ?? item.productName)
    .toLocaleLowerCase("tr")
    .replace(/ı/g, "i").replace(/ş/g, "s").replace(/ğ/g, "g")
    .replace(/ü/g, "u").replace(/ö/g, "o").replace(/ç/g, "c")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 40);
  const adet = item.quantity ? `__${item.quantity}ad` : "";
  const ek = sonEk ? `__${sonEk}` : "";
  return `${orderNumber}-${satirNo}__${urun}${adet}${ek}`;
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

export function OrderDetailClient({
  order,
  initialNotes = [],
}: {
  order: OrderDetailProps;
  /** İç notlar sunucuda çekilir (page.tsx) — ilk boyamada dolu gelsin. */
  initialNotes?: OrderNote[];
}) {
  const [currentStatus, setCurrentStatus] = useState(toSlug(order.status));
  const [statusError, setStatusError] = useState<string | null>(null);
  const [internalNote, setInternalNote] = useState("");
  // İç not defteri (2026-09-03). Sunucudan gelenle başlar, ekleme/silmede yerelde güncellenir
  // (router.refresh beklemeden) — not yazmak akıcı olmalı, sayfa yeniden yüklenmemeli.
  const [notes, setNotes] = useState<OrderNote[]>(initialNotes);
  const [notEkleniyor, setNotEkleniyor] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [refundMsg, setRefundMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [refunding, setRefunding] = useState(false);
  const [havaleOnayliyor, setHavaleOnayliyor] = useState(false);

  // Kargo takip bilgisi (2026-08-29). İki giriş noktası var:
  //  · "kargoya-verildi"ye geçerken açılan pencere → numara müşteriye giden maile girer
  //  · Kargo kartındaki "düzenle" → yalnız kolonu günceller, mail göndermez
  const [trackNo, setTrackNo] = useState(order.trackingNumber ?? "");
  const [trackCarrier, setTrackCarrier] = useState(order.trackingCarrier ?? VARSAYILAN_KARGO);
  const [shipModal, setShipModal] = useState(false);
  const [trackEditing, setTrackEditing] = useState(false);
  const [trackMsg, setTrackMsg] = useState<string | null>(null);

  // TUTAR GORUNURLUGU (2026-09-01, kargo rolu): bu sayfada hic izin kontrolu YOKTU,
  // tutarlar/odeme/fatura herkese aciktı. "orders.amounts" iznine baglandi -> tasarimci ve
  // muhasebe bu izne sahip oldugu icin BUGUNKU davranis aynen korunur, yalniz kargo gormez.
  // API de ayni izne gore alanlari yanittan siliyor (orders.service parasalAlanlariAyikla);
  // burasi ikincil savunma + NaN basmasini onleyen gorsel katman.
  const perms = useServerPerms();
  const showMoney = !perms || perms.includes("orders.amounts");
  // Tam durum makinesi (iptal + geri adim) yalnizca ORDERS_STATUS'u olanlarda. Kargo rolunde
  // yok: API zaten 403 doner ama butonu gostermek kullaniciyi hataya surukler.
  const canFullStatus = !perms || perms.includes("orders.status");
  // Satıra tasarım dosyası yükleme/silme (2026-09-02): tasarımcı + admin. Kargo/muhasebe
  // yalnız görür/indirir; API 403 döner ama butonu göstermek kullanıcıyı hataya sürükler.
  const canDesign = !perms || perms.includes("orders.design");
  // Yükleme/silme sonrası sayfa RSC'den yeniden çekilsin (api.orders.detail) — optimistik
  // liste tutmak yerine kaynağa dönüyoruz; dosya listesi küçük, gecikme fark edilmez.
  const router = useRouter();


  // İade edilebilir mi: ödemesi başarılı + online (cari değil). Zaten iade edilmişse buton yok.
  const payStatus = String(order.paymentStatus ?? "beklemede");
  // showMoney sarti: iade onay penceresi tutari METIN olarak yaziyor (onay penceresi),
  // yani buton gorunur kalirsa tutar gizlemenin etrafindan dolasilir. API zaten FINANCE
  // istiyor (403) ama sizinti butona basmadan ONCE oluyordu.
  const canRefund = showMoney && payStatus === "basarili" && order.paymentMethod !== "cari";
  const alreadyRefunded = payStatus === "iade-edildi" || payStatus === "iade_edildi";

  /**
   * Havale onayı — siparişi "ödendi" sayar ve üretim yolunu açar.
   * canFullStatus şartı: ödeme kararı kargo rolünün işi değil (API de 403 döner,
   * ama butonu hiç göstermemek kullanıcıyı hataya sürüklemez).
   * showMoney şartı: onay penceresi TUTARI yazıyor — tutar gizlemenin etrafından
   * dolaşılmasın (iade butonundaki aynı gerekçe).
   */
  // Kural ayrı dosyada ve test altında — burada satır arasında dururken İPTAL
  // kontrolü unutulmuştu ve iptal edilmiş havale siparişinde buton çıkıyordu.
  const havaleBekliyor = havaleOnayBekliyorMu(order);
  const canConfirmHavale = showMoney && canFullStatus && havaleBekliyor;

  const handleConfirmHavale = async () => {
    if (havaleOnayliyor) return;
    const ok = await confirm({
      title: "Havale ödemesi alındı olarak işaretlensin mi?",
      description:
        "Onaylamadan önce banka ekstresinde bu tutarın geldiğini ve açıklamada sipariş numarasının yazdığını doğrulayın.",
      bullets: [
        `Sipariş: ${order.orderNumber}`,
        `Beklenen tutar: ${tl(order.total)}`,
        "Sipariş ödendi sayılır ve üretim yolu açılır.",
      ],
      confirmLabel: "Ödemeyi onayla",
    });
    if (!ok) return;
    setRefundMsg(null);
    setHavaleOnayliyor(true);
    startTransition(async () => {
      const res = await confirmHavalePayment(order.id);
      setHavaleOnayliyor(false);
      setRefundMsg(res.ok ? { ok: true, text: res.message } : { ok: false, text: res.error });
    });
  };

  const handleRefund = async () => {
    if (refunding) return;
    // PARA HAREKETİ — geri alınamaz. Tutarı da göstererek onay iste.
    const ok = await confirm({
      title: "Ödeme müşteriye iade edilsin mi?",
      description: "Tutar iyzico üzerinden müşterinin kartına iade edilir.",
      bullets: [
        `Sipariş: ${order.orderNumber}`,
        `İade edilecek tutar: ${tl(order.total)}`,
        "Bu işlem GERİ ALINAMAZ.",
      ],
      confirmLabel: "İadeyi başlat",
      tone: "danger",
    });
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
        const iptalDe = await confirm({
          title: "İade tamamlandı. Sipariş de iptal edilsin mi?",
          bullets: [
            "Ödemesi alınmış sipariş → müşteriye iptal e-postası gider.",
            "Vazgeçerseniz sipariş mevcut durumunda kalır.",
          ],
          confirmLabel: "Siparişi iptal et",
          cancelLabel: "Durumu değiştirme",
          tone: "danger",
        });
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

  const handleStatusChange = async (statusId: string) => {
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
      // Ödemesi hiç alınmamış siparişin iptalinde API mail ATMAZ (2026-09-03, Hasan:
      // müşteri "yeni siparişim mi iptal oldu?" diye paniklüyor). Onay metni bunu yansıtır.
      const iptalMaili = iptalMailiGonderilirMi(order);
      const ok = await confirm({
        title: "Sipariş iptal edilecek",
        description: `${order.orderNumber} · ${mevcut} → İptal edildi`,
        bullets: [
          iptalMaili
            ? "Müşteriye iptal e-postası GİDECEK."
            : "Ödemesi alınmamış sipariş → müşteriye e-posta GÖNDERİLMEZ.",
          "Bu işlem GERİ ALINAMAZ, iptal edilen sipariş yeniden açılamaz.",
        ],
        confirmLabel: "Siparişi iptal et",
        tone: "danger",
      });
      if (!ok) return;
      // İade + iptal bağlama (2026-08-29, UX denetimi İş 5): ödemesi alınmış siparişte
      // iptal, iadeyi de sorar. "Evet" → önce iade, BAŞARILIYSA iptal (iade düşerse iptal
      // DURUR — parası iade edilmemiş "iptal edilmiş" sipariş oluşamaz). "Hayır" → bilinçli
      // ikinci onayla iadesiz iptal (istisna senaryolar: kısmi iade, havale ile manuel iade).
      if (canRefund) {
        const iadeDe = await confirm({
          title: "Ödeme de iade edilsin mi?",
          description: `Bu siparişin ödemesi alınmış (${tl(order.total)}).`,
          bullets: [
            "İade + iptal birlikte yapılır; iade başarısız olursa sipariş İPTAL EDİLMEZ.",
            "Vazgeçerseniz iade YAPILMADAN yalnız iptal edilir.",
          ],
          confirmLabel: "İade et ve iptal et",
          cancelLabel: "İadesiz iptal",
        });
        if (!iadeDe) {
          const eminMisin = await confirm({
            title: "İade yapılmadan iptal edilecek",
            description: "Müşterinin parası sizde kalır; iadeyi ayrıca yapmanız gerekir.",
            bullets: [`Tahsil edilmiş tutar: ${tl(order.total)}`],
            confirmLabel: "Yine de iadesiz iptal et",
            tone: "danger",
          });
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
      // ÖNİZLEME UYARISI (2026-09-02, Hasan kararı: "uyarı göster, engelleme"): Üretimde'ye
      // geçerken önizleme JPG'si olmayan kalem varsa onay metninin başına yazılır. Engel YOK —
      // müşteri dosyasıyla basılan işlerde önizleme şart değil; disiplin oturunca sıkılaştırılır.
      const onizlemesiz =
        statusId === "uretimde" && !geri
          ? order.items
              .filter((it) => !(it.designUploads ?? []).some((d) => d.kind === "onizleme"))
              .map((it) => it.productName)
          : [];
      const maddeler: string[] = [];
      if (onizlemesiz.length)
        maddeler.push(
          `⚠ Önizleme JPG yüklenmemiş kalem var: ${onizlemesiz.join(", ")} — üretimde ürünü tanımak için yüklemeniz önerilir.`,
        );
      maddeler.push(
        mailGidecek
          ? `Müşteriye "${hedef}" bildirimi E-POSTA ile GÖNDERİLECEK.`
          : geri
            ? "Bu bir geri alma. Müşteriye e-posta GÖNDERİLMEZ."
            : "Müşteriye e-posta gönderilmez.",
      );
      const ok = await confirm({
        title: `Sipariş durumu "${hedef}" olarak değişecek`,
        description: `${order.orderNumber} · ${mevcut} → ${hedef}`,
        bullets: maddeler,
        confirmLabel: mailGidecek ? "Değiştir ve bildir" : "Durumu değiştir",
      });
      if (!ok) return;
    }
    commitStatus(statusId);
  };

  /** İç not ekle. Sunucu yanıtı listeye eklenir; sayfa yeniden yüklenmez. */
  async function notEkle() {
    const metin = internalNote.trim();
    if (!metin || notEkleniyor) return;
    setNotEkleniyor(true);
    const res = await addOrderNote(order.id, metin);
    setNotEkleniyor(false);
    if (!res.ok) {
      toast.error(res.error);
      return;
    }
    setNotes((v) => [res.note, ...v]);
    setInternalNote("");
  }

  /**
   * Notu sil. Sunucu kuralı: kendi notunu herkes, başkasınınki yalnız admin/super_admin —
   * yetkisizse 403 döner ve liste değişmez.
   */
  async function notSil(n: OrderNote) {
    const ok = await confirm({
      title: "Not silinsin mi?",
      description: n.body.length > 140 ? `${n.body.slice(0, 140)}…` : n.body,
      bullets: [`${n.authorName} · ${formatDate(n.createdAt)}`],
      confirmLabel: "Notu sil",
      tone: "danger",
    });
    if (!ok) return;
    const res = await deleteOrderNote(order.id, n.id);
    if (!res.ok) {
      toast.error(res.error);
      return;
    }
    setNotes((v) => v.filter((x) => x.id !== n.id));
    toast.success("Not silindi.");
  }

  /** Kargo penceresinden onay: takip bilgisiyle birlikte "kargoya-verildi"ye geçir. */
  const confirmShipment = async () => {
    const no = trackNo.trim();
    const firma = trackCarrier.trim();
    if (!no) {
      // Takip numarası olmadan da kargolanabilir (elden teslim, kurye) — ama bilinçli olsun.
      const ok = await confirm({
        title: "Takip numarası girilmedi",
        description: "Kargoya verildi bildirimi yine de gönderilir.",
        bullets: [
          "Müşteriye giden e-postada takip numarası olmayacak.",
          "Müşteri kargo takip sayfasından sorgulayamayacak.",
        ],
        confirmLabel: "Takipsiz gönder",
      });
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
          {showMoney && (
            <button onClick={printInvoice} className="inline-flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium border border-paper-200 hover:bg-paper-100">
              <FileText size={14} /> Fatura Kes
            </button>
          )}
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
                    <div className="text-right" hidden={!showMoney}>
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
            <div className="mt-4 pt-4 border-t border-paper-200 space-y-1.5 text-sm" hidden={!showMoney}>
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

          {/* Tasarım Dosyaları — müşterinin yüklediği dosya + TASARIMCININ yüklediği dosyalar
              (2026-09-02, üretim ARGE Faz 2). Kart artık yükleme yetkisi olan herkese görünür:
              tasarımcı, müşteri hiçbir şey yüklememiş olsa da satıra dosya ekleyebilmeli. */}
          {(canDesign ||
            order.items.some(
              (it) =>
                /^https?:\/\//i.test(it.uploadedFileUrl ?? "") ||
                it.needsDesignSupport ||
                it.uploadedFileName ||
                (it.designUploads?.length ?? 0) > 0,
            )) && (
            <Card title="Tasarım Dosyaları">
              <div className="space-y-3">
                {order.items.map((item, i) => {
                  const dosyalar = item.designUploads ?? [];
                  // Set başına müşteri dosyaları satır olarak geliyorsa (2026-09-03) eski tek-dosya
                  // özeti tekrar basılmaz (ilk dosya zaten satırlarda).
                  const musteriSatirVar = dosyalar.some((d) => d.kind === "musteri");
                  const hasFile = !musteriSatirVar && /^https?:\/\//i.test(item.uploadedFileUrl ?? "");
                  if (!canDesign && !hasFile && !item.needsDesignSupport && !item.uploadedFileName && !dosyalar.length) return null;
                  const satirNo = i + 1;
                  return (
                    <div key={item.id ?? i} className="rounded-lg border border-paper-200 bg-paper-100/40 p-3">
                      {/* Müşterinin dosyası — bu satır DEĞİŞMEDİ */}
                      <div className="flex items-center justify-between gap-3">
                        <div className="min-w-0">
                          <div className="font-medium text-ink-900 text-sm truncate">
                            <span className="font-mono text-[11px] text-ink-400 mr-1.5">#{satirNo}</span>
                            {item.productName}
                          </div>
                          {hasFile ? (
                            <div className="mt-0.5 flex items-center gap-1 text-xs text-ink-500 break-all">
                              <FileText size={12} /> Müşteri dosyası: {item.uploadedFileName ?? "tasarim"}
                            </div>
                          ) : item.needsDesignSupport ? (
                            <div className="mt-0.5 text-xs text-brand-700">
                              Tasarım desteği istendi, grafik ekibi hazırlayacak
                            </div>
                          ) : musteriSatirVar ? (
                            // Dosya AŞAĞIDAKİ satırlarda listeleniyor (2026-09-03 set başına
                            // yükleme). Burada "yüklemedi" yazmak dosya dururken TERSİNİ
                            // söylüyordu — Hasan ekranda gördü (2026-09-04).
                            <div className="mt-0.5 text-xs text-ink-500">
                              Müşteri dosyası aşağıda
                            </div>
                          ) : (
                            <div className="mt-0.5 text-xs text-ink-500">
                              Müşteri dosya yüklemedi{item.uploadedFileName ? ` (${item.uploadedFileName})` : ""}
                            </div>
                          )}
                        </div>
                        {item.uploadedFileDriveUrl && (
                          <a
                            href={item.uploadedFileDriveUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            title="Müşteri dosyası Google Drive'da; yeni sekmede açılır"
                            className="flex-none inline-flex items-center gap-1.5 px-3 py-2 rounded-md text-sm font-medium border border-paper-200 hover:bg-paper-100"
                          >
                            <ArrowSquareOut size={14} /> Drive'da aç
                          </a>
                        )}
                        {hasFile && tasarimIndirmeYolu(item.uploadedFileUrl) && (
                          <a
                            href={tasarimIndirmeYolu(
                              item.uploadedFileUrl,
                              tasarimDosyaAdi(order.orderNumber, satirNo, item),
                            )}
                            target="_blank"
                            rel="noopener noreferrer"
                            download
                            className="flex-none inline-flex items-center gap-1.5 px-3 py-2 rounded-md text-sm font-medium bg-ink-900 text-paper-50 hover:bg-ink-700"
                          >
                            <DownloadSimple size={14} /> İndir
                          </a>
                        )}
                      </div>

                      {/* Tasarımcı dosyaları — önizleme küçük görselle (ASIL tanıma aracı), diğerleri satır */}
                      {dosyalar.length > 0 && (
                        <ul className="mt-3 space-y-1.5">
                          {dosyalar.map((d) => {
                            const key = tasarimAnahtari(d.fileUrl);
                            const onizleme = d.kind === "onizleme" && key && /\.(jpe?g|png)$/i.test(key);
                            return (
                              <li
                                key={d.id}
                                className="flex items-center gap-3 rounded-md border border-paper-200 bg-paper-50 px-2.5 py-2"
                              >
                                {onizleme ? (
                                  <a
                                    href={`/api/tasarim-onizleme/${key}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    title="Büyük görüntüle"
                                    className="flex-none"
                                  >
                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                    <img
                                      src={`/api/tasarim-onizleme/${key}`}
                                      alt={`${item.productName} önizleme`}
                                      className="h-16 w-24 object-contain rounded border border-paper-200 bg-paper-100"
                                    />
                                  </a>
                                ) : (
                                  <span className="flex-none grid place-items-center h-10 w-10 rounded bg-paper-100 text-ink-500">
                                    {d.kind === "onizleme" ? <ImageIcon size={18} /> : <FileText size={18} />}
                                  </span>
                                )}
                                <div className="min-w-0 flex-1">
                                  <div className="flex items-center gap-1.5 text-xs">
                                    <span className="px-1.5 py-0.5 rounded bg-ink-900/5 text-ink-700 font-medium">
                                      {KIND_ETIKET[d.kind] ?? d.kind}
                                      {d.kind === "musteri" && typeof d.designIndex === "number" && (item.quantity ?? 1) > 1 ? ` · Tasarım ${d.designIndex + 1}` : ""}
                                    </span>
                                    <span className="text-ink-900 truncate">{d.fileName}</span>
                                  </div>
                                  <div className="mt-0.5 text-[11px] text-ink-500">
                                    {boyut(d.fileSize)} · {d.uploadedBy?.fullName ?? "—"} · {formatDate(d.createdAt)}
                                  </div>
                                </div>
                                {d.driveUrl && (
                                  <a
                                    href={d.driveUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    title="Dosya Google Drive'da; yeni sekmede açılır"
                                    className="flex-none inline-flex items-center gap-1 px-2.5 py-1.5 rounded-md text-xs font-medium border border-paper-200 hover:bg-paper-100"
                                  >
                                    <ArrowSquareOut size={13} /> Drive'da aç
                                  </a>
                                )}
                                {tasarimIndirmeYolu(d.fileUrl) && (
                                  <a
                                    href={tasarimIndirmeYolu(
                                      d.fileUrl,
                                      tasarimDosyaAdi(order.orderNumber, satirNo, item, d.kind),
                                    )}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    download
                                    className="flex-none inline-flex items-center gap-1 px-2.5 py-1.5 rounded-md text-xs font-medium border border-paper-200 hover:bg-paper-100"
                                  >
                                    <DownloadSimple size={13} /> İndir
                                  </a>
                                )}
                                {canDesign && (
                                  <button
                                    type="button"
                                    disabled={isPending}
                                    onClick={async () => {
                                      const ok = await confirm({
                                        title: "Tasarım dosyası silinecek",
                                        description: d.fileName,
                                        bullets: [
                                          "Kayıt ve dosyanın kendisi kaldırılır.",
                                          "İşlem denetim kaydına yazılır.",
                                        ],
                                        confirmLabel: "Dosyayı sil",
                                        tone: "danger",
                                      });
                                      if (!ok) return;
                                      startTransition(async () => {
                                        const r = await deleteOrderDesign(order.id, d.id);
                                        if (!r.ok) {
                                          toast.error(`Silinemedi: ${r.error}`);
                                          return;
                                        }
                                        toast.success("Tasarım dosyası silindi.");
                                        router.refresh();
                                      });
                                    }}
                                    className="flex-none p-1.5 rounded-md text-error hover:bg-error/10 disabled:opacity-50"
                                    aria-label={`${d.fileName} dosyasını sil`}
                                    title="Sil"
                                  >
                                    <Trash size={14} />
                                  </button>
                                )}
                              </li>
                            );
                          })}
                        </ul>
                      )}

                      {/* Yükleyici — yalnız orders.design (tasarımcı/admin). item.id API'den gelir. */}
                      {canDesign && item.id && (
                        <DesignFileUploader orderId={order.id} itemId={item.id} onDone={() => router.refresh()} />
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
            {/* Kargo rolu (canFullStatus=false) yalnizca "Kargoda"yi gorur; diger gecisler
                API'de de 403 doner, butonu gostermek kullaniciyi hataya surukler. Mevcut
                durum bilgi amacli gorunur kalir ama tiklanamaz. */}
            <div className="flex flex-wrap gap-2 mb-4">
              {STATUSES.filter((s) => canFullStatus || KARGO_GECISLERI.includes(s.id) || s.id === currentStatus).map((s) => (
                <button
                  key={s.id}
                  onClick={() => void handleStatusChange(s.id)}
                  disabled={isPending || isCancelled || (!canFullStatus && !KARGO_GECISLERI.includes(s.id))}
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

            {!isCancelled && canFullStatus && (
              <div className="mb-4">
                <button
                  onClick={() => void handleStatusChange("iptal-edildi")}
                  disabled={isPending}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border border-error/30 text-error hover:bg-error/10 disabled:opacity-60"
                >
                  <XCircle size={14} /> Siparişi İptal Et
                </button>
              </div>
            )}

            {/* HAVALE ONAYI — para GELDİ işareti. Havale siparişinde ödeme otomatik
                doğrulanamaz; ekstreyi gören kişi burada onaylar. */}
            {havaleBekliyor && (
              <div className="mb-4 rounded-md border border-brand-500/30 bg-brand-50/50 px-3 py-2.5">
                <p className="text-xs font-semibold text-ink-900">Havale/EFT bekleniyor</p>
                <p className="mt-0.5 text-[11px] text-ink-600">
                  Müşteri havale yapacak. Ekstrede{" "}
                  <strong className="font-mono">{order.orderNumber}</strong> açıklamalı tutarı
                  gördüğünüzde onaylayın.
                </p>
                {canConfirmHavale ? (
                  <button
                    onClick={() => void handleConfirmHavale()}
                    disabled={havaleOnayliyor || isPending}
                    className="mt-2 inline-flex items-center gap-1.5 rounded-full border border-success/40 px-3 py-1.5 text-xs font-medium text-success hover:bg-success/10 disabled:opacity-60"
                  >
                    {havaleOnayliyor ? "Onaylanıyor…" : "Ödeme geldi, onayla"}
                  </button>
                ) : (
                  <p className="mt-1.5 text-[11px] text-ink-500">
                    Onaylama yetkiniz yok.
                  </p>
                )}
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
                  onClick={() => void handleRefund()}
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

          <Card title="İç Not (müşteri görmez)">
            <textarea
              value={internalNote}
              onChange={(e) => setInternalNote(e.target.value)}
              rows={3}
              maxLength={2000}
              disabled={notEkleniyor}
              placeholder="Ekibin görmesi gereken bir şey mi var? (ör. müşteri aradı, kutu ezik geldi, dekont bekleniyor)"
              className="w-full px-3 py-2 rounded-md border border-paper-200 bg-paper-50 text-sm text-ink-900 placeholder:text-ink-400 focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500 disabled:opacity-60"
              // Ctrl/Cmd+Enter ile gönder — not yazmak sık yapılan iş, fareye uzanmasın.
              onKeyDown={(e) => {
                if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
                  e.preventDefault();
                  void notEkle();
                }
              }}
            />
            <div className="mt-2 flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => void notEkle()}
                disabled={notEkleniyor || internalNote.trim().length === 0}
                className="inline-flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-medium bg-ink-900 text-paper-50 hover:bg-ink-800 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <NotePencil size={13} weight="bold" />
                {notEkleniyor ? "Ekleniyor…" : "Not Ekle"}
              </button>
              <span className="text-[11px] text-ink-400 tabular-nums">
                {internalNote.length}/2000
              </span>
            </div>

            {notes.length === 0 ? (
              <p className="mt-4 text-sm text-ink-500">
                Henüz not yok. Buraya yazdıkların yalnız panelde görünür.
              </p>
            ) : (
              <ul className="mt-4 space-y-3">
                {notes.map((n) => (
                  <li
                    key={n.id}
                    className="rounded-lg border border-paper-200 bg-paper-100/50 px-3 py-2.5"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="text-xs text-ink-500">
                        <span className="font-medium text-ink-700">{n.authorName}</span>
                        {n.authorRole && <span className="text-ink-400"> · {n.authorRole}</span>}
                        <span className="text-ink-400"> · {formatDate(n.createdAt)}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => void notSil(n)}
                        className="flex-none p-1 -mr-1 rounded text-ink-400 hover:text-error hover:bg-error/10"
                        aria-label="Notu sil"
                        title="Notu sil"
                      >
                        <TrashSimple size={13} />
                      </button>
                    </div>
                    {/* whitespace-pre-wrap: personelin yazdığı satır sonları korunsun. */}
                    <p className="mt-1.5 text-sm text-ink-800 whitespace-pre-wrap break-words">
                      {n.body}
                    </p>
                  </li>
                ))}
              </ul>
            )}
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
          {/* Kargo rolu icin ek dal: tutar goremeyen (yani kargo) kullanici siparis daha
              "uretimde" iken de takip no girebilmeli — eskiden kart yalnizca numara VARSA
              ya da durum kargoda/teslim ise cikiyordu, dolayisiyla numarayi girmenin tek
              yolu durumu degistirmekti (bu da musteriye mail atiyor). */}
          {(trackNo || !showMoney || currentStatus === "kargoya-verildi" || currentStatus === "teslim-edildi") && (
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

          {/* Ödeme kartının TAMAMI izne bağlı: tutarın yanında ödeme DURUMU da
              gizlenmeli ("Ödeme Bekliyor" rozeti de yasak kapsamında). */}
          {showMoney && (
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
              {/* Arıza nedeni (2026-09-03, Hasan: "hata mesajını panele anlamlı yazabilir miyiz").
                  iyzico'nun genel mesajı — kart/PII içermez, doğrudan gösterilebilir. */}
              {String(order.paymentStatus ?? "") === "basarisiz" && order.paymentErrorMessage && (
                <p className="mt-2 flex items-start gap-1.5 text-xs text-error leading-snug">
                  <WarningCircle size={14} weight="fill" className="mt-0.5 flex-none" />
                  <span>
                    {order.paymentErrorMessage}
                    {order.paymentErrorCode ? ` (kod ${order.paymentErrorCode})` : ""}
                  </span>
                </p>
              )}
              <div className="mt-2 text-sm font-semibold text-ink-900 tabular-nums">
                ₺ {Number(order.total).toLocaleString("tr-TR")}
              </div>
            </Card>
          )}
        </div>
      </div>

      {/* Kargoya verme penceresi (2026-08-29). Düz onay yerine bu pencere çıkar
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
                onKeyDown={(e) => e.key === "Enter" && void confirmShipment()}
                placeholder="DHL eCommerce takip no"
                maxLength={128}
                className="mt-1 w-full border border-paper-200 rounded px-2.5 py-2 text-sm font-mono"
              />
            </label>

            <div className="mt-5 flex gap-2">
              <button
                onClick={() => void confirmShipment()}
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
