"use client";

import { useState } from "react";
import { useServerPerms } from "@/components/perms-provider";
import Link from "next/link";
import { CurrencyCircleDollar, Phone, X, WhatsappLogo, EnvelopeSimple } from "@phosphor-icons/react";

/**
 * Ana sayfa "Son Siparişler" tablosu.
 *
 * 2026-08-18: Eskiden bu tabloda YALNIZ sipariş durumu vardı — ödemesi tamamlanmamış bir
 * sipariş, ödenmiş siparişle birebir aynı görünüyordu ("Sipariş Alındı"). Ödeme sağlayıcısına
 * yönlendirmeden ÖNCE sipariş kaydı açmak zorunlu (iyzico'ya referans numarası gerekiyor),
 * bu yüzden yarıda bırakılan her ödeme burada bir satır bırakıyor. Riskli sonuç: ödenmemiş
 * sipariş üretime alınabilir. Artık ödeme durumu AÇIKÇA gösteriliyor ve ödenmemiş siparişler
 * için "İletişime Geç" ile müşteri bilgileri tek tıkla açılıyor (terk edilmiş sepet takibi).
 */

interface OrderRow {
  id?: string;
  orderNumber?: string;
  status?: string;
  paymentStatus?: string | null;
  paymentMethod?: string | null;
  customerName?: string | null;
  email?: string | null;
  phone?: string | null;
  total?: unknown;
  user?: { fullName?: string | null; email?: string | null } | null;
}

function statusBadge(status: string): { label: string; className: string } {
  switch (status) {
    case "siparis_alindi":
    case "siparis-alindi":
      return { label: "Sipariş Alındı", className: "bg-paper-200 text-ink-700" };
    case "tasarim_bekleniyor":
    case "tasarim-bekleniyor":
      return { label: "Tasarım Bekliyor", className: "bg-[#1565C0]/10 text-[#1565C0]" };
    case "tasarim_onayindi":
    case "tasarim-onayindi":
      return { label: "Tasarım Onaylandı", className: "bg-[#1565C0]/10 text-[#1565C0]" };
    case "uretimde":
      return { label: "Üretimde", className: "bg-warning/10 text-warning" };
    case "kargoya_verildi":
    case "kargoya-verildi":
      return { label: "Kargoya Verildi", className: "bg-success/10 text-success" };
    case "teslim_edildi":
    case "teslim-edildi":
      return { label: "Teslim Edildi", className: "bg-success/10 text-success" };
    case "iptal_edildi":
    case "iptal-edildi":
      return { label: "İptal Edildi", className: "bg-error/10 text-error" };
    default:
      return { label: status || "—", className: "bg-paper-200 text-ink-700" };
  }
}

/** Ödemesi tamamlanmamış mı? Cari (açık hesap) siparişte online ödeme beklenmez. */
function isUnpaid(o: OrderRow): boolean {
  if (o.paymentMethod === "cari") return false;
  const st = String(o.status ?? "").replace(/_/g, "-");
  if (st === "iptal-edildi") return false;
  return String(o.paymentStatus ?? "beklemede") !== "basarili";
}

function toAmount(total: unknown): string {
  const v = typeof total === "object" && total !== null ? Number(String(total)) : Number(total ?? 0);
  return `₺ ${v.toLocaleString("tr-TR", { minimumFractionDigits: 2 })}`;
}

/** Telefonu wa.me formatına çevirir (rakam dışını atar, 0 ile başlıyorsa 90 ekler). */
function waNumber(phone: string): string {
  const d = phone.replace(/\D/g, "");
  if (d.startsWith("90")) return d;
  if (d.startsWith("0")) return `90${d.slice(1)}`;
  if (d.length === 10) return `90${d}`;
  return d;
}

