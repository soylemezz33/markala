import Link from "next/link";
import type { Metadata } from "next";
import { Container } from "@markala/ui";
import {
  FrameCorners,
  CheckCircle,
  Info,
  ArrowRight,
  Ruler,
  Scissors,
  Eye,
} from "@phosphor-icons/react/dist/ssr";
import { getProductBySlug } from "@/lib/catalog";
import { getDisplayPrice } from "@/lib/configurator";
import { formatPriceWithSymbol } from "@/lib/format";
import { BreadcrumbJsonLd, ArticleJsonLd } from "@/components/seo/json-ld";
import { GuideFaqSection, asOfLabel } from "../_shared";

export const revalidate = 3600;

const PAGE_PATH = "/rehber/folyo-baski-fiyatlari-2026";
const BASLIK = "Folyo Baskı Fiyatları 2026: Çeşitleri, Baskes ve One Way Vision";

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: "Folyo Baskı Fiyatları 2026 | Hangi Folyo, m² Kaç TL?",
    description:
      "2026 güncel folyo baskı m² fiyatları: normal, mat, şeffaf, arkası gri, kumlama, laminasyonlu, reflektif ve lümen folyo farkları. Baskes (kontür kesim) ve One Way Vision ne zaman kullanılır? KDV dahil.",
    alternates: { canonical: PAGE_PATH },
    openGraph: {
      type: "article",
      title: "Folyo Baskı Fiyatları 2026 | Çeşitleri ve m² Hesabı",
      description:
        "Dokuz folyo türü, baskes kontür kesim ve one way vision arasındaki farklar; canlı m² fiyatlarıyla.",
      url: PAGE_PATH,
      images: [{ url: "/og-default.png", width: 1200, height: 630, alt: BASLIK }],
    },
  };
}

/** Folyo türleri — hangi iş için. Fiyat canlı katalogdan, burada YAZILMAZ. */
const TURLER = [
  { ad: "Normal Folyo", href: "/urun/kesim-folyo", ne: "Standart beyaz yapışkanlı folyo. Vitrin yazısı, tabela kaplaması ve genel amaçlı kullanımın çoğu bununla yapılır." },
  { ad: "Mat Folyo", href: "/urun/kesim-folyo", ne: "Parlama yapmaz. Işık altında okunacak yönlendirme ve iç mekan uygulamalarında yansıma sorununu çözer." },
  { ad: "Şeffaf Folyo", href: "/urun/seffaf-folyo", ne: "Cam üstüne uygulanır, arkası görünür. Vitrin camına yazı ve logo giydirmede kullanılır." },
  { ad: "Arkası Gri Folyo", href: "/urun/kesim-folyo", ne: "Arka yüzü gri olduğu için ışık geçirmez. Altındaki eski yazı veya renk görünmesin isteniyorsa bu tercih edilir." },
  { ad: "Arkası Gri Mat Folyo", href: "/urun/kesim-folyo", ne: "Hem ışık geçirmez hem parlama yapmaz. Üstü kaplanacak eski tabelalarda en güvenli seçim." },
  { ad: "Kumlama Folyo", href: "/urun/kumlama-buzlu-cam-folyosu", ne: "Buzlu cam görünümü verir. Ofis bölme camları, toplantı odası ve banyo camlarında mahremiyet sağlar." },
  { ad: "Laminasyonlu Folyo", href: "/urun/laminasyonlu-folyo", ne: "Üzeri koruyucu filmle kaplanır. Elle temas eden, çizilme riski olan yüzeylerde ömrü uzatır." },
  { ad: "Reflektif Folyo", href: "/urun/reflektif-folyo", ne: "Işığı geri yansıtır. Gece görünürlüğü gereken araç, güvenlik ve yol uygulamalarında kullanılır." },
  { ad: "Lümen Folyo", href: "/urun/lumen-folyo", ne: "Gün ışığında şarj olur, karanlıkta parlar. Acil çıkış ve yangın yönlendirmelerinde zorunlu olarak aranır." },
];

