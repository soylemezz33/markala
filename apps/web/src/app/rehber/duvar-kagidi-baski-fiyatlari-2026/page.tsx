import Link from "next/link";
import type { Metadata } from "next";
import { Container } from "@markala/ui";
import {
  FrameCorners,
  CheckCircle,
  Info,
  ArrowRight,
  Ruler,
  Wind,
  Warning,
} from "@phosphor-icons/react/dist/ssr";
import { getProductBySlug } from "@/lib/catalog";
import { getDisplayPrice } from "@/lib/configurator";
import { formatPriceWithSymbol } from "@/lib/format";
import { BreadcrumbJsonLd, ArticleJsonLd } from "@/components/seo/json-ld";
import { GuideFaqSection, asOfLabel } from "../_shared";

export const revalidate = 3600;

const PAGE_PATH = "/rehber/duvar-kagidi-baski-fiyatlari-2026";
const BASLIK = "Duvar Kağıdı Baskı Fiyatları 2026: Ölçü Alma ve m² Hesabı";

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: "Duvar Kağıdı Baskı Fiyatları 2026 | Özel Ölçü m² Fiyatı",
    description:
      "Özel tasarım duvar kağıdı baskı m² fiyatları 2026: duvar ölçüsü nasıl alınır, kaç m² çıkar, solvent mi UV mi, çözünürlük kaç olmalı? Örnek oda hesapları, KDV dahil.",
    alternates: { canonical: PAGE_PATH },
    openGraph: {
      type: "article",
      title: "Duvar Kağıdı Baskı Fiyatları 2026 | Ölçü Alma ve m² Hesabı",
      description:
        "Duvarını ölç, m²'ni bul, fiyatını gör. Solvent/UV farkı ve görsel çözünürlük rehberi.",
      url: PAGE_PATH,
      images: [{ url: "/og-default.png", width: 1200, height: 630, alt: BASLIK }],
    },
  };
}

/** Yaygın duvar senaryoları (cm). Fiyat DAİMA canlı m² fiyatından hesaplanır. */
const ODALAR = [
  { en: 250, boy: 250, ad: "Yatak odası, başucu duvarı" },
  { en: 350, boy: 260, ad: "Salon, TV arkası duvar" },
  { en: 400, boy: 280, ad: "Kafe / restoran, tek duvar" },
  { en: 600, boy: 300, ad: "Ofis, resepsiyon arkası" },
];

