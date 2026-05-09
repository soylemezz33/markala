"use client";

import { useState } from "react";
import { AdminShell } from "@/components/admin-shell";
import {
  Plug, CheckCircle, Warning, Eye, EyeSlash, FloppyDisk,
  CreditCard, Receipt, EnvelopeSimple, ChatCircle, Truck, Cloud,
  ShieldCheck, ChartLine,
} from "@phosphor-icons/react";

interface Integration {
  id: string;
  name: string;
  vendor: string;
  description: string;
  category: "payment" | "accounting" | "email" | "sms" | "shipping" | "storage" | "analytics";
  icon: typeof Plug;
  fields: Array<{ key: string; label: string; type?: "text" | "password" | "url" | "number"; placeholder?: string; required?: boolean }>;
  docsUrl: string;
  status: "connected" | "disconnected" | "error";
}

const integrations: Integration[] = [
  {
    id: "iyzico",
    name: "iyzico",
    vendor: "iyzico - Ödeme",
    description: "Kredi kartı, BKM, taksit ödeme altyapısı. 3D Secure dahil.",
    category: "payment",
    icon: CreditCard,
    fields: [
      { key: "apiKey", label: "API Key", type: "password", required: true, placeholder: "sandbox-..." },
      { key: "secretKey", label: "Secret Key", type: "password", required: true },
      { key: "baseUrl", label: "Base URL", type: "url", placeholder: "https://api.iyzipay.com", required: true },
      { key: "callbackUrl", label: "Callback URL", type: "url", placeholder: "https://markala.com.tr/api/payments/iyzico/callback" },
    ],
    docsUrl: "https://dev.iyzipay.com",
    status: "connected",
  },
  {
    id: "parasut",
    name: "Paraşüt",
    vendor: "Paraşüt - Muhasebe",
    description: "Otomatik fatura kesme, e-Arşiv, ön muhasebe entegrasyonu.",
    category: "accounting",
    icon: Receipt,
    fields: [
      { key: "clientId", label: "Client ID", type: "text", required: true },
      { key: "clientSecret", label: "Client Secret", type: "password", required: true },
      { key: "username", label: "Kullanıcı Adı (e-posta)", type: "text", required: true },
      { key: "password", label: "Şifre", type: "password", required: true },
      { key: "companyId", label: "Firma ID", type: "text", required: true, placeholder: "427609" },
    ],
    docsUrl: "https://apidocs.parasut.com",
    status: "connected",
  },
  {
    id: "sendgrid",
    name: "SendGrid",
    vendor: "SendGrid - E-posta",
    description: "Sipariş onayı, teslimat bildirimi, kampanya e-postaları.",
    category: "email",
    icon: EnvelopeSimple,
    fields: [
      { key: "apiKey", label: "API Key", type: "password", required: true, placeholder: "SG..." },
      { key: "fromEmail", label: "Gönderen E-posta", type: "text", required: true, placeholder: "merhaba@markala.com.tr" },
      { key: "fromName", label: "Gönderen Adı", type: "text", required: true, placeholder: "Markala" },
      { key: "replyToEmail", label: "Reply-To E-posta", type: "text", placeholder: "destek@markala.com.tr" },
    ],
    docsUrl: "https://docs.sendgrid.com",
    status: "disconnected",
  },
  {
    id: "netgsm",
    name: "NetGSM",
    vendor: "NetGSM - SMS",
    description: "Sipariş onay SMS, kargo takip kodu SMS, OTP gönderimi.",
    category: "sms",
    icon: ChatCircle,
    fields: [
      { key: "username", label: "Kullanıcı Adı (telefon)", type: "text", required: true },
      { key: "password", label: "API Şifresi", type: "password", required: true },
      { key: "header", label: "Başlık (sender)", type: "text", required: true, placeholder: "MARKALA" },
    ],
    docsUrl: "https://www.netgsm.com.tr/dokuman",
    status: "disconnected",
  },
  {
    id: "dhl",
    name: "DHL",
    vendor: "DHL - Kargo",
    description: "Otomatik kargo etiketi oluşturma, takip numarası, teslimat durumu.",
    category: "shipping",
    icon: Truck,
    fields: [
      { key: "apiKey", label: "API Key", type: "password", required: true },
      { key: "accountNumber", label: "Müşteri Hesap No", type: "text", required: true },
      { key: "baseUrl", label: "Base URL", type: "url", placeholder: "https://api.dhl.com" },
    ],
    docsUrl: "https://developer.dhl.com",
    status: "connected",
  },
  {
    id: "r2",
    name: "Cloudflare R2",
    vendor: "Cloudflare R2 - Object Storage",
    description: "Ürün görselleri, müşteri tasarım dosyaları, fatura PDF arşivi.",
    category: "storage",
    icon: Cloud,
    fields: [
      { key: "accountId", label: "Account ID", type: "text", required: true },
      { key: "accessKeyId", label: "Access Key ID", type: "password", required: true },
      { key: "secretAccessKey", label: "Secret Access Key", type: "password", required: true },
      { key: "bucketName", label: "Bucket Adı", type: "text", required: true, placeholder: "markala-public" },
      { key: "publicUrl", label: "Public URL (CDN)", type: "url", placeholder: "https://cdn.markala.com.tr" },
    ],
    docsUrl: "https://developers.cloudflare.com/r2",
    status: "connected",
  },
  {
    id: "ga4",
    name: "Google Analytics 4",
    vendor: "Google - Analytics",
    description: "Trafik analizi, dönüşüm takibi, kullanıcı davranış raporları.",
    category: "analytics",
    icon: ChartLine,
    fields: [
      { key: "measurementId", label: "Measurement ID (G-...)", type: "text", required: true, placeholder: "G-XXXXXXXXXX" },
      { key: "apiSecret", label: "Measurement Protocol API Secret (opsiyonel)", type: "password" },
    ],
    docsUrl: "https://analytics.google.com",
    status: "disconnected",
  },
  {
    id: "search-console",
    name: "Search Console",
    vendor: "Google - Search Console",
    description: "Arama performansı, indeksleme durumu, sitemap kayıt.",
    category: "analytics",
    icon: ShieldCheck,
    fields: [
      { key: "verificationToken", label: "HTML Meta Tag Token", type: "text", required: true, placeholder: "google-site-verification=..." },
    ],
    docsUrl: "https://search.google.com/search-console",
    status: "disconnected",
  },
];

