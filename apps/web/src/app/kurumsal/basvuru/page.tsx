"use client";

import { useState, FormEvent } from "react";
import Link from "next/link";
import { Container } from "@markala/ui";
import {
  Buildings, Upload, CheckCircle, Spinner, ArrowLeft,
} from "@phosphor-icons/react";

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

  function update<K extends keyof typeof form>(key: K, val: string) {
    setForm((f) => ({ ...f, [key]: val }));
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    // Mock: gerçek backend bağlandığında apps/api/auth/corporate-application'a POST
    try {
      await new Promise((r) => setTimeout(r, 800));
      setSubmitted(true);
    } catch {
      setError("Başvuru gönderilemedi, daha sonra tekrar deneyin.");
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

      <form onSubmit={onSubmit} className="space-y-8">
        {error && (
          <div className="px-4 py-3 rounded-lg bg-error/10 border border-error/20 text-error text-sm">
            {error}
          </div>
        )}

        {/* Şirket bilgileri */}
        <fieldset className="space-y-4">
          <legend className="text-sm font-semibold text-ink-900 mb-2">Şirket Bilgileri</legend>
          <Field label="Şirket adı (unvan)" required>
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
            <Field label="Vergi dairesi" required>
              <input
                type="text"
                required
                value={form.taxOffice}
                onChange={(e) => update("taxOffice", e.target.value)}
                placeholder="Örn: Mersin"
                className={inputCls}
              />
            </Field>
            <Field label="Vergi numarası" required>
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
            <Field label="Sektör">
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
            <Field label="Yıllık matbaa harcamanız (yaklaşık)">
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
          <Field label="Faturalama adresi" required>
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
            <Field label="Ad soyad" required>
              <input
                type="text"
                required
                value={form.contactName}
                onChange={(e) => update("contactName", e.target.value)}
                className={inputCls}
              />
            </Field>
            <Field label="Görev / Pozisyon">
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
            <Field label="E-posta" required>
              <input
                type="email"
                required
                value={form.email}
                onChange={(e) => update("email", e.target.value)}
                className={inputCls}
              />
            </Field>
            <Field label="Telefon" required>
              <input
                type="tel"
                required
                value={form.phone}
                onChange={(e) => update("phone", e.target.value)}
                placeholder="05XX XXX XX XX"
                className={inputCls}
              />
            </Field>
          </div>
        </fieldset>

        {/* Belgeler */}
        <fieldset className="space-y-4">
          <legend className="text-sm font-semibold text-ink-900 mb-2">Belgeler</legend>
          <FileField
            label="Vergi levhası (PDF veya görsel)"
            accept="application/pdf,image/*"
            file={vergiLevha}
            onChange={setVergiLevha}
            required
          />
          <FileField
            label="İmza sirküleri"
            accept="application/pdf,image/*"
            file={imzaSirku}
            onChange={setImzaSirku}
          />
        </fieldset>

        <Field label="Notlar (opsiyonel)">
          <textarea
            rows={3}
            value={form.notes}
            onChange={(e) => update("notes", e.target.value)}
            placeholder="Özel taleplerin, beklentilerin..."
            className={inputCls}
          />
        </Field>

        <div className="pt-4 border-t border-paper-200">
          <p className="text-xs text-ink-500 mb-4">
            Bilgileriniz KVKK kapsamında işlenir. Yalnızca kurumsal hesap onay sürecinde
            ve sonrasında muhasebe entegrasyonunda kullanılır.{" "}
            <Link href="/yasal/kvkk" className="underline">
              Detaylı bilgi
            </Link>
            .
          </p>
          <button
            type="submit"
            disabled={submitting}
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
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="block text-xs font-medium text-ink-700 mb-1.5">
        {label} {required && <span className="text-error">*</span>}
      </span>
      {children}
    </label>
  );
}

function FileField({
  label,
  accept,
  file,
  onChange,
  required,
}: {
  label: string;
  accept: string;
  file: File | null;
  onChange: (f: File | null) => void;
  required?: boolean;
}) {
  return (
    <label className="block cursor-pointer">
      <span className="block text-xs font-medium text-ink-700 mb-1.5">
        {label} {required && <span className="text-error">*</span>}
      </span>
      <div className="flex items-center gap-3 px-4 py-3 border-2 border-dashed border-paper-200 rounded-lg hover:border-brand-500 hover:bg-paper-100 transition-colors">
        <Upload size={18} className="text-ink-500" />
        <span className="text-sm text-ink-700 flex-1 truncate">
          {file ? file.name : "Dosya seç..."}
        </span>
        <input
          type="file"
          accept={accept}
          required={required}
          onChange={(e) => onChange(e.target.files?.[0] ?? null)}
          className="sr-only"
        />
      </div>
    </label>
  );
}
