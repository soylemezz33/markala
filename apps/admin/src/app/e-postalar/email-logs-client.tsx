"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AdminShell } from "@/components/admin-shell";
import { MagnifyingGlass, EnvelopeSimple, CheckCircle, XCircle, MinusCircle } from "@phosphor-icons/react";
import { Pagination, paginate } from "@/components/pagination";
import type { AdminNotificationLogRowDto } from "@markala/api-client";

const PAGE_SIZE = 25;

/** Şablon kodu → panelde okunur Türkçe ad. Bilinmeyen şablon kodu olduğu gibi gösterilir. */
const TEMPLATE_LABELS: Record<string, string> = {
  "order-confirmation": "Sipariş Onayı",
  "order-in-production": "Üretimde Bilgisi",
  "order-shipped": "Kargoya Verildi",
  "order-delivered": "Teslim Edildi",
  "order-cancelled": "Sipariş İptali",
  "new-order-admin": "Yeni Sipariş (yönetici)",
  "password-reset": "Şifre Sıfırlama",
  "email-verification": "E-posta Doğrulama",
  welcome: "Hoş Geldin",
  "review-invitation": "Yorum Daveti",
  "corporate-invite": "Kurumsal Davet",
  "corporate-monthly-statement": "Cari Aylık Özet",
};

const STATUS_META: Record<string, { label: string; className: string; icon: typeof CheckCircle }> = {
  sent: { label: "Gönderildi", className: "bg-success/10 text-success", icon: CheckCircle },
  failed: { label: "Başarısız", className: "bg-error/10 text-error", icon: XCircle },
  skipped: { label: "Atlandı", className: "bg-paper-200 text-ink-500", icon: MinusCircle },
};

function formatDateTime(iso: string): string {
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
  total: number;
  rows: AdminNotificationLogRowDto[];
  loadError: boolean;
}

export function EmailLogsClient({ total, rows, loadError }: Props) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [templateFilter, setTemplateFilter] = useState("all");
  const [page, setPage] = useState(1);

  const templates = [...new Set(rows.map((r) => r.template))].sort();

  const filtered = rows.filter((r) => {
    const matchSearch =
      !search ||
      r.recipient.toLowerCase().includes(search.toLowerCase()) ||
      (r.subject ?? "").toLowerCase().includes(search.toLowerCase()) ||
      (r.orderNumber ?? "").toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === "all" || r.status === statusFilter;
    const matchTemplate = templateFilter === "all" || r.template === templateFilter;
    return matchSearch && matchStatus && matchTemplate;
  });

  useEffect(() => {
    setPage(1);
  }, [search, statusFilter, templateFilter]);

  const { pageItems, pageCount, safePage } = paginate(filtered, page, PAGE_SIZE);

  return (
    <AdminShell>
      <header className="mb-6">
        <h1 className="text-2xl md:text-3xl font-semibold text-ink-900">E-posta Kayıtları</h1>
        <p className="text-ink-500 text-sm mt-1">
          {loadError
            ? "Kayıtlar yüklenemedi — sayfayı yenileyin."
            : `Toplam ${total.toLocaleString("tr-TR")} kayıt · son ${rows.length} gösteriliyor`}
        </p>
      </header>

      <div className="mb-4 flex flex-col md:flex-row gap-3">
        <div className="flex-1 flex items-center gap-2 px-3 py-2 bg-paper-50 border border-paper-200 rounded-lg">
          <MagnifyingGlass size={16} className="text-ink-500" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            type="search"
            placeholder="Alıcı, konu veya sipariş no ara..."
            className="flex-1 bg-transparent outline-none text-sm text-ink-900"
          />
        </div>
        <select
          value={templateFilter}
          onChange={(e) => setTemplateFilter(e.target.value)}
          className="px-3 py-2 bg-paper-50 border border-paper-200 rounded-lg text-sm min-w-[180px]"
        >
          <option value="all">Tüm şablonlar</option>
          {templates.map((t) => (
            <option key={t} value={t}>
              {TEMPLATE_LABELS[t] ?? t}
            </option>
          ))}
        </select>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3 py-2 bg-paper-50 border border-paper-200 rounded-lg text-sm min-w-[150px]"
        >
          <option value="all">Tüm durumlar</option>
          <option value="sent">Gönderildi</option>
          <option value="failed">Başarısız</option>
          <option value="skipped">Atlandı</option>
        </select>
      </div>

      <div className="bg-paper-50 border border-paper-200 rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-paper-100/60 text-ink-500 text-xs uppercase tracking-wide">
              <tr>
                <th className="text-left px-4 py-3 font-semibold whitespace-nowrap">Tarih</th>
                <th className="text-left px-4 py-3 font-semibold">Alıcı</th>
                <th className="text-left px-4 py-3 font-semibold">Konu</th>
                <th className="text-left px-4 py-3 font-semibold hidden md:table-cell">Şablon</th>
                <th className="text-center px-4 py-3 font-semibold">Durum</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-paper-200">
              {pageItems.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-10 text-center text-ink-500">
                    {rows.length === 0 ? "Henüz e-posta kaydı yok." : "Filtreye uyan kayıt yok."}
                  </td>
                </tr>
              )}
              {pageItems.map((r) => {
                const st = STATUS_META[r.status] ?? {
                  label: r.status,
                  className: "bg-paper-200 text-ink-700",
                  icon: EnvelopeSimple,
                };
                return (
                  <tr key={r.id} className="hover:bg-paper-100/40">
                    <td className="px-4 py-3 text-xs text-ink-500 whitespace-nowrap tabular-nums">
                      {formatDateTime(r.createdAt)}
                    </td>
                    <td className="px-4 py-3 text-ink-900">{r.recipient}</td>
                    <td className="px-4 py-3 text-ink-700">
                      {/* Eski kayıtlarda subject = şablon kodu yazıyordu; onlarda Türkçe etikete düş. */}
                      {r.subject && r.subject !== r.template
                        ? r.subject
                        : (TEMPLATE_LABELS[r.template] ?? r.template)}
                      {r.orderNumber && (
                        <Link
                          href={`/siparisler?q=${encodeURIComponent(r.orderNumber)}`}
                          className="ml-2 text-[11px] font-mono text-brand-700 hover:underline"
                        >
                          {r.orderNumber}
                        </Link>
                      )}
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell">
                      <span className="inline-block px-2 py-0.5 rounded-full text-[11px] font-medium bg-paper-100 text-ink-700">
                        {TEMPLATE_LABELS[r.template] ?? r.template}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold ${st.className}`}
                      >
                        <st.icon size={11} weight="fill" /> {st.label}
                      </span>
                    </td>
                  </tr>
                );
              })}
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

      <p className="mt-4 text-xs text-ink-500">
        Bu liste gönderim kaydıdır; e-postanın alıcının kutusuna ulaşıp ulaşmadığını (bounce)
        göstermez. 25.08.2026 öncesi kayıtlarda gerçek konu tutulmuyordu — o satırlarda şablon adı
        gösterilir.
      </p>
    </AdminShell>
  );
}
