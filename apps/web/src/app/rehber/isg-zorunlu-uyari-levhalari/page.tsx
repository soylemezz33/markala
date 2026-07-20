import Link from "next/link";
import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Container } from "@markala/ui";
import {
  Warning,
  CheckCircle,
  Info,
  ArrowRight,
  Lightning,
  HardHat,
  Factory,
  Package,
  Buildings,
  Percent,
  ShieldCheck,
} from "@phosphor-icons/react/dist/ssr";
import type { Category } from "@markala/types";
import { getCategories } from "@/lib/catalog";
import { volumeDiscountRate } from "@/lib/configurator";
import { formatPriceWithSymbol } from "@/lib/format";
import { BreadcrumbJsonLd, ArticleJsonLd } from "@/components/seo/json-ld";
import { GuideFaqSection, asOfLabel } from "../_shared";

// Kategori/fiyat verisi canlı katalogdan SSR — saatte bir tazelenir.
export const revalidate = 3600;

const PAGE_PATH = "/rehber/isg-zorunlu-uyari-levhalari";
const ISG_PREFIX = "is-guvenligi-";

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: "İSG Uyarı Levhaları Rehberi — İşyerinde Hangi Levhalar Zorunlu?",
    description:
      "Şantiye, fabrika, depo ve ofis için zorunlu İSG uyarı levhası kontrol listeleri: yasaklayıcı, uyarı, emredici ve acil çıkış işaretlerinin anlamları, ebat/malzeme seçenekleri ve toplu alım indirimleri.",
    alternates: { canonical: PAGE_PATH },
    openGraph: {
      type: "article",
      title: "İSG Uyarı Levhaları Rehberi — İşyeri Tipine Göre Kontrol Listesi",
      description:
        "Yasak, uyarı, emredici ve acil çıkış levhaları: renk anlamları, işyeri tipine göre kontrol listeleri ve güncel fiyatlar.",
      url: PAGE_PATH,
      images: [{ url: "/og-default.png", width: 1200, height: 630, alt: "İSG Uyarı Levhaları Rehberi" }],
    },
  };
}

/**
 * İşaret sınıfları — "Sağlık ve Güvenlik İşaretleri Yönetmeliği"ndeki temel sınıflandırma
 * (biçim/renk kodları). Madde numarası bilinçli olarak verilmez; hukuki detay için
 * sayfa sonundaki bilgilendirme notuna bakınız.
 */
const SIGN_CLASSES = [
  {
    name: "Yasaklayıcı işaretler",
    slug: "is-guvenligi-yasaklayici",
    shape: "Beyaz zemin üzerinde kırmızı daire ve çapraz bant, siyah piktogram",
    meaning: "Tehlikeye yol açabilecek davranışı yasaklar",
    examples: "Sigara içilmez, yetkisiz giremez, ateşle yaklaşma",
  },
  {
    name: "Uyarı işaretleri",
    slug: "is-guvenligi-uyari-ikaz",
    shape: "Sarı zemin, siyah kenarlı üçgen, siyah piktogram",
    meaning: "Bir tehlike kaynağına karşı dikkat çağrısı yapar",
    examples: "Dikkat elektrik tehlikesi, düşme tehlikesi, sıcak yüzey",
  },
  {
    name: "Emredici işaretler",
    slug: "is-guvenligi-emredici-kkd",
    shape: "Mavi daire içinde beyaz piktogram",
    meaning: "Belirli bir davranışı zorunlu kılar (özellikle KKD kullanımı)",
    examples: "Baret tak, iş ayakkabısı giy, kulak koruyucu kullan",
  },
  {
    name: "Acil çıkış ve ilk yardım işaretleri",
    slug: "is-guvenligi-acil-ilk-yardim",
    shape: "Yeşil dikdörtgen veya kare, beyaz piktogram",
    meaning: "Kaçış yollarını, çıkışları, toplanma alanını ve ilk yardım noktalarını gösterir",
    examples: "Acil çıkış, toplanma alanı, ilk yardım dolabı",
  },
  {
    name: "Yangınla mücadele işaretleri",
    slug: "is-guvenligi-yangin",
    shape: "Kırmızı dikdörtgen veya kare, beyaz piktogram",
    meaning: "Yangın ekipmanının yerini ve türünü gösterir",
    examples: "Yangın söndürücü, yangın hortumu, yangın alarm butonu",
  },
];

