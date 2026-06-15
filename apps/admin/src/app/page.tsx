import { AdminShell } from "@/components/admin-shell";
import { getAdminApi } from "@/lib/api";
import Link from "next/link";
import {
  TrendUp, ShoppingCart, Users, Package,
  CurrencyCircleDollar, Truck, Question, Plus, Sparkle, ArrowRight,
  Bell, ChartLine, ClockCounterClockwise, Receipt,
} from "@phosphor-icons/react/dist/ssr";

// Aksiyon bekleyenler — API'de bu detaylar henüz yok, statik sıfır gösteriliyor
const pendingActions = [
  { label: "Tasarım onayı bekleyen sipariş", count: 0, icon: Question, href: "/siparisler?filter=tasarim-onay" },
  { label: "Ödeme sonrası bekleyen", count: 0, icon: CurrencyCircleDollar, href: "/siparisler?filter=odeme-bekliyor" },
  { label: "Stok azalan ürün", count: 0, icon: Package, href: "/urunler?filter=dusuk-stok" },
  { label: "Onay bekleyen yorum", count: 0, icon: Bell, href: "/yorumlar?filter=onay-bekliyor" },
];

/** Prisma enum değerini Türkçe etiket + Tailwind renk sınıfına dönüştürür */
function statusBadge(status: string): { label: string; className: string } {
  switch (status) {
    case "siparis_alindi":
    case "siparis-alindi":
      return { label: "Sipariş Alındı", className: "bg-paper-200 text-ink-700" };
    case "tasarim_bekleniyor":
    case "tasarim-bekleniyor":
      return { label: "Tasarım Bekliyor", className: "bg-[#1565C0]/10 text-[#1565C0]" };
    case "tasarim_onayindi":
    case "tasarim-onayindi":
      return { label: "Tasarım Onaylandı", className: "bg-[#1565C0]/10 text-[#1565C0]" };
    case "uretimde":
      return { label: "Üretimde", className: "bg-warning/10 text-warning" };
    case "kargoya_verildi":
    case "kargoya-verildi":
      return { label: "Kargoda", className: "bg-success/10 text-success" };
    case "teslim_edildi":
    case "teslim-edildi":
      return { label: "Teslim Edildi", className: "bg-paper-200 text-ink-500" };
    case "iptal_edildi":
    case "iptal-edildi":
      return { label: "İptal Edildi", className: "bg-error/10 text-error" };
    default:
      return { label: status, className: "bg-paper-200 text-ink-500" };
  }
}

export default async function DashboardPage() {
  const api = await getAdminApi();

  const [stats, recentOrders] = await Promise.all([
    api.adminStats(),
    api.orders.listAll({ take: 5 }),
  ]);

  // Defansif: API şekli sürüm uyumsuzluğunda kayarsa tüm panel çökmesin (boş → sıfır göster).
  const ordersByStatus = stats.ordersByStatus ?? [];
  // Üretimde sayısı — API enum değeri Prisma'dan direkt geliyor (underscore)
  const uretimdeCount =
    ordersByStatus.find((s) => s.status === "uretimde")?.count ?? 0;

  const kpis = [
    {
      label: "Toplam Ciro",
      value: `₺ ${stats.revenue.toLocaleString("tr-TR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      icon: TrendUp,
      color: "text-success",
    },
    {
      label: "Toplam Sipariş",
      value: String(stats.orderCount),
      icon: ShoppingCart,
      color: "text-brand-700",
    },
    {
      label: "Müşteri",
      value: String(stats.customerCount),
      icon: Users,
      color: "text-[#1565C0]",
    },
    {
      label: "Üretimde",
      value: String(uretimdeCount),
      icon: Package,
      color: "text-warning",
    },
  ];

  return (
    <AdminShell>
      <header className="mb-6 flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl md:text-3xl font-semibold text-ink-900">Dashboard</h1>
          <p className="mt-1 text-ink-500 text-sm">Genel özet — canlı veriler</p>
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
            <div className="mt-2 text-xl md:text-2xl font-semibold text-ink-900 tabular-nums">
              {k.value}
            </div>
            {/* Delta/karşılaştırma verisi API'de yok — boş gösteriliyor */}
            <div className="mt-1 text-[11px] md:text-xs text-ink-400">—</div>
          </div>
        ))}
      </div>

      {/* Sipariş Durumları + Aksiyon Bekleyenler */}
      <section className="mt-6 grid lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 bg-paper-50 border border-paper-200 rounded-lg p-5">
          <header className="flex items-center gap-2 mb-5">
            <ChartLine size={18} weight="bold" className="text-brand-700" />
            <h2 className="font-semibold text-ink-900">Sipariş Durumları</h2>
          </header>
          {ordersByStatus.length === 0 ? (
            <p className="text-sm text-ink-400">Henüz sipariş yok.</p>
          ) : (
            <div className="space-y-2">
              {ordersByStatus.map((s) => {
                const badge = statusBadge(s.status);
                return (
                  <div
                    key={s.status}
                    className="flex items-center justify-between gap-3 p-3 rounded-md bg-paper-100/40"
                  >
                    <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${badge.className}`}>
                      {badge.label}
                    </span>
                    <span className="text-sm font-semibold text-ink-900 tabular-nums">{s.count}</span>
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

      {/* Son Siparişler */}
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
          {recentOrders.length === 0 ? (
            <p className="px-5 py-6 text-sm text-ink-400">Henüz sipariş yok.</p>
          ) : (
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
                {(recentOrders as any[]).map((o) => {
                  const badge = statusBadge(String(o.status ?? ""));
                  const customerName = o.user?.fullName ?? o.email ?? "—";
                  const totalVal = typeof o.total === "object" && o.total !== null
                    ? Number(o.total.toString())
                    : Number(o.total ?? 0);
                  const amount = `₺ ${totalVal.toLocaleString("tr-TR", { minimumFractionDigits: 2 })}`;
                  return (
                    <tr key={o.id} className="hover:bg-paper-100/40">
                      <td className="px-5 py-3 font-mono text-xs font-semibold text-ink-900">
                        {o.orderNumber ?? o.id?.slice(0, 8)}
                      </td>
                      <td className="px-5 py-3 text-ink-700">{customerName}</td>
                      <td className="px-5 py-3 text-right font-semibold text-ink-900 tabular-nums">
                        {amount}
                      </td>
                      <td className="px-5 py-3 text-right">
                        <span className={`inline-block px-2 py-0.5 rounded-full text-[11px] font-semibold ${badge.className}`}>
                          {badge.label}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </section>

      {/* Hızlı Bağlantılar */}
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
