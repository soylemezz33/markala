import Link from "next/link";
import { notFound } from "next/navigation";
import { Container } from "@markala/ui";
import { CaretRight } from "@phosphor-icons/react/dist/ssr";
import type { Metadata } from "next";
import { BreadcrumbJsonLd, ItemListJsonLd } from "@/components/seo/json-ld";
import { HELP_CATEGORIES, getHelpCategory } from "@/lib/help-center";
import { ArticleLinkRow, CATEGORY_ICONS, HelpContactBox, HelpSidebar } from "../_components";

/**
 * Yardım merkezi kategori sayfası — /yardim/[kategori]
 * Parametre kümesi kodda sabit → dynamicParams=false ile bilinmeyen slug
 * router seviyesinde gerçek 404 döner (soft-404 önlemi; /yardim/[slug] mirası).
 */
export const dynamicParams = false;

export function generateStaticParams() {
  return HELP_CATEGORIES.map((c) => ({ kategori: c.slug }));
}

interface Props {
  params: Promise<{ kategori: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { kategori } = await params;
  const category = getHelpCategory(kategori);
  if (!category) return {};
  return {
    title: `${category.title} | Yardım Merkezi`,
    description: category.description,
    alternates: { canonical: `/yardim/${category.slug}` },
    openGraph: {
      type: "website",
      title: `${category.title} | Markala Yardım`,
      description: category.description,
      url: `/yardim/${category.slug}`,
      images: [{ url: "/og-default.png", width: 1200, height: 630, alt: category.title }],
    },
    twitter: {
      card: "summary_large_image",
      title: `${category.title} | Markala Yardım`,
      description: category.description,
      images: ["/og-default.png"],
    },
  };
}

export default async function HelpCategoryPage({ params }: Props) {
  const { kategori } = await params;
  const category = getHelpCategory(kategori);
  if (!category) notFound();

  const Icon = CATEGORY_ICONS[category.icon];

  return (
    <>
      <ItemListJsonLd
        name={`${category.title} - Yardım Makaleleri`}
        url={`/yardim/${category.slug}`}
        items={category.articles.map((a) => ({
          name: a.question,
          href: `/yardim/${category.slug}/${a.slug}`,
        }))}
      />
      <BreadcrumbJsonLd
        items={[
          { name: "Anasayfa", href: "/" },
          { name: "Yardım Merkezi", href: "/yardim" },
          { name: category.title, href: `/yardim/${category.slug}` },
        ]}
      />
      <div className="bg-paper-100 border-b border-paper-200">
        <Container className="py-8 md:py-12">
          <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-sm text-ink-500 mb-4">
            <Link href="/" className="hover:text-ink-900">Anasayfa</Link>
            <CaretRight size={12} />
            <Link href="/yardim" className="hover:text-ink-900">Yardım</Link>
            <CaretRight size={12} />
            <span className="text-ink-900 font-medium">{category.title}</span>
          </nav>
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 flex-none rounded-lg bg-brand-100 text-brand-700 grid place-items-center">
              <Icon size={24} />
            </div>
            <div>
              <h1 className="text-3xl md:text-4xl font-semibold text-ink-900">{category.title}</h1>
              <p className="mt-2 text-lg text-ink-700 max-w-2xl">{category.description}</p>
            </div>
          </div>
        </Container>
      </div>

      <Container className="py-10 md:py-14">
        <div className="grid lg:grid-cols-[240px_1fr] gap-10">
          <aside className="hidden lg:block">
            <HelpSidebar activeCategory={category.slug} />
          </aside>

          <div className="min-w-0">
            <div className="bg-paper-50 border border-paper-200 rounded-xl divide-y divide-paper-200">
              {category.articles.map((a) => (
                <ArticleLinkRow
                  key={a.slug}
                  href={`/yardim/${category.slug}/${a.slug}`}
                  title={a.question}
                  description={a.description}
                />
              ))}
            </div>

            <div className="mt-10">
              <HelpContactBox />
            </div>
          </div>
        </div>
      </Container>
    </>
  );
}
