"use client";

import { useState, cloneElement, isValidElement, ReactElement } from "react";
import Link from "next/link";
import { Container, Button } from "@markala/ui";
import {
  Phone, EnvelopeSimple, MapPin, WhatsappLogo, Clock, ArrowRight,
  Buildings, Users, ChatCircle, CheckCircle,
} from "@phosphor-icons/react";
import { track } from "@/lib/analytics";
import { PhoneInput } from "@/components/forms/phone-input";

const inputClass = "w-full px-4 py-3 rounded-lg border border-paper-200 bg-paper-50 text-ink-900 text-sm focus:border-ink-900 focus:outline-none focus:ring-2 focus:ring-brand-300/30 transition-all";

const channels = [
  {
    icon: WhatsappLogo,
    label: "WhatsApp",
    // Görünen numara, href'teki GERÇEK WhatsApp hattıyla (wa.me/905319004102) tutarlı
    // olmalı — önce sabit hat (0324…) yazılıydı, tık GSM'e açılıp kullanıcıyı şaşırtıyordu.
    value: "0531 900 41 02",
    sub: "En hızlı kanal · ortalama 5 dk yanıt",
    href: "https://wa.me/905319004102",
    accent: "bg-success/10 text-success",
    cta: "WhatsApp aç",
  },
  {
    icon: Phone,
    label: "Telefon",
    value: "0324 433 33 51",
    sub: "Hafta içi 09:00 — 18:00",
    href: "tel:+903244333351",
    accent: "bg-brand-100 text-brand-700",
    cta: "Hemen ara",
  },
  {
    icon: EnvelopeSimple,
    label: "E-posta",
    value: "merhaba@markala.com.tr",
    sub: "Detaylı talepler için · 24 saat içinde dönüş",
    href: "mailto:merhaba@markala.com.tr",
    accent: "bg-[#E8F0FF] text-[#1565C0]",
    cta: "Mail gönder",
  },
];

const offices = [
  { icon: Buildings, title: "Atölye / Showroom", value: "Mersin, Türkiye", sub: "Önceden randevu ile ziyaret" },
  { icon: Clock, title: "Çalışma Saatleri", value: "Pzt-Cum 09:00-18:00 · Cmt 09:00-17:00", sub: "Pazar kapalı" },
  { icon: Users, title: "Kurumsal Satış", value: "B2B özel teklif", sub: "Aylık fatura · cari hesap" },
];

