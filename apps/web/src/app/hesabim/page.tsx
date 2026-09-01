"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Button, Price, cn } from "@markala/ui";
import { ArrowRight, Sparkle, ShoppingBagOpen } from "@phosphor-icons/react";
import { useAuthStore } from "@/lib/auth-store";
import { apiClient, withRefresh } from "@/lib/api";
import { formatDate, orderStatusLabel } from "@/lib/format";
import { gorunurNav, type AccountNavContext } from "@/components/account/account-nav";
import type { Order, OrderStatus } from "@markala/types";

const normStatus = (s: string): OrderStatus => s.replace(/_/g, "-") as OrderStatus;

/**
 * HESAP PANOSU — yeniden tasarım (2026-08-31, Hasan: "çorba olmuş, istenilen bulunamıyor").
 *
 * Kaldırılanlar ve NEDENİ:
 * - Üç büyük istatistik kartı (0 / 0 ₺ / 0): yeni üyede ekranın yarısını kaplayıp sıfır
 *   bilgi veriyordu. Yerine tek satırlık metrik şeridi; sıfırsa HİÇ basılmıyor.
 * - Koyu "%10 hoş geldin" bandı + hemen altındaki boş-durum "Alışverişe Başla" butonu:
 *   AYNI çağrı iki kez yapılıyordu. Kupon artık boş-durumun içinde tek bir çip.
 * - Sadakat için ayrı bir koyu blok daha vardı; üst üste iki siyah kutu oluyordu.
 *   Puan artık metrik şeridinde bir hücre.
 *
 * Gezinme buradan KALKTI: 14 sayfa artık kalıcı kenar çubuğunda (AccountShell).
 * Panodaki kısayol şeridi de aynı account-nav.ts kaydından okuyor.
 */
