import Link from "next/link";
import type { Metadata } from "next";
import { Container } from "@markala/ui";
import { BookOpen, ArrowRight, DownloadSimple } from "@phosphor-icons/react/dist/ssr";
import { guides } from "@/lib/guides";
import { BreadcrumbJsonLd } from "@/components/seo/json-ld";

const PAGE_PATH = "/rehber";

export const metadata: Metadata = {
  title: "Baskı Fiyat Rehberleri — Güncel Fiyat Tabloları ve Seçim Kılavuzları",
  description:
    "Kartvizit, broşür, etiket, tabela, branda ve İSG levhaları için güncel fiyat rehberleri: canlı katalogdan fiyat tabloları, malzeme karşılaştırmaları ve seçim kılavuzları.",
  alternates: { canonical: PAGE_PATH },
  openGraph: {
    type: "website",
    title: "Baskı Fiyat Rehberleri — Markala",
    description:
      "Matbaa ürünleri için güncel fiyat tabloları ve seçim kılavuzları — KDV dahil, canlı katalogdan.",
    url: PAGE_PATH,
    images: [{ url: "/og-default.png", width: 1200, height: 630, alt: "Baskı Fiyat Rehberleri" }],
  },
};

export default function RehberIndexPage() {
  return (
    <>
      <BreadcrumbJsonLd
        items={[
          { name: "Anasayfa", href: "/" },
          { name: "Rehberler", href: PAGE_PATH },
        ]}
      />

      {/* Hero */}
      <div className="bg-paper-100 border-b border-paper-200">
        <Container className="py-12 md:py-16 max-w-3xl">
          <div className="flex items-center gap-2 mb-3">
            <BookOpen size={20} weight="fill" className="text-brand-700" />
            <span className="text-sm font-semibold text-brand-700 uppercase tracking-wider">
              Rehberler
            </span>
          </div>
          <h1 className="text-3xl md:text-5xl font-semibold text-ink-900 leading-tight">
            Baskı fiyat rehberleri
          </h1>
          <p className="mt-4 text-lg text-ink-700">
            Sipariş vermeden önce ne ödeyeceğini bil: fiyat tabloları canlı katalogdan üretilir,
            KDV dahildir ve sepette değişmez. Malzeme karşılaştırmaları ve seçim kılavuzlarıyla.
          </p>
        </Container>
      </div>

      <Container className="py-10 md:py-14 max-w-4xl">
        <div className="grid sm:grid-cols-2 gap-4">
          {guides.map((g) => (
            <Link
              key={g.slug}
              href={`/rehber/${g.slug}`}
              className="group p-5 bg-paper-50 border border-paper-200 rounded-xl hover:border-ink-300 hover:shadow-sm transition-all flex flex-col"
            >
              <h2 className="font-semibold text-ink-900 group-hover:text-brand-700 transition-colors">
                {g.title}
              </h2>
              <p className="mt-2 text-sm text-ink-700 leading-relaxed flex-1">{g.description}</p>
              <span className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-brand-700 group-hover:gap-1.5 transition-all">
                Rehberi oku <ArrowRight size={12} weight="bold" />
              </span>
            </Link>
          ))}
        </div>

        {/* Şablon aracı — fiyat rehberi değil, ayrı vurgulanır */}
        <div className="mt-8 p-5 bg-paper-100 border border-paper-200 rounded-xl flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <DownloadSimple size={22} weight="fill" className="text-brand-700 shrink-0 mt-0.5" />
            <div>
              <h2 className="font-semibold text-ink-900">Ücretsiz baskı şablonları</h2>
              <p className="mt-1 text-sm text-ink-700">
                Kartvizit, broşür ve afiş için baskıya hazır ölçülü şablon dosyaları.
              </p>
            </div>
          </div>
          <Link
            href="/rehber/sablonlar"
            className="px-5 py-2.5 bg-brand-500 hover:bg-brand-600 text-ink-900 rounded-lg text-sm font-semibold inline-flex items-center gap-2"
          >
            Şablonları İndir <ArrowRight size={13} weight="bold" />
          </Link>
        </div>
      </Container>
    </>
  );
}
