import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { Container } from "@markala/ui";
import { ArrowLeft, Clock, ArrowRight, ShareNetwork } from "@phosphor-icons/react/dist/ssr";
import {
  getBlogPosts,
  getBlogCategories,
  getBlogPostBySlug,
  getRelatedPosts,
  blogCoverSrc,
} from "@/lib/blog";
import { BreadcrumbJsonLd } from "@/components/seo/json-ld";

const SITE = "https://markala.com.tr";

/**
 * Blog yazısı og:image — gerçek raster URL varsa onu döner; /api/mockup SVG ise
 * /og-default.png'e düşer (sosyal crawler'lar SVG'yi reddeder).
 * coverTheme genellikle /api/mockup?theme=card&... şeklinde SVG endpoint'tir.
 */
function blogOgImage(coverTheme: string): string {
  if (
    coverTheme &&
    !coverTheme.includes("/api/mockup") &&
    (coverTheme.startsWith("http") || coverTheme.startsWith("/"))
  ) {
    return coverTheme;
  }
  return "/og-default.png";
}

interface Props {
  params: { slug: string };
}

export async function generateStaticParams() {
  const blogPosts = await getBlogPosts();
  return blogPosts.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const post = await getBlogPostBySlug(params.slug);
  if (!post) return { title: "Yazı bulunamadı" };

  return {
    title: post.seoTitle ?? post.title,
    description: post.seoDescription ?? post.excerpt,
    alternates: { canonical: `/blog/${post.slug}` },
    openGraph: {
      type: "article",
      title: post.title,
      description: post.excerpt,
      publishedTime: post.publishedAt,
      authors: [post.authorName],
      tags: post.tags,
      url: `/blog/${post.slug}`,
      // og:image: gerçek raster görsel (http/https veya /uploads/...) varsa onu kullan;
      // /api/mockup SVG ise /og-default.png'e düş — sosyal crawler'lar SVG'yi reddeder.
      // TODO(SEO): raster og:image varsayılanı gerekir (mockup SVG sosyal crawler'larda render olmaz)
      //   — blog yazısına özel kapak görseli eklenince buraya bağla; /og-default.png geçici.
      images: [{ url: blogOgImage(post.coverTheme), width: 1200, height: 630, alt: post.title }],
    },
    twitter: {
      card: "summary_large_image",
      title: post.title,
      description: post.excerpt,
      images: [blogOgImage(post.coverTheme)],
    },
  };
}

