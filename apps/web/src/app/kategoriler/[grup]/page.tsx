import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { Container } from "@markala/ui";
import { ArrowRight, CaretRight } from "@phosphor-icons/react/dist/ssr";
import { getProducts, getCategories } from "@/lib/catalog";
import { formatPriceDisplay } from "@/lib/format";
import { PRODUCT_GROUPS, getProductGroup } from "@/lib/product-groups";
import { BreadcrumbJsonLd, CategoryJsonLd } from "@/components/seo/json-ld";
import { ProductRail } from "@/components/home/product-rail";
import { KARGO_SURESI, URETIM_SURESI } from "@/lib/delivery";

/**
 * Ürün grubu hub sayfası (2026-09-01 SEO denetimi, B seçeneği).
 *
 * Anasayfadaki 8 kategori kutusunun indekslenebilir hedefi. Öncesinde kutular
 * `/urunler?kategoriler=…` filtre adreslerine gidiyordu; hepsi `/urunler`'e canonical
 * verdiği için ilk ekranın bağlantı gücü hiçbir yere ulaşmıyordu. Grup adları
 * ("matbaa", "dijital baskı", "iş güvenliği levhaları") aranan terimler olduğu hâlde
 * hiçbirinin sayfası yoktu — bu rota o boşluğu dolduruyor.
 *
 * ISR: katalogla aynı pencere. Kategori adı/görseli/fiyatı DB'den geldiği için sabit
 * prerender yetmez; 300 sn'de bir tazelenir.
 */
export const revalidate = 300;

/**
 * dynamicParams=false → listede olmayan slug ROUTER seviyesinde gerçek 404 döner
 * (2026-09-02). Aksi hâlde /kategoriler/olmayan-grup, sayfa bileşeni notFound() çağırsa
 * bile HTTP 200 + not-found gövdesi dönüyordu: ISR ile talep anında render edilen yollarda
 * Next 14 statüyü 404'e çevirmiyor. Google bunu "soft 404" sayar.
 *
 * BURADA GÜVENLİ, ÜRÜN/KATEGORİ ROTALARINDA DEĞİL: gruplar kod tarafında sabit bir liste
 * (PRODUCT_GROUPS), yani "yeni grup eklendi ama build alınmadı" durumu mümkün değil.
 * /urun/[slug] ve /kategori/[slug] verisini DB'den aldığı için aynı satır oraya konulamaz —
 * yeni eklenen ürün bir sonraki build'e kadar 404 olurdu. Aynı desen /matbaa/[city]'de var.
 */
export const dynamicParams = false;

