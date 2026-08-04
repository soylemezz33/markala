import Link from "next/link";
import type { Metadata } from "next";
import { Container } from "@markala/ui";
import {
  Stamp,
  CheckCircle,
  Info,
  ArrowRight,
  Lightning,
  WhatsappLogo,
} from "@phosphor-icons/react/dist/ssr";
import { getCategoryBySlug } from "@/lib/catalog";
import { BreadcrumbJsonLd, ArticleJsonLd } from "@/components/seo/json-ld";
import { GuideFaqSection } from "../_shared";

// Kategori bilgisi (üretim süresi) canlı katalogdan SSR — saatte bir tazelenir.
export const revalidate = 3600;

const PAGE_PATH = "/rehber/kase-yaptirma-rehberi";

export const metadata: Metadata = {
  title: "Kaşe Yaptırma Rehberi — Otomatik Kaşe mi, Cep Kaşesi mi? (2026)",
  description:
    "Kaşe yaptırırken bilmen gerekenler: Trodat, Shiny ve Colop farkları, yuvarlak/dikdörtgen ebat seçimi, kaşede bulunması gereken bilgiler ve 24 saatte teslim süreci.",
  alternates: { canonical: PAGE_PATH },
  openGraph: {
    type: "article",
    title: "Kaşe Yaptırma Rehberi — Doğru Kaşeyi Seçmenin Yolu",
    description:
      "Otomatik kaşe, cep kaşesi ve klasik kaşe farkları; ebat seçimi ve kaşe içeriği rehberi.",
    url: PAGE_PATH,
    images: [{ url: "/og-default.png", width: 1200, height: 630, alt: "Kaşe Yaptırma Rehberi" }],
  },
};

/** Kaşe tipleri — mekanizma/kullanım farkları (statik bilgi, fiyat değil). */
const STAMP_TYPES = [
  {
    name: "Otomatik kaşe",
    brands: "Trodat Printy, Shiny, Colop Printer serileri",
    desc: "Mürekkep tamponu gövdenin içindedir; basıldığında klişe kendiliğinden döner. Günde onlarca evrak kaşeleyen ofisler için standart tercih — stampa gerektirmez, çanta ve cepte taşınabilir.",
    ideal: "Muhasebe, ön muhasebe, kargo-irsaliye yoğun ofisler",
  },
  {
    name: "Cep kaşesi",
    brands: "Trodat Mobile Printy, Colop Pocket",
    desc: "Kapaklı ince gövdesiyle cebe ve kartvizitliğe sığar. Saha satışı, kurye teslimatı ve dışarıda sözleşme imzalayan herkes için pratik çözüm.",
    ideal: "Saha ekipleri, serbest meslek, avukat ve mali müşavirler",
  },
  {
    name: "Klasik (stampalı) kaşe",
    brands: "Ahşap veya plastik gövde + ayrı stampa",
    desc: "En ekonomik seçenek; mürekkep ayrı stampadan alınır. Az kullanılan yedek kaşeler ve büyük ebatlı özel klişeler için hâlâ geçerli bir tercih.",
    ideal: "Yedek kaşe, düşük kullanım sıklığı, büyük özel ebatlar",
  },
];

/** Yaygın ebatlar — sektörde standartlaşmış klişe ölçüleri (üretici kataloglarından). */
const SIZES = [
  { size: "38×14 mm", use: "Tek-iki satır: ad-soyad, 'ASLI GİBİDİR', tarih kaşesi" },
  { size: "47×18 mm", use: "En yaygın firma kaşesi: unvan + adres + vergi bilgisi (3-4 satır)" },
  { size: "58×22 mm", use: "Uzun unvanlı şirketler, çok satırlı bilgi (5-6 satır)" },
  { size: "Ø 40-42 mm (yuvarlak)", use: "Dernek, kooperatif, resmi kurum ve mühür tarzı kaşeler" },
];

