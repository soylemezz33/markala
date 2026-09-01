import Link from "next/link";
import type { Metadata } from "next";
import { Container } from "@markala/ui";
import {
  DownloadSimple,
  IdentificationCard,
  Article,
  FrameCorners,
  ImageSquare,
  Info,
  Ruler,
  PaintBrush,
  ArrowRight,
  Lightning,
} from "@phosphor-icons/react/dist/ssr";
import { BreadcrumbJsonLd } from "@/components/seo/json-ld";

const PAGE_PATH = "/rehber/sablonlar";

export const metadata: Metadata = {
  title: "Ücretsiz Baskı Şablonları | Markala Online Matbaa",
  description:
    "Kartvizit, broşür, roll-up ve afiş için ücretsiz PDF, AI ve EPS baskı şablonları. Doğru ölçülerde tasarım yapın, hızlı baskı alın.",
  alternates: { canonical: PAGE_PATH },
  openGraph: {
    type: "website",
    title: "Ücretsiz Baskı Şablonları | Kartvizit, Broşür, Roll-Up, Afiş",
    description:
      "Profesyonel baskı şablon dosyaları (PDF · AI · EPS). Taşma payı ve kesim kılavuzları hazır, doğru ölçüde tasarla, sorunsuz baskı al.",
    url: PAGE_PATH,
    images: [{ url: "/og-default.png", width: 1200, height: 630, alt: "Ücretsiz Baskı Şablonları" }],
  },
};

/** Format rozeti renkleri — PDF yeşil, AI turuncu, EPS mavi. */
type FileFormat = "PDF" | "AI" | "EPS";

const FORMAT_STYLES: Record<FileFormat, string> = {
  PDF: "bg-green-50 text-green-700 border-green-200",
  AI: "bg-orange-50 text-orange-700 border-orange-200",
  EPS: "bg-blue-50 text-blue-700 border-blue-200",
};

interface Template {
  name: string;
  /** İnsan okunur ölçü etiketi, ör. "85 × 55 mm" */
  size: string;
  formats: FileFormat[];
  /** Dosya boyutu — gerçek dosyalar eklenene kadar placeholder. */
  fileSize: string;
  desc: string;
}

interface TemplateCategory {
  title: string;
  Icon: typeof IdentificationCard;
  templates: Template[];
}

