import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { Container } from "@markala/ui";
import { ArrowLeft, ArrowRight, Clock } from "@phosphor-icons/react/dist/ssr";
import {
  getBlogCategories,
  getBlogCategoryBySlug,
  getBlogPostsByCategory,
  blogCoverSrc,
} from "@/lib/blog";

interface Props {
  params: { slug: string };
}

export async function generateStaticParams() {
  const blogCategories = await getBlogCategories();
  return blogCategories.map((c) => ({ slug: c.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const cat = await getBlogCategoryBySlug(params.slug);
  if (!cat) return { title: "Kategori bulunamadı" };
  return {
    // Layout template "%s · Markala" uygulanır; suffix'i tekrarlamamak için "— Markala" dahil etme.
    title: `${cat.name} — Blog`,
    description: cat.description,
    alternates: { canonical: `/blog/kategori/${cat.slug}` },
    openGraph: {
      type: "website",
      title: `${cat.name} — Markala Blog`,
      description: cat.description,
      url: `/blog/kategori/${cat.slug}`,
      images: [{ url: "/og-default.png", width: 1200, height: 630, alt: cat.name }],
    },
    twitter: {
      card: "summary_large_image",
      title: `${cat.name} — Markala Blog`,
      description: cat.description,
      images: ["/og-default.png"],
    },
  };
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("tr-TR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

export default async function BlogCategoryPage({ params }: Props) {
  const cat = await getBlogCategoryBySlug(params.slug);
  if (!cat) notFound();
  const posts = await getBlogPostsByCategory(cat.slug);

  return (
    <>
      <div className="bg-paper-100 border-b border-paper-200">
        <Container className="py-12 md:py-16 max-w-3xl">
          <Link
            href="/blog"
            className="inline-flex items-center gap-1.5 text-sm text-ink-500 hover:text-ink-900 mb-6"
          >
            <ArrowLeft size={14} /> Tüm yazılar
          </Link>
          <p className="text-sm text-brand-700 font-semibold uppercase tracking-wider">Kategori</p>
          <h1 className="mt-2 text-3xl md:text-5xl font-semibold text-ink-900 leading-tight">
            {cat.name}
          </h1>
          <p className="mt-4 text-lg text-ink-700">{cat.description}</p>
        </Container>
      </div>

      <Container className="py-12 md:py-16">
        {posts.length === 0 ? (
          <div className="text-center text-ink-500 py-12">
            Bu kategoride henüz yazı yok.
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {posts.map((p) => (
              <Link
                key={p.slug}
                href={`/blog/${p.slug}`}
                className="group flex flex-col rounded-xl overflow-hidden bg-paper-50 border border-paper-200 hover:border-ink-300 hover:shadow-md transition-all"
              >
                <div className="relative aspect-[16/10] bg-paper-100 overflow-hidden">
                  <Image
                    src={blogCoverSrc(p.coverTheme, 600, 375)}
                    alt={p.title}
                    fill unoptimized
                    sizes="(min-width:1024px) 33vw, (min-width:768px) 50vw, 100vw"
                    className="object-cover transition-transform duration-500 group-hover:scale-[1.04]"
                  />
                </div>
                <div className="p-5 flex flex-col flex-1">
                  <h3 className="font-semibold text-ink-900 leading-snug group-hover:text-brand-700 transition-colors">
                    {p.title}
                  </h3>
                  <p className="mt-2 text-sm text-ink-700 line-clamp-2">{p.excerpt}</p>
                  <div className="mt-auto pt-4 flex items-center gap-3 text-[11px] text-ink-500">
                    <span>{formatDate(p.publishedAt)}</span>
                    <span>·</span>
                    <span className="flex items-center gap-1">
                      <Clock size={11} /> {p.readingMinutes} dk
                    </span>
                  </div>
                  <span className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-brand-700 group-hover:gap-2 transition-all">
                    Devamını oku <ArrowRight size={11} weight="bold" />
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </Container>
    </>
  );
}
