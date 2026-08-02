import Image from "next/image";
import Link from "next/link";
import { Container, Button } from "@markala/ui";
import {
  ArrowRight,
  ForkKnife,
  TShirt,
  Diamond,
  House,
  Pill,
  HardHat,
  Scissors,
  Briefcase,
  Truck,
  Receipt,
  SealCheck,
  ShieldCheck,
} from "@phosphor-icons/react/dist/ssr";
import { getBrands } from "@/lib/brands";
import { BreadcrumbJsonLd } from "@/components/seo/json-ld";

/**
 * Referanslar sayfası.
 *
 * DÜRÜST İÇERİK KURALI (json-ld.tsx / reviews.ts / trusted-by.tsx ile aynı politika):
 * - "Birlikte çalıştığımız markalar" gridi SADECE admin'in eklediği GERÇEK markalarla dolar
 *   (getBrands). Marka yoksa grid hiç basılmaz — uydurma firma adı/logosu GÖSTERİLMEZ.
 * - "Hizmet verdiğimiz sektörler" bölümü ise dürüst bir yetenek beyanıdır: bunlar müşteri
 *   iddiası değil, üretim yaptığımız sektör kapsamıdır → sayfa boş görünmeden dolar.
 * - Güven sinyalleri yalnız DOĞRULANABİLİR gerçekler (81 il teslimat, cari hesap, iyzico,
 *   dijital onay) — uydurma istatistik/puan YOK.
 */

const SECTORS: { name: string; desc: string; Icon: typeof ForkKnife }[] = [
  { name: "Restoran & Cafe", desc: "Menü, masa kartı, ambalaj ve sticker baskıları", Icon: ForkKnife },
  { name: "Butik & Moda", desc: "Etiket, kutu, poşet ve marka kartları", Icon: TShirt },
  { name: "Kuyumcu", desc: "Sertifika, kutu bandı ve vitrin etiketleri", Icon: Diamond },
  { name: "Emlak & Gayrimenkul", desc: "Kartvizit, broşür, katalog ve tabela", Icon: House },
  { name: "Eczane & Sağlık", desc: "Poşet, reçete zarfı ve bilgilendirme afişleri", Icon: Pill },
  { name: "İnşaat & Sanayi", desc: "Branda, tabela ve iş güvenliği levhaları", Icon: HardHat },
  { name: "Güzellik & Kuaför", desc: "Randevu kartı, fiyat listesi ve sticker", Icon: Scissors },
  { name: "Kurumsal & Ofis", desc: "Antetli kağıt, dosya, sunum ve promosyon ürünleri", Icon: Briefcase },
];

const TRUST: { title: string; desc: string; Icon: typeof Truck }[] = [
  { title: "81 ile teslimat", desc: "DHL / Aras Kargo ile Türkiye'nin her yerine, takip linkiyle.", Icon: Truck },
  { title: "Kurumsal fatura & cari hesap", desc: "B2B müşterilere aylık fatura ve cari hesap kolaylığı.", Icon: Receipt },
  { title: "Baskı öncesi dijital onay", desc: "Üretime geçmeden dosyanı görsel onaya sunarız.", Icon: SealCheck },
  { title: "iyzico güvenli ödeme", desc: "3D Secure kredi kartı, banka kartı ve havale/EFT.", Icon: ShieldCheck },
];

