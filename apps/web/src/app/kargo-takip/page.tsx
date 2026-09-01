"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { Container, Button } from "@markala/ui";
import { Truck, MagnifyingGlass, Package, Receipt, EnvelopeSimple } from "@phosphor-icons/react";
import { TrackingTimeline } from "@/components/tracking/timeline";
import { formatDate, orderStatusLabel } from "@/lib/format";
import { buildTrackingEvents } from "@/lib/tracking-events";

const inputClass = "w-full px-4 py-3 rounded-lg border border-paper-200 bg-paper-50 text-ink-900 text-sm focus:border-ink-900 focus:outline-none focus:ring-2 focus:ring-brand-300/30 transition-all";

/** Sunucudan dönen public takip yanıtı (yalnız takip için gereken alanlar). */
interface TrackResult {
  orderNumber: string;
  status: string;
  createdAt: string;
  shippedAt: string | null;
  deliveredAt: string | null;
  trackingNumber: string | null;
  trackingCarrier: string | null;
  itemCount: number;
}

/** DHL Unified API'den (bizim /cargo-tracking proxy'miz) dönen sade takip sonucu. */
interface DhlResult {
  trackingNumber: string;
  status: "pre-transit" | "in-transit" | "delivered" | "failure" | "unknown";
  statusDescription?: string;
  estimatedDelivery?: string;
  events: Array<{ timestamp: string; statusCode: string; description: string; location?: string }>;
}

const DHL_TAKIP_SAYFASI = "https://www.dhlecommerce.com.tr/gonderitakip";

const DHL_DURUM: Record<DhlResult["status"], { label: string; cls: string }> = {
  "pre-transit": { label: "Hazırlanıyor", cls: "bg-paper-200 text-ink-700" },
  "in-transit": { label: "Yolda", cls: "bg-warning/10 text-warning" },
  delivered: { label: "Teslim Edildi", cls: "bg-success/10 text-success" },
  failure: { label: "Teslimat Sorunu", cls: "bg-error/10 text-error" },
  unknown: { label: "Durum Bilinmiyor", cls: "bg-paper-200 text-ink-500" },
};