/** 7 grup da build'de üretilir — sayı sabit ve küçük, dinamik bırakmanın anlamı yok. */
export function generateStaticParams() {
  return PRODUCT_GROUPS.map((g) => ({ grup: g.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: { grup: string };
}): Promise<Metadata> {
  const grup = getProductGroup(params.grup);
  if (!grup) return {};
  const url = `/kategoriler/${grup.slug}`;
  return {
    // absolute: kök layout'un "%s · Markala" şablonu bu alt ağaçta geçerli değil
    // (/kategoriler/layout.tsx düz string title verdiği için zincir kopuyor), o yüzden
    // marka soneki elle ekleniyor — sitenin geri kalanıyla tutarlı kalsın diye.
    title: { absolute: `${grup.title} · Markala` },
    description: grup.description,
    alternates: { canonical: url },
    openGraph: {
      type: "website",
      locale: "tr_TR",
      siteName: "Markala",
      url,
      title: `${grup.title} · Markala`,
      description: grup.description,
      images: [{ url: "/og-default.png", width: 1200, height: 630, alt: grup.label }],
    },
    twitter: {
      card: "summary_large_image",
      title: `${grup.title} · Markala`,
      description: grup.description,
      images: ["/og-default.png"],
    },
  };
}

export default async function ProductGroupPage({ params }: { params: { grup: string } }) {
  const grup = getProductGroup(params.grup);
  if (!grup) notFound();

  const [products, categories] = await Promise.all([getProducts(), getCategories()]);

  // Gruba giren kategoriler — categorySlugs'taki SIRAYLA. DB'de olmayan slug sessizce
  // düşer (kategori silinirse sayfa boş kutu göstermez, kendini toparlar).
  const grupKategorileri = grup.categorySlugs
    .map((slug) => categories.find((c) => c.slug === slug))
    .filter((c): c is NonNullable<typeof c> => Boolean(c));

  // Kategorisi hiç kalmadıysa sayfayı hiç açma — boş hub indekslenmemeli.
  if (grupKategorileri.length === 0) notFound();

  const kategoriSlugSet = new Set(grupKategorileri.map((c) => c.slug));
  const grupUrunleri = products.filter((p) => kategoriSlugSet.has(p.categorySlug));

  /**
   * Raf ürünleri — RSC yükünü şişirmemek için ProductCard'ın gerçekten kullandığı
   * alanlara indirgenir (anasayfadaki slimForCard ile aynı gerekçe: karta giden her alan
   * sayfa HTML'ine hydration verisi olarak İKİNCİ kez gömülür).
   */
  const rafUrunleri = [...grupUrunleri]
    .filter((p) => (p.images?.length ?? 0) > 0)
    .sort((a, b) => Number(b.bestseller ?? false) - Number(a.bestseller ?? false))
    .slice(0, 12)
    .map((p) => ({
      slug: p.slug,
      name: p.name,
      categorySlug: p.categorySlug,
      shortDescription: "",
      description: "",
      basePrice: p.basePrice,
      startingPrice: p.startingPrice,
      productionTime: p.productionTime,
      sizeLabel: p.sizeLabel,
      images: p.images.slice(0, 2),
      badges: p.badges,
      displayPrice: p.displayPrice,
      pricingMode: p.pricingMode,
      rating: p.rating,
      bestseller: p.bestseller,
    }));

  const breadcrumbs = [
    { name: "Ana Sayfa", href: "/" },
    { name: "Kategoriler", href: "/kategoriler" },
    { name: grup.label, href: `/kategoriler/${grup.slug}` },
  ];

  return (
    <>
      <BreadcrumbJsonLd items={breadcrumbs} />
      {/* CollectionPage + ItemList: mevcut kategori şemasını yeniden kullanıyoruz.
          Grubu tek bir "sanal kategori" gibi tanımlar — ayrı bir tip yazmaya değmez. */}
      <CategoryJsonLd
        category={{
          slug: `kategoriler/${grup.slug}`,
          name: grup.label,
          shortDescription: grup.description,
          longDescription: grup.intro,
          imageUrl: grupKategorileri[0]?.imageUrl ?? "",
          startingPrice: 0,
          productionTime: "",
          productCount: grupUrunleri.length,
        }}
        products={grupUrunleri}
      />

      <div className="bg-paper-100 border-b border-paper-200">
        <Container className="py-2.5">
          <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-xs text-ink-500">
            <Link href="/" className="hover:text-ink-900 transition-colors">
              Ana Sayfa
            </Link>
            <CaretRight size={11} aria-hidden="true" />
            <Link href="/kategoriler" className="hover:text-ink-900 transition-colors">
              Kategoriler
            </Link>
            <CaretRight size={11} aria-hidden="true" />
            <span className="text-ink-900 font-medium">{grup.label}</span>
          </nav>
        </Container>

        <Container className="pb-12 pt-6 md:pb-16 md:pt-8 max-w-3xl">
          <h1 className="text-3xl md:text-5xl font-semibold text-ink-900 leading-tight">
            {grup.h1}
          </h1>
          <p className="mt-4 text-lg text-ink-700 leading-relaxed">{grup.intro}</p>
          <p className="mt-4 text-sm text-ink-500">
            {grupKategorileri.length} kategori · {grupUrunleri.length} ürün ·{" "}
            {URETIM_SURESI} üretim · 81 ile kargo {KARGO_SURESI}
          </p>
        </Container>
      </div>

      <Container className="py-12 md:py-16">
        <h2 className="sr-only">{grup.label} kategorileri</h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-5">
          {grupKategorileri.map((cat) => {
            const urunSayisi = products.filter((p) => p.categorySlug === cat.slug).length;
            return (
              <Link
                key={cat.slug}
                href={`/kategori/${cat.slug}`}
                className="group flex flex-col rounded-xl overflow-hidden bg-paper-50 border border-paper-200 hover:border-ink-300 hover:shadow-md transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink-900 focus-visible:ring-offset-2"
              >
                {cat.imageUrl && (
                  <div className="relative aspect-[4/3] overflow-hidden bg-paper-100">
                    <Image
                      src={cat.imageUrl}
                      alt={cat.name}
                      fill
                      sizes="(min-width:1280px) 25vw, (min-width:640px) 33vw, 50vw"
                      className="object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-ink-900/50 via-transparent to-transparent" />
                    <div className="absolute top-3 left-3">
                      <span className="px-2 py-0.5 rounded bg-paper-50/90 text-ink-900 text-[11px] font-semibold">
                        {urunSayisi} ürün
                      </span>
                    </div>
                  </div>
                )}
                <div className="p-4 flex-1 flex flex-col">
                  <h3 className="font-semibold text-ink-900 group-hover:text-brand-700 transition-colors">
                    {cat.name}
                  </h3>
                  <p className="mt-1 text-sm text-ink-500 line-clamp-2">
                    {cat.shortDescription}
                  </p>
                  <div className="mt-3 pt-3 border-t border-paper-200 flex items-baseline justify-between text-sm">
                    <span className="text-ink-700">
                      <span className="font-semibold text-ink-900 tabular-nums">
                        {formatPriceDisplay(cat.startingPrice)}
                      </span>
                      {cat.startingPrice > 0 && (
                        <span className="text-xs text-ink-500 ml-1">&#39;den</span>
                      )}
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

      {/* GRUPTAN ÖNE ÇIKAN ÜRÜNLER (2026-09-02): hub'lar açıldığında yalnız giriş metni +
          kategori ızgarasından ibaretti. Kullanıcı "matbaa" arayıp buraya düştüğünde tek bir
          ürün göremiyor, tekrar tıklamak zorunda kalıyordu; Google açısından da ürünsüz bir
          ara sayfa ince içerik. Raf, gruba giren GERÇEK ürünlerden beslenir.

          SIRALAMA: önce bestseller'lar (getProducts ciro sırasını taşır), sonra kalanlar.
          GÖRSELSİZ ÜRÜN GİRMEZ — anasayfadaki "Katalogdaki yenilikler" rafında alınan
          kararın (0b4edfc) aynısı: boş kutu ilk izlenimi bozuyor. */}
      {rafUrunleri.length > 0 && (
        <ProductRail
          eyebrow={grup.label}
          title="Bu gruptan öne çıkanlar"
          description={`${grup.label} kategorilerinde en çok tercih edilen ürünler.`}
          products={rafUrunleri}
          viewAllHref={`/kategori/${grupKategorileri[0]!.slug}`}
          viewAllLabel={`${grupKategorileri[0]!.name} ürünlerini gör`}
        />
      )}

      <Container className="pb-12 md:pb-16">
        {/* Diğer gruplara yatay bağlantı — hub'lar birbirini besler, aksi hâlde her biri
            yalnız anasayfadan tek link alan yaprak sayfa olurdu. */}
        <div className="mt-14 pt-8 border-t border-paper-200">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-ink-500">
            Diğer ürün grupları
          </h2>
          <ul className="mt-3 flex flex-wrap gap-2">
            {PRODUCT_GROUPS.filter((g) => g.slug !== grup.slug).map((g) => (
              <li key={g.slug}>
                <Link
                  href={`/kategoriler/${g.slug}`}
                  className="inline-block px-3 py-1.5 rounded-full border border-paper-200 bg-paper-50 text-sm text-ink-700 hover:border-ink-300 hover:text-ink-900 transition-colors"
                >
                  {g.label}
                </Link>
              </li>
            ))}
            <li>
              <Link
                href="/kategoriler"
                className="inline-block px-3 py-1.5 rounded-full border border-paper-200 bg-paper-50 text-sm font-medium text-brand-700 hover:border-brand-400 transition-colors"
              >
                Tüm kategoriler →
              </Link>
            </li>
          </ul>
        </div>
      </Container>
    </>
  );
}
