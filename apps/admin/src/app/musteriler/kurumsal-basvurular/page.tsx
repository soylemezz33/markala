"use client";

import Link from "next/link";
import { useState } from "react";
import { AdminShell } from "@/components/admin-shell";
import {
  Buildings, CheckCircle, XCircle, Eye, Clock,
  FileText, Download, MagnifyingGlass,
} from "@phosphor-icons/react";

type Status = "pending" | "approved" | "rejected";

interface Application {
  id: string;
  companyName: string;
  taxNumber: string;
  contactName: string;
  email: string;
  phone: string;
  sector: string;
  annualVolume: string;
  submittedAt: string;
  status: Status;
}

const MOCK_APPLICATIONS: Application[] = [
  {
    id: "KB-2026-0008",
    companyName: "Akdeniz Otel İşletmeleri A.Ş.",
    taxNumber: "1234567890",
    contactName: "Ali Yıldız",
    email: "ali@akdenizotel.com.tr",
    phone: "0532 555 4433",
    sector: "Hizmet",
    annualVolume: "150.000-500.000 ₺",
    submittedAt: "2026-05-07 09:14",
    status: "pending",
  },
  {
    id: "KB-2026-0007",
    companyName: "Lisan Fen Eğitim Kurumları",
    taxNumber: "9876543210",
    contactName: "Mehmet Erdoğan",
    email: "info@lisanfen.com.tr",
    phone: "0324 433 22 11",
    sector: "Eğitim",
    annualVolume: "500.000 ₺+",
    submittedAt: "2026-05-06 16:42",
    status: "pending",
  },
  {
    id: "KB-2026-0006",
    companyName: "Mersin Marina Restoran",
    taxNumber: "5544332211",
    contactName: "Ayşe Demir",
    email: "ayse@mersinmarina.com",
    phone: "0533 222 1100",
    sector: "Gıda & Restoran",
    annualVolume: "50.000-150.000 ₺",
    submittedAt: "2026-05-05 11:20",
    status: "approved",
  },
  {
    id: "KB-2026-0005",
    companyName: "Test İnşaat Ltd.",
    taxNumber: "1112223334",
    contactName: "Fatma Kara",
    email: "info@testinsaat.com",
    phone: "0530 111 2233",
    sector: "Üretim",
    annualVolume: "0-50.000 ₺",
    submittedAt: "2026-05-04 14:05",
    status: "rejected",
  },
];

const STATUS_LABEL: Record<Status, string> = {
  pending: "Beklemede",
  approved: "Onaylı",
  rejected: "Reddedildi",
};

const STATUS_CLASS: Record<Status, string> = {
  pending: "bg-warning/15 text-warning",
  approved: "bg-success/15 text-success",
  rejected: "bg-error/15 text-error",
};

