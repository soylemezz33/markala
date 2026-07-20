"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Container, Button, cn } from "@markala/ui";
import {
  Sparkle,
  CheckCircle,
  ArrowRight,
  Lightning,
  ShieldCheck,
  PaintBrush,
  IdentificationCard,
} from "@phosphor-icons/react";
import { track } from "@/lib/analytics";
import { PhoneInput } from "@/components/forms/phone-input";
import { TurnstileWidget, turnstileEnabled } from "@/components/turnstile-widget";

const inputClass =
  "w-full px-4 py-3 rounded-lg border border-paper-200 bg-paper-50 text-ink-900 text-sm focus:border-ink-900 focus:outline-none focus:ring-2 focus:ring-brand-300/30 transition-all";

// Çoğunlukla kullanılan ürünler — header kategorileriyle uyumlu çoktan-seçmeli.
const PRODUCT_OPTIONS = [
  "Kartvizit",
  "Broşür & El İlanı",
  "Afiş & Poster",
  "Branda & Vinil",
  "Bayrak (Yelken/Masa)",
  "Rollup & Stand",
  "Tabela & Levha",
  "İSG Uyarı Levhaları",
  "Sticker & Etiket",
  "Kupa & Promosyon",
  "Tekstil / Kıyafet Baskı",
  "Kaşe & Mühür",
  "Davetiye & Kart",
  "Ambalaj & Kutu",
];

const SECTORS = [
  "Restoran & Kafe",
  "Otel & Konaklama",
  "Mağaza & Perakende",
  "İnşaat & Sanayi",
  "Sağlık & Klinik",
  "Eğitim",
  "Etkinlik & Organizasyon",
  "Kurumsal / Ofis",
  "E-ticaret",
  "Diğer",
];

const BUDGETS = [
  "Önce teklif görmek istiyorum",
  "0 – 1.000 ₺",
  "1.000 – 5.000 ₺",
  "5.000 – 15.000 ₺",
  "15.000 ₺ ve üzeri",
];

const FREQUENCIES = ["Tek seferlik", "Ara sıra", "Aylık düzenli", "Sürekli / sözleşmeli"];

const trustPoints = [
  { icon: Lightning, label: "24 saatte dönüş" },
  { icon: PaintBrush, label: "Ücretsiz tasarım" },
  { icon: ShieldCheck, label: "Kurumsal cari hesap" },
];

