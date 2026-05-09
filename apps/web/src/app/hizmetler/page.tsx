import Link from "next/link";
import type { Metadata } from "next";
import { Container } from "@markala/ui";
import {
  PaintBrush, Stack, Lightning, ArrowRight,
} from "@phosphor-icons/react/dist/ssr";
import { services } from "@/lib/services";
import { BreadcrumbJsonLd } from "@/components/seo/json-ld";

const SITE = "https://markala.com.tr";

export const metadata: Metadata = {
  title: "Matbaa Hizmetleri — Tasarım Desteği, Toplu Baskı, Acil Üretim",
  description:
    "Markala matbaa hizmetleri: ücretsiz tasarım desteği, toplu sipariş indirimi, aynı gün acil baskı. 3 hizmet kategorisinde detaylı bilgi.",
  alternates: { canonical: "/hizmetler" },
  openGraph: {
    type: "website",
    title: "Markala Matbaa Hizmetleri",
    description: "Tasarım desteği, toplu baskı ve acil üretim hizmetleri.",
    url: "/hizmetler",
  },
};

const icons = {
  "tasarim-destegi": PaintBrush,
  "toplu-baski": Stack,
  "acil-baski": Lightning,
};

export default function HizmetlerHubPage() {
  return (
    <>
      <BreadcrumbJsonLd
        items={[
          { name: "Anasayfa", href: "/" },
          { name: "Hizmetler", href: "/hizmetler" },
        ]}
      />

      {/* Hero */}
      <div className="bg-paper-100 border-b border-paper-200">
        <Container className="py-12 md:py-16 max-w-3xl">
          <p className="text-sm text-brand-700 font-semibold uppercase tracking-wider">
            Hizmetlerimiz
          </p>
          <h1 className="mt-2 text-3xl md:text-5xl font-semibold text-ink-900 leading-tight">
            Sadece baskı değil — tam matbaa çözümü
          </h1>
          <p className="mt-4 text-lg text-ink-700">
            Ücretsiz tasarım desteğinden toplu kurumsal indirime, aynı gün acil
            üretime kadar her ihtiyaca özel hizmet. 324 Ajans deneyimiyle 10+
            yıldır.
          </p>
        </Container>
      </div>

      <Container className="py-12 md:py-16">
        <div className="grid md:grid-cols-3 gap-6">
          {services.map((s) => {
            const Icon = icons[s.slug as keyof typeof icons];
            return (
              <Link
                key={s.slug}
                href={`/hizmetler/${s.slug}`}
                className="group flex flex-col p-6 md:p-8 bg-paper-50 border border-paper-200 rounded-2xl hover:border-ink-300 hover:shadow-md transition-all"
              >
                <div className="w-14 h-14 rounded-xl bg-brand-100 text-brand-700 grid place-items-center mb-5">
                  {Icon && <Icon size={26} weight="fill" />}
                </div>
                <h2 className="text-xl font-semibold text-ink-900 group-hover:text-brand-700 transition-colors">
                  {s.title}
                </h2>
                <p className="mt-3 text-sm text-ink-700 leading-relaxed flex-1">
                  {s.intro}
                </p>
                <span className="mt-5 inline-flex items-center gap-1.5 text-sm font-semibold text-brand-700 group-hover:gap-2.5 transition-all">
                  Detayları gör <ArrowRight size={12} weight="bold" />
                </span>
              </Link>
            );
          })}
        </div>
      </Container>
    </>
  );
}
