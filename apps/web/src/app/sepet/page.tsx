"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Container, Button, Price } from "@markala/ui";
import {
  Trash, Plus, Minus, ArrowRight, ShoppingBagOpen, ShieldCheck,
  Clock, Tag, Truck, Storefront,
} from "@phosphor-icons/react";
import type { Category } from "@markala/types";
import { useCartStore } from "@/lib/cart-store";
import { track } from "@/lib/analytics";
import { apiClient } from "@/lib/api";
import { PromoBanner } from "@/components/promo-banner";
import { VAT_RATE } from "@/lib/vat";

/** Sepette gösterilen tahmini indirim; gerçek indirim sipariş oluşturulurken sunucuda hesaplanır. */
const KNOWN_COUPONS: Record<string, number> = { HOSGELDIN: 0.10 };

export default function CartPage() {
  const { items, updateQuantity, removeItem, subtotal } = useCartStore();
  const storedCoupon = useCartStore((s) => s.couponCode);
  const setStoreCoupon = useCartStore((s) => s.setCoupon);
  const [coupon, setCoupon] = useState("");
  const [couponError, setCouponError] = useState<string | null>(null);
  /** Kargo ayarları /settings/shipping'ten çekilir; API hatasında 79/750 fallback korunur. */
  const [shipping, setShipping] = useState({ fee: 79, freeThreshold: 750 });
  useEffect(() => {
    apiClient.settings.shipping().then(setShipping).catch(() => {});
  }, []);

  const sub = subtotal();
  // Uygulanan kupon cart-store'da tutulur → /odeme'ye taşınır (eskiden yalnız bu sayfanın
  // local state'indeydi, ödemeye geçince sessizce düşüyordu = bait-and-switch).
  const appliedCode = storedCoupon && KNOWN_COUPONS[storedCoupon] ? storedCoupon : null;
  const discount = appliedCode ? sub * (KNOWN_COUPONS[appliedCode] ?? 0) : 0;
  const shippingFee = sub >= shipping.freeThreshold ? 0 : sub > 0 ? shipping.fee : 0;
  const subAfterDiscount = Math.max(0, sub - discount);
  // Fiyatlar KDV DAHİL → gösterilen KDV, tutarın İÇİNDEKİ paydır (gross − gross/1.2), üstüne EKLENMEZ.
  const vat = subAfterDiscount - subAfterDiscount / (1 + VAT_RATE);
  const total = subAfterDiscount + shippingFee;

  function handleApplyCoupon() {
    const code = coupon.trim().toUpperCase();
    setCouponError(null);
    if (!code) return;
    if (KNOWN_COUPONS[code] && sub > 0) {
      setStoreCoupon(code);
      setCoupon("");
    } else {
      setCouponError("Geçersiz veya süresi dolmuş kupon kodu.");
    }
  }

  function handleRemoveCoupon() {
    setStoreCoupon(null);
    setCouponError(null);
  }

  if (items.length === 0) return <EmptyCart />;

  return (
    <>
      <PromoBanner location="cart" className="pt-4" />
      <div className="bg-paper-100 border-b border-paper-200">
        <Container className="py-8 md:py-10">
          <p className="text-sm text-brand-700 font-semibold uppercase tracking-wider">Sepet</p>
          <h1 className="mt-1 text-3xl md:text-4xl font-semibold text-ink-900">Siparişinizi tamamlayın</h1>
          <p className="mt-2 text-ink-500 text-sm">{items.length} ürün · KDV dahil fiyatlar</p>
        </Container>
      </div>

      <Container className="py-10 md:py-14">
        <div className="grid lg:grid-cols-12 gap-8">
          <section className="lg:col-span-8 space-y-3">
            {items.map((item) => (
              <article
                key={item.id}
                className="flex gap-4 md:gap-5 p-4 md:p-5 bg-paper-50 border border-paper-200 rounded-xl hover:border-ink-300 transition-colors"
              >
                <Link href={`/urun/${item.productSlug}`} className="relative w-24 h-24 md:w-28 md:h-28 rounded-lg bg-paper-100 overflow-hidden flex-none">
                  <Image src={item.productImage} alt={item.productName} fill sizes="120px" className="object-cover" />
                </Link>
                <div className="flex-1 min-w-0">
                  <Link href={`/urun/${item.productSlug}`} className="font-semibold text-ink-900 hover:underline">
                    {item.productName}
                  </Link>
                  <p className="mt-1 text-sm text-ink-500">{item.configuration.summary}</p>
                  {item.configuration.uploadedFileName && (
                    <p className="mt-1 text-xs text-success">📎 {item.configuration.uploadedFileName}</p>
                  )}
                  {item.configuration.needsDesign && (
                    <p className="mt-1 text-xs text-brand-700">✦ Tasarım desteği isteniyor</p>
                  )}
                  <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
                    <QtyControl value={item.quantity} onChange={(n) => updateQuantity(item.id, n)} />
                    <div className="flex items-center gap-4">
                      <Price amount={item.configuration.totalPrice * item.quantity} size="lg" className="text-ink-900" />
                      <button onClick={() => removeItem(item.id)} className="p-2 text-ink-500 hover:text-error rounded transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink-900 focus-visible:ring-offset-1" aria-label="Sil">
                        <Trash size={18} />
                      </button>
                    </div>
                  </div>
                </div>
              </article>
            ))}
            <Link href="/urunler" className="inline-flex items-center gap-1.5 mt-4 text-sm font-medium text-brand-700 hover:text-brand-900">
              ← Alışverişe devam et
            </Link>
          </section>

          <aside className="lg:col-span-4">
            <div className="lg:sticky lg:top-24 space-y-4">
              <div className="p-5 md:p-6 bg-paper-50 border border-paper-200 rounded-xl shadow-sm">
                <h2 className="font-semibold text-ink-900 mb-4">Sipariş Özeti</h2>
                <dl className="space-y-2.5 text-sm">
                  <Row label="Ara toplam" value={<Price amount={sub} className="text-ink-900" />} />
                  {discount > 0 && (
                    <Row label={`Kupon (${appliedCode})`} value={<Price amount={-discount} className="text-success" />} />
                  )}
                  <Row label="Kargo" value={shippingFee === 0 ? <span className="text-success font-medium">Ücretsiz</span> : <Price amount={shippingFee} className="text-ink-900" />} />
                  <Row label={`KDV (%${VAT_RATE * 100} dahil)`} value={<Price amount={vat} className="text-ink-500" />} muted />
                  <div className="border-t border-paper-200 pt-3 mt-3">
                    <Row label={<span className="text-base font-semibold text-ink-900">Toplam</span>} value={<Price amount={total} size="lg" className="text-ink-900" />} />
                  </div>
                </dl>
                {sub > 0 && sub < shipping.freeThreshold && (
                  <div className="mt-4 p-3 bg-brand-50 border border-brand-200 rounded-md flex items-center gap-2 text-xs text-ink-700">
                    <Truck size={14} className="text-brand-700 flex-none" />
                    <span><Price amount={shipping.freeThreshold - sub} size="sm" /> daha ekleyin → kargo ücretsiz</span>
                  </div>
                )}
                <Link
                  href="/odeme"
                  className="block mt-5"
                  onClick={() => track("begin_checkout", { currency: "TRY", value: total, items: items.length })}
                >
                  <Button size="lg" fullWidth>Siparişe Devam Et <ArrowRight size={18} weight="bold" /></Button>
                </Link>
              </div>

              <div className="p-5 bg-paper-50 border border-paper-200 rounded-xl">
                <details className="text-sm">
                  <summary className="cursor-pointer font-medium text-ink-900 flex items-center gap-2">
                    <Tag size={16} /> Kupon kodun var mı?
                  </summary>
                  <div className="mt-3 flex gap-2">
                    <input type="text" value={coupon} onChange={(e) => { setCoupon(e.target.value); setCouponError(null); }} placeholder="Kupon kodu" className="flex-1 px-3 py-2 rounded border border-paper-200 bg-paper-50 text-ink-900 text-sm focus:border-ink-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-300/30" />
                    <Button variant="outline" size="md" onClick={handleApplyCoupon} disabled={!coupon.trim()}>Uygula</Button>
                  </div>
                  {couponError && <p role="alert" className="mt-2 text-xs text-error">{couponError}</p>}
                  {appliedCode && (
                    <p className="mt-2 text-xs text-success flex items-center gap-2">
                      ✓ {appliedCode} kuponu uygulandı
                      <button onClick={handleRemoveCoupon} className="text-ink-500 hover:text-error underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink-900 focus-visible:ring-offset-1">kaldır</button>
                    </p>
                  )}
                  <p className="mt-2 text-xs text-ink-500">İpucu: yeni müşteriler için <code className="font-mono bg-paper-100 px-1.5 py-0.5 rounded">HOSGELDIN</code></p>
                </details>
              </div>

              <ul className="grid grid-cols-3 gap-2">
                <Trust icon={<Clock size={18} />} label="1-2 iş günü üretim" />
                <Trust icon={<Truck size={18} />} label="81 il kargo" />
                <Trust icon={<ShieldCheck size={18} />} label="KVKK uyumlu" />
              </ul>
            </div>
          </aside>
        </div>
      </Container>
    </>
  );
}

