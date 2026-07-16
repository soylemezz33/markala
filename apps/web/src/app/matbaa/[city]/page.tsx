import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { Container } from "@markala/ui";
import {
  ArrowLeft, ArrowRight, MapPin, Truck, Lightning, ShieldCheck,
  Phone, WhatsappLogo, EnvelopeSimple, CheckCircle, Star,
  Buildings, Receipt, Storefront, Question, CaretRight,
} from "@phosphor-icons/react/dist/ssr";
import { cities, getCityBySlug, getNearbyCities } from "@/lib/cities";
import { getProducts } from "@/lib/catalog";
import { ProductCard } from "@/components/product-card";
import { BreadcrumbJsonLd } from "@/components/seo/json-ld";

const SITE = "https://markala.com.tr";

interface Props {
  params: { city: string };
}

export function generateStaticParams() {
  return cities.map((c) => ({ city: c.slug }));
}

export function generateMetadata({ params }: Props): Metadata {
  const city = getCityBySlug(params.city);
  if (!city) return { title: "Şehir bulunamadı" };

  // Layout zaten "%s · Markala" template ekliyor — burada "| Markala" duplikasyonu olmasın
  const title = `${city.name} Matbaa & Baskı — ${
    city.deliveryDays.min === 0 ? "Aynı Gün Üretim" : `${city.deliveryDays.min}-${city.deliveryDays.max} Gün Teslim`
  }`;

  const description = city.intro.slice(0, 158);

  return {
    title,
    description,
    keywords: [
      `${city.name.toLowerCase()} matbaa`,
      `${city.name.toLowerCase()} baskı`,
      `${city.name.toLowerCase()} kartvizit`,
      `${city.name.toLowerCase()} broşür baskı`,
      `${city.name.toLowerCase()} afiş baskı`,
      `${city.name.toLowerCase()} matbaa fiyatları`,
      `${city.name.toLowerCase()} online matbaa`,
      `${city.name.toLowerCase()} ucuz matbaa`,
      `${city.name.toLowerCase()} kurumsal kartvizit`,
      "markala", "324 ajans",
    ],
    alternates: { canonical: `/matbaa/${city.slug}` },
    openGraph: {
      type: "website",
      title: `${city.name} Matbaa Hizmeti — Markala`,
      description: city.intro.slice(0, 200),
      url: `/matbaa/${city.slug}`,
      images: [
        {
          url: "/og-default.png",
          width: 1200,
          height: 630,
          alt: `${city.name} Matbaa & Baskı — Markala`,
        },
      ],
    },
  };
}

