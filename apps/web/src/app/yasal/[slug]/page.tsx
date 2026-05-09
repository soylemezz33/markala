import Link from "next/link";
import { notFound } from "next/navigation";
import { Container } from "@markala/ui";
import { CaretRight, FileText, Notebook, Cookie, Shield, ListBullets } from "@phosphor-icons/react/dist/ssr";
import { getAllLegalSlugs, getLegalPage, legalPages } from "@markala/mock-data";
import { formatDate } from "@/lib/format";
import type { Metadata } from "next";

interface Props {
  params: { slug: string };
}

export function generateStaticParams() {
  return getAllLegalSlugs().map((slug) => ({ slug }));
}

export function generateMetadata({ params }: Props): Metadata {
  const page = getLegalPage(params.slug);
  if (!page) return {};
  const url = `/yasal/${page.slug}`;
  return {
    title: page.title,
    description: `${page.title} — Markala (markala.com.tr) yasal belgesi. Son güncelleme: ${page.lastUpdated}.`,
    alternates: { canonical: url },
    openGraph: {
      type: "article",
      title: `${page.title} | Markala`,
      description: `${page.title} — yasal sözleşme metni.`,
      url,
    },
    robots: { index: true, follow: true },
  };
}

const slugIcons: Record<string, typeof FileText> = {
  kvkk: Shield,
  "mesafeli-satis": FileText,
  "on-bilgilendirme": ListBullets,
  cerez: Cookie,
  gizlilik: Shield,
  "kullanim-kosullari": Notebook,
};

export default function LegalPage({ params }: Props) {
  const page = getLegalPage(params.slug);
  if (!page) notFound();

  const Icon = slugIcons[params.slug] ?? FileText;
  const allLegal = Object.values(legalPages);

  return (
    <>
      {/* Page header */}
      <div className="bg-paper-100 border-b border-paper-200">
        <Container className="py-10 md:py-12 max-w-5xl">
          <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-sm text-ink-500 mb-5">
            <Link href="/" className="hover:text-ink-900 transition-colors">Anasayfa</Link>
            <CaretRight size={12} />
            <span className="text-ink-900 font-medium">Yasal</span>
            <CaretRight size={12} />
            <span className="text-ink-900 font-medium">{page.title}</span>
          </nav>

          <div className="flex items-start gap-5">
            <div className="flex-none w-14 h-14 rounded-xl bg-brand-100 text-brand-700 grid place-items-center">
              <Icon size={26} weight="regular" />
            </div>
            <div>
              <p className="text-sm text-brand-700 font-semibold uppercase tracking-wider">Yasal</p>
              <h1 className="mt-1 text-3xl md:text-4xl font-semibold text-ink-900">{page.title}</h1>
              <p className="mt-2 text-sm text-ink-500">Son güncelleme: {formatDate(page.lastUpdated)}</p>
            </div>
          </div>
        </Container>
      </div>

      <Container className="py-12 md:py-16 max-w-5xl">
        <div className="grid lg:grid-cols-12 gap-10">
          {/* Sidebar — diğer yasal sayfalar */}
          <aside className="lg:col-span-3">
            <nav className="lg:sticky lg:top-24 p-4 bg-paper-50 border border-paper-200 rounded-xl">
              <h2 className="text-xs uppercase tracking-wider text-ink-500 font-semibold mb-3 px-2">
                Yasal Sayfalar
              </h2>
              <ul className="space-y-0.5">
                {allLegal.map((p) => {
                  const isActive = p.slug === page.slug;
                  return (
                    <li key={p.slug}>
                      <Link
                        href={`/yasal/${p.slug}`}
                        className={`block px-3 py-2 rounded-md text-sm transition-colors ${
                          isActive
                            ? "bg-ink-900 text-paper-50 font-medium"
                            : "text-ink-700 hover:bg-paper-100"
                        }`}
                      >
                        {p.title}
                      </Link>
                    </li>
                  );
                })}
              </ul>

              <div className="mt-5 pt-5 border-t border-paper-200">
                <p className="text-xs text-ink-500 px-2">
                  Sorularınız için{" "}
                  <Link href="/iletisim" className="text-brand-700 hover:underline font-medium">
                    iletişim
                  </Link>
                </p>
              </div>
            </nav>
          </aside>

          {/* Content */}
          <article className="lg:col-span-9 max-w-3xl">
            <div
              className="legal-content"
              dangerouslySetInnerHTML={{ __html: page.body }}
            />
          </article>
        </div>
      </Container>
    </>
  );
}