export default function TrackingPage() {
  // İki sorgu yolu (2026-08-29): sipariş no + e-posta (bizim DB) veya DHL takip no
  // (DHL Unified API proxy'miz). Gönderiler Viniltürk'ün DHL hesabından çıktığı için
  // takip numarası veritabanımızda her zaman yok — müşteri DHL mailindeki numarayı
  // buraya yazıp durumu bizim sayfamızda görebilsin diye ikinci sekme var.
  // Varsayılan sekme "takipno" (2026-08-31, Hasan): siparişlerin 28'inden yalnız 1'inde
  // trackingNumber girili olduğu için "Sipariş No ile" yolu pratikte takip numarası
  // döndürmüyor; kullanıcıyı çalışan yolla karşılamak daha doğru.
  const [tab, setTab] = useState<"siparis" | "takipno">("takipno");
  const [orderNumber, setOrderNumber] = useState("");
  const [email, setEmail] = useState("");
  const [result, setResult] = useState<TrackResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const [dhlNo, setDhlNo] = useState("");
  const [dhlResult, setDhlResult] = useState<DhlResult | null>(null);
  /** fallback=true → hata DHL servis kaynaklı; DHL'in kendi sayfasına yönlendir. */
  const [dhlError, setDhlError] = useState<{ text: string; fallback: boolean } | null>(null);
  const [dhlLoading, setDhlLoading] = useState(false);

  /** Sonuç kutusu — sorgu bitince buraya kaydırılır (sonuç formun altında doğuyor). */
  const sonucRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    if (!dhlResult && !result) return;
    // prefers-reduced-motion'a saygı: hareket istemeyene ani konumlanma.
    const azHareket = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    sonucRef.current?.scrollIntoView({
      behavior: azHareket ? "auto" : "smooth",
      block: "start",
    });
  }, [dhlResult, result]);

  async function onDhlSubmit(e: React.FormEvent) {
    e.preventDefault();
    const no = dhlNo.replace(/\s+/g, "");
    setDhlError(null);
    setDhlResult(null);
    if (!/^[A-Za-z0-9]{8,25}$/.test(no)) {
      setDhlError({ text: "Takip numarası 8-25 haneli olmalı, yalnız harf ve rakam içermeli.", fallback: false });
      return;
    }
    setDhlLoading(true);
    try {
      const apiBase = (process.env.NEXT_PUBLIC_API_URL ?? "https://api.markala.com.tr").replace(/\/$/, "");
      const res = await fetch(`${apiBase}/api/cargo-tracking/${encodeURIComponent(no)}`);
      const data = await res.json().catch(() => null);
      if (res.ok && data && data.trackingNumber) {
        setDhlResult(data as DhlResult);
      } else if (res.status === 404) {
        setDhlError({
          text: (data && data.message) || "Bu numarayla gönderi bulunamadı.",
          fallback: false,
        });
      } else {
        // 503 (servis yok) ve diğer her şey → DHL sayfasına yönlendiren geri düşüş.
        setDhlError({
          text: (data && data.message) || "Takip servisi şu an yanıt vermiyor.",
          fallback: true,
        });
      }
    } catch {
      setDhlError({ text: "Sorgu şu an yapılamadı.", fallback: true });
    } finally {
      setDhlLoading(false);
    }
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const apiBase = (process.env.NEXT_PUBLIC_API_URL ?? "https://api.markala.com.tr").replace(/\/$/, "");
      const res = await fetch(`${apiBase}/api/orders/track`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderNumber: orderNumber.trim(), email: email.trim() }),
      });
      const data = await res.json().catch(() => null);
      if (res.ok && data && data.orderNumber) {
        setResult(data as TrackResult);
      } else {
        setResult(null);
        setError(
          (data && data.message) ||
            "Bu bilgilerle eşleşen sipariş bulunamadı. Sipariş numaranızı ve e-posta adresinizi kontrol edin.",
        );
      }
    } catch {
      setResult(null);
      setError("Sorgu şu an yapılamadı, lütfen birazdan tekrar deneyin.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      {/* Başlık ŞERİDİ — eskiden dev bir hero'ydu (py-12/16, 64px ikon, 5xl başlık, iki
          satırlık açıklama). Bu sayfaya gelen kullanıcının tek işi var: numarayı yazıp
          sonucu görmek. Hero ekranın yarısını yiyip formu ve sonucu aşağı ittiği için
          "sorgu yaptım, sonuç geldi mi?" hissi oluşuyordu (2026-08-31, Hasan).
          Tek satıra indirildi; ikon başlığın yanına alındı, açıklama kısaltıldı. */}
      <div className="bg-paper-100 border-b border-paper-200">
        <Container className="py-6 md:py-8 max-w-3xl">
          <div className="flex items-center gap-3">
            <span className="w-11 h-11 flex-none rounded-full bg-brand-100 grid place-items-center text-brand-700">
              <Truck size={22} weight="regular" />
            </span>
            <div className="min-w-0">
              <h1 className="text-2xl md:text-3xl font-semibold text-ink-900 leading-tight">Kargo Takip</h1>
              <p className="text-sm text-ink-700">
                DHL takip numaranızla gönderinizin anlık konumunu görün.
              </p>
            </div>
          </div>
        </Container>
      </div>

      <Container className="py-6 md:py-8 max-w-3xl">
        {/* Sorgu yolu seçimi */}
        <div className="grid grid-cols-2 gap-2 mb-4" role="tablist" aria-label="Sorgu türü">
          <button
            type="button"
            role="tab"
            aria-selected={tab === "siparis"}
            onClick={() => setTab("siparis")}
            className={`py-3 rounded-lg text-sm font-semibold border transition-colors ${
              tab === "siparis"
                ? "bg-ink-900 text-paper-50 border-ink-900"
                : "bg-paper-50 text-ink-700 border-paper-200 hover:bg-paper-100"
            }`}
          >
            Sipariş No ile
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={tab === "takipno"}
            onClick={() => setTab("takipno")}
            className={`py-3 rounded-lg text-sm font-semibold border transition-colors ${
              tab === "takipno"
                ? "bg-ink-900 text-paper-50 border-ink-900"
                : "bg-paper-50 text-ink-700 border-paper-200 hover:bg-paper-100"
            }`}
          >
            DHL Takip No ile
          </button>
        </div>

        {tab === "takipno" && (
          <>
            <form onSubmit={onDhlSubmit} className="bg-paper-50 border border-paper-200 rounded-xl p-6 md:p-8 space-y-4 shadow-sm">
              <Field label="DHL Takip Numarası" hint="DHL eCommerce'in size gönderdiği e-posta/SMS'teki numara">
                <input
                  value={dhlNo}
                  onChange={(e) => setDhlNo(e.target.value)}
                  placeholder="582839286786"
                  className={`${inputClass} font-mono`}
                  inputMode="numeric"
                  maxLength={25}
                  required
                />
              </Field>

              {dhlError && (
                <div role="alert" className="p-3 bg-error/5 border border-error/20 rounded-md text-sm text-error">
                  {dhlError.text}
                  {dhlError.fallback && (
                    <>
                      {" "}
                      <a
                        href={DHL_TAKIP_SAYFASI}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-semibold underline"
                      >
                        DHL eCommerce takip sayfasında sorgulayın ↗
                      </a>
                    </>
                  )}
                </div>
              )}

              <Button type="submit" size="lg" fullWidth disabled={dhlLoading || !dhlNo.trim()}>
                <MagnifyingGlass size={18} weight="bold" /> {dhlLoading ? "Sorgulanıyor…" : "Gönderiyi Sorgula"}
              </Button>

              <p className="text-xs text-ink-500 text-center">
                Numaranız sistemimizde saklanmaz; sorgu DHL&apos;in resmî takip servisinden yapılır.
              </p>
            </form>

            {dhlResult && (
              // ref + aria-live: sonuç formun ALTINDA doğuyor ve uzun sayfada gözden
              // kaçıyordu ("sorgu yaptım, geldi mi?"). Sonuç gelince oraya kaydırılır ve
              // ekran okuyucuya duyurulur. mt-12 → mt-6: forma yakın dursun.
              <div ref={sonucRef} aria-live="polite" className="mt-6 space-y-6 scroll-mt-24">
                <div className="p-5 bg-paper-50 border border-paper-200 rounded-xl flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <div className="text-xs text-ink-500 uppercase tracking-wider font-semibold">DHL Takip No</div>
                    <div className="font-mono font-semibold text-ink-900 mt-0.5 text-lg">{dhlResult.trackingNumber}</div>
                    {dhlResult.estimatedDelivery && (
                      <div className="text-sm text-ink-500 mt-1">
                        Tahmini teslimat: {formatDate(dhlResult.estimatedDelivery)}
                      </div>
                    )}
                  </div>
                  <span className={`px-3 py-1.5 rounded-full text-sm font-semibold ${DHL_DURUM[dhlResult.status].cls}`}>
                    {DHL_DURUM[dhlResult.status].label}
                  </span>
                </div>

                {dhlResult.events.length > 0 && (
                  <ol className="bg-paper-50 border border-paper-200 rounded-xl divide-y divide-paper-200">
                    {[...dhlResult.events]
                      .sort((a, b) => (a.timestamp < b.timestamp ? 1 : -1))
                      .map((e, i) => (
                        <li key={`${e.timestamp}-${i}`} className="p-4 flex gap-4">
                          <div className="text-xs text-ink-500 tabular-nums w-28 flex-none pt-0.5">
                            {formatDate(e.timestamp)}
                          </div>
                          <div className="min-w-0">
                            <div className="text-sm text-ink-900">{e.description}</div>
                            {e.location && <div className="text-xs text-ink-500 mt-0.5">{e.location}</div>}
                          </div>
                        </li>
                      ))}
                  </ol>
                )}

                <p className="text-xs text-ink-500 text-center">
                  Kaynak: DHL eCommerce ·{" "}
                  <a href={DHL_TAKIP_SAYFASI} target="_blank" rel="noopener noreferrer" className="hover:underline">
                    DHL takip sayfasında görüntüle ↗
                  </a>
                </p>
              </div>
            )}
          </>
        )}

        {tab === "siparis" && (
        <form onSubmit={onSubmit} className="bg-paper-50 border border-paper-200 rounded-xl p-6 md:p-8 space-y-4 shadow-sm">
          <Field label="Sipariş Numarası" hint="MK-XXXX-XXXX formatında, sipariş onay mailinizde">
            <input value={orderNumber} onChange={(e) => setOrderNumber(e.target.value.toUpperCase())} placeholder="MK-..." className={`${inputClass} font-mono`} required />
          </Field>
          <Field label="E-posta Adresi" hint="Sipariş verirken kullandığınız e-posta">
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="ornek@firma.com" className={inputClass} autoComplete="email" required />
          </Field>

          {error && <div role="alert" className="p-3 bg-error/5 border border-error/20 rounded-md text-sm text-error">{error}</div>}

          <Button type="submit" size="lg" fullWidth disabled={loading || !orderNumber.trim() || !email.trim()}>
            <MagnifyingGlass size={18} weight="bold" /> {loading ? "Sorgulanıyor…" : "Siparişi Sorgula"}
          </Button>

          <p className="text-xs text-ink-500 text-center">
            Hesabınız varsa <Link href="/giris" className="text-brand-700 hover:underline font-medium">giriş yapıp</Link> tüm siparişlerinizi görebilirsiniz.
          </p>
        </form>
        )}

        {tab === "siparis" && result && (
          <div ref={sonucRef} aria-live="polite" className="mt-6 space-y-6 scroll-mt-24">
            <div className="p-5 bg-paper-50 border border-paper-200 rounded-xl flex flex-wrap items-start justify-between gap-4">
              <div>
                <div className="text-xs text-ink-500 uppercase tracking-wider font-semibold">Sipariş</div>
                <div className="font-mono font-semibold text-ink-900 mt-0.5 text-lg">{result.orderNumber}</div>
                <div className="text-sm text-ink-500 mt-1">{formatDate(result.createdAt)} · {result.itemCount} ürün</div>
              </div>
              <span className="px-3 py-1.5 rounded-full text-sm font-semibold bg-brand-100 text-brand-900">{orderStatusLabel(result.status)}</span>
            </div>

            {/* Gerçek durum + zaman damgaları. Takip no yalnız kargoya verildiyse (ekiple girildiyse)
                gösterilir — uydurma DHL numarası ÜRETİLMEZ. */}
            <TrackingTimeline
              events={buildTrackingEvents(result)}
              trackingNumber={result.trackingNumber ?? undefined}
              carrier={result.trackingCarrier ?? "Kargo"}
            />
          </div>
        )}

        {tab === "siparis" && !result && (
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
