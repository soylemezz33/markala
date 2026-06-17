"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AdminShell } from "@/components/admin-shell";
import { toast } from "@/components/toast";
import {
  Users, Eye, ShoppingCart, Package, CursorClick, TrendUp, Timer,
  Receipt, Info, DownloadSimple, Copy, ArrowRight, X, DeviceMobile,
  Funnel, Fire, ChartLine, UsersThree, Warning,
} from "@phosphor-icons/react";
import type {
  AnalyticsOverviewDto, AnalyticsSegment, AnalyticsSegmentResultDto,
  AnalyticsSegmentCustomer,
} from "@markala/api-client";

interface Props {
  overview: AnalyticsOverviewDto;
  days: number;
}

/* ---------- yardımcılar ---------- */

const trNum = (n: number) => n.toLocaleString("tr-TR");
const trCurrency = (n: number) =>
  `₺ ${n.toLocaleString("tr-TR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const msToSec = (ms: number) => (ms > 0 ? `${(ms / 1000).toFixed(1)} sn` : "—");
const pct = (n: number) => `%${n.toLocaleString("tr-TR", { maximumFractionDigits: 1 })}`;

/** tone → renk sınıfları (segment kartı ve rozetler) */
function toneClasses(tone?: string): { card: string; badge: string; dot: string } {
  switch (tone) {
    case "success":
      return { card: "border-success/30 bg-success/5", badge: "bg-success/10 text-success", dot: "bg-success" };
    case "warning":
      return { card: "border-warning/30 bg-warning/5", badge: "bg-warning/10 text-warning", dot: "bg-warning" };
    case "error":
      return { card: "border-error/30 bg-error/5", badge: "bg-error/10 text-error", dot: "bg-error" };
    case "info":
    default:
      return { card: "border-[#1565C0]/30 bg-[#1565C0]/5", badge: "bg-[#1565C0]/10 text-[#1565C0]", dot: "bg-[#1565C0]" };
  }
}

const DOW_LABELS = ["Pzt", "Sal", "Çar", "Per", "Cum", "Cmt", "Paz"]; // grid sırası (Pzt-Paz)
// dow 0=Pazar geliyor; grid'i Pzt başlatmak için 1..6,0 sırasına eşle.
const DOW_ORDER = [1, 2, 3, 4, 5, 6, 0];

/* ---------- ana bileşen ---------- */

export function AnalyticsClient({ overview, days }: Props) {
  const { kpis, collecting } = overview;

  const kpiCards = [
    { label: "Ziyaretçi (oturum)", value: trNum(kpis.sessions), icon: Users, color: "text-brand-700", visitor: true },
    { label: "Tekil ziyaretçi", value: trNum(kpis.uniqueVisitors), icon: UsersThree, color: "text-brand-700", visitor: true },
    { label: "Sayfa görüntüleme", value: trNum(kpis.pageViews), icon: Eye, color: "text-[#1565C0]", visitor: true },
    { label: "Ürün görüntüleme", value: trNum(kpis.productViews), icon: Package, color: "text-[#1565C0]", visitor: true },
    { label: "Sepete ekleme", value: trNum(kpis.addToCarts), icon: CursorClick, color: "text-warning", visitor: true },
    { label: "Dönüşüm", value: pct(kpis.conversionRate), icon: TrendUp, color: "text-success", visitor: true },
    { label: "Ort. inceleme süresi", value: msToSec(kpis.avgDwellMs), icon: Timer, color: "text-ink-700", visitor: true },
    { label: "Sipariş", value: trNum(kpis.orders), icon: ShoppingCart, color: "text-success", visitor: false },
  ];

  return (
    <AdminShell>
      <header className="mb-6 flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl md:text-3xl font-semibold text-ink-900">Ziyaretçi Analizi & CRM</h1>
          <p className="mt-1 text-ink-500 text-sm">
            Ziyaretçi davranışı, dönüşüm hunisi ve müşteri segmentleri — son {days} gün
          </p>
        </div>
        <DateRangePicker days={days} />
      </header>

      {/* CRM — segmentler her zaman dolu (sipariş/üye verisinden). En üstte, aksiyon odaklı. */}
      <CrmSection customers={overview.customers} />

      {/* "Veri toplanıyor" banner'ı — yalnızca ziyaretçi-davranış bölümlerinin üstünde. */}
      {collecting && (
        <div className="mb-4 flex items-start gap-3 p-4 rounded-lg border border-[#1565C0]/30 bg-[#1565C0]/5 text-sm text-ink-700">
          <Info size={18} weight="fill" className="flex-none mt-0.5 text-[#1565C0]" />
          <div>
            <p className="font-medium text-ink-900 mb-0.5">Ziyaretçi izleme yeni etkinleştirildi</p>
            <p className="text-xs leading-relaxed">
              Ürün görüntüleme / inceleme süresi verileri birkaç gün içinde dolacak.
              Müşteri segmentleri şimdiden hazır (yukarıda).
            </p>
          </div>
        </div>
      )}

      {/* KPI kartları */}
      <section className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 mb-6">
        {kpiCards.map((k) => (
          <div key={k.label} className="bg-paper-50 border border-paper-200 rounded-lg p-4 md:p-5">
            <div className="flex items-center justify-between text-ink-500">
              <span className="text-xs md:text-sm">{k.label}</span>
              <span className={k.color}><k.icon size={18} /></span>
            </div>
            <div className="mt-2 text-xl md:text-2xl font-semibold text-ink-900 tabular-nums">
              {collecting && k.visitor && k.value === "0" ? "—" : k.value}
            </div>
          </div>
        ))}
      </section>

      {/* Dönüşüm hunisi + Cihaz dağılımı */}
      <section className="grid lg:grid-cols-3 gap-4 mb-6">
        <div className="lg:col-span-2 bg-paper-50 border border-paper-200 rounded-lg p-5">
          <header className="flex items-center gap-2 mb-5">
            <Funnel size={18} weight="bold" className="text-brand-700" />
            <h2 className="font-semibold text-ink-900">Dönüşüm Hunisi</h2>
          </header>
          <FunnelChart stages={overview.funnel} />
        </div>
        <div className="bg-paper-50 border border-paper-200 rounded-lg p-5">
          <header className="flex items-center gap-2 mb-5">
            <DeviceMobile size={18} weight="bold" className="text-brand-700" />
            <h2 className="font-semibold text-ink-900">Cihaz Dağılımı</h2>
          </header>
          <DeviceBreakdown slices={overview.deviceBreakdown} />
        </div>
      </section>

      {/* Trafik & sipariş zaman grafiği */}
      <section className="bg-paper-50 border border-paper-200 rounded-lg p-5 mb-6">
        <header className="flex items-center gap-2 mb-5">
          <ChartLine size={18} weight="bold" className="text-brand-700" />
          <h2 className="font-semibold text-ink-900">Trafik & Sipariş</h2>
        </header>
        <TrafficChart points={overview.trafficByDay} />
      </section>

      {/* En çok incelenen ürünler */}
      <section className="bg-paper-50 border border-paper-200 rounded-lg overflow-hidden mb-6">
        <header className="px-5 py-4 border-b border-paper-200 flex items-center gap-2">
          <Eye size={18} weight="bold" className="text-brand-700" />
          <h2 className="font-semibold text-ink-900">En Çok İncelenen Ürünler</h2>
        </header>
        <TopProductsTable products={overview.topProducts} />
      </section>

      {/* Ziyaret zamanlaması ısı haritası */}
      <section className="bg-paper-50 border border-paper-200 rounded-lg p-5 mb-6">
        <header className="flex items-center gap-2 mb-1">
          <Fire size={18} weight="bold" className="text-brand-700" />
          <h2 className="font-semibold text-ink-900">Ziyaret Zamanlaması</h2>
        </header>
        <p className="text-xs text-ink-500 mb-5">
          Kayıtlı kullanıcıların hangi gün ve saatlerde ziyaret ettiğini gösterir.
        </p>
        <Heatmap cells={overview.visitHeatmap} />
      </section>
    </AdminShell>
  );
}

/* ---------- tarih aralığı seçici ---------- */

function DateRangePicker({ days }: { days: number }) {
  const opts = [7, 30, 90];
  return (
    <div className="inline-flex rounded-lg border border-paper-200 bg-paper-50 p-0.5">
      {opts.map((d) => (
        <Link
          key={d}
          href={`/analitik?days=${d}`}
          className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
            d === days ? "bg-ink-900 text-paper-50" : "text-ink-700 hover:bg-paper-100"
          }`}
        >
          {d} gün
        </Link>
      ))}
    </div>
  );
}