export function RecentOrdersTable({ orders }: { orders: OrderRow[] }) {
  // 2026-08-21 (Hasan bildirdi): finans izni olmayan rolde tutar/odeme alanlari API'den
  // GELMIYOR; arayuz bunu "yok" degil "beklemede" sanip ODENMIS siparislere
  // "Odeme Bekliyor" yaziyordu ve tutar "0,00"/NaN cikiyordu. Yanlis bilgi, eksik
  // bilgiden kotudur -> sutunlari komple gostermiyoruz.
  const perms = useServerPerms();
  const showMoney = !perms || perms.includes("finance.manage");

  const [contact, setContact] = useState<OrderRow | null>(null);

  if (orders.length === 0) {
    return <p className="px-5 py-6 text-sm text-ink-400">Henüz sipariş yok.</p>;
  }

  return (
    <>
      <table className="w-full text-sm">
        <thead className="bg-paper-100/60 text-ink-500 text-xs uppercase tracking-wide">
          <tr>
            <th className="text-left px-5 py-3 font-semibold">Sipariş No</th>
            <th className="text-left px-5 py-3 font-semibold">Müşteri</th>
            {showMoney && <th className="text-right px-5 py-3 font-semibold">Tutar</th>}
            {showMoney && <th className="text-right px-5 py-3 font-semibold">Ödeme</th>}
            <th className="text-right px-5 py-3 font-semibold">Durum</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-paper-200">
          {orders.map((o) => {
            const unpaid = isUnpaid(o);
            const badge = statusBadge(String(o.status ?? ""));
            const customerName = o.customerName ?? o.user?.fullName ?? o.email ?? "—";
            return (
              <tr key={o.id} className={`hover:bg-paper-100/40 ${unpaid ? "bg-warning/[0.04]" : ""}`}>
                <td className="px-5 py-3 font-mono text-xs font-semibold text-ink-900">
                  {o.orderNumber ?? o.id?.slice(0, 8)}
                </td>
                <td className="px-5 py-3 text-ink-700">{customerName}</td>
                {showMoney && (
                  <td className="px-5 py-3 text-right font-semibold text-ink-900 tabular-nums">
                    {toAmount(o.total)}
                  </td>
                )}
                {showMoney && (
                <td className="px-5 py-3 text-right whitespace-nowrap">
                  {o.paymentMethod === "cari" ? (
                    <span className="inline-block px-2 py-0.5 rounded-full text-[11px] font-semibold bg-brand-100 text-brand-800">
                      Açık Hesap
                    </span>
                  ) : unpaid ? (
                    <div className="inline-flex flex-col items-end gap-1">
                      <span className="inline-block px-2 py-0.5 rounded-full text-[11px] font-semibold bg-warning/15 text-warning">
                        Ödeme Bekliyor
                      </span>
                      <button
                        type="button"
                        onClick={() => setContact(o)}
                        className="inline-flex items-center gap-1 text-[11px] font-semibold text-brand-700 hover:underline"
                      >
                        <Phone size={11} weight="fill" /> İletişime Geç
                      </button>
                    </div>
                  ) : (
                    <span className="inline-block px-2 py-0.5 rounded-full text-[11px] font-semibold bg-success/10 text-success">
                      Ödendi
                    </span>
                  )}
                </td>
                )}
                <td className="px-5 py-3 text-right">
                  <span
                    className={`inline-block px-2 py-0.5 rounded-full text-[11px] font-semibold ${
                      // Ödenmemişse sipariş durumunu VURGULAMA — "Sipariş Alındı" yeşil/normal
                      // görünüp tamamlanmış sipariş izlenimi vermesin.
                      unpaid ? "bg-paper-200/70 text-ink-500" : badge.className
                    }`}
                  >
                    {badge.label}
                  </span>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

      {contact && (
        <div
          className="fixed inset-0 z-50 grid place-items-center bg-ink-900/40 p-4"
          role="dialog"
          aria-modal="true"
          aria-label="Müşteri iletişim bilgileri"
          onClick={() => setContact(null)}
        >
          <div
            className="w-full max-w-sm rounded-xl bg-paper-50 shadow-2xl border border-paper-200"
            onClick={(e) => e.stopPropagation()}
          >
            <header className="flex items-start justify-between gap-3 px-5 py-4 border-b border-paper-200">
              <div className="min-w-0">
                <h3 className="font-semibold text-ink-900">Ödeme tamamlanmadı</h3>
                <p className="mt-0.5 text-xs text-ink-500 font-mono">{contact.orderNumber}</p>
              </div>
              <button
                type="button"
                onClick={() => setContact(null)}
                aria-label="Kapat"
                className="p-1 -m-1 rounded text-ink-500 hover:text-ink-900 hover:bg-paper-100"
              >
                <X size={18} />
              </button>
            </header>

            <div className="px-5 py-4 space-y-3 text-sm">
              <div>
                <div className="text-xs text-ink-500">Müşteri</div>
                <div className="font-medium text-ink-900">
                  {contact.customerName ?? contact.user?.fullName ?? "—"}
                </div>
              </div>
              <div>
                <div className="text-xs text-ink-500">Tutar</div>
                <div className="font-semibold text-ink-900 tabular-nums">{toAmount(contact.total)}</div>
              </div>

              {contact.phone && (
                <div className="flex flex-wrap items-center gap-2 pt-1">
                  <a
                    href={`tel:${contact.phone}`}
                    className="inline-flex items-center gap-1.5 px-3 py-2 rounded-md border border-paper-200 bg-paper-50 text-ink-900 hover:bg-paper-100 text-sm font-medium"
                  >
                    <Phone size={15} weight="fill" /> {contact.phone}
                  </a>
                  <a
                    href={`https://wa.me/${waNumber(contact.phone)}?text=${encodeURIComponent(
                      `Merhaba, Markala'dan arıyoruz. ${contact.orderNumber ?? ""} numaralı siparişinizin ödemesi tamamlanmamış görünüyor — yardımcı olabilir miyiz?`,
                    )}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-2 rounded-md bg-[#1FB358] text-white hover:opacity-90 text-sm font-medium"
                  >
                    <WhatsappLogo size={15} weight="fill" /> WhatsApp
                  </a>
                </div>
              )}

              {contact.email && (
                <a
                  href={`mailto:${contact.email}`}
                  className="inline-flex items-center gap-1.5 text-brand-700 hover:underline text-sm break-all"
                >
                  <EnvelopeSimple size={15} weight="fill" className="flex-none" /> {contact.email}
                </a>
              )}

              {!contact.phone && !contact.email && (
                <p className="text-sm text-ink-500">Bu siparişte iletişim bilgisi kayıtlı değil.</p>
              )}
            </div>

            <footer className="px-5 py-3 border-t border-paper-200 flex items-center justify-between gap-3">
              <Link
                href={`/siparisler/${contact.id}`}
                className="text-sm font-medium text-brand-700 hover:underline inline-flex items-center gap-1"
              >
                <CurrencyCircleDollar size={15} weight="fill" /> Sipariş detayı
              </Link>
              <button
                type="button"
                onClick={() => setContact(null)}
                className="px-3 py-1.5 rounded-md border border-paper-200 text-sm text-ink-700 hover:bg-paper-100"
              >
                Kapat
              </button>
            </footer>
          </div>
        </div>
      )}
    </>
  );
}
