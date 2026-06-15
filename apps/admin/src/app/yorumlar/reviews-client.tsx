"use client";

import { useState, useTransition } from "react";
import { AdminShell } from "@/components/admin-shell";
import { toast } from "@/components/toast";
import type { ReviewDto } from "@markala/api-client";
import { setReviewApproval, removeReview } from "./actions";

interface Props {
  reviews: ReviewDto[];
}

type Filter = "all" | "pending" | "approved";

function renderStars(rating: number): string {
  const full = Math.min(Math.max(Math.round(rating), 0), 5);
  return "★".repeat(full) + "☆".repeat(5 - full);
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("tr-TR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

const FILTER_LABELS: Record<Filter, string> = {
  all: "Tümü",
  pending: "Onay Bekleyen",
  approved: "Onaylı",
};

export function ReviewsClient({ reviews }: Props) {
  const [filter, setFilter] = useState<Filter>("all");
  const [isPending, startTransition] = useTransition();

  const filtered = reviews.filter((r) => {
    if (filter === "pending") return !r.isApproved;
    if (filter === "approved") return r.isApproved;
    return true;
  });

  function handleApproval(r: ReviewDto, approve: boolean) {
    startTransition(async () => {
      try {
        await setReviewApproval(r.id, approve);
        toast.success(approve ? "Yorum onaylandı." : "Onay kaldırıldı.");
      } catch {
        toast.error("İşlem başarısız.");
      }
    });
  }

  function handleDelete(r: ReviewDto) {
    if (!window.confirm("Bu yorum silinecek. Emin misiniz?")) return;
    startTransition(async () => {
      try {
        await removeReview(r.id);
        toast.success("Yorum silindi.");
      } catch {
        toast.error("Silme başarısız.");
      }
    });
  }

  const pendingCount = reviews.filter((r) => !r.isApproved).length;

  return (
    <AdminShell>
      {/* Header */}
      <header className="mb-6 flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-semibold text-ink-900">Yorumlar</h1>
          <p className="text-ink-500 text-sm mt-1">
            {reviews.length} yorum
            {pendingCount > 0 && (
              <span className="ml-2 inline-block px-1.5 py-0.5 rounded-full text-[11px] font-semibold bg-amber-100 text-amber-700">
                {pendingCount} bekleyen
              </span>
            )}
          </p>
        </div>
      </header>

      {/* Filter tabs */}
      <div className="flex gap-1 mb-4 p-1 bg-paper-100 rounded-lg w-fit">
        {(["all", "pending", "approved"] as Filter[]).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
              filter === f
                ? "bg-paper-50 text-ink-900 shadow-sm"
                : "text-ink-500 hover:text-ink-700"
            }`}
          >
            {FILTER_LABELS[f]}
            {f === "pending" && pendingCount > 0 && (
              <span className="ml-1.5 inline-block px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500 text-white leading-none">
                {pendingCount}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Table */}
      {filtered.length === 0 ? (
        <div className="bg-paper-50 border border-paper-200 rounded-lg p-12 text-center">
          <p className="text-ink-500 text-sm">
            {filter === "pending"
              ? "Onay bekleyen yorum yok."
              : filter === "approved"
                ? "Henüz onaylanmış yorum yok."
                : "Henüz hiç yorum yok."}
          </p>
        </div>
      ) : (
        <div className="bg-paper-50 border border-paper-200 rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-paper-100/60 text-ink-500 text-xs uppercase tracking-wide">
                <tr>
                  <th className="text-left px-4 py-3 font-semibold">Müşteri</th>
                  <th className="text-left px-4 py-3 font-semibold hidden md:table-cell">Ürün</th>
                  <th className="text-center px-4 py-3 font-semibold">Puan</th>
                  <th className="text-left px-4 py-3 font-semibold hidden lg:table-cell">Yorum</th>
                  <th className="text-center px-4 py-3 font-semibold hidden md:table-cell">Tarih</th>
                  <th className="text-center px-4 py-3 font-semibold">Durum</th>
                  <th className="text-right px-4 py-3 font-semibold">İşlem</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-paper-200">
                {filtered.map((r) => (
                  <tr key={r.id} className="hover:bg-paper-100/40">
                    {/* Müşteri */}
                    <td className="px-4 py-3">
                      <span className="font-medium text-ink-900">{r.userName}</span>
                      {r.userCompany && (
                        <span className="block text-xs text-ink-500">{r.userCompany}</span>
                      )}
                    </td>

                    {/* Ürün */}
                    <td className="px-4 py-3 text-ink-700 hidden md:table-cell">
                      {r.product?.name ?? "—"}
                    </td>

                    {/* Puan */}
                    <td className="px-4 py-3 text-center text-amber-500 text-base leading-none">
                      {renderStars(r.rating)}
                    </td>

                    {/* Yorum */}
                    <td className="px-4 py-3 text-ink-700 max-w-xs hidden lg:table-cell">
                      <span className="line-clamp-2 text-xs leading-relaxed">{r.comment}</span>
                    </td>

                    {/* Tarih */}
                    <td className="px-4 py-3 text-center text-ink-500 text-xs hidden md:table-cell whitespace-nowrap">
                      {formatDate(r.createdAt)}
                    </td>

                    {/* Durum */}
                    <td className="px-4 py-3 text-center">
                      <span
                        className={`inline-block px-2 py-0.5 rounded-full text-[11px] font-semibold ${
                          r.isApproved
                            ? "bg-success/15 text-success"
                            : "bg-amber-100 text-amber-700"
                        }`}
                      >
                        {r.isApproved ? "Onaylı" : "Onay Bekliyor"}
                      </span>
                    </td>

                    {/* İşlemler */}
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        {!r.isApproved ? (
                          <button
                            onClick={() => handleApproval(r, true)}
                            disabled={isPending}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded text-xs font-medium border border-success/30 bg-success/10 hover:bg-success/20 text-success disabled:opacity-50"
                          >
                            Onayla
                          </button>
                        ) : (
                          <button
                            onClick={() => handleApproval(r, false)}
                            disabled={isPending}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded text-xs font-medium border border-paper-200 hover:bg-paper-100 text-ink-700 disabled:opacity-50"
                          >
                            Onayı Kaldır
                          </button>
                        )}
                        <button
                          onClick={() => handleDelete(r)}
                          disabled={isPending}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded text-xs font-medium border border-paper-200 hover:bg-error/10 hover:border-error/30 hover:text-error text-ink-700 disabled:opacity-50"
                        >
                          Sil
                        </button>
                      </div>
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
