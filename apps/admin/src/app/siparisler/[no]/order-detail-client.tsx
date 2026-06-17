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
  ChatCircle,
} from "@phosphor-icons/react";
import { updateOrderStatus } from "./actions";
import { STATUS_LABELS } from "../orders-client";

const STATUSES = [
  { id: "siparis-alindi",     label: "Sipariş Alındı" },
  { id: "tasarim-bekleniyor", label: "Tasarım Bekleniyor" },
  { id: "tasarim-onayindi",   label: "Tasarım Onayında" },
  { id: "uretimde",           label: "Üretimde" },
  { id: "kargoya-verildi",    label: "Kargoda" },
  { id: "teslim-edildi",      label: "Teslim Edildi" },
];

export interface OrderDetailProps {
  id: string;
  orderNumber: string;
  email?: string | null;
  customerName?: string | null;
  createdAt: string;
  status: string;
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
    configurationSummary?: string;
    quantity?: number;
    unitPrice?: unknown;
    lineTotal?: unknown;
  }>;
  shippingAddress?: {
    fullName?: string;
    fullAddress?: string;
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
  const [currentStatus, setCurrentStatus] = useState(order.status);
  const [statusError, setStatusError] = useState<string | null>(null);
  const [internalNote, setInternalNote] = useState("");
  const [isPending, startTransition] = useTransition();

  const handleStatusChange = (statusId: string) => {
    if (statusId === currentStatus || isPending) return;
    const prev = currentStatus;
    setStatusError(null);
    setCurrentStatus(statusId); // optimistik
    startTransition(async () => {
      const res = await updateOrderStatus(order.id, statusId);
      if (!res.ok) {
        setCurrentStatus(prev); // başarısız → geri al
        setStatusError(res.error);
      }
    });
  };

  const customer = order.customerName ?? order.email ?? "—";
  const currentStatusIndex = STATUSES.findIndex((s) => s.id === currentStatus);

  const a = order.shippingAddress;

  // Sevkiyat/paketleme etiketi
  const printLabel = () =>
    openPrint(`Etiket ${order.orderNumber}`, `
      <div class="brand">Markala</div><div class="muted">324 Ajans · Sevkiyat Etiketi</div>
      <div class="box"><div class="muted">Sipariş No</div><div class="big">${esc(order.orderNumber)}</div></div>
      <div class="box"><div class="muted">Alıcı</div>
        <div style="font-size:15px;font-weight:700">${esc(a?.fullName ?? customer)}</div>
        <div>${esc(a?.fullAddress ?? "")}</div>
        <div>${esc(a?.city ?? "")} ${esc(a?.zipCode ?? "")}</div>
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
        <div>${esc(order.email ?? "")}</div><div>${esc(a?.fullAddress ?? "")} ${esc(a?.city ?? "")}</div></div>
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
      <div class="row"><div class="brand">Markala</div><div class="muted">${esc(order.trackingCarrier ?? "Kargo")}</div></div>
      <div class="box"><div class="muted">Takip No</div><div class="big">${esc(order.trackingNumber ?? "—")}</div></div>
      <div class="row" style="gap:12px">
        <div class="box" style="flex:1"><div class="muted">Gönderen</div><div style="font-weight:700">Markala · 324 Ajans</div><div>Yenişehir / Mersin</div><div>0324 433 33 51</div></div>
        <div class="box" style="flex:1"><div class="muted">Alıcı</div><div style="font-weight:700">${esc(a?.fullName ?? customer)}</div>
          <div>${esc(a?.fullAddress ?? "")}</div><div>${esc(a?.city ?? "")} ${esc(a?.zipCode ?? "")}</div><div>${esc(a?.phone ?? "")}</div></div></div>
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
                    <div className="flex-none w-16 h-16 rounded bg-paper-200 grid place-items-center">
                      <Package size={20} className="text-ink-500" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-ink-900 truncate">{item.productName}</div>
                      {item.configurationSummary && (
                        <div className="text-xs text-ink-500 mt-0.5">{item.configurationSummary}</div>
                      )}
                      {item.quantity != null && (
                        <div className="text-[11px] text-ink-500 mt-1">Adet: {item.quantity}</div>
                      )}
                    </div>
                    <div className="text-right">
                      <div className="font-semibold text-ink-900 tabular-nums">
                        ₺ {Number(item.lineTotal ?? item.unitPrice ?? 0).toLocaleString("tr-TR")}
                      </div>
                      {item.quantity != null && item.unitPrice != null && (
                        <div className="text-[11px] text-ink-500">
                          {item.quantity} × ₺ {Number(item.unitPrice).toLocaleString("tr-TR")}
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

          <Card title="Sipariş Durumu">
            <div className="flex flex-wrap gap-2 mb-4">
              {STATUSES.map((s) => (
                <button
                  key={s.id}
                  onClick={() => handleStatusChange(s.id)}
                  disabled={isPending}
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
              placeholder="Üretim ekibine not, tasarım uyarısı, müşteriye iletilmeyecek bilgi..."
              className="w-full px-3 py-2 rounded-md border border-paper-200 bg-paper-50 text-sm"
            />
            <button className="mt-3 inline-flex items-center gap-2 px-3 py-1.5 rounded text-xs font-medium bg-ink-900 text-paper-50 hover:bg-ink-700">
              <ChatCircle size={12} /> Not Ekle
            </button>
          </Card>
        </div>

        {/* Sağ: müşteri + adres + ödeme */}
        <div className="space-y-5">
          <Card title="Müşteri">
            <div className="font-semibold text-ink-900">{customer}</div>
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
                  {order.shippingAddress.city && (
                    <>
                      <br />
                      {order.shippingAddress.city}
                      {order.shippingAddress.zipCode && ` · ${order.shippingAddress.zipCode}`}
                    </>
                  )}
                </span>
              </div>
            </Card>
          )}

          {order.trackingNumber && (
            <Card title="Kargo">
              <div className="flex items-center gap-2 mb-2">
                <Truck size={16} className="text-brand-700" />
                <span className="font-semibold text-ink-900 text-sm">
                  {order.trackingCarrier ?? "Kargo"}
                </span>
              </div>
              <div className="text-xs text-ink-500">
                Takip No:{" "}
                <span className="font-mono text-ink-900">{order.trackingNumber}</span>
              </div>
              <button onClick={printCargo} className="mt-3 w-full text-center py-2 rounded text-xs font-medium border border-paper-200 hover:bg-paper-100">
                Kargo Etiketi Yazdır
              </button>
            </Card>
          )}

          <Card title="Ödeme">
            <div className="mt-1 text-xs">
              <span
                className={`inline-block px-2 py-0.5 rounded-full font-semibold ${
                  STATUS_LABELS[currentStatus]?.color ?? "bg-paper-200 text-ink-700"
                }`}
              >
                {STATUS_LABELS[currentStatus]?.label ?? currentStatus}
              </span>
            </div>
            <div className="mt-2 text-sm font-semibold text-ink-900 tabular-nums">
              ₺ {Number(order.total).toLocaleString("tr-TR")}
            </div>
          </Card>
        </div>
      </div>
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
