"use client";

import { useEffect, useState } from "react";
import { Receipt, Download, FileText } from "@phosphor-icons/react";
import { Button } from "@markala/ui";
import { useAuthStore } from "@/lib/auth-store";
import { apiClient, withRefresh } from "@/lib/api";
import { formatDate } from "@/lib/format";
import type { Order } from "@markala/types";

export default function InvoicesPage() {
  const user = useAuthStore((s) => s.user);
  const isBootstrapping = useAuthStore((s) => s.isBootstrapping);
  const [orders, setOrders] = useState<Order[] | null>(null); // null = yükleniyor
  const [error, setError] = useState(false);

  useEffect(() => {
    if (isBootstrapping || !user) return;
    let cancelled = false;
    setOrders(null);
    setError(false);
    withRefresh(() => apiClient.orders.listMine())
      .then((data) => { if (!cancelled) setOrders(data ?? []); })
      .catch(() => { if (!cancelled) { setOrders([]); setError(true); } });
    return () => { cancelled = true; };
  }, [user, isBootstrapping]);

  // Fatura yalnız ödenmiş/iptal olmayan siparişler için kesilir.
  const paidOrders = (orders ?? []).filter(
    (o) => (o.status as unknown as string).replace(/_/g, "-") !== "iptal-edildi",
  );

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

      {orders === null ? (
        <div className="space-y-3">
          {[0, 1].map((i) => (
            <div key={i} className="h-14 bg-paper-100 border border-paper-200 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : error ? (
        <div className="text-center py-16 bg-paper-50 border border-paper-200 rounded-xl">
          <h3 className="font-semibold text-ink-900 text-lg">Faturalar yüklenemedi</h3>
          <p className="mt-2 text-sm text-ink-500">Bağlantı sorunu olabilir. Lütfen tekrar deneyin.</p>
          <Button className="mt-5" onClick={() => location.reload()}>Yenile</Button>
        </div>
      ) : paidOrders.length === 0 ? (
        <div className="text-center py-16 bg-paper-50 border border-paper-200 rounded-xl">
          <div className="w-16 h-16 mx-auto rounded-full bg-paper-100 grid place-items-center text-ink-500">
            <Receipt size={28} />
          </div>
          <h3 className="mt-5 font-semibold text-ink-900 text-lg">Henüz faturanız yok</h3>
          <p className="mt-2 text-sm text-ink-500 max-w-md mx-auto">
            İlk siparişinizi tamamladığınızda e-Arşiv faturanız bu listede görünecek.
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
                      {/* e-Arşiv PDF Paraşüt'ten kesiliyor; müşteriye otomatik e-posta ile gönderiliyor.
                          Self-servis indirme endpoint'i hazır olunca aktifleşecek — sahte indirme yok. */}
                      <span
                        title="E-Arşiv faturanız siparişiniz kargolandığında e-posta adresinize gönderilir."
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium border border-paper-200 text-ink-400 cursor-not-allowed"
                      >
                        <Download size={12} weight="bold" /> E-posta ile gönderildi
                      </span>
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
          Tüm faturalarınız Paraşüt üzerinden otomatik kesilir ve e-postanıza gönderilir.
          Kurumsal faturalar için bilgilerim sayfasından vergi numarası ve vergi dairesi
          bilgilerinizi güncelleyin.
        </p>
      </div>
    </div>
  );
}
