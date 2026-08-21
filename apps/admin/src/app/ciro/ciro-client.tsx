"use client";

import Link from "next/link";
import { AdminShell } from "@/components/admin-shell";
import {
  TrendUp,
  Coins,
  ChartPieSlice,
  Warning,
  ArrowLeft,
  Package,
} from "@phosphor-icons/react";
import type { AdminProfitDto } from "@markala/api-client";

const TL = (v: number) =>
  "₺ " + Number(v ?? 0).toLocaleString("tr-TR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const RANGES = [
  { label: "Son 30 gün", days: 30 },
  { label: "Son 90 gün", days: 90 },
  { label: "Son 1 yıl", days: 365 },
  { label: "Tümü", days: null as number | null },
];

export function ProfitClient({ data, days }: { data: AdminProfitDto; days: number | null }) {
  const { toplam, urunler, aylik, kapsam } = data;
  const enIyi = urunler.filter((u) => u.kar !== null).slice(0, 8);
  const maliyetsiz = urunler.filter((u) => u.kar === null);
  // Aylık grafik için ölçek — en yüksek ciro 100% kabul edilir.
  const maxAy = Math.max(1, ...aylik.map((a) => a.ciro));

  return (
    <AdminShell>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs text-ink-500 hover:text-ink-900 mb-2"
          >
            <ArrowLeft size={14} /> Panele dön
          </Link>
          <h1 className="text-2xl font-semibold text-ink-900">Ciro & Kâr Analizi</h1>
          <p className="mt-1 text-sm text-ink-500">
            Ciro <strong>KDV hariçtir</strong>; kargo bedeli kâra dahil edilmez.
          </p>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {RANGES.map((r) => {
            const active = r.days === days;
            return (
              <Link
                key={r.label}
                href={r.days ? `/ciro?days=${r.days}` : "/ciro"}
                className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                  active
                    ? "bg-ink-900 text-paper-50 border-ink-900"
                    : "border-paper-200 text-ink-700 hover:border-ink-300"
                }`}
              >
                {r.label}
              </Link>
            );
          })}
        </div>
      </div>

      {/* KPI şeridi */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 mb-6">
        <Kpi label="Ciro (KDV hariç)" value={TL(toplam.ciro)} icon={<TrendUp size={18} />} tone="text-brand-700" />
        <Kpi label="Maliyet" value={TL(toplam.maliyet)} icon={<Coins size={18} />} tone="text-ink-700" />
        <Kpi label="Kâr" value={TL(toplam.kar)} icon={<ChartPieSlice size={18} />} tone="text-success" big />
        <Kpi
          label="Kâr marjı"
          value={toplam.marjYuzde === null ? "—" : `%${toplam.marjYuzde.toFixed(1)}`}
          icon={<ChartPieSlice size={18} />}
          tone="text-success"
        />
      </div>

      {/* Maliyeti girilmemiş ciro uyarısı — sessizce %100 kâr göstermemek için ŞART. */}
      {toplam.maliyetiBilinmeyenCiro > 0 && (
        <div className="mb-6 flex items-start gap-3 rounded-lg border border-warning/30 bg-warning/5 px-4 py-3">
          <Warning size={18} className="text-warning flex-none mt-0.5" />
          <div className="text-sm">
            <p className="font-medium text-ink-900">
              {TL(toplam.maliyetiBilinmeyenCiro)} tutarındaki ciro kâr hesabına katılmadı
            </p>
            <p className="mt-0.5 text-ink-600">
              Bu ürünlerin maliyeti sisteme girilmemiş. Maliyet 0 sayılsaydı sayfa size
              %100 kâr gösterirdi — bilerek hesaplamadık. Aşağıdaki listeden görebilirsiniz.
            </p>
          </div>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        {/* En çok kazandıranlar */}
        <section className="lg:col-span-2 bg-paper-50 border border-paper-200 rounded-lg overflow-hidden">
          <header className="px-4 py-3 border-b border-paper-200">
            <h2 className="text-sm font-semibold text-ink-900">En çok kazandıran ürünler</h2>
          </header>
          {enIyi.length === 0 ? (
            <p className="px-4 py-8 text-center text-sm text-ink-500">
              Bu aralıkta kârı hesaplanabilen satış yok.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-paper-100 text-ink-500 text-xs">
                    <th className="text-left font-medium px-4 py-2">Ürün</th>
                    <th className="text-right font-medium px-3 py-2">Adet</th>
                    <th className="text-right font-medium px-3 py-2">Ciro</th>
                    <th className="text-right font-medium px-3 py-2">Maliyet</th>
                    <th className="text-right font-medium px-3 py-2">Kâr</th>
                    <th className="text-right font-medium px-4 py-2">Marj</th>
                  </tr>
                </thead>
                <tbody>
                  {enIyi.map((u) => (
                    <tr key={u.productSlug} className="border-t border-paper-200">
                      <td className="px-4 py-2.5 text-ink-900">{u.productName}</td>
                      <td className="px-3 py-2.5 text-right tabular-nums text-ink-700">{u.adet}</td>
                      <td className="px-3 py-2.5 text-right tabular-nums text-ink-700">{TL(u.ciro)}</td>
                      <td className="px-3 py-2.5 text-right tabular-nums text-ink-500">{TL(u.maliyet)}</td>
                      <td className="px-3 py-2.5 text-right tabular-nums font-semibold text-success">
                        {TL(u.kar ?? 0)}
                      </td>
                      <td className="px-4 py-2.5 text-right tabular-nums text-ink-700">
                        {u.marjYuzde === null ? "—" : `%${u.marjYuzde.toFixed(1)}`}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {/* Aylık seyir — bağımlılık eklememek için saf CSS çubuk grafik */}
        <section className="bg-paper-50 border border-paper-200 rounded-lg overflow-hidden">
          <header className="px-4 py-3 border-b border-paper-200">
            <h2 className="text-sm font-semibold text-ink-900">Aylık seyir</h2>
          </header>
          {aylik.length === 0 ? (
            <p className="px-4 py-8 text-center text-sm text-ink-500">Veri yok.</p>
          ) : (
            <ul className="p-4 space-y-3">
              {aylik.map((a) => (
                <li key={a.ay}>
                  <div className="flex items-baseline justify-between text-xs mb-1">
                    <span className="text-ink-700">{a.ay}</span>
                    <span className="tabular-nums text-ink-500">
                      {TL(a.ciro)}
                      {a.kar !== null && (
                        <span className="ml-2 text-success font-medium">kâr {TL(a.kar)}</span>
                      )}
                    </span>
                  </div>
                  {/* Ciro çubuğu; içindeki koyu kısım kâr payı. */}
                  <div className="h-2 rounded-full bg-paper-200 overflow-hidden">
                    <div
                      className="h-full bg-brand-500/40"
                      style={{ width: `${(a.ciro / maxAy) * 100}%` }}
                    >
                      <div
                        className="h-full bg-success"
                        style={{ width: a.kar && a.ciro > 0 ? `${(a.kar / a.ciro) * 100}%` : "0%" }}
                      />
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      {/* Maliyeti girilmemiş ürünler — eylem listesi */}
      {maliyetsiz.length > 0 && (
        <section className="mt-6 bg-paper-50 border border-paper-200 rounded-lg overflow-hidden">
          <header className="px-4 py-3 border-b border-paper-200 flex items-center gap-2">
            <Package size={16} className="text-warning" />
            <h2 className="text-sm font-semibold text-ink-900">
              Maliyeti girilmemiş ürünler ({maliyetsiz.length})
            </h2>
          </header>
          <ul className="divide-y divide-paper-200">
            {maliyetsiz.map((u) => (
              <li key={u.productSlug} className="px-4 py-2.5 flex items-center justify-between gap-3 text-sm">
                <span className="text-ink-900 min-w-0 truncate">{u.productName}</span>
                <span className="flex items-center gap-3 flex-none">
                  <span className="tabular-nums text-ink-500">{TL(u.ciro)} ciro</span>
                  <Link
                    href={`/urunler?q=${encodeURIComponent(u.productSlug)}`}
                    className="text-xs font-medium text-brand-700 hover:underline"
                  >
                    Maliyet gir →
                  </Link>
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}

      <p className="mt-6 text-xs text-ink-500 leading-relaxed">
        {kapsam.not} Maliyet, siparişin verildiği andaki değil ürünün <strong>güncel</strong>{" "}
        maliyetidir; maliyet güncellenirse geçmiş kâr da değişir.
        {kapsam.kalemSayisi > 0 && ` Bu rapor ${kapsam.kalemSayisi} sipariş kalemine dayanıyor.`}
      </p>
    </AdminShell>
  );
}

function Kpi({
  label,
  value,
  icon,
  tone,
  big,
}: {
  label: string;
  value: string;
  icon: React.ReactNode;
  tone: string;
  big?: boolean;
}) {
  return (
    <div
      className={`rounded-lg border p-4 ${
        big ? "border-success/30 bg-success/5" : "border-paper-200 bg-paper-50"
      }`}
    >
      <div className={`flex items-center gap-1.5 text-xs font-medium ${tone}`}>
        {icon}
        {label}
      </div>
      <p className={`mt-1.5 tabular-nums font-semibold text-ink-900 ${big ? "text-2xl" : "text-xl"}`}>
        {value}
      </p>
    </div>
  );
}