function EmptyCart() {
  // Popüler kategoriler CANLI API'den (admin'in eklediği kategoriler de görünsün);
  // API boş → kategori listesi gösterilmez.
  const [categories, setCategories] = useState<Category[]>([]);
  useEffect(() => {
    let active = true;
    apiClient.categories
      .list()
      .then((list) => {
        if (active && Array.isArray(list)) setCategories(list);
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, []);

  const popular = categories.slice(0, 6);
  return (
    <Container className="py-16 md:py-24">
      <div className="text-center max-w-xl mx-auto">
        <div className="w-24 h-24 mx-auto rounded-full bg-paper-100 grid place-items-center text-ink-500">
          <ShoppingBagOpen size={40} />
        </div>
        <h1 className="mt-6 text-3xl md:text-4xl font-semibold text-ink-900">Sepetiniz boş</h1>
        <p className="mt-3 text-ink-700">Henüz sepete ürün eklemediniz. Aşağıdan popüler kategorilerimizi inceleyin.</p>
        <Link href="/urunler"><Button size="lg" className="mt-6">Ürünleri Keşfet <ArrowRight size={18} weight="bold" /></Button></Link>
      </div>
      <section className="mt-16">
        <h2 className="text-center text-sm font-semibold uppercase tracking-wider text-ink-500 mb-6">Popüler Kategoriler</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 max-w-4xl mx-auto">
          {popular.map((c) => (
            <Link key={c.slug} href={`/kategori/${c.slug}`} className="flex flex-col items-center gap-2 p-4 bg-paper-50 border border-paper-200 rounded-lg hover:border-ink-300 hover:shadow-md transition-all">
              <div className="w-10 h-10 rounded-md bg-brand-100 text-brand-700 grid place-items-center"><Storefront size={18} /></div>
              <span className="text-xs font-medium text-ink-900 text-center">{c.name}</span>
            </Link>
          ))}
        </div>
      </section>
    </Container>
  );
}

function Row({ label, value, muted }: { label: React.ReactNode; value: React.ReactNode; muted?: boolean }) {
  return <div className={`flex items-baseline justify-between ${muted ? "text-ink-500" : ""}`}><dt>{label}</dt><dd>{value}</dd></div>;
}

function Trust({ icon, label }: { icon: React.ReactNode; label: string }) {
  return <li className="flex flex-col items-center gap-1 p-3 bg-paper-50 border border-paper-200 rounded text-xs text-ink-500"><span className="text-ink-700">{icon}</span><span className="text-center leading-tight">{label}</span></li>;
}

function QtyControl({ value, onChange }: { value: number; onChange: (n: number) => void }) {
  return (
    <div className="inline-flex items-center border border-paper-200 rounded">
      <button onClick={() => onChange(value - 1)} disabled={value <= 1} className="w-11 h-11 grid place-items-center text-ink-700 hover:bg-paper-100 disabled:opacity-30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink-900 focus-visible:ring-offset-1" aria-label="Azalt"><Minus size={14} /></button>
      <span aria-live="polite" aria-atomic="true" className="w-10 text-center text-sm tabular-nums font-medium">{value}</span>
      <button onClick={() => onChange(value + 1)} className="w-11 h-11 grid place-items-center text-ink-700 hover:bg-paper-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink-900 focus-visible:ring-offset-1" aria-label="Arttır"><Plus size={14} /></button>
    </div>
  );
}
