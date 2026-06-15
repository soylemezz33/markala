"use client";

import { useState, useTransition } from "react";
import { AdminShell } from "@/components/admin-shell";
import { toast } from "@/components/toast";
import { Buildings, Phone, Globe, FloppyDisk, Truck } from "@phosphor-icons/react";
import { saveSettings } from "../actions";

interface Props {
  initial: Record<string, unknown>;
}

export function GenelClient({ initial }: Props) {
  const [isPending, startTransition] = useTransition();

  const [siteName, setSiteName] = useState(String(initial["general.siteName"] ?? ""));
  const [siteUrl, setSiteUrl] = useState(String(initial["general.siteUrl"] ?? ""));
  const [companyName, setCompanyName] = useState(String(initial["general.companyName"] ?? ""));
  const [taxOffice, setTaxOffice] = useState(String(initial["general.taxOffice"] ?? ""));
  const [taxNumber, setTaxNumber] = useState(String(initial["general.taxNumber"] ?? ""));
  const [mersis, setMersis] = useState(String(initial["general.mersis"] ?? ""));
  const [address, setAddress] = useState(String(initial["general.address"] ?? ""));
  const [phone, setPhone] = useState(String(initial["general.phone"] ?? ""));
  const [email, setEmail] = useState(String(initial["general.email"] ?? ""));
  const [whatsapp, setWhatsapp] = useState(String(initial["general.whatsapp"] ?? ""));
  const [currency, setCurrency] = useState(String(initial["general.currency"] ?? "TRY"));
  const [vatRate, setVatRate] = useState(Number(initial["general.vatRate"] ?? 20));
  const [freeShippingThreshold, setFreeShippingThreshold] = useState(
    Number(initial["general.freeShippingThreshold"] ?? 1500),
  );
  const [standardShippingFee, setStandardShippingFee] = useState(
    Number(initial["general.standardShippingFee"] ?? 49),
  );
  const [expressShippingFee, setExpressShippingFee] = useState(
    Number(initial["general.expressShippingFee"] ?? 89),
  );

  function handleSave() {
    startTransition(async () => {
      try {
        await saveSettings(
          "general",
          {
            "general.siteName": siteName,
            "general.siteUrl": siteUrl,
            "general.companyName": companyName,
            "general.taxOffice": taxOffice,
            "general.taxNumber": taxNumber,
            "general.mersis": mersis,
            "general.address": address,
            "general.phone": phone,
            "general.email": email,
            "general.whatsapp": whatsapp,
            "general.currency": currency,
            "general.vatRate": vatRate,
            "general.freeShippingThreshold": freeShippingThreshold,
            "general.standardShippingFee": standardShippingFee,
            "general.expressShippingFee": expressShippingFee,
          },
          "/ayarlar/genel",
        );
        toast.success("Genel ayarlar kaydedildi.");
      } catch {
        toast.error("Kayıt başarısız. Lütfen tekrar deneyin.");
      }
    });
  }

  return (
    <AdminShell>
      <header className="mb-6">
        <h1 className="text-2xl md:text-3xl font-semibold text-ink-900">Genel Ayarlar</h1>
        <p className="text-ink-500 text-sm mt-1">Site, firma, iletişim ve fatura bilgileri</p>
      </header>

      <div className="grid lg:grid-cols-2 gap-5">
        <Card title="Site Bilgileri" icon={Globe}>
          <Field label="Site Adı">
            <input className={cls} value={siteName} onChange={(e) => setSiteName(e.target.value)} />
          </Field>
          <Field label="Site URL">
            <input className={cls} value={siteUrl} onChange={(e) => setSiteUrl(e.target.value)} />
          </Field>
          <Field label="Para Birimi">
            <select className={cls} value={currency} onChange={(e) => setCurrency(e.target.value)}>
              <option value="TRY">₺ Türk Lirası (TRY)</option>
              <option value="USD">$ Dolar (USD)</option>
              <option value="EUR">€ Euro (EUR)</option>
            </select>
          </Field>
          <Field label="KDV Oranı (%)">
            <input
              type="number"
              className={cls + " tabular-nums"}
              value={vatRate}
              onChange={(e) => setVatRate(Number(e.target.value))}
            />
          </Field>
        </Card>

        <Card title="Firma Bilgileri" icon={Buildings}>
          <Field label="Firma Adı / Unvan">
            <input
              className={cls}
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
            />
          </Field>
          <Field label="Vergi Dairesi">
            <input
              className={cls}
              value={taxOffice}
              onChange={(e) => setTaxOffice(e.target.value)}
            />
          </Field>
          <Field label="Vergi Numarası">
            <input
              className={cls}
              value={taxNumber}
              onChange={(e) => setTaxNumber(e.target.value)}
            />
          </Field>
          <Field label="MERSİS">
            <input className={cls} value={mersis} onChange={(e) => setMersis(e.target.value)} />
          </Field>
        </Card>

        <Card title="İletişim" icon={Phone}>
          <Field label="Adres">
            <textarea
              rows={3}
              className={cls}
              value={address}
              onChange={(e) => setAddress(e.target.value)}
            />
          </Field>
          <Field label="Telefon">
            <input className={cls} value={phone} onChange={(e) => setPhone(e.target.value)} />
          </Field>
          <Field label="E-posta">
            <input className={cls} value={email} onChange={(e) => setEmail(e.target.value)} />
          </Field>
          <Field label="WhatsApp">
            <input className={cls} value={whatsapp} onChange={(e) => setWhatsapp(e.target.value)} />
          </Field>
        </Card>

        <Card title="Kargo Politikası" icon={Truck}>
          <Field label="Ücretsiz Kargo Eşiği (₺)">
            <input
              type="number"
              className={cls + " tabular-nums"}
              value={freeShippingThreshold}
              onChange={(e) => setFreeShippingThreshold(Number(e.target.value))}
            />
            <span className="text-[11px] text-ink-500 mt-1 block">
              Bu tutar ve üzeri siparişlerde kargo ücretsiz
            </span>
          </Field>
          <Field label="Standart Kargo Ücreti (₺)">
            <input
              type="number"
              className={cls + " tabular-nums"}
              value={standardShippingFee}
              onChange={(e) => setStandardShippingFee(Number(e.target.value))}
            />
          </Field>
          <Field label="Hızlı Kargo Ücreti (₺) — opsiyonel">
            <input
              type="number"
              className={cls + " tabular-nums"}
              value={expressShippingFee}
              onChange={(e) => setExpressShippingFee(Number(e.target.value))}
            />
          </Field>
        </Card>
      </div>

      <div className="mt-6 flex items-center justify-end gap-2">
        <button className="px-4 py-2 rounded-md text-sm font-medium border border-paper-200 hover:bg-paper-100">
          İptal
        </button>
        <button
          onClick={handleSave}
          disabled={isPending}
          className="inline-flex items-center gap-2 bg-ink-900 text-paper-50 px-5 py-2 rounded-md text-sm font-semibold hover:bg-ink-700 disabled:opacity-60"
        >
          <FloppyDisk size={14} weight="bold" />
          {isPending ? "Kaydediliyor…" : "Tüm Ayarları Kaydet"}
        </button>
      </div>
    </AdminShell>
  );
}

const cls =
  "w-full px-3 py-2 rounded-md border border-paper-200 bg-paper-50 text-sm focus:border-ink-900 focus:outline-none";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block mb-3">
      <span className="block text-xs font-semibold text-ink-700 uppercase tracking-wider mb-1.5">
        {label}
      </span>
      {children}
    </label>
  );
}

function Card({
  title,
  icon: Icon,
  children,
}: {
  title: string;
  icon: typeof Buildings;
  children: React.ReactNode;
}) {
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
