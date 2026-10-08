"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { AdminShell } from "@/components/admin-shell";
import { useServerPerms } from "@/components/perms-provider";
import { Package, ShoppingCart, Coins, CaretDown, CaretRight } from "@phosphor-icons/react";
import type { AdminUrunSatisDto } from "@markala/api-client";
import {
  useTableSort,
  SortTh,
  TableToolbar,
  aramaEslesir,
  type SortAccessors,
} from "@/components/data-table";

const TL = (v: number) =>
  "₺ " + Number(v ?? 0).toLocaleString("tr-TR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const TARIH = (iso: string) =>
  new Date(iso).toLocaleDateString("tr-TR", { day: "2-digit", month: "2-digit", year: "numeric" });

const RANGES = [
  { label: "Son 30 gün", days: 30 },
  { label: "Son 90 gün", days: 90 },
  { label: "Son 1 yıl", days: 365 },
  { label: "Tümü", days: null as number | null },
];

type UrunRow = AdminUrunSatisDto["urunler"][number];
type SatisSort = "urun" | "siparis" | "adet" | "ciro" | "ilk" | "son";
const SATIS_ACCESSORS: SortAccessors<UrunRow, SatisSort> = {
  urun: (u) => u.productName,
  siparis: (u) => u.siparis,
  adet: (u) => u.adet,
  ciro: (u) => u.ciro,
  ilk: (u) => new Date(u.ilkSatis),
  son: (u) => new Date(u.sonSatis),
};

export function UrunSatisClient({ data, days }: { data: AdminUrunSatisDto; days: number | null }) {
  const perms = useServerPerms();
  // null = izinler gelmedi → gizleme; API zaten FINANCE olmayana ciroyu 0 döner.
  const ciroGoster = perms === null || perms.includes("finance.manage");
  const [q, setQ] = useState("");
  const [acik, setAcik] = useState<Record<string, boolean>>({});

  const filtrelenmis = useMemo(
    () =>
      data.urunler.filter(
        (u) =>
          aramaEslesir(q, u.productName, u.productSlug) ||
          u.varyantlar.some((v) => aramaEslesir(q, v.ozet)),
      ),
    [data.urunler, q],
  );
  const { rows: liste, thProps } = useTableSort(filtrelenmis, SATIS_ACCESSORS, { key: "adet" });

  return (
    <AdminShell>
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-ink-900">Ürün Satışları</h1>
          <p className="mt-1 text-sm text-ink-500">
            Hangi üründen kaç adet, kaç siparişte satıldı. Yalnız <strong>gerçekleşen</strong>{" "}
            siparişler sayılır (ödenmiş veya cari; iptal ve silinmiş hariç) — dashboard ve Ciro &
            Kâr ile aynı küme. Adet, kalem adedidir: paket ürünlerde paket sayısı (örn. “1.000
            Adet” kartvizit paketi 1 sayılır); varyant satırı paketi gösterir.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-1.5">
          {RANGES.map((r) => {
            const active = r.days === days;
            return (
              <Link
                key={r.label}
                href={r.days ? `/urun-satislari?days=${r.days}` : "/urun-satislari"}
                className={`rounded-full px-3 py-1 text-xs font-medium border transition-colors ${
                  active
                    ? "bg-ink-900 text-paper-50 border-ink-900"
                    : "bg-paper-50 text-ink-700 border-paper-200 hover:border-ink-300"
                }`}
              >
                {r.label}
              </Link>
            );
          })}
        </div>
      </div>

      <div className={`mb-6 grid gap-3 ${ciroGoster ? "sm:grid-cols-4" : "sm:grid-cols-3"}`}>
        <Kpi label="Ürün çeşidi" value={String(data.urunSayisi)} icon={<Package size={16} />} />
        <Kpi label="Sipariş" value={String(data.siparis)} icon={<ShoppingCart size={16} />} />
        <Kpi label="Satılan adet" value={data.adet.toLocaleString("tr-TR")} icon={<Package size={16} />} />
        {ciroGoster && (
          <Kpi label="Ciro (KDV dahil, kalem toplamı)" value={TL(data.ciro)} icon={<Coins size={16} />} />
        )}
      </div>

      <section className="bg-paper-50 border border-paper-200 rounded-lg overflow-hidden">
        <TableToolbar
          search={{
            id: "urun-satis-ara",
            value: q,
            onChange: setQ,
            placeholder: "Ürün veya varyant ara…",
            className: "w-64",
          }}
          count={{ gosterilen: liste.length, toplam: data.urunler.length, birim: "ürün" }}
          onClear={q ? () => setQ("") : null}
        />
        {liste.length === 0 ? (
          <p className="px-4 py-10 text-center text-sm text-ink-500">
            {data.urunler.length === 0 ? "Bu aralıkta gerçekleşen satış yok." : "Aramayla eşleşen ürün yok."}
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-paper-100 text-ink-500 text-xs">
                  <th className="w-8 px-2 py-2" aria-label="Varyantlar" />
                  <SortTh sortKey="urun" {...thProps} className="text-left font-medium px-3 py-2">Ürün</SortTh>
                  <SortTh sortKey="siparis" {...thProps} align="right" className="text-right font-medium px-3 py-2">Sipariş</SortTh>
                  <SortTh sortKey="adet" {...thProps} align="right" className="text-right font-medium px-3 py-2">Adet</SortTh>
                  {ciroGoster && (
                    <SortTh sortKey="ciro" {...thProps} align="right" className="text-right font-medium px-3 py-2">Ciro</SortTh>
                  )}
                  <SortTh sortKey="ilk" {...thProps} align="right" className="text-right font-medium px-3 py-2">İlk satış</SortTh>
                  <SortTh sortKey="son" {...thProps} align="right" className="text-right font-medium px-3 py-2">Son satış</SortTh>
                </tr>
              </thead>
              <tbody>
                {liste.map((u) => {
                  const o = !!acik[u.productSlug];
                  const tekVaryant = u.varyantlar.length === 1 ? u.varyantlar[0] : null;
                  return (
                    <RowGroup key={u.productSlug}>
                      <tr className="border-t border-paper-200">
                        <td className="px-2 py-2.5 text-ink-400">
                          <button
                            type="button"
                            onClick={() => setAcik((s) => ({ ...s, [u.productSlug]: !o }))}
                            aria-expanded={o}
                            aria-label={o ? "Varyantları gizle" : "Varyantları göster"}
                            className="rounded p-0.5 hover:bg-paper-200 hover:text-ink-900"
                          >
                            {o ? <CaretDown size={14} /> : <CaretRight size={14} />}
                          </button>
                        </td>
                        <td className="px-3 py-2.5 text-ink-900">
                          <Link
                            href={`/urunler?q=${encodeURIComponent(u.productSlug)}`}
                            className="hover:underline"
                          >
                            {u.productName}
                          </Link>
                          {tekVaryant && (
                            <span className="ml-2 text-xs text-ink-500">{tekVaryant.ozet}</span>
                          )}
                          {!tekVaryant && (
                            <span className="ml-2 text-xs text-ink-500">{u.varyantlar.length} varyant</span>
                          )}
                        </td>
                        <td className="px-3 py-2.5 text-right tabular-nums text-ink-700">{u.siparis}</td>
                        <td className="px-3 py-2.5 text-right tabular-nums font-semibold text-ink-900">
                          {u.adet.toLocaleString("tr-TR")}
                        </td>
                        {ciroGoster && (
                          <td className="px-3 py-2.5 text-right tabular-nums text-ink-700">{TL(u.ciro)}</td>
                        )}
                        <td className="px-3 py-2.5 text-right tabular-nums text-ink-500">{TARIH(u.ilkSatis)}</td>
                        <td className="px-3 py-2.5 text-right tabular-nums text-ink-500">{TARIH(u.sonSatis)}</td>
                      </tr>
                      {o &&
                        u.varyantlar.map((v) => (
                          <tr key={v.ozet} className="bg-paper-100/60 text-xs">
                            <td />
                            <td className="px-3 py-1.5 pl-8 text-ink-700">{v.ozet}</td>
                            <td className="px-3 py-1.5 text-right tabular-nums text-ink-500">{v.siparis}</td>
                            <td className="px-3 py-1.5 text-right tabular-nums text-ink-700">
                              {v.adet.toLocaleString("tr-TR")}
                            </td>
                            {ciroGoster && (
                              <td className="px-3 py-1.5 text-right tabular-nums text-ink-500">{TL(v.ciro)}</td>
                            )}
                            <td colSpan={2} />
                          </tr>
                        ))}
                    </RowGroup>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <p className="mt-4 text-xs text-ink-500 leading-relaxed">
        Ciro, kalemin KDV dahil tutarıdır; kupon ve havale indirimi gibi sipariş seviyesi
        indirimler düşülmemiştir. Kâr ve KDV hariç ciro için{" "}
        <Link href="/ciro" className="text-brand-700 hover:underline">
          Ciro &amp; Kâr
        </Link>{" "}
        sayfasına bakın. Kampanya paketi kalemleri ürün bağlantısı olmadan, paket adıyla listelenir.
      </p>
    </AdminShell>
  );
}

/** Tablo gövdesinde ana satır + varyant satırlarını tek anahtar altında tutar. */
function RowGroup({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

function Kpi({ label, value, icon }: { label: string; value: string; icon: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-paper-200 bg-paper-50 p-4">
      <div className="flex items-center gap-1.5 text-xs font-medium text-ink-500">
        {icon}
        {label}
      </div>
      <p className="mt-1.5 text-xl tabular-nums font-semibold text-ink-900">{value}</p>
    </div>
  );
}
