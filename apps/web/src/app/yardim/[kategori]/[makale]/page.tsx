import Link from "next/link";
import { notFound } from "next/navigation";
import { Container } from "@markala/ui";
import { ArrowLeft, ArrowRight, CaretRight, Lightbulb } from "@phosphor-icons/react/dist/ssr";
import type { Metadata } from "next";
import { ArticleJsonLd, BreadcrumbJsonLd, FAQPageJsonLd } from "@/components/seo/json-ld";
import { HELP_CATEGORIES, HELP_CITY_LINKS, getHelpArticle } from "@/lib/help-center";
import { ArticleLinkRow, HelpContactBox, HelpSidebar } from "../../_components";

/**
 * Yardım merkezi makale sayfası — /yardim/[kategori]/[makale]
 * Soru odaklı tekil sayfa: uzun kuyruklu aramaların iniş noktası.
 *
 * SEO şeması: FAQPage JSON-LD makalenin ana sorusu + görünen "Kısa cevap"
 * metniyle birebir aynıdır (Google şartı). Article JSON-LD rehber içerik için,
 * Breadcrumb JSON-LD hiyerarşi için. dynamicParams=false → gerçek 404.
 */
export const dynamicParams = false;

export function generateStaticParams() {
  return HELP_CATEGORIES.flatMap((c) =>
    c.articles.map((a) => ({ kategori: c.slug, makale: a.slug })),
  );
}

interface Props {
  params: Promise<{ kategori: string; makale: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { kategori, makale } = await params;
  const found = getHelpArticle(kategori, makale);
  if (!found) return {};
  const { category, article } = found;
  const url = `/yardim/${category.slug}/${article.slug}`;
  return {
    title: `${article.question} — ${category.title}`,
    description: article.description,
    alternates: { canonical: url },
    openGraph: {
      type: "article",
      title: `${article.question} — Markala Yardım`,
      description: article.description,
      url,
      images: [{ url: "/og-default.png", width: 1200, height: 630, alt: article.question }],
    },
    twitter: {
      card: "summary_large_image",
      title: `${article.question} — Markala Yardım`,
      description: article.description,
      images: ["/og-default.png"],
    },
  };
}

export default async function HelpArticlePage({ params }: Props) {
  const { kategori, makale } = await params;
  const found = getHelpArticle(kategori, makale);
  if (!found) notFound();
  const { category, article } = found;

  const url = `/yardim/${category.slug}/${article.slug}`;
  const cityLinks = HELP_CITY_LINKS[article.slug];
  const related = category.articles.filter((a) => a.slug !== article.slug).slice(0, 4);

  return (
    <>
      <FAQPageJsonLd questions={[{ q: article.question, a: article.shortAnswer }]} url={url} />
      <ArticleJsonLd
        title={article.question}
        description={article.description}
        url={url}
        datePublished="2026-08-28T00:00:00Z"
        image={"/og-default.png"}
      />
      <BreadcrumbJsonLd
        items={[
          { name: "Anasayfa", href: "/" },
          { name: "Yardım Merkezi", href: "/yardim" },
          { name: category.title, href: `/yardim/${category.slug}` },
          { name: article.question, href: url },
        ]}
      />
      <div className="bg-paper-100 border-b border-paper-200">
        <Container className="py-8 md:py-12">
          <nav aria-label="Breadcrumb" className="flex flex-wrap items-center gap-1.5 text-sm text-ink-500 mb-4">
            <Link href="/" className="hover:text-ink-900">Anasayfa</Link>
            <CaretRight size={12} />
            <Link href="/yardim" className="hover:text-ink-900">Yardım</Link>
            <CaretRight size={12} />
            <Link href={`/yardim/${category.slug}`} className="hover:text-ink-900">{category.title}</Link>
            <CaretRight size={12} />
            <span className="text-ink-900 font-medium">{article.question}</span>
          </nav>
          <h1 className="text-3xl md:text-4xl font-semibold text-ink-900 max-w-3xl">{article.question}</h1>
        </Container>
      </div>

      <Container className="py-10 md:py-14">
        <div className="grid lg:grid-cols-[240px_1fr] gap-10">
          <aside className="hidden lg:block">
            <HelpSidebar activeCategory={category.slug} />
          </aside>

          <div className="min-w-0 max-w-3xl">
            {/* Kısa cevap — FAQPage JSON-LD ile birebir aynı metin */}
            <div className="p-5 bg-brand-100/50 border border-brand-500/30 rounded-xl flex items-start gap-3">
              <Lightbulb size={22} weight="fill" className="flex-none text-brand-700 mt-0.5" />
              <div>
                <div className="text-xs font-bold uppercase tracking-wider text-brand-700 mb-1">Kısa Cevap</div>
                <p className="text-sm text-ink-900 leading-relaxed">{article.shortAnswer}</p>
              </div>
            </div>

            <article className="mt-8">
              {article.sections.map((section, i) => (
                <section key={i} className={i > 0 ? "mt-8 pt-8 border-t border-paper-200" : ""}>
                  <h2 className="text-xl font-semibold text-ink-900">{section.heading}</h2>
                  <p className="mt-3 text-ink-700 leading-relaxed">{section.body}</p>
                </section>
              ))}
            </article>

            <div className="mt-12 pt-8 border-t border-paper-200 flex flex-wrap items-center justify-between gap-3">
              <Link
                href={`/yardim/${category.slug}`}
                className="inline-flex items-center gap-2 text-sm text-ink-700 hover:text-ink-900"
              >
                <ArrowLeft size={14} weight="bold" /> {category.title}
              </Link>
              <Link href="/iletisim" className="inline-flex items-center gap-2 text-sm text-brand-700 font-medium hover:underline">
                Hâlâ yardıma ihtiyacınız var mı? İletişim <ArrowRight size={14} weight="bold" />
              </Link>
            </div>

            {related.length > 0 && (
              <section className="mt-12">
                <h3 className="text-sm font-bold uppercase tracking-wider text-ink-500 mb-4">
                  {category.title} — İlgili Sorular
                </h3>
                <div className="bg-paper-50 border border-paper-200 rounded-xl divide-y divide-paper-200">
                  {related.map((a) => (
                    <ArticleLinkRow
                      key={a.slug}
                      href={`/yardim/${category.slug}/${a.slug}`}
                      title={a.question}
                    />
                  ))}
                </div>
              </section>
            )}

            {/* Şehir/konu silo linkleri — sadece mantıklı eşleşmelerde */}
            {cityLinks && cityLinks.length > 0 && (
              <section className="mt-10">
                <h3 className="text-sm font-bold uppercase tracking-wider text-ink-500 mb-3">
                  Şehrinizdeki Hizmetlerimiz
                </h3>
                <div className="flex flex-wrap gap-2">
                  {cityLinks.map((c) => (
                    <Link
                      key={c.href}
                      href={c.href}
                      className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-paper-50 border border-paper-200 text-sm text-ink-700 hover:border-brand-500 hover:text-brand-700 transition-colors"
                    >
                      {c.label}
                      <ArrowRight size={11} weight="bold" />
                    </Link>
                  ))}
                </div>
              </section>
            )}

            <div className="mt-10">
              <HelpContactBox />
            </div>
          </div>
        </div>
      </Container>
    </>
  );
}
