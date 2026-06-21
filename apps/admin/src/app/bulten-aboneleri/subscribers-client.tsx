"use client";

import { useState } from "react";
import { AdminShell } from "@/components/admin-shell";
import { toast } from "@/components/toast";
import type { NewsletterSubscriberDto } from "@markala/api-client";

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

export function SubscribersClient({ subscribers }: Props) {
  const [copied, setCopied] = useState(false);
  const active = subscribers.filter((s) => s.status === "active");

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
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-paper-100/60 text-ink-500 text-xs uppercase tracking-wide">
                <tr>
                  <th className="text-left px-4 py-3 font-semibold">E-posta</th>
                  <th className="text-left px-4 py-3 font-semibold hidden md:table-cell">Kaynak</th>
                  <th className="text-center px-4 py-3 font-semibold">Durum</th>
                  <th className="text-right px-4 py-3 font-semibold">Tarih</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-paper-200">
                {subscribers.map((s) => (
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
