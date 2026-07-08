"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Button, Price } from "@markala/ui";
import { ArrowLeft, Truck, Receipt, MapPin, Buildings } from "@phosphor-icons/react";
import { useAuthStore } from "@/lib/auth-store";
import { apiClient, withRefresh } from "@/lib/api";
import { formatDate, orderStatusLabel } from "@/lib/format";
import { unitCountFromSummary } from "@/lib/cart-store";
import { buildTrackingEvents } from "@/lib/tracking-events";
import { TrackingTimeline } from "@/components/tracking/timeline";
import type { Address, Order, OrderStatus } from "@markala/types";

// API Prisma enum'u underscore döndürebilir (teslim_edildi); UI/aşama eşlemeleri hyphen kullanıyor.
const normStatus = (s: string): OrderStatus => s.replace(/_/g, "-") as OrderStatus;

/**
 * Sipariş status'üne göre kargo-takibi aşamalarını üretir.
 * Status ÖNCE normalize edilir; aksi halde "teslim_edildi" aşama eşlemesine (hyphen)
 * düşmez, ilk aşamaya (Sipariş Alındı ~%6) geriler.
 */
export default function OrderDetailPage({ params }: { params: { orderId: string } }) {
  const user = useAuthStore((s) => s.user);
  const isBootstrapping = useAuthStore((s) => s.isBootstrapping);
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState(false);
  const [payError, setPayError] = useState<string | null>(null);

  async function handleRetryPayment(orderId: string) {
    setPaying(true);
    setPayError(null);
    try {
      const res = await withRefresh(() => apiClient.payments.retry(orderId));
      if (res?.paymentPageUrl) {
        window.location.href = res.paymentPageUrl; // iyzico hosted ödeme sayfası
        return;
      }
      setPayError("Ödeme başlatılamadı. Lütfen tekrar deneyin.");
    } catch {
      setPayError("Ödeme başlatılamadı. Lütfen birkaç dakika sonra tekrar deneyin.");
    } finally {
      setPaying(false);
    }
  }

  useEffect(() => {
    if (isBootstrapping || !user) return;
    let cancelled = false;
    setLoading(true);
    withRefresh(() => apiClient.orders.detail(params.orderId))
      .then((o) => { if (!cancelled) { setOrder(o ?? null); setLoading(false); } })
      .catch(() => { if (!cancelled) { setOrder(null); setLoading(false); } });
    return () => { cancelled = true; };
  }, [user, isBootstrapping, params.orderId]);

  if (loading) {
    return <div className="space-y-4">{[0, 1].map((i) => <div key={i} className="h-40 bg-paper-100 border border-paper-200 rounded-xl animate-pulse" />)}</div>;
  }

  if (!order) {
    return (
      <div className="text-center py-16">
        <p className="text-ink-700">Sipariş bulunamadı.</p>
        <Link href="/hesabim/siparislerim">
          <Button variant="outline" className="mt-4">Siparişlerime Dön</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Link href="/hesabim/siparislerim" className="inline-flex items-center gap-1.5 text-sm text-ink-700 hover:text-ink-900">
        <ArrowLeft size={14} /> Tüm siparişler
      </Link>

      <header className="flex items-start justify-between gap-4">
        <div>
          <h2 className="font-mono font-medium text-2xl text-ink-900">{order.orderNumber}</h2>
          <p className="mt-1 text-sm text-ink-500">{formatDate(order.createdAt)}</p>
        </div>
        <span className="px-3 py-1.5 rounded-full text-sm font-medium bg-brand-100 text-brand-900">
          {orderStatusLabel(normStatus(order.status as unknown as string))}
        </span>
      </header>

      {/* Ödeme durumu. Açık hesap (cari) siparişlerinde kartla ödeme YOK → borç cari hesaba
          işlenir, ödeme oradan yapılır. Diğerlerinde beklemede→"Ödeme Yap", başarılı→onay. */}
      {order.paymentMethod === "cari" ? (
        <section className="p-5 bg-brand-50 border border-brand-200 rounded-xl">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="font-semibold text-ink-900 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-brand-500" /> Açık Hesap (Cari)
              </p>
              <p className="mt-1 text-sm text-ink-700">
                Bu siparişin tutarı kurumsal cari hesabınıza borç olarak işlendi. Ödemeyi
                vade dahilinde Cari Hesabım sayfasından yapabilirsiniz.
              </p>
            </div>
            <Link href="/hesabim/cari-hesabim">
              <Button variant="outline">Cari Hesabım</Button>
            </Link>
          </div>
        </section>
      ) : order.paymentStatus === "beklemede" && normStatus(order.status as unknown as string) !== "iptal-edildi" ? (
        <section className="p-5 bg-warning/10 border border-warning/30 rounded-xl">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="font-semibold text-ink-900 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-warning" /> Ödeme Bekliyor
              </p>
              <p className="mt-1 text-sm text-ink-700">
                Bu siparişin ödemesi henüz tamamlanmadı. Aşağıdaki butonla güvenli ödeme sayfasından tamamlayabilirsiniz.
              </p>
              {payError && <p className="mt-2 text-sm text-error">{payError}</p>}
            </div>
            <Button onClick={() => handleRetryPayment(order.id)} disabled={paying}>
              {paying ? "Yönlendiriliyor…" : `Ödeme Yap — ${Number(order.total).toLocaleString("tr-TR")} ₺`}
            </Button>
          </div>
        </section>
      ) : order.paymentStatus === "basarili" ? (
        <section className="p-4 bg-success/10 border border-success/30 rounded-xl">
          <p className="text-sm font-medium text-success flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-success" /> Ödeme Yapıldı
          </p>
        </section>
      ) : null}

      <section className="p-6 bg-paper-50 border border-paper-200 rounded-lg">
        <h3 className="font-medium text-ink-900 mb-4 flex items-center gap-2">
          <Receipt size={18} /> Ürünler
        </h3>
        <ul className="divide-y divide-paper-200">
          {order.items.map((item, i) => (
            <li key={i} className="py-3 flex gap-3">
              <Link
          href={`/urun/${item.productSlug}`}
                className="relative w-20 h-20 rounded bg-paper-100 overflow-hidden flex-none"
              >
                <Image src={item.productImage} alt={item.productName} fill
              sizes="80px" className="object-cover"/>
              </Link>
              <div className="flex-1 min-w-0">
                <Link href={`/urun/${item.productSlug}`} className="font-medium text-ink-900 text-sm hover:underline">
                  {item.productName}
                </Link>
                <p className="text-xs text-ink-500">{item.configurationSummary}</p>
                <p className="text-xs text-ink-500 mt-1">x{item.quantity * unitCountFromSummary(item.configurationSummary)}</p>
              </div>
              <Price amount={item.lineTotal} className="text-ink-900 flex-none self-start" />
            </li>
          ))}
        </ul>
        <div className="mt-5 pt-5 border-t border-paper-200 space-y-1.5 text-sm">
          <Row label="Ara toplam" value={<Price amount={order.subtotal} />} />
          <Row label="Kargo" value={order.shippingFee === 0 ? <span className="text-success">Ücretsiz</span> : <Price amount={order.shippingFee} />} />
          {order.discount > 0 && (
            <Row label="İndirim" value={<span className="inline-flex items-center text-success">-&nbsp;<Price amount={order.discount} /></span>} />
          )}
          {/* KDV fiyatlara DAHİL — additive değil; Toplam = Ara toplam + Kargo. Etiket bunu netleştirir. */}
          <Row label="KDV (%20 dahil)" value={<Price amount={order.vat} className="text-ink-500" />} />
          <div className="pt-3 border-t border-paper-200 flex items-baseline justify-between">
            <span className="font-medium text-ink-900">Toplam</span>
            <Price amount={order.total} size="lg" className="text-ink-900" />
          </div>
        </div>
      </section>

      <section>
        <h3 className="font-medium text-ink-900 mb-4 flex items-center gap-2">
          <Truck size={18} /> Kargo Takibi
        </h3>
        <TrackingTimeline
          events={buildTrackingEvents({ status: normStatus(order.status as unknown as string), createdAt: order.createdAt })}
          trackingNumber={order.trackingNumber ?? undefined}
          carrier={order.trackingCarrier ?? "Kargo"}
        />
      </section>

      <div className="grid sm:grid-cols-2 gap-4">
        <section className="p-6 bg-paper-50 border border-paper-200 rounded-lg">
          <h3 className="font-medium text-ink-900 mb-3 flex items-center gap-2">
            <MapPin size={18} /> Teslimat Adresi
          </h3>
          <AddressBlock a={order.shippingAddress} />
        </section>
        <section className="p-6 bg-paper-50 border border-paper-200 rounded-lg">
          <h3 className="font-medium text-ink-900 mb-3 flex items-center gap-2">
            {order.billingAddress?.type === "corporate" ? <Buildings size={18} /> : <Receipt size={18} />} Fatura Adresi
          </h3>
          <AddressBlock a={order.billingAddress ?? order.shippingAddress} billing />
        </section>
      </div>

      {/* İade / değişim politikası erişimi */}
      <div className="text-sm text-ink-500 pt-2 border-t border-paper-200">
        Ürününüzle ilgili sorun mu var?{" "}
        <Link href="/yasal/iade" className="text-brand-700 hover:underline font-medium">
          İade ve Değişim Politikası
        </Link>
        {" "}sayfasını inceleyin veya{" "}
        <Link href="/iletisim" className="text-brand-700 hover:underline">
          bizimle iletişime geçin
        </Link>
        .
      </div>
    </div>
  );
}

function AddressBlock({ a, billing }: { a: Address; billing?: boolean }) {
  // Snapshot adreslerinde a.type tanımsız olabilir; companyName varlığını fallback olarak kullan.
  const isCorporate = a.type === "corporate" || (!a.type && !!a.companyName);
  return (
    <div className="text-sm text-ink-700 leading-relaxed space-y-0.5">
      <p className="font-medium text-ink-900">{a.fullName}</p>
      {billing && isCorporate && a.companyName && (
        <p className="text-xs text-ink-500">{a.companyName}{a.taxNumber ? ` · VKN: ${a.taxNumber}` : ""}{a.taxOffice ? ` · ${a.taxOffice}` : ""}</p>
      )}
      <p className="text-ink-600">{a.fullAddress}</p>
      <p className="text-ink-500">{a.district} / {a.city}{a.zipCode ? ` · ${a.zipCode}` : ""}</p>
      <p className="text-ink-500">{a.phone}</p>
    </div>
  );
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-baseline justify-between text-ink-700">
      <dt className="text-ink-500">{label}</dt>
      <dd>{value}</dd>
    </div>
  );
}