/* ---------- dönüşüm hunisi ---------- */

function FunnelChart({ stages }: { stages: AnalyticsOverviewDto["funnel"] }) {
  if (stages.length === 0) {
    return <p className="text-sm text-ink-400">Henüz huni verisi yok.</p>;
  }
  const max = Math.max(...stages.map((s) => s.count), 1);
  return (
    <div className="space-y-3">
      {stages.map((s, i) => {
        const widthPct = Math.max((s.count / max) * 100, 2);
        // bir önceki aşamaya göre düşüş %
        const prev = i > 0 ? stages[i - 1]?.count ?? null : null;
        const dropPct =
          prev && prev > 0 ? Math.round((1 - s.count / prev) * 100) : null;
        return (
          <div key={s.key}>
            <div className="flex items-center justify-between text-sm mb-1">
              <span className="text-ink-700">{s.label}</span>
              <span className="flex items-center gap-2">
                <span className="font-semibold text-ink-900 tabular-nums">{trNum(s.count)}</span>
                {dropPct !== null && (
                  <span
                    className={`text-[11px] tabular-nums ${dropPct > 0 ? "text-error" : "text-success"}`}
                  >
                    {dropPct > 0 ? `▼ %${dropPct}` : "—"}
                  </span>
                )}
              </span>
            </div>
            <div className="h-6 rounded bg-paper-100 overflow-hidden">
              <div
                className="h-full bg-brand-500 rounded transition-all flex items-center"
                style={{ width: `${widthPct}%` }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* ---------- cihaz dağılımı ---------- */

function DeviceBreakdown({ slices }: { slices: AnalyticsOverviewDto["deviceBreakdown"] }) {
  const total = slices.reduce((sum, s) => sum + s.count, 0);
  if (total === 0) {
    return <p className="text-sm text-ink-400">Henüz cihaz verisi yok.</p>;
  }
  const labelMap: Record<string, string> = {
    mobile: "Mobil",
    desktop: "Masaüstü",
    tablet: "Tablet",
  };
  return (
    <div className="space-y-3">
      {slices.map((s) => {
        const share = Math.round((s.count / total) * 100);
        return (
          <div key={s.device}>
            <div className="flex items-center justify-between text-sm mb-1">
              <span className="text-ink-700">{labelMap[s.device] ?? s.device}</span>
              <span className="font-semibold text-ink-900 tabular-nums">%{share}</span>
            </div>
            <div className="h-2.5 rounded-full bg-paper-100 overflow-hidden">
              <div className="h-full bg-brand-500 rounded-full" style={{ width: `${share}%` }} />
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* ---------- trafik & sipariş SVG çizgi grafik ---------- */

function TrafficChart({ points }: { points: AnalyticsOverviewDto["trafficByDay"] }) {
  if (points.length === 0) {
    return <p className="text-sm text-ink-400">Henüz trafik verisi yok.</p>;
  }
  const W = 720;
  const H = 200;
  const PAD = 28;
  const n = points.length;
  const maxSessions = Math.max(...points.map((p) => p.sessions), 1);
  const maxOrders = Math.max(...points.map((p) => p.orders), 1);

  const x = (i: number) => (n === 1 ? W / 2 : PAD + (i / (n - 1)) * (W - 2 * PAD));
  const ySess = (v: number) => H - PAD - (v / maxSessions) * (H - 2 * PAD);
  const yOrd = (v: number) => H - PAD - (v / maxOrders) * (H - 2 * PAD);

  const sessLine = points.map((p, i) => `${x(i)},${ySess(p.sessions)}`).join(" ");
  const ordLine = points.map((p, i) => `${x(i)},${yOrd(p.orders)}`).join(" ");

  // sadece birkaç tarih etiketi (ilk, orta, son) — kalabalık olmasın
  const tickIdx = n <= 1 ? [0] : [0, Math.floor((n - 1) / 2), n - 1];

  return (
    <div className="overflow-x-auto">
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full min-w-[480px] h-[200px]" role="img" aria-label="Trafik ve sipariş zaman grafiği">
        {/* yatay ızgara */}
        {[0.25, 0.5, 0.75, 1].map((f) => (
          <line
            key={f}
            x1={PAD}
            x2={W - PAD}
            y1={H - PAD - f * (H - 2 * PAD)}
            y2={H - PAD - f * (H - 2 * PAD)}
            stroke="currentColor"
            className="text-paper-200"
            strokeWidth={1}
          />
        ))}
        {/* sessions çizgisi */}
        <polyline points={sessLine} fill="none" stroke="#E0A82E" strokeWidth={2.5} className="text-brand-500" />
        {points.map((p, i) => (
          <circle key={`s${i}`} cx={x(i)} cy={ySess(p.sessions)} r={2.5} fill="#E0A82E" />
        ))}
        {/* orders çizgisi */}
        <polyline points={ordLine} fill="none" stroke="#1565C0" strokeWidth={2} strokeDasharray="4 3" />
        {points.map((p, i) => (
          <circle key={`o${i}`} cx={x(i)} cy={yOrd(p.orders)} r={2.5} fill="#1565C0" />
        ))}
        {/* x ekseni tarih etiketleri */}
        {tickIdx.map((i) => {
          const p = points[i];
          if (!p) return null;
          return (
            <text
              key={`t${i}`}
              x={x(i)}
              y={H - 6}
              textAnchor={i === 0 ? "start" : i === n - 1 ? "end" : "middle"}
              className="fill-ink-500"
              fontSize={10}
            >
              {formatDayLabel(p.date)}
            </text>
          );
        })}
      </svg>
      <div className="flex items-center gap-4 mt-2 text-xs text-ink-500">
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-0.5 bg-brand-500 rounded" /> Oturum
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-0.5 rounded" style={{ background: "#1565C0" }} /> Sipariş
        </span>
      </div>
    </div>
  );
}

function formatDayLabel(iso: string): string {
  // YYYY-MM-DD → GG.AA
  const parts = iso.split("-");
  return parts.length === 3 ? `${parts[2]}.${parts[1]}` : iso;
}

/* ---------- en çok incelenen ürünler ---------- */

function TopProductsTable({ products }: { products: AnalyticsOverviewDto["topProducts"] }) {
  if (products.length === 0) {
    return <p className="px-5 py-6 text-sm text-ink-400">Henüz ürün görüntüleme verisi yok.</p>;
  }
  const sorted = [...products].sort((a, b) => b.views - a.views);
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead className="bg-paper-100/60 text-ink-500 text-xs uppercase tracking-wide">
          <tr>
            <th className="text-left px-5 py-3 font-semibold">Ürün</th>
            <th className="text-right px-5 py-3 font-semibold">Görüntülenme</th>
            <th className="text-right px-5 py-3 font-semibold hidden md:table-cell">Ort. Süre</th>
            <th className="text-right px-5 py-3 font-semibold hidden md:table-cell">Sepete Ekleme</th>
            <th className="text-right px-5 py-3 font-semibold">Dönüşüm</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-paper-200">
          {sorted.map((p) => (
            <tr key={p.slug} className="hover:bg-paper-100/40">
              <td className="px-5 py-3">
                <Link href={`/urunler/${p.slug}`} className="font-medium text-ink-900 hover:text-brand-700 hover:underline">
                  {p.name}
                </Link>
              </td>
              <td className="px-5 py-3 text-right tabular-nums text-ink-900">{trNum(p.views)}</td>
              <td className="px-5 py-3 text-right tabular-nums text-ink-700 hidden md:table-cell">{msToSec(p.avgDwellMs)}</td>
              <td className="px-5 py-3 text-right tabular-nums text-ink-700 hidden md:table-cell">{trNum(p.addToCarts)}</td>
              <td className="px-5 py-3 text-right tabular-nums text-ink-900">{pct(p.conversionRate)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/* ---------- ısı haritası ---------- */

function Heatmap({ cells }: { cells: AnalyticsOverviewDto["visitHeatmap"] }) {
  // hızlı arama için dow-hour → count haritası
  const map = new Map<string, number>();
  let max = 0;
  for (const c of cells) {
    map.set(`${c.dow}-${c.hour}`, c.count);
    if (c.count > max) max = c.count;
  }
  const hours = Array.from({ length: 24 }, (_, h) => h);

  const cellColor = (count: number): string => {
    if (count <= 0 || max === 0) return "rgba(224,168,46,0.06)"; // çok açık zemin
    const intensity = 0.15 + (count / max) * 0.85; // brand sarısı yoğunluğu
    return `rgba(224,168,46,${intensity.toFixed(2)})`;
  };

  if (cells.length === 0) {
    return <p className="text-sm text-ink-400">Henüz ziyaret zamanlaması verisi yok.</p>;
  }

  return (
    <div className="overflow-x-auto">
      <div className="min-w-[640px]">
        {/* saat başlıkları */}
        <div className="flex items-center gap-[2px] mb-1 pl-10">
          {hours.map((h) => (
            <div key={h} className="flex-1 text-center text-[9px] text-ink-400 tabular-nums">
              {h % 3 === 0 ? h : ""}
            </div>
          ))}
        </div>
        {DOW_ORDER.map((dow, rowIdx) => (
          <div key={dow} className="flex items-center gap-[2px] mb-[2px]">
            <div className="w-10 text-[10px] text-ink-500 font-medium flex-none">{DOW_LABELS[rowIdx]}</div>
            {hours.map((h) => {
              const count = map.get(`${dow}-${h}`) ?? 0;
              return (
                <div
                  key={h}
                  className="flex-1 aspect-square rounded-[2px] min-w-[14px]"
                  style={{ background: cellColor(count) }}
                  title={`${DOW_LABELS[rowIdx]} ${String(h).padStart(2, "0")}:00 — ${trNum(count)} ziyaret`}
                />
              );
            })}
          </div>
        ))}
        {/* lejant */}
        <div className="flex items-center justify-end gap-1.5 mt-3 text-[10px] text-ink-500">
          <span>Az</span>
          {[0.1, 0.3, 0.55, 0.8, 1].map((f) => (
            <span
              key={f}
              className="w-4 h-3 rounded-[2px]"
              style={{ background: `rgba(224,168,46,${(0.15 + f * 0.85).toFixed(2)})` }}
            />
          ))}
          <span>Çok</span>
        </div>
      </div>
    </div>
  );
}

/* ---------- CRM / Müşteri Segmentleri ---------- */

function CrmSection({ customers }: { customers: AnalyticsOverviewDto["customers"] }) {
  const [active, setActive] = useState<AnalyticsSegment | null>(null);

  const summary = [
    { label: "Toplam üye", value: trNum(customers.total) },
    { label: "Sipariş veren", value: trNum(customers.withOrders) },
    { label: "Üye dönüşümü", value: pct(customers.conversionRate) },
    { label: "Bu dönem yeni", value: trNum(customers.newThisPeriod) },
    { label: "Dönen (2+ sipariş)", value: trNum(customers.returning) },
  ];

  return (
    <section className="mb-6">
      <header className="flex items-center gap-2 mb-4">
        <UsersThree size={20} weight="bold" className="text-brand-700" />
        <h2 className="text-lg font-semibold text-ink-900">Müşteri Segmentleri & CRM</h2>
      </header>

      {/* CRM özet şeridi */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-4">
        {summary.map((s) => (
          <div key={s.label} className="bg-paper-50 border border-paper-200 rounded-lg p-3">
            <div className="text-[11px] text-ink-500">{s.label}</div>
            <div className="mt-1 text-lg font-semibold text-ink-900 tabular-nums">{s.value}</div>
          </div>
        ))}
      </div>

      {/* segment kartları */}
      {customers.segments.length === 0 ? (
        <p className="text-sm text-ink-400">Henüz segment yok.</p>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {customers.segments.map((seg) => {
            const tc = toneClasses(seg.tone);
            return (
              <button
                key={seg.key}
                onClick={() => setActive(seg)}
                className={`text-left p-4 rounded-lg border transition-all hover:shadow-md ${tc.card}`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full ${tc.dot}`} />
                    <span className="font-semibold text-ink-900">{seg.label}</span>
                  </div>
                  <span className="text-xl font-semibold text-ink-900 tabular-nums">{trNum(seg.count)}</span>
                </div>
                <p className="mt-1.5 text-xs text-ink-500 leading-relaxed">{seg.description}</p>
                <span className="mt-3 inline-flex items-center gap-1 text-xs font-medium text-brand-700">
                  {seg.actionable ? "Win-back / kampanya" : "Detayları gör"}
                  <ArrowRight size={12} weight="bold" />
                </span>
              </button>
            );
          })}
        </div>
      )}

      {active && <SegmentDrawer segment={active} onClose={() => setActive(null)} />}
    </section>
  );
}

/* ---------- segment drawer (müşteri listesi + win-back) ---------- */

function SegmentDrawer({ segment, onClose }: { segment: AnalyticsSegment; onClose: () => void }) {
  const [data, setData] = useState<AnalyticsSegmentResultDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // segment müşterilerini BFF üzerinden yükle (segment değişince yeniden)
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    setData(null);
    fetch(`/api/analytics/segment/${encodeURIComponent(segment.key)}`)
      .then((r) => {
        if (!r.ok) throw new Error("yüklenemedi");
        return r.json();
      })
      .then((d: AnalyticsSegmentResultDto) => {
        if (!cancelled) setData(d);
      })
      .catch(() => {
        if (!cancelled) setError("Müşteri listesi yüklenemedi. Tekrar deneyin.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [segment.key]);

  const tc = toneClasses(segment.tone);

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-ink-900/50 backdrop-blur-sm" onClick={onClose} />
      <aside className="relative w-full max-w-2xl bg-paper-50 h-full overflow-y-auto shadow-xl flex flex-col">
        <header className="sticky top-0 bg-paper-50 border-b border-paper-200 px-5 py-4 flex items-center justify-between z-10">
          <div className="flex items-center gap-2">
            <span className={`w-2.5 h-2.5 rounded-full ${tc.dot}`} />
            <div>
              <h3 className="font-semibold text-ink-900">{segment.label}</h3>
              <p className="text-xs text-ink-500">{segment.description}</p>
            </div>
          </div>
          <button onClick={onClose} aria-label="Kapat" className="p-2 -mr-1 rounded-md hover:bg-paper-100 text-ink-700">
            <X size={18} />
          </button>
        </header>

        <div className="p-5 flex-1">
          {/* aksiyon alınabilir segmentler için win-back paneli */}
          {segment.actionable && data && data.customers.length > 0 && (
            <WinBackPanel segment={segment} customers={data.customers} />
          )}

          {loading ? (
            <p className="text-sm text-ink-500 py-8 text-center">Müşteriler yükleniyor…</p>
          ) : error ? (
            <div className="flex items-center gap-2 text-sm text-error py-8 justify-center">
              <Warning size={16} weight="fill" /> {error}
            </div>
          ) : !data || data.customers.length === 0 ? (
            <p className="text-sm text-ink-400 py-8 text-center">Bu segmentte müşteri yok.</p>
          ) : (
            <SegmentCustomersTable customers={data.customers} />
          )}
        </div>
      </aside>
    </div>
  );
}

function SegmentCustomersTable({ customers }: { customers: AnalyticsSegmentCustomer[] }) {
  return (
    <div className="border border-paper-200 rounded-lg overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-paper-100/60 text-ink-500 text-xs uppercase tracking-wide">
            <tr>
              <th className="text-left px-3 py-2.5 font-semibold">Müşteri</th>
              <th className="text-left px-3 py-2.5 font-semibold hidden sm:table-cell">Telefon</th>
              <th className="text-right px-3 py-2.5 font-semibold">Sipariş</th>
              <th className="text-right px-3 py-2.5 font-semibold">Harcama</th>
              <th className="text-right px-3 py-2.5 font-semibold">Son Aktivite</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-paper-200">
            {customers.map((c) => (
              <tr key={c.id} className="hover:bg-paper-100/40">
                <td className="px-3 py-2.5">
                  <div className="font-medium text-ink-900">{c.fullName || "—"}</div>
                  <div className="text-[11px] text-ink-500 truncate max-w-[180px]">{c.email}</div>
                </td>
                <td className="px-3 py-2.5 text-ink-700 text-xs hidden sm:table-cell">{c.phone ?? "—"}</td>
                <td className="px-3 py-2.5 text-right tabular-nums text-ink-900">{trNum(c.orderCount)}</td>
                <td className="px-3 py-2.5 text-right tabular-nums text-ink-900">{trCurrency(c.totalSpent)}</td>
                <td className="px-3 py-2.5 text-right text-xs text-ink-700">
                  {c.daysSinceLastActivity != null ? (
                    <span title={c.lastActivityAt ?? ""}>{c.daysSinceLastActivity} gün önce</span>
                  ) : (
                    "—"
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* ---------- win-back kampanya paneli ---------- */

function WinBackPanel({
  segment, customers,
}: {
  segment: AnalyticsSegment;
  customers: AnalyticsSegmentCustomer[];
}) {
  const emails = customers.map((c) => c.email).filter(Boolean);

  function downloadCsv() {
    const header = ["Ad Soyad", "E-posta", "Telefon", "Sipariş Sayısı", "Toplam Harcama", "Son Sipariş", "Son Aktivite", "Gün Önce"];
    const rows = customers.map((c) => [
      c.fullName ?? "",
      c.email ?? "",
      c.phone ?? "",
      String(c.orderCount),
      String(c.totalSpent),
      c.lastOrderAt ?? "",
      c.lastActivityAt ?? "",
      c.daysSinceLastActivity != null ? String(c.daysSinceLastActivity) : "",
    ]);
    // CSV kaçışlama: çift tırnak ikile, alanı tırnağa al.
    const esc = (v: string) => `"${v.replace(/"/g, '""')}"`;
    const csv = [header, ...rows].map((r) => r.map(esc).join(",")).join("\r\n");
    // Excel'de Türkçe karakter için BOM ekle.
    const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `winback-${segment.key}-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success(`${customers.length} müşteri CSV olarak indirildi.`);
  }

  async function copyEmails() {
    const text = emails.join(", ");
    try {
      await navigator.clipboard.writeText(text);
      toast.success(`${emails.length} e-posta panoya kopyalandı.`);
    } catch {
      toast.error("Panoya kopyalanamadı. Tarayıcı izni gerekebilir.");
    }
  }

  return (
    <div className="mb-5 p-4 rounded-lg border border-warning/30 bg-warning/5">
      <div className="flex items-center gap-2 mb-2">
        <Receipt size={16} weight="bold" className="text-warning" />
        <h4 className="font-semibold text-ink-900 text-sm">Win-back Kampanyası</h4>
      </div>
      <p className="text-xs text-ink-700 leading-relaxed mb-3">
        Bu segment {segment.label.toLowerCase()} durumunda — uzun süredir uykuda.
        %10-15 indirim SMS&apos;i / &quot;sizi özledik&quot; e-postası ile geri kazanılabilir.
        {customers.length} müşteri hedeflenebilir.
      </p>

      <div className="flex flex-wrap gap-2 mb-3">
        <button
          onClick={downloadCsv}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium bg-ink-900 text-paper-50 hover:bg-ink-700"
        >
          <DownloadSimple size={14} /> CSV indir
        </button>
        <button
          onClick={copyEmails}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium border border-paper-200 hover:bg-paper-100 text-ink-700"
        >
          <Copy size={14} /> E-postaları kopyala ({emails.length})
        </button>
      </div>

      {/* DÜRÜST NOT: toplu gönderim entegrasyonu henüz yok — sahte "gönderildi" YOK. */}
      <div className="flex items-start gap-2 p-2.5 rounded-md bg-paper-100/70 text-[11px] text-ink-600 leading-relaxed">
        <Info size={13} className="flex-none mt-0.5 text-ink-500" />
        <span>
          Toplu e-posta/SMS gönderimi entegrasyon bekliyor (SendGrid / NetGSM).
          Şimdilik CSV indirip kampanya aracınıza aktarın.
        </span>
      </div>
    </div>
  );
}