const CATEGORIES: TemplateCategory[] = [
  {
    title: "Kartvizit Şablonları",
    Icon: IdentificationCard,
    templates: [
      {
        name: "Standart Kartvizit",
        size: "85 × 55 mm",
        formats: ["PDF", "AI"],
        fileSize: "2.4 MB",
        desc: "En yaygın kartvizit ölçüsü; 3 mm taşma payı ve kesim çizgileri hazır.",
      },
      {
        name: "Yuvarlak Köşeli Kartvizit",
        size: "85 × 55 mm",
        formats: ["PDF"],
        fileSize: "1.8 MB",
        desc: "Köşeleri yuvarlatılmış modern kesim için maskeli şablon.",
      },
      {
        name: "Kartvizit (Avrupa Boyutu)",
        size: "90 × 50 mm",
        formats: ["PDF"],
        fileSize: "1.9 MB",
        desc: "Avrupa standardı ince-uzun kartvizit ölçüsü.",
      },
    ],
  },
  {
    title: "Broşür Şablonları",
    Icon: Article,
    templates: [
      {
        name: "A4 Tek Sayfa Broşür",
        size: "A4 · 210 × 297 mm",
        formats: ["PDF"],
        fileSize: "3.1 MB",
        desc: "Tek yüz veya çift yüz A4 broşür; taşma payı dahil.",
      },
      {
        name: "A4 Üçlü Katlama Broşür",
        size: "A4 · 210 × 297 mm",
        formats: ["PDF", "AI"],
        fileSize: "3.6 MB",
        desc: "Üç panele bölünmüş, katlama kılavuzlu A4 broşür şablonu.",
      },
      {
        name: "A5 Broşür",
        size: "A5 · 148 × 210 mm",
        formats: ["PDF"],
        fileSize: "2.2 MB",
        desc: "El ilanı ve kompakt broşür için A5 ölçüsü.",
      },
    ],
  },
  {
    title: "Roll-Up Şablonları",
    Icon: FrameCorners,
    templates: [
      {
        name: "Roll-Up (Standart)",
        size: "85 × 200 cm",
        formats: ["PDF", "AI"],
        fileSize: "5.4 MB",
        desc: "En çok kullanılan roll-up ölçüsü; görünür alan kılavuzu işaretli.",
      },
      {
        name: "Roll-Up Geniş",
        size: "100 × 200 cm",
        formats: ["PDF"],
        fileSize: "6.1 MB",
        desc: "Geniş roll-up; fuar ve mağaza girişleri için ideal.",
      },
      {
        name: "Roll-Up Kompakt",
        size: "60 × 160 cm",
        formats: ["PDF"],
        fileSize: "4.2 MB",
        desc: "Dar alanlar için kompakt roll-up ölçüsü.",
      },
    ],
  },
  {
    title: "Afiş & Poster",
    Icon: ImageSquare,
    templates: [
      {
        name: "A3 Afiş",
        size: "A3 · 297 × 420 mm",
        formats: ["PDF"],
        fileSize: "4.8 MB",
        desc: "Vitrin ve pano afişi için A3 ölçüsünde hazır şablon.",
      },
      {
        name: "Poster",
        size: "50 × 70 cm",
        formats: ["PDF"],
        fileSize: "7.3 MB",
        desc: "Büyük poster baskısı için yüksek çözünürlük kılavuzlu şablon.",
      },
    ],
  },
];

const TOTAL_TEMPLATES = CATEGORIES.reduce((n, c) => n + c.templates.length, 0);

