"use client";

import { useEffect, useState } from "react";
import { Receipt, Download, FileText, Clock } from "@phosphor-icons/react";
import { Button } from "@markala/ui";
import { useAuthStore } from "@/lib/auth-store";
import { apiClient, withRefresh } from "@/lib/api";
import { formatDate } from "@/lib/format";
import type { Order } from "@markala/types";

/**
 * FATURALARIM (2026-09-11 yeniden): eskiden her sipariş için uydurma "EARSV-…" numarası ve
 * "E-posta ile gönderildi" rozeti basılıyordu; oysa Paraşüt'te yalnız taslak açılıyor, mail
 * gitmiyordu. Artık gerçek durum: belge no doluysa (kargoya verildikten sonra e-Arşiv/e-Fatura
 * resmileşti) PDF indirilir; değilse "Hazırlanıyor". Fatura kargo çıkışında kesilir.
 */
const normStatus = (s: unknown) => String(s ?? "").replace(/_/g, "-");

export default function InvoicesPage() {
  const user = useAuthStore((s) => s.user);
  const isBootstrapping = useAuthStore((s) => s.isBootstrapping);
  const [orders, setOrders] = useState<Order[] | null>(null); // null = yükleniyor
  const [error, setError] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);
  const [mesaj, setMesaj] = useState<string | null>(null);

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

  async function indir(o: Order) {
    setBusy(o.id);
    setMesaj(null);
    try {
      const blob = await withRefresh(() => apiClient.orders.invoicePdf(o.id));
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `Fatura-${o.invoiceNumber ?? o.orderNumber}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 10_000);
    } catch (e) {
      setMesaj((e as Error).message || "Fatura indirilemedi.");
    } finally {
      setBusy(null);
    }
  }

  // Fatura yalnız iptal olmayan, kargoya verilmiş/teslim edilmiş siparişler için kesilir;
  // henüz kargolanmamış siparişler de listede "kargo çıkışında kesilir" notuyla görünür.
  const paidOrders = (orders ?? []).filter((o) => normStatus(o.status) !== "iptal-edildi");

  return (
    <div className="space-y-6">
      <header>
        <h2 className="text-xl md:text-2xl font-semibold text-ink-900 flex items-center gap-2">
          <Receipt size={24} weight="bold" className="text-brand-700" />
          Faturalarım
        </h2>
        <p className="mt-1 text-sm text-ink-500">
          Faturanız siparişiniz kargoya verildiğinde e-Arşiv (kurumsal e-Fatura mükellefleri için e-Fatura) olarak kesilir, e-postanıza gönderilir ve burada saklanır.
        </p>
      </header>

      {mesaj && (
        <div className="px-4 py-3 rounded-lg bg-amber-50 border border-amber-200 text-sm text-amber-900">{mesaj}</div>
      )}

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
            İlk siparişiniz kargoya verildiğinde faturanız bu listede görünecek.
          </p>
        </div>
      ) : (
        <div className="bg-paper-50 border border-paper-200 rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-paper-100/60 text-ink-500 text-xs uppercase tracking-wide">
                <tr>
                  <th className="text-left px-4 py-3 font-semibold">Belge No</th>
                  <th className="text-left px-4 py-3 font-semibold">Sipariş</th>
                  <th className="text-left px-4 py-3 font-semibold">Tarih</th>
                  <th className="text-right px-4 py-3 font-semibold">Tutar</th>
                  <th className="text-right px-4 py-3 font-semibold">Fatura</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-paper-200">
                {paidOrders.map((o) => {
                  const hazir = Boolean(o.invoiceNumber);
                  const kargolandi = ["kargoya-verildi", "teslim-edildi"].includes(normStatus(o.status));
                  return (
                    <tr key={o.id} className="hover:bg-paper-100/40">
                      <td className="px-4 py-3 font-mono text-xs font-semibold text-ink-900">
                        {hazir ? o.invoiceNumber : <span className="text-ink-400 font-sans font-normal">—</span>}
                      </td>
                      <td className="px-4 py-3 font-mono text-xs text-ink-700">{o.orderNumber}</td>
                      <td className="px-4 py-3 text-ink-700 text-xs">
                        {hazir && o.invoiceIssuedAt ? formatDate(o.invoiceIssuedAt) : formatDate(o.createdAt)}
                      </td>
                      <td className="px-4 py-3 text-right font-semibold tabular-nums">
                        ₺ {Number(o.total).toLocaleString("tr-TR")}
                      </td>
                      <td className="px-4 py-3 text-right">
                        {hazir ? (
                          <button
                            type="button"
                            onClick={() => indir(o)}
                            disabled={busy === o.id}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold border border-ink-900 text-ink-900 hover:bg-ink-900 hover:text-paper-50 transition-colors disabled:opacity-50"
                          >
                            <Download size={12} weight="bold" /> {busy === o.id ? "İndiriliyor…" : `PDF indir${o.invoiceType === "e_invoice" ? " (e-Fatura)" : ""}`}
                          </button>
                        ) : (
                          <span
                            title={kargolandi ? "Belge Paraşüt üzerinden hazırlanıyor; genellikle birkaç dakika içinde e-postanıza gelir." : "Fatura, siparişiniz kargoya verildiğinde kesilir."}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium border border-paper-200 text-ink-500"
                          >
                            <Clock size={12} weight="bold" /> {kargolandi ? "Hazırlanıyor" : "Kargo çıkışında kesilir"}
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <div className="p-5 bg-paper-100 border border-paper-200 rounded-xl text-sm">
        <h3 className="font-semibold text-ink-900 mb-2 flex items-center gap-2">
          <FileText size={16} className="text-brand-700" />
          Fatura bilgisi
        </h3>
        <p className="text-ink-700 leading-relaxed text-xs">
          Markala / 324 Ajans, Gelir İdaresi Başkanlığı'na kayıtlı e-Arşiv ve e-Fatura mükellefidir. Faturalar sipariş kargoya
          verildiğinde Paraşüt üzerinden kesilir, PDF olarak e-postanıza gönderilir ve bu sayfada saklanır. Vergi numarası
          GİB e-Fatura sisteminde kayıtlı kurumsal müşterilere e-Fatura, diğerlerine e-Arşiv fatura düzenlenir. Kurumsal fatura
          için bilgilerim sayfasından vergi numarası ve vergi dairesi girmeniz yeterlidir.
        </p>
      </div>
    </div>
  );
}
