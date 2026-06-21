"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { AdminShell } from "@/components/admin-shell";
import {
  Buildings,
  CheckCircle,
  XCircle,
  Eye,
  Clock,
  FileText,
  MagnifyingGlass,
  X,
  DownloadSimple,
} from "@phosphor-icons/react";
import type { CorporateApplicationDto } from "@markala/api-client";
import { setApplicationStatus } from "./actions";

type Status = "pending" | "approved" | "rejected";

const STATUS_LABEL: Record<string, string> = {
  none: "Belirsiz",
  pending: "Beklemede",
  approved: "Onaylı",
  rejected: "Reddedildi",
};

const STATUS_CLASS: Record<string, string> = {
  none: "bg-paper-100 text-ink-500",
  pending: "bg-warning/15 text-warning",
  approved: "bg-success/15 text-success",
  rejected: "bg-error/15 text-error",
};

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

interface Props {
  applications: CorporateApplicationDto[];
}

export function ApplicationsClient({ applications }: Props) {
  const [filter, setFilter] = useState<Status | "all">("pending");
  const [search, setSearch] = useState("");
  const [pending, startTransition] = useTransition();
  const [detail, setDetail] = useState<CorporateApplicationDto | null>(null);

  const filtered = applications.filter((a) => {
    if (filter !== "all" && a.status !== filter) return false;
    if (
      search &&
      !`${a.companyName} ${a.contactName} ${a.email} ${a.id}`
        .toLowerCase()
        .includes(search.toLowerCase())
    )
      return false;
    return true;
  });

  const counts = {
    pending: applications.filter((a) => a.status === "pending").length,
    approved: applications.filter((a) => a.status === "approved").length,
    rejected: applications.filter((a) => a.status === "rejected").length,
  };

  function handleSetStatus(id: string, status: "approved" | "rejected" | "pending") {
    startTransition(() => {
      setApplicationStatus(id, status);
    });
  }

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
              <th className="px-4 py-3 hidden md:table-cell">Vergi</th>
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
                  {a.phone && <div className="text-[11px] text-ink-500 mt-0.5">{a.phone}</div>}
                </td>
                <td className="px-4 py-3 hidden md:table-cell text-xs text-ink-700">
                  <div>{a.taxOffice}</div>
                  <div className="font-mono text-ink-500">{a.taxNumber}</div>
                </td>
                <td className="px-4 py-3 hidden md:table-cell text-ink-500 text-xs">
                  {formatDate(a.createdAt)}
                </td>
                <td className="px-4 py-3">
                  <span
                    className={`px-2 py-0.5 rounded-full text-[11px] font-semibold ${
                      STATUS_CLASS[a.status] ?? STATUS_CLASS.none
                    }`}
                  >
                    {STATUS_LABEL[a.status] ?? a.status}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center justify-end gap-1">
                    <button
                      title="Detay"
                      onClick={() => setDetail(a)}
                      className="p-1.5 rounded hover:bg-paper-100 text-ink-500"
                      aria-label="Detay"
                    >
                      <Eye size={16} />
                    </button>
                    {a.status === "pending" && (
                      <>
                        <button
                          onClick={() => handleSetStatus(a.id, "approved")}
                          disabled={pending}
                          className="px-2 py-1 rounded text-[11px] font-semibold bg-success/15 text-success hover:bg-success/25 disabled:opacity-50"
                        >
                          Onayla
                        </button>
                        <button
                          onClick={() => handleSetStatus(a.id, "rejected")}
                          disabled={pending}
                          className="px-2 py-1 rounded text-[11px] font-semibold bg-error/15 text-error hover:bg-error/25 disabled:opacity-50"
                        >
                          Reddet
                        </button>
                      </>
                    )}
                    {a.status === "approved" && (
                      <button
                        onClick={() => handleSetStatus(a.id, "rejected")}
                        disabled={pending}
                        className="px-2 py-1 rounded text-[11px] font-semibold bg-error/15 text-error hover:bg-error/25 disabled:opacity-50"
                      >
                        Reddet
                      </button>
                    )}
                    {a.status === "rejected" && (
                      <button
                        onClick={() => handleSetStatus(a.id, "approved")}
                        disabled={pending}
                        className="px-2 py-1 rounded text-[11px] font-semibold bg-success/15 text-success hover:bg-success/25 disabled:opacity-50"
                      >
                        Onayla
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-12 text-center text-ink-500">
                  <FileText size={32} className="mx-auto mb-2 opacity-40" />
                  <p className="text-sm">
                    {applications.length === 0
                      ? "Henüz kurumsal başvuru yok."
                      : "Bu filtrede başvuru yok."}
                  </p>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <Link
        href="/musteriler"
        className="mt-6 inline-flex items-center gap-1.5 text-sm text-brand-700 hover:underline"
      >
        ← Tüm müşteriler
      </Link>

      {detail && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-ink-900/60 backdrop-blur-sm p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) setDetail(null);
          }}
        >
          <div className="bg-paper-50 rounded-xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-4 border-b border-paper-200">
              <div className="flex items-center gap-2">
                <Buildings size={20} className="text-brand-700" />
                <h2 className="text-lg font-semibold text-ink-900">{detail.companyName}</h2>
              </div>
              <button
                onClick={() => setDetail(null)}
                className="p-1.5 -mr-1.5 rounded hover:bg-paper-100 text-ink-500"
                aria-label="Kapat"
              >
                <X size={18} />
              </button>
            </div>

            <div className="px-6 py-5 space-y-4">
              <div>
                <span
                  className={`px-2 py-0.5 rounded-full text-[11px] font-semibold ${
                    STATUS_CLASS[detail.status] ?? STATUS_CLASS.none
                  }`}
                >
                  {STATUS_LABEL[detail.status] ?? detail.status}
                </span>
              </div>

              <DetailRow label="Firma Adı" value={detail.companyName} />
              <DetailRow label="Vergi Dairesi" value={detail.taxOffice} />
              <DetailRow label="Vergi Numarası" value={detail.taxNumber} mono />
              <DetailRow label="Yetkili Kişi" value={detail.contactName} />
              <DetailRow label="E-posta" value={detail.email} />
              <DetailRow label="Telefon" value={detail.phone} />
              <DetailRow label="Başvuru Tarihi" value={formatDate(detail.createdAt)} />

              <div className="pt-3 border-t border-paper-200">
                <span className="text-xs font-semibold text-ink-500 uppercase tracking-wider">
                  Belgeler
                </span>
                <div className="mt-2 space-y-2">
                  {detail.taxCertificateUrl ? (
                    <DocLink href={`/api/kurumsal-belge/${detail.id}/tax`} label="Vergi Levhası" />
                  ) : (
                    <p className="text-xs text-ink-500">Vergi levhası yüklenmedi.</p>
                  )}
                  {detail.signatureCircularUrl ? (
                    <DocLink
                      href={`/api/kurumsal-belge/${detail.id}/signature`}
                      label="İmza Sirküleri"
                    />
                  ) : (
                    <p className="text-xs text-ink-500">İmza sirküleri yüklenmedi.</p>
                  )}
                </div>
              </div>
            </div>

            {detail.status === "pending" && (
              <div className="flex justify-end gap-2 px-6 py-4 border-t border-paper-200">
                <button
                  onClick={() => {
                    handleSetStatus(detail.id, "rejected");
                    setDetail(null);
                  }}
                  disabled={pending}
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-error/15 text-error hover:bg-error/25 disabled:opacity-50"
                >
                  Reddet
                </button>
                <button
                  onClick={() => {
                    handleSetStatus(detail.id, "approved");
                    setDetail(null);
                  }}
                  disabled={pending}
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-success/15 text-success hover:bg-success/25 disabled:opacity-50"
                >
                  Onayla
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </AdminShell>
  );
}

function DocLink({ href, label }: { href: string; label: string }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-center gap-2 px-3 py-2 rounded-md bg-paper-100 border border-paper-200 text-sm text-ink-900 hover:border-brand-500 hover:bg-brand-50/40"
    >
      <FileText size={16} className="flex-none text-brand-700" weight="fill" />
      <span className="flex-1">{label}</span>
      <DownloadSimple size={16} className="flex-none text-ink-500" />
    </a>
  );
}

function DetailRow({
  label,
  value,
  mono,
}: {
  label: string;
  value?: string | null;
  mono?: boolean;
}) {
  return (
    <div className="flex items-start justify-between gap-4">
      <span className="text-xs font-semibold text-ink-500 uppercase tracking-wider flex-none pt-0.5">
        {label}
      </span>
      <span className={`text-sm text-ink-900 text-right break-words ${mono ? "font-mono" : ""}`}>
        {value || "—"}
      </span>
    </div>
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
