"use client";

import Link from "next/link";
import { Button, Price } from "@markala/ui";
import { Package, ArrowsClockwise, MapPin, ArrowRight, ShoppingBagOpen, TrendUp, Sparkle } from "@phosphor-icons/react";
import { useOrdersStore } from "@/lib/orders-store";
import { useAuthStore } from "@/lib/auth-store";
import { formatDate, orderStatusLabel } from "@/lib/format";

export default function AccountOverviewPage() {
  const orders = useOrdersStore((s) => s.orders);
  const user = useAuthStore((s) => s.user);

  if (!user) return null;

  const totalSpent = orders.reduce((acc, o) => acc + o.total, 0);
  const recentOrders = orders.slice(0, 3);

  return (
    <div className="space-y-6">
      {/* Stats grid */}
      <div className="grid sm:grid-cols-3 gap-4">
        <StatCard
          icon={<Package size={20} />}
          label="Toplam Sipariş"
          value={orders.length.toString()}
          accent="bg-brand-100 text-brand-700"
        />
        <StatCard
          icon={<TrendUp size={20} />}
          label="Toplam Harcama"
          value={<Price amount={totalSpent} className="text-ink-900" />}
          accent="bg-success/10 text-success"
        />
        <StatCard
          icon={<MapPin size={20} />}
          label="Aktif Adres"
          value="0"
          accent="bg-[#E8F0FF] text-[#1565C0]"
        />
      </div>

      {/* Hoş geldin kuponu (yeni üyelere) */}
      {orders.length === 0 && (
        <div className="p-6 md:p-8 bg-ink-900 text-paper-50 rounded-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-brand-400">
              <Sparkle size={12} weight="fill" /> Hoş geldin kuponu
            </span>
            <h3 className="mt-2 text-xl md:text-2xl font-semibold">İlk siparişine %10 indirim</h3>
            <p className="mt-1 text-sm text-paper-100/70">
              Sepette <code className="font-mono px-2 py-0.5 rounded bg-brand-500/15 text-brand-400">HOSGELDIN</code> kodunu kullan.
            </p>
          </div>
          <Link href="/urunler"><Button>Alışverişe Başla <ArrowRight size={16} weight="bold" /></Button></Link>
        </div>
      )}

      {/* Son siparişler */}
      <section className="p-6 bg-paper-50 border border-paper-200 rounded-xl">
        <header className="flex items-center justify-between mb-5">
          <h2 className="font-semibold text-ink-900">Son Siparişler</h2>
          {orders.length > 0 && (
            <Link href="/hesabim/siparislerim" className="text-sm text-brand-700 hover:underline font-medium">
              Tümünü gör →
            </Link>
          )}
        </header>

        {recentOrders.length === 0 ? (
          <div className="py-12 text-center">
            <div className="w-14 h-14 mx-auto rounded-full bg-paper-100 grid place-items-center text-ink-500">
              <ShoppingBagOpen size={24} />
            </div>
            <p className="mt-4 text-ink-700 font-medium">Henüz siparişiniz yok</p>
            <p className="mt-1 text-sm text-ink-500">İlk siparişinize başlayın — tasarım desteği ücretsiz.</p>
            <Link href="/urunler"><Button className="mt-5">Alışverişe Başla</Button></Link>
          </div>
        ) : (
          <ul className="divide-y divide-paper-200">
            {recentOrders.map((o) => (
              <li key={o.id} className="py-4 flex items-center justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <Link href={`/hesabim/siparislerim/${o.id}`} className="font-mono text-sm font-semibold text-ink-900 hover:underline">
                    {o.orderNumber}
                  </Link>
                  <p className="text-xs text-ink-500 mt-0.5">
                    {formatDate(o.createdAt)} · {o.items.length} ürün ·{" "}
                    <span className="text-brand-700 font-medium">{orderStatusLabel(o.status)}</span>
                  </p>
                </div>
                <div className="flex items-center gap-3 flex-none">
                  <Price amount={o.total} className="text-ink-900 font-semibold" />
                  <Link href={`/hesabim/siparislerim/${o.id}`} className="text-ink-500 hover:text-ink-900">
                    <ArrowRight size={16} />
                  </Link>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Hızlı erişim */}
      <div className="grid sm:grid-cols-3 gap-4">
        <QuickLink href="/hesabim/tekrar-siparis" icon={<ArrowsClockwise size={20} />} title="Hızlı Tekrar Sipariş" desc="Geçmişten tek tıkla yenile" />
        <QuickLink href="/hesabim/adreslerim" icon={<MapPin size={20} />} title="Adreslerim" desc="Teslimat adreslerin" />
        <QuickLink href="/hesabim/bilgilerim" icon={<Package size={20} />} title="Bilgilerim" desc="Profil + iletişim" />
      </div>
    </div>
  );
}

function StatCard({ icon, label, value, accent }: { icon: React.ReactNode; label: string; value: React.ReactNode; accent: string }) {
  return (
    <div className="p-5 bg-paper-50 border border-paper-200 rounded-xl">
      <div className={`w-10 h-10 rounded-md grid place-items-center mb-3 ${accent}`}>{icon}</div>
      <div className="text-xs uppercase tracking-wider text-ink-500 font-semibold">{label}</div>
      <div className="mt-1 text-2xl md:text-3xl font-semibold text-ink-900 tabular-nums">{value}</div>
    </div>
  );
}

function QuickLink({ href, icon, title, desc }: { href: string; icon: React.ReactNode; title: string; desc: string }) {
  return (
    <Link href={href} className="group p-5 bg-paper-50 border border-paper-200 rounded-xl hover:border-ink-300 hover:shadow-md transition-all">
      <div className="flex items-center gap-3 text-brand-700 mb-3">{icon}</div>
      <div className="font-semibold text-ink-900">{title}</div>
      <div className="text-sm text-ink-500 mt-0.5">{desc}</div>
      <span className="mt-3 inline-flex items-center gap-1 text-xs font-medium text-brand-700 group-hover:gap-2 transition-all">
        Aç <ArrowRight size={12} weight="bold" />
      </span>
    </Link>
  );
}
