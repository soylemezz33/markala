import Link from "next/link";
import Image from "next/image";
import type { Metadata } from "next";
import { Container } from "@markala/ui";
import { ArrowRight, Clock, Tag as TagIcon } from "@phosphor-icons/react/dist/ssr";
import { getBlogCategories, getBlogPosts, blogCoverSrc } from "@/lib/blog";
import { NewsletterForm } from "@/components/newsletter-form";

export const metadata: Metadata = {
  title: "Markala Blog — Matbaa, Tasarım & Marka Rehberleri",
  description:
    "Kartvizit tasarımdan kurumsal kimliğe, baskı tekniklerinden CMYK-RGB renk yönetimine kadar matbaa & reklam sektörünün rehber içerikleri.",
  alternates: { canonical: "/blog" },
  openGraph: {
    type: "website",
    title: "Markala Blog — Matbaa & Tasarım Rehberleri",
    description: "Profesyonel matbaa içerikleri, tasarım ipuçları ve sektör analizleri.",
    url: "/blog",
    images: [{ url: "/og-default.png", width: 1200, height: 630, alt: "Markala Blog" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Markala Blog — Matbaa & Tasarım Rehberleri",
    description: "Profesyonel matbaa içerikleri, tasarım ipuçları ve sektör analizleri.",
    images: ["/og-default.png"],
  },
};

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("tr-TR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

export default async function BlogPage() {
  const [blogPosts, blogCategories] = await Promise.all([getBlogPosts(), getBlogCategories()]);
  const featured = blogPosts[0];
  const rest = blogPosts.slice(1);

  return (
    <>
      <div className="bg-paper-100 border-b border-paper-200">
        <Container className="py-12 md:py-16 max-w-3xl text-center">
          <p className="text-sm text-brand-700 font-semibold uppercase tracking-wider">Markala Blog</p>
          <h1 className="mt-2 text-3xl md:text-5xl font-semibold text-ink-900 leading-tight">
            Matbaa, tasarım, marka stratejisi
          </h1>
          <p className="mt-4 text-lg text-ink-700 max-w-xl mx-auto">
            324 Ajans deneyiminden uzman içerikler — sektörü doğru anlayın, doğru kararlar alın.
          </p>
        </Container>
      </div>

      <Container className="py-12 md:py-16">
        {blogPosts.length === 0 ? (
          <div className="py-20 text-center bg-paper-50 border border-paper-200 rounded-xl max-w-xl mx-auto">
            <div className="w-16 h-16 mx-auto rounded-full bg-paper-100 grid place-items-center text-ink-400">
              <ArrowRight size={28} />
            </div>
            <h2 className="mt-4 text-xl font-semibold text-ink-900">Henüz yazı yok</h2>
            <p className="mt-2 text-sm text-ink-500 max-w-sm mx-auto">
              Blog yazıları yakında yayınlanacak. Bu arada ürünlerimizi inceleyebilirsiniz.
            </p>
            <Link
              href="/urunler"
              className="mt-5 inline-flex items-center gap-2 px-5 py-2.5 bg-brand-500 hover:bg-brand-600 text-ink-900 rounded-md text-sm font-semibold"
            >
              Ürünlere Göz At <ArrowRight size={14} weight="bold" />
            </Link>
          </div>
        ) : (
          <>
        {/* Kategori filtresi — yalnız kategoriler varsa göster */}
        {blogCategories.length > 0 && (
          <div className="flex flex-wrap items-center gap-2 mb-10">
            <span className="text-xs text-ink-500 mr-1">Kategoriler:</span>
            <Link
              href="/blog"
              className="px-3 py-1.5 rounded-full text-xs font-medium bg-ink-900 text-paper-50"
            >
              Tümü
            </Link>
            {blogCategories.map((c) => (
              <Link
                key={c.slug}
                href={`/blog/kategori/${c.slug}`}
                className="px-3 py-1.5 rounded-full text-xs font-medium bg-paper-100 text-ink-700 hover:bg-paper-200"
              >
                {c.name}
              </Link>
            ))}
          </div>
        )}

        {/* Featured */}
        {featured && (
          <Link
            href={`/blog/${featured.slug}`}
            className="group block mb-12 grid md:grid-cols-2 gap-6 items-center"
          >
            <div className="relative aspect-[16/10] rounded-xl overflow-hidden bg-paper-100">
              <Image
                src={blogCoverSrc(featured.coverTheme, 1000, 625)}
                alt={featured.title}
                fill unoptimized
                className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                sizes="(min-width:768px) 50vw, 100vw"
              />
              <span className="absolute top-3 left-3 px-2.5 py-1 bg-brand-500 text-ink-900 text-[11px] font-bold rounded-full uppercase">
                Öne Çıkan
              </span>
            </div>
            <div>
              <span className="text-xs font-semibold text-brand-700 uppercase tracking-wide">
                {blogCategories.find((c) => c.slug === featured.categorySlug)?.name}
              </span>
              <h2 className="mt-2 text-2xl md:text-3xl font-semibold text-ink-900 leading-tight group-hover:text-brand-700 transition-colors">
                {featured.title}
              </h2>
              <p className="mt-3 text-ink-700 leading-relaxed">{featured.excerpt}</p>
              <div className="mt-4 flex items-center gap-4 text-xs text-ink-500">
                <span>{formatDate(featured.publishedAt)}</span>
                <span className="flex items-center gap-1">
                  <Clock size={12} /> {featured.readingMinutes} dk okuma
                </span>
                <span>{featured.authorName}</span>
              </div>
              <span className="mt-5 inline-flex items-center gap-1.5 text-sm font-semibold text-ink-900 group-hover:gap-2.5 transition-all">
                Devamını oku <ArrowRight size={14} weight="bold" />
              </span>
            </div>
          </Link>
        )}

        {/* Liste */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {rest.map((p) => (
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
                <span className="text-[11px] font-semibold text-brand-700 uppercase tracking-wide">
                  {blogCategories.find((c) => c.slug === p.categorySlug)?.name}
                </span>
                <h3 className="mt-2 font-semibold text-ink-900 leading-snug group-hover:text-brand-700 transition-colors">
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
              </div>
            </Link>
          ))}
        </div>

        {/* Newsletter CTA */}
        <section className="mt-16 p-8 md:p-12 bg-ink-900 text-paper-50 rounded-2xl text-center">
          <TagIcon size={28} weight="fill" className="text-brand-400 mx-auto" />
          <h2 className="mt-4 text-2xl md:text-3xl font-semibold">
            Sektör güncellerini kaçırmayın
          </h2>
          <p className="mt-3 text-paper-100/70 max-w-xl mx-auto">
            Ayda 2 e-posta. Yeni rehberler, sektör analizleri ve aboneye özel %10 indirim.
          </p>
          <NewsletterForm source="blog-newsletter" />
        </section>
          </>
        )}
      </Container>
    </>
  );
}
