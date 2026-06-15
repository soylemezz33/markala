import Link from "next/link";
import type { Metadata } from "next";
import { Container } from "@markala/ui";
import {
  Truck, ArrowRight, Lightning, ShieldCheck, Phone,
  Buildings, Storefront,
} from "@phosphor-icons/react/dist/ssr";
import { cities } from "@/lib/cities";
import { BreadcrumbJsonLd } from "@/components/seo/json-ld";

const SITE = "https://markala.com.tr";

export const metadata: Metadata = {
  title: "Türkiye Geneli Matbaa Hizmeti — 81 İl, Aynı Gün Üretim",
  description:
    "Mersin merkezli matbaa atölyemizden Türkiye geneli kartvizit, broşür, afiş, branda, kupa baskı hizmeti. Antalya, Adana, Şanlıurfa, Hatay, Osmaniye, Gaziantep'e 1-2 iş günü kargo. Mersin içinde aynı gün motor kurye.",
  keywords: [
    "matbaa", "online matbaa", "matbaa türkiye", "kartvizit baskı",
    "broşür baskı", "afiş baskı", "mersin matbaa", "antalya matbaa",
    "adana matbaa", "şanlıurfa matbaa", "hatay matbaa", "osmaniye matbaa",
    "gaziantep matbaa", "akdeniz matbaa", "güneydoğu matbaa",
  ],
  alternates: { canonical: "/matbaa" },
  openGraph: {
    type: "website",
    title: "Türkiye Geneli Matbaa — Markala",
    description:
      "81 ilde matbaa hizmeti. Mersin merkezli atölye, aynı gün üretim, DHL Express ile 1-2 iş günü teslim.",
    url: "/matbaa",
  },
};

export default function MatbaaHubPage() {
  const akdeniz = cities.filter((c) => c.region === "akdeniz");
  const guneydogu = cities.filter((c) => c.region === "guneydogu");

  return (
    <>
      <BreadcrumbJsonLd
        items={[
          { name: "Anasayfa", href: "/" },
          { name: "Matbaa Hizmetleri", href: "/matbaa" },
        ]}
      />

      {/* SERVICE schema — bölgesel hizmet kapsamı */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Service",
            "@id": `${SITE}/matbaa#service`,
            serviceType: "Matbaa ve Reklam Ürünleri Baskı",
            provider: { "@id": `${SITE}/#localbusiness` },
            areaServed: cities.map((c) => ({
              "@type": "City",
              name: c.name,
              "@id": `${SITE}/matbaa/${c.slug}`,
            })),
            availableChannel: {
              "@type": "ServiceChannel",
              serviceUrl: `${SITE}/urunler`,
              servicePhone: "+90-324-433-3351",
            },
            offers: {
              "@type": "AggregateOffer",
              priceCurrency: "TRY",
              lowPrice: 89,
              highPrice: 8500,
              offerCount: 32,
              priceSpecification: { "@type": "UnitPriceSpecification", priceCurrency: "TRY" },
            },
          }),
        }}
      />

      {/* Hero */}
      <div className="bg-paper-100 border-b border-paper-200">
        <Container className="py-12 md:py-16 max-w-3xl">
          <p className="text-sm text-brand-700 font-semibold uppercase tracking-wider">
            Hizmet Bölgeleri
          </p>
          <h1 className="mt-2 text-3xl md:text-5xl font-semibold text-ink-900 leading-tight">
            Türkiye geneli matbaa & baskı hizmeti
          </h1>
          <p className="mt-4 text-lg text-ink-700">
            Mersin merkezli atölyemizden 81 ilde kartvizit, broşür, afiş, branda,
            kupa baskı. Komşu illerde 1-2 iş günü, Mersin içinde aynı gün motor
            kurye teslim.
          </p>
          <div className="mt-6 flex flex-wrap items-center gap-4 text-sm text-ink-500">
            <span className="inline-flex items-center gap-1.5">
              <Lightning size={14} className="text-brand-700" weight="fill" />{" "}
              Aynı gün üretim (Mersin)
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Truck size={14} className="text-brand-700" weight="fill" /> DHL
              Express 1-2 gün (Akdeniz/Güneydoğu)
            </span>
            <span className="inline-flex items-center gap-1.5">
              <ShieldCheck size={14} className="text-brand-700" weight="fill" />{" "}
              Kalite garantili
            </span>
          </div>
        </Container>
      </div>

      <Container className="py-12 md:py-16">
        {/* Akdeniz */}
        <section>
          <h2 className="text-2xl md:text-3xl font-semibold text-ink-900 mb-2">
            Akdeniz Bölgesi
          </h2>
          <p className="text-ink-700 mb-6 max-w-2xl">
            Mersin merkezli atölyeye en yakın iller — DHL Express ile 1 iş günü
            içinde teslim.
          </p>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {akdeniz.map((city) => (
              <CityCard key={city.slug} city={city} />
            ))}
          </div>
        </section>

        {/* Güneydoğu */}
        <section className="mt-16">
          <h2 className="text-2xl md:text-3xl font-semibold text-ink-900 mb-2">
            Güneydoğu Anadolu
          </h2>
          <p className="text-ink-700 mb-6 max-w-2xl">
            Şanlıurfa, Gaziantep ve çevresine 1-2 iş günü içinde DHL ile teslim.
          </p>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {guneydogu.map((city) => (
              <CityCard key={city.slug} city={city} />
            ))}
          </div>
        </section>

        {/* Diğer iller bilgi */}
        <section className="mt-16 p-8 md:p-10 bg-ink-900 text-paper-50 rounded-2xl">
          <div className="grid md:grid-cols-2 gap-8 items-center">
            <div>
              <Buildings
                size={28}
                weight="fill"
                className="text-brand-400 mb-3"
              />
              <h2 className="text-2xl md:text-3xl font-semibold">
                Diğer 74 il için hizmet
              </h2>
              <p className="mt-3 text-paper-100/70 leading-relaxed">
                İstanbul, Ankara, İzmir, Bursa, Konya başta olmak üzere
                Türkiye'nin tüm illerine DHL Express, Aras Kargo ve MNG ile 2-4
                iş günü içinde teslim ediyoruz. Online sipariş — kargo takip —
                kapıda imza.
              </p>
            </div>
            <div className="md:text-right">
              <Link
                href="/urunler"
                className="inline-flex items-center gap-2 px-6 py-3 bg-brand-500 hover:bg-brand-600 text-ink-900 rounded-lg text-sm font-semibold"
              >
                <Storefront size={16} weight="fill" /> Tüm ürünleri incele
                <ArrowRight size={14} weight="bold" />
              </Link>
              <p className="mt-3 text-xs text-paper-100/50">
                Kargo ücreti ve süresi sepette gösterilir.
              </p>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="mt-12 text-center">
          <a
            href="tel:+903244333351"
            className="inline-flex items-center gap-2 text-ink-700 hover:text-ink-900"
          >
            <Phone size={14} weight="fill" className="text-brand-700" />
            <span>Şehrinize özel teklif:</span>
            <strong className="text-ink-900">0324 433 33 51</strong>
          </a>
        </section>
      </Container>
    </>
  );
}

