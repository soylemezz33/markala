"use client";

import Image from "next/image";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { Container, Button, Price } from "@markala/ui";
import { CheckCircle, Truck, EnvelopeSimple, House, Receipt, Buildings } from "@phosphor-icons/react";
import { useOrdersStore } from "@/lib/orders-store";
import { useCartStore } from "@/lib/cart-store";
import { formatDate, orderStatusLabel } from "@/lib/format";
import { trackPurchase } from "@/lib/analytics";
import type { Order } from "@markala/types";

// useSearchParams Suspense sınırı içinde okunmalı (next build prerender hatası önlenir) — repo deseni.
export default function OrderSuccessPage({ params }: { params: { orderId: string } }) {
  return (
    <Suspense fallback={null}>
      <OrderSuccessContent params={params} />
    </Suspense>
  );
}

function OrderSuccessContent({ params }: { params: { orderId: string } }) {
  const getById = useOrdersStore((s) => s.getById);
  const clearCart = useCartStore((s) => s.clear);
  const searchParams = useSearchParams();
  // Açık hesap (cari) ile verilen sipariş → "ödeme alındı" değil, "cari hesaba işlendi" mesajı göster.
  const isCari = searchParams.get("method") === "cari";
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const o = getById(params.orderId) ?? null;
    setOrder(o);
    setLoading(false);
    // Ödeme başarılı → sepeti temizle (başarısızlıkta /odeme/hata'ya gidilir, sepet korunur).
    clearCart();
    // GA4/Meta purchase — gerçek tahsilat onayı bu sayfada (sadece mount'ta bir kez).
    if (o) trackPurchase(o.orderNumber, o.total, o.items.length);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.orderId]);

  if (loading) return null;

  if (!order) {
    return (
      <Container className="py-24 text-center">
        <h1 className="text-display-md font-serif text-ink-900">Sipariş bulunamadı</h1>
        <p className="mt-3 text-ink-700">Bu siparişe erişim izniniz yok ya da sipariş silinmiş olabilir.</p>
        <Link href="/"><Button className="mt-6">Anasayfaya Dön</Button></Link>
      </Container>
    );
  }

  return (
    <Container className="py-12 md:py-16 max-w-3xl">
      <div className="text-center">
        <div className="w-16 h-16 mx-auto rounded-full bg-success/10 grid place-items-center text-success">
          <CheckCircle size={36} weight="fill" />
        </div>
        <h1 className="mt-5 text-3xl md:text-5xl font-semibold text-ink-900">
          {isCari ? "Siparişin alındı, teşekkürler! 🎉" : "Ödemen alındı, teşekkürler! 🎉"}
        </h1>
        <p className="mt-3 text-lg text-ink-700">
          {isCari ? (
            <>
              Siparişin başarıyla alındı ve tutarı <strong>açık hesabına (cari)</strong> işlendi. Faturan
              e-posta adresine iletilecek; ekibimiz üretim ve kargo sürecini başlatıyor.
            </>
          ) : (
            <>
              Siparişin ve ödemen başarıyla alındı. Faturan e-posta adresine iletilecek; ekibimiz üretim
              ve kargo sürecini başlatıyor.
            </>
          )}
        </p>
        <div className="mt-5 inline-flex items-center gap-2 px-4 py-2 bg-paper-100 rounded-full text-sm">
          <Receipt size={16} className="text-ink-700" />
          Sipariş No: <span className="font-mono font-medium text-ink-900">{order.orderNumber}</span>
        </div>
      </div>

      <div className="mt-10 grid md:grid-cols-3 gap-3">
        {isCari ? (
          <InfoTile
            icon={<Buildings size={20} />}
            title="Cari hesaba işlendi"
            desc={<Link href="/hesabim/cari-hesabim" className="text-brand-700 hover:underline">Cari hesabımı gör</Link>}
          />
        ) : (
          <InfoTile icon={<EnvelopeSimple size={20} />} title="Ödeme onaylandı" desc="Faturan e-posta ile gönderilecek" />
        )}
        <InfoTile icon={<Truck size={20} />} title="Kargo bilgisi" desc="Hazırlanınca takip kodu gönderilecek" />
        <InfoTile icon={<House size={20} />} title="Hesabım" desc={<Link href="/hesabim/siparislerim" className="text-brand-700 hover:underline">Siparişlerimi gör</Link>} />
      </div>

      <section className="mt-10 p-6 bg-paper-50 border border-paper-200 rounded-lg">
        <header className="flex items-center justify-between mb-4">
          <h2 className="font-medium text-ink-900">Sipariş Detayı</h2>
          <span className="text-xs px-2.5 py-1 rounded-full bg-brand-100 text-brand-900 font-medium">
            {orderStatusLabel(order.status)}
          </span>
        </header>

        <p className="text-sm text-ink-500 mb-4">{formatDate(order.createdAt)}</p>

        <ul className="space-y-3">
          {order.items.map((item, i) => (
            <li key={i} className="flex gap-3 pb-3 border-b border-paper-200 last:border-0 last:pb-0">
              <div className="relative w-16 h-16 rounded bg-paper-100 overflow-hidden flex-none">
                <Image src={item.productImage} alt={item.productName} fill
              sizes="64px" className="object-cover"/>
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-ink-900 text-sm">{item.productName}</p>
                <p className="text-xs text-ink-500 line-clamp-2">{item.configurationSummary}</p>
                <div className="mt-1 flex items-center justify-between text-xs">
                  <span className="text-ink-500">x{item.quantity}</span>
                  <Price amount={item.lineTotal} className="text-ink-900" />
                </div>
              </div>
            </li>
          ))}
        </ul>

        <div className="mt-5 pt-5 border-t border-paper-200 space-y-1.5 text-sm">
          <div className="flex justify-between text-ink-500"><span>Ara toplam</span><Price amount={order.subtotal} /></div>
          <div className="flex justify-between text-ink-500">
            <span>Kargo</span>
            {order.shippingFee === 0 ? <span className="text-success">Ücretsiz</span> : <Price amount={order.shippingFee} />}
          </div>
          <div className="flex justify-between text-ink-500"><span>KDV</span><Price amount={order.vat} /></div>
          <div className="flex justify-between pt-2 border-t border-paper-200">
            <span className="font-medium text-ink-900">Toplam</span>
            <Price amount={order.total} size="lg" className="text-ink-900" />
          </div>
        </div>
      </section>

      <section className="mt-6 p-6 bg-paper-50 border border-paper-200 rounded-lg">
        <h2 className="font-medium text-ink-900 mb-3">Teslimat Adresi</h2>
        <p className="text-sm text-ink-700">
          {order.shippingAddress.fullName}<br />
          {order.shippingAddress.fullAddress}<br />
          {order.shippingAddress.district} / {order.shippingAddress.city} {order.shippingAddress.zipCode}<br />
          📞 {order.shippingAddress.phone}
        </p>
      </section>

      <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
        <Link href="/hesabim/siparislerim"><Button variant="outline" size="lg">Siparişlerim</Button></Link>
        <Link href="/"><Button size="lg">Alışverişe Devam</Button></Link>
      </div>
    </Container>
  );
}

function InfoTile({ icon, title, desc }: { icon: React.ReactNode; title: string; desc: React.ReactNode }) {
  return (
    <div className="p-4 bg-paper-50 border border-paper-200 rounded-lg">
      <div className="flex items-center gap-2 text-brand-700">{icon}<span className="font-medium text-ink-900 text-sm">{title}</span></div>
      <p className="mt-2 text-xs text-ink-500">{desc}</p>
    </div>
  );
}
