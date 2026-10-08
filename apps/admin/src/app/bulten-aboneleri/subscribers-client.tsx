"use client";

import { useMemo, useState } from "react";
import { AdminShell } from "@/components/admin-shell";
import { toast } from "@/components/toast";
import type { NewsletterSubscriberDto } from "@markala/api-client";
import {
  useTableSort,
  SortTh,
  TableToolbar,
  FilterChips,
  TableEmpty,
  aramaEslesir,
  type SortAccessors,
} from "@/components/data-table";

interface Props {
  subscribers: NewsletterSubscriberDto[];
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("tr-TR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

type SubSort = "email" | "source" | "status" | "date";
const SUB_ACCESSORS: SortAccessors<NewsletterSubscriberDto, SubSort> = {
  email: (s) => s.email,
  source: (s) => s.source,
  status: (s) => s.status,
  date: (s) => new Date(s.createdAt),
};

export function SubscribersClient({ subscribers }: Props) {
  const [copied, setCopied] = useState(false);
  const [q, setQ] = useState("");
  const [durum, setDurum] = useState<"all" | "active" | "unsubscribed">("all");
  const active = subscribers.filter((s) => s.status === "active");

  const filtrelenmis = useMemo(
    () =>
      subscribers.filter(
        (s) => (durum === "all" || s.status === durum) && aramaEslesir(q, s.email, s.source),
      ),
    [subscribers, q, durum],
  );
  const { rows: siraliAboneler, thProps } = useTableSort(filtrelenmis, SUB_ACCESSORS, { key: "date" });
  const filtreAktif = q !== "" || durum !== "all";
  const temizle = () => {
    setQ("");
    setDurum("all");
  };

  async function copyEmails() {
    const emails = active.map((s) => s.email).join(", ");
    try {
      await navigator.clipboard.writeText(emails);
      setCopied(true);
      toast.success(`${active.length} e-posta panoya kopyalandı.`);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      toast.error("Kopyalanamadı.");
    }
  }

  return (
    <AdminShell>
      <header className="mb-6 flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl md:text-3xl font-semibold text-ink-900">Bülten Aboneleri</h1>
          <p className="text-ink-500 text-sm mt-1">
            {active.length} aktif abone
            {subscribers.length !== active.length && (
              <span className="text-ink-400"> · {subscribers.length} toplam</span>
            )}
          </p>
        </div>
        {active.length > 0 && (
          <button
            onClick={copyEmails}
            className="px-4 py-2 rounded-md bg-brand-500 hover:bg-brand-600 text-ink-900 text-sm font-semibold"
          >
            {copied ? "✓ Kopyalandı" : "Tüm e-postaları kopyala"}
          </button>
        )}
      </header>

      {subscribers.length === 0 ? (
        <div className="bg-paper-50 border border-paper-200 rounded-lg p-12 text-center">
          <p className="text-ink-500 text-sm">Henüz bülten abonesi yok.</p>
        </div>
      ) : (
        <div className="bg-paper-50 border border-paper-200 rounded-lg overflow-hidden">
          <TableToolbar
            search={{ id: "abone-ara", value: q, onChange: setQ, placeholder: "E-posta veya kaynak ara…" }}
            count={{ gosterilen: filtrelenmis.length, toplam: subscribers.length, birim: "abone" }}
            onClear={filtreAktif ? temizle : null}
          >
            <FilterChips
              label="Durum"
              value={durum}
              onChange={setDurum}
              options={[
                { value: "all", label: "Tümü" },
                { value: "active", label: "Aktif", count: active.length },
                { value: "unsubscribed", label: "Çıktı", count: subscribers.length - active.length },
              ]}
            />
          </TableToolbar>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-paper-100/60 text-ink-500 text-xs uppercase tracking-wide">
                <tr>
                  <SortTh sortKey="email" {...thProps} className="text-left px-4 py-3 font-semibold">E-posta</SortTh>
                  <SortTh sortKey="source" {...thProps} className="text-left px-4 py-3 font-semibold hidden md:table-cell">Kaynak</SortTh>
                  <SortTh sortKey="status" {...thProps} align="center" className="text-center px-4 py-3 font-semibold">Durum</SortTh>
                  <SortTh sortKey="date" {...thProps} align="right" className="text-right px-4 py-3 font-semibold">Tarih</SortTh>
                </tr>
              </thead>
              <tbody className="divide-y divide-paper-200">
                {siraliAboneler.length === 0 && (
                  <TableEmpty colSpan={4} filtreli onClear={temizle} bosMesaj="Abone yok." />
                )}
                {siraliAboneler.map((s) => (
                  <tr key={s.id} className="hover:bg-paper-100/40">
                    <td className="px-4 py-3 text-ink-900 font-medium">{s.email}</td>
                    <td className="px-4 py-3 text-ink-500 text-xs hidden md:table-cell">{s.source}</td>
                    <td className="px-4 py-3 text-center">
                      <span
                        className={`inline-block px-2 py-0.5 rounded-full text-[11px] font-semibold ${
                          s.status === "active"
                            ? "bg-success/15 text-success"
                            : "bg-paper-200 text-ink-500"
                        }`}
                      >
                        {s.status === "active" ? "Aktif" : "Çıktı"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right text-ink-500 text-xs whitespace-nowrap">
                      {formatDate(s.createdAt)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </AdminShell>
  );
}