export default function SablonlarPage() {
  return (
    <>
      <BreadcrumbJsonLd
        items={[
          { name: "Anasayfa", href: "/" },
          { name: "Ücretsiz Baskı Şablonları", href: PAGE_PATH },
        ]}
      />

      {/* Hero */}
      <div className="bg-paper-100 border-b border-paper-200">
        <Container className="py-12 md:py-16 max-w-3xl">
          <div className="flex items-center gap-2 mb-3">
            <DownloadSimple size={20} weight="fill" className="text-brand-700" />
            <span className="text-sm font-semibold text-brand-700 uppercase tracking-wider">
              Ücretsiz Kaynak
            </span>
          </div>
          <h1 className="text-3xl md:text-5xl font-semibold text-ink-900 leading-tight">
            Ücretsiz Baskı Şablonları
          </h1>
          <p className="mt-4 text-lg text-ink-700">
            Tasarımlarınızı doğru ölçülerde hazırlamak için profesyonel şablon dosyaları. Kartvizit,
            broşür, roll-up ve afiş için taşma payı ve kesim kılavuzları hazır, indir, tasarla,
            sorunsuz baskı al.
          </p>
          <div className="mt-6 flex flex-wrap items-center gap-3 text-sm">
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-brand-100 text-brand-900 rounded-full font-medium">
              <DownloadSimple size={13} weight="fill" /> {TOTAL_TEMPLATES} ücretsiz şablon
            </span>
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-paper-200 text-ink-900 rounded-full font-medium">
              <Ruler size={13} weight="fill" /> Taşma payı & kesim kılavuzlu
            </span>
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-paper-200 text-ink-900 rounded-full font-medium">
              <PaintBrush size={13} weight="fill" /> PDF · AI · EPS
            </span>
          </div>
        </Container>
      </div>

      <Container className="py-10 md:py-14 max-w-4xl">
        {/* Kullanım notu — dürüst bilgilendirme */}
        <section className="mb-12 p-5 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-3">
          <Info size={20} weight="fill" className="text-amber-700 shrink-0 mt-0.5" />
          <div className="text-sm text-amber-900 leading-relaxed">
            <strong>Şablonlar nasıl kullanılır?</strong> Her dosyada baskı için gerekli 3 mm taşma
            payı, güvenli alan ve kesim çizgileri işaretlidir. Tasarımını bu kılavuzlara göre yerleştir,
            300 DPI ve CMYK olarak PDF kaydet.{" "}
            <span className="text-amber-800">
              Dosyalar hazırlanıyor; indirme bağlantıları kısa süre içinde aktif edilecek.
            </span>
          </div>
        </section>

        {/* Kategoriler */}
        <div className="space-y-14">
          {CATEGORIES.map((cat) => (
            <section key={cat.title}>
              <header className="flex items-center gap-2.5 mb-5">
                <cat.Icon size={24} weight="fill" className="text-brand-700" />
                <h2 className="text-2xl font-semibold text-ink-900">{cat.title}</h2>
                <span className="text-sm text-ink-500">({cat.templates.length})</span>
              </header>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {cat.templates.map((t) => (
                  <TemplateCard key={t.name} template={t} />
                ))}
              </div>
            </section>
          ))}
        </div>

        {/* Alt CTA */}
        <section className="mt-16 p-8 md:p-12 bg-ink-900 text-paper-50 rounded-2xl text-center">
          <Lightning size={28} weight="fill" className="text-brand-400 mx-auto mb-3" />
          <h2 className="text-2xl md:text-3xl font-semibold">Hazır şablonunuz mu var?</h2>
          <p className="mt-3 text-paper-100/70 max-w-xl mx-auto">
            Şablonu doldur, dosyanı yükle, üretim 2–3 iş günü, 81 ile kargo. Tasarımın yoksa
            ücretsiz tasarım desteğiyle biz hazırlayalım.
          </p>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            <Link
              href="/urunler"
              className="px-6 py-3 bg-brand-500 hover:bg-brand-600 text-ink-900 rounded-lg text-sm font-semibold inline-flex items-center gap-2"
            >
              Hemen Sipariş Ver <ArrowRight size={14} weight="bold" />
            </Link>
            <Link
              href="/hizmetler/tasarim-destegi"
              className="px-6 py-3 border border-paper-100/30 text-paper-50 rounded-lg text-sm font-semibold hover:bg-white/5 inline-flex items-center gap-2"
            >
              Ücretsiz Tasarım Desteği
            </Link>
          </div>
        </section>
      </Container>
    </>
  );
}

function TemplateCard({ template }: { template: Template }) {
  const { name, size, formats, fileSize, desc } = template;
  return (
    <article className="flex flex-col p-5 bg-paper-50 border border-paper-200 rounded-xl hover:border-brand-300 transition-colors">
      <div className="flex items-start justify-between gap-3">
        <h3 className="font-semibold text-ink-900 leading-snug">{name}</h3>
        <div className="flex flex-wrap justify-end gap-1 shrink-0">
          {formats.map((f) => (
            <span
              key={f}
              className={`px-1.5 py-0.5 rounded border text-[11px] font-bold tracking-tight ${FORMAT_STYLES[f]}`}
            >
              {f}
            </span>
          ))}
        </div>
      </div>

      <div className="mt-2 flex items-center gap-2 text-xs text-ink-500">
        <span className="inline-flex items-center gap-1">
          <Ruler size={13} weight="fill" /> {size}
        </span>
        <span aria-hidden="true">·</span>
        <span className="tabular-nums">{fileSize}</span>
      </div>

      <p className="mt-2.5 text-sm text-ink-700 leading-relaxed">{desc}</p>

      <a
        href="#"
        className="mt-4 self-start inline-flex items-center gap-1.5 px-4 py-2 bg-brand-500 hover:bg-brand-600 text-ink-900 rounded-full text-sm font-semibold transition-colors"
      >
        <DownloadSimple size={15} weight="bold" /> İndir
      </a>

      <span className="sr-only">
        {name}, {size}, {formats.join(" ve ")} formatında, {fileSize}
      </span>
    </article>
  );
}
