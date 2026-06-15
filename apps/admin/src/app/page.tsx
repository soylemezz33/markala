import { AdminShell } from "@/components/admin-shell";
import Link from "next/link";
import {
  TrendUp, ShoppingCart, Users, Package,
  CurrencyCircleDollar, Truck, Question, Plus, Sparkle, ArrowRight,
  Bell, ChartBar, ClockCounterClockwise, Receipt,
} from "@phosphor-icons/react/dist/ssr";
import { apiFetch } from "@/lib/api";
import type { AdminStats } from "@markala/api-client";

export const dynamic = "force-dynamic";

const TRY = (n: number) => "₺ " + n.toLocaleString("tr-TR", { maximumFractionDigits: 0 });

// Sipariş durumu (Prisma enum) → etiket + renk
const STATUS_META: Record<string, { label: string; color: string }> = {
  "siparis-alindi": { label: "Sipariş Alındı", color: "bg-paper-200 text-ink-700" },
  "tasarim-bekleniyor": { label: "Tasarım Bekleniyor", color: "bg-[#1565C0]/10 text-[#1565C0]" },
  "tasarim-onayindi": { label: "Tasarım Onayında", color: "bg-[#1565C0]/10 text-[#1565C0]" },
  uretimde: { label: "Üretimde", color: "bg-warning/10 text-warning" },
  "kargoya-verildi": { label: "Kargoda", color: "bg-success/10 text-success" },
  "teslim-edildi": { label: "Teslim Edildi", color: "bg-paper-200 text-ink-700" },
  "iptal-edildi": { label: "İptal", color: "bg-error/10 text-error" },
};
const statusMeta = (s: string) => STATUS_META[s] ?? { label: s, color: "bg-paper-200 text-ink-700" };

const EMPTY_STATS: AdminStats = {
  revenue: { total: 0, today: 0 },
  orders: { total: 0, today: 0, inProduction: 0, byStatus: {} },
  customers: { total: 0 },
  pending: { corporateApplications: 0, reviews: 0 },
  recentOrders: [],
};