export default async function KaseYaptirmaRehberiPage() {
  // Üretim süresi canlı kategoriden — kategori henüz ürünsüzse bile bilgi alanları dolu gelir.
  const kaseCategory = await getCategoryBySlug("kase");
  const productionTime = kaseCategory?.productionTime || "24 saat";

  const faqs = [
    {
      q: "Kaşede hangi bilgiler bulunmalı?",
      a: "Ticari kaşede yaygın içerik: firma unvanı, adres, vergi dairesi + vergi numarası (veya TC kimlik no), telefon ve varsa mersis/ticaret sicil numarası. Şahıs firmalarında ad-soyad ve vergi bilgisi yeterlidir. E-fatura kullanan firmalar kaşeye e-posta/KEP adresi de ekletebilir.",
    },
    {
      q: "Kaşe kaç günde teslim edilir?",
      a: `Klişe onayından sonra üretim süresi ${productionTime}; kargo Türkiye geneli 1-3 iş günü sürer. Mersin içinde elden teslim de mümkündür.`,
    },
    {
      q: "Otomatik kaşe mi klasik kaşe mi almalıyım?",
      a: "Günde 10'dan fazla evrak kaşeliyorsan otomatik kaşe zaman kazandırır ve eli boyamaz. Nadiren kullanacağın yedek bir kaşe için klasik (stampalı) model daha ekonomiktir.",
    },
    {
      q: "Kaşe tasarımını siz mi hazırlıyorsunuz?",
      a: "Evet — bilgilerini gönder, klişe düzenini ücretsiz hazırlayıp onayına sunuyoruz. Logo eklemek istersen vektörel (PDF/AI/SVG) dosya tercih edilir; yoksa mevcut kaşenin net fotoğrafından da çalışabiliriz.",
    },
    {
      q: "Yıpranan kaşemin sadece klişesini değiştirebilir miyim?",
      a: "Evet. Gövdesi sağlam Trodat/Shiny/Colop kaşelerde yalnız lastik klişe ve tampon değişimi yapılır — yeni kaşe almaktan daha ekonomiktir.",
    },
  ];

  return (
    <>
      <BreadcrumbJsonLd
        items={[
          { name: "Anasayfa", href: "/" },
          { name: "Kaşe Yaptırma Rehberi", href: PAGE_PATH },
        ]}
      />
      <ArticleJsonLd
        title="Kaşe Yaptırma Rehberi — Otomatik Kaşe mi, Cep Kaşesi mi?"
        description="Trodat, Shiny ve Colop kaşe farkları, ebat seçimi ve kaşede bulunması gereken bilgiler."
        url={PAGE_PATH}
        datePublished="2026-08-04"
      />

      {/* Hero */}
      <div className="bg-paper-100 border-b border-paper-200">
        <Container className="py-12 md:py-16 max-w-3xl">
          <div className="flex items-center gap-2 mb-3">
            <Stamp size={20} weight="fill" className="text-brand-700" />
            <span className="text-sm font-semibold text-brand-700 uppercase tracking-wider">
              Seçim Rehberi
            </span>
          </div>
          <h1 className="text-3xl md:text-5xl font-semibold text-ink-900 leading-tight">
            Kaşe yaptırma rehberi: doğru kaşeyi seç
          </h1>
          <p className="mt-4 text-lg text-ink-700">
            Otomatik kaşe mi, cep kaşesi mi, klasik mi? Trodat, Shiny ve Colop gövdelerle{" "}
            <strong className="text-ink-900">{productionTime}</strong> içinde üretiyoruz. Bu
            rehberde tip, ebat ve içerik seçimini netleştir; bilgilerini gönder, klişeni ücretsiz
            hazırlayalım.
          </p>
          <div className="mt-6 flex flex-wrap items-center gap-3 text-sm">
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-success/15 text-success rounded-full font-medium">
              <CheckCircle size={13} weight="fill" /> {productionTime} içinde üretim
            </span>
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-brand-100 text-brand-900 rounded-full font-medium">
              <CheckCircle size={13} weight="fill" /> Ücretsiz klişe tasarımı
            </span>
          </div>
        </Container>
      </div>

      <Container className="py-10 md:py-14 max-w-4xl">
        {/* Kaşe tipleri */}
        <section>
          <h2 className="text-2xl font-semibold text-ink-900">Kaşe tipleri: hangisi sana göre?</h2>
          <div className="mt-5 space-y-4">
            {STAMP_TYPES.map((t) => (
              <article key={t.name} className="p-5 bg-paper-50 border border-paper-200 rounded-xl">
                <h3 className="font-semibold text-ink-900">{t.name}</h3>
                <p className="mt-1 text-xs text-ink-500">{t.brands}</p>
                <p className="mt-3 text-sm text-ink-700 leading-relaxed">{t.desc}</p>
                <p className="mt-2 text-sm">
                  <span className="font-medium text-brand-700">İdeal kullanım:</span>{" "}
                  <span className="text-ink-700">{t.ideal}</span>
                </p>
              </article>
            ))}
          </div>
        </section>

        {/* Ebat tablosu */}
        <section className="mt-14">
          <h2 className="text-2xl font-semibold text-ink-900">Ebat seçimi</h2>
          <p className="mt-2 text-sm text-ink-500">
            Sektörde standartlaşmış klişe ölçüleri — satır sayına göre seç.
          </p>
          <div className="mt-5 overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-paper-200 text-left text-xs font-semibold text-ink-500 uppercase tracking-wider">
                  <th className="px-3 py-2.5">Ebat</th>
                  <th className="px-3 py-2.5">Tipik kullanım</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-paper-100">
                {SIZES.map((s) => (
                  <tr key={s.size} className="hover:bg-paper-50">
                    <td className="px-3 py-3 font-medium text-ink-900 whitespace-nowrap">{s.size}</td>
                    <td className="px-3 py-3 text-ink-700">{s.use}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* Sipariş süreci — dürüst akış (katalog yerine teklif akışı) */}
        <section className="mt-14 p-5 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-3">
          <Info size={20} weight="fill" className="text-amber-700 shrink-0 mt-0.5" />
          <div className="text-sm text-amber-900 leading-relaxed">
            <strong>Kaşe siparişi nasıl işler?</strong> Kaşe kişiye/firmaya özel klişe üretimi
            olduğu için sipariş teklif akışıyla ilerler: bilgilerini{" "}
            <Link href="/teklif-al" className="font-semibold underline">
              teklif formundan
            </Link>{" "}
            veya WhatsApp&apos;tan gönder → klişe önizlemesini onayla → {productionTime} içinde
            üretilir, kargoya verilir.
          </div>
        </section>

        {/* SSS + FAQPage JSON-LD */}
        <GuideFaqSection items={faqs} url={PAGE_PATH} />

        {/* CTA */}
        <section className="mt-14 p-8 md:p-12 bg-ink-900 text-paper-50 rounded-2xl text-center">
          <Lightning size={28} weight="fill" className="text-brand-400 mx-auto mb-3" />
          <h2 className="text-2xl md:text-3xl font-semibold">Kaşeni bugün sipariş et</h2>
          <p className="mt-3 text-paper-100/70 max-w-xl mx-auto">
            Bilgilerini gönder, klişe önizlemeni ücretsiz hazırlayalım — onayından sonra{" "}
            {productionTime} içinde üretimde.
          </p>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            <Link
              href="/teklif-al"
              className="px-6 py-3 bg-brand-500 hover:bg-brand-600 text-ink-900 rounded-lg text-sm font-semibold inline-flex items-center gap-2"
            >
              Kaşe Teklifi Al <ArrowRight size={14} weight="bold" />
            </Link>
            <a
              href={`https://wa.me/905319004102?text=${encodeURIComponent("Merhaba, kaşe yaptırmak istiyorum.")}`}
              target="_blank"
              rel="noopener noreferrer"
              className="px-6 py-3 bg-[#25D366] hover:bg-[#1FB358] text-white rounded-lg text-sm font-semibold inline-flex items-center gap-2"
            >
              <WhatsappLogo size={14} weight="fill" /> WhatsApp&apos;tan Gönder
            </a>
            <Link
              href="/kategori/kase"
              className="px-6 py-3 border border-paper-100/30 text-paper-50 rounded-lg text-sm font-semibold hover:bg-white/5 inline-flex items-center gap-2"
            >
              Kaşe Kategorisi
            </Link>
          </div>
        </section>
      </Container>
    </>
  );
}
