"use client";

import { useState, useTransition } from "react";
import { AdminShell } from "@/components/admin-shell";
import { toast } from "@/components/toast";
import type { QuoteRequestDto } from "@markala/api-client";
import { setQuoteStatus } from "./actions";

interface Props {
  quotes: QuoteRequestDto[];
}

type Filter = "all" | "new" | "contacted" | "quoted" | "closed";

function formatDate(iso: string): string {
  return new Date(iso).toLocaleString("tr-TR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

const FILTER_LABELS: Record<Filter, string> = {
  all: "Tümü",
  new: "Yeni",
  contacted: "İletişime geçildi",
  quoted: "Teklif verildi",
  closed: "Kapandı",
};

const STATUS_BADGE: Record<string, string> = {
  new: "bg-amber-100 text-amber-700",
  contacted: "bg-[#E8F0FF] text-[#1565C0]",
  quoted: "bg-success/15 text-success",
  closed: "bg-paper-200 text-ink-500",
};
const STATUS_LABEL: Record<string, string> = {
  new: "Yeni",
  contacted: "İletişime geçildi",
  quoted: "Teklif verildi",
  closed: "Kapandı",
};

// Bir sonraki mantıksal durum (akışı ileri taşır).
const NEXT_STEP: Record<string, { status: Filter; label: string } | null> = {
  new: { status: "contacted", label: "İletişime geçildi" },
  contacted: { status: "quoted", label: "Teklif verildi" },
  quoted: { status: "closed", label: "Kapat" },
  closed: null,
};

export function QuotesClient({ quotes }: Props) {
  const [filter, setFilter] = useState<Filter>("all");
  const [isPending, startTransition] = useTransition();

  const filtered = quotes.filter((q) => (filter === "all" ? true : q.status === filter));
  const newCount = quotes.filter((q) => q.status === "new").length;

  function update(q: QuoteRequestDto, status: Filter, label: string) {
    startTransition(async () => {
      try {
        await setQuoteStatus(q.id, status as "new" | "contacted" | "quoted" | "closed");
        toast.success(label);
      } catch {
        toast.error("İşlem başarısız.");
      }
    });
  }

  return (
    <AdminShell>
      <header className="mb-6 flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-semibold text-ink-900">Teklif Talepleri</h1>
          <p className="text-ink-500 text-sm mt-1">
            /teklif-al formundan gelen talepler · {quotes.length} kayıt
            {newCount > 0 && (
              <span className="ml-2 inline-block px-1.5 py-0.5 rounded-full text-[11px] font-semibold bg-amber-100 text-amber-700">
                {newCount} yeni
              </span>
            )}
          </p>
        </div>
      </header>

      <div className="flex gap-1 mb-4 p-1 bg-paper-100 rounded-lg w-fit flex-wrap">
        {(["all", "new", "contacted", "quoted", "closed"] as Filter[]).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
              filter === f ? "bg-paper-50 text-ink-900 shadow-sm" : "text-ink-500 hover:text-ink-700"
            }`}
          >
            {FILTER_LABELS[f]}
            {f === "new" && newCount > 0 && (
              <span className="ml-1.5 inline-block px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500 text-white leading-none">
                {newCount}
              </span>
            )}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="bg-paper-50 border border-paper-200 rounded-lg p-12 text-center">
          <p className="text-ink-500 text-sm">
            {filter === "all" ? "Henüz teklif talebi yok." : "Bu filtrede talep yok."}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((q) => {
            const next = NEXT_STEP[q.status];
            return (
              <article key={q.id} className="bg-paper-50 border border-paper-200 rounded-lg p-4 md:p-5">
                <div className="flex items-start justify-between gap-3 flex-wrap">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-ink-900">
                        {q.companyName || q.name}
                      </span>
                      <span
                        className={`inline-block px-2 py-0.5 rounded-full text-[11px] font-semibold ${
                          STATUS_BADGE[q.status] ?? "bg-paper-200 text-ink-500"
                        }`}
                      >
                        {STATUS_LABEL[q.status] ?? q.status}
                      </span>
                      {q.sector && (
                        <span className="inline-block px-2 py-0.5 rounded-full text-[11px] font-medium bg-paper-100 text-ink-600">
                          {q.sector}
                        </span>
                      )}
                      <span className="text-[11px] text-ink-400 font-mono">{q.ticketId}</span>
                    </div>
                    <div className="mt-1 text-sm text-ink-600 flex items-center gap-3 flex-wrap">
                      <span className="text-ink-700 font-medium">{q.name}</span>
                      <a href={`mailto:${q.email}`} className="text-brand-700 hover:underline">
                        {q.email}
                      </a>
                      <a href={`tel:${q.phone}`} className="text-ink-700 hover:underline">
                        {q.phone}
                      </a>
                      <span className="text-ink-400 text-xs">{formatDate(q.createdAt)}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 flex-none">
                    {next && (
                      <button
                        onClick={() => update(q, next.status, `${next.label} olarak işaretlendi.`)}
                        disabled={isPending}
                        className="px-2.5 py-1 rounded text-xs font-medium border border-success/30 bg-success/10 hover:bg-success/20 text-success disabled:opacity-50"
                      >
                        {next.label}
                      </button>
                    )}
                    {q.status !== "new" && (
                      <button
                        onClick={() => update(q, "new", "Yeniye taşındı.")}
                        disabled={isPending}
                        className="px-2.5 py-1 rounded text-xs font-medium border border-paper-200 hover:bg-paper-100 text-ink-700 disabled:opacity-50"
                      >
                        Geri Al
                      </button>
                    )}
                  </div>
                </div>

                {/* Ürün etiketleri */}
                {q.products?.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {q.products.map((p, i) => (
                      <span
                        key={i}
                        className="inline-block px-2 py-0.5 rounded-md text-[11px] font-medium bg-ink-900 text-paper-50"
                      >
                        {p}
                      </span>
                    ))}
                  </div>
                )}

                {/* Hacim bilgisi */}
                {(q.quantity || q.budget) && (
                  <div className="mt-2 text-xs text-ink-600 flex flex-wrap gap-x-4 gap-y-1">
                    {q.quantity && <span>Sıklık: <strong className="text-ink-800">{q.quantity}</strong></span>}
                    {q.budget && <span>Bütçe: <strong className="text-ink-800">{q.budget}</strong></span>}
                  </div>
                )}

                {q.message && (
                  <p className="mt-2 text-sm text-ink-700 leading-relaxed whitespace-pre-wrap border-t border-paper-200 pt-2">
                    {q.message}
                  </p>
                )}
              </article>
            );
          })}
        </div>
      )}
    </AdminShell>
  );
}
