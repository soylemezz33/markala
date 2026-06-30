"use client";

import { useState } from "react";
import Link from "next/link";
import { Container, Button } from "@markala/ui";
import { Truck, MagnifyingGlass, Package, Receipt, EnvelopeSimple } from "@phosphor-icons/react";
import { useOrdersStore } from "@/lib/orders-store";
import { generateMockTrackingEvents } from "@/lib/tracking-mock";
import { TrackingTimeline } from "@/components/tracking/timeline";
import { formatDate, orderStatusLabel } from "@/lib/format";
import type { Order } from "@markala/types";

const inputClass = "w-full px-4 py-3 rounded-lg border border-paper-200 bg-paper-50 text-ink-900 text-sm focus:border-ink-900 focus:outline-none focus:ring-2 focus:ring-brand-300/30 transition-all";

export default function TrackingPage() {
  const orders = useOrdersStore((s) => s.orders);
  const [orderNumber, setOrderNumber] = useState("");
  const [email, setEmail] = useState("");
  const [result, setResult] = useState<Order | null>(null);
  const [error, setError] = useState<string | null>(null);

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const found = orders.find(
      (o) =>
        o.orderNumber.toLowerCase() === orderNumber.trim().toLowerCase() &&
        (o.email ?? "").toLowerCase() === email.trim().toLowerCase(),
    );
    if (!found) {
      setError("Bu bilgilerle eşleşen sipariş bulunamadı. Sipariş numaranızı ve e-posta adresinizi kontrol edin.");
      setResult(null);
      return;
    }
    setResult(found);
  }

  return (
    <>
      <div className="bg-paper-100 border-b border-paper-200">
        <Container className="py-12 md:py-16 max-w-3xl text-center">
          <div className="w-16 h-16 mx-auto rounded-full bg-brand-100 grid place-items-center text-brand-700 mb-4">
            <Truck size={28} weight="regular" />
          </div>
          <p className="text-sm text-brand-700 font-semibold uppercase tracking-wider">DHL ile takip</p>
          <h1 className="mt-2 text-3xl md:text-5xl font-semibold text-ink-900 leading-tight">Kargo Takip</h1>
          <p className="mt-4 text-lg text-ink-700 max-w-xl mx-auto">
            Siparişinizin nerede olduğunu öğrenmek için sipariş numaranızı ve e-posta adresinizi girin.
          </p>
        </Container>
      </div>

      <Container className="py-12 md:py-16 max-w-3xl">
        <form onSubmit={onSubmit} className="bg-paper-50 border border-paper-200 rounded-xl p-6 md:p-8 space-y-4 shadow-sm">
          <Field label="Sipariş Numarası" hint="MK-XXXX-XXXX formatında — sipariş onay mailinizde">
            <input value={orderNumber} onChange={(e) => setOrderNumber(e.target.value.toUpperCase())} placeholder="MK-..." className={`${inputClass} font-mono`} required />
          </Field>
          <Field label="E-posta Adresi" hint="Sipariş verirken kullandığınız e-posta">
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="ornek@firma.com" className={inputClass} autoComplete="email" required />
          </Field>

          {error && <div role="alert" className="p-3 bg-error/5 border border-error/20 rounded-md text-sm text-error">{error}</div>}

          <Button type="submit" size="lg" fullWidth>
            <MagnifyingGlass size={18} weight="bold" /> Siparişi Sorgula
          </Button>

          <p className="text-xs text-ink-500 text-center">
            Hesabınız varsa <Link href="/giris" className="text-brand-700 hover:underline font-medium">giriş yapıp</Link> tüm siparişlerinizi görebilirsiniz.
          </p>
        </form>

        {result && (
          <div className="mt-12 space-y-6">
            <div className="p-5 bg-paper-50 border border-paper-200 rounded-xl flex flex-wrap items-start justify-between gap-4">
              <div>
                <div className="text-xs text-ink-500 uppercase tracking-wider font-semibold">Sipariş</div>
                <div className="font-mono font-semibold text-ink-900 mt-0.5 text-lg">{result.orderNumber}</div>
                <div className="text-sm text-ink-500 mt-1">{formatDate(result.createdAt)} · {result.items.length} ürün</div>
              </div>
              <span className="px-3 py-1.5 rounded-full text-sm font-semibold bg-brand-100 text-brand-900">{orderStatusLabel(result.status)}</span>
            </div>

            <TrackingTimeline
              events={generateMockTrackingEvents(result)}
              trackingNumber={result.trackingNumber ?? `DHL${result.id.slice(-12).toUpperCase()}`}
              carrier={result.trackingCarrier ?? "DHL"}
            />
          </div>
        )}

        {!result && (
          <section className="mt-12 grid sm:grid-cols-3 gap-3 text-sm">
            <Tile icon={<Receipt size={20} />} title="Sipariş No" desc="Onay mailinde MK- ile başlayan kod" />
            <Tile icon={<Package size={20} />} title="Üretim Süresi" desc="Çoğu üründe 1-3 iş günü" />
            <Tile icon={<Truck size={20} />} title="DHL Takip" desc="Türkiye geneli 1-3 iş günü" />
          </section>
        )}

        <div className="mt-10 p-5 bg-paper-100 border border-paper-200 rounded-xl flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex items-center gap-3">
            <EnvelopeSimple size={22} className="text-brand-700" weight="fill" />
            <div>
              <div className="font-semibold text-ink-900 text-sm">Sipariş bilgilerinizi bulamıyor musunuz?</div>
              <div className="text-xs text-ink-500 mt-0.5">Müşteri hizmetlerimiz size yardımcı olabilir.</div>
            </div>
          </div>
          <Link href="/iletisim"><Button variant="outline" size="md">İletişim →</Button></Link>
        </div>
      </Container>
    </>
  );
}

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="text-sm font-medium text-ink-900">{label}</span>
      {hint && <span className="block text-xs text-ink-500 mt-0.5">{hint}</span>}
      <div className="mt-2">{children}</div>
    </label>
  );
}

function Tile({ icon, title, desc }: { icon: React.ReactNode; title: string; desc: string }) {
  return (
    <div className="p-5 bg-paper-50 border border-paper-200 rounded-xl">
      <div className="text-brand-700">{icon}</div>
      <div className="mt-2 font-semibold text-ink-900">{title}</div>
      <p className="mt-1 text-xs text-ink-500 leading-relaxed">{desc}</p>
    </div>
  );
}
