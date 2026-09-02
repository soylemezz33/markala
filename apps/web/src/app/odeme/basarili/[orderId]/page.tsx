"use client";

import Image from "next/image";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { Container, Button, Price } from "@markala/ui";
import { CheckCircle, Truck, EnvelopeSimple, House, Receipt, Buildings, Bank } from "@phosphor-icons/react";
import { BANKA_HESABI } from "@/lib/company";
import { useOrdersStore } from "@/lib/orders-store";
import { useCartStore, unitCountFromSummary } from "@/lib/cart-store";
import { formatDate, orderStatusLabel } from "@/lib/format";
import { trackPurchase } from "@/lib/analytics";
import { apiClient, withRefresh } from "@/lib/api";
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
  /**
   * Havale/EFT ile verilen sipariş: para HENÜZ GELMEDİ.
   * Bilerek purchase ATEŞLENMEZ (paymentConfirmed false kalır) — ödenmemiş sipariş
   * gelir sayılırsa GA4/Ads dönüşümü şişer. Admin ödemeyi onayladıktan sonra sayfa
   * tekrar açılırsa paymentStatus="basarili" gelir ve purchase o zaman ateşlenir.
   */
  const isHavale = searchParams.get("method") === "havale";
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  // Ödeme SUNUCU'dan doğrulanana kadar null — localStorage'a güvenmeyiz (sahte "ödendi" + GA4 şişmesi önlenir).
  const [paymentConfirmed, setPaymentConfirmed] = useState<boolean | null>(null);

  useEffect(() => {
    const local = getById(params.orderId) ?? null;
    setOrder(local);
    // Store'da sipariş varsa HEMEN göster (blank ekran yok); server doğrulaması arkada sürer.
    // Store MISS ise "bulunamadı" demeden önce sunucuyu bekle (.finally loading'i kapatır).
    if (local) setLoading(false);
    // Ödeme başarılı → sepeti temizle (başarısızlıkta /odeme/hata'ya gidilir, sepet korunur).
    clearCart();
    let cancelled = false;
    // Sunucudan sipariş durumunu DOĞRULA: sadece gerçekten ödenmiş (paymentStatus="basarili") ya da
    // cari siparişte purchase ateşle + "Ödemen alındı" göster. Böylece iptal edilmiş/sahte siparişe
    // doğrudan gidildiğinde GA4/Ads dönüşüm şişmesi ve yanlış "ödendi" ekranı engellenir.
    // Store MISS (farklı tarayıcı/gizli sekme/localStorage temizliği) → sunucu verisiyle render
    // et; yalnız store'a bakıp "Sipariş bulunamadı" gösterip ödenmiş müşteriyi paniğe SOKMA.
    withRefresh(() => apiClient.orders.detail(params.orderId))
      .then((srv) => {
        if (cancelled) return;
        if (srv && !local) setOrder(srv as unknown as Order); // store boşsa sunucudan doldur
        const ok = !!srv && (srv.paymentStatus === "basarili" || (isCari && srv.paymentMethod === "cari"));
        /**
         * Havale siparişinde purchase'ı İSTEMCİ ATEŞLEMEZ — dönüşümü sunucu,
         * ödemenin onaylandığı an bildirir (orders.service.ts > odemeOnayla).
         *
         * Neden: havalede sipariş anında para gelmemiştir. Ödeme onaylandıktan
         * sonra müşteri bu sayfayı tekrar açarsa paymentStatus="basarili" gelir
         * ve buradan da ateşlenirdi → aynı sipariş İKİ KEZ sayılırdı (2026-08
         * çift sayım olayının tekrarı). Ekran "ödemen alındı" göstermeye devam
         * eder; yalnız dönüşüm bildirimi sunucuya bırakılır.
         */
        const donusumuSunucuBildirir = srv?.paymentMethod === "havale";
        setPaymentConfirmed(ok);
        if (ok && !donusumuSunucuBildirir) {
          // SUNUCU verisi öncelikli: local (store) siparişi client fiyatlarıyla kurulmuştur;
          // fiyat sapması varsa GA4/Meta purchase value yanlış gider. srv elimizdeyken onu kullan.
          const src = (srv as unknown as Order) ?? local;
          // Çift sayım koruması: başarı sayfası yenileme/geri dönüşle tekrar açıldığında purchase
          // YENİDEN atılıyordu — Meta event_id dedup penceresi (48s) dışında bu çift dönüşüm sayılır.
          // orderId başına tek atış: bayrak varsa hiç ateşleme. localStorage erişilemezse (gizli mod)
          // guard'sız devam — dönüşümü kaybetmek çift saymaktan daha kötü.
          const firedKey = `purchase_fired_${params.orderId}`;
          let alreadyFired = false;
          try {
            alreadyFired = window.localStorage.getItem(firedKey) === "1";
          } catch {
            /* localStorage yok/kapalı → guard atlanır */
          }
          if (!alreadyFired) {
            trackPurchase(
              src.orderNumber,
              // srv yolunda total Prisma Decimal'den STRING serileşir ("1234.5600") —
              // GA4/Ads value sözleşmesi number ister; unitPrice gibi normalize edilir.
              Number(src.total) || 0,
              src.items.length,
              // GA4 items[] + Meta content_ids: sipariş kalemlerinden. Kimlik = slug; kampanya
              // paketi gibi slug'sız kalemlerde ürün adına düşülür. price = birim fiyat —
              // sunucu yanıtında Decimal string gelebildiğinden Number() ile normalize edilir.
              src.items.map((it) => ({
                id: it.productSlug || it.productName,
                name: it.productName,
                price: Number(it.unitPrice) || 0,
                quantity: it.quantity,
              })),
            );
            try {
              window.localStorage.setItem(firedKey, "1");
            } catch {
              /* yazılamazsa sonraki ziyarette tekrar atılabilir — kabul edilir risk */
            }
          }
        }
      })
      .catch(() => {
        // Doğrulama başarısız (auth/ağ) → şişmeyi önlemek için purchase ATEŞLEME.
        if (!cancelled) setPaymentConfirmed(false);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
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
          {isCari
            ? "Siparişin alındı, teşekkürler! 🎉"
            : isHavale && !paymentConfirmed
              ? "Siparişin alındı, ödemeni bekliyoruz"
              : paymentConfirmed === false
                ? "Siparişin alındı, ödeme doğrulanıyor"
                : "Ödemen alındı, teşekkürler! 🎉"}
        </h1>
        <p className="mt-3 text-lg text-ink-700">
          {isCari ? (
            <>
              Siparişin başarıyla alındı ve tutarı <strong>açık hesabına (cari)</strong> işlendi. Faturan
              e-posta adresine iletilecek; ekibimiz üretim ve kargo sürecini başlatıyor.
            </>
          ) : isHavale && !paymentConfirmed ? (
            <>
              Siparişini aldık. Aşağıdaki hesaba <strong>havale/EFT</strong> yaptığında ödemeni
              onaylayıp üretime alacağız. Bu bilgiler e-posta adresine de gönderildi.
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

        {isHavale && !paymentConfirmed && (
          <div className="mx-auto mt-8 max-w-xl rounded-xl border border-paper-200 bg-paper-50 p-5 text-left">
            <div className="mb-3 flex items-center gap-2">
              <Bank size={18} weight="fill" className="text-brand-700" />
              <span className="font-semibold text-ink-900">Havale / EFT bilgileri</span>
            </div>
            <dl className="space-y-2 text-sm">
              <div className="flex flex-wrap justify-between gap-2">
                <dt className="text-ink-500">Alıcı</dt>
                <dd className="text-right font-medium text-ink-900">{BANKA_HESABI.unvan}</dd>
              </div>
              <div className="flex justify-between gap-2">
                <dt className="text-ink-500">Banka</dt>
                <dd className="font-medium text-ink-900">{BANKA_HESABI.banka}</dd>
              </div>
              <div className="flex flex-wrap items-center justify-between gap-2 border-t border-paper-200 pt-2">
                <dt className="text-ink-500">IBAN</dt>
                <dd className="font-mono text-base font-semibold text-ink-900">
                  {BANKA_HESABI.iban}
                </dd>
              </div>
              <div className="flex justify-between gap-2">
                <dt className="text-ink-500">Tutar</dt>
                <dd className="font-semibold text-ink-900">
                  {Number(order.total).toLocaleString("tr-TR")} ₺
                </dd>
              </div>
              <div className="flex justify-between gap-2">
                <dt className="text-ink-500">Açıklama</dt>
                <dd className="font-mono font-semibold text-ink-900">{order.orderNumber}</dd>
              </div>
            </dl>
            <p className="mt-3 rounded-md border border-brand-500/25 bg-brand-50/60 px-3 py-2 text-xs text-ink-700">
              <strong className="text-ink-900">Açıklama alanına sipariş numaranı yaz.</strong>{" "}
              Ödemeni siparişinle bu numara üzerinden eşleştiriyoruz; yazılmazsa onay gecikir.
            </p>
          </div>
        )}
      </div>

      <div className="mt-10 grid md:grid-cols-3 gap-3">
        {isCari ? (
          <InfoTile
            icon={<Buildings size={20} />}
            title="Cari hesaba işlendi"
            desc={<Link href="/hesabim/cari-hesabim" className="text-brand-700 hover:underline">Cari hesabımı gör</Link>}
          />
        ) : isHavale && !paymentConfirmed ? (
          <InfoTile icon={<Bank size={20} />} title="Ödeme bekleniyor" desc="Havale ulaştığında üretime alınır" />
        ) : (
          <InfoTile icon={<EnvelopeSimple size={20} />} title="Ödeme onaylandı" desc="Faturan e-posta ile gönderilecek" />
        )}
        <InfoTile icon={<Truck size={20} />} title="Kargo bilgisi" desc="Hazırlanınca takip kodu gönderilecek" />
        <InfoTile icon={<House size={20} />} title="Hesabım" desc={<Link href="/hesabim/siparislerim" className="text-brand-700 hover:underline">Siparişlerimi gör</Link>} />
      </div>

      {/* Dosya kalitesi bilgilendirmesi (sipariş SONRASI ayağı — üründeki upload uyarısı +
          sözleşme 7.C ile aynı kurgu): yalnız dosya yüklenmiş siparişlerde gösterilir. */}
      {order.items.some((it) => it.uploadedFileName) && (
        <div className="mt-6 p-4 bg-warning/10 border border-warning/25 rounded-lg text-sm text-ink-700 leading-relaxed">
          <p>
            <strong className="text-ink-900">Yüklediğiniz tasarım dosyası hakkında:</strong>{" "}
            Yapay zekâ ile üretilmiş, düşük çözünürlüklü veya vektörel olmayan dosyalarda baskıda
            bulanıklık ve metin bozulmaları oluşabilir; bu tür dosyalardan kaynaklanan kalite
            sorunlarından markala.com.tr sorumlu değildir. Dosyanızın baskıya uygunluğunu ekibimiz
            kontrol eder, gerekirse grafik ekibimiz görselinize istinaden{" "}
            <strong className="text-ink-900">vektörel çizimi ücretsiz hazırlayıp onayınıza sunar</strong>.
            Üretim, tasarım onayınızdan sonra başlar.
          </p>
        </div>
      )}

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
                  {/* Parça adedi (set × tiraj) — sepet/checkout ile tutarlı */}
                  <span className="text-ink-500">x{item.quantity * unitCountFromSummary(item.configurationSummary)}</span>
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
          <div className="pt-2 border-t border-paper-200">
            <div className="flex justify-between">
              <span className="font-medium text-ink-900">Toplam</span>
              <Price amount={order.total} size="lg" className="text-ink-900" />
            </div>
            {/* KDV toplanabilir satır DEĞİL bilgi notu — sepet/ödeme ile aynı desen (2026-08-12). */}
            <p className="mt-1 text-xs text-ink-500 text-right">
              Fiyatlara %20 KDV dahildir (KDV tutarı: <Price amount={order.vat} size="sm" className="text-ink-500" />)
            </p>
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
