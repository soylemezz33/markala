import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { Container } from "@markala/ui";
import {
  ArrowRight, MapPin, Truck, Lightning, ShieldCheck,
  Phone, WhatsappLogo, CheckCircle, Buildings, Storefront, CaretRight,
} from "@phosphor-icons/react/dist/ssr";
import {
  getCityBySlug, getDistrictBySlug, getAllDistrictParams,
} from "@/lib/cities";
import { getProducts } from "@/lib/catalog";
import { ProductCard } from "@/components/product-card";
import { BreadcrumbJsonLd } from "@/components/seo/json-ld";

const SITE = "https://markala.com.tr";

interface Props {
  params: { city: string; district: string };
}

export function generateStaticParams() {
  return getAllDistrictParams();
}

export function generateMetadata({ params }: Props): Metadata {
  const city = getCityBySlug(params.city);
  const district = getDistrictBySlug(params.city, params.district);
  if (!city || !district) return { title: "Bulunamadı" };

  // Layout "%s · Markala" template ekliyor — duplikasyon önle
  const title = `${district.name} ${city.name} Matbaa & Baskı — ${
    district.sameDayDelivery ? "Aynı Gün Motor Kurye" : "1 İş Günü Teslim"
  }`;

  return {
    title,
    description: district.intro.slice(0, 158),
    keywords: [
      `${district.name.toLowerCase()} matbaa`,
      `${district.name.toLowerCase()} baskı`,
      `${district.name.toLowerCase()} kartvizit`,
      `${district.name.toLowerCase()} ${city.name.toLowerCase()} matbaa`,
      `${district.name.toLowerCase()} broşür baskı`,
      ...district.neighborhoods.slice(0, 5).map((n) => n.toLowerCase()),
      "markala", "324 ajans",
    ],
    alternates: { canonical: `/matbaa/${city.slug}/${district.slug}` },
    openGraph: {
      type: "website",
      title: `${district.name} ${city.name} Matbaa — Markala`,
      description: district.intro.slice(0, 200),
      url: `/matbaa/${city.slug}/${district.slug}`,
    },
  };
}