export default async function DuvarKagidiFiyatlariPage() {
  const urun = await getProductBySlug("duvar-kagidi-baski");
  if (!urun || getDisplayPrice(urun) <= 0) {
    throw new Error("rehber/duvar-kagidi: ürün fiyatsız/boş döndü (API blip?), stale ISR korunur");
  }
  const m2Ham = urun.displayPrice ?? 0;
  const m2 = getDisplayPrice(urun);
  const asOf = asOfLabel();

  const ornekler = ODALAR.map((o) => {
    const alan = (o.en * o.boy) / 10000;
    return { ...o, alan, tahmini: Math.ceil(Math.max(1, alan) * m2Ham) };
  });

  const faqs = [
    {
      q: "Duvar kağıdı m² fiyatı nasıl hesaplanır?",
      a: `Duvarın eni × yüksekliği metre cinsinden çarpılır ve m² birim fiyatıyla çarpılır. ${asOf} itibarıyla solvent baskıda m² ${formatPriceWithSymbol(m2)} (KDV dahil). Baskı tek parça değil, genellikle 100-150 cm genişliğinde şeritler hâlinde üretilir ve duvarda yan yana birleştirilir, bu birleştirme fiyata ek maliyet getirmez, m² hesabına dahildir.`,
    },
    {
      q: "Duvar ölçüsünü nasıl almalıyım?",
      a: "Duvarın en geniş noktasından enini, en yüksek noktasından yüksekliğini ölç. Zemin ve tavan çoğu binada tam düz değildir, bu yüzden üç noktadan ölçüp en büyüğünü al. Ölçüne her kenardan 5 cm pay ekle, uygulama sırasında hizalama için bu pay gerekir, fazlası kesilir. Priz, kapı ve pencere boşluklarını ölçüden düşme; baskı tam duvar olarak üretilir, boşluklar yerinde kesilir.",
    },
    {
      q: "Solvent baskı mı UV baskı mı seçmeliyim?",
      a: "Ev, yatak odası ve çocuk odası gibi kapalı ve az havalanan alanlarda UV baskı seç, kokusuzdur, uygulamadan hemen sonra odayı kullanabilirsin. Solvent baskının ilk günlerde hafif bir baskı kokusu olur ve havalandırma ister; buna karşılık daha ekonomiktir ve mağaza, kafe, ofis gibi geniş ve havalanan alanlarda tercih edilir.",
    },
    {
      q: "Görselimin çözünürlüğü kaç olmalı?",
      a: "Duvar kağıdı uzaktan bakılan bir üründür, bu yüzden kartvizit gibi 300 dpi gerekmez. Gerçek boyutunda 72-100 dpi yeterlidir. Pratik ölçüt şudur: 3 metre genişliğinde bir duvar için görselin en az 8.500 piksel genişliğinde olması gerekir. İnternetten indirilen küçük görseller büyütüldüğünde bulanıklaşır, dosyanı gönderdiğinde grafik ekibimiz ücretsiz kontrol edip uygun olup olmadığını söyler.",
    },
    {
      q: "Nasıl uygulanır, yapıştırıcı dahil mi?",
      a: "Baskı şeritler hâlinde ve yapışkansız gelir; duvara duvar kağıdı tutkalıyla uygulanır. Tutkal ürüne dahil değildir, yapı marketlerden temin edilir. Uygulama duvar kağıdı ustası işidir, özellikle desen birleşimi olan tasarımlarda şeritlerin hizalanması deneyim ister. Küçük ve düz renkli işleri kendiniz yapabilirsiniz.",
    },
    {
      q: "Duvarın hazır olması için ne gerekir?",
      a: "Yüzey düz, kuru ve temiz olmalı. Dökülen boya, kabaran alçı veya nem varsa duvar kağıdı kısa sürede kabarır, önce bunların giderilmesi gerekir. Yeni sıva yapılmışsa en az 3-4 hafta kuruması beklenmelidir. Parlak yağlı boya üzerine doğrudan uygulanmaz, zımparalanması gerekir.",
    },
    {
      q: "Fiyatlara KDV dahil mi?",
      a: "Evet. Bu sayfadaki ve ürün sayfasındaki tüm m² fiyatları KDV dahildir, sepette değişmez.",
    },
  ];

  return (
    <>
      <BreadcrumbJsonLd
        items={[
          { name: "Anasayfa", href: "/" },
          { name: "Duvar Kağıdı Baskı Fiyatları 2026", href: PAGE_PATH },
        ]}
      />
      <ArticleJsonLd
        title={BASLIK}
        description="Özel ölçü duvar kağıdı baskıda m² hesabı, ölçü alma yöntemi, solvent/UV farkı ve çözünürlük rehberi."
        url={PAGE_PATH}
        datePublished="2026-08-28"
      />

      <div className="bg-paper-100 border-b border-paper-200">
        <Container className="py-12 md:py-16 max-w-3xl">
          <div className="flex items-center gap-2 mb-3">
            <FrameCorners size={20} weight="fill" className="text-brand-700" />
            <span className="text-sm font-semibold text-brand-700 uppercase tracking-wider">
              Fiyat Rehberi
            </span>
          </div>
          <h1 className="text-3xl md:text-5xl font-semibold text-ink-900 leading-tight">
            Duvar kağıdı baskı fiyatları 2026: ölçü al, m²&apos;ni bul
          </h1>
          <p className="mt-4 text-lg text-ink-700">
            Duvarının tam ölçüsünde, istediğin görselle üretilir. {asOf} itibarıyla{" "}
            <strong className="text-ink-900">{formatPriceWithSymbol(m2)}/m²</strong>&apos;den
            başlar, KDV dahil, sepette değişmez.
          </p>
          <div className="mt-6 flex flex-wrap items-center gap-3 text-sm">
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-success/15 text-success rounded-full font-medium">
              <CheckCircle size={13} weight="fill" /> KDV dahil
            </span>
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-brand-100 text-brand-900 rounded-full font-medium">
              <Ruler size={13} weight="fill" /> tam duvar ölçüsü
            </span>
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-paper-200 text-ink-900 rounded-full font-medium">
              <Wind size={13} weight="fill" /> UV baskıda koku yok
            </span>
          </div>
        </Container>
      </div>

      <Container className="py-10 md:py-14 max-w-4xl">
        {/* Ölçü alma — bu sayfanın asıl değeri */}
        <section>
          <h2 className="text-2xl font-semibold text-ink-900">Duvar ölçüsü nasıl alınır?</h2>
          <p className="mt-2 text-sm text-ink-700 max-w-3xl">
            Yanlış ölçü, duvar kağıdı siparişinde en sık yapılan hatadır. Üç kural yeterli:
          </p>
          <ol className="mt-5 space-y-3 text-sm text-ink-700">
            <li className="flex gap-2">
              <CheckCircle size={16} weight="fill" className="text-success shrink-0 mt-0.5" />
              <span>
                <strong className="text-ink-900">Üç noktadan ölç, en büyüğünü al.</strong> Zemin ve
                tavan çoğu binada tam düz değildir; solda 258 cm, ortada 260 cm, sağda 259 cm
                çıkabilir. 260&apos;ı kullan.
              </span>
            </li>
            <li className="flex gap-2">
              <CheckCircle size={16} weight="fill" className="text-success shrink-0 mt-0.5" />
              <span>
                <strong className="text-ink-900">Her kenardan 5 cm pay ekle.</strong> Uygulama
                sırasında hizalama payı gerekir; fazlası duvarda kesilir. 350×260 cm bir duvar için
                360×270 cm sipariş et.
              </span>
            </li>
            <li className="flex gap-2">
              <CheckCircle size={16} weight="fill" className="text-success shrink-0 mt-0.5" />
              <span>
                <strong className="text-ink-900">Priz ve pencereyi düşme.</strong> Baskı tam duvar
                olarak üretilir; boşluklar yerinde kesilir. Ölçüden düşersen desen kayar.
              </span>
            </li>
          </ol>
          <p className="mt-4 flex gap-2 text-xs text-ink-500">
            <Warning size={14} weight="fill" className="shrink-0 mt-0.5 text-warning" />
            <span>
              Duvarda nem, kabaran alçı veya dökülen boya varsa duvar kağıdı kısa sürede kabarır.
              Yeni sıva yapıldıysa en az 3-4 hafta kurumasını bekle.
            </span>
          </p>
        </section>

        {/* Örnek oda hesapları */}
        <section className="mt-14">
          <h2 className="text-2xl font-semibold text-ink-900">
            Örnek oda hesapları ({asOf} itibarıyla)
          </h2>
          <p className="mt-2 text-sm text-ink-500">
            Solvent baskı, KDV dahil yaklaşık toplam. Ölçüler pay eklenmeden verilmiştir.
          </p>
          <div className="mt-5 overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-paper-200 text-left text-ink-500">
                  <th className="py-2.5 pr-4 font-medium">Duvar</th>
                  <th className="py-2.5 pr-4 font-medium">Ölçü</th>
                  <th className="py-2.5 pr-4 font-medium">Alan</th>
                  <th className="py-2.5 font-medium text-right">Yaklaşık</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-paper-200/70">
                {ornekler.map((e) => (
                  <tr key={e.ad}>
                    <td className="py-2.5 pr-4 text-ink-700">{e.ad}</td>
                    <td className="py-2.5 pr-4 font-medium text-ink-900 whitespace-nowrap">
                      {e.en} × {e.boy} cm
                    </td>
                    <td className="py-2.5 pr-4 text-ink-700 whitespace-nowrap tabular-nums">
                      {e.alan.toLocaleString("tr-TR", { maximumFractionDigits: 2 })} m²
                    </td>
                    <td className="py-2.5 text-right font-semibold text-ink-900 tabular-nums whitespace-nowrap">
                      {formatPriceWithSymbol(e.tahmini)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* Solvent / UV */}
        <section className="mt-14">
          <h2 className="text-2xl font-semibold text-ink-900">Solvent mi UV mi?</h2>
          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <div className="rounded-lg border border-paper-200 bg-paper-50 p-5">
              <h3 className="font-semibold text-ink-900">Solvent baskı: ekonomik</h3>
              <p className="mt-2 text-sm text-ink-700">
                Mağaza, kafe, ofis gibi geniş ve havalanan alanlar için. İlk günlerde hafif baskı
                kokusu olur, havalandırma ister. m² fiyatı daha düşüktür.
              </p>
            </div>
            <div className="rounded-lg border border-paper-200 bg-paper-50 p-5">
              <h3 className="font-semibold text-ink-900">UV baskı: kokusuz</h3>
              <p className="mt-2 text-sm text-ink-700">
                Yatak odası, çocuk odası ve az havalanan kapalı alanlar için. Uygulamadan hemen
                sonra oda kullanılabilir. Renkler bir tık daha canlıdır.
              </p>
            </div>
          </div>
        </section>

        {/* Çözünürlük */}
        <section className="mt-14">
          <div className="rounded-xl border border-paper-200 bg-paper-100/60 p-6">
            <h2 className="text-xl font-semibold text-ink-900">
              Görselin yeterli mi? Hızlı kontrol
            </h2>
            <p className="mt-3 text-sm text-ink-700 max-w-3xl">
              Duvar kağıdı uzaktan bakılır, bu yüzden 300 dpi gerekmez,{" "}
              <strong>gerçek boyutunda 72-100 dpi yeterlidir</strong>. Pratik ölçüt:{" "}
              <strong>duvar genişliği (metre) × 2.800 = gereken piksel genişliği.</strong> 3 metrelik
              bir duvar için görselin en az 8.400 piksel geniş olması gerekir.
            </p>
            <p className="mt-3 text-sm text-ink-700 max-w-3xl">
              İnternetten indirilen küçük görseller büyütüldüğünde bulanıklaşır. Dosyanı
              gönderdiğinde grafik ekibimiz ücretsiz kontrol eder ve yeterli olup olmadığını
              baskıdan önce söyler.
            </p>
          </div>
        </section>

        <GuideFaqSection items={faqs} url={PAGE_PATH} />

        <section className="mt-14 rounded-xl border border-paper-200 bg-paper-50 p-6 md:p-8">
          <h2 className="text-xl font-semibold text-ink-900">Ölçünü gir, fiyatı anında gör</h2>
          <p className="mt-2 text-sm text-ink-700 max-w-2xl">
            Ürün sayfasında duvarının en ve boyunu cm cinsinden yazdığında KDV dahil fiyat anında
            hesaplanır.
          </p>
          <div className="mt-5 flex flex-wrap gap-3">
            <Link
              href="/urun/duvar-kagidi-baski"
              className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-lg bg-brand-500 text-ink-900 text-sm font-bold hover:bg-brand-400 transition-colors"
            >
              Duvar kağıdı fiyatı hesapla <ArrowRight size={15} weight="bold" />
            </Link>
            <Link
              href="/rehber/kanvas-tablo-baski-fiyatlari-2026"
              className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-lg border border-paper-200 text-sm font-semibold text-ink-900 hover:bg-paper-100 transition-colors"
            >
              Kanvas tablo rehberi
            </Link>
          </div>
        </section>
      </Container>
    </>
  );
}
