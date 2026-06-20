"use client";

import { useState, useTransition } from "react";
import { AdminShell } from "@/components/admin-shell";
import { toast } from "@/components/toast";
import type { ContactMessageDto } from "@markala/api-client";
import { setContactStatus } from "./actions";

interface Props {
  messages: ContactMessageDto[];
}

type Filter = "all" | "new" | "read" | "archived";

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
  read: "Okundu",
  archived: "Arşiv",
};

const STATUS_BADGE: Record<string, string> = {
  new: "bg-amber-100 text-amber-700",
  read: "bg-success/15 text-success",
  archived: "bg-paper-200 text-ink-500",
};
const STATUS_LABEL: Record<string, string> = {
  new: "Yeni",
  read: "Okundu",
  archived: "Arşiv",
};

export function MessagesClient({ messages }: Props) {
  const [filter, setFilter] = useState<Filter>("all");
  const [isPending, startTransition] = useTransition();

  const filtered = messages.filter((m) => (filter === "all" ? true : m.status === filter));
  const newCount = messages.filter((m) => m.status === "new").length;

  function update(m: ContactMessageDto, status: "new" | "read" | "archived", label: string) {
    startTransition(async () => {
      try {
        await setContactStatus(m.id, status);
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
          <h1 className="text-2xl md:text-3xl font-semibold text-ink-900">Gelen Kutusu</h1>
          <p className="text-ink-500 text-sm mt-1">
            İletişim formu mesajları · {messages.length} kayıt
            {newCount > 0 && (
              <span className="ml-2 inline-block px-1.5 py-0.5 rounded-full text-[11px] font-semibold bg-amber-100 text-amber-700">
                {newCount} yeni
              </span>
            )}
          </p>
        </div>
      </header>

      <div className="flex gap-1 mb-4 p-1 bg-paper-100 rounded-lg w-fit">
        {(["all", "new", "read", "archived"] as Filter[]).map((f) => (
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
            {filter === "all" ? "Henüz mesaj yok." : `Bu filtrede mesaj yok.`}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((m) => (
            <article
              key={m.id}
              className="bg-paper-50 border border-paper-200 rounded-lg p-4 md:p-5"
            >
              <div className="flex items-start justify-between gap-3 flex-wrap">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold text-ink-900">{m.name}</span>
                    <span
                      className={`inline-block px-2 py-0.5 rounded-full text-[11px] font-semibold ${
                        STATUS_BADGE[m.status] ?? "bg-paper-200 text-ink-500"
                      }`}
                    >
                      {STATUS_LABEL[m.status] ?? m.status}
                    </span>
                    <span className="text-[11px] text-ink-400 font-mono">{m.ticketId}</span>
                  </div>
                  <div className="mt-1 text-sm text-ink-600 flex items-center gap-3 flex-wrap">
                    <a href={`mailto:${m.email}`} className="text-brand-700 hover:underline">
                      {m.email}
                    </a>
                    {m.phone && (
                      <a href={`tel:${m.phone}`} className="text-ink-700 hover:underline">
                        {m.phone}
                      </a>
                    )}
                    <span className="text-ink-400 text-xs">{formatDate(m.createdAt)}</span>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 flex-none">
                  {m.status !== "read" && (
                    <button
                      onClick={() => update(m, "read", "Okundu işaretlendi.")}
                      disabled={isPending}
                      className="px-2.5 py-1 rounded text-xs font-medium border border-success/30 bg-success/10 hover:bg-success/20 text-success disabled:opacity-50"
                    >
                      Okundu
                    </button>
                  )}
                  {m.status !== "archived" && (
                    <button
                      onClick={() => update(m, "archived", "Arşivlendi.")}
                      disabled={isPending}
                      className="px-2.5 py-1 rounded text-xs font-medium border border-paper-200 hover:bg-paper-100 text-ink-700 disabled:opacity-50"
                    >
                      Arşivle
                    </button>
                  )}
                  {m.status === "archived" && (
                    <button
                      onClick={() => update(m, "new", "Yeniye taşındı.")}
                      disabled={isPending}
                      className="px-2.5 py-1 rounded text-xs font-medium border border-paper-200 hover:bg-paper-100 text-ink-700 disabled:opacity-50"
                    >
                      Geri Al
                    </button>
                  )}
                </div>
              </div>

              <p className="mt-1 text-sm font-medium text-ink-800">{m.subject}</p>
              <p className="mt-1 text-sm text-ink-700 leading-relaxed whitespace-pre-wrap">{m.message}</p>
            </article>
          ))}
        </div>
      )}
    </AdminShell>
  );
}