export default async function DashboardPage() {
  let stats: AdminStats = EMPTY_STATS;
  let apiError = false;
  try {
    stats = await apiFetch<AdminStats>("/admin/stats");
  } catch {
    apiError = true;
  }

  const kpis = [
    { label: "Bugünün Cirosu", value: TRY(stats.revenue.today), sub: `Toplam: ${TRY(stats.revenue.total)}`, icon: TrendUp, color: "text-success" },
    { label: "Sipariş (bugün)", value: String(stats.orders.today), sub: `Toplam: ${stats.orders.total}`, icon: ShoppingCart, color: "text-brand-700" },
    { label: "Toplam Müşteri", value: String(stats.customers.total), sub: "Kayıtlı", icon: Users, color: "text-[#1565C0]" },
    { label: "Üretimde", value: String(stats.orders.inProduction), sub: "Aktif iş", icon: Package, color: "text-warning" },
  ];

  const statusEntries = Object.entries(stats.orders.byStatus);
  const maxStatus = Math.max(1, ...statusEntries.map(([, c]) => c));

  const pendingActions = [
    { label: "Bekleyen kurumsal başvuru", count: stats.pending.corporateApplications, icon: Question, href: "/musteriler/kurumsal-basvurular" },
    { label: "Onay bekleyen yorum", count: stats.pending.reviews, icon: Bell, href: "/yorumlar" },
    { label: "Tasarım bekleyen sipariş", count: stats.orders.byStatus["tasarim-bekleniyor"] ?? 0, icon: CurrencyCircleDollar, href: "/siparisler" },
    { label: "Üretimdeki sipariş", count: stats.orders.inProduction, icon: Package, href: "/siparisler" },
  ];

  return (
    <AdminShell>
      <header className="mb-6 flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl md:text-3xl font-semibold text-ink-900">Dashboard</h1>
          <p className="mt-1 text-ink-500 text-sm">Canlı özet — gerçek zamanlı veritabanından</p>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/urunler/yeni" className="inline-flex items-center gap-2 px-3 md:px-4 py-2 rounded-md text-sm font-medium border border-paper-200 hover:bg-paper-100">
            <Plus size={14} weight="bold" /> Yeni Ürün
          </Link>
          <Link href="/siparisler" className="inline-flex items-center gap-2 px-3 md:px-4 py-2 rounded-md text-sm font-medium bg-ink-900 text-paper-50 hover:bg-ink-700">
            Tüm Siparişler <ArrowRight size={14} weight="bold" />
          </Link>
        </div>
      </header>

      {apiError && (
        <div className="mb-4 p-3 rounded-md bg-error/5 border border-error/20 text-error text-sm">
          API'ye ulaşılamadı — veriler gösterilemiyor. NestJS API (:4000) çalışıyor mu?
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        {kpis.map((k) => (
          <div key={k.label} className="bg-paper-50 border border-paper-200 rounded-lg p-4 md:p-5">
            <div className="flex items-center justify-between text-ink-500">
              <span className="text-xs md:text-sm">{k.label}</span>
              <span className={k.color}><k.icon size={18} /></span>
            </div>
            <div className="mt-2 text-xl md:text-2xl font-semibold text-ink-900 tabular-nums">{k.value}</div>
            <div className="mt-1 text-[11px] md:text-xs text-ink-500">{k.sub}</div>
          </div>
        ))}
      </div>

      {/* Order status distribution + Pending */}
      <section className="mt-6 grid lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 bg-paper-50 border border-paper-200 rounded-lg p-5">
          <header className="mb-5">
            <h2 className="font-semibold text-ink-900 flex items-center gap-2">
              <ChartBar size={18} weight="bold" className="text-brand-700" />
              Sipariş Durumu Dağılımı
            </h2>
            <p className="text-xs text-ink-500 mt-0.5">Toplam {stats.orders.total} sipariş</p>
          </header>
          {statusEntries.length === 0 ? (
            <div className="h-40 grid place-items-center text-sm text-ink-500">
              Henüz sipariş yok — ödeme entegrasyonu sonrası dolacak.
            </div>
          ) : (
            <div className="space-y-3">
              {statusEntries.map(([status, count]) => {
                const meta = statusMeta(status);
                return (
                  <div key={status} className="flex items-center gap-3">
                    <span className={`flex-none w-32 text-xs px-2 py-0.5 rounded-full text-center ${meta.color}`}>{meta.label}</span>
                    <div className="flex-1 h-3 bg-paper-100 rounded-full overflow-hidden">
                      <div className="h-full bg-gradient-to-r from-brand-500 to-brand-300 rounded-full" style={{ width: `${(count / maxStatus) * 100}%` }} />
                    </div>
                    <span className="flex-none w-8 text-right text-sm font-semibold text-ink-900 tabular-nums">{count}</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="bg-paper-50 border border-paper-200 rounded-lg p-5">
          <h2 className="font-semibold text-ink-900 mb-4 flex items-center gap-2">
            <Bell size={18} weight="bold" className="text-error" />
            Aksiyon Bekleyenler
          </h2>
          <div className="space-y-2">
            {pendingActions.map((a) => (
              <Link key={a.label} href={a.href} className="flex items-center justify-between gap-3 p-3 rounded-md hover:bg-paper-100 group transition-colors">
                <div className="flex items-center gap-3 min-w-0">
                  <span className="flex-none w-9 h-9 rounded-md bg-paper-100 grid place-items-center text-ink-700 group-hover:bg-paper-50">
                    <a.icon size={16} />
                  </span>
                  <span className="text-sm text-ink-700 truncate">{a.label}</span>
                </div>
                <span className={`flex-none px-2 py-0.5 rounded-full text-xs font-bold tabular-nums ${a.count > 0 ? "bg-error text-paper-50" : "bg-paper-200 text-ink-500"}`}>
                  {a.count}
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Recent Orders */}
      <section className="mt-6 bg-paper-50 border border-paper-200 rounded-lg overflow-hidden">
        <header className="px-5 py-4 border-b border-paper-200 flex items-center justify-between">
          <h2 className="font-semibold text-ink-900 flex items-center gap-2">
            <ClockCounterClockwise size={18} weight="bold" className="text-brand-700" />
            Son Siparişler
          </h2>
          <Link href="/siparisler" className="text-xs text-brand-700 hover:underline font-medium">Tümünü gör →</Link>
        </header>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-paper-100/60 text-ink-500 text-xs uppercase tracking-wide">
              <tr>
                <th className="text-left px-5 py-3 font-semibold">Sipariş No</th>
                <th className="text-left px-5 py-3 font-semibold">Müşteri</th>
                <th className="text-right px-5 py-3 font-semibold">Tutar</th>
                <th className="text-right px-5 py-3 font-semibold">Durum</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-paper-200">
              {stats.recentOrders.length === 0 ? (
                <tr><td colSpan={4} className="px-5 py-10 text-center text-ink-500 text-sm">Henüz sipariş yok.</td></tr>
              ) : (
                stats.recentOrders.map((o) => {
                  const meta = statusMeta(o.status);
                  return (
                    <tr key={o.orderNumber} className="hover:bg-paper-100/40">
                      <td className="px-5 py-3 font-mono text-xs font-semibold text-ink-900">{o.orderNumber}</td>
                      <td className="px-5 py-3 text-ink-700">{o.customer}{o.isCorporate && <span className="ml-1 text-[10px] text-brand-700">(kurumsal)</span>}</td>
                      <td className="px-5 py-3 text-right font-semibold text-ink-900 tabular-nums">{TRY(o.total)}</td>
                      <td className="px-5 py-3 text-right">
                        <span className={`inline-block px-2 py-0.5 rounded-full text-[11px] font-semibold ${meta.color}`}>{meta.label}</span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* Quick links */}
      <section className="mt-6 grid md:grid-cols-3 gap-4">
        <QuickLink href="/urunler/fiyat-toplu" icon={CurrencyCircleDollar} title="Toplu Fiyat Güncelle" desc="Kategori bazında %X artış" color="bg-success/10 text-success" />
        <QuickLink href="/ayarlar/api" icon={Truck} title="API & Entegrasyonlar" desc="iyzico, Paraşüt, DHL, R2" color="bg-[#1565C0]/10 text-[#1565C0]" />
        <QuickLink href="/banner" icon={Sparkle} title="Yeni Banner Yayınla" desc="Anasayfa kampanya bannerı" color="bg-brand-100 text-brand-700" />
      </section>

      <section className="mt-6 p-5 bg-paper-50 border border-paper-200 rounded-lg text-sm text-ink-700 flex items-start gap-3">
        <Receipt size={18} className="flex-none mt-0.5 text-brand-700" />
        <div>
          <p className="font-medium text-ink-900 mb-1">Üretim toleransı sözleşme şartı aktif</p>
          <p className="text-xs">Her sipariş onayında müşteri %1-5 fire toleransını kabul ediyor. Bkz: Mesafeli Satış Sözleşmesi Madde 7.A.</p>
        </div>
      </section>
    </AdminShell>
  );
}

function QuickLink({
  href, icon: Icon, title, desc, color,
}: {
  href: string; icon: typeof TrendUp; title: string; desc: string; color: string;
}) {
  return (
    <Link href={href} className="group p-5 bg-paper-50 border border-paper-200 rounded-lg hover:border-ink-300 hover:shadow-md transition-all">
      <div className={`w-10 h-10 rounded-md grid place-items-center mb-3 ${color}`}>
        <Icon size={20} />
      </div>
      <div className="font-semibold text-ink-900">{title}</div>
      <div className="text-xs text-ink-500 mt-0.5">{desc}</div>
      <span className="mt-3 inline-flex items-center gap-1 text-xs font-medium text-brand-700 group-hover:gap-2 transition-all">
        Aç <ArrowRight size={12} weight="bold" />
      </span>
    </Link>
  );
}