/** İşyeri tipine göre tipik levha kontrol listeleri — her madde ilgili kategoriye bağlanır. */
const WORKPLACE_CHECKLISTS = [
  {
    name: "Şantiye",
    icon: HardHat,
    intro:
      "Sürekli değişen tehlike kaynakları nedeniyle en yoğun işaretleme gereken işyeri tipi. Tipik kontrol listesi:",
    items: [
      { label: "Baret, iş ayakkabısı ve diğer KKD zorunluluğu işaretleri", slug: "is-guvenligi-emredici-kkd" },
      { label: "Şantiyeye yetkisiz girişi yasaklayan levhalar", slug: "is-guvenligi-yasaklayici" },
      { label: "Yüksekte çalışma ve düşme tehlikesi uyarıları", slug: "is-guvenligi-uyari-ikaz" },
      { label: "Elektrik ve enerji hattı tehlike levhaları", slug: "is-guvenligi-elektrik-voltaj" },
      { label: "Acil toplanma alanı ve kaçış yönlendirmeleri", slug: "is-guvenligi-acil-ilk-yardim" },
      { label: "Saha içi araç ve iş makinesi trafiği uyarıları", slug: "is-guvenligi-trafik-saha" },
    ],
  },
  {
    name: "Fabrika / Üretim Tesisi",
    icon: Factory,
    intro:
      "Makine parkuru, kimyasal ve gürültü kaynakları işaretlemenin merkezindedir. Tipik kontrol listesi:",
    items: [
      { label: "Bölgeye göre KKD zorunluluğu işaretleri (kulaklık, gözlük, eldiven)", slug: "is-guvenligi-emredici-kkd" },
      { label: "Makine, sıcak yüzey ve gürültü uyarı levhaları", slug: "is-guvenligi-uyari-ikaz" },
      { label: "Yangın söndürücü ve hidrant yeri işaretleri", slug: "is-guvenligi-yangin" },
      { label: "Acil çıkış, kaçış yolu ve ilk yardım noktaları", slug: "is-guvenligi-acil-ilk-yardim" },
      { label: "Elektrik panosu ve yüksek gerilim levhaları", slug: "is-guvenligi-elektrik-voltaj" },
      { label: "Çalışma talimatı ve bilgilendirme levhaları", slug: "is-guvenligi-bilgilendirme-talimat" },
      { label: "Kalite kontrol, onay ve karantina etiketleri", slug: "is-guvenligi-kalite-kontrol" },
    ],
  },
  {
    name: "Depo / Lojistik",
    icon: Package,
    intro: "Araç-yaya ayrımı ve istifleme güvenliği öne çıkar. Tipik kontrol listesi:",
    items: [
      { label: "Forklift ve araç trafiği uyarı/yönlendirme levhaları", slug: "is-guvenligi-trafik-saha" },
      { label: "İstifleme, asılı yük ve raf güvenliği uyarıları", slug: "is-guvenligi-uyari-ikaz" },
      { label: "Sigara içilmez ve açık ateş yasağı levhaları", slug: "is-guvenligi-yasaklayici" },
      { label: "Yangın ekipmanı yer işaretleri", slug: "is-guvenligi-yangin" },
      { label: "Acil çıkış ve toplanma alanı yönlendirmeleri", slug: "is-guvenligi-acil-ilk-yardim" },
      { label: "Depo kuralları ve bilgilendirme levhaları", slug: "is-guvenligi-bilgilendirme-talimat" },
    ],
  },
  {
    name: "Ofis",
    icon: Buildings,
    intro:
      "Düşük riskli görünse de acil durum işaretlemesi her işyerinde gereklidir. Tipik kontrol listesi:",
    items: [
      { label: "Acil çıkış ve kaçış yolu yönlendirmeleri", slug: "is-guvenligi-acil-ilk-yardim" },
      { label: "Yangın söndürücü ve alarm butonu işaretleri", slug: "is-guvenligi-yangin" },
      { label: "Elektrik panosu uyarı levhaları", slug: "is-guvenligi-elektrik-voltaj" },
      { label: "Sigara içilmez levhaları", slug: "is-guvenligi-yasaklayici" },
      { label: "Kamera ve genel bilgilendirme levhaları", slug: "is-guvenligi-bilgilendirme-talimat" },
    ],
  },
];

