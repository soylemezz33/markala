"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Buildings, ArrowDown, ArrowUp, Wallet, Info } from "@phosphor-icons/react";
import { Button, Price } from "@markala/ui";
import { useAuthStore } from "@/lib/auth-store";
import { apiClient, withRefresh } from "@/lib/api";
import { formatDate } from "@/lib/format";
import type { LedgerStatementDto } from "@markala/api-client";

/**
 * Cari Hesabım — kurumsal müşterinin açık hesap (cari) ekstresi.
 * GET /users/me/ledger → { balance, entries[] }. Pozitif bakiye = Markala'ya borç.
 * Borç (debit) = açık hesaba yazılan siparişler; alacak/ödeme (credit) = tahsilatlar.
 */
export default function CorporateLedgerPage() {
  const user = useAuthStore((s) => s.user);
  const isBootstrapping = useAuthStore((s) => s.isBootstrapping);
  const [statement, setStatement] = useState<LedgerStatementDto | null>(null); // null = yükleniyor
  const [error, setError] = useState(false);

  useEffect(() => {
    if (isBootstrapping || !user) return;
    let cancelled = false;
    setStatement(null);
    setError(false);
    withRefresh(() => apiClient.corporateLedger.mine())
      .then((data) => { if (!cancelled) setStatement(data ?? { balance: 0, entries: [] }); })
      .catch(() => { if (!cancelled) { setStatement({ balance: 0, entries: [] }); setError(true); } });
    return () => { cancelled = true; };
  }, [user, isBootstrapping]);

  const balance = Number(statement?.balance ?? 0);
  const entries = statement?.entries ?? [];

  return (
    <div className="space-y-6">
      <header>
        <h2 className="text-xl md:text-2xl font-semibold text-ink-900 flex items-center gap-2">
          <Buildings size={24} weight="bold" className="text-brand-700" />
          Cari Hesabım
        </h2>
        <p className="mt-1 text-sm text-ink-500">
          Açık hesap (cari) bakiyeniz ve hesap ekstreniz. Açık hesaba yazılan siparişler borç,
          tahsilatlar ise alacak olarak listelenir.
        </p>
      </header>

      {/* Bakiye kartı */}
      <div className="p-6 bg-ink-900 text-paper-50 rounded-xl flex items-center justify-between gap-4">
        <div>
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-brand-400">
            <Wallet size={14} weight="fill" /> Güncel Bakiye
          </span>
          <div className="mt-2 text-3xl md:text-4xl font-semibold tabular-nums">
            <Price amount={balance} className="text-paper-50" />
          </div>
          <p className="mt-1.5 text-sm text-paper-100/70">
            {balance > 0
              ? "Ödenmesi gereken açık hesap borcunuz."
              : balance < 0
                ? "Lehinize alacak bakiyeniz var."
                : "Açık hesabınızda borç bulunmuyor."}
          </p>
        </div>
        <div className="hidden sm:grid w-14 h-14 rounded-full bg-paper-50/10 place-items-center flex-none">
          <Buildings size={28} />
        </div>
      </div>

      {statement === null ? (
        <div className="space-y-3">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-14 bg-paper-100 border border-paper-200 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : error ? (
        <div className="text-center py-16 bg-paper-50 border border-paper-200 rounded-xl">
          <h3 className="font-semibold text-ink-900 text-lg">Cari hesap yüklenemedi</h3>
          <p className="mt-2 text-sm text-ink-500">Bağlantı sorunu olabilir. Lütfen tekrar deneyin.</p>
          <Button className="mt-5" onClick={() => location.reload()}>Yenile</Button>
        </div>
      ) : entries.length === 0 ? (
        <div className="text-center py-16 bg-paper-50 border border-paper-200 rounded-xl">
          <div className="w-16 h-16 mx-auto rounded-full bg-paper-100 grid place-items-center text-ink-500">
            <Buildings size={28} />
          </div>
          <h3 className="mt-5 font-semibold text-ink-900 text-lg">Henüz cari hareketiniz yok</h3>
          <p className="mt-2 text-sm text-ink-500 max-w-md mx-auto">
            Açık hesaba yazılan bir siparişiniz olduğunda hareketleriniz burada listelenecek.
            Ödeme adımında <strong>“Açık hesaba yaz (cari)”</strong> seçeneğini kullanabilirsiniz.
          </p>
          <Link href="/urunler"><Button className="mt-5">Alışverişe Başla</Button></Link>
        </div>
      ) : (
        <div className="bg-paper-50 border border-paper-200 rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-paper-100/60 text-ink-500 text-xs uppercase tracking-wide">
                <tr>
                  <th className="text-left px-4 py-3 font-semibold">Tarih</th>
                  <th className="text-left px-4 py-3 font-semibold">Açıklama</th>
                  <th className="text-left px-4 py-3 font-semibold">Vade</th>
                  <th className="text-right px-4 py-3 font-semibold">Borç</th>
                  <th className="text-right px-4 py-3 font-semibold">Alacak</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-paper-200">
                {entries.map((e) => {
                  const amount = Number(e.amount);
                  const isDebit = e.kind === "debit";
                  return (
                    <tr key={e.id} className="hover:bg-paper-100/40">
                      <td className="px-4 py-3 text-ink-700 text-xs whitespace-nowrap">{formatDate(e.createdAt)}</td>
                      <td className="px-4 py-3 text-ink-900">
                        <span className="inline-flex items-center gap-1.5">
                          {isDebit
                            ? <ArrowUp size={14} weight="bold" className="text-error flex-none" />
                            : <ArrowDown size={14} weight="bold" className="text-success flex-none" />}
                          {e.description}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-ink-500 text-xs whitespace-nowrap">
                        {e.dueDate ? formatDate(e.dueDate) : "—"}
                      </td>
                      <td className="px-4 py-3 text-right tabular-nums font-medium">
                        {isDebit ? <span className="text-error">{amount.toLocaleString("tr-TR")} ₺</span> : <span className="text-ink-500">—</span>}
                      </td>
                      <td className="px-4 py-3 text-right tabular-nums font-medium">
                        {!isDebit ? <span className="text-success">{amount.toLocaleString("tr-TR")} ₺</span> : <span className="text-ink-500">—</span>}
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
          <Info size={16} className="text-brand-700" />
          Açık Hesap (Cari) Hakkında
        </h3>
        <p className="text-ink-700 leading-relaxed text-xs">
          Açık hesap, onaylı kurumsal müşterilerimize tanımlanan kredi limiti dahilinde, ödemeyi vade
          sonunda yapma imkânıdır. Sipariş tutarı anında cari hesabınıza borç olarak işlenir; tahsilatlar
          ekibimiz tarafından hesabınıza alacak olarak girilir. Limit ve vade koşullarınız için müşteri
          temsilcinizle iletişime geçebilirsiniz.
        </p>
      </div>
    </div>
  );
}
