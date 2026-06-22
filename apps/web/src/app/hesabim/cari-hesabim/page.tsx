"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Buildings, ArrowDown, ArrowUp, Wallet, Info, CreditCard, CheckCircle, WarningCircle } from "@phosphor-icons/react";
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
  const [payAmount, setPayAmount] = useState("");
  const [paying, setPaying] = useState(false);
  const [payError, setPayError] = useState<string | null>(null);
  // iyzico callback dönüşü: ?odeme=basarili | hata → tek seferlik bildirim.
  const [notice, setNotice] = useState<"basarili" | "hata" | null>(null);

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

  // Ödeme dönüşü bildirimi (URL'den oku, sonra parametreyi temizle).
  useEffect(() => {
    const p = new URLSearchParams(window.location.search).get("odeme");
    if (p === "basarili" || p === "hata") {
      setNotice(p);
      window.history.replaceState(null, "", "/hesabim/cari-hesabim");
    }
  }, []);

  const balance = Number(statement?.balance ?? 0);
  const entries = statement?.entries ?? [];

  async function handlePayDebt() {
    setPayError(null);
    const amt = Math.round(Number(payAmount.replace(",", ".")) * 100) / 100;
    if (!Number.isFinite(amt) || amt <= 0) return setPayError("Geçerli bir tutar girin.");
    if (amt > balance) return setPayError(`Tutar borcunuzu (${balance.toLocaleString("tr-TR")} ₺) aşamaz.`);
    setPaying(true);
    try {
      const res = await withRefresh(() => apiClient.payments.cariInit(amt));
      if (res?.paymentPageUrl) {
        window.location.href = res.paymentPageUrl; // iyzico hosted ödeme sayfası
        return;
      }
      setPayError("Ödeme başlatılamadı, lütfen tekrar deneyin.");
      setPaying(false);
    } catch (e) {
      setPayError((e as { message?: string })?.message ?? "Ödeme başlatılamadı, lütfen tekrar deneyin.");
      setPaying(false);
    }
  }

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

      {/* Ödeme dönüşü bildirimi */}
      {notice === "basarili" && (
        <div className="flex items-center gap-2 p-4 bg-success/10 border border-success/30 rounded-xl text-sm text-success font-medium">
          <CheckCircle size={18} weight="fill" /> Ödemeniz alındı. Cari hesabınıza işlendi; bakiyeniz güncellendi.
        </div>
      )}
      {notice === "hata" && (
        <div className="flex items-center gap-2 p-4 bg-error/10 border border-error/30 rounded-xl text-sm text-error font-medium">
          <WarningCircle size={18} weight="fill" /> Ödeme tamamlanmadı. Tutar tahsil edilmediyse tekrar deneyebilirsiniz.
        </div>
      )}

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

      {/* Borç öde — yalnız ödenecek borç (pozitif bakiye) varsa. Serbest/kısmi tutar, kartla online. */}
      {balance > 0 && (
        <div className="p-5 bg-paper-50 border border-paper-200 rounded-xl">
          <h3 className="font-semibold text-ink-900 flex items-center gap-2">
            <CreditCard size={18} weight="bold" className="text-brand-700" /> Borç Öde (Kartla)
          </h3>
          <p className="mt-1 text-sm text-ink-500">
            Borcunuzun tamamını veya bir kısmını online kartla ödeyebilirsiniz. Tutar girip
            “Kartla Öde” deyin; güvenli iyzico ödeme sayfasına yönlendirilirsiniz.
          </p>
          <div className="mt-4 flex flex-col sm:flex-row gap-3 sm:items-end">
            <label className="block flex-1">
              <span className="text-xs text-ink-500">Ödenecek tutar (₺)</span>
              <input
                type="number"
                min={0}
                max={balance}
                step={0.01}
                value={payAmount}
                onChange={(e) => { setPayAmount(e.target.value); setPayError(null); }}
                placeholder={balance.toLocaleString("tr-TR")}
                className="mt-1 w-full px-4 py-2.5 rounded-lg border border-paper-200 bg-paper-50 text-ink-900 text-sm tabular-nums focus:border-ink-900 focus:outline-none focus:ring-2 focus:ring-brand-300/30"
              />
            </label>
            <button
              type="button"
              onClick={() => setPayAmount(String(balance))}
              className="text-xs text-brand-700 hover:underline self-start sm:self-auto sm:pb-3"
            >
              Tümünü öde ({balance.toLocaleString("tr-TR")} ₺)
            </button>
            <Button onClick={handlePayDebt} disabled={paying}>
              <CreditCard size={16} weight="bold" /> {paying ? "Yönlendiriliyor…" : "Kartla Öde"}
            </Button>
          </div>
          {payError && <p className="mt-2 text-sm text-error">{payError}</p>}
        </div>
      )}

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