export default function KurumsalBasvurularPage() {
  const [filter, setFilter] = useState<Status | "all">("pending");
  const [search, setSearch] = useState("");
  const [apps, setApps] = useState(MOCK_APPLICATIONS);

  const filtered = apps.filter((a) => {
    if (filter !== "all" && a.status !== filter) return false;
    if (search && !`${a.companyName} ${a.contactName} ${a.email} ${a.id}`.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  function setStatus(id: string, status: Status) {
    setApps((prev) => prev.map((a) => (a.id === id ? { ...a, status } : a)));
  }

  const counts = {
    pending: apps.filter((a) => a.status === "pending").length,
    approved: apps.filter((a) => a.status === "approved").length,
    rejected: apps.filter((a) => a.status === "rejected").length,
  };

  return (
    <AdminShell>
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-1">
          <Buildings size={22} className="text-brand-700" />
          <h1 className="text-xl md:text-2xl font-semibold text-ink-900">Kurumsal Başvurular</h1>
        </div>
        <p className="text-sm text-ink-500">B2B hesap başvurularını incele, onayla veya reddet.</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        <StatCard label="Beklemede" value={counts.pending} cls="text-warning" icon={Clock} />
        <StatCard label="Onaylı" value={counts.approved} cls="text-success" icon={CheckCircle} />
        <StatCard label="Reddedilen" value={counts.rejected} cls="text-error" icon={XCircle} />
      </div>

      {/* Filters */}
      <div className="bg-paper-50 border border-paper-200 rounded-lg p-3 mb-4 flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-1 bg-paper-100 rounded-md p-0.5">
          {(["pending", "approved", "rejected", "all"] as const).map((s) => (
            <button
              key={s}
              onClick={() => setFilter(s)}
              className={`px-3 py-1.5 rounded text-xs font-medium ${
                filter === s ? "bg-paper-50 text-ink-900 shadow-sm" : "text-ink-500"
              }`}
            >
              {s === "all" ? "Tümü" : STATUS_LABEL[s]}
            </button>
          ))}
        </div>
        <div className="flex-1 flex items-center gap-2 px-3 py-1.5 bg-paper-100 rounded-md min-w-[200px]">
          <MagnifyingGlass size={14} className="text-ink-500" />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Şirket, kişi, e-posta ara..."
            className="flex-1 bg-transparent outline-none text-sm"
          />
        </div>
      </div>

      {/* List */}
      <div className="bg-paper-50 border border-paper-200 rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-paper-100 border-b border-paper-200">
            <tr className="text-left text-xs font-medium text-ink-500">
              <th className="px-4 py-3">Başvuru</th>
              <th className="px-4 py-3 hidden md:table-cell">Sektör</th>
              <th className="px-4 py-3 hidden lg:table-cell">Hacim</th>
              <th className="px-4 py-3 hidden md:table-cell">Tarih</th>
              <th className="px-4 py-3">Durum</th>
              <th className="px-4 py-3 text-right">İşlem</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-paper-200">
            {filtered.map((a) => (
              <tr key={a.id} className="hover:bg-paper-100/50">
                <td className="px-4 py-3">
                  <div className="font-semibold text-ink-900">{a.companyName}</div>
                  <div className="text-xs text-ink-500">
                    {a.contactName} · {a.email}
                  </div>
                  <div className="text-[11px] text-ink-500 font-mono mt-0.5">{a.id}</div>
                </td>
                <td className="px-4 py-3 hidden md:table-cell text-ink-700">{a.sector}</td>
                <td className="px-4 py-3 hidden lg:table-cell text-ink-700 text-xs">{a.annualVolume}</td>
                <td className="px-4 py-3 hidden md:table-cell text-ink-500 text-xs">{a.submittedAt}</td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-0.5 rounded-full text-[11px] font-semibold ${STATUS_CLASS[a.status]}`}>
                    {STATUS_LABEL[a.status]}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center justify-end gap-1">
                    <button
                      title="Detay"
                      className="p-1.5 rounded hover:bg-paper-100 text-ink-500"
                      aria-label="Detay"
                    >
                      <Eye size={16} />
                    </button>
                    <button
                      title="Belgeleri indir"
                      className="p-1.5 rounded hover:bg-paper-100 text-ink-500"
                      aria-label="Belgeleri indir"
                    >
                      <Download size={16} />
                    </button>
                    {a.status === "pending" && (
                      <>
                        <button
                          onClick={() => setStatus(a.id, "approved")}
                          className="px-2 py-1 rounded text-[11px] font-semibold bg-success/15 text-success hover:bg-success/25"
                        >
                          Onayla
                        </button>
                        <button
                          onClick={() => setStatus(a.id, "rejected")}
                          className="px-2 py-1 rounded text-[11px] font-semibold bg-error/15 text-error hover:bg-error/25"
                        >
                          Reddet
                        </button>
                      </>
                    )}
                  </div>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-12 text-center text-ink-500">
                  <FileText size={32} className="mx-auto mb-2 opacity-40" />
                  Bu filtrede başvuru yok.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <p className="mt-4 text-xs text-ink-500">
        Backend bağlandığında: <code>POST /api/corporate-applications/:id/approve</code> ·{" "}
        <code>POST /api/corporate-applications/:id/reject</code>
      </p>

      <Link
        href="/musteriler"
        className="mt-6 inline-flex items-center gap-1.5 text-sm text-brand-700 hover:underline"
      >
        ← Tüm müşteriler
      </Link>
    </AdminShell>
  );
}

function StatCard({
  label,
  value,
  cls,
  icon: Icon,
}: {
  label: string;
  value: number;
  cls: string;
  icon: typeof CheckCircle;
}) {
  return (
    <div className="p-4 bg-paper-50 border border-paper-200 rounded-lg">
      <div className="flex items-center gap-2 text-xs text-ink-500 mb-1">
        <Icon size={14} className={cls} weight="fill" />
        {label}
      </div>
      <div className={`text-2xl font-semibold ${cls}`}>{value}</div>
    </div>
  );
}
