"use client";

import Link from "next/link";
import { useTableSort, SortTh, type SortAccessors } from "@/components/data-table";

/**
 * Müşteri detayındaki "Sipariş Geçmişi" tablosu (2026-10-08).
 *
 * Sayfa bir SUNUCU bileşeni; sıralama tarayıcıda çalıştığı için tablo buraya, kendi
 * istemci bileşenine alındı. Etiketler ve biçimlendirme sayfadan hazır metin olarak
 * geçer (`statusText`, `amountText`) — iki yerde ayrı etiket haritası tutulmasın.
 */
export interface OrderHistoryRow {
  id: string;
  orderNumber: string;
  createdAt: string;
  dateText: string;
  statusText: string;
  /** Sıralama için ham tutar; gösterim `amountText`. */
  total: number;
  amountText: string;
}

type HistorySort = "order" | "date" | "status" | "amount";
const HISTORY_ACCESSORS: SortAccessors<OrderHistoryRow, HistorySort> = {
  order: (o) => o.orderNumber,
  date: (o) => new Date(o.createdAt),
  status: (o) => o.statusText,
  amount: (o) => o.total,
};

export function OrderHistoryTable({
  orders,
  showMoney,
}: {
  orders: OrderHistoryRow[];
  showMoney: boolean;
}) {
  const { rows, thProps } = useTableSort(orders, HISTORY_ACCESSORS, { key: "date" });
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead className="bg-paper-100/40 text-ink-500 text-xs uppercase tracking-wide">
          <tr>
            <SortTh sortKey="order" {...thProps} className="text-left px-5 py-2.5 font-semibold">
              Sipariş No
            </SortTh>
            <SortTh sortKey="date" {...thProps} className="text-left px-5 py-2.5 font-semibold hidden md:table-cell">
              Tarih
            </SortTh>
            <SortTh sortKey="status" {...thProps} className="text-left px-5 py-2.5 font-semibold">
              Durum
            </SortTh>
            {showMoney && (
              <SortTh sortKey="amount" {...thProps} align="right" className="text-right px-5 py-2.5 font-semibold">
                Tutar
              </SortTh>
            )}
          </tr>
        </thead>
        <tbody className="divide-y divide-paper-200">
          {rows.map((o) => (
            <tr key={o.id} className="hover:bg-paper-100/40">
              <td className="px-5 py-3">
                <Link
                  href={`/siparisler/${o.id}`}
                  className="font-mono text-xs font-semibold text-brand-700 hover:underline"
                >
                  {o.orderNumber}
                </Link>
              </td>
              <td className="px-5 py-3 text-ink-500 text-xs hidden md:table-cell">{o.dateText}</td>
              <td className="px-5 py-3 text-ink-700 text-xs">{o.statusText}</td>
              {showMoney && (
                <td className="px-5 py-3 text-right font-semibold text-ink-900 tabular-nums">
                  {o.amountText}
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
