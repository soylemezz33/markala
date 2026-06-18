"use client";

import { useState, FormEvent, cloneElement, isValidElement, ReactElement } from "react";
import Link from "next/link";
import { Container } from "@markala/ui";
import {
  Buildings, Upload, CheckCircle, Spinner, ArrowLeft,
} from "@phosphor-icons/react";
import { PhoneInput } from "@/components/forms/phone-input";

export default function KurumsalBasvuruPage() {
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [form, setForm] = useState({
    companyName: "",
    taxOffice: "",
    taxNumber: "",
    sector: "",
    annualVolume: "",
    contactName: "",
    contactRole: "",
    email: "",
    phone: "",
    address: "",
    notes: "",
  });

  const [vergiLevha, setVergiLevha] = useState<File | null>(null);
  const [imzaSirku, setImzaSirku] = useState<File | null>(null);
  const [kvkkAccepted, setKvkkAccepted] = useState(false);

  function update<K extends keyof typeof form>(key: K, val: string) {
    setForm((f) => ({ ...f, [key]: val }));
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!kvkkAccepted) {
      setError("KVKK aydınlatma metnini onaylamadan başvuru gönderilemez.");
      return;
    }
    setError(null);
    setSubmitting(true);

    try {
      const res = await fetch("/api/kurumsal-basvuru", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error ?? "Başvuru gönderilemedi, daha sonra tekrar deneyin.");
        return;
      }
      setSubmitted(true);
    } catch {
      setError("Sunucuya ulaşılamadı, daha sonra tekrar deneyin.");
    } finally {
      setSubmitting(false);
    }
  }

  if (submitted) {
    return (
      <Container className="py-16 md:py-24 max-w-xl text-center">
        <div className="w-16 h-16 mx-auto rounded-full bg-success/15 grid place-items-center text-success mb-4">
          <CheckCircle size={32} weight="fill" />
        </div>
        <h1 className="text-2xl md:text-3xl font-semibold text-ink-900">
          Başvurun bize ulaştı
        </h1>
        <p className="mt-3 text-ink-700">
          Mali ekibimiz 1-2 iş günü içinde değerlendirip e-posta ile dönüş yapacak.
          Acil durumlar için <a href="tel:+903244333351" className="text-brand-700 font-semibold">0324 433 33 51</a>.
        </p>
        <Link
          href="/"
          className="mt-6 inline-flex px-5 py-2.5 bg-brand-500 hover:bg-brand-600 text-ink-900 rounded-lg text-sm font-semibold"
        >
          Anasayfaya Dön
        </Link>
      </Container>
    );
  }

  return (
    <Container className="py-10 md:py-16 max-w-3xl">
      <Link
        href="/kurumsal"
        className="inline-flex items-center gap-1.5 text-sm text-ink-500 hover:text-ink-900 mb-6"
      >
        <ArrowLeft size={14} /> Kurumsal hakkında bilgi
      </Link>

      <div className="flex items-center gap-3 mb-8">
        <div className="w-12 h-12 rounded-xl bg-brand-500 grid place-items-center text-ink-900">
          <Buildings size={24} weight="bold" />
        </div>
        <div>
          <h1 className="text-2xl md:text-3xl font-semibold text-ink-900">Kurumsal Hesap Başvurusu</h1>
          <p className="text-sm text-ink-500">5 dakika · 1-2 iş günü onay</p>
        </div>
      </div>

      <form onSubmit={onSubmit} className="space-y-8" noValidate>
        {error && (
          <div
            role="alert"
            aria-live="polite"
            className="px-4 py-3 rounded-lg bg-error/10 border border-error/20 text-error text-sm"
          >
            {error}
          </div>
        )}

        {/* Şirket bilgileri */}
        <fieldset className="space-y-4">
          <legend className="text-sm font-semibold text-ink-900 mb-2">Şirket Bilgileri</legend>
          <Field id="kb-companyName" label="Şirket adı (unvan)" required>
            <input
              type="text"
              required
              value={form.companyName}
              onChange={(e) => update("companyName", e.target.value)}
              placeholder="Örn: Lisan Fen Eğitim Kurumları A.Ş."
              className={inputCls}
            />
          </Field>
          <div className="grid sm:grid-cols-2 gap-4">
            <Field id="kb-taxOffice" label="Vergi dairesi" required>
              <input
                type="text"
                required
                value={form.taxOffice}
                onChange={(e) => update("taxOffice", e.target.value)}
                placeholder="Örn: Mersin"
                className={inputCls}
              />
            </Field>
            <Field id="kb-taxNumber" label="Vergi numarası" required>
              <input
                type="text"
                required
                pattern="[0-9]{10,11}"
                value={form.taxNumber}
                onChange={(e) => update("taxNumber", e.target.value)}
                placeholder="10 haneli"
                className={inputCls}
              />
            </Field>
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            <Field id="kb-sector" label="Sektör">
              <select
                value={form.sector}
                onChange={(e) => update("sector", e.target.value)}
                className={inputCls}
              >
                <option value="">Seç...</option>
                <option>Eğitim</option>
                <option>Gıda & Restoran</option>
                <option>Perakende</option>
                <option>Sağlık</option>
                <option>Hizmet</option>
                <option>Üretim</option>
                <option>Teknoloji</option>
                <option>Diğer</option>
              </select>
            </Field>
            <Field id="kb-annualVolume" label="Yıllık matbaa harcamanız (yaklaşık)">
              <select
                value={form.annualVolume}
                onChange={(e) => update("annualVolume", e.target.value)}
                className={inputCls}
              >
                <option value="">Seç...</option>
                <option>0-50.000 ₺</option>
                <option>50.000-150.000 ₺</option>
                <option>150.000-500.000 ₺</option>
                <option>500.000 ₺+</option>
              </select>
            </Field>
          </div>
          <Field id="kb-address" label="Faturalama adresi" required>
            <textarea
              required
              rows={3}
              value={form.address}
              onChange={(e) => update("address", e.target.value)}
              className={inputCls}
            />
          </Field>
        </fieldset>

        {/* Yetkili kişi */}
        <fieldset className="space-y-4">
          <legend className="text-sm font-semibold text-ink-900 mb-2">Yetkili Kişi</legend>
          <div className="grid sm:grid-cols-2 gap-4">
            <Field id="kb-contactName" label="Ad soyad" required>
              <input
                type="text"
                required
                value={form.contactName}
                onChange={(e) => update("contactName", e.target.value)}
                className={inputCls}
              />
            </Field>
            <Field id="kb-contactRole" label="Görev / Pozisyon">
              <input
                type="text"
                value={form.contactRole}
                onChange={(e) => update("contactRole", e.target.value)}
                placeholder="Örn: Pazarlama Müdürü"
                className={inputCls}
              />
            </Field>
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            <Field id="kb-email" label="E-posta" required>
              <input
                type="email"
                required
                value={form.email}
                onChange={(e) => update("email", e.target.value)}
                className={inputCls}
              />
            </Field>
            <PhoneInput
              value={form.phone}
              onChange={(v) => update("phone", v)}
              label="Telefon"
              required
              inputClassName={inputCls}
            />
          </div>
        </fieldset>

        {/* Belgeler */}
        <fieldset className="space-y-4">
          <legend className="text-sm font-semibold text-ink-900 mb-2">Belgeler</legend>
          <FileField
            id="kb-vergiLevha"
            label="Vergi levhası (PDF veya görsel)"
            accept="application/pdf,image/*"
            file={vergiLevha}
            onChange={setVergiLevha}
            required
          />
          <FileField
            id="kb-imzaSirku"
            label="İmza sirküleri"
            accept="application/pdf,image/*"
            file={imzaSirku}
            onChange={setImzaSirku}
          />
        </fieldset>

        <Field id="kb-notes" label="Notlar (opsiyonel)">
          <textarea
            rows={3}
            value={form.notes}
            onChange={(e) => update("notes", e.target.value)}
            placeholder="Özel taleplerin, beklentilerin..."
            className={inputCls}
          />
        </Field>

        <div className="pt-4 border-t border-paper-200 space-y-4">
          <p className="text-xs text-ink-500">
            Bilgileriniz KVKK kapsamında işlenir. Yalnızca kurumsal hesap onay sürecinde
            ve sonrasında muhasebe entegrasyonunda kullanılır.{" "}
            <Link href="/yasal/kvkk" className="underline">
              Detaylı bilgi
            </Link>
            .
          </p>
          <label className="flex items-start gap-2 text-xs text-ink-700">
            <input
              type="checkbox"
              required
              checked={kvkkAccepted}
              onChange={(e) => setKvkkAccepted(e.target.checked)}
              className="mt-0.5"
            />
            <span>
              <Link href="/yasal/kvkk" className="underline">KVKK aydınlatma metnini</Link> okudum,
              şirketime ve yetkili kişiye ait kişisel verilerin kurumsal hesap onayı ile muhasebe süreçleri için işlenmesine onay veriyorum.
            </span>
          </label>
          <button
            type="submit"
            disabled={submitting || !kvkkAccepted}
            className="w-full sm:w-auto px-8 py-3 bg-brand-500 hover:bg-brand-600 text-ink-900 rounded-lg text-sm font-semibold disabled:opacity-60 inline-flex items-center justify-center gap-2"
          >
            {submitting ? (
              <>
                <Spinner size={16} className="animate-spin" /> Gönderiliyor...
              </>
            ) : (
              "Başvuruyu Gönder"
            )}
          </button>
        </div>
      </form>
    </Container>
  );
}

