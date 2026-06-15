"use client";

import { useState, useTransition } from "react";
import { AdminShell } from "@/components/admin-shell";
import { toast } from "@/components/toast";
import { PaintBrush, FloppyDisk, Globe, ShieldCheck, ChartLine, Robot } from "@phosphor-icons/react";
import { saveSettings } from "../actions";

interface Props {
  initial: Record<string, unknown>;
}

export function SeoClient({ initial }: Props) {
  const [isPending, startTransition] = useTransition();

  const [defaultTitle, setDefaultTitle] = useState(
    String(initial["seo.defaultTitle"] ?? "Markala — Matbaa ve Reklam Ürünleri"),
  );
  const [titleTemplate, setTitleTemplate] = useState(
    String(initial["seo.titleTemplate"] ?? "%s · Markala"),
  );
  const [defaultDescription, setDefaultDescription] = useState(
    String(
      initial["seo.defaultDescription"] ??
        "Kartvizitten branda afişe, broşürden kupaya 30+ matbaa & reklam ürünü kategorisi. Ücretsiz tasarım desteği, 1-2 iş günü üretim, 81 il DHL kargo. 324 Ajans güvencesiyle markala.com.tr.",
    ),
  );
  const [keywords, setKeywords] = useState(
    String(
      initial["seo.keywords"] ??
        "matbaa, reklam ürünleri, kartvizit baskı, broşür baskı, online matbaa, 324 ajans, markala",
    ),
  );
  const [ogImage, setOgImage] = useState(
    String(initial["seo.ogImage"] ?? "/api/mockup?theme=brand&w=1200&h=630"),
  );
  const [gscToken, setGscToken] = useState(String(initial["seo.gscToken"] ?? ""));
  const [ga4Id, setGa4Id] = useState(String(initial["seo.ga4Id"] ?? ""));
  const [clarityId, setClarityId] = useState(String(initial["seo.clarityId"] ?? ""));
  const [robotsAllowAi, setRobotsAllowAi] = useState(
    initial["seo.robotsAllowAi"] === true || initial["seo.robotsAllowAi"] === "true",
  );
  const [autoSitemap, setAutoSitemap] = useState(
    initial["seo.autoSitemap"] !== false && initial["seo.autoSitemap"] !== "false",
  );
  const [breadcrumbSchema, setBreadcrumbSchema] = useState(
    initial["seo.breadcrumbSchema"] !== false && initial["seo.breadcrumbSchema"] !== "false",
  );
  const [productSchema, setProductSchema] = useState(
    initial["seo.productSchema"] !== false && initial["seo.productSchema"] !== "false",
  );

  function handleSave() {
    startTransition(async () => {
      try {
        await saveSettings(
          "seo",
          {
            "seo.defaultTitle": defaultTitle,
            "seo.titleTemplate": titleTemplate,
            "seo.defaultDescription": defaultDescription,
            "seo.keywords": keywords,
            "seo.ogImage": ogImage,
            "seo.gscToken": gscToken,
            "seo.ga4Id": ga4Id,
            "seo.clarityId": clarityId,
            "seo.robotsAllowAi": robotsAllowAi,
            "seo.autoSitemap": autoSitemap,
            "seo.breadcrumbSchema": breadcrumbSchema,
            "seo.productSchema": productSchema,
          },
          "/ayarlar/seo",
        );
        toast.success("SEO ayarları kaydedildi. Sitemap yenilenecek.");
      } catch {
        toast.error("Kayıt başarısız. Lütfen tekrar deneyin.");
      }
    });
  }

  return (
    <AdminShell>
      <header className="mb-6">
        <h1 className="text-2xl md:text-3xl font-semibold text-ink-900 flex items-center gap-2">
          <PaintBrush size={28} weight="bold" className="text-brand-700" />
          SEO Ayarları
        </h1>
        <p className="text-ink-500 text-sm mt-1">
          Site geneli meta etiketleri, Schema.org markupları, Search Console ve Analytics
        </p>
      </header>

      <div className="grid lg:grid-cols-2 gap-5">
        <Card title="Genel Meta" icon={Globe}>
          <Field label="Varsayılan Site Başlığı (anasayfa)">
            <input
              className={cls}
              value={defaultTitle}
              onChange={(e) => setDefaultTitle(e.target.value)}
            />
            <span className="text-[11px] text-ink-500 mt-1 block">
              {defaultTitle.length}/60 karakter
            </span>
          </Field>
          <Field label="Başlık Şablonu (alt sayfalar için)">
            <input
              className={cls + " font-mono"}
              value={titleTemplate}
              onChange={(e) => setTitleTemplate(e.target.value)}
            />
            <span className="text-[11px] text-ink-500 mt-1 block">%s = sayfa başlığı yer tutucusu</span>
          </Field>
          <Field label="Varsayılan Meta Açıklama">
            <textarea
              rows={4}
              className={cls}
              value={defaultDescription}
              onChange={(e) => setDefaultDescription(e.target.value)}
            />
            <span className="text-[11px] text-ink-500 mt-1 block">
              {defaultDescription.length}/160 karakter
            </span>
          </Field>
          <Field label="Varsayılan Anahtar Kelimeler (virgülle)">
            <textarea
              rows={2}
              className={cls + " font-mono text-xs"}
              value={keywords}
              onChange={(e) => setKeywords(e.target.value)}
            />
          </Field>
        </Card>

        <Card title="Open Graph & Sosyal Önizleme" icon={ChartLine}>
          <Field label="Open Graph Görseli (1200×630)">
            <input
              className={cls}
              value={ogImage}
              onChange={(e) => setOgImage(e.target.value)}
            />
          </Field>
          <div className="mt-3 aspect-[1200/630] bg-paper-100 border border-paper-200 rounded-lg overflow-hidden">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={ogImage} alt="OG önizleme" className="w-full h-full object-cover" />
          </div>
          <p className="text-[11px] text-ink-500 mt-2">
            ⓘ Bu görsel Facebook, X (Twitter), WhatsApp paylaşımlarında kullanılır.
          </p>
        </Card>

        <Card title="Search Console & Analytics" icon={ShieldCheck}>
          <Field label="Google Search Console Doğrulama Kodu">
            <input
              className={cls + " font-mono"}
              value={gscToken}
              onChange={(e) => setGscToken(e.target.value)}
              placeholder="google-site-verification=..."
            />
          </Field>
          <Field label="Google Analytics 4 Measurement ID">
            <input
              className={cls + " font-mono"}
              value={ga4Id}
              onChange={(e) => setGa4Id(e.target.value)}
              placeholder="G-XXXXXXXXXX"
            />
          </Field>
          <Field label="Microsoft Clarity Project ID (opsiyonel)">
            <input
              className={cls + " font-mono"}
              value={clarityId}
              onChange={(e) => setClarityId(e.target.value)}
              placeholder="abc123xyz"
            />
          </Field>
        </Card>

        <Card title="Robots & Crawler Politikası" icon={Robot}>
          <Toggle
            checked={autoSitemap}
            onChange={setAutoSitemap}
            label="Otomatik sitemap.xml oluştur"
            sub="Tüm ürün, kategori ve yasal sayfaları sitemap'e ekler"
          />
          <Toggle
            checked={!robotsAllowAi}
            onChange={(v) => setRobotsAllowAi(!v)}
            label="AI bot crawler'larını engelle"
            sub="GPTBot, CCBot, ClaudeBot ve anthropic-ai engellenir"
          />
          <Toggle
            checked={breadcrumbSchema}
            onChange={setBreadcrumbSchema}
            label="Breadcrumb Schema markup"
            sub="Google rich snippet için breadcrumb yapısı"
          />
          <Toggle
            checked={productSchema}
            onChange={setProductSchema}
            label="Product + Offer + AggregateRating Schema"
            sub="Ürün sayfalarında zengin sonuç sergilenmesi için"
          />
        </Card>
      </div>

      <div className="mt-6 flex items-center justify-end gap-2">
        <button
          onClick={handleSave}
          disabled={isPending}
          className="inline-flex items-center gap-2 bg-ink-900 text-paper-50 px-5 py-2 rounded-md text-sm font-semibold hover:bg-ink-700 disabled:opacity-60"
        >
          <FloppyDisk size={14} weight="bold" />
          {isPending ? "Kaydediliyor…" : "Kaydet & Sitemap Yenile"}
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
  icon: typeof Globe;
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

function Toggle({
  checked,
  onChange,
  label,
  sub,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
  sub: string;
}) {
  return (
    <label className="flex items-start justify-between gap-3 py-2 cursor-pointer">
      <div className="flex-1">
        <div className="text-sm font-medium text-ink-900">{label}</div>
        <div className="text-[11px] text-ink-500 mt-0.5">{sub}</div>
      </div>
      <button
        type="button"
        onClick={() => onChange(!checked)}
        className={`relative w-11 h-6 rounded-full transition-colors flex-none ${checked ? "bg-brand-500" : "bg-paper-200"}`}
        role="switch"
        aria-checked={checked}
      >
        <span
          className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-paper-50 shadow transition-transform ${checked ? "translate-x-5" : ""}`}
        />
      </button>
    </label>
  );
}
