"use client";

import { useState } from "react";
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

const round2 = (n: number) => Math.round((Number(n) || 0) * 100) / 100;

function Satir({ label, value, eksi }: { label: string; value: string; eksi?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <dt className="text-ink-700">{label}</dt>
      <dd className={eksi ? "text-warning" : "text-ink-900"}>{value}</dd>
    </div>
  );
}

/** Ara toplam satırı — zincirin nerede toplandığını gözle ayırır. */
function Ara({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4 border-t border-paper-200 pt-2 font-semibold text-ink-900">
      <dt>{label}</dt>
      <dd>{value}</dd>
    </div>
  );
}

export function ProfitClient({ data, days }: { data: AdminProfitDto; days: number | null }) {
  const { toplam, urunler, aylik, kapsam, mutabakat } = data;
  // Şelale HEP tutsun diye KDV farktan türetilir (DB'deki vat toplamı yuvarlamadan
  // 1 kuruş sapabiliyor ve ekranda tutmuyordu).
  const kdvPayi = round2(mutabakat.tahsilEdilen - mutabakat.kargo - toplam.ciro);
  const kapsananCiro = round2(toplam.ciro - toplam.maliyetiBilinmeyenCiro);
  const maliyetsizPay =
    toplam.ciro > 0 ? ((toplam.maliyetiBilinmeyenCiro / toplam.ciro) * 100).toFixed(1) : "";
  /**
   * KDV GÖRÜNÜMÜ (2026-09-02, Hasan istedi) — yalnız CİRO rakamlarını etkiler.
   *
   * API her zaman KDV HARİÇ döner; çevrim burada, gösterim katmanında yapılır.
   * Tek kaynak bozulmasın diye sunucuya ikinci bir hesap eklenmedi.
   *
   * KÂR VE MALİYET ÇEVRİLMEZ. Tahsil edilen KDV devlete ödenir, gelir değildir;
   * kârı 1,2 ile çarpmak kârı %20 fazla gösterirdi. Maliyet zaten KDV hariç
   * tutuluyor (pricing: satış = maliyet × kur × marj × (1+KDV)), dolayısıyla
   * kâr = ciro_hariç − maliyet bazı doğru olan tek bazdır.
   */
  const [kdvDahil, setKdvDahil] = useState(false);
  const KDV_ORANI = 1.2;
  /** Ciro tutarını seçili görünüme çevirir. Yalnız ciro için kullanılır. */
  const c = (n: number) => (kdvDahil ? round2(n * KDV_ORANI) : n);
  const ciroEtiketi = kdvDahil ? "Ciro (KDV dahil, kargo hariç)" : "Net ciro (KDV ve kargo hariç)";

  const enIyi = urunler.filter((u) => u.kar !== null).slice(0, 8);
  const maliyetsiz = urunler.filter((u) => u.kar === null);
  // Aylık grafik için ölçek — en yüksek ciro 100% kabul edilir.
  const maxAy = Math.max(1, ...aylik.map((a) => c(a.ciro)));

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
            Buradaki ciro <strong>bize kalan</strong> tutardır: KDV ve kargo çıkarılmış,
            indirimler düşülmüştür. Paneldeki “Toplam Ciro” ise müşterinin{" "}
            <strong>ödediği</strong> tutardır (KDV + kargo dahil) — ikisi farklı şeyleri
            ölçer, aşağıdaki tabloda adım adım bağlanıyor.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-1.5">
          {/*
            KDV görünümü — Hasan: "orası KDV dahil göstersin, yanına bir buton
            ekleyelim". Yalnız CİRO rakamlarını çevirir; kâr/maliyet KDV hariç kalır
            (tahsil edilen KDV devlete ödenir, gelir değildir).
          */}
          <div className="mr-2 inline-flex rounded-full border border-paper-200 bg-paper-50 p-0.5">
            <button
              type="button"
              onClick={() => setKdvDahil(false)}
              aria-pressed={!kdvDahil}
              className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                !kdvDahil ? "bg-ink-900 text-paper-50" : "text-ink-500 hover:text-ink-900"
              }`}
            >
              KDV hariç
            </button>
            <button
              type="button"
              onClick={() => setKdvDahil(true)}
              aria-pressed={kdvDahil}
              className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                kdvDahil ? "bg-ink-900 text-paper-50" : "text-ink-500 hover:text-ink-900"
              }`}
            >
              KDV dahil
            </button>
          </div>
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
        <Kpi label={ciroEtiketi} value={TL(c(toplam.ciro))} icon={<TrendUp size={18} />} tone="text-brand-700" />
        <Kpi label="Maliyet" value={TL(toplam.maliyet)} icon={<Coins size={18} />} tone="text-ink-700" />
        <Kpi label="Kâr" value={TL(toplam.kar)} icon={<ChartPieSlice size={18} />} tone="text-success" big />
        <Kpi
          label="Kâr marjı"
          value={toplam.marjYuzde === null ? "-" : `%${toplam.marjYuzde.toFixed(1)}`}
          icon={<ChartPieSlice size={18} />}
          tone="text-success"
        />
      </div>

      {kdvDahil && (
        <p className="mt-3 rounded-lg border border-brand-500/25 bg-brand-50/50 px-3 py-2 text-xs text-ink-700">
          <strong className="text-ink-900">Ciro rakamları KDV dahil gösteriliyor.</strong>{" "}
          Maliyet ve kâr KDV hariç kalır — tahsil ettiğiniz KDV devlete ödenir, gelir
          değildir. Kârı KDV ile çarpmak kârınızı olduğundan %20 fazla gösterirdi.
        </p>
      )}

      {/*
        ŞELALE — panelin "Toplam Ciro"sundan kâra kadar her adım görünür.
        Neden gerekli (Hasan: "hâlâ tutarsız"): KPI kutularında
        Ciro − Maliyet = 9.058,72 çıkıyor ama Kâr 1.963,99 yazıyordu. Aradaki
        fark, maliyeti girilmemiş ürünlerin cirosunun kâr hesabına KATILMAMASI.
        Bu ekranda görünmediği için sayfa bozuk sanılıyordu.

        KDV satırı DB'deki vat toplamından değil, farktan türetilir: yuvarlama
        yüzünden 1 kuruş sapma olabiliyor ve şelale gözle tutmuyordu.
      */}
      <section className="mt-4 rounded-xl border border-paper-200 bg-paper-50 p-4">
        <h2 className="text-sm font-semibold text-ink-900">
          Panelden kâra: rakam nereden nereye gidiyor?
        </h2>
        <dl className="mt-3 space-y-1.5 text-sm">
          <Satir label="Ürün ara toplamı (KDV dahil, indirim öncesi)" value={TL(mutabakat.urunAraToplam)} />
          <Satir label="İndirimler (kupon, kurumsal, puan, havale)" value={`− ${TL(mutabakat.indirim)}`} eksi />
          <Satir label="Kargo bedeli" value={`+ ${TL(mutabakat.kargo)}`} />
          <Ara label="Panelde görünen Toplam Ciro" value={TL(mutabakat.tahsilEdilen)} />

          <Satir label="Kargo bedeli (kâra katılmaz — kargo gideri sistemde yok)" value={`− ${TL(mutabakat.kargo)}`} eksi />
          <Satir label="KDV (devlete ait, kâr değil)" value={`− ${TL(kdvPayi)}`} eksi />
          <Ara label="Ciro (KDV hariç, indirim düşülmüş)" value={TL(toplam.ciro)} />

          <Satir
            label={`Maliyeti girilmemiş ürünlerin cirosu${maliyetsizPay ? ` (%${maliyetsizPay})` : ""}`}
            value={`− ${TL(toplam.maliyetiBilinmeyenCiro)}`}
            eksi
          />
          <Ara label="Kâr hesabına giren ciro" value={TL(kapsananCiro)} />
          <Satir label="Maliyet" value={`− ${TL(toplam.maliyet)}`} eksi />
          <div className="flex items-center justify-between gap-4 border-t-2 border-ink-900 pt-2 text-base font-semibold text-success">
            <dt>Kâr</dt>
            <dd>{TL(toplam.kar)}</dd>
          </div>
        </dl>
        <p className="mt-3 text-xs text-ink-500">
          {mutabakat.siparisSayisi} sipariş üzerinden. Kâr kutusu bu zincirin son
          satırıdır — “Ciro − Maliyet” değildir, çünkü maliyeti girilmemiş ürünler
          hesaba katılmaz.
        </p>
      </section>

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
              %100 kâr gösterirdi, bilerek hesaplamadık. Aşağıdaki listeden görebilirsiniz.
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
                      <td className="px-3 py-2.5 text-right tabular-nums text-ink-700">{TL(c(u.ciro))}</td>
                      <td className="px-3 py-2.5 text-right tabular-nums text-ink-500">{TL(u.maliyet)}</td>
                      <td className="px-3 py-2.5 text-right tabular-nums font-semibold text-success">
                        {TL(u.kar ?? 0)}
                      </td>
                      <td className="px-4 py-2.5 text-right tabular-nums text-ink-700">
                        {u.marjYuzde === null ? "-" : `%${u.marjYuzde.toFixed(1)}`}
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
                      {TL(c(a.ciro))}
                      {a.kar !== null && (
                        <span className="ml-2 text-success font-medium">kâr {TL(a.kar)}</span>
                      )}
                    </span>
                  </div>
                  {/* Ciro çubuğu; içindeki koyu kısım kâr payı. */}
                  <div className="h-2 rounded-full bg-paper-200 overflow-hidden">
                    <div
                      className="h-full bg-brand-500/40"
                      style={{ width: `${(c(a.ciro) / maxAy) * 100}%` }}
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
                  <span className="tabular-nums text-ink-500">{TL(c(u.ciro))} ciro</span>
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
        {kapsam.not} Maliyet, <strong>siparişin verildiği anda</strong> kaleme kaydedilir
        (24.08.2026 öncesi siparişlere o günkü maliyet tek seferlik yazıldı); sonradan yapılan
        maliyet güncellemeleri geçmiş kârı değiştirmez, yalnız yeni siparişlere yansır.
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
