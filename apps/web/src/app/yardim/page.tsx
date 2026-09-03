import Link from "next/link";
import { Container } from "@markala/ui";
import { Question, ArrowRight, ChatCircle, Lifebuoy } from "@phosphor-icons/react/dist/ssr";
import { BreadcrumbJsonLd, ItemListJsonLd } from "@/components/seo/json-ld";
import type { Metadata } from "next";
import { HELP_CATEGORIES, POPULAR_HELP } from "@/lib/help-center";
import { HelpSearch, type SearchItem } from "./_search";
import { CATEGORY_ICONS } from "./_components";

/**
 * Yardım Merkezi hub'ı — kategori → makale iki seviyeli mimarinin girişi.
 * (2026-08-28: bidolubaski yardım merkezi deseninden uyarlandı; makaleler
 * lib/help-center.ts'te kodda tutulur, arama istemci tarafındadır.)
 *
 * FAQPage JSON-LD bilinçli olarak YOK: cevaplar bu sayfada görünmüyor (yalnız
 * link listesi) — görünmeyen cevapla FAQ şeması Google yönergesine aykırı.
 * Şemayı, soru+cevabın birlikte göründüğü makale sayfaları üretir.
 */

export const metadata: Metadata = {
  title: "Yardım Merkezi | Sipariş, Dosya Hazırlama, Kargo, İade",
  description:
    "Markala yardım merkezi: sipariş süreci, dosya hazırlama, üyelik, kampanyalar, ödeme ve fatura, kargo ve teslimat, iade, kurumsal hesap: tüm sorularınızın cevabı.",
  alternates: { canonical: "/yardim" },
  openGraph: {
    type: "website",
    title: "Markala Yardım Merkezi",
    description: "Size nasıl yardımcı olabiliriz? Sipariş, dosya hazırlama, kargo, iade ve daha fazlası.",
    url: "/yardim",
    images: [{ url: "/og-default.png", width: 1200, height: 630, alt: "Markala Yardım Merkezi" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Markala Yardım Merkezi",
    description: "Size nasıl yardımcı olabiliriz? Sipariş, dosya hazırlama, kargo, iade ve daha fazlası.",
    images: ["/og-default.png"],
  },
};

/** Arama indeksi — tüm makaleler + SSS girişi (build'de hesaplanır, client'a props gider). */
const searchItems: SearchItem[] = [
  ...HELP_CATEGORIES.flatMap((c) =>
    c.articles.map((a) => ({
      q: a.question,
      href: `/yardim/${c.slug}/${a.slug}`,
      category: c.title,
      keywords: a.keywords ?? [],
    })),
  ),
  { q: "Sıkça Sorulan Sorular", href: "/yardim/sss", category: "SSS", keywords: ["sss", "sorular"] },
];

export default function YardimPage() {
  return (
    <>
      <ItemListJsonLd
        name="Markala Yardım Merkezi Kategorileri"
        url="/yardim"
        items={HELP_CATEGORIES.map((c) => ({ name: c.title, href: `/yardim/${c.slug}` }))}
      />
      <BreadcrumbJsonLd
        items={[
          { name: "Anasayfa", href: "/" },
          { name: "Yardım Merkezi", href: "/yardim" },
        ]}
      />
      <div className="bg-paper-100 border-b border-paper-200">
        <Container className="py-12 md:py-16 max-w-3xl text-center">
          <div className="w-16 h-16 mx-auto rounded-full bg-brand-100 grid place-items-center text-brand-700 mb-4">
            <Question size={28} weight="bold" />
          </div>
          <p className="text-sm text-brand-700 font-semibold uppercase tracking-wider">Yardım Merkezi</p>
          <h1 className="mt-2 text-3xl md:text-5xl font-semibold text-ink-900 leading-tight">
            Size nasıl yardımcı olabiliriz?
          </h1>
          <p className="mt-4 text-lg text-ink-700 max-w-xl mx-auto">
            Sipariş, dosya hazırlama, kargo, iade: her konuda soru odaklı, net cevaplar.
          </p>
          <div className="mt-6">
            <HelpSearch items={searchItems} />
          </div>
        </Container>
      </div>

      <Container className="py-12 md:py-16">
        {/* Kategori kartları */}
        <section>
          <h2 className="text-2xl font-semibold text-ink-900 mb-6">Konular</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {HELP_CATEGORIES.map((c) => {
              const Icon = CATEGORY_ICONS[c.icon];
              return (
                <Link
                  key={c.slug}
                  href={`/yardim/${c.slug}`}
                  className="group p-5 bg-paper-50 border border-paper-200 rounded-xl hover:border-ink-300 hover:shadow-md transition-all"
                >
                  <div className="w-11 h-11 rounded-lg bg-brand-100 text-brand-700 grid place-items-center mb-3">
                    <Icon size={22} />
                  </div>
                  <h3 className="font-semibold text-ink-900 text-sm">{c.title}</h3>
                  <p className="text-xs text-ink-500 mt-1">{c.short}</p>
                  <span className="mt-3 inline-flex items-center gap-1 text-xs font-medium text-brand-700 group-hover:gap-2 transition-all">
                    {c.articles.length} makale <ArrowRight size={10} weight="bold" />
                  </span>
                </Link>
              );
            })}
          </div>
        </section>

        {/* SSS bandı */}
        <section className="mt-8">
          <Link
            href="/yardim/sss"
            className="flex items-center justify-between gap-4 p-5 bg-brand-100/60 border border-brand-500/30 rounded-xl hover:border-brand-500 transition-colors group"
          >
            <span className="flex items-center gap-3">
              <Lifebuoy size={24} className="flex-none text-brand-700" />
              <span>
                <span className="block font-semibold text-ink-900 text-sm">Sıkça Sorulan Sorular</span>
                <span className="block text-xs text-ink-500 mt-0.5">
                  En çok sorulan 30+ soru ve kısa cevapları, tek sayfada
                </span>
              </span>
            </span>
            <ArrowRight size={16} className="flex-none text-brand-700 group-hover:translate-x-1 transition-transform" />
          </Link>
        </section>

        {/* Popüler sorular */}
        <section className="mt-16">
          <h2 className="text-2xl font-semibold text-ink-900 mb-6">Popüler Sorular</h2>
          <div className="bg-paper-50 border border-paper-200 rounded-xl divide-y divide-paper-200">
            {POPULAR_HELP.map((f) => (
              <Link
                key={f.href}
                href={f.href}
                className="flex items-center justify-between gap-3 px-5 py-4 hover:bg-paper-100 group transition-colors"
              >
                <span className="text-sm text-ink-900 font-medium">{f.q}</span>
                <ArrowRight size={14} className="text-ink-500 group-hover:text-brand-700 group-hover:translate-x-1 transition-all" />
              </Link>
            ))}
          </div>
        </section>

        {/* İletişim CTA */}
        <section className="mt-16 p-8 md:p-12 bg-ink-900 text-paper-50 rounded-2xl text-center">
          <ChatCircle size={32} weight="fill" className="text-brand-400 mx-auto" />
          <h2 className="mt-4 text-2xl md:text-3xl font-semibold">
            Cevabınızı bulamadınız mı?
          </h2>
          <p className="mt-3 text-paper-100/70 max-w-xl mx-auto">
            Müşteri hizmetleri ekibimiz WhatsApp, telefon ve e-posta ile 09:00-18:00 arası destek veriyor.
          </p>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            <Link href="/iletisim" className="px-5 py-2.5 bg-brand-500 text-ink-900 rounded-lg text-sm font-semibold">
              İletişim Formu
            </Link>
            <a href="https://wa.me/905319004102" className="px-5 py-2.5 border border-paper-100/30 text-paper-50 rounded-lg text-sm font-semibold hover:bg-white/5">
              WhatsApp
            </a>
          </div>
        </section>
      </Container>
    </>
  );
}
