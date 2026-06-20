import Link from "next/link";
import type { Metadata } from "next";
import { Container } from "@markala/ui";
import { BookOpen, MagnifyingGlass, ArrowRight, CaretRight } from "@phosphor-icons/react/dist/ssr";
import { glossary, glossaryCategories, type GlossaryCategory } from "@/lib/glossary";
import { BreadcrumbJsonLd } from "@/components/seo/json-ld";

const SITE = "https://markala.com.tr";

export const metadata: Metadata = {
  title: "Matbaa Terimleri Sözlüğü — CMYK, Gramaj, Selefon ve 30+ Terim",
  description:
    "Matbaa ve baskı sektörünün tüm terimleri tek sayfada: CMYK, gramaj, kuşe, bristol, selefon, UV lak, yaldız, taşma payı, fire, hard proof. SEO-optimize sözlük.",
  keywords: [
    "matbaa terimleri",
    "baskı terimleri sözlüğü",
    "cmyk nedir",
    "gramaj nedir",
    "selefon nedir",
    "uv lak nedir",
    "pantone nedir",
    "kuşe kağıt nedir",
    "bristol karton nedir",
    "taşma payı nedir",
    "matbaa fire toleransı",
    "ofset baskı vs dijital",
  ],
  alternates: { canonical: "/sozluk" },
  openGraph: {
    type: "website",
    title: "Matbaa Terimleri Sözlüğü — Markala",
    description: "30+ matbaa ve baskı terimi A-Z açıklamaları.",
    url: "/sozluk",
    images: [{ url: "/og-default.png", width: 1200, height: 630, alt: "Markala Matbaa Sözlüğü" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Matbaa Terimleri Sözlüğü — Markala",
    description: "30+ matbaa ve baskı terimi A-Z açıklamaları.",
    images: ["/og-default.png"],
  },
};

export default function GlossaryPage() {
  // Kategoriye göre grupla
  const byCategory = (Object.keys(glossaryCategories) as GlossaryCategory[]).map((catKey) => ({
    key: catKey,
    info: glossaryCategories[catKey],
    terms: glossary.filter((t) => t.category === catKey),
  }));

  // Schema.org DefinedTermSet
  const definedTermSet = {
    "@context": "https://schema.org",
    "@type": "DefinedTermSet",
    "@id": `${SITE}/sozluk#termset`,
    name: "Markala Matbaa Terimleri Sözlüğü",
    description:
      "Matbaa ve baskı sektörünün temel terimleri: CMYK, RGB, gramaj, selefon, UV lak ve daha fazlası.",
    inDefinedTermSet: glossary.map((t) => ({
      "@type": "DefinedTerm",
      "@id": `${SITE}/sozluk#${t.slug}`,
      name: t.term,
      description: t.shortDef,
      termCode: t.slug,
      url: `${SITE}/sozluk#${t.slug}`,
      ...(t.synonyms && { alternateName: t.synonyms }),
    })),
  };

  return (
    <>
      <BreadcrumbJsonLd
        items={[
          { name: "Anasayfa", href: "/" },
          { name: "Yardım", href: "/yardim" },
          { name: "Matbaa Sözlüğü", href: "/sozluk" },
        ]}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(definedTermSet) }}
      />

      {/* Hero */}
      <div className="bg-paper-100 border-b border-paper-200">
        <Container className="py-12 md:py-16 max-w-3xl">
          <div className="flex items-center gap-2 mb-3">
            <BookOpen size={20} weight="fill" className="text-brand-700" />
            <span className="text-sm font-semibold text-brand-700 uppercase tracking-wider">
              Sözlük
            </span>
          </div>
          <h1 className="text-3xl md:text-5xl font-semibold text-ink-900 leading-tight">
            Matbaa Terimleri Sözlüğü
          </h1>
          <p className="mt-4 text-lg text-ink-700">
            Sektörün tüm terimleri tek sayfada — CMYK, gramaj, selefon, UV lak,
            taşma payı, fire ve {glossary.length}+ kavramın net açıklaması.
            Dosya hazırlarken veya sipariş verirken hızlı referans.
          </p>

          <p className="mt-4 text-sm text-ink-500">
            <Link
              href="/yardim/dosya-hazirlama"
              className="text-brand-700 hover:underline font-medium"
            >
              Dosya hazırlama rehberine git
            </Link>
            {" · "}
            <Link
              href="/urunler"
              className="text-brand-700 hover:underline font-medium"
            >
              Ürünleri incele
            </Link>
          </p>
        </Container>
      </div>

      <Container className="py-10 md:py-14 max-w-5xl">
        {/* Quick TOC */}
        <nav className="mb-12 p-5 bg-paper-50 border border-paper-200 rounded-xl">
          <div className="text-xs font-semibold uppercase tracking-wider text-ink-500 mb-3">
            Kategoriye git
          </div>
          <ul className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {byCategory.map((c) => (
              <li key={c.key}>
                <a
                  href={`#${c.key}`}
                  className="block px-3 py-2 rounded-md text-sm font-medium text-ink-900 hover:bg-paper-100 hover:text-brand-700 transition-colors"
                >
                  {c.info.name}
                  <span className="text-ink-500 font-normal ml-1">
                    ({c.terms.length})
                  </span>
                </a>
              </li>
            ))}
          </ul>
        </nav>

        {/* Categorized list */}
        <div className="space-y-16">
          {byCategory.map((c) => (
            <section key={c.key} id={c.key} className="scroll-mt-24">
              <header className="mb-6">
                <h2 className="text-2xl md:text-3xl font-semibold text-ink-900">
                  {c.info.name}
                </h2>
                <p className="mt-1 text-ink-500">{c.info.desc}</p>
              </header>

              <div className="grid sm:grid-cols-2 gap-4">
                {c.terms.map((t) => (
                  <article
                    key={t.slug}
                    id={t.slug}
                    className="p-5 bg-paper-50 border border-paper-200 rounded-lg scroll-mt-24"
                    itemScope
                    itemType="https://schema.org/DefinedTerm"
                  >
                    <h3
                      className="text-lg font-semibold text-ink-900"
                      itemProp="name"
                    >
                      {t.term}
                    </h3>
                    {t.synonyms && (
                      <p className="text-xs text-ink-500 mt-0.5">
                        Eş anlamlı:{" "}
                        <span itemProp="alternateName">
                          {t.synonyms.join(", ")}
                        </span>
                      </p>
                    )}
                    <p
                      className="mt-2 text-sm text-ink-900 font-medium leading-relaxed"
                      itemProp="description"
                    >
                      {t.shortDef}
                    </p>
                    <p className="mt-3 text-sm text-ink-700 leading-relaxed">
                      {t.longDef}
                    </p>
                    {t.examples && t.examples.length > 0 && (
                      <div className="mt-3 pt-3 border-t border-paper-200">
                        <div className="text-[11px] uppercase tracking-wider text-ink-500 font-medium mb-1.5">
                          Örnek
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                          {t.examples.map((e) => (
                            <span
                              key={e}
                              className="text-xs px-2 py-0.5 rounded bg-paper-100 text-ink-700"
                            >
                              {e}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                    {t.relatedTerms && t.relatedTerms.length > 0 && (
                      <div className="mt-3 pt-3 border-t border-paper-200">
                        <div className="text-[11px] uppercase tracking-wider text-ink-500 font-medium mb-1.5">
                          İlgili
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                          {t.relatedTerms.map((rs) => {
                            const related = glossary.find((g) => g.slug === rs);
                            if (!related) return null;
                            return (
                              <a
                                key={rs}
                                href={`#${rs}`}
                                className="text-xs px-2 py-0.5 rounded bg-brand-100 text-brand-900 hover:bg-brand-200"
                              >
                                {related.term}
                              </a>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </article>
                ))}
              </div>
            </section>
          ))}
        </div>

        {/* CTA */}
        <section className="mt-20 p-8 md:p-12 bg-ink-900 text-paper-50 rounded-2xl text-center">
          <h2 className="text-2xl md:text-3xl font-semibold">
            Sipariş vermeye hazır mısın?
          </h2>
          <p className="mt-3 text-paper-100/70 max-w-xl mx-auto">
            Terimleri öğrendiğine göre, dosyanı doğru hazırlayıp güvenle sipariş
            verebilirsin. Tasarım desteği her zaman ücretsiz.
          </p>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            <Link
              href="/urunler"
              className="px-6 py-3 bg-brand-500 hover:bg-brand-600 text-ink-900 rounded-lg text-sm font-semibold inline-flex items-center gap-2"
            >
              Ürünleri Keşfet <ArrowRight size={14} weight="bold" />
            </Link>
            <Link
              href="/yardim/dosya-hazirlama"
              className="px-6 py-3 border border-paper-100/30 text-paper-50 rounded-lg text-sm font-semibold hover:bg-white/5 inline-flex items-center gap-2"
            >
              Dosya Hazırlama Rehberi
            </Link>
          </div>
        </section>
      </Container>
    </>
  );
}