/** Çok basit markdown→HTML — tam markdown lib yerine inline. Üretim için mdx önerilir. */
function renderMarkdown(md: string): string {
  let html = md;

  // ## başlıklar
  html = html.replace(/^### (.+)$/gm, '<h3>$1</h3>');
  html = html.replace(/^## (.+)$/gm, '<h2>$1</h2>');
  html = html.replace(/^# (.+)$/gm, '<h1>$1</h1>');

  // > blockquote
  html = html.replace(/^> (.+)$/gm, '<blockquote>$1</blockquote>');

  // **bold** ve *italic*
  html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
  html = html.replace(/(?<!\*)\*(?!\*)(.+?)(?<!\*)\*(?!\*)/g, '<em>$1</em>');

  // [text](url)
  html = html.replace(
    /\[([^\]]+)\]\(([^)]+)\)/g,
    '<a href="$2" class="text-brand-700 hover:underline">$1</a>',
  );

  // `code`
  html = html.replace(/`([^`]+)`/g, '<code>$1</code>');

  // tablolar (basit)
  html = html.replace(/((?:^\|.+\|$\n?)+)/gm, (match) => {
    const lines = match.trim().split("\n");
    if (lines.length < 2) return match;
    const headerCells = lines[0]!.split("|").slice(1, -1).map((c) => c.trim());
    const bodyLines = lines.slice(2);
    const head = `<thead><tr>${headerCells.map((c) => `<th>${c}</th>`).join("")}</tr></thead>`;
    const body =
      "<tbody>" +
      bodyLines
        .map((l) => {
          const cells = l.split("|").slice(1, -1).map((c) => c.trim());
          return `<tr>${cells.map((c) => `<td>${c}</td>`).join("")}</tr>`;
        })
        .join("") +
      "</tbody>";
    return `<table>${head}${body}</table>`;
  });

  // - liste
  html = html.replace(/((?:^- .+$\n?)+)/gm, (match) => {
    const items = match
      .trim()
      .split("\n")
      .map((l) => `<li>${l.replace(/^- /, "")}</li>`)
      .join("");
    return `<ul>${items}</ul>`;
  });

  // - [ ] checkbox listeleri
  html = html.replace(/<li>\[ \] (.+?)<\/li>/g, '<li class="checkbox">☐ $1</li>');
  html = html.replace(/<li>\[x\] (.+?)<\/li>/g, '<li class="checkbox">☑ $1</li>');

  // paragraflar (boş satır sonrası gelen düz metin)
  html = html
    .split(/\n\n+/)
    .map((block) => {
      const trimmed = block.trim();
      if (
        !trimmed ||
        trimmed.startsWith("<h") ||
        trimmed.startsWith("<table") ||
        trimmed.startsWith("<ul") ||
        trimmed.startsWith("<blockquote")
      ) {
        return trimmed;
      }
      return `<p>${trimmed.replace(/\n/g, "<br>")}</p>`;
    })
    .join("\n\n");

  return html;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("tr-TR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

export default async function BlogPostPage({ params }: Props) {
  const post = await getBlogPostBySlug(params.slug);
  if (!post) notFound();

  const [blogCategories, related] = await Promise.all([
    getBlogCategories(),
    getRelatedPosts(post.slug, 3),
  ]);
  const category = blogCategories.find((c) => c.slug === post.categorySlug);
  const html = renderMarkdown(post.content);

  const articleSchema = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    "@id": `${SITE}/blog/${post.slug}#article`,
    headline: post.title,
    description: post.excerpt,
    datePublished: post.publishedAt,
    dateModified: post.publishedAt,
    author: {
      "@type": "Person",
      name: post.authorName,
      jobTitle: post.authorRole,
    },
    publisher: {
      "@type": "Organization",
      name: "Markala",
      logo: {
        "@type": "ImageObject",
        url: `${SITE}/api/mockup?theme=ink&w=512&h=512`,
      },
    },
    image: blogCoverSrc(post.coverTheme, 1200, 630).startsWith("http")
      ? blogCoverSrc(post.coverTheme, 1200, 630)
      : `${SITE}${blogCoverSrc(post.coverTheme, 1200, 630)}`,
    mainEntityOfPage: { "@type": "WebPage", "@id": `${SITE}/blog/${post.slug}` },
    keywords: post.tags.join(", "),
    articleSection: category?.name,
    wordCount: post.content.split(/\s+/).length,
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleSchema) }}
      />
      <BreadcrumbJsonLd
        items={[
          { name: "Anasayfa", href: "/" },
          { name: "Blog", href: "/blog" },
          { name: post.title, href: `/blog/${post.slug}` },
        ]}
      />

      <article>
        {/* Hero */}
        <div className="bg-paper-100 border-b border-paper-200">
          <Container className="py-10 md:py-14 max-w-3xl">
            <Link
              href="/blog"
              className="inline-flex items-center gap-1.5 text-sm text-ink-500 hover:text-ink-900 mb-6"
            >
              <ArrowLeft size={14} /> Tüm yazılar
            </Link>

            {category && (
              <Link
                href={`/blog/kategori/${category.slug}`}
                className="text-xs font-semibold text-brand-700 uppercase tracking-wide hover:underline"
              >
                {category.name}
              </Link>
            )}
            <h1 className="mt-2 text-3xl md:text-5xl font-semibold text-ink-900 leading-tight">
              {post.title}
            </h1>
            <p className="mt-4 text-lg text-ink-700">{post.excerpt}</p>

            <div className="mt-6 flex flex-wrap items-center gap-4 text-sm text-ink-500">
              <div>
                <div className="font-medium text-ink-900">{post.authorName}</div>
                <div className="text-xs">{post.authorRole}</div>
              </div>
              <span className="text-ink-300">·</span>
              <span>{formatDate(post.publishedAt)}</span>
              <span className="text-ink-300">·</span>
              <span className="flex items-center gap-1">
                <Clock size={13} /> {post.readingMinutes} dk
              </span>
            </div>
          </Container>
        </div>

        {/* Cover */}
        <Container className="max-w-4xl pt-8 md:pt-12">
          <div className="relative aspect-[16/9] rounded-xl overflow-hidden bg-paper-100">
            <Image
              src={blogCoverSrc(post.coverTheme, 1200, 675)}
              alt={post.title}
              fill unoptimized
              priority
              className="object-cover"
              sizes="(min-width:1024px) 1024px, 100vw"
            />
          </div>
        </Container>

        {/* Content */}
        <Container className="max-w-2xl py-12 md:py-16">
          <div
            className="prose-blog"
            dangerouslySetInnerHTML={{ __html: html }}
          />

          {/* Tags */}
          {post.tags.length > 0 && (
            <div className="mt-10 pt-6 border-t border-paper-200 flex flex-wrap items-center gap-2">
              <span className="text-xs text-ink-500 mr-1">Etiketler:</span>
              {post.tags.map((t) => (
                <span
                  key={t}
                  className="px-2.5 py-1 rounded-full bg-paper-100 text-xs text-ink-700"
                >
                  {t}
                </span>
              ))}
            </div>
          )}

          {/* Author box */}
          <div className="mt-10 p-6 bg-paper-50 border border-paper-200 rounded-xl flex items-start gap-4">
            <div className="w-12 h-12 rounded-full bg-brand-500 text-ink-900 grid place-items-center font-bold text-lg">
              {post.authorName.split(" ").map((n) => n[0]).slice(0, 2).join("")}
            </div>
            <div>
              <div className="font-semibold text-ink-900">{post.authorName}</div>
              <div className="text-xs text-ink-500">{post.authorRole}</div>
              <p className="mt-2 text-sm text-ink-700">
                Bu yazıyla ilgili sorularınız için <Link href="/iletisim" className="text-brand-700 underline">bize ulaşın</Link>.
              </p>
            </div>
          </div>
        </Container>

        {/* Related */}
        {related.length > 0 && (
          <div className="bg-paper-100 border-t border-paper-200">
            <Container className="py-12 md:py-16">
              <h2 className="text-2xl font-semibold text-ink-900 mb-6">Benzer Yazılar</h2>
              <div className="grid md:grid-cols-3 gap-5">
                {related.map((p) => (
                  <Link
                    key={p.slug}
                    href={`/blog/${p.slug}`}
                    className="group flex flex-col rounded-xl overflow-hidden bg-paper-50 border border-paper-200 hover:shadow-md transition-all"
                  >
                    <div className="relative aspect-[16/10] bg-paper-200 overflow-hidden">
                      <Image
                        src={blogCoverSrc(p.coverTheme, 500, 312)}
                        alt={p.title}
                        fill unoptimized
                        sizes="(min-width:1024px) 25vw, 50vw"
                        className="object-cover transition-transform duration-500 group-hover:scale-[1.04]"
                      />
                    </div>
                    <div className="p-5">
                      <h3 className="font-semibold text-ink-900 leading-snug group-hover:text-brand-700 transition-colors line-clamp-2">
                        {p.title}
                      </h3>
                      <span className="mt-3 inline-flex items-center gap-1 text-xs text-brand-700 font-medium">
                        Oku <ArrowRight size={11} weight="bold" />
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            </Container>
          </div>
        )}
      </article>
    </>
  );
}
