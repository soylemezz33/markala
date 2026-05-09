"use client";

import { useState } from "react";
import Link from "next/link";
import { AdminShell } from "@/components/admin-shell";
import { MagnifyingGlass, Eye, Download, Package } from "@phosphor-icons/react";

const mockOrders = [
  { no: "MK-2026-0123", customer: "Ali Yıldız", email: "ali@firma.com", date: "06.05.2026", amount: 580, status: "uretimde", items: 1 },
  { no: "MK-2026-0122", customer: "Mehmet Kara", email: "mehmet@kurumsal.com", date: "06.05.2026", amount: 1660, status: "tasarim-onay", items: 1 },
  { no: "MK-2026-0121", customer: "Zeynep Aksoy", email: "zeynep@gmail.com", date: "06.05.2026", amount: 2850, status: "kargoya-verildi", items: 1 },
  { no: "MK-2026-0120", customer: "Burak Tunç", email: "burak@avukat.com", date: "05.05.2026", amount: 220, status: "teslim-edildi", items: 1 },
  { no: "MK-2026-0119", customer: "Ayşe Demir", email: "ayse@magaza.com", date: "05.05.2026", amount: 15625, status: "uretimde", items: 1 },
  { no: "MK-2026-0118", customer: "Hasan Söylemez", email: "hasansylemezz@gmail.com", date: "04.05.2026", amount: 4250, status: "teslim-edildi", items: 3 },
  { no: "MK-2026-0117", customer: "Selin Toprak", email: "selin@klinik.com", date: "04.05.2026", amount: 1850, status: "iptal-edildi", items: 1 },
  { no: "MK-2026-0116", customer: "Cem Polat", email: "cem@oto.com", date: "03.05.2026", amount: 4800, status: "kargoya-verildi", items: 2 },
];

const statusLabels: Record<string, { label: string; color: string }> = {
  "tasarim-onay": { label: "Tasarım Onayı", color: "bg-[#1565C0]/10 text-[#1565C0]" },
  "uretimde": { label: "Üretimde", color: "bg-warning/10 text-warning" },
  "kargoya-verildi": { label: "Kargoda", color: "bg-success/10 text-success" },
  "teslim-edildi": { label: "Teslim Edildi", color: "bg-paper-200 text-ink-700" },
  "iptal-edildi": { label: "İptal", color: "bg-error/10 text-error" },
};

export default function OrdersAdminPage() {
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [search, setSearch] = useState("");

  const filtered = mockOrders.filter((o) => {
    const matchSearch =
      !search ||
      o.no.toLowerCase().includes(search.toLowerCase()) ||
      o.customer.toLowerCase().includes(search.toLowerCase()) ||
      o.email.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === "all" || o.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const totalAmount = filtered.reduce((acc, o) => acc + o.amount, 0);

  return (
    <AdminShell>
      <header className="mb-6 flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl md:text-3xl font-semibold text-ink-900">Siparişler</h1>
          <p className="text-ink-500 text-sm mt-1">
            {filtered.length} sipariş · Toplam <strong className="text-ink-900">₺ {totalAmount.toLocaleString("tr-TR")}</strong>
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
          Tümü ({mockOrders.length})
        </StatusChip>
        {Object.entries(statusLabels).map(([k, v]) => {
          const count = mockOrders.filter((o) => o.status === k).length;
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
              {filtered.map((o) => {
                const s = statusLabels[o.status]!;
                return (
                  <tr key={o.no} className="hover:bg-paper-100/40">
                    <td className="px-4 py-3 font-mono text-xs font-semibold text-ink-900">{o.no}</td>
                    <td className="px-4 py-3">
                      <div className="font-medium text-ink-900">{o.customer}</div>
                      <div className="text-[11px] text-ink-500">{o.email}</div>
                    </td>
                    <td className="px-4 py-3 text-ink-700 text-xs hidden md:table-cell">{o.date}</td>
                    <td className="px-4 py-3 text-right font-semibold text-ink-900 tabular-nums">
                      ₺ {o.amount.toLocaleString("tr-TR")}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={`inline-block px-2 py-0.5 rounded-full text-[11px] font-semibold ${s.color}`}>
                        {s.label}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Link
                        href={`/siparisler/${o.no}`}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded text-xs font-medium border border-paper-200 hover:bg-paper-100"
                      >
                        <Eye size={12} /> Detay
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <p className="mt-4 text-xs text-ink-500 flex items-center gap-1.5">
        <Package size={12} />
        Mock veri — backend bağlandığında <code className="font-mono px-1 py-0.5 rounded bg-paper-100">GET /api/orders</code> endpoint'inden canlı gelecek.
      </p>
    </AdminShell>
  );
}

function StatusChip({
  active, onClick, children,
}: {
  active: boolean; onClick: () => void; children: React.ReactNode;
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