const categoryLabels: Record<Integration["category"], string> = {
  payment: "Ödeme",
  accounting: "Muhasebe",
  email: "E-posta",
  sms: "SMS",
  shipping: "Kargo",
  storage: "Depolama",
  analytics: "Analitik",
};

export default function ApiSettingsPage() {
  const [active, setActive] = useState<string>(integrations[0]!.id);

  const current = integrations.find((i) => i.id === active)!;

  return (
    <AdminShell>
      <header className="mb-6">
        <h1 className="text-2xl md:text-3xl font-semibold text-ink-900 flex items-center gap-2">
          <Plug size={28} weight="bold" className="text-brand-700" />
          API & Entegrasyonlar
        </h1>
        <p className="text-ink-500 text-sm mt-1">
          Üçüncü taraf servislerin API anahtarları ve bağlantı ayarları. Her değişiklik kaydedildikten sonra apps/api ortam değişkenleri ile senkronize olur.
        </p>
      </header>

      <div className="grid lg:grid-cols-12 gap-5">
        {/* Sol: entegrasyon listesi */}
        <aside className="lg:col-span-4">
          <div className="bg-paper-50 border border-paper-200 rounded-lg overflow-hidden">
            {integrations.map((it) => {
              const isActive = active === it.id;
              return (
                <button
                  key={it.id}
                  onClick={() => setActive(it.id)}
                  className={`w-full text-left flex items-center gap-3 px-4 py-3 border-b border-paper-200 last:border-0 transition-colors ${
                    isActive ? "bg-brand-100" : "hover:bg-paper-100"
                  }`}
                >
                  <div className={`flex-none w-10 h-10 rounded-md grid place-items-center ${isActive ? "bg-ink-900 text-brand-400" : "bg-paper-100 text-ink-700"}`}>
                    <it.icon size={20} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-ink-900 text-sm flex items-center gap-1.5">
                      {it.name}
                      <StatusDot status={it.status} />
                    </div>
                    <div className="text-[11px] text-ink-500 truncate">{categoryLabels[it.category]}</div>
                  </div>
                </button>
              );
            })}
          </div>
        </aside>

        {/* Sağ: form */}
        <section className="lg:col-span-8">
          <IntegrationForm integration={current} />
        </section>
      </div>
    </AdminShell>
  );
}

