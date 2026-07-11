"use client";

import { useState, type ReactNode } from "react";
import Link from "next/link";
import { Container, Button } from "@markala/ui";
import { Package, CheckCircle, ArrowRight, Truck, Ruler, Sparkle } from "@phosphor-icons/react";
import { TurnstileWidget, turnstileEnabled } from "@/components/turnstile-widget";
import { PhoneInput } from "@/components/forms/phone-input";
import { track } from "@/lib/analytics";

const inputClass =
  "w-full px-4 py-3 rounded-lg border border-paper-200 bg-paper-50 text-ink-900 text-sm focus:border-ink-900 focus:outline-none focus:ring-2 focus:ring-brand-300/30 transition-all";

const perks = [
  {
    icon: Ruler,
    title: "Gramajı elinizle görün",
    sub: "300 / 350 / 400 gr kartvizit farkını dokunarak hissedin.",
  },
  {
    icon: Sparkle,
    title: "Yüzey işlemleri",
    sub: "Mat/parlak selefon, kabartma lak ve yaldız örnekleri.",
  },
  {
    icon: Truck,
    title: "81 il ücretsiz kargo",
    sub: "Numune kutusu 2-3 iş günü içinde adresinize gelir.",
  },
];

function Field({
  id,
  label,
  required,
  children,
}: {
  id: string;
  label: string;
  required?: boolean;
  children: ReactNode;
}) {
  return (
    <div>
      <label htmlFor={id} className="block text-sm font-medium text-ink-800 mb-1.5">
        {label} {required && <span className="text-error">*</span>}
      </label>
      {children}
    </div>
  );
}

