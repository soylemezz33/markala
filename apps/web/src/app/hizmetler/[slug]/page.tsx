import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { Container } from "@markala/ui";
import {
  ArrowRight, CheckCircle, Phone, WhatsappLogo, Question, CaretRight,
} from "@phosphor-icons/react/dist/ssr";
import { services, getServiceBySlug } from "@/lib/services";
import { getProducts } from "@/lib/catalog";
import { ProductCard } from "@/components/product-card";
import { BreadcrumbJsonLd } from "@/components/seo/json-ld";

const SITE = "https://markala.com.tr";

interface Props {
  params: { slug: string };
}

export function generateStaticParams() {
  return services.map((s) => ({ slug: s.slug }));
}

export function generateMetadata({ params }: Props): Metadata {
  const s = getServiceBySlug(params.slug);
  if (!s) return { title: "Hizmet bulunamadı" };

  return {
    title: s.metaTitle,
    description: s.metaDescription,
    keywords: s.keywords,
    alternates: { canonical: `/hizmetler/${s.slug}` },
    openGraph: {
      type: "website",
      title: s.title,
      description: s.intro.slice(0, 200),
      url: `/hizmetler/${s.slug}`,
    },
  };
}

export default async function ServicePage({ params }: Props) {
  const service = getServiceBySlug(params.slug);
  if (!service) notFound();

  const products = await getProducts();
  const relatedProducts = products.filter((p) =>
    service.relatedProductSlugs?.includes(p.slug),
  );

  return (
    <>
      <BreadcrumbJsonLd
        items={[
          { name: "Anasayfa", href: "/" },
          { name: "Hizmetler", href: "/hizmetler" },
          { name: service.title, href: `/hizmetler/${service.slug}` },
        ]}
      />

      {/* Service schema */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Service",
            "@id": `${SITE}/hizmetler/${service.slug}#service`,
            name: service.title,
            description: service.intro,
            provider: { "@id": `${SITE}/#localbusiness` },
            serviceType: service.title,
            ...(service.priceRange && service.priceRange.max > 0 && {
              offers: {
                "@type": "AggregateOffer",
                priceCurrency: "TRY",
                lowPrice: service.priceRange.min,
                highPrice: service.priceRange.max,
              },
            }),
            availableChannel: {
              "@type": "ServiceChannel",
              servicePhone: "+90-324-433-3351",
              serviceUrl: `${SITE}/hizmetler/${service.slug}`,
            },
            areaServed: { "@type": "Country", name: "TR" },
          }),
        }}
      />

      {/* HowTo schema for process */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "HowTo",
            "@id": `${SITE}/hizmetler/${service.slug}#howto`,
            name: `${service.title} Süreci`,
            description: `${service.title} hizmeti için adım adım süreç`,
            step: service.process.map((p, i) => ({
              "@type": "HowToStep",
              position: i + 1,
              name: p.title,
              text: p.desc,
              ...(p.duration && {
                timeRequired: p.duration,
              }),
            })),
          }),
        }}
      />

      {/* FAQPage schema */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "FAQPage",
            "@id": `${SITE}/hizmetler/${service.slug}#faq`,
            mainEntity: service.faqs.map((f) => ({
              "@type": "Question",
              name: f.q,
              acceptedAnswer: { "@type": "Answer", text: f.a },
            })),
          }),
        }}
      />

      {/* Breadcrumb visual */}
      <nav
        aria-label="Breadcrumb"
        className="bg-paper-100 border-b border-paper-200"
      >
        <Container className="py-3 flex items-center gap-1.5 text-sm text-ink-500 overflow-x-auto">
          <Link href="/" className="hover:text-ink-900 whitespace-nowrap">
            Anasayfa
          </Link>
          <CaretRight size={12} className="shrink-0" />
          <Link href="/hizmetler" className="hover:text-ink-900 whitespace-nowrap">
            Hizmetler
          </Link>
          <CaretRight size={12} className="shrink-0" />
          <span className="text-ink-900 font-medium whitespace-nowrap">
            {service.title}
          </span>
        </Container>
      </nav>

      {/* Hero */}
      <section className="bg-paper-50 border-b border-paper-200">
        <Container className="py-12 md:py-16 max-w-4xl">
          <p className="text-sm text-brand-700 font-semibold uppercase tracking-wider">
            Hizmet
          </p>
          <h1 className="mt-2 text-3xl md:text-5xl font-semibold text-ink-900 leading-tight">
            {service.title}
          </h1>
          <p className="mt-5 text-lg md:text-xl text-ink-700 leading-relaxed">
            {service.intro}
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Link
              href="/urunler"
              className="px-6 py-3 bg-brand-500 hover:bg-brand-600 text-ink-900 rounded-lg text-sm font-semibold inline-flex items-center gap-2"
            >
              Sipariş Ver <ArrowRight size={14} weight="bold" />
            </Link>
            <a
              href="https://wa.me/903244333351"
              target="_blank"
              rel="noopener noreferrer"
              className="px-6 py-3 bg-[#25D366] hover:bg-[#1FB358] text-white rounded-lg text-sm font-semibold inline-flex items-center gap-2"
            >
              <WhatsappLogo size={14} weight="fill" /> WhatsApp
            </a>
            <a
              href="tel:+903244333351"
              className="px-6 py-3 border border-paper-200 hover:border-ink-300 text-ink-900 rounded-lg text-sm font-semibold inline-flex items-center gap-2"
            >
              <Phone size={14} /> 0324 433 33 51
            </a>
          </div>
        </Container>
      </section>

      <Container className="py-12 md:py-16 max-w-5xl space-y-16">
        {/* Faydalar */}
        <section>
          <h2 className="text-2xl md:text-3xl font-semibold text-ink-900 mb-2">
            Neler kazanırsınız?
          </h2>
          <p className="text-ink-700 mb-6 max-w-2xl">
            Bu hizmetin sağladığı somut faydalar:
          </p>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {service.benefits.map((b) => (
              <article
                key={b.title}
                className="p-5 bg-paper-50 border border-paper-200 rounded-xl"
              >
                <CheckCircle
                  size={20}
                  weight="fill"
                  className="text-success mb-3"
                />
                <h3 className="font-semibold text-ink-900 text-base">
                  {b.title}
                </h3>
                <p className="mt-2 text-sm text-ink-700 leading-relaxed">
                  {b.desc}
                </p>
              </article>
            ))}
          </div>
        </section>

        {/* Süreç */}
        <section>
          <h2 className="text-2xl md:text-3xl font-semibold text-ink-900 mb-2">
            Nasıl çalışır?
          </h2>
          <p className="text-ink-700 mb-8 max-w-2xl">
            {service.process.length} adımda süreç:
          </p>
          <ol className="space-y-4">
            {service.process.map((step, i) => (
              <li
                key={step.n}
                className="flex gap-5 p-5 bg-paper-50 border border-paper-200 rounded-xl"
              >
                <div className="flex-none w-12 h-12 rounded-full bg-brand-500 text-ink-900 grid place-items-center font-bold text-lg tabular-nums">
                  {step.n}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <h3 className="font-semibold text-ink-900 text-lg">
                      {step.title}
                    </h3>
                    {step.duration && (
                      <span className="text-xs font-semibold text-brand-700 px-2 py-1 rounded-full bg-brand-100 tabular-nums">
                        ⏱ {step.duration}
                      </span>
                    )}
                  </div>
                  <p className="mt-1 text-ink-700 leading-relaxed">
                    {step.desc}
                  </p>
                </div>
              </li>
            ))}
          </ol>
        </section>

        {/* SSS */}
        <section>
          <div className="flex items-center gap-2 mb-6">
            <Question size={22} weight="fill" className="text-brand-700" />
            <h2 className="text-2xl md:text-3xl font-semibold text-ink-900">
              Sıkça Sorulan Sorular
            </h2>
          </div>
          <div className="space-y-3">
            {service.faqs.map((f, i) => (
              <details
                key={i}
                className="group bg-paper-50 border border-paper-200 rounded-lg open:shadow-sm"
              >
                <summary className="cursor-pointer px-5 py-4 font-medium text-ink-900 flex items-center justify-between hover:bg-paper-100 transition-colors">
                  <span>{f.q}</span>
                  <CaretRight
                    size={14}
                    weight="bold"
                    className="transition-transform group-open:rotate-90 text-ink-500"
                  />
                </summary>
                <div className="px-5 pb-5 text-ink-700 leading-relaxed border-t border-paper-200/50 pt-4">
                  {f.a}
                </div>
              </details>
            ))}
          </div>
        </section>

        {/* İlgili ürünler */}
        {relatedProducts.length > 0 && (
          <section>
            <h2 className="text-2xl md:text-3xl font-semibold text-ink-900 mb-6">
              Bu hizmetle sıkça sipariş edilen ürünler
            </h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {relatedProducts.map((p) => (
                <ProductCard key={p.slug} product={p} />
              ))}
            </div>
          </section>
        )}

        {/* Final CTA */}
        <section className="text-center p-10 md:p-14 bg-ink-900 text-paper-50 rounded-2xl">
          <h2 className="text-2xl md:text-4xl font-semibold">
            {service.title} için hazırız
          </h2>
          <p className="mt-4 text-paper-100/70 max-w-xl mx-auto">
            Detaylar için bize ulaşın — WhatsApp en hızlı kanal, ortalama 5
            dakikada yanıt veriyoruz.
          </p>
          <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
            <Link
              href="/urunler"
              className="px-6 py-3 bg-brand-500 hover:bg-brand-600 text-ink-900 rounded-lg text-sm font-semibold inline-flex items-center gap-2"
            >
              Ürünleri Keşfet <ArrowRight size={14} weight="bold" />
            </Link>
            <a
              href="https://wa.me/903244333351"
              target="_blank"
              rel="noopener noreferrer"
              className="px-6 py-3 bg-[#25D366] hover:bg-[#1FB358] text-white rounded-lg text-sm font-semibold inline-flex items-center gap-2"
            >
              <WhatsappLogo size={14} weight="fill" /> WhatsApp
            </a>
          </div>
        </section>
      </Container>
    </>
  );
}