/** Hacim indirimi kademeleri — oranlar TEK kaynaktan (configurator.volumeDiscountRate). */
const DISCOUNT_QTYS = [10, 25, 50, 100, 250];

export default async function IsgLevhaRehberiPage() {
  const categories = await getCategories();
  const isgCats = categories.filter((c) => c.slug.startsWith(ISG_PREFIX));
  // Katalog boş/blip → throw: ISR son başarılı (stale) sayfayı korur, hub asla boş yayınlanmaz.
  if (isgCats.length === 0) {
    throw new Error("rehber/isg: İSG kategorileri boş döndü (API blip?) — stale ISR korunur");
  }

  const bySlug = new Map(isgCats.map((c) => [c.slug, c]));
  const totalCount = isgCats.reduce((s, c) => s + (c.productCount ?? 0), 0);
  const startPrices = isgCats.map((c) => c.startingPrice).filter((v): v is number => typeof v === "number" && v > 0);
  const minStart = startPrices.length > 0 ? Math.min(...startPrices) : 0;

  const asOf = asOfLabel();
  const teklifHref = `/teklif-al?sektor=${encodeURIComponent("İnşaat & Sanayi")}`;
  const maxDiscount = Math.round(volumeDiscountRate(DISCOUNT_QTYS[DISCOUNT_QTYS.length - 1]!) * 100);

  const discountRows = DISCOUNT_QTYS.map((q, i) => {
    const next = DISCOUNT_QTYS[i + 1];
    return {
      range: next ? `${q} – ${next - 1} adet` : `${q}+ adet`,
      rate: Math.round(volumeDiscountRate(q) * 100),
    };
  });

  /** Kategori linki — kategori canlıda varsa link, yoksa düz metin (ölü link üretme). */
  const CatLink = ({ slug, children }: { slug: string; children: ReactNode }) =>
    bySlug.has(slug) ? (
      <Link href={`/kategori/${slug}`} className="font-medium text-brand-700 hover:text-ink-900 underline">
        {children}
      </Link>
    ) : (
      <span>{children}</span>
    );

  const faqs = [
    {
      q: "İşyerimde hangi uyarı levhaları zorunlu?",
      a: "Türkiye'de işyeri güvenlik işaretleri \"Sağlık ve Güvenlik İşaretleri Yönetmeliği\" çerçevesinde düzenlenir: işveren, risk değerlendirmesinin sonucuna göre gerekli işaretleri bulundurmakla yükümlüdür. Yani sabit bir \"herkes için aynı\" liste yoktur; zorunlu levhalar işyerindeki tehlikelere göre belirlenir. Bu sayfadaki işyeri tipine göre listeler tipik ihtiyacı gösterir; kesin liste için İSG uzmanınıza danışın.",
    },
    {
      q: "Levha renkleri ne anlama geliyor?",
      a: "Kırmızı daire + çapraz bant yasak, sarı üçgen tehlikeye karşı uyarı, mavi daire zorunlu davranış (ör. baret tak), yeşil dikdörtgen/kare acil çıkış ve ilk yardım, kırmızı dikdörtgen/kare ise yangın ekipmanının yerini gösterir. Bu renk ve biçim kodları yönetmelikteki sınıflandırmanın temelidir.",
    },
    {
      q: "Levhalar hangi ebat ve malzemelerde üretiliyor?",
      a: "Katalogdaki levhalarda genel olarak 25×35, 35×50, 50×70 ve 70×100 cm ebat seçenekleri; yapışkanlı etiket (sticker), PVC, dekota ve galvaniz sac zemin seçenekleri sunulur. Baskı tipi olarak UV baskının yanında reflektif (ışık yansıtan) ve fosforlu (karanlıkta ışıldayan) seçenekler mevcuttur. Güncel seçenekler her ürünün kendi sayfasındaki konfigüratörde listelenir.",
    },
    {
      q: "İç mekan ve dış mekan için hangi malzemeyi seçmeliyim?",
      a: "İç mekanda yapışkanlı etiket veya PVC genellikle yeterlidir. Dış mekan, şantiye ve saha koşullarında dekota veya galvaniz sac zeminler darbe ve hava koşullarına karşı daha dayanıklıdır. Karanlıkta görünürlük gereken acil çıkış güzergahlarında fosforlu, araç trafiği olan alanlarda reflektif baskı tercih edilir.",
    },
    {
      q: "Toplu alımda indirim var mı?",
      a: `Evet. Levha ürünlerinde adet arttıkça otomatik hacim indirimi uygulanır — 10 adetten başlar, ${DISCOUNT_QTYS[DISCOUNT_QTYS.length - 1]} adet ve üzerinde %${maxDiscount}'e ulaşır. İndirim sepette kendiliğinden hesaplanır; daha büyük projeler için teklif sayfasından kurumsal fiyat isteyebilirsin.`,
    },
    {
      q: "Fiyatlara KDV dahil mi?",
      a:
        minStart > 0
          ? `Evet. ${asOf} itibarıyla İSG levhaları ${formatPriceWithSymbol(minStart)}'den başlar; tüm fiyatlar KDV dahildir ve sepette değişmez.`
          : "Evet, sitedeki tüm levha fiyatları KDV dahildir ve sepette değişmez.",
    },
  ];

  return (
    <>
      <BreadcrumbJsonLd
        items={[
          { name: "Anasayfa", href: "/" },
          { name: "İSG Uyarı Levhaları Rehberi", href: PAGE_PATH },
        ]}
      />
      <ArticleJsonLd
        title="İSG Uyarı Levhaları Rehberi — İşyeri Tipine Göre Kontrol Listesi"
        description="Yasaklayıcı, uyarı, emredici ve acil çıkış işaretlerinin anlamları; şantiye, fabrika, depo ve ofis için tipik levha kontrol listeleri."
        url={PAGE_PATH}
        datePublished="2026-07-20"
      />

      {/* Hero */}
      <div className="bg-paper-100 border-b border-paper-200">
        <Container className="py-12 md:py-16 max-w-3xl">
          <div className="flex items-center gap-2 mb-3">
            <Warning size={20} weight="fill" className="text-brand-700" />
            <span className="text-sm font-semibold text-brand-700 uppercase tracking-wider">
              İSG Rehberi
            </span>
          </div>
          <h1 className="text-3xl md:text-5xl font-semibold text-ink-900 leading-tight">
            İşyerinde hangi uyarı levhaları zorunlu?
          </h1>
          <p className="mt-4 text-lg text-ink-700">
            &quot;Sağlık ve Güvenlik İşaretleri Yönetmeliği&quot; işvereni, risk değerlendirmesine
            göre gerekli güvenlik işaretlerini bulundurmakla yükümlü kılar. Bu rehberde işaret
            sınıflarını, renk anlamlarını ve işyeri tipine göre tipik kontrol listelerini bulursun —
            katalogda <strong className="text-ink-900">{totalCount.toLocaleString("tr-TR")} levha çeşidi</strong>
            {minStart > 0 && (
              <>
                , <strong className="text-ink-900">{formatPriceWithSymbol(minStart)}</strong>&apos;den
                başlayan KDV dahil fiyatlarla
              </>
            )}
            .
          </p>
          <div className="mt-6 flex flex-wrap items-center gap-3 text-sm">
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-success/15 text-success rounded-full font-medium">
              <CheckCircle size={13} weight="fill" /> KDV dahil — sepette değişmez
            </span>
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-brand-100 text-brand-900 rounded-full font-medium">
              <Percent size={13} weight="fill" /> %{maxDiscount}&apos;e varan hacim indirimi
            </span>
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-paper-200 text-ink-900 rounded-full font-medium">
              <ShieldCheck size={13} weight="fill" /> Sticker · PVC · Dekota · Galvaniz
            </span>
          </div>
        </Container>
      </div>

      <Container className="py-10 md:py-14 max-w-4xl">
        {/* Bilgilendirme notu */}
        <section className="mb-10 p-5 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-3">
          <Info size={20} weight="fill" className="text-amber-700 shrink-0 mt-0.5" />
          <div className="text-sm text-amber-900 leading-relaxed">
            <strong>Bu rehber bilgilendirme amaçlıdır, hukuki danışmanlık yerine geçmez.</strong>{" "}
            Hangi işaretlerin zorunlu olduğu işyerinizin risk değerlendirmesine göre belirlenir;
            kesin liste için iş güvenliği uzmanınıza danışın. Aşağıdaki listeler işyeri tiplerinde
            tipik olarak ihtiyaç duyulan levhaları gösterir.
          </div>
        </section>

        {/* İşaret sınıfları */}
        <section>
          <h2 className="text-2xl font-semibold text-ink-900">
            İşaret sınıfları ve renk anlamları
          </h2>
          <p className="mt-2 text-ink-700">
            Yönetmelikteki sınıflandırma biçim ve renk kodlarına dayanır — levhanın rengi, mesajın
            türünü tek bakışta anlatır:
          </p>
          <div className="mt-5 overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-paper-200 text-left text-xs font-semibold text-ink-500 uppercase tracking-wider">
                  <th className="px-3 py-2.5">Sınıf</th>
                  <th className="px-3 py-2.5">Biçim ve renk</th>
                  <th className="px-3 py-2.5">Anlamı</th>
                  <th className="px-3 py-2.5">Örnekler</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-paper-100">
                {SIGN_CLASSES.map((s) => (
                  <tr key={s.slug} className="hover:bg-paper-50 align-top">
                    <td className="px-3 py-3 font-medium text-ink-900">
                      <CatLink slug={s.slug}>{s.name}</CatLink>
                    </td>
                    <td className="px-3 py-3 text-xs text-ink-700">{s.shape}</td>
                    <td className="px-3 py-3 text-xs text-ink-700">{s.meaning}</td>
                    <td className="px-3 py-3 text-xs text-ink-500">{s.examples}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* İşyeri tipine göre kontrol listeleri */}
        <section className="mt-14">
          <h2 className="text-2xl font-semibold text-ink-900">
            İşyeri tipine göre levha kontrol listeleri
          </h2>
          <div className="mt-6 grid md:grid-cols-2 gap-4">
            {WORKPLACE_CHECKLISTS.map((w) => (
              <article key={w.name} className="p-6 bg-paper-50 border border-paper-200 rounded-xl">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-lg bg-brand-100 text-brand-700 grid place-items-center">
                    <w.icon size={20} weight="fill" />
                  </div>
                  <h3 className="font-semibold text-ink-900 text-lg">{w.name}</h3>
                </div>
                <p className="text-sm text-ink-500 mb-3">{w.intro}</p>
                <ul className="space-y-2 text-sm text-ink-700">
                  {w.items.map((item) => (
                    <li key={item.label} className="flex gap-2">
                      <CheckCircle size={15} weight="fill" className="text-success shrink-0 mt-0.5" />
                      <span>
                        <CatLink slug={item.slug}>{item.label}</CatLink>
                      </span>
                    </li>
                  ))}
                </ul>
              </article>
            ))}
          </div>
        </section>

        {/* Hacim indirimi */}
        <section className="mt-14 p-6 md:p-8 bg-paper-50 border border-paper-200 rounded-xl">
          <h2 className="text-xl font-semibold text-ink-900 mb-2">
            Toplu alımda otomatik hacim indirimi
          </h2>
          <p className="text-sm text-ink-700 mb-4">
            Levha ürünlerinde adet arttıkça indirim sepette kendiliğinden uygulanır — işyerinin tüm
            levha ihtiyacını tek siparişte toplamak her zaman daha ekonomiktir:
          </p>
          <div className="overflow-x-auto">
            <table className="w-full text-sm max-w-md">
              <thead>
                <tr className="border-b border-paper-200 text-left text-xs font-semibold text-ink-500 uppercase tracking-wider">
                  <th className="px-3 py-2.5">Sipariş adedi</th>
                  <th className="px-3 py-2.5 text-right">İndirim oranı</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-paper-100">
                {discountRows.map((r) => (
                  <tr key={r.range} className="hover:bg-paper-100">
                    <td className="px-3 py-2.5 font-medium text-ink-900">{r.range}</td>
                    <td className="px-3 py-2.5 text-right font-semibold text-success tabular-nums">
                      %{r.rate}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* Kategori grid */}
        <section className="mt-14">
          <h2 className="text-2xl font-semibold text-ink-900">
            Tüm İSG levha kategorileri ({asOf} itibarıyla {totalCount.toLocaleString("tr-TR")} ürün)
          </h2>
          <div className="mt-5 grid sm:grid-cols-2 gap-3">
            {isgCats.map((c: Category) => (
              <Link
                key={c.slug}
                href={`/kategori/${c.slug}`}
                className="group p-4 bg-paper-50 border border-paper-200 rounded-xl hover:border-ink-300 transition-colors flex items-center justify-between gap-3"
              >
                <div>
                  <div className="font-semibold text-ink-900 group-hover:text-brand-700">{c.name}</div>
                  <div className="mt-0.5 text-xs text-ink-500">
                    {c.productCount > 0 && <>{c.productCount} ürün</>}
                    {c.productCount > 0 && c.startingPrice > 0 && " · "}
                    {c.startingPrice > 0 && <>{formatPriceWithSymbol(c.startingPrice)}&apos;den</>}
                  </div>
                </div>
                <ArrowRight size={14} weight="bold" className="text-ink-500 group-hover:text-brand-700 shrink-0" />
              </Link>
            ))}
          </div>
        </section>

        {/* SSS + FAQPage JSON-LD */}
        <GuideFaqSection items={faqs} url={PAGE_PATH} />

        {/* CTA */}
        <section className="mt-14 p-8 md:p-12 bg-ink-900 text-paper-50 rounded-2xl text-center">
          <Lightning size={28} weight="fill" className="text-brand-400 mx-auto mb-3" />
          <h2 className="text-2xl md:text-3xl font-semibold">
            İşyerinin levha listesini birlikte çıkaralım
          </h2>
          <p className="mt-3 text-paper-100/70 max-w-xl mx-auto">
            Şantiye, fabrika veya deponun tüm levha ihtiyacı için toplu teklif iste — hacim
            indirimi ve kurumsal cari hesap avantajıyla, 24 saatte dönüş.
          </p>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            <Link
              href={teklifHref}
              className="px-6 py-3 bg-brand-500 hover:bg-brand-600 text-ink-900 rounded-lg text-sm font-semibold inline-flex items-center gap-2"
            >
              Toplu Levha Teklifi Al <ArrowRight size={14} weight="bold" />
            </Link>
            <Link
              href="/kurumsal"
              className="px-6 py-3 border border-paper-100/30 text-paper-50 rounded-lg text-sm font-semibold hover:bg-white/5 inline-flex items-center gap-2"
            >
              Kurumsal Hesap (B2B)
            </Link>
            <Link
              href="/fiyat-listesi"
              className="px-6 py-3 border border-paper-100/30 text-paper-50 rounded-lg text-sm font-semibold hover:bg-white/5 inline-flex items-center gap-2"
            >
              Genel Fiyat Listesi
            </Link>
          </div>
        </section>

        {/* Yasal not */}
        <p className="mt-8 text-xs text-ink-500 text-center max-w-2xl mx-auto">
          Bu sayfadaki mevzuat bilgisi genel bilgilendirme düzeyindedir; işaret yükümlülükleri
          işyerinizin risk değerlendirmesine göre değişir. Fiyat ve ürün bilgileri canlı katalogdan
          otomatik güncellenir.
        </p>
      </Container>
    </>
  );
}
