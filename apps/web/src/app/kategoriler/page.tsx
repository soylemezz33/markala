import Link from "next/link";
import Image from "next/image";
import type { Metadata } from "next";
import { Container } from "@markala/ui";
import { ArrowRight } from "@phosphor-icons/react/dist/ssr";
import { categories } from "@markala/mock-data";
import { getProducts } from "@/lib/catalog";

export const metadata: Metadata = {
  title: "Tüm Kategoriler — Matbaa & Reklam Ürünleri",
  description:
    "Markala kataloğundaki 20+ kategori: kartvizit, broşür, afiş, branda, kupa, etiket, antetli kağıt, zarf, magnet, çanta. Her kategoride detaylı ürün seçenekleri.",
  alternates: { canonical: "/kategoriler" },
  openGraph: {
    type: "website",
    title: "Tüm Matbaa & Reklam Ürün Kategorileri — Markala",
    description: "20+ kategori: kartvizit, broşür, afiş, branda, kupa, etiket ve daha fazlası.",
    url: "/kategoriler",
    images: [{ url: "/api/mockup?theme=brand&w=1200&h=630", width: 1200, height: 630, alt: "Markala Kategoriler" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Tüm Matbaa & Reklam Ürün Kategorileri — Markala",
    description: "20+ kategori: kartvizit, broşür, afiş, branda, kupa, etiket ve daha fazlası.",
    images: ["/api/mockup?theme=brand&w=1200&h=630"],
  },
};

export default async function CategoriesPage() {
  const products = await getProducts();

  // Kategoriyi popülerliğe göre sırala (ürün sayısı)
  const sorted = [...categories].sort((a, b) => {
    const aCount = products.filter((p) => p.categorySlug === a.slug).length;
    const bCount = products.filter((p) => p.categorySlug === b.slug).length;
    return bCount - aCount;
  });

  return (
    <>
      <div className="bg-paper-100 border-b border-paper-200">
        <Container className="py-12 md:py-16 max-w-3xl">
          <p className="text-sm text-brand-700 font-semibold uppercase tracking-wider">
            Kategoriler
          </p>
          <h1 className="mt-2 text-3xl md:text-5xl font-semibold text-ink-900 leading-tight">
            Tüm matbaa & reklam ürün kategorileri
          </h1>
          <p className="mt-4 text-lg text-ink-700">
            Kartvizitten branda afişe, kupadan etiket çıkartmaya — 20'den fazla
            kategori. Her birinde paket, ebat ve adet seçenekleri.
          </p>
        </Container>
      </div>

      <Container className="py-12 md:py-16">
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-5">
          {sorted.map((cat) => {
            const productCount = products.filter(
              (p) => p.categorySlug === cat.slug,
            ).length;
            return (
              <Link
                key={cat.slug}
                href={`/kategori/${cat.slug}`}
                className="group flex flex-col rounded-xl overflow-hidden bg-paper-50 border border-paper-200 hover:border-ink-300 hover:shadow-md transition-all"
              >
                <div className="relative aspect-[4/3] overflow-hidden bg-paper-100">
                  <Image
                    src={cat.imageUrl}
                    alt={cat.name}
                    fill
                    unoptimized
                    sizes="(min-width:1280px) 25vw, (min-width:640px) 33vw, 50vw"
                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-ink-900/50 via-transparent to-transparent" />
                  <div className="absolute top-3 left-3">
                    <span className="px-2 py-0.5 rounded bg-paper-50/90 text-ink-900 text-[11px] font-semibold">
                      {productCount} ürün
                    </span>
                  </div>
                </div>
                <div className="p-4 flex-1 flex flex-col">
                  <h2 className="font-semibold text-ink-900 group-hover:text-brand-700 transition-colors">
                    {cat.name}
                  </h2>
                  <p className="mt-1 text-sm text-ink-500 line-clamp-2">
                    {cat.shortDescription}
                  </p>
                  <div className="mt-3 pt-3 border-t border-paper-200 flex items-baseline justify-between text-sm">
                    <span className="text-ink-700">
                      <span className="font-semibold text-ink-900 tabular-nums">
                        {cat.startingPrice.toLocaleString("tr-TR")} ₺
                      </span>
                      <span className="text-xs text-ink-500 ml-1">'den</span>
                    </span>
                    <span className="text-xs text-brand-700 font-medium opacity-0 group-hover:opacity-100 transition-opacity inline-flex items-center gap-1">
                      İncele <ArrowRight size={11} weight="bold" />
                    </span>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </Container>
    </>
  );
}