export default function TeklifAlPage() {
  const [sent, setSent] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ticketId, setTicketId] = useState<string | null>(null);

  const [form, setForm] = useState({
    companyName: "",
    sector: "",
    name: "",
    email: "",
    phone: "",
    budget: "",
    frequency: "",
    message: "",
  });
  const [selected, setSelected] = useState<string[]>([]);
  const [otherChecked, setOtherChecked] = useState(false);
  const [otherText, setOtherText] = useState("");
  const [kvkkAccepted, setKvkkAccepted] = useState(false);
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);

  // Anasayfa "Sektörünüze Özel" kartlarından gelen ?sektor= → sektörü ön-seç (geçerliyse).
  useEffect(() => {
    const s = new URLSearchParams(window.location.search).get("sektor");
    if (s && SECTORS.includes(s)) setForm((f) => ({ ...f, sector: s }));
  }, []);

  function update<K extends keyof typeof form>(key: K, val: string) {
    setForm((f) => ({ ...f, [key]: val }));
  }
  function toggleProduct(p: string) {
    setSelected((s) => (s.includes(p) ? s.filter((x) => x !== p) : [...s, p]));
  }

  function resetForm() {
    setSent(false);
    setTicketId(null);
    setForm({
      companyName: "",
      sector: "",
      name: "",
      email: "",
      phone: "",
      budget: "",
      frequency: "",
      message: "",
    });
    setSelected([]);
    setOtherChecked(false);
    setOtherText("");
    setKvkkAccepted(false);
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!kvkkAccepted) {
      setError("KVKK aydınlatma metnini onaylamadan talep gönderemezsiniz.");
      return;
    }
    const products = [...selected];
    if (otherChecked && otherText.trim()) products.push(`Diğer: ${otherText.trim()}`);
    if (products.length === 0) {
      setError("En az bir ürün seçin (ya da Diğer'i işaretleyip yazın).");
      return;
    }
    setError(null);
    setSubmitting(true);
    try {
      const res = await fetch("/api/teklif-al", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          companyName: form.companyName,
          sector: form.sector,
          name: form.name,
          email: form.email,
          phone: form.phone,
          budget: form.budget,
          quantity: form.frequency,
          message: form.message,
          products,
          turnstileToken,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Talep gönderilemedi.");
        return;
      }
      setTicketId(data.ticketId ?? null);
      setSent(true);
      track("generate_lead", { method: "quote_form", sector: form.sector });
    } catch {
      setError("Sunucuya ulaşılamadı.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      {/* Dark premium başlık — slider/kampanyalar diliyle */}
      <section className="relative overflow-hidden bg-ink-900 text-paper-50">
        <div
          aria-hidden
          className="pointer-events-none absolute -top-32 -right-24 w-[460px] h-[460px] rounded-full opacity-30 blur-3xl"
          style={{ background: "radial-gradient(circle, #F5B800, transparent 70%)" }}
        />
        <Container className="relative py-12 md:py-16">
          <div className="max-w-2xl">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-brand-500/15 text-brand-400 text-xs font-semibold uppercase tracking-wider">
              <Sparkle size={12} weight="fill" /> Teklif Al
            </span>
            <h1 className="mt-5 text-display-lg font-serif leading-[1.05]">
              İşletmene özel <span className="text-brand-400">teklif</span> hazırlayalım
            </h1>
            <p className="mt-4 text-paper-100/70 text-lg leading-relaxed">
              İhtiyacını birkaç adımda anlat — sana en uygun ürün, adet ve fiyat kombinasyonunu
              ekibimiz hazırlasın. Toplu işlerde özel indirim ve kurumsal cari hesap imkânı.
            </p>
            <div className="mt-6 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-paper-100/80">
              {trustPoints.map((t) => (
                <span key={t.label} className="inline-flex items-center gap-1.5">
                  <t.icon size={16} weight="fill" className="text-brand-400" /> {t.label}
                </span>
              ))}
            </div>
          </div>
        </Container>
      </section>

      <Container className="py-12 md:py-16">
        {sent ? (
          <div className="max-w-xl mx-auto p-10 bg-success/5 border border-success/20 rounded-xl text-center">
            <div className="w-14 h-14 mx-auto rounded-full bg-success/10 grid place-items-center text-success">
              <CheckCircle size={28} weight="fill" />
            </div>
            <h2 className="mt-4 text-2xl font-semibold text-ink-900">Talebin alındı 🎉</h2>
            <p className="mt-2 text-ink-700">
              Ekibimiz işletmene özel teklifi hazırlayıp en geç 24 saat içinde dönecek.
            </p>
            {ticketId && (
              <code className="mt-3 inline-block px-3 py-1.5 rounded bg-paper-100 text-xs text-ink-700 font-mono">
                Talep No: {ticketId}
              </code>
            )}
            <div className="mt-6 flex flex-wrap justify-center gap-3">
              <Button variant="outline" onClick={resetForm}>
                Yeni Talep
              </Button>
              <Link href="/urunler">
                <Button>
                  Ürünleri Keşfet <ArrowRight size={16} weight="bold" />
                </Button>
              </Link>
            </div>
          </div>
        ) : (
          <div className="grid lg:grid-cols-12 gap-10">
            {/* Sol: Form */}
            <form
              onSubmit={onSubmit}
              className="lg:col-span-8 p-6 md:p-8 bg-paper-50 border border-paper-200 rounded-xl space-y-8"
              noValidate
            >
              {error && (
                <div
                  role="alert"
                  aria-live="polite"
                  className="px-4 py-3 rounded-lg bg-error/10 border border-error/20 text-error text-sm"
                >
                  {error}
                </div>
              )}

              {/* 1. İşletme */}
              <fieldset className="space-y-4">
                <Legend n={1} title="İşletme bilgileri" />
                <div className="grid sm:grid-cols-2 gap-4">
                  <Field label="İşletme / Firma adı">
                    <input
                      className={inputClass}
                      value={form.companyName}
                      onChange={(e) => update("companyName", e.target.value)}
                      placeholder="Örn. Lezzet Restoran"
                    />
                  </Field>
                  <Field label="Sektör">
                    <select
                      className={inputClass}
                      value={form.sector}
                      onChange={(e) => update("sector", e.target.value)}
                    >
                      <option value="">Seçin...</option>
                      {SECTORS.map((s) => (
                        <option key={s}>{s}</option>
                      ))}
                    </select>
                  </Field>
                </div>
              </fieldset>

              {/* 2. Ürünler — çoktan seçmeli çipler */}
              <fieldset className="space-y-3">
                <Legend n={2} title="Çoğunlukla kullandığın ürünler" />
                <p className="text-sm text-ink-500 -mt-1">Birden fazla seçebilirsin.</p>
                <div className="flex flex-wrap gap-2">
                  {PRODUCT_OPTIONS.map((p) => {
                    const on = selected.includes(p);
                    return (
                      <button
                        key={p}
                        type="button"
                        onClick={() => toggleProduct(p)}
                        aria-pressed={on}
                        className={cn(
                          "inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full text-sm font-medium border transition-all",
                          on
                            ? "bg-ink-900 text-paper-50 border-ink-900"
                            : "bg-paper-50 text-ink-700 border-paper-200 hover:border-ink-300",
                        )}
                      >
                        {on && <CheckCircle size={15} weight="fill" className="text-brand-400" />}
                        {p}
                      </button>
                    );
                  })}
                  {/* Diğer */}
                  <button
                    type="button"
                    onClick={() => setOtherChecked((v) => !v)}
                    aria-pressed={otherChecked}
                    className={cn(
                      "inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full text-sm font-medium border transition-all",
                      otherChecked
                        ? "bg-ink-900 text-paper-50 border-ink-900"
                        : "bg-paper-50 text-ink-700 border-dashed border-paper-300 hover:border-ink-300",
                    )}
                  >
                    {otherChecked && <CheckCircle size={15} weight="fill" className="text-brand-400" />}
                    + Diğer
                  </button>
                </div>
                {otherChecked && (
                  <input
                    className={inputClass}
                    value={otherText}
                    onChange={(e) => setOtherText(e.target.value)}
                    placeholder="Hangi ürün(ler)? Örn. menü kartı, masa giydirme..."
                    maxLength={73}
                  />
                )}
              </fieldset>

              {/* 3. Hacim */}
              <fieldset className="space-y-4">
                <Legend n={3} title="Sipariş hacmi (opsiyonel)" />
                <div className="grid sm:grid-cols-2 gap-4">
                  <Field label="Sipariş sıklığı">
                    <select
                      className={inputClass}
                      value={form.frequency}
                      onChange={(e) => update("frequency", e.target.value)}
                    >
                      <option value="">Seçin...</option>
                      {FREQUENCIES.map((f) => (
                        <option key={f}>{f}</option>
                      ))}
                    </select>
                  </Field>
                  <Field label="Tahmini bütçe">
                    <select
                      className={inputClass}
                      value={form.budget}
                      onChange={(e) => update("budget", e.target.value)}
                    >
                      <option value="">Seçin...</option>
                      {BUDGETS.map((b) => (
                        <option key={b}>{b}</option>
                      ))}
                    </select>
                  </Field>
                </div>
                <Field label="Eklemek istediğin not">
                  <textarea
                    rows={4}
                    className={`${inputClass} resize-none`}
                    placeholder="Adet, ölçü, teslim tarihi, tasarım durumu — aklındaki her şeyi yazabilirsin."
                    value={form.message}
                    onChange={(e) => update("message", e.target.value)}
                  />
                </Field>
              </fieldset>

              {/* 4. İletişim */}
              <fieldset className="space-y-4">
                <Legend n={4} title="Size nasıl dönelim?" />
                <div className="grid sm:grid-cols-2 gap-4">
                  <Field label="Ad Soyad" required>
                    <input
                      className={inputClass}
                      required
                      autoComplete="name"
                      value={form.name}
                      onChange={(e) => update("name", e.target.value)}
                    />
                  </Field>
                  <Field label="E-posta" required>
                    <input
                      type="email"
                      className={inputClass}
                      required
                      autoComplete="email"
                      inputMode="email"
                      value={form.email}
                      onChange={(e) => update("email", e.target.value)}
                    />
                  </Field>
                </div>
                <PhoneInput
                  value={form.phone}
                  onChange={(v) => update("phone", v)}
                  label="Telefon"
                  inputClassName={inputClass}
                />
              </fieldset>

              <label className="flex items-start gap-2 text-xs text-ink-700">
                <input
                  type="checkbox"
                  required
                  checked={kvkkAccepted}
                  onChange={(e) => setKvkkAccepted(e.target.checked)}
                  className="mt-0.5"
                />
                <span>
                  <Link href="/yasal/kvkk" className="underline hover:text-ink-900">
                    KVKK aydınlatma metnini
                  </Link>{" "}
                  okudum, kişisel verilerimin yalnızca bu teklif talebinde değerlendirilmek üzere
                  işlenmesine onay veriyorum.
                </span>
              </label>

              {/* Bot koruması (iletişim formu deseni) — sunucu fail-closed doğrular. */}
              <TurnstileWidget action="quote" onToken={setTurnstileToken} />

              <Button type="submit" size="lg" disabled={submitting || !kvkkAccepted || (turnstileEnabled && !turnstileToken)} fullWidth>
                {submitting ? "Gönderiliyor..." : "Teklif Talebini Gönder"}{" "}
                <ArrowRight size={16} weight="bold" />
              </Button>
            </form>

            {/* Sağ: yan panel */}
            <aside className="lg:col-span-4">
              <div className="lg:sticky lg:top-24 space-y-4">
                <div className="p-6 bg-paper-50 border border-paper-200 rounded-xl">
                  <h3 className="font-semibold text-ink-900">Nasıl çalışır?</h3>
                  <ol className="mt-4 space-y-4">
                    {[
                      { t: "Talebini gönder", d: "Ürün ve işletme bilgini paylaş." },
                      { t: "Teklifini hazırlayalım", d: "24 saat içinde özel fiyat + tasarım önerisi." },
                      { t: "Onayla, üretelim", d: "Onayında 1-2 iş günü üretim, 81 ile kargo." },
                    ].map((s, i) => (
                      <li key={s.t} className="flex gap-3">
                        <span className="flex-none w-7 h-7 rounded-full bg-brand-500 text-ink-900 grid place-items-center text-sm font-bold">
                          {i + 1}
                        </span>
                        <div>
                          <div className="font-medium text-ink-900 text-sm">{s.t}</div>
                          <div className="text-xs text-ink-500 mt-0.5">{s.d}</div>
                        </div>
                      </li>
                    ))}
                  </ol>
                </div>

                <div className="p-6 bg-ink-900 text-paper-50 rounded-xl">
                  <IdentificationCard size={24} className="text-brand-400" weight="fill" />
                  <h3 className="mt-3 font-semibold text-lg">Acelen mi var?</h3>
                  <p className="mt-1 text-sm text-paper-100/70">
                    WhatsApp hattımızdan yazarsan ortalama 5 dakikada dönüş yaparız.
                  </p>
                  <a
                    href="https://wa.me/905319004102"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-brand-400 hover:text-brand-300"
                  >
                    WhatsApp hattı <ArrowRight size={14} weight="bold" />
                  </a>
                </div>
              </div>
            </aside>
          </div>
        )}
      </Container>
    </>
  );
}

function Legend({ n, title }: { n: number; title: string }) {
  return (
    <div className="flex items-center gap-2.5">
      <span className="flex-none w-7 h-7 rounded-lg bg-brand-100 text-brand-700 grid place-items-center text-sm font-bold">
        {n}
      </span>
      <h2 className="text-lg font-semibold text-ink-900">{title}</h2>
    </div>
  );
}

function Field({
  label,
  children,
  required,
}: {
  label: string;
  children: React.ReactNode;
  required?: boolean;
}) {
  return (
    <label className="block">
      <span className="text-sm font-medium text-ink-900">
        {label}
        {required && (
          <span className="text-error ml-0.5" aria-hidden="true">
            *
          </span>
        )}
      </span>
      <div className="mt-1.5">{children}</div>
    </label>
  );
}