const inputCls =
  "w-full px-3 py-2.5 bg-paper-50 border border-paper-200 rounded-md text-sm text-ink-900 outline-none focus:border-brand-500";

function Field({
  id,
  label,
  required,
  children,
}: {
  id: string;
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  const control = isValidElement(children)
    ? cloneElement(children as ReactElement<Record<string, unknown>>, {
        id,
        "aria-required": required ? "true" : undefined,
      })
    : children;
  return (
    <div className="block">
      <label htmlFor={id} className="block text-xs font-medium text-ink-700 mb-1.5">
        {label}{" "}
        {required && (
          <span className="text-error" aria-hidden="true">
            *
          </span>
        )}
      </label>
      {control}
    </div>
  );
}

function FileField({
  id,
  label,
  accept,
  file,
  onChange,
  required,
}: {
  id: string;
  label: string;
  accept: string;
  file: File | null;
  onChange: (f: File | null) => void;
  required?: boolean;
}) {
  return (
    <div className="block">
      <label htmlFor={id} className="block text-xs font-medium text-ink-700 mb-1.5 cursor-pointer">
        {label}{" "}
        {required && (
          <span className="text-error" aria-hidden="true">
            *
          </span>
        )}
      </label>
      <label
        htmlFor={id}
        className="flex items-center gap-3 px-4 py-3 border-2 border-dashed border-paper-200 rounded-lg hover:border-brand-500 hover:bg-paper-100 transition-colors cursor-pointer"
      >
        <Upload size={18} className="text-ink-500" aria-hidden="true" />
        <span className="text-sm text-ink-700 flex-1 truncate">
          {file ? file.name : "Dosya seç..."}
        </span>
        <input
          id={id}
          type="file"
          accept={accept}
          required={required}
          aria-required={required ? "true" : undefined}
          onChange={(e) => onChange(e.target.files?.[0] ?? null)}
          className="sr-only"
        />
      </label>
    </div>
  );
}
