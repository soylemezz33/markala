"use client";

import { useState, FormEvent, cloneElement, isValidElement, ReactElement } from "react";
import Link from "next/link";
import { Container } from "@markala/ui";
import {
  Buildings,
  Info,
  CheckCircle,
  Spinner,
  ArrowLeft,
  FileArrowUp,
  X,
} from "@phosphor-icons/react";
import { PhoneInput } from "@/components/forms/phone-input";
import { TurnstileWidget, turnstileEnabled } from "@/components/turnstile-widget";

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

  const [kvkkAccepted, setKvkkAccepted] = useState(false);
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);
  const [taxFile, setTaxFile] = useState<File | null>(null);
  const [signatureFile, setSignatureFile] = useState<File | null>(null);

  function update<K extends keyof typeof form>(key: K, val: string) {
    setForm((f) => ({ ...f, [key]: val }));
  }

  const DOC_MAX_BYTES = 15 * 1024 * 1024;
  const DOC_ACCEPT = ".pdf,.jpg,.jpeg,.png,.webp,.tif,.tiff";

  function pickFile(set: (f: File | null) => void) {
    return (e: React.ChangeEvent<HTMLInputElement>) => {
      const f = e.target.files?.[0] ?? null;
      if (f && f.size > DOC_MAX_BYTES) {
        setError("Belge boyutu en fazla 15MB olabilir.");
        e.target.value = "";
        return;
      }
      setError(null);
      set(f);
    };
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
      // multipart/form-data: metin alanları + opsiyonel belgeler. Content-Type'ı
      // tarayıcı boundary ile kendisi koyar — elle set ETME.
      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => fd.append(k, v));
      if (taxFile) fd.append("taxCertificate", taxFile);
      if (signatureFile) fd.append("signatureCircular", signatureFile);
      if (turnstileToken) fd.append("turnstileToken", turnstileToken);
      const res = await fetch("/api/kurumsal-basvuru", {
        method: "POST",
        body: fd,
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
        <h1 className="text-2xl md:text-3xl font-semibold text-ink-900">Başvurun bize ulaştı</h1>
        <p className="mt-3 text-ink-700">
          Mali ekibimiz 1-2 iş günü içinde değerlendirip e-posta ile dönüş yapacak. Acil durumlar
          için{" "}
          <a href="tel:+903244333351" className="text-brand-700 font-semibold">
            0324 433 33 51
          </a>
          .
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
          <h1 className="text-2xl md:text-3xl font-semibold text-ink-900">
            Kurumsal Hesap Başvurusu
          </h1>
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

        {/* Belgeler — opsiyonel ama önerilir. Yüklenen belgeler güvenli (auth-korumalı,
            public OLMAYAN) depolamaya alınır; yalnızca mali ekibimiz onay sürecinde görür.
            Yüklemezseniz onay sürecinde e-posta ile talep edilir. */}
        <fieldset className="space-y-4">
          <legend className="text-sm font-semibold text-ink-900 mb-2">
            Belgeler{" "}
            <span className="font-normal text-ink-500">
              (opsiyonel — yüklerseniz onay hızlanır)
            </span>
          </legend>
          <div className="rounded-lg bg-paper-100 border border-paper-200 p-4 flex items-start gap-3">
            <Info
              size={20}
              weight="fill"
              className="text-brand-700 flex-none mt-0.5"
              aria-hidden="true"
            />
            <p className="text-sm text-ink-700 leading-relaxed">
              Vergi levhası ve imza sirkülerinizi şimdi ekleyebilirsiniz. Belgeleriniz{" "}
              <strong className="text-ink-900">güvenli, gizli depolamada</strong> tutulur (herkese
              açık değildir), yalnızca onay sürecinde mali ekibimizce görüntülenir. PDF/JPG/PNG, en
              fazla 15MB.
            </p>
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            <DocField
              id="kb-taxCertificate"
              label="Vergi levhası"
              accept={DOC_ACCEPT}
              file={taxFile}
              onChange={pickFile(setTaxFile)}
              onClear={() => setTaxFile(null)}
            />
            <DocField
              id="kb-signatureCircular"
              label="İmza sirküleri"
              accept={DOC_ACCEPT}
              file={signatureFile}
              onChange={pickFile(setSignatureFile)}
              onClear={() => setSignatureFile(null)}
            />
          </div>
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
            Bilgileriniz KVKK kapsamında işlenir. Yalnızca kurumsal hesap onay sürecinde ve
            sonrasında muhasebe entegrasyonunda kullanılır.{" "}
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
              <Link href="/yasal/kvkk" className="underline">
                KVKK aydınlatma metnini
              </Link>{" "}
              okudum, şirketime ve yetkili kişiye ait kişisel verilerin kurumsal hesap onayı ile
              muhasebe süreçleri için işlenmesine onay veriyorum.
            </span>
          </label>
          <TurnstileWidget action="corporate" onToken={setTurnstileToken} />
          <button
            type="submit"
            disabled={submitting || !kvkkAccepted || (turnstileEnabled && !turnstileToken)}
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

function DocField({
  id,
  label,
  accept,
  file,
  onChange,
  onClear,
}: {
  id: string;
  label: string;
  accept: string;
  file: File | null;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onClear: () => void;
}) {
  return (
    <div className="block">
      <div className="block text-xs font-medium text-ink-700 mb-1.5">{label}</div>
      {file ? (
        <div className="flex items-center justify-between gap-2 px-3 py-2.5 bg-success/5 border border-success/30 rounded-md text-sm">
          <span className="truncate text-ink-900" title={file.name}>
            {file.name}
          </span>
          <button
            type="button"
            onClick={onClear}
            className="flex-none text-ink-500 hover:text-error"
            aria-label="Belgeyi kaldır"
          >
            <X size={16} />
          </button>
        </div>
      ) : (
        <label
          htmlFor={id}
          className="flex items-center gap-2 px-3 py-2.5 bg-paper-50 border border-dashed border-paper-300 rounded-md text-sm text-ink-500 cursor-pointer hover:border-brand-500 hover:text-ink-700"
        >
          <FileArrowUp size={18} className="flex-none text-brand-700" aria-hidden="true" />
          Dosya seç (PDF/JPG/PNG)
        </label>
      )}
      <input id={id} type="file" accept={accept} onChange={onChange} className="sr-only" />
    </div>
  );
}

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