export default function ContactPage() {
  const [sent, setSent] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ticketId, setTicketId] = useState<string | null>(null);

  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    subject: "",
    message: "",
  });
  const [kvkkAccepted, setKvkkAccepted] = useState(false);

  function update<K extends keyof typeof form>(key: K, val: string) {
    setForm((f) => ({ ...f, [key]: val }));
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!kvkkAccepted) {
      setError("KVKK aydınlatma metnini onaylamadan mesaj gönderemezsiniz.");
      return;
    }
    setError(null);
    setSubmitting(true);
    try {
      const res = await fetch("/api/iletisim", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Mesaj gönderilemedi.");
        return;
      }
      setTicketId(data.ticketId ?? null);
      setSent(true);
      track("generate_lead", { method: "contact_form", subject: form.subject });
    } catch {
      setError("Sunucuya ulaşılamadı.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      {/* Page header */}
      <div className="bg-paper-100 border-b border-paper-200">
        <Container className="py-12 md:py-16">
          <div className="max-w-2xl">
            <p className="text-sm text-brand-700 font-semibold uppercase tracking-wider">İletişim</p>
            <h1 className="mt-2 text-4xl md:text-5xl font-semibold text-ink-900 leading-tight">
              Bize ulaşın
            </h1>
            <p className="mt-4 text-lg text-ink-700">
              Sipariş, tasarım desteği veya kurumsal teklifler — size en uygun kanaldan yazın.
            </p>
          </div>
        </Container>
      </div>

      <Container className="py-12 md:py-16">
        {/* Hızlı kanal kartları */}
        <section className="grid md:grid-cols-3 gap-4 mb-16">
          {channels.map((c) => (
            <a
              key={c.label}
              href={c.href}
              target={c.href.startsWith("http") ? "_blank" : undefined}
              rel={c.href.startsWith("http") ? "noopener noreferrer" : undefined}
              className="group flex flex-col p-6 bg-paper-50 border border-paper-200 rounded-xl hover:border-ink-300 hover:shadow-lg transition-all"
            >
              <div className={`w-12 h-12 rounded-lg grid place-items-center mb-4 ${c.accent}`}>
                <c.icon size={22} weight="regular" />
              </div>
              <div className="text-xs uppercase tracking-wider text-ink-500 font-semibold">{c.label}</div>
              <div className="mt-1 text-xl font-semibold text-ink-900 break-all">{c.value}</div>
              <p className="mt-2 text-sm text-ink-500 leading-relaxed flex-1">{c.sub}</p>
              <span className="mt-4 inline-flex items-center gap-1.5 text-sm font-medium text-brand-700 group-hover:gap-2.5 transition-all">
                {c.cta} <ArrowRight size={14} weight="bold" />
              </span>
            </a>
          ))}
        </section>

        <div className="grid lg:grid-cols-12 gap-10">
          {/* Sol: Form */}
          <section id="teklif" className="lg:col-span-7 scroll-mt-24">
            <header className="mb-6">
              <h2 className="text-2xl md:text-3xl font-semibold text-ink-900">Mesaj gönderin</h2>
              <p className="mt-2 text-ink-700">Formu doldurun — sipariş veya teklif talebi için en geç 24 saatte dönüş yaparız.</p>
            </header>

            {sent ? (
              <div className="p-10 bg-success/5 border border-success/20 rounded-xl text-center">
                <div className="w-14 h-14 mx-auto rounded-full bg-success/10 grid place-items-center text-success">
                  <CheckCircle size={28} weight="fill" />
                </div>
                <h3 className="mt-4 text-xl font-semibold text-ink-900">Mesajınız iletildi</h3>
                <p className="mt-2 text-ink-700">En geç 24 saat içinde geri dönüş yapacağız.</p>
                {ticketId && (
                  <code className="mt-3 inline-block px-3 py-1.5 rounded bg-paper-100 text-xs text-ink-700 font-mono">
                    Talep No: {ticketId}
                  </code>
                )}
                <div className="mt-6">
                  <Button variant="outline" onClick={() => {
                    setSent(false);
                    setTicketId(null);
                    setForm({ name: "", email: "", phone: "", subject: "", message: "" });
                  }}>
                    Yeni Mesaj
                  </Button>
                </div>
              </div>
            ) : (
              <form onSubmit={onSubmit} className="p-6 md:p-8 bg-paper-50 border border-paper-200 rounded-xl space-y-4" noValidate>
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
                  <Field id="iletisim-name" label="Ad Soyad" required>
                    <input
                      className={inputClass}
                      required
                      value={form.name}
                      onChange={(e) => update("name", e.target.value)}
                    />
                  </Field>
                  <Field id="iletisim-email" label="E-posta" required>
                    <input
                      type="email"
                      className={inputClass}
                      required
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
                <Field id="iletisim-subject" label="Konu" required>
                  <select
                    required
                    className={inputClass}
                    value={form.subject}
                    onChange={(e) => update("subject", e.target.value)}
                  >
                    <option value="">Seçin...</option>
                    <option>Sipariş öncesi soru</option>
                    <option>Mevcut siparişim hakkında</option>
                    <option>Tasarım desteği talebi</option>
                    <option>Kurumsal / B2B teklif</option>
                    <option>Şikayet veya iade</option>
                    <option>Diğer</option>
                  </select>
                </Field>
                <Field id="iletisim-message" label="Mesaj" required>
                  <textarea
                    required
                    rows={5}
                    className={`${inputClass} resize-none`}
                    placeholder="Detaylı yazabilirsiniz..."
                    value={form.message}
                    onChange={(e) => update("message", e.target.value)}
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
                    <Link href="/yasal/kvkk" className="underline hover:text-ink-900">KVKK aydınlatma metnini</Link> okudum,
                    kişisel verilerimin yalnızca bu talepte değerlendirilmek üzere işlenmesine onay veriyorum.
                  </span>
                </label>
                <Button type="submit" size="lg" disabled={submitting || !kvkkAccepted}>
                  {submitting ? "Gönderiliyor..." : "Gönder"} <ArrowRight size={16} weight="bold" />
                </Button>
              </form>
            )}
          </section>

          {/* Sağ: Ofis bilgileri */}
          <aside className="lg:col-span-5">
            <div className="lg:sticky lg:top-24 space-y-4">
              {offices.map((o) => (
                <div key={o.title} className="p-5 bg-paper-50 border border-paper-200 rounded-xl">
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-md bg-paper-100 grid place-items-center text-brand-700 flex-none">
                      <o.icon size={20} />
                    </div>
                    <div>
                      <div className="text-xs uppercase tracking-wider text-ink-500 font-semibold">{o.title}</div>
                      <div className="mt-1 font-semibold text-ink-900">{o.value}</div>
                      <div className="mt-1 text-sm text-ink-500">{o.sub}</div>
                    </div>
                  </div>
                </div>
              ))}

              {/* Map placeholder */}
              <div className="aspect-[4/3] rounded-xl bg-paper-100 border border-paper-200 grid place-items-center text-ink-500 text-sm">
                <div className="text-center">
                  <MapPin size={32} className="mx-auto mb-2 text-brand-700" weight="fill" />
                  <div>Mersin, Türkiye</div>
                  <div className="text-xs mt-1">Harita yakında eklenecek</div>
                </div>
              </div>

              {/* B2B CTA */}
              <div className="p-5 bg-ink-900 text-paper-50 rounded-xl">
                <ChatCircle size={24} className="text-brand-400" weight="fill" />
                <h3 className="mt-3 font-semibold text-lg">Kurumsal Satın Alma</h3>
                <p className="mt-1 text-sm text-paper-100/70">Aylık fatura, cari hesap ve özel taksit imkânı için satış ekibimize yazın.</p>
                <a href="https://wa.me/905319004102" target="_blank" rel="noopener noreferrer" className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-brand-400 hover:text-brand-300">
                  B2B WhatsApp hattı <ArrowRight size={14} weight="bold" />
                </a>
              </div>
            </div>
          </aside>
        </div>
      </Container>
    </>
  );
}

function Field({
  id,
  label,
  children,
  required,
}: {
  id: string;
  label: string;
  children: React.ReactNode;
  required?: boolean;
}) {
  // children = tek bir input/select/textarea → id ve aria-required inject et
  const control = isValidElement(children)
    ? cloneElement(children as ReactElement<Record<string, unknown>>, {
        id,
        "aria-required": required ? "true" : undefined,
      })
    : children;
  return (
    <div className="block">
      <label htmlFor={id} className="text-sm font-medium text-ink-900">
        {label}
        {required && (
          <span className="text-error ml-0.5" aria-hidden="true">
            *
          </span>
        )}
      </label>
      <div className="mt-1.5">{control}</div>
    </div>
  );
}
