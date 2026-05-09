"use client";

import { useState } from "react";
import { AdminShell } from "@/components/admin-shell";
import { Buildings, EnvelopeSimple, Phone, MapPin, Globe, FloppyDisk, CurrencyCircleDollar, Truck } from "@phosphor-icons/react";

export default function GeneralSettingsPage() {
  const [siteName, setSiteName] = useState("Markala");
  const [siteUrl, setSiteUrl] = useState("https://markala.com.tr");
  const [companyName, setCompanyName] = useState("324 Ajans");
  const [taxOffice, setTaxOffice] = useState("Yenişehir VD");
  const [taxNumber, setTaxNumber] = useState("4270601001");
  const [mersis, setMersis] = useState("0427060100100001");
  const [address, setAddress] = useState("Yenişehir Mah. Atatürk Cad. No:42 Yenişehir / Mersin");
  const [phone, setPhone] = useState("+90 324 433 33 51");
  const [email, setEmail] = useState("merhaba@markala.com.tr");
  const [whatsapp, setWhatsapp] = useState("+90 324 433 33 51");
  const [currency, setCurrency] = useState("TRY");
  const [vatRate, setVatRate] = useState(20);
  const [freeShippingThreshold, setFreeShippingThreshold] = useState(1500);

  return (
    <AdminShell>
      <header className="mb-6">
        <h1 className="text-2xl md:text-3xl font-semibold text-ink-900">Genel Ayarlar</h1>
        <p className="text-ink-500 text-sm mt-1">Site, firma, iletişim ve fatura bilgileri</p>
      </header>

      <div className="grid lg:grid-cols-2 gap-5">
        <Card title="Site Bilgileri" icon={Globe}>
          <Field label="Site Adı"><input className={cls} value={siteName} onChange={(e) => setSiteName(e.target.value)} /></Field>
          <Field label="Site URL"><input className={cls} value={siteUrl} onChange={(e) => setSiteUrl(e.target.value)} /></Field>
          <Field label="Para Birimi">
            <select className={cls} value={currency} onChange={(e) => setCurrency(e.target.value)}>
              <option value="TRY">₺ Türk Lirası (TRY)</option>
              <option value="USD">$ Dolar (USD)</option>
              <option value="EUR">€ Euro (EUR)</option>
            </select>
          </Field>
          <Field label="KDV Oranı (%)">
            <input type="number" className={cls + " tabular-nums"} value={vatRate} onChange={(e) => setVatRate(Number(e.target.value))} />
          </Field>
        </Card>

        <Card title="Firma Bilgileri" icon={Buildings}>
          <Field label="Firma Adı / Unvan"><input className={cls} value={companyName} onChange={(e) => setCompanyName(e.target.value)} /></Field>
          <Field label="Vergi Dairesi"><input className={cls} value={taxOffice} onChange={(e) => setTaxOffice(e.target.value)} /></Field>
          <Field label="Vergi Numarası"><input className={cls} value={taxNumber} onChange={(e) => setTaxNumber(e.target.value)} /></Field>
          <Field label="MERSİS"><input className={cls} value={mersis} onChange={(e) => setMersis(e.target.value)} /></Field>
        </Card>

        <Card title="İletişim" icon={Phone}>
          <Field label="Adres"><textarea rows={3} className={cls} value={address} onChange={(e) => setAddress(e.target.value)} /></Field>
          <Field label="Telefon"><input className={cls} value={phone} onChange={(e) => setPhone(e.target.value)} /></Field>
          <Field label="E-posta"><input className={cls} value={email} onChange={(e) => setEmail(e.target.value)} /></Field>
          <Field label="WhatsApp"><input className={cls} value={whatsapp} onChange={(e) => setWhatsapp(e.target.value)} /></Field>
        </Card>

        <Card title="Kargo Politikası" icon={Truck}>
          <Field label="Ücretsiz Kargo Eşiği (₺)">
            <input type="number" className={cls + " tabular-nums"} value={freeShippingThreshold} onChange={(e) => setFreeShippingThreshold(Number(e.target.value))} />
            <span className="text-[11px] text-ink-500 mt-1 block">Bu tutar ve üzeri siparişlerde kargo ücretsiz</span>
          </Field>
          <Field label="Standart Kargo Ücreti (₺)">
            <input type="number" className={cls + " tabular-nums"} defaultValue={49} />
          </Field>
          <Field label="Hızlı Kargo Ücreti (₺) — opsiyonel">
            <input type="number" className={cls + " tabular-nums"} defaultValue={89} />
          </Field>
        </Card>
      </div>

      <div className="mt-6 flex items-center justify-end gap-2">
        <button className="px-4 py-2 rounded-md text-sm font-medium border border-paper-200 hover:bg-paper-100">İptal</button>
        <button
          onClick={() => alert("Mock: ayarlar kaydedildi.")}
          className="inline-flex items-center gap-2 bg-ink-900 text-paper-50 px-5 py-2 rounded-md text-sm font-semibold hover:bg-ink-700"
        >
          <FloppyDisk size={14} weight="bold" /> Tüm Ayarları Kaydet
        </button>
      </div>
    </AdminShell>
  );
}

const cls = "w-full px-3 py-2 rounded-md border border-paper-200 bg-paper-50 text-sm focus:border-ink-900 focus:outline-none";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block mb-3">
      <span className="block text-xs font-semibold text-ink-700 uppercase tracking-wider mb-1.5">{label}</span>
      {children}
    </label>
  );
}

function Card({ title, icon: Icon, children }: { title: string; icon: typeof Buildings; children: React.ReactNode }) {
  return (
    <section className="bg-paper-50 border border-paper-200 rounded-lg overflow-hidden">
      <header className="px-5 py-3 border-b border-paper-200 bg-paper-100/40 flex items-center gap-2">
        <Icon size={16} className="text-brand-700" />
        <h2 className="font-semibold text-ink-900 text-sm">{title}</h2>
      </header>
      <div className="p-5">{children}</div>
    </section>
  );
}