export default async function FolyoBaskiFiyatlariPage() {
  // Taban fiyat kaynağı "folyo-cesitleri" (toplayıcı ürün) DEĞİL: 2026-09-03'te pasife
  // alındı (10 folyo türü ayrı ürünlere bölündüğü için — bkz. next.config.mjs redirect
  // notu). "kesim-folyo" bu türlerin dördünü (normal/mat/arkası gri/arkası gri mat)
  // taşıyan, en ekonomik ve hâlâ AKTİF üründür; sayfanın "en ekonomik folyo" iddiasıyla
  // tutarlı taban fiyat kaynağı budur.
  const [folyo, baskes, owv] = await Promise.all([
    getProductBySlug("kesim-folyo"),
    getProductBySlug("baskes-folyo"),
    getProductBySlug("one-way-vision-baski"),
  ]);
  // Fiyatsız/boş dönerse THROW — ISR son başarılı sayfayı korur, uydurma fiyat yayınlanmaz.
  if (!folyo || getDisplayPrice(folyo) <= 0) {
    throw new Error("rehber/folyo: Kesim Folyo fiyatsız/boş döndü (API blip?), stale ISR korunur");
  }
  const m2Ham = folyo.displayPrice ?? 0;
  const m2 = getDisplayPrice(folyo);
  const baskesM2 = baskes ? getDisplayPrice(baskes) : 0;
  const owvM2 = owv ? getDisplayPrice(owv) : 0;

  const asOf = asOfLabel();

  const ORNEK = [
    { en: 50, boy: 30, kullanim: "Kapı camı yazısı, çalışma saati" },
    { en: 100, boy: 50, kullanim: "Vitrin kampanya yazısı" },
    { en: 200, boy: 100, kullanim: "Mağaza cephesi cam giydirme" },
    { en: 300, boy: 200, kullanim: "Ofis bölme camı kumlama" },
  ].map((s) => {
    const alan = (s.en * s.boy) / 10000;
    return { ...s, alan, tahmini: Math.ceil(Math.max(1, alan) * m2Ham) };
  });

  const faqs = [
    {
      q: "Folyo baskı m² fiyatı nasıl hesaplanır?",
      a: `En × boy ölçüsünden alan bulunur ve seçtiğin folyo türünün m² birim fiyatıyla çarpılır. ${asOf} itibarıyla en ekonomik folyoda m² fiyatı ${formatPriceWithSymbol(m2)} (KDV dahil). Hesaplama minimum 1 m² üzerinden yapılır; 0,3 m²'lik küçük bir kapı yazısı da 1 m² fiyatıyla hesaplanır, çünkü kesim ve tezgâh hazırlığı ebattan bağımsız sabit maliyettir.`,
    },
    {
      q: "Baskes folyo ile normal folyo arasındaki fark ne?",
      a: `Normal folyoda baskı dikdörtgen bir parça hâlinde çıkar; yazının etrafında folyonun kendi zemini kalır. Baskes'te ise baskı yapıldıktan sonra tasarımın konturu boyunca kesilir, logo, yazı ve özel formlar arka fon olmadan tek parça çıkar, cama yapıştırıldığında sadece harfler görünür. Uygulama bandı (transfer tape) ile bütün hâlinde tek seferde yapıştırılır. ${baskesM2 > 0 ? `Baskes m² fiyatı ${formatPriceWithSymbol(baskesM2)}'den başlar.` : ""} 7 cm'den küçük parçalarda ek kesim ücreti uygulanır.`,
    },
    {
      q: "One Way Vision nedir, ne zaman kullanılır?",
      a: `Delikli yapıya sahip özel bir folyodur: dışarıdan bakıldığında baskı görünür, içeriden bakıldığında cam şeffaf kalır ve gün ışığı içeri girer. Mağaza vitrini, araç arka camı ve ofis camlarında reklam alanı kazandırırken içerinin görüşünü ve aydınlığını kapatmaz. ${owvM2 > 0 ? `m² fiyatı ${formatPriceWithSymbol(owvM2)}'den başlar.` : ""}`,
    },
    {
      q: "Solvent baskı mı UV baskı mı seçmeliyim?",
      a: "Solvent baskı ekonomiktir ve dış mekana dayanıklıdır; cephe, vitrin ve araç uygulamalarının çoğunda bu yeterlidir. UV baskı kokusuzdur ve renkleri daha canlı verir, kapalı ofis, hastane, okul gibi baskı kokusunun rahatsız edeceği iç mekanlarda tercih edilir. Aynı folyo türünde UV baskının m² fiyatı solventten yüksektir.",
    },
    {
      q: "Laminasyon gerekli mi?",
      a: "Elle temas edilen, silinen veya çizilme riski olan yüzeylerde gerekir: asansör kapısı, tezgâh önü, alçak vitrin, araç kapısı. Yüksekte duran ve dokunulmayan bir cephe yazısında gerekmez. Laminasyon ürün sayfasında ek işlem olarak seçilir ve fiyata sabit tutar olarak eklenir.",
    },
    {
      q: "Folyo cama nasıl uygulanır, montaj dahil mi?",
      a: "Folyolar uygulama bandıyla, cam sabunlu suyla ıslatılarak yapıştırılır; küçük işleri kendiniz uygulayabilirsiniz. Baskes işlerinde tüm harfler tek bandın üzerinde geldiği için hizalama sorunu yaşamazsınız. Fiyatlar üretim ve kargo içindir, yerinde montaj ayrı bir hizmettir, ihtiyaç varsa sipariş öncesi bize yazın.",
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
          { name: "Folyo Baskı Fiyatları 2026", href: PAGE_PATH },
        ]}
      />
      <ArticleJsonLd
        title={BASLIK}
        description="Dokuz folyo türünün farkları, baskes kontür kesim, one way vision ve m² fiyat hesabı."
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
            Folyo baskı fiyatları 2026: hangi folyo, ne zaman?
          </h1>
          <p className="mt-4 text-lg text-ink-700">
            Folyo serbest ölçüyle üretilir ve m² üzerinden fiyatlanır. {asOf} itibarıyla en
            ekonomik türde{" "}
            <strong className="text-ink-900">{formatPriceWithSymbol(m2)}/m²</strong>&apos;den
            başlar, KDV dahil, sepette değişmez.
          </p>
          <div className="mt-6 flex flex-wrap items-center gap-3 text-sm">
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-success/15 text-success rounded-full font-medium">
              <CheckCircle size={13} weight="fill" /> KDV dahil
            </span>
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-brand-100 text-brand-900 rounded-full font-medium">
              <Ruler size={13} weight="fill" /> cm bazında serbest ölçü
            </span>
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-paper-200 text-ink-900 rounded-full font-medium">
              <Scissors size={13} weight="fill" /> kontür kesim seçeneği
            </span>
          </div>
        </Container>
      </div>

      <Container className="py-10 md:py-14 max-w-4xl">
        {/* Folyo türleri */}
        <section>
          <h2 className="text-2xl font-semibold text-ink-900">Dokuz folyo türü ve kullanım yeri</h2>
          <p className="mt-2 text-sm text-ink-500">
            Hepsi aynı üründe seçilebilir; m² birim fiyatları türe göre değişir.
          </p>
          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            {TURLER.map((t) => (
              <div key={t.ad} className="rounded-lg border border-paper-200 bg-paper-50 p-4">
                <h3 className="font-semibold text-sm">
                  <Link href={t.href} className="text-ink-900 hover:text-brand-600 transition-colors">
                    {t.ad}
                  </Link>
                </h3>
                <p className="mt-1.5 text-sm text-ink-700 leading-relaxed">{t.ne}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Baskes vs düz */}
        <section className="mt-14">
          <h2 className="text-2xl font-semibold text-ink-900">
            Düz folyo mu, baskes (kontür kesim) mi?
          </h2>
          <p className="mt-3 text-sm text-ink-700 max-w-3xl">
            Bu, folyo siparişinde en sık karıştırılan konu ve fiyat farkının asıl sebebi.
          </p>
          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <div className="rounded-lg border border-paper-200 bg-paper-50 p-5">
              <h3 className="font-semibold text-ink-900">Düz folyo baskı</h3>
              <p className="mt-2 text-sm text-ink-700">
                Baskı dikdörtgen bir parça hâlinde gelir; yazının etrafında folyonun zemini durur.
                Tam alanı kaplayan görsel giydirmelerde doğru tercihtir.
              </p>
              <p className="mt-3 text-sm font-semibold text-ink-900">
                {formatPriceWithSymbol(m2)}/m²&apos;den
              </p>
            </div>
            <div className="rounded-lg border border-paper-200 bg-paper-50 p-5">
              <h3 className="font-semibold text-ink-900">Baskes: baskı + kontür kesim</h3>
              <p className="mt-2 text-sm text-ink-700">
                Baskı, tasarımın konturu boyunca kesilir. Logo ve yazılar arka fon olmadan tek
                parça çıkar; cama yapıştırıldığında sadece harfler görünür.
              </p>
              {baskesM2 > 0 && (
                <p className="mt-3 text-sm font-semibold text-ink-900">
                  {formatPriceWithSymbol(baskesM2)}/m²&apos;den
                </p>
              )}
            </div>
          </div>
          <p className="mt-4 flex gap-2 text-xs text-ink-500">
            <Info size={14} weight="fill" className="shrink-0 mt-0.5 text-brand-700" />
            <span>
              Baskes&apos;te 7 cm&apos;den küçük parçalarda ek kesim ücreti uygulanır, çok sayıda
              minik harf, kesim süresini orantısız uzatır.
            </span>
          </p>
        </section>

        {/* One Way Vision */}
        {owvM2 > 0 && (
          <section className="mt-14">
            <div className="rounded-xl border border-paper-200 bg-paper-100/60 p-6">
              <div className="flex items-center gap-2">
                <Eye size={20} weight="fill" className="text-brand-700" />
                <h2 className="text-xl font-semibold text-ink-900">
                  One Way Vision: dışarıdan reklam, içeriden manzara
                </h2>
              </div>
              <p className="mt-3 text-sm text-ink-700 max-w-3xl">
                Delikli yapısı sayesinde dışarıdan bakan baskıyı görür, içeriden bakan camı şeffaf
                görür. Vitrini kapatmadan reklam alanı kazandırır; mağaza camı ve araç arka camında
                en çok tercih edilen çözümdür. {formatPriceWithSymbol(owvM2)}/m²&apos;den başlar.
              </p>
              <Link
                href="/urun/one-way-vision-baski"
                className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-brand-700 hover:text-brand-900"
              >
                One Way Vision fiyatı hesapla <ArrowRight size={14} weight="bold" />
              </Link>
            </div>
          </section>
        )}

        {/* Örnek hesap */}
        <section className="mt-14">
          <h2 className="text-2xl font-semibold text-ink-900">
            Örnek hesap tablosu ({asOf} itibarıyla)
          </h2>
          <p className="mt-2 text-sm text-ink-500">
            En ekonomik folyo türüyle yaklaşık toplam, KDV dahil.
          </p>
          <div className="mt-5 overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-paper-200 text-left text-ink-500">
                  <th className="py-2.5 pr-4 font-medium">Ebat</th>
                  <th className="py-2.5 pr-4 font-medium">Alan</th>
                  <th className="py-2.5 pr-4 font-medium">Tipik kullanım</th>
                  <th className="py-2.5 font-medium text-right">Yaklaşık</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-paper-200/70">
                {ORNEK.map((e) => (
                  <tr key={`${e.en}x${e.boy}`}>
                    <td className="py-2.5 pr-4 font-medium text-ink-900 whitespace-nowrap">
                      {e.en} × {e.boy} cm
                    </td>
                    <td className="py-2.5 pr-4 text-ink-700 whitespace-nowrap tabular-nums">
                      {e.alan.toLocaleString("tr-TR", { maximumFractionDigits: 2 })} m²
                      {e.alan < 1 && <span className="text-ink-500"> → 1 m²</span>}
                    </td>
                    <td className="py-2.5 pr-4 text-ink-700">{e.kullanim}</td>
                    <td className="py-2.5 text-right font-semibold text-ink-900 tabular-nums whitespace-nowrap">
                      {formatPriceWithSymbol(e.tahmini)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <GuideFaqSection items={faqs} url={PAGE_PATH} />

        <section className="mt-14 rounded-xl border border-paper-200 bg-paper-50 p-6 md:p-8">
          <h2 className="text-xl font-semibold text-ink-900">Ölçünü gir, fiyatı anında gör</h2>
          <p className="mt-2 text-sm text-ink-700 max-w-2xl">
            Folyo ürün sayfasında en ve boyu cm cinsinden yazdığında, seçtiğin türe ve baskı
            tipine göre KDV dahil fiyat anında hesaplanır.
          </p>
          <div className="mt-5 flex flex-wrap gap-3">
            <Link
              // "folyo-cesitleri" pasife alındı (2026-09-03) ve artık /kategori/folyo-film'e
              // 301 yönlendiriliyor — hesap makinesi olmayan bir listeleme sayfası. Bu CTA
              // "ölçünü gir, fiyatı hesapla" vaat ettiği için doğrudan aktif ürün sayfasına gider.
              href="/urun/kesim-folyo"
              className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-lg bg-brand-500 text-ink-900 text-sm font-bold hover:bg-brand-400 transition-colors"
            >
              Folyo fiyatı hesapla <ArrowRight size={15} weight="bold" />
            </Link>
            <Link
              href="/urun/baskes-folyo"
              className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-lg border border-paper-200 text-sm font-semibold text-ink-900 hover:bg-paper-100 transition-colors"
            >
              Baskes folyo
            </Link>
            <Link
              href="/rehber/pleksi-baski-fiyatlari-2026"
              className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-lg border border-paper-200 text-sm font-semibold text-ink-900 hover:bg-paper-100 transition-colors"
            >
              Pleksi baskı rehberi
            </Link>
          </div>
        </section>
      </Container>
    </>
  );
}
