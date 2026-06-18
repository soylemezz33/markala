"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AdminShell } from "@/components/admin-shell";
import { MagnifyingGlass, Eye, Download, Package } from "@phosphor-icons/react";
import { Pagination, paginate } from "@/components/pagination";

export interface OrderRow {
  id: string;
  orderNumber: string;
  email?: string | null;
  customerName?: string | null;
  createdAt: string;
  total: unknown; // Decimal string from API
  status: string;
  paymentStatus?: string | null;
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

/** Prisma enum (underscore: kargoya_verildi) → STATUS_LABELS anahtarı (hyphen: kargoya-verildi). */
const toSlug = (s: string) => String(s ?? "").replace(/_/g, "-");

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

type SortKey = "date-desc" | "date-asc" | "amount-desc" | "amount-asc" | "order-asc" | "status";
const SORT_OPTIONS: Array<{ value: SortKey; label: string }> = [
  { value: "date-desc", label: "Tarih (yeni → eski)" },
  { value: "date-asc", label: "Tarih (eski → yeni)" },
  { value: "amount-desc", label: "Tutar (yüksek → düşük)" },
  { value: "amount-asc", label: "Tutar (düşük → yüksek)" },
  { value: "order-asc", label: "Sipariş No (A → Z)" },
  { value: "status", label: "Duruma göre" },
];

type DateRange = "all" | "today" | "7d" | "30d" | "month" | "custom";
const DATE_OPTIONS: Array<{ value: DateRange; label: string }> = [
  { value: "all", label: "Tüm zamanlar" },
  { value: "today", label: "Bugün" },
  { value: "7d", label: "Son 7 gün" },
  { value: "30d", label: "Son 30 gün" },
  { value: "month", label: "Bu ay" },
  { value: "custom", label: "Özel aralık" },
];

const PAGE_SIZE = 20;

export function OrdersClient({ orders }: Props) {
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState<SortKey>("date-desc");
  const [dateRange, setDateRange] = useState<DateRange>("all");
  const [customFrom, setCustomFrom] = useState("");
  const [customTo, setCustomTo] = useState("");
  const [page, setPage] = useState(1);

  const now = new Date();
  const inRange = (iso: string): boolean => {
    if (dateRange === "all") return true;
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return true;
    if (dateRange === "today") return d.toDateString() === now.toDateString();
    if (dateRange === "month") return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
    if (dateRange === "custom") {
      const t = d.getTime();
      if (customFrom && t < new Date(`${customFrom}T00:00:00`).getTime()) return false;
      if (customTo && t > new Date(`${customTo}T23:59:59`).getTime()) return false;
      return true;
    }
    const days = dateRange === "7d" ? 7 : 30;
    const from = new Date(now);
    from.setDate(from.getDate() - days);
    return d >= from;
  };

  const filtered = orders.filter((o) => {
    const customer = o.customerName ?? o.email ?? "";
    const matchSearch =
      !search ||
      o.orderNumber.toLowerCase().includes(search.toLowerCase()) ||
      customer.toLowerCase().includes(search.toLowerCase()) ||
      (o.email ?? "").toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === "all" || toSlug(o.status) === statusFilter;
    return matchSearch && matchStatus && inRange(o.createdAt);
  });

  const sorted = [...filtered].sort((a, b) => {
    switch (sortBy) {
      case "date-asc": return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      case "date-desc": return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      case "amount-asc": return Number(a.total) - Number(b.total);
      case "amount-desc": return Number(b.total) - Number(a.total);
      case "order-asc": return a.orderNumber.localeCompare(b.orderNumber);
      case "status": return toSlug(a.status).localeCompare(toSlug(b.status));
      default: return 0;
    }
  });

  const totalAmount = filtered.reduce((acc, o) => acc + Number(o.total), 0);

  // Filtre/arama/sıralama değişince ilk sayfaya dön.
  useEffect(() => {
    setPage(1);
  }, [statusFilter, search, sortBy, dateRange, customFrom, customTo]);

  const { pageItems, pageCount, safePage } = paginate(sorted, page, PAGE_SIZE);

  function downloadCsv() {
    const head = ["Sipariş No", "Müşteri", "E-posta", "Tarih", "Tutar", "Durum"];
    const rows = sorted.map((o) => [
      o.orderNumber,
      o.customerName ?? "",
      o.email ?? "",
      formatDate(o.createdAt),
      String(Number(o.total)),
      STATUS_LABELS[toSlug(o.status)]?.label ?? o.status,
    ]);
    const csv = [head, ...rows]
      .map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(","))
      .join("\n");
    const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `siparisler-${formatDate(new Date().toISOString()).replace(/\./g, "-")}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

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
        <button
          onClick={downloadCsv}
          disabled={sorted.length === 0}
          className="inline-flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium border border-paper-200 hover:bg-paper-100 disabled:opacity-50 disabled:cursor-not-allowed"
        >
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
        <label className="flex items-center gap-2 px-3 py-2 bg-paper-50 border border-paper-200 rounded-lg text-sm">
          <span className="text-ink-500 whitespace-nowrap">Tarih:</span>
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value as DateRange)}
            className="bg-transparent outline-none text-ink-900 cursor-pointer pr-1"
          >
            {DATE_OPTIONS.map((d) => (
              <option key={d.value} value={d.value}>{d.label}</option>
            ))}
          </select>
        </label>
        {dateRange === "custom" && (
          <div className="flex items-center gap-2 px-3 py-2 bg-paper-50 border border-paper-200 rounded-lg text-sm">
            <input
              type="date"
              value={customFrom}
              max={customTo || undefined}
              onChange={(e) => setCustomFrom(e.target.value)}
              className="bg-transparent outline-none text-ink-900"
              aria-label="Başlangıç tarihi"
            />
            <span className="text-ink-400">→</span>
            <input
              type="date"
              value={customTo}
              min={customFrom || undefined}
              onChange={(e) => setCustomTo(e.target.value)}
              className="bg-transparent outline-none text-ink-900"
              aria-label="Bitiş tarihi"
            />
          </div>
        )}
        <label className="flex items-center gap-2 px-3 py-2 bg-paper-50 border border-paper-200 rounded-lg text-sm">
          <span className="text-ink-500 whitespace-nowrap">Sırala:</span>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as SortKey)}
            className="bg-transparent outline-none text-ink-900 cursor-pointer pr-1"
          >
            {SORT_OPTIONS.map((s) => (
              <option key={s.value} value={s.value}>{s.label}</option>
            ))}
          </select>
        </label>
      </div>

      <div className="mb-4 flex flex-wrap gap-2">
        <StatusChip active={statusFilter === "all"} onClick={() => setStatusFilter("all")}>
          Tümü ({orders.length})
        </StatusChip>
        {Object.entries(STATUS_LABELS).map(([k, v]) => {
          const count = orders.filter((o) => toSlug(o.status) === k).length;
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
                pageItems.map((o) => {
                  const s = STATUS_LABELS[toSlug(o.status)] ?? { label: o.status, color: "bg-paper-200 text-ink-700" };
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
                        {/* Ödeme durumu rozeti — ödenmemiş sipariş ("beklemede") net görünsün. */}
                        {o.paymentStatus && o.paymentStatus !== "basarili" && toSlug(o.status) !== "iptal-edildi" && (
                          <span className="mt-1 block text-[10px] font-semibold text-warning">
                            ● Ödeme Bekliyor
                          </span>
                        )}
                        {o.paymentStatus === "basarili" && (
                          <span className="mt-1 block text-[10px] font-semibold text-success">
                            ● Ödeme Yapıldı
                          </span>
                        )}
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
        <Pagination
          page={safePage}
          pageCount={pageCount}
          total={filtered.length}
          pageSize={PAGE_SIZE}
          onPageChange={setPage}
        />
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
