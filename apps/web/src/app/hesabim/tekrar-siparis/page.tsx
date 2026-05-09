"use client";

import Link from "next/link";
import { Button } from "@markala/ui";
import { ArrowsClockwise, Package, ArrowRight, Star, ShoppingBag } from "@phosphor-icons/react";
import { useOrdersStore } from "@/lib/orders-store";
import { formatDate } from "@/lib/format";

export default function TekrarSiparisPage() {
  const orders = useOrdersStore((s) => s.orders);

  // Aynı ürünün birden fazla siparişini birleştir, en güncel siparişi kullan
  const productMap = new Map<string, { name: string; image: string; lastOrder: string; orderId: string; orderNumber: string; orderCount: number }>();
  for (const order of orders) {
    for (const item of order.items) {
      const existing = productMap.get(item.productSlug);
      if (existing) {
        existing.orderCount += 1;
        if (order.createdAt > existing.lastOrder) {
          existing.lastOrder = order.createdAt;
          existing.orderId = order.id;
          existing.orderNumber = order.orderNumber;
        }
      } else {
        productMap.set(item.productSlug, {
          name: item.productName,
          image: item.productImage,
          lastOrder: order.createdAt,
          orderId: order.id,
          orderNumber: order.orderNumber,
          orderCount: 1,
        });
      }
    }
  }

  const repeatable = Array.from(productMap.entries())
    .map(([slug, info]) => ({ slug, ...info }))
    .sort((a, b) => (a.lastOrder < b.lastOrder ? 1 : -1));

  return (
    <div className="space-y-6">
      <header>
        <h2 className="text-xl md:text-2xl font-semibold text-ink-900 flex items-center gap-2">
          <ArrowsClockwise size={24} weight="bold" className="text-brand-700" />
          Hızlı Tekrar Sipariş
        </h2>
        <p className="mt-1 text-sm text-ink-500 max-w-2xl">
          Daha önce sipariş verdiğiniz ürünleri tek tıkla yeniden sipariş edin. Eski sipariş bilgilerinizden konfigürasyonunuz otomatik yüklenir; sadece adet ve teslimat onayını verin.
        </p>
      </header>

      {repeatable.length === 0 ? (
        <div className="text-center py-16 bg-paper-50 border border-paper-200 rounded-xl">
          <div className="w-16 h-16 mx-auto rounded-full bg-paper-100 grid place-items-center text-ink-500">
            <Package size={28} />
          </div>
          <h3 className="mt-5 font-semibold text-ink-900 text-lg">Henüz tekrar sipariş edebileceğiniz ürün yok</h3>
          <p className="mt-2 text-sm text-ink-500 max-w-md mx-auto">
            İlk siparişinizi tamamladığınızda; o ürünleri buradan tek tıkla aynı konfigürasyonla yeniden sipariş edebilirsiniz.
          </p>
          <Link href="/urunler" className="mt-5 inline-block">
            <Button>
              <ShoppingBag size={16} weight="bold" /> Ürünlere Göz At
            </Button>
          </Link>
        </div>
      ) : (
        <ul className="space-y-3">
          {repeatable.map((p) => (
            <li
              key={p.slug}
              className="flex items-center gap-4 p-4 bg-paper-50 border border-paper-200 rounded-xl hover:border-ink-300 transition-colors"
            >
              {/* Ürün thumbnail */}
              <Link href={`/urun/${p.slug}`} className="flex-none w-20 h-20 rounded-lg overflow-hidden bg-paper-100">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={p.image || `/api/mockup?slug=${p.slug}&w=400&h=400`} alt={p.name} className="w-full h-full object-cover" />
              </Link>

              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-ink-900 truncate">
                  <Link href={`/urun/${p.slug}`} className="hover:text-brand-700 transition-colors">
                    {p.name}
                  </Link>
                </h3>
                <p className="text-xs text-ink-500 mt-1">
                  Son sipariş: <span className="font-medium text-ink-700">{formatDate(p.lastOrder)}</span>
                  {" · "}
                  <Link href={`/hesabim/siparislerim/${p.orderId}`} className="text-brand-700 hover:underline">
                    {p.orderNumber}
                  </Link>
                </p>
                {p.orderCount > 1 && (
                  <span className="inline-flex items-center gap-1 mt-1.5 px-2 py-0.5 rounded-full bg-brand-100 text-brand-900 text-[11px] font-semibold">
                    <Star size={10} weight="fill" /> {p.orderCount} kez sipariş edildi
                  </span>
                )}
              </div>

              <Link href={`/urun/${p.slug}`}>
                <Button variant="outline" size="md">
                  Yeniden Sipariş <ArrowRight size={14} weight="bold" />
                </Button>
              </Link>
            </li>
          ))}
        </ul>
      )}

      {/* Bilgi bandı */}
      <div className="grid sm:grid-cols-2 gap-4 mt-2">
        <div className="p-5 bg-paper-100 border border-paper-200 rounded-xl">
          <div className="w-10 h-10 rounded-md bg-paper-50 text-brand-700 grid place-items-center mb-3">
            <ArrowsClockwise size={20} weight="bold" />
          </div>
          <h3 className="font-semibold text-ink-900">Aynı konfigürasyon</h3>
          <p className="mt-1 text-sm text-ink-500 leading-relaxed">
            Önceki siparişlerinizdeki kâğıt, ebat, baskı ve adet seçimleri otomatik dolar. İsterseniz değiştirin, isterseniz olduğu gibi onaylayın.
          </p>
        </div>
        <div className="p-5 bg-brand-50 border border-brand-200 rounded-xl">
          <div className="w-10 h-10 rounded-md bg-brand-500 text-ink-900 grid place-items-center mb-3">
            <Star size={20} weight="fill" />
          </div>
          <h3 className="font-semibold text-ink-900">Sürekli müşteriye özel</h3>
          <p className="mt-1 text-sm text-ink-700 leading-relaxed">
            3+ tekrar siparişten sonra hesap yöneticinizle özel fiyat anlaşması yapma şansı; iletişime geçin.
          </p>
        </div>
      </div>
    </div>
  );
}
