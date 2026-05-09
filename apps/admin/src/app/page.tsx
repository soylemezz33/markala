import { AdminShell } from "@/components/admin-shell";
import Link from "next/link";
import {
  TrendUp, ShoppingCart, Users, Package, ArrowUp, ArrowDown,
  CurrencyCircleDollar, Truck, Question, Plus, Sparkle, ArrowRight,
  Bell, ChartLine, ClockCounterClockwise, Receipt,
} from "@phosphor-icons/react/dist/ssr";

const kpis = [
  { label: "Bugünün Cirosu", value: "₺ 14.580", delta: "+18%", up: true, icon: TrendUp, color: "text-success" },
  { label: "Sipariş (bugün)", value: "23", delta: "+5", up: true, icon: ShoppingCart, color: "text-brand-700" },
  { label: "Yeni Müşteri", value: "7", delta: "-2", up: false, icon: Users, color: "text-[#1565C0]" },
  { label: "Üretimde", value: "31", delta: "+12", up: true, icon: Package, color: "text-warning" },
];

// Son 7 gün ciro grafiği için basit veriler (mock)
const salesWeek = [
  { day: "Pzt", value: 8200 },
  { day: "Sal", value: 11400 },
  { day: "Çar", value: 9300 },
  { day: "Per", value: 14800 },
  { day: "Cum", value: 17600 },
  { day: "Cmt", value: 12100 },
  { day: "Paz", value: 14580 },
];

const recentOrders = [
  { no: "MK-2026-0123", customer: "Ali Y.", product: "Klasik Kartvizit · CYP × 2.000", amount: "₺ 580", status: "Üretimde", statusColor: "bg-warning/10 text-warning" },
  { no: "MK-2026-0122", customer: "Mehmet K. (kurumsal)", product: "Vinil Branda · 3×4 m", amount: "₺ 1.660", status: "Onay Bekliyor", statusColor: "bg-[#1565C0]/10 text-[#1565C0]" },
  { no: "MK-2026-0121", customer: "Zeynep A.", product: "Selefonlu Broşür A4 · 1.000", amount: "₺ 2.850", status: "Kargoda", statusColor: "bg-success/10 text-success" },
  { no: "MK-2026-0120", customer: "Burak T.", product: "Trodat 4912 Kaşe", amount: "₺ 220", status: "Teslim Edildi", statusColor: "bg-paper-200 text-ink-700" },
  { no: "MK-2026-0119", customer: "Ayşe D.", product: "Çantalar CNT2 · 1.000", amount: "₺ 15.625", status: "Üretimde", statusColor: "bg-warning/10 text-warning" },
];

const pendingActions = [
  { label: "Tasarım onayı bekleyen sipariş", count: 4, icon: Question, href: "/siparisler?filter=tasarim-onay" },
  { label: "Ödeme sonrası bekleyen", count: 2, icon: CurrencyCircleDollar, href: "/siparisler?filter=odeme-bekliyor" },
  { label: "Stok azalan ürün", count: 0, icon: Package, href: "/urunler?filter=dusuk-stok" },
  { label: "Onay bekleyen yorum", count: 6, icon: Bell, href: "/yorumlar?filter=onay-bekliyor" },
];

