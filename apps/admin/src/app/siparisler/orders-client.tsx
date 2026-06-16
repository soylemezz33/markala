"use client";

import { useState } from "react";
import Link from "next/link";
import { AdminShell } from "@/components/admin-shell";
import { MagnifyingGlass, Eye, Download, Package } from "@phosphor-icons/react";

export interface OrderRow {
  id: string;
  orderNumber: string;
  email?: string | null;
  customerName?: string | null;
  createdAt: string;
  total: unknown; // Decimal string from API
  status: string;
  items: unknown[];
}

interface Props {
  orders: OrderRow[];
}

export const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  "siparis-alindi":      { label: "Sipariş Alındı",     color: "bg-[#1565C0]/10 text-[#1565C0]" },
  "tasarim-bekleniyor":  { label: "Tasarım Bekleniyor", color: "bg-warning/10 text-warning" },
  "tasarim-onayindi":    { label: "Tasarım Onayında",   color: "bg-[#6A1B9A]/10 text-[#6A1B9A]" },
  "uretimde":            { label: "Üretimde",            color: "bg-warning/10 text-warning" },
  "kargoya-verildi":     { label: "Kargoda",             color: "bg-success/10 text-success" },
  "teslim-edildi":       { label: "Teslim Edildi",       color: "bg-paper-200 text-ink-700" },
  "iptal-edildi":        { label: "İptal",               color: "bg-error/10 text-error" },
};

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString("tr-TR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  } catch {
    return iso;
  }
}

export function OrdersClient({ orders }: Props) {
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [search, setSearch] = useState("");

  const filtered = orders.filter((o) => {
    const customer = o.customerName ?? o.email ?? "";
    const matchSearch =
      !search ||
      o.orderNumber.toLowerCase().includes(search.toLowerCase()) ||
      customer.toLowerCase().includes(search.toLowerCase()) ||
      (o.email ?? "").toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === "all" || o.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const totalAmount = filtered.reduce((acc, o) => acc + Number(o.total), 0);

  return (
    <AdminShell>
      <header className="mb-6 flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl md:text-3xl font-semibold text-ink-900">Siparişler</h1>
          <p className="text-ink-500 text-sm mt-1">
            {filtered.length} sipariş · Toplam{" "}
            <strong className="text-ink-900">₺ {totalAmount.toLocaleString("tr-TR")}</strong>
          </p>
        </div>
        <button className="inline-flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium border border-paper-200 hover:bg-paper-100">
          <Download size={14} weight="bold" /> CSV İndir
        </button>
      </header>

      <div className="mb-4 flex flex-col md:flex-row gap-3">
        <div className="flex-1 flex items-center gap-2 px-3 py-2 bg-paper-50 border border-paper-200 rounded-lg">
          <MagnifyingGlass size={16} className="text-ink-500" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            type="search"
            placeholder="Sipariş no, müşteri, e-posta ara..."
            className="flex-1 bg-transparent outline-none text-sm text-ink-900"
          />
        </div>
      </div>

      <div className="mb-4 flex flex-wrap gap-2">
        <StatusChip active={statusFilter === "all"} onClick={() => setStatusFilter("all")}>
          Tümü ({orders.length})
        </StatusChip>
        {Object.entries(STATUS_LABELS).map(([k, v]) => {
          const count = orders.filter((o) => o.status === k).length;
          if (count === 0) return null;
          return (
            <StatusChip key={k} active={statusFilter === k} onClick={() => setStatusFilter(k)}>
              {v.label} ({count})
            </StatusChip>
          );
        })}
      </div>

      <div className="bg-paper-50 border border-paper-200 rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-paper-100/60 text-ink-500 text-xs uppercase tracking-wide">
              <tr>
                <th className="text-left px-4 py-3 font-semibold">Sipariş</th>
                <th className="text-left px-4 py-3 font-semibold">Müşteri</th>
                <th className="text-left px-4 py-3 font-semibold hidden md:table-cell">Tarih</th>
                <th className="text-right px-4 py-3 font-semibold">Tutar</th>
                <th className="text-center px-4 py-3 font-semibold">Durum</th>
                <th className="text-right px-4 py-3 font-semibold">İşlem</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-paper-200">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center text-ink-500">
                    <Package size={32} className="mx-auto mb-3 text-ink-300" />
                    <p className="text-sm font-medium">Henüz sipariş bulunmuyor</p>
                    <p className="text-xs mt-1 text-ink-400">
                      {search || statusFilter !== "all"
                        ? "Arama / filtre kriterlerine uyan sipariş yok."
                        : "Web sitesinden ilk sipariş geldiğinde burada görünür."}
                    </p>
                  </td>
                </tr>
              ) : (
                filtered.map((o) => {
                  const s = STATUS_LABELS[o.status] ?? { label: o.status, color: "bg-paper-200 text-ink-700" };
                  const customer = o.customerName ?? o.email ?? "—";
                  return (
                    <tr key={o.id} className="hover:bg-paper-100/40">
                      <td className="px-4 py-3 font-mono text-xs font-semibold text-ink-900">
                        {o.orderNumber}
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-medium text-ink-900">{customer}</div>
                        {o.customerName && o.email && (
                          <div className="text-[11px] text-ink-500">{o.email}</div>
                        )}
                      </td>
                      <td className="px-4 py-3 text-ink-700 text-xs hidden md:table-cell">
                        {formatDate(o.createdAt)}
                      </td>
                      <td className="px-4 py-3 text-right font-semibold text-ink-900 tabular-nums">
                        ₺ {Number(o.total).toLocaleString("tr-TR")}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span
                          className={`inline-block px-2 py-0.5 rounded-full text-[11px] font-semibold ${s.color}`}
                        >
                          {s.label}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Link
                          href={`/siparisler/${o.id}`}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded text-xs font-medium border border-paper-200 hover:bg-paper-100"
                        >
                          <Eye size={12} /> Detay
                        </Link>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </AdminShell>
  );
}

function StatusChip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
        active
          ? "bg-ink-900 text-paper-50 border-ink-900"
          : "bg-paper-50 border-paper-200 text-ink-700 hover:border-ink-400"
      }`}
    >
      {children}
    </button>
  );
}