export default async function ReferansPage() {
  const brands = await getBrands();

  return (
    <>
      <BreadcrumbJsonLd
        items={[
          { name: "Ana Sayfa", href: "/" },
          { name: "Referanslarımız", href: "/referanslar" },
        ]}
      />

      <Container className="py-16 md:py-24">
        <header className="max-w-3xl">
          <p className="text-sm text-brand-700 font-medium uppercase tracking-wider">İş Ortaklarımız</p>
          <h1 className="mt-2 text-display-lg font-serif text-ink-900">Referanslarımız</h1>
          <p className="mt-4 text-lg text-ink-700 leading-relaxed">
            Esnaftan kurumsal markalara; restoran, butik, kuyumcu, emlak ve daha birçok sektöre özel
            matbaa çözümleri üretiyoruz. Markala'ya güvenen işletmelerin yanındayız.
          </p>
        </header>

        {/* GERÇEK marka gridi — sadece admin'in eklediği markalar. Boşsa hiç basılmaz. */}
        {brands.length > 0 && (
          <section className="mt-12">
            <h2 className="text-sm font-medium uppercase tracking-wider text-ink-500 mb-6">
              Birlikte çalıştığımız markalar
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 md:gap-6">
              {brands.map((b) => {
                const inner = b.logoUrl ? (
                  <Image
                    src={b.logoUrl}
                    alt={b.name}
                    width={140}
                    height={70}
                    className="object-contain max-h-12"
                  />
                ) : (
                  <span className="font-medium text-ink-700 text-center text-sm">{b.name}</span>
                );
                const cellClass =
                  "aspect-[3/2] flex items-center justify-center p-6 bg-paper-50 border border-paper-200 rounded-lg grayscale hover:grayscale-0 transition-all duration-300";
                return b.websiteUrl ? (
                  <a
                    key={b.name}
                    href={b.websiteUrl}
                    target="_blank"
                    rel="noopener noreferrer nofollow"
                    className={cellClass}
                    title={b.name}
                  >
                    {inner}
                  </a>
                ) : (
                  <div key={b.name} className={cellClass}>
                    {inner}
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* Hizmet verdiğimiz sektörler — dürüst yetenek beyanı (müşteri iddiası DEĞİL). */}
        <section className="mt-16 md:mt-24">
          <div className="max-w-2xl">
            <h2 className="text-2xl md:text-3xl font-serif text-ink-900">Hizmet verdiğimiz sektörler</h2>
            <p className="mt-3 text-ink-700 leading-relaxed">
              Her sektörün baskı ihtiyacı farklıdır. Markala olarak sektöre özel ürün, malzeme ve
              tasarım desteğiyle işini büyütmene yardımcı oluyoruz.
            </p>
          </div>

          <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-5">
            {SECTORS.map(({ name, desc, Icon }) => (
              <div
                key={name}
                className="p-6 bg-paper-50 border border-paper-200 rounded-xl hover:border-brand-300 hover:shadow-md transition-all"
              >
                <div className="inline-flex w-11 h-11 items-center justify-center rounded-lg bg-brand-100 text-brand-700">
                  <Icon size={22} weight="regular" />
                </div>
                <h3 className="mt-4 font-semibold text-ink-900">{name}</h3>
                <p className="mt-1.5 text-sm text-ink-600 leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Güven sinyalleri — yalnız doğrulanabilir gerçekler. */}
        <section className="mt-16 md:mt-20 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-5">
          {TRUST.map(({ title, desc, Icon }) => (
            <div key={title} className="flex gap-4 p-5 bg-paper-100 rounded-xl border border-paper-200">
              <Icon size={26} weight="regular" className="text-brand-700 shrink-0 mt-0.5" />
              <div>
                <h3 className="font-semibold text-ink-900 text-sm">{title}</h3>
                <p className="mt-1 text-sm text-ink-600 leading-relaxed">{desc}</p>
              </div>
            </div>
          ))}
        </section>

        {/* CTA — "Siz de listede yerinizi alın" (light panel + sarı hap odak). */}
        <section className="mt-16 md:mt-24 p-8 md:p-14 bg-paper-100 rounded-2xl border border-paper-200 text-center">
          <h2 className="text-2xl md:text-4xl font-serif text-ink-900">Siz de listede yerinizi alın</h2>
          <p className="mt-4 max-w-xl mx-auto text-ink-700 leading-relaxed">
            Markanızın matbaa ve reklam ürünlerini Markala'ya emanet edin. Kurumsal fatura, cari hesap
            ve özel fiyatlandırma için 1 iş günü içinde size dönüş yapalım.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Link href="/iletisim">
              <Button size="lg">
                Kurumsal Teklif Al <ArrowRight size={16} weight="bold" />
              </Button>
            </Link>
            <Link href="/urunler">
              <Button size="lg" variant="outline">
                Ürünleri Keşfet
              </Button>
            </Link>
          </div>
        </section>
      </Container>
    </>
  );
}