export default function DashboardPage() {
  const maxSales = Math.max(...salesWeek.map((d) => d.value));

  return (
    <AdminShell>
      <header className="mb-6 flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl md:text-3xl font-semibold text-ink-900">Dashboard</h1>
          <p className="mt-1 text-ink-500 text-sm">Bugünün özeti — son 7 gün ciro grafiği ile</p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/urunler/yeni"
            className="inline-flex items-center gap-2 px-3 md:px-4 py-2 rounded-md text-sm font-medium border border-paper-200 hover:bg-paper-100"
          >
            <Plus size={14} weight="bold" /> Yeni Ürün
          </Link>
          <Link
            href="/siparisler"
            className="inline-flex items-center gap-2 px-3 md:px-4 py-2 rounded-md text-sm font-medium bg-ink-900 text-paper-50 hover:bg-ink-700"
          >
            Tüm Siparişler <ArrowRight size={14} weight="bold" />
          </Link>
        </div>
      </header>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        {kpis.map((k) => (
          <div key={k.label} className="bg-paper-50 border border-paper-200 rounded-lg p-4 md:p-5">
            <div className="flex items-center justify-between text-ink-500">
              <span className="text-xs md:text-sm">{k.label}</span>
              <span className={k.color}><k.icon size={18} /></span>
            </div>
            <div className="mt-2 text-xl md:text-2xl font-semibold text-ink-900 tabular-nums">{k.value}</div>
            <div className={`mt-1 text-[11px] md:text-xs flex items-center gap-1 ${k.up ? "text-success" : "text-error"}`}>
              {k.up ? <ArrowUp size={11} weight="bold" /> : <ArrowDown size={11} weight="bold" />}
              {k.delta}
              <span className="text-ink-500 ml-1">vs. dün</span>
            </div>
          </div>
        ))}
      </div>

      {/* Sales Chart + Pending */}
      <section className="mt-6 grid lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 bg-paper-50 border border-paper-200 rounded-lg p-5">
          <header className="flex items-center justify-between mb-5">
            <div>
              <h2 className="font-semibold text-ink-900 flex items-center gap-2">
                <ChartLine size={18} weight="bold" className="text-brand-700" />
                Son 7 Gün Ciro
              </h2>
              <p className="text-xs text-ink-500 mt-0.5">Toplam: ₺ 87.980 · Ortalama: ₺ 12.568/gün</p>
            </div>
            <select className="text-xs px-2 py-1 rounded border border-paper-200 bg-paper-50">
              <option>Son 7 Gün</option>
              <option>Son 30 Gün</option>
              <option>Son 90 Gün</option>
            </select>
          </header>
          {/* Bar chart (CSS only) */}
          <div className="flex items-end justify-between gap-2 h-48">
            {salesWeek.map((d) => {
              const heightPct = (d.value / maxSales) * 100;
              return (
                <div key={d.day} className="flex-1 flex flex-col items-center justify-end gap-2">
                  <div className="text-[10px] tabular-nums text-ink-500">
                    ₺{(d.value / 1000).toFixed(1)}k
                  </div>
                  <div
                    className="w-full bg-gradient-to-t from-brand-500 to-brand-300 rounded-t-md transition-all hover:from-brand-700 hover:to-brand-500"
                    style={{ height: `${heightPct}%` }}
                    title={`${d.day}: ₺${d.value.toLocaleString("tr-TR")}`}
                  />
                  <div className="text-xs font-medium text-ink-700">{d.day}</div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="bg-paper-50 border border-paper-200 rounded-lg p-5">
          <h2 className="font-semibold text-ink-900 mb-4 flex items-center gap-2">
            <Bell size={18} weight="bold" className="text-error" />
            Aksiyon Bekleyenler
          </h2>
          <div className="space-y-2">
            {pendingActions.map((a) => (
              <Link
                key={a.label}
                href={a.href}
                className="flex items-center justify-between gap-3 p-3 rounded-md hover:bg-paper-100 group transition-colors"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <span className="flex-none w-9 h-9 rounded-md bg-paper-100 grid place-items-center text-ink-700 group-hover:bg-paper-50">
                    <a.icon size={16} />
                  </span>
                  <span className="text-sm text-ink-700 truncate">{a.label}</span>
                </div>
                <span
                  className={`flex-none px-2 py-0.5 rounded-full text-xs font-bold tabular-nums ${
                    a.count > 0 ? "bg-error text-paper-50" : "bg-paper-200 text-ink-500"
                  }`}
                >
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
          <Link href="/siparisler" className="text-xs text-brand-700 hover:underline font-medium">
            Tümünü gör →
          </Link>
        </header>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-paper-100/60 text-ink-500 text-xs uppercase tracking-wide">
              <tr>
                <th className="text-left px-5 py-3 font-semibold">Sipariş No</th>
                <th className="text-left px-5 py-3 font-semibold">Müşteri</th>
                <th className="text-left px-5 py-3 font-semibold hidden md:table-cell">Ürün</th>
                <th className="text-right px-5 py-3 font-semibold">Tutar</th>
                <th className="text-right px-5 py-3 font-semibold">Durum</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-paper-200">
              {recentOrders.map((o) => (
                <tr key={o.no} className="hover:bg-paper-100/40">
                  <td className="px-5 py-3 font-mono text-xs font-semibold text-ink-900">{o.no}</td>
                  <td className="px-5 py-3 text-ink-700">{o.customer}</td>
                  <td className="px-5 py-3 text-ink-500 hidden md:table-cell text-xs">{o.product}</td>
                  <td className="px-5 py-3 text-right font-semibold text-ink-900 tabular-nums">{o.amount}</td>
                  <td className="px-5 py-3 text-right">
                    <span className={`inline-block px-2 py-0.5 rounded-full text-[11px] font-semibold ${o.statusColor}`}>
                      {o.status}
                    </span>
                  </td>
                </tr>
              ))}
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
          <p className="text-xs">
            Her sipariş onayında müşteri %1-5 fire toleransını kabul ediyor. Bkz: Mesafeli Satış Sözleşmesi Madde 7.A.
          </p>
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