export default async function DistrictLandingPage({ params }: Props) {
  const city = getCityBySlug(params.city);
  const district = getDistrictBySlug(params.city, params.district);
  if (!city || !district) notFound();

  const otherDistricts = city.districts?.filter((d) => d.slug !== district.slug) ?? [];
  const products = await getProducts();
  const featuredProducts = products.filter((p) => p.bestseller).slice(0, 4);

  return (
    <>
      <BreadcrumbJsonLd
        items={[
          { name: "Anasayfa", href: "/" },
          { name: "Matbaa Hizmetleri", href: "/matbaa" },
          { name: `${city.name} Matbaa`, href: `/matbaa/${city.slug}` },
          {
            name: `${district.name}`,
            href: `/matbaa/${city.slug}/${district.slug}`,
          },
        ]}
      />

      {/* Service schema */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Service",
            "@id": `${SITE}/matbaa/${city.slug}/${district.slug}#service`,
            serviceType: `${district.name} Matbaa Hizmeti`,
            name: `${district.name} ${city.name} Matbaa — Markala`,
            description: district.intro,
            provider: { "@id": `${SITE}/#localbusiness` },
            areaServed: {
              "@type": "AdministrativeArea",
              name: `${district.name}, ${city.name}`,
              containedInPlace: { "@type": "City", name: city.name },
            },
            availableChannel: {
              "@type": "ServiceChannel",
              servicePhone: "+90-324-433-3351",
              serviceUrl: `${SITE}/urunler`,
            },
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
          <Link href="/matbaa" className="hover:text-ink-900 whitespace-nowrap">
            Matbaa
          </Link>
          <CaretRight size={12} className="shrink-0" />
          <Link
            href={`/matbaa/${city.slug}`}
            className="hover:text-ink-900 whitespace-nowrap"
          >
            {city.name}
          </Link>
          <CaretRight size={12} className="shrink-0" />
          <span className="text-ink-900 font-medium whitespace-nowrap">
            {district.name}
          </span>
        </Container>
      </nav>

      {/* Hero */}
      <section className="bg-paper-50 border-b border-paper-200">
        <Container className="py-12 md:py-16 max-w-4xl">
          <div className="flex items-center gap-2 mb-4">
            <MapPin size={20} weight="fill" className="text-brand-700" />
            <span className="text-sm font-semibold text-brand-700 uppercase tracking-wider">
              {city.name} · {district.name}
            </span>
          </div>
          <h1 className="text-3xl md:text-5xl font-semibold text-ink-900 leading-tight">
            {district.name} matbaa & baskı hizmeti
          </h1>
          <p className="mt-5 text-lg text-ink-700 leading-relaxed">
            {district.intro}
          </p>

          <div className="mt-6 flex flex-wrap items-center gap-3 text-sm">
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-success/15 text-success rounded-full font-medium">
              <Truck size={13} weight="fill" />
              {district.sameDayDelivery
                ? "Aynı gün motor kurye"
                : "1 iş günü kargo"}
            </span>
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-brand-100 text-brand-900 rounded-full font-medium">
              <Lightning size={13} weight="fill" />
              Aynı gün üretim
            </span>
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-paper-100 text-ink-700 rounded-full font-medium">
              <ShieldCheck size={13} weight="fill" />
              Kalite garantili
            </span>
          </div>

          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Link
              href="/urunler"
              className="px-6 py-3 bg-brand-500 hover:bg-brand-600 text-ink-900 rounded-lg text-sm font-semibold inline-flex items-center gap-2"
            >
              <Storefront size={14} weight="fill" /> Sipariş Ver
              <ArrowRight size={14} weight="bold" />
            </Link>
            <a
              href={`https://wa.me/903244333351?text=${encodeURIComponent(`Merhaba, ${district.name} ${city.name} için matbaa fiyat almak istiyorum.`)}`}
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

      <Container className="py-12 md:py-16 max-w-4xl space-y-14">
        {/* Mahalleler — coverage göstergesi */}
        <section>
          <h2 className="text-2xl md:text-3xl font-semibold text-ink-900 mb-2">
            {district.name}'in tüm mahallelerine teslim
          </h2>
          <p className="text-ink-700 mb-6 max-w-2xl">
            {district.name}'in başlıca iş ve sanayi bölgelerine{" "}
            {district.sameDayDelivery
              ? "motor kurye ile aynı gün"
              : "kargo ile 1 iş günü"}{" "}
            içinde teslim ediyoruz.
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
            {district.neighborhoods.map((n) => (
              <div
                key={n}
                className="flex items-start gap-2 px-3 py-2.5 bg-paper-50 border border-paper-200 rounded-lg"
              >
                <CheckCircle
                  size={14}
                  weight="fill"
                  className="text-success shrink-0 mt-0.5"
                />
                <span className="text-sm text-ink-900">{n}</span>
              </div>
            ))}
          </div>
        </section>

        {/* Popüler ürünler */}
        <section>
          <h2 className="text-2xl md:text-3xl font-semibold text-ink-900 mb-2">
            En çok tercih edilen ürünler
          </h2>
          <p className="text-ink-700 mb-6 max-w-2xl">
            {district.name}'deki müşterilerimizden en sık gelen siparişler:
          </p>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {featuredProducts.map((p) => (
              <ProductCard key={p.slug} product={p} />
            ))}
          </div>
        </section>

        {/* Diğer ilçeler */}
        {otherDistricts.length > 0 && (
          <section>
            <h2 className="text-xl md:text-2xl font-semibold text-ink-900 mb-2">
              {city.name}'in diğer ilçelerine de hizmet veriyoruz
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2 mt-4">
              {otherDistricts.map((d) => (
                <Link
                  key={d.slug}
                  href={`/matbaa/${city.slug}/${d.slug}`}
                  className="px-4 py-2.5 bg-paper-100 hover:bg-paper-200 rounded-lg text-sm font-medium text-ink-900 text-center transition-colors"
                >
                  {d.name}
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Final CTA */}
        <section className="text-center p-10 md:p-12 bg-ink-900 text-paper-50 rounded-2xl">
          <Buildings
            size={28}
            weight="fill"
            className="text-brand-400 mx-auto mb-3"
          />
          <h2 className="text-2xl md:text-3xl font-semibold">
            {district.name}'deki firma sahibi misin?
          </h2>
          <p className="mt-3 text-paper-100/70 max-w-xl mx-auto">
            Kurumsal hesap aç, %10-15 ek indirim + açık fatura + dedicated
            temsilci kazan.
          </p>
          <Link
            href="/kurumsal/basvuru"
            className="mt-6 inline-flex items-center gap-2 px-6 py-3 bg-brand-500 hover:bg-brand-600 text-ink-900 rounded-lg text-sm font-semibold"
          >
            Kurumsal Başvuru <ArrowRight size={14} weight="bold" />
          </Link>
        </section>
      </Container>
    </>
  );
}