export default function AccountOverviewPage() {
  const user = useAuthStore((s) => s.user);
  const isBootstrapping = useAuthStore((s) => s.isBootstrapping);
  const [orders, setOrders] = useState<Order[] | null>(null);
  const [loyalty, setLoyalty] = useState<{ enabled: boolean; balance: number; redeemPerTl: number } | null>(null);

  useEffect(() => {
    if (isBootstrapping || !user) return;
    let iptal = false;
    withRefresh(() => apiClient.orders.listMine())
      .then((d) => !iptal && setOrders(d ?? []))
      .catch(() => !iptal && setOrders([]));
    withRefresh(() => apiClient.loyalty.me())
      .then((d) => !iptal && setLoyalty({ enabled: d.enabled, balance: d.balance, redeemPerTl: d.redeemPerTl }))
      .catch(() => undefined);
    return () => {
      iptal = true;
    };
  }, [user, isBootstrapping]);

  // Oturumsuz ziyaretçi eskiden BOMBOŞ sayfa görüyordu (return null) — artık girişe yönlenir.
  if (!isBootstrapping && !user) {
    return (
      <div className="py-16 text-center">
        <p className="text-ink-700">Bu sayfa için giriş yapmanız gerekiyor.</p>
        <Link href="/giris?next=/hesabim">
          <Button className="mt-5">Giriş Yap</Button>
        </Link>
      </div>
    );
  }
  if (!user) return null;

  const list = orders ?? [];
  const yukleniyor = orders === null;
  const toplamHarcama = list.reduce((a, o) => a + Number(o.total), 0);
  const acikSiparis = list.filter((o) => !["teslim-edildi", "iptal-edildi"].includes(normStatus(o.status as unknown as string))).length;
  const sonSiparisler = list.slice(0, 3);
  const ilkAd = (user.fullName || "").trim().split(/\s+/)[0];

  const kisayollar = gorunurNav({
    accountType: (user as { accountType?: string }).accountType ?? null,
    loyaltyEnabled: loyalty?.enabled === true,
  }).filter((m) => m.group !== null).slice(0, 8);

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-2xl md:text-3xl font-semibold text-ink-900">
          {ilkAd ? `Merhaba ${ilkAd}` : "Panom"}
        </h1>
        <p className="mt-1 text-sm text-ink-500">Siparişlerini ve hesap bilgilerini buradan yönetirsin.</p>
      </header>

      {/* METRİK ŞERİDİ — sıfır değerler basılmaz (yeni üyede şerit hiç görünmez) */}
      {!yukleniyor && list.length > 0 && (
        <div className="flex flex-wrap items-center gap-x-8 gap-y-3 px-5 py-4 bg-paper-100 border border-paper-200 rounded-xl">
          <Metrik etiket="Sipariş" deger={String(list.length)} />
          {acikSiparis > 0 && <Metrik etiket="Devam eden" deger={String(acikSiparis)} vurgu />}
          <Metrik etiket="Toplam harcama" deger={<Price amount={toplamHarcama} />} />
          {loyalty?.enabled && loyalty.balance > 0 && (
            <Link href="/hesabim/puanlarim" className="group">
              <Metrik
                etiket="Puan"
                deger={
                  <span className="inline-flex items-center gap-1 group-hover:text-brand-700">
                    {loyalty.balance.toLocaleString("tr-TR")}
                    <ArrowRight size={13} weight="bold" className="opacity-0 group-hover:opacity-100 transition-opacity" />
                  </span>
                }
              />
            </Link>
          )}
        </div>
      )}

      {/* SON SİPARİŞLER */}
      <section>
        <header className="flex items-center justify-between mb-3">
          <h2 className="text-base font-semibold text-ink-900">Son Siparişler</h2>
          {list.length > 3 && (
            <Link href="/hesabim/siparislerim" className="text-sm font-medium text-brand-700 hover:text-ink-900">
              Tümü ({list.length}) →
            </Link>
          )}
        </header>

        {yukleniyor ? (
          <div className="space-y-2">
            {[0, 1].map((i) => (
              <div key={i} className="h-16 bg-paper-100 rounded-xl animate-pulse" />
            ))}
          </div>
        ) : sonSiparisler.length === 0 ? (
          // BOŞ DURUM: kupon burada, ayrı bir banner olarak DEĞİL — tek çağrı, tek buton.
          <div className="px-6 py-10 text-center bg-paper-50 border border-paper-200 rounded-xl">
            <div className="w-12 h-12 mx-auto rounded-full bg-paper-100 grid place-items-center text-ink-500">
              <ShoppingBagOpen size={22} />
            </div>
            <p className="mt-4 font-medium text-ink-900">Henüz siparişin yok</p>
            <p className="mt-1 text-sm text-ink-500">Tasarımın yoksa ücretsiz hazırlıyoruz.</p>
            <span className="mt-4 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-brand-50 border border-brand-200 text-xs font-medium text-brand-700">
              <Sparkle size={12} weight="fill" />
              İlk siparişine %10: <code className="font-mono font-semibold">HOSGELDIN</code>
            </span>
            <div>
              <Link href="/urunler">
                <Button className="mt-5">
                  Alışverişe Başla <ArrowRight size={16} weight="bold" />
                </Button>
              </Link>
            </div>
          </div>
        ) : (
          <ul className="border border-paper-200 rounded-xl divide-y divide-paper-200 overflow-hidden">
            {sonSiparisler.map((o) => (
              <li key={o.id}>
                <Link
                  href={`/hesabim/siparislerim/${o.id}`}
                  className="flex items-center justify-between gap-4 px-5 py-4 hover:bg-paper-100 transition-colors"
                >
                  <span className="min-w-0">
                    <span className="block font-mono text-sm font-semibold text-ink-900">{o.orderNumber}</span>
                    <span className="block text-xs text-ink-500 mt-0.5 truncate">
                      {formatDate(o.createdAt)} · {o.items.length} ürün ·{" "}
                      <span className="text-brand-700 font-medium">
                        {orderStatusLabel(normStatus(o.status as unknown as string))}
                      </span>
                    </span>
                  </span>
                  <span className="flex items-center gap-3 flex-none">
                    <Price amount={o.total} className="text-ink-900 font-semibold" />
                    <ArrowRight size={16} className="text-ink-500" />
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* KISAYOL ŞERİDİ — account-nav.ts'ten; mobilde kenar çubuğu olmadığı için asıl gezinme burası */}
      <section>
        <h2 className="text-base font-semibold text-ink-900 mb-3">Hesabım</h2>
        <ul className="grid grid-cols-2 md:grid-cols-4 gap-2.5">
          {kisayollar.map((m) => {
            const Ikon = m.icon;
            return (
              <li key={m.href}>
                <Link
                  href={m.href}
                  className="group h-full flex flex-col gap-1 p-4 bg-paper-50 border border-paper-200 rounded-xl hover:border-ink-300 hover:shadow-sm transition-all"
                >
                  <Ikon size={20} className="text-brand-700" />
                  <span className="mt-1 text-sm font-semibold text-ink-900 leading-snug">{m.label}</span>
                  <span className="text-xs text-ink-500 leading-snug">{m.desc}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </section>
    </div>
  );
}

function Metrik({ etiket, deger, vurgu }: { etiket: string; deger: React.ReactNode; vurgu?: boolean }) {
  return (
    <span className="block">
      <span className="block text-[11px] font-semibold uppercase tracking-wider text-ink-500">{etiket}</span>
      <span className={cn("block text-lg font-semibold tabular-nums", vurgu ? "text-brand-700" : "text-ink-900")}>
        {deger}
      </span>
    </span>
  );
}