function CityCard({
  city,
}: {
  city: ReturnType<typeof cities.filter>[number];
}) {
  return (
    <Link
      href={`/matbaa/${city.slug}`}
      className="group p-6 bg-paper-50 border border-paper-200 rounded-xl hover:border-ink-300 hover:shadow-md transition-all"
    >
      <div className="flex items-start justify-between gap-3 mb-3">
        <div>
          <h3 className="text-lg font-semibold text-ink-900 group-hover:text-brand-700 transition-colors">
            {city.name} Matbaa
          </h3>
          <p className="text-xs text-ink-500 mt-0.5">
            {city.population} nüfus · {city.region === "akdeniz" ? "Akdeniz" : "Güneydoğu"}
          </p>
        </div>
        <span className="px-2 py-0.5 rounded-full bg-brand-100 text-brand-900 text-[10px] font-bold uppercase">
          {city.deliveryDays.min === 0
            ? "Aynı gün"
            : city.deliveryDays.min === city.deliveryDays.max
              ? `${city.deliveryDays.min} gün`
              : `${city.deliveryDays.min}-${city.deliveryDays.max} gün`}
        </span>
      </div>
      <p className="text-sm text-ink-700 line-clamp-3">{city.intro}</p>

      {city.districts && city.districts.length > 0 && (
        <div className="mt-3 pt-3 border-t border-paper-200">
          <div className="text-[11px] uppercase tracking-wider text-ink-500 font-medium mb-1">
            İlçeler ({city.districts.length})
          </div>
          <div className="text-xs text-ink-700">
            {city.districts.slice(0, 4).map((d) => d.name).join(", ")}
            {city.districts.length > 4 && "…"}
          </div>
        </div>
      )}

      <div className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-brand-700 group-hover:gap-2 transition-all">
        Detayları gör <ArrowRight size={12} weight="bold" />
      </div>
    </Link>
  );
}
