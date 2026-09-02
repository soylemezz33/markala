import { AdminShell } from "@/components/admin-shell";
import { getAdminApi, getAdminSession } from "@/lib/api";
import { LoadErrorBanner } from "@/components/load-error-banner";
import { RecentOrdersTable } from "./recent-orders-table";
import Link from "next/link";
import type { AdminStatsDto } from "@markala/api-client";
import {
  TrendUp, ShoppingCart, Users, Package,
  CurrencyCircleDollar, Truck, Question, Plus, Sparkle, ArrowRight,
  Bell, ChartLine, ClockCounterClockwise, Receipt,
} from "@phosphor-icons/react/dist/ssr";

const EMPTY_STATS: AdminStatsDto = {
  orderCount: 0,
  revenue: 0,
  customerCount: 0,
  pendingCorporate: 0,
  ordersByStatus: [],
};

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
  // 2026-08-21 (Hasan, tasarimci hesabiyla test): parasal kutular herkese gorunuyor ve
  // veri gelmedigi icin "0,00" yaziyordu. Cozum blur/gri degil, KUTUYU HIC BASMAMAK.
  // API zaten finans izni olmayan role `revenue`/`unpaidCount` GONDERMIYOR; burada da
  // gostermiyoruz. Iki katman: veri kesilir + arayuz basmaz.
  const session = await getAdminSession();
  const canSeeFinance = session?.role === "admin" || session?.role === "super_admin";

  let stats: AdminStatsDto = EMPTY_STATS;
  let recentOrders: unknown[] = [];
  let loadError = false;
  try {
    const api = await getAdminApi();
    [stats, recentOrders] = await Promise.all([
      api.adminStats(),
      api.orders.listAll({ take: 5 }),
    ]);
  } catch {
    // Geçici backend hatası — sayfayı çökertme, boş/fallback verilerle + uyarıyla render et.
    loadError = true;
  }

  // Üretimde sayısı — API enum değeri Prisma'dan direkt geliyor (underscore)
  const statusCount = (s: string) => (stats.ordersByStatus ?? []).find((x) => x.status === s)?.count ?? 0;
  const uretimdeCount = statusCount("uretimde");

  // Aksiyon bekleyenler — GERÇEK stats'tan türetilir (eskiden statik 0 idi).
  const pendingActions = [
    { label: "Tasarım bekleyen sipariş", count: statusCount("tasarim_bekleniyor"), icon: Question, href: "/siparisler" },
    { label: "Üretimdeki sipariş", count: uretimdeCount, icon: Package, href: "/siparisler" },
    { label: "Bekleyen kurumsal başvuru", count: stats.pendingCorporate ?? 0, icon: Bell, href: "/musteriler/kurumsal-basvurular" },
  ];

  const kpis = [
    ...(canSeeFinance ? [{
      label: "Toplam Ciro",
      value: `₺ ${stats.revenue.toLocaleString("tr-TR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      icon: TrendUp,
      color: "text-success",
      // Hasan: "ciroya tıklandığında ne kadar kâr etmişiz" → kâr analizi sayfası.
      href: "/ciro",
      /**
       * 2026-09-02 (Hasan: "dashboardda 25.401,63 ama ciro sayfasında 19.917,19,
       * neden düzeltemedik?"): iki rakam FARKLI ŞEYLERİ ölçüyor ve ikisi de doğru —
       * burada müşterinin ÖDEDİĞİ tutar (KDV + kargo dahil), kâr sayfasında bize
       * KALAN tutar var. Etiket kayıtsız şartsız "Toplam Ciro" dediği için aynı şey
       * sanılıyor ve sayfa bozuk görünüyordu. Farkı kartın üstünde söylüyoruz.
       */
      hint: "KDV ve kargo dahil · kâr detayı →",
    }] : []),
    {
      // 2026-08-18: artık YALNIZ gerçekleşen siparişler (ödemesi başarılı + cari).
      // Yarıda bırakılan ödemeler ayrı "Ödeme Bekleyen" kutusunda izlenir.
      label: "Toplam Sipariş",
      value: String(stats.orderCount),
      icon: ShoppingCart,
      color: "text-brand-700",
    },
    ...(canSeeFinance
      ? [{
          label: "Ödeme Bekleyen",
          value: String(stats.unpaidCount ?? 0),
          icon: ClockCounterClockwise,
          color: "text-warning",
        }]
      : []),
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
      {loadError && <LoadErrorBanner />}
      <header className="mb-6 flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl md:text-3xl font-semibold text-ink-900">Dashboard</h1>
          <p className="mt-1 text-ink-500 text-sm">Genel özet, canlı veriler</p>
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
      {/* 5 kart: "Ödeme Bekleyen" eklendi (2026-08-18) → lg'de 5 sütun */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 md:gap-4">
        {kpis.map((k) => {
          const inner = (
            <>
              <div className="flex items-center justify-between text-ink-500">
                <span className="text-xs md:text-sm">{k.label}</span>
                <span className={k.color}><k.icon size={18} /></span>
              </div>
              <div className="mt-2 text-xl md:text-2xl font-semibold text-ink-900 tabular-nums">
                {k.value}
              </div>
              {/* Delta/karşılaştırma verisi API'de yok — tıklanabilir kartta ipucu gösterilir */}
              <div className="mt-1 text-[11px] md:text-xs text-ink-400">
                {"hint" in k && k.hint ? k.hint : "href" in k && k.href ? "Detay →" : "-"}
              </div>
            </>
          );
          const cls = "bg-paper-50 border border-paper-200 rounded-lg p-4 md:p-5";
          return "href" in k && k.href ? (
            <Link key={k.label} href={k.href} className={`${cls} block hover:border-ink-300 transition-colors`}>
              {inner}
            </Link>
          ) : (
            <div key={k.label} className={cls}>{inner}</div>
          );
        })}
      </div>

      {/* Sipariş Durumları + Aksiyon Bekleyenler */}
      <section className="mt-6 grid lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 bg-paper-50 border border-paper-200 rounded-lg p-5">
          <header className="flex items-center gap-2 mb-5">
            <ChartLine size={18} weight="bold" className="text-brand-700" />
            <h2 className="font-semibold text-ink-900">Sipariş Durumları</h2>
          </header>
          {(stats.ordersByStatus ?? []).length === 0 ? (
            <p className="text-sm text-ink-400">Henüz sipariş yok.</p>
          ) : (
            <div className="space-y-2">
              {(stats.ordersByStatus ?? []).map((s) => {
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
        {/* 2026-08-18: Ödeme durumu sütunu + ödenmemişte "İletişime Geç" — bkz.
            recent-orders-table.tsx başlığındaki gerekçe. */}
        <div className="overflow-x-auto">
          <RecentOrdersTable orders={recentOrders as never} />
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