export default function NumuneTalebiPage() {
  const [sent, setSent] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ticketId, setTicketId] = useState<string | null>(null);

  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
    productInterest: "",
  });
  const [kvkkAccepted, setKvkkAccepted] = useState(false);
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);

  function update<K extends keyof typeof form>(key: K, val: string) {
    setForm((f) => ({ ...f, [key]: val }));
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!kvkkAccepted) {
      setError("KVKK aydınlatma metnini onaylamadan talep gönderemezsiniz.");
      return;
    }
    setError(null);
    setSubmitting(true);
    try {
      const res = await fetch("/api/numune-talebi", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, turnstileToken }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Talep gönderilemedi.");
        return;
      }
      setTicketId(data.ticketId ?? null);
      setSent(true);
      track("generate_lead", { method: "sample_box" });
    } catch {
      setError("Sunucuya ulaşılamadı.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      <div className="bg-paper-100 border-b border-paper-200">
        <Container className="py-12 md:py-16">
          <div className="max-w-2xl">
            <p className="text-sm text-brand-700 font-semibold uppercase tracking-wider">
              Numune Kutusu
            </p>
            <h1 className="mt-2 text-4xl md:text-5xl font-semibold text-ink-900 leading-tight">
              Sipariş öncesi elinizle görün
            </h1>
            <p className="mt-4 text-lg text-ink-700">
              Kâğıt gramajı, selefon ve baskı kalitesi ekranda tam anlaşılmaz. Ücretsiz numune
              kutumuzu adresinize gönderelim; kararınızı dokunarak verin.
            </p>
          </div>
        </Container>
      </div>

      <Container className="py-12 md:py-16">
        <section className="grid md:grid-cols-3 gap-4 mb-14">
          {perks.map((p) => (
            <div key={p.title} className="p-6 bg-paper-50 border border-paper-200 rounded-xl">
              <div className="w-12 h-12 rounded-lg grid place-items-center mb-4 bg-brand-100 text-brand-700">
                <p.icon size={22} weight="regular" />
              </div>
              <div className="font-semibold text-ink-900">{p.title}</div>
              <p className="mt-2 text-sm text-ink-500 leading-relaxed">{p.sub}</p>
            </div>
          ))}
        </section>

        <div className="grid lg:grid-cols-12 gap-10">
          <section className="lg:col-span-7">
            <header className="mb-6">
              <h2 className="text-2xl md:text-3xl font-semibold text-ink-900">
                Numune kutusu isteyin
              </h2>
              <p className="mt-2 text-ink-700">
                Formu doldurun; kutunuzu 2-3 iş günü içinde kargoya verelim.
              </p>
            </header>

            {sent ? (
              <div className="p-10 bg-success/5 border border-success/20 rounded-xl text-center">
                <div className="w-14 h-14 mx-auto rounded-full bg-success/10 grid place-items-center text-success">
                  <CheckCircle size={28} weight="fill" />
                </div>
                <h3 className="mt-4 text-xl font-semibold text-ink-900">Talebiniz alındı</h3>
                <p className="mt-2 text-ink-700">Numune kutunuz 2-3 iş günü içinde kargolanır.</p>
                {ticketId && (
                  <code className="mt-3 inline-block px-3 py-1.5 rounded bg-paper-100 text-xs text-ink-700 font-mono">
                    Talep No: {ticketId}
                  </code>
                )}
                <div className="mt-6">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setSent(false);
                      setTicketId(null);
                      setForm({ name: "", email: "", phone: "", address: "", productInterest: "" });
                    }}
                  >
                    Yeni Talep
                  </Button>
                </div>
              </div>
            ) : (
              <form
                onSubmit={onSubmit}
                className="p-6 md:p-8 bg-paper-50 border border-paper-200 rounded-xl space-y-4"
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
                <div className="grid sm:grid-cols-2 gap-4">
                  <Field id="numune-name" label="Ad Soyad" required>
                    <input
                      id="numune-name"
                      className={inputClass}
                      required
                      autoComplete="name"
                      value={form.name}
                      onChange={(e) => update("name", e.target.value)}
                    />
                  </Field>
                  <Field id="numune-email" label="E-posta" required>
                    <input
                      id="numune-email"
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
                <Field id="numune-interest" label="İlgilendiğiniz ürünler">
                  <input
                    id="numune-interest"
                    className={inputClass}
                    placeholder="Örn. kartvizit, broşür, branda"
                    value={form.productInterest}
                    onChange={(e) => update("productInterest", e.target.value)}
                  />
                </Field>
                <Field id="numune-address" label="Kargo adresi" required>
                  <textarea
                    id="numune-address"
                    required
                    rows={4}
                    className={`${inputClass} resize-none`}
                    placeholder="Ad, sokak, mahalle, ilçe/il ve posta kodu ile eksiksiz yazın."
                    value={form.address}
                    onChange={(e) => update("address", e.target.value)}
                  />
                </Field>
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
                    okudum, kişisel verilerimin yalnızca numune kutusunun gönderimi için işlenmesine
                    onay veriyorum.
                  </span>
                </label>
                <TurnstileWidget action="contact" onToken={setTurnstileToken} />
                <Button
                  type="submit"
                  size="lg"
                  disabled={submitting || !kvkkAccepted || (turnstileEnabled && !turnstileToken)}
                >
                  {submitting ? "Gönderiliyor..." : "Numune Kutusu İste"}{" "}
                  <ArrowRight size={16} weight="bold" />
                </Button>
              </form>
            )}
          </section>

          <aside className="lg:col-span-5">
            <div className="lg:sticky lg:top-24 p-6 bg-ink-900 text-paper-50 rounded-xl">
              <div className="w-12 h-12 rounded-lg grid place-items-center mb-4 bg-brand-500 text-ink-900">
                <Package size={24} weight="fill" />
              </div>
              <h3 className="text-lg font-semibold">Kutuda neler var?</h3>
              <ul className="mt-3 space-y-2 text-sm text-paper-200">
                <li>• Farklı gramajlarda kartvizit örnekleri (300 / 350 / 400 gr)</li>
                <li>• Mat ve parlak selefon karşılaştırması</li>
                <li>• Kabartma lak ve yaldız uygulama örnekleri</li>
                <li>• Broşür ve branda malzeme örnekleri</li>
              </ul>
              <p className="mt-4 text-xs text-paper-300">
                Numune kutusu ücretsizdir. Yoğun dönemlerde kargo süresi değişebilir. Kurumsal
                hacimli işler için{" "}
                <Link href="/teklif-al" className="underline text-brand-300">
                  teklif alabilirsiniz
                </Link>
                .
              </p>
            </div>
          </aside>
        </div>
      </Container>
    </>
  );
}
