"use client";

import { Receipt, Download, FileText } from "@phosphor-icons/react";
import { useOrdersStore } from "@/lib/orders-store";
import { formatDate } from "@/lib/format";

export default function InvoicesPage() {
  const orders = useOrdersStore((s) => s.orders);
  const paidOrders = orders.filter((o) => o.status !== "iptal-edildi");

  return (
    <div className="space-y-6">
      <header>
        <h2 className="text-xl md:text-2xl font-semibold text-ink-900 flex items-center gap-2">
          <Receipt size={24} weight="bold" className="text-brand-700" />
          Faturalarım
        </h2>
        <p className="mt-1 text-sm text-ink-500">
          Tüm sipariş faturalarınız e-Arşiv olarak Paraşüt entegrasyonu üzerinden hazırlanır ve burada listelenir.
        </p>
      </header>

      {paidOrders.length === 0 ? (
        <div className="text-center py-16 bg-paper-50 border border-paper-200 rounded-xl">
          <div className="w-16 h-16 mx-auto rounded-full bg-paper-100 grid place-items-center text-ink-500">
            <Receipt size={28} />
          </div>
          <h3 className="mt-5 font-semibold text-ink-900 text-lg">Henüz faturanız yok</h3>
          <p className="mt-2 text-sm text-ink-500 max-w-md mx-auto">
            İlk siparişinizi tamamladığınızda e-Arşiv faturanız bu listede görünecek ve PDF olarak indirebileceksiniz.
          </p>
        </div>
      ) : (
        <div className="bg-paper-50 border border-paper-200 rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-paper-100/60 text-ink-500 text-xs uppercase tracking-wide">
                <tr>
                  <th className="text-left px-4 py-3 font-semibold">Fatura No</th>
                  <th className="text-left px-4 py-3 font-semibold">Sipariş</th>
                  <th className="text-left px-4 py-3 font-semibold">Tarih</th>
                  <th className="text-right px-4 py-3 font-semibold">Tutar</th>
                  <th className="text-right px-4 py-3 font-semibold">İşlem</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-paper-200">
                {paidOrders.map((o) => (
                  <tr key={o.id} className="hover:bg-paper-100/40">
                    <td className="px-4 py-3 font-mono text-xs font-semibold text-ink-900">
                      EARSV-{o.orderNumber.replace("MK-", "")}
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-ink-700">{o.orderNumber}</td>
                    <td className="px-4 py-3 text-ink-700 text-xs">{formatDate(o.createdAt)}</td>
                    <td className="px-4 py-3 text-right font-semibold tabular-nums">
                      ₺ {o.total.toLocaleString("tr-TR")}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => alert("PDF indiriliyor (mock — Paraşüt entegrasyonu ile gerçek PDF gelecek)")}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium border border-paper-200 hover:bg-paper-100"
                      >
                        <Download size={12} weight="bold" /> PDF İndir
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <div className="p-5 bg-paper-100 border border-paper-200 rounded-xl text-sm">
        <h3 className="font-semibold text-ink-900 mb-2 flex items-center gap-2">
          <FileText size={16} className="text-brand-700" />
          E-Arşiv Fatura Bilgisi
        </h3>
        <p className="text-ink-700 leading-relaxed text-xs">
          Markala / 324 Ajans, Gelir İdaresi Başkanlığı'na bildirilmiş e-Arşiv mükellefidir.
          Tüm faturalarınız Paraşüt üzerinden otomatik kesilir, hem e-postanıza gönderilir
          hem de bu sayfada arşivlenir. Kurumsal faturalar için bilgilerim sayfasından vergi
          numarası ve vergi dairesi bilgilerinizi güncelleyin.
        </p>
      </div>
    </div>
  );
}
