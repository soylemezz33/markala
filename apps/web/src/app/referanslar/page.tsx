import Image from "next/image";
import Link from "next/link";
import { Container, Button } from "@markala/ui";
import { Buildings, ArrowRight } from "@phosphor-icons/react/dist/ssr";
import { getBrands } from "@/lib/brands";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Referanslarımız",
  description: "Markala olarak birlikte çalıştığımız kurumlar ve markalar.",
};

export default async function ReferansPage() {
  const brands = await getBrands();

  return (
    <Container className="py-16 md:py-24">
      <header className="max-w-3xl">
        <p className="text-sm text-brand-700 font-medium uppercase tracking-wider">İş Ortaklarımız</p>
        <h1 className="mt-2 text-display-lg font-serif text-ink-900">Referanslarımız</h1>
        <p className="mt-4 text-lg text-ink-700 leading-relaxed">
          Kurumsal müşterilerimiz, açıldığı günden bu yana Markala'ya güvenen ve birlikte çalıştığımız markalar.
        </p>
      </header>

      {brands.length === 0 ? (
        <section className="mt-16 max-w-2xl mx-auto text-center p-10 md:p-14 bg-paper-50 border border-paper-200 rounded-xl">
          <div className="inline-flex w-14 h-14 items-center justify-center rounded-full bg-brand-100 text-brand-700 mb-5">
            <Buildings size={28} weight="regular" />
          </div>
          <h2 className="text-2xl font-serif text-ink-900">Yakında burada</h2>
          <p className="mt-3 text-ink-700 leading-relaxed">
            Müşterilerimizin logo izinlerini aldıktan sonra burada paylaşacağız. Markala kurumsal müşteri portföyü hızla büyüyor.
          </p>
          <p className="mt-2 text-sm text-ink-500">
            B2B çözümler ve kurumsal teklif için <Link href="/iletisim" className="text-brand-700 font-medium hover:underline">iletişime geçin</Link>.
          </p>

          <div className="mt-8 flex items-center justify-center gap-3">
            <Link href="/iletisim">
              <Button>
                Kurumsal Teklif Al <ArrowRight size={16} weight="bold" />
              </Button>
            </Link>
            <Link href="/urunler">
              <Button variant="outline">Ürünleri Keşfet</Button>
            </Link>
          </div>
        </section>
      ) : (
        <section className="mt-12 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 md:gap-6">
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
        </section>
      )}

      {/* B2B CTA */}
      <section className="mt-16 md:mt-24 p-8 md:p-12 bg-paper-100 rounded-xl border border-paper-200 grid md:grid-cols-3 gap-6 items-center">
        <div className="md:col-span-2">
          <h3 className="text-2xl font-serif text-ink-900">Kurumsal müşteri misiniz?</h3>
          <p className="mt-2 text-ink-700">
            Aylık fatura, özel taksit ve cari hesap olanağı için B2B kayıt formumuzu doldurun. 1 iş günü içinde size dönüş yapalım.
          </p>
        </div>
        <div className="md:text-right">
          <Link href="/iletisim">
            <Button size="lg">
              B2B Başvuru <ArrowRight size={16} weight="bold" />
            </Button>
          </Link>
        </div>
      </section>
    </Container>
  );
}