function StatusDot({ status }: { status: Integration["status"] }) {
  if (status === "connected") return <span className="w-1.5 h-1.5 rounded-full bg-success" title="Bağlı" />;
  if (status === "error") return <span className="w-1.5 h-1.5 rounded-full bg-error" title="Hata" />;
  return <span className="w-1.5 h-1.5 rounded-full bg-paper-300" title="Bağlı değil" />;
}

function IntegrationForm({ integration }: { integration: Integration }) {
  const [showSecrets, setShowSecrets] = useState<Record<string, boolean>>({});
  const [values, setValues] = useState<Record<string, string>>(() =>
    Object.fromEntries(integration.fields.map((f) => [f.key, ""])),
  );

  function toggleShow(k: string) {
    setShowSecrets((s) => ({ ...s, [k]: !s[k] }));
  }

  return (
    <div className="bg-paper-50 border border-paper-200 rounded-lg overflow-hidden">
      <header className="px-5 py-4 border-b border-paper-200 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-md bg-brand-500 text-ink-900 grid place-items-center">
            <integration.icon size={20} weight="bold" />
          </div>
          <div>
            <h2 className="font-semibold text-ink-900">{integration.vendor}</h2>
            <p className="text-xs text-ink-500">{integration.description}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {integration.status === "connected" ? (
            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-[11px] font-bold bg-success/10 text-success">
              <CheckCircle size={11} weight="fill" /> Bağlı
            </span>
          ) : integration.status === "error" ? (
            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-[11px] font-bold bg-error/10 text-error">
              <Warning size={11} weight="fill" /> Hata
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-[11px] font-bold bg-paper-200 text-ink-500">
              ○ Bağlı Değil
            </span>
          )}
        </div>
      </header>

      <div className="p-5 space-y-4">
        {integration.fields.map((f) => {
          const isSecret = f.type === "password";
          const visible = !!showSecrets[f.key];
          return (
            <label key={f.key} className="block">
              <span className="block text-xs font-semibold text-ink-700 uppercase tracking-wider mb-1.5">
                {f.label} {f.required && <span className="text-error">*</span>}
              </span>
              <div className="relative">
                <input
                  type={isSecret && !visible ? "password" : "text"}
                  value={values[f.key] ?? ""}
                  onChange={(e) => setValues({ ...values, [f.key]: e.target.value })}
                  placeholder={f.placeholder}
                  className="w-full px-3 py-2 pr-10 rounded-md border border-paper-200 bg-paper-50 text-sm font-mono focus:border-ink-900 focus:outline-none focus:ring-2 focus:ring-brand-300/30"
                />
                {isSecret && (
                  <button
                    type="button"
                    onClick={() => toggleShow(f.key)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-ink-500 hover:text-ink-900"
                    aria-label="Göster/Gizle"
                  >
                    {visible ? <EyeSlash size={14} /> : <Eye size={14} />}
                  </button>
                )}
              </div>
            </label>
          );
        })}

        <div className="flex items-center gap-2 pt-3 border-t border-paper-200">
          <button
            onClick={() => alert("Mock: ayarlar kaydedildi (backend bağlandığında PUT /api/admin/settings/integrations)")}
            className="inline-flex items-center gap-2 bg-ink-900 text-paper-50 px-4 py-2 rounded-md text-sm font-semibold hover:bg-ink-700"
          >
            <FloppyDisk size={14} weight="bold" /> Kaydet
          </button>
          <button
            onClick={() => alert("Mock: bağlantı testi yapılıyor...")}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium border border-paper-200 hover:bg-paper-100"
          >
            <CheckCircle size={14} weight="bold" /> Bağlantı Testi
          </button>
          <a
            href={integration.docsUrl}
            target="_blank"
            rel="noreferrer"
            className="ml-auto text-xs text-brand-700 hover:underline font-medium"
          >
            API Dokümantasyon →
          </a>
        </div>
      </div>
    </div>
  );
}
