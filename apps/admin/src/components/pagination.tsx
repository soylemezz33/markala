"use client";

import { CaretLeft, CaretRight } from "@phosphor-icons/react";

/**
 * Client-side sayfalama yardımcısı. Liste API'leri toplam sayı döndürmediği için
 * (orders/admin-users düz dizi döner) sayfalama tarayıcı tarafında yapılır.
 * `safePage` her zaman 1..pageCount aralığına sabitlenir (filtre değişince taşmayı önler).
 */
export function paginate<T>(
  items: T[],
  page: number,
  pageSize: number,
): { pageItems: T[]; pageCount: number; safePage: number } {
  const pageCount = Math.max(1, Math.ceil(items.length / pageSize));
  const safePage = Math.min(Math.max(1, page), pageCount);
  const start = (safePage - 1) * pageSize;
  return {
    pageItems: items.slice(start, start + pageSize),
    pageCount,
    safePage,
  };
}

/** Önceki / Sonraki + "Sayfa X / Y" + toplam kayıt şeridi. Tek sayfa varsa gizlenmez (toplam bilgisi gösterilir). */
export function Pagination({
  page,
  pageCount,
  total,
  pageSize,
  onPageChange,
}: {
  page: number;
  pageCount: number;
  total: number;
  pageSize: number;
  onPageChange: (page: number) => void;
}) {
  if (total === 0) return null;

  const from = (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, total);

  return (
    <div className="flex items-center justify-between gap-3 px-4 py-3 border-t border-paper-200 text-sm text-ink-500 flex-wrap">
      <span className="tabular-nums">
        {from}–{to} / {total} kayıt
      </span>
      <div className="flex items-center gap-2">
        <span className="tabular-nums hidden sm:inline">
          Sayfa {page} / {pageCount}
        </span>
        <button
          type="button"
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 1}
          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-md border border-paper-200 text-ink-700 hover:bg-paper-100 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <CaretLeft size={14} weight="bold" /> Önceki
        </button>
        <button
          type="button"
          onClick={() => onPageChange(page + 1)}
          disabled={page >= pageCount}
          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-md border border-paper-200 text-ink-700 hover:bg-paper-100 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          Sonraki <CaretRight size={14} weight="bold" />
        </button>
      </div>
    </div>
  );
}