export default async function CityLandingPage({ params }: Props) {
  const city = getCityBySlug(params.city);
  if (!city) notFound();

  const nearbyCities = getNearbyCities(city.slug, 3);
  const products = await getProducts();
  const featuredProducts = products
    .filter((p) => p.bestseller)
    .slice(0, 4);

  return (
    <>
      <BreadcrumbJsonLd
        items={[
          { name: "Anasayfa", href: "/" },
          { name: "Matbaa Hizmetleri", href: "/matbaa" },
          { name: `${city.name} Matbaa`, href: `/matbaa/${city.slug}` },
        ]}
      />

      {/* LocalBusiness Service schema — şehir spesifik */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Service",
            "@id": `${SITE}/matbaa/${city.slug}#service`,
            serviceType: `${city.name} Matbaa ve Baskı Hizmeti`,
            name: `${city.name} Matbaa — Markala`,
            description: city.intro,
            provider: {
              "@type": "LocalBusiness",
              "@id": `${SITE}/#localbusiness`,
              name: "Markala — Matbaa & Reklam Ürünleri",
              telephone: "+90-324-433-3351",
            },
            areaServed: {
              "@type": "City",
              name: city.name,
              geo: {
                "@type": "GeoCoordinates",
                latitude: city.geo.lat,
                longitude: city.geo.lng,
              },
              ...(city.serviceRadius && {
                geoRadius: {
                  "@type": "QuantitativeValue",
                  value: city.serviceRadius,
                  unitCode: "KMT",
                },
              }),
            },
            offers: {
              "@type": "AggregateOffer",
              priceCurrency: "TRY",
              lowPrice: 89,
              highPrice: 8500,
              offerCount: 32,
            },
          }).replace(/</g, "\\u003c"),
        }}
      />

      {/* FAQPage schema */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "FAQPage",
            "@id": `${SITE}/matbaa/${city.slug}#faq`,
            mainEntity: city.faqs.map((f) => ({
              "@type": "Question",
              name: f.q,
              acceptedAnswer: { "@type": "Answer", text: f.a },
            })),
          }).replace(/</g, "\\u003c"),
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
            Matbaa Hizmetleri
          </Link>
          <CaretRight size={12} className="shrink-0" />
          <span className="text-ink-900 font-medium whitespace-nowrap">
            {city.name} Matbaa
          </span>
        </Container>
      </nav>

      {/* Hero */}
      <section className="bg-paper-50 border-b border-paper-200">
        <Container className="py-12 md:py-20 max-w-4xl">
          <div className="flex items-center gap-2 mb-4">
            <MapPin size={20} weight="fill" className="text-brand-700" />
            <span className="text-sm font-semibold text-brand-700 uppercase tracking-wider">
              {city.region === "akdeniz" ? "Akdeniz Bölgesi" : "Güneydoğu Anadolu"} · {city.name}
            </span>
          </div>
          <h1 className="text-3xl md:text-5xl lg:text-6xl font-semibold text-ink-900 leading-tight">
            {city.name}'de matbaa & baskı hizmeti
          </h1>
          <p className="mt-5 text-lg md:text-xl text-ink-700 leading-relaxed">
            {city.intro}
          </p>

          {/* Hızlı bilgi kartları */}
          <div className="mt-8 grid sm:grid-cols-3 gap-3">
            <InfoCard
              icon={Truck}
              title={
                city.deliveryDays.min === 0
                  ? "Aynı gün motor kurye"
                  : `${city.deliveryDays.min}-${city.deliveryDays.max} iş günü`
              }
              desc={
                city.sameDayCourier
                  ? `${city.name} merkez ve ilçeler`
                  : `DHL Express ile teslim`
              }
            />
            <InfoCard
              icon={Lightning}
              title="Hızlı üretim"
              desc="Siparişler kısa sürede üretime alınır"
            />
            <InfoCard
              icon={ShieldCheck}
              title="Kalite garantisi"
              desc="Hatalı baskıda ücretsiz değişim"
            />
          </div>

          {/* CTA */}
          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Link
              href="/urunler"
              className="px-6 py-3 bg-brand-500 hover:bg-brand-600 text-ink-900 rounded-lg text-sm font-semibold inline-flex items-center gap-2"
            >
              Ürünleri İncele <ArrowRight size={14} weight="bold" />
            </Link>
            <a
              href="tel:+903244333351"
              className="px-6 py-3 border border-paper-200 hover:border-ink-300 text-ink-900 rounded-lg text-sm font-semibold inline-flex items-center gap-2"
            >
              <Phone size={14} /> 0324 433 33 51
            </a>
            <a
              href={`https://wa.me/905319004102?text=${encodeURIComponent(`Merhaba, ${city.name} için matbaa fiyat almak istiyorum.`)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="px-6 py-3 bg-[#25D366] hover:bg-[#1FB358] text-white rounded-lg text-sm font-semibold inline-flex items-center gap-2"
            >
              <WhatsappLogo size={14} weight="fill" /> WhatsApp
            </a>
          </div>
        </Container>
      </section>

      <Container className="py-12 md:py-16 max-w-5xl space-y-16">
        {/* Popüler Ürünler */}
        <section>
          <h2 className="text-2xl md:text-3xl font-semibold text-ink-900 mb-2">
            {city.name}'de en çok tercih edilen matbaa ürünleri
          </h2>
          <p className="text-ink-700 mb-6 max-w-2xl">
            {city.name} bölgesindeki müşterilerimizin siparişlerinden
            derlediğimiz en popüler ürünler:
          </p>
          <ul className="grid sm:grid-cols-2 gap-3">
            {city.popularProducts.map((p) => (
              <li
                key={p}
                className="flex items-start gap-2.5 px-4 py-3 bg-paper-50 border border-paper-200 rounded-lg"
              >
                <CheckCircle
                  size={16}
                  weight="fill"
                  className="text-success shrink-0 mt-0.5"
                />
                <span className="text-sm text-ink-900">{p}</span>
              </li>
            ))}
          </ul>
        </section>

        {/* Yaygın İhtiyaçlar */}
        <section>
          <h2 className="text-2xl md:text-3xl font-semibold text-ink-900 mb-2">
            {city.name}'de matbaa ihtiyaçları
          </h2>
          <p className="text-ink-700 mb-6 max-w-2xl">
            Bu şehirden gelen taleplerin büyük çoğunluğu şu konularda:
          </p>
          <ul className="space-y-2">
            {city.commonNeeds.map((n) => (
              <li
                key={n}
                className="flex items-start gap-2.5 px-4 py-3 bg-paper-100 rounded-lg"
              >
                <span className="text-brand-700 font-bold shrink-0">→</span>
                <span className="text-ink-900">{n}</span>
              </li>
            ))}
          </ul>
        </section>

        {/* İlçeler (varsa) */}
        {city.districts && city.districts.length > 0 && (
          <section>
            <h2 className="text-2xl md:text-3xl font-semibold text-ink-900 mb-2">
              {city.name}'in ilçelerine teslim
            </h2>
            <p className="text-ink-700 mb-6 max-w-2xl">
              {city.name}'in tüm ilçelerine atölyemizden direkt teslim. Mersin
              ve ilçelerine kurye/kargo ile 1-2 iş günü.
            </p>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {city.districts.map((d) => (
                <Link
                  key={d.slug}
                  href={`/matbaa/${city.slug}/${d.slug}`}
                  className="group p-4 bg-paper-50 border border-paper-200 rounded-lg hover:border-ink-300 hover:shadow-sm transition-all"
                >
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="font-semibold text-ink-900 group-hover:text-brand-700 transition-colors">
                      {d.name}
                    </h3>
                    {d.sameDayDelivery && (
                      <span className="px-1.5 py-0.5 rounded text-[11px] font-bold bg-success/15 text-success">
                        AYNI GÜN
                      </span>
                    )}
                  </div>
                  <div className="mt-2 text-xs text-ink-500">
                    {d.neighborhoods.slice(0, 3).join(", ")}…
                  </div>
                  <span className="mt-2 inline-flex items-center gap-1 text-xs text-brand-700 font-medium group-hover:gap-1.5 transition-all">
                    Detay <ArrowRight size={11} weight="bold" />
                  </span>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Featured Products */}
        <section>
          <h2 className="text-2xl md:text-3xl font-semibold text-ink-900 mb-2">
            En çok tercih edilen ürünler
          </h2>
          <p className="text-ink-700 mb-6 max-w-2xl">
            {city.name}'deki müşterilerimizin sıkça sipariş verdiği başlangıç
            ürünleri.
          </p>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {featuredProducts.map((p) => (
              <ProductCard key={p.slug} product={p} />
            ))}
          </div>
          <div className="mt-6 text-center">
            <Link
              href="/urunler"
              className="inline-flex items-center gap-2 text-sm font-semibold text-brand-700 hover:text-ink-900"
            >
              Tüm ürünleri gör <ArrowRight size={12} weight="bold" />
            </Link>
          </div>
        </section>

        {/* Müşteri Referansları */}
        {city.localReferences.length > 0 && (
          <section className="p-8 md:p-10 bg-paper-100 border border-paper-200 rounded-2xl">
            <div className="flex items-center gap-2 mb-4">
              <Star
                size={20}
                weight="fill"
                className="text-brand-500"
              />
              <h2 className="text-xl md:text-2xl font-semibold text-ink-900">
                {city.name}'den müşterilerimiz
              </h2>
            </div>
            <p className="text-ink-700 mb-5">
              Bu şehirden Markala'yı tercih eden işletmelerden bazıları:
            </p>
            <div className="flex flex-wrap gap-2">
              {city.localReferences.map((r) => (
                <span
                  key={r}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-paper-50 border border-paper-200 rounded-full text-sm text-ink-700"
                >
                  <Buildings size={12} className="text-brand-700" />
                  {r}
                </span>
              ))}
            </div>
            <p className="mt-5 text-sm text-ink-500">
              Logonu burada görmek için{" "}
              <Link
                href="/kurumsal/basvuru"
                className="text-brand-700 font-medium hover:underline"
              >
                kurumsal hesap aç
              </Link>{" "}
              — firmanıza özel avantajlı fiyat, açık fatura, size özel temsilci.
            </p>
          </section>
        )}

        {/* SSS — şehir spesifik */}
        <section>
          <div className="flex items-center gap-2 mb-6">
            <Question size={22} weight="fill" className="text-brand-700" />
            <h2 className="text-2xl md:text-3xl font-semibold text-ink-900">
              {city.name} için sıkça sorulanlar
            </h2>
          </div>
          <div className="space-y-3">
            {city.faqs.map((f, i) => (
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

        {/* Yakın iller */}
        {nearbyCities.length > 0 && (
          <section>
            <h2 className="text-2xl md:text-3xl font-semibold text-ink-900 mb-2">
              Yakın iller
            </h2>
            <p className="text-ink-700 mb-6 max-w-2xl">
              Aynı bölgedeki diğer illere de kargo ile 1-2 iş günü içinde
              teslim ediyoruz.
            </p>
            <div className="grid sm:grid-cols-3 gap-4">
              {nearbyCities.map((c) => (
                <Link
                  key={c.slug}
                  href={`/matbaa/${c.slug}`}
                  className="group p-5 bg-paper-50 border border-paper-200 rounded-xl hover:border-ink-300 hover:shadow-md transition-all"
                >
                  <h3 className="font-semibold text-ink-900 group-hover:text-brand-700 transition-colors">
                    {c.name} Matbaa
                  </h3>
                  <p className="mt-1 text-xs text-ink-500">
                    {c.deliveryDays.min}-{c.deliveryDays.max} iş günü teslim
                  </p>
                  <p className="mt-2 text-sm text-ink-700 line-clamp-2">
                    {c.intro}
                  </p>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Final CTA */}
        <section className="text-center p-10 md:p-14 bg-ink-900 text-paper-50 rounded-2xl">
          <h2 className="text-2xl md:text-4xl font-semibold">
            {city.name}'deki ilk siparişine{" "}
            <span className="text-brand-400">%10 indirim</span>
          </h2>
          <p className="mt-4 text-paper-100/70 max-w-xl mx-auto">
            Kupon kodu:{" "}
            <code className="font-mono px-2 py-0.5 rounded bg-brand-500/15 text-brand-400">
              HOSGELDIN
            </code>{" "}
            — sepette uygulanır, tek kullanım.
          </p>
          <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
            <Link
              href="/urunler"
              className="px-6 py-3 bg-brand-500 hover:bg-brand-600 text-ink-900 rounded-lg text-sm font-semibold inline-flex items-center gap-2"
            >
              <Storefront size={14} weight="fill" /> Sipariş Ver
              <ArrowRight size={14} weight="bold" />
            </Link>
            <Link
              href="/kurumsal/basvuru"
              className="px-6 py-3 border border-paper-100/30 text-paper-50 rounded-lg text-sm font-semibold hover:bg-white/5 inline-flex items-center gap-2"
            >
              <Receipt size={14} /> Kurumsal Hesap
            </Link>
          </div>
        </section>
      </Container>
    </>
  );
}

function InfoCard({
  icon: Icon,
  title,
  desc,
}: {
  icon: typeof MapPin;
  title: string;
  desc: string;
}) {
  return (
    <div className="p-4 bg-paper-50 border border-paper-200 rounded-lg">
      <div className="w-9 h-9 rounded-md bg-brand-100 text-brand-700 grid place-items-center mb-2">
        <Icon size={18} weight="fill" />
      </div>
      <div className="font-semibold text-ink-900 text-sm">{title}</div>
      <div className="text-xs text-ink-500 mt-0.5">{desc}</div>
    </div>
  );
}
