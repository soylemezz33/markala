import Link from "next/link";
import { notFound } from "next/navigation";
import { Container } from "@markala/ui";
import { ArrowLeft, ArrowRight, CaretRight, ChatCircle } from "@phosphor-icons/react/dist/ssr";
import type { Metadata } from "next";
import { ArticleJsonLd, BreadcrumbJsonLd } from "@/components/seo/json-ld";

/**
 * Şehir/konu eşleşmesi — yardım makalelerinin sonunda gösterilecek hub linkleri.
 * Sadece konu ile mantıklı eşleşen yardım makalesi için link basılır (spam değil).
 */
const articleCityLinks: Record<string, Array<{ label: string; href: string }>> = {
  "dosya-hazirlama": [
    { label: "Mersin'de baskı hizmetimiz", href: "/matbaa/mersin" },
    { label: "Adana matbaa & baskı", href: "/matbaa/adana" },
  ],
  "kargo": [
    { label: "Antalya'ya baskı kargosu", href: "/matbaa/antalya" },
    { label: "Gaziantep'e baskı kargosu", href: "/matbaa/gaziantep" },
  ],
  "siparis": [
    { label: "Mersin matbaa siparişi", href: "/matbaa/mersin" },
  ],
};

interface HelpArticle {
  slug: string;
  title: string;
  description: string;
  content: Array<{ heading: string; body: string }>;
}

const articles: Record<string, HelpArticle> = {
  "sss": {
    slug: "sss",
    title: "Sıkça Sorulan Sorular",
    description: "En çok sorulan 30+ soru ve cevabı — tasarım, sipariş, kargo, iade.",
    content: [
      { heading: "Tasarım dosyamı hangi formatta göndermeliyim?", body: "CMYK renk uzayında, 300 dpi çözünürlükte PDF, AI veya PSD ideal. Kenarda 2 mm taşma payı bırakılmalı, önemli yazılar kenardan en az 3 mm içeride olmalı." },
      { heading: "Selefon ile UV lak farkı nedir?", body: "Selefon kartın tüm yüzeyini ince filmle kaplar (mat ya da parlak), sıvı/çizilme korur. UV lak ise sadece istediğiniz alana (logo, isim) uygulanır ve dokunsal kabartma yaratır." },
      { heading: "Kaç günde elime ulaşır?", body: "Üretim süresi ürüne göre değişir (kartvizit 1-2 iş günü, dekota 2-3 iş günü). Üretim biter bitmez aynı gün DHL kargoya teslim edilir; Türkiye geneli 1-3 iş günü içinde ulaşır." },
      { heading: "Üretim toleransı (fire) ne demek?", body: "Matbaa baskısının doğası gereği siparişinizin Renk, Adet ve Ölçülerinde %1 ila %5 arasında fire olabilir. Bu sektör standardıdır ve sözleşme şartı olarak kabul edilmiştir (Mesafeli Satış Sözleşmesi Madde 7.A)." },
      { heading: "Minimum sipariş adedi nedir?", body: "Ürünlere göre değişir — kartvizit 1.000 adet, broşür 1.000 adet, kupa 1 adet, kaşe 1 adet. Her ürün sayfasındaki konfigüratörde minimum adet görünür." },
      { heading: "Tasarım yoksa ne yapacağım?", body: "Ücretsiz şablonlarımızdan birini seçebilir veya 89 TL'den itibaren özel tasarım hizmetimizden yararlanabilirsiniz. Sipariş sırasında 'Tasarım desteği istiyorum' seçeneğini işaretleyin." },
      { heading: "Kurumsal cari hesap nasıl açarım?", body: "İletişim formundan 'Kurumsal Hesap' başlığıyla başvuru yapın; Vergi levhası ve imza sirküleri ile 24 saat içinde değerlendirme yaparız. Onay sonrası açık hesap, 30/60/90 gün vadeli fatura, özel fiyat anlaşmaları aktif olur." },
      { heading: "İptal hakkım var mı?", body: "Üretim başlamadan önce (tasarım onayı aşamasında) tam iade ile iptal edebilirsiniz. Üretim başladıktan sonra iptal mümkün değildir; bu kişiye özel matbaa ürünlerinin yasal niteliğidir (Mesafeli Sözleşmeler Yönetmeliği 15/1-ç)." },
    ],
  },
  "dosya-hazirlama": {
    slug: "dosya-hazirlama",
    title: "Dosya Hazırlama Rehberi",
    description: "CMYK renk uzayı, çözünürlük, taşma payı, dosya formatı — baskıya hazır dosya yapımı.",
    content: [
      { heading: "Renk Uzayı: CMYK kullanın", body: "Web tasarımı RGB ile yapılır ama matbaa baskısı CMYK ile yapılır. RGB dosyası gönderirseniz baskıda renkler %15-30 arasında farklı çıkar. Adobe Illustrator/Photoshop'tan 'CMYK Mode' seçin." },
      { heading: "Çözünürlük: 300 dpi", body: "Baskıda kullanılacak görseller 300 dpi olmalı. 72 dpi (web standardı) baskıda pikselli çıkar. Vektörel (SVG, AI, EPS) dosyalar zaten ölçeklenebilir, dpi sınırlaması yoktur." },
      { heading: "Taşma Payı: 2 mm", body: "Kart kenarına kadar uzanan tasarımlarda kesim sırasında beyaz şerit oluşmaması için tasarımı her kenardan 2 mm fazla uzatın. Önemli yazıları ise kenardan 3 mm içeride tutun." },
      { heading: "Format: PDF (öncelik), AI, PSD", body: "PDF en güvenli format. Adobe ortamından 'Press Quality' veya 'PDF/X-1a' preset'i ile dışa aktarın. AI ve PSD de kabul edilir; ancak fontları outline'layın (Type > Create Outlines)." },
      { heading: "Renkleri Pantone ile mi yoksa CMYK mi?", body: "Tek renk lojistik, ofis baskı: Pantone (PMS) referansı önerilir. Tam renkli (4+4) baskı: CMYK yeterli. Pantone, baskıda renk tutarlılığı için her baskıda aynı pigment karışımı sağlar." },
      { heading: "Yaygın Hatalar", body: "1) RGB kaydetmek 2) Düşük çözünürlük (72 dpi) 3) Taşma payı bırakmamak 4) Font outline yapmamak (font yoksa baskıda farklı font ile basılır) 5) İçe gömülmemiş görseller (link olarak kalmış)" },
    ],
  },
  "siparis": {
    slug: "siparis",
    title: "Sipariş Süreci",
    description: "Konfigüratörden teslimata kadar adım adım Markala sipariş süreci.",
    content: [
      { heading: "1. Ürün ve Konfigürasyon Seç", body: "Ürün sayfasından paket, ebat ve adet seçin. Sağdaki sticky konfigüratörde anlık fiyat görünür." },
      { heading: "2. Sepete Ekle", body: "İhtiyacınız varsa farklı ürünler de ekleyebilirsiniz. Sepet sağda drawer olarak açılır." },
      { heading: "3. Tasarım Yükle veya Destek İste", body: "Hazır tasarımınız varsa CMYK PDF olarak yükleyin. Yoksa 'Tasarım desteği' seçeneğiyle ücretsiz şablon veya 89 TL+ özel tasarım hizmeti." },
      { heading: "4. Adres ve Ödeme", body: "Teslimat adresinizi seçin/ekleyin, iyzico ile 3D Secure ödeme yapın. 1.500 TL ve üzeri kargo ücretsiz." },
      { heading: "5. Tasarım Onayı (varsa)", body: "Tasarım desteği istediyseniz 24 saat içinde 2 alternatif e-postanıza gelir. Onayınız sonrası üretim başlar." },
      { heading: "6. Üretim", body: "Ürüne göre 1-7 iş günü. Her aşamada SMS/e-posta ile bilgilendirme alırsınız." },
      { heading: "7. Kargoya Teslim", body: "Üretim biter bitmez aynı gün DHL kargoya teslim edilir. Takip kodunuz e-postanıza gönderilir." },
      { heading: "8. Teslim Alma", body: "DHL kuryesi 1-3 iş günü içinde Türkiye'nin 81 iline teslim eder. Teslim sırasında ürünleri kontrol etmenizi öneririz." },
    ],
  },
  "kargo": {
    slug: "kargo",
    title: "Kargo & Teslimat",
    description: "DHL ile Türkiye geneli kargo, süreler, ücretler, takip ve teslim koşulları.",
    content: [
      { heading: "DHL Anlaşmamız", body: "Markala olarak Türkiye geneli kargolarımızı DHL ile yapıyoruz. 81 il + 970+ ilçeye 1-3 iş günü içinde teslimat." },
      { heading: "Kargo Süreleri", body: "İstanbul-Ankara-İzmir-Bursa-Mersin gibi büyük şehirler 24-48 saat. Doğu Anadolu illeri 2-3 iş günü. Adalar ve uzak köyler 3-5 iş günü." },
      { heading: "Kargo Ücretleri", body: "1.500 TL ve üzeri tüm siparişler için kargo ücretsizdir. Altındaki siparişlerde 49 TL standart kargo ücreti uygulanır. Hızlı kargo (1 iş günü) +89 TL ile mümkün (sipariş notunda belirtilmeli)." },
      { heading: "Sipariş Takibi", body: "Kargoya verildikten sonra DHL takip kodu e-postanıza gönderilir. Aynı zamanda sitedeki '/kargo-takip' sayfasından sipariş numaranız ve e-postanızla sorgulayabilirsiniz." },
      { heading: "Teslim Alma", body: "Kapıda DHL kuryesi tarafından imza karşılığı teslim edilir. Adreste yoksanız komşuya bırakılmaz; bir sonraki iş günü tekrar denenir veya en yakın DHL şubesine bırakılır." },
      { heading: "Hasar Durumunda", body: "Teslim sırasında pakette belirgin bir hasar varsa kuryeye 'Hasarlı teslim alındı' tutanağı tutturun. 7 gün içinde fotoğraflı bildirim ile iade/değişim talep edebilirsiniz." },
    ],
  },
  "iade": {
    slug: "iade",
    title: "İade & Değişim",
    description: "Üretim hatası, teslimat hasarı, iptal koşulları, üretim toleransı.",
    content: [
      { heading: "Cayma Hakkı (Önemli)", body: "Markala ürünleri kişiye/firmaya özel üretildiğinden Mesafeli Sözleşmeler Yönetmeliği 15/1-ç gereği cayma hakkı kullanılamaz. Üretim öncesi (tasarım onayı aşamasında) iptal mümkündür." },
      { heading: "Üretim/Baskı Hatası", body: "Onayladığınız taslaktan farklı renk basılması, baskı kayması, mürekkep akması, ebat hatası (toleransın dışında), eksik gönderim, yanlış malzeme — bu durumlarda ürün ücretsiz yenilenir veya tutar iade edilir." },
      { heading: "Üretim Toleransı (%1-5 fire)", body: "Lütfen Dikkat: Siparişlerinizin Renk, Adet ve Ölçülerinde %1 ila %5 arasında fire olabilmektedir. Bu sektör standardı tolerans aralığıdır ve sözleşme şartlarındandır; iade/değişime konu edilemez." },
      { heading: "Teslimat Hasarı", body: "Kargo sırasında oluşan hasarlar için teslim sonrası 7 gün içinde fotoğraflı bildirim yapın. Kuryeye 'hasarlı teslim alındı' tutanağı tutturmuş olmanız önerilir." },
      { heading: "İade Süreci", body: "1) merhaba@markala.com.tr adresine fotoğraflarla bildirim 2) Müşteri hizmetleri 24 saat içinde değerlendirme 3) Haklı bulunursa ürün ücretsiz iade kargosu ile alınır 4) Yenileme veya iade tutarı 5 iş günü içinde tamamlanır." },
    ],
  },
  "odeme": {
    slug: "odeme",
    title: "Ödeme & Fatura",
    description: "iyzico, taksit imkanı, e-Arşiv fatura, kurumsal ödeme.",
    content: [
      { heading: "Ödeme Yöntemi: iyzico (3D Secure)", body: "Tüm ödemeler iyzico altyapısı üzerinden 3D Secure ile yapılır. Visa, Mastercard, Troy ve American Express kabul edilir. Kart bilgileriniz Markala'ya hiç ulaşmaz; iyzico'nun PCI-DSS sertifikalı güvenli sunucularında işlenir." },
      { heading: "Taksit İmkânı", body: "100 TL ve üzeri siparişlerde 3 taksit standart olarak ücretsiz. Kredi kartınızın bankası destekliyorsa 6 ve 9 taksit seçenekleri (komisyon ile) sunulabilir." },
      { heading: "e-Arşiv Fatura", body: "Tüm faturalarınız Paraşüt entegrasyonu ile otomatik kesilir, e-postanıza gönderilir, ayrıca '/hesabim/faturalarim' sayfasında arşivlenir. Bireysel müşteriler için TC kimlik no, kurumsal için vergi numarası ile kesilir." },
      { heading: "Kurumsal Hesap", body: "B2B müşteriler için açık fatura, 30/60/90 gün vade, özel fiyat anlaşması, ay sonu konsolide fatura. Başvuru: '/yardim/kurumsal' sayfası." },
      { heading: "İade Süreci", body: "İade onaylandıktan sonra tutar 5 iş günü içinde aynı karta yansıtılır. Bankaya bağlı olarak kart ekstresinde görünme süresi 1-3 hafta arasında değişir." },
    ],
  },
  "tasarim-destegi": {
    slug: "tasarim-destegi",
    title: "Tasarım Desteği",
    description: "Ücretsiz şablon ve özel tasarım hizmeti — 24 saatte taslak, sınırsız revize.",
    content: [
      { heading: "Ücretsiz Şablon Desteği", body: "Sipariş sırasında 'Tasarım desteği istiyorum' seçeneğini işaretleyin. Sektörünüze özel hazır şablonlardan birini seçer, logonuzu ve metinlerinizi yüklersiniz. Tasarım ekibimiz 24 saat içinde size özel uyarlanmış halini gönderir. Bu hizmet ücretsizdir." },
      { heading: "Özel Tasarım Hizmeti", body: "Tamamen sıfırdan, marka kimliğinize özel tasarım için 89 TL'den itibaren paketlerimiz vardır. Tasarımcımızla görüşür, brief alır, 3 iş günü içinde 2 alternatif sunarız. Sınırsız revizyon dahildir." },
      { heading: "324 Ajans ile Kurumsal Kimlik", body: "Sıfırdan logo, kurumsal kimlik, web tasarım gibi geniş kapsamlı projeler için Markala çatı markası 324 Ajans ile çalışıyoruz. Detaylı brief, marka stratejisi, 5-10 iş günü teslim — paket fiyatları 2.500 TL'den başlıyor. (324ajans.com)" },
      { heading: "Tasarım Dosyaları Saklanır mı?", body: "Tasarım desteği talebinizle yüklediğiniz orijinal dosyalar (logo, görseller) ve oluşturulan tasarım Cloudflare R2 depolamada güvenli olarak saklanır. Tekrar sipariş verdiğinizde aynı tasarımı kullanabilirsiniz. KVKK kapsamında istediğiniz zaman silmeyi talep edebilirsiniz." },
    ],
  },
  "kurumsal": {
    slug: "kurumsal",
    title: "Kurumsal Hesap",
    description: "B2B müşteri için cari hesap, açık fatura, vade, özel fiyat anlaşması.",
    content: [
      { heading: "Kurumsal Hesap Nedir?", body: "Sürekli matbaa ihtiyacı olan firmalar için bireysel hesabın gelişmiş halidir: vade ile fatura, özel fiyat anlaşması, ay sonu konsolide fatura, müşteri yöneticisi atanması ve özel destek." },
      { heading: "Avantajlar", body: "1) %5-15 arası özel fiyat anlaşması 2) 30/60/90 gün vadeli fatura 3) Ay sonu konsolide tek fatura 4) Adanmış müşteri yöneticisi 5) Öncelikli üretim hattı 6) Sipariş öncesi proof onay süreci 7) Cari hesap takibi (yönetim panelinde)." },
      { heading: "Başvuru Süreci", body: "1) İletişim formunda 'Kurumsal Hesap' seçin 2) Vergi levhası, imza sirküleri yükleyin 3) 24 saat içinde başvurunuz değerlendirilir 4) Onay sonrası özel anlaşma metni hazırlanır 5) İmzalı sözleşme sonrası hesabınız aktive edilir." },
      { heading: "Hangi Sektörler İçin?", body: "Restoranlar, oteller, klinikler, eczaneler, oto galerileri, üniversiteler, belediyeler, holdings, KOBİ'ler — aylık 5+ sipariş veren her firma kurumsal hesap için uygundur." },
    ],
  },
};

export function generateStaticParams() {
  return Object.keys(articles).map((slug) => ({ slug }));
}

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const article = articles[slug];
  if (!article) return {};
  return {
    title: `${article.title} — Yardım Merkezi`,
    description: article.description,
    alternates: { canonical: `/yardim/${article.slug}` },
    openGraph: {
      type: "article",
      title: `${article.title} — Markala Yardım`,
      description: article.description,
      url: `/yardim/${article.slug}`,
      images: [{ url: `/api/mockup?theme=brand&w=1200&h=630&slug=help-${article.slug}`, width: 1200, height: 630, alt: article.title }],
    },
    twitter: {
      card: "summary_large_image",
      title: `${article.title} — Markala Yardım`,
      description: article.description,
      images: [`/api/mockup?theme=brand&w=1200&h=630&slug=help-${article.slug}`],
    },
  };
}

export default async function HelpArticlePage({ params }: Props) {
  const { slug } = await params;
  const article = articles[slug];
  if (!article) notFound();

  const cityLinks = articleCityLinks[article.slug];

  return (
    <>
      <ArticleJsonLd
        title={article.title}
        description={article.description}
        url={`/yardim/${article.slug}`}
        datePublished="2026-01-01T00:00:00Z"
        image={`/api/mockup?theme=brand&w=1200&h=630&slug=help-${article.slug}`}
      />
      <BreadcrumbJsonLd
        items={[
          { name: "Anasayfa", href: "/" },
          { name: "Yardım Merkezi", href: "/yardim" },
          { name: article.title, href: `/yardim/${article.slug}` },
        ]}
      />
      <div className="bg-paper-100 border-b border-paper-200">
        <Container className="py-8 md:py-12 max-w-3xl">
          <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-sm text-ink-500 mb-4">
            <Link href="/" className="hover:text-ink-900">Anasayfa</Link>
            <CaretRight size={12} />
            <Link href="/yardim" className="hover:text-ink-900">Yardım</Link>
            <CaretRight size={12} />
            <span className="text-ink-900 font-medium">{article.title}</span>
          </nav>
          <h1 className="text-3xl md:text-4xl font-semibold text-ink-900">{article.title}</h1>
          <p className="mt-3 text-lg text-ink-700">{article.description}</p>
        </Container>
      </div>

      <Container className="py-10 md:py-14 max-w-3xl">
        <article className="prose prose-ink max-w-none" itemScope itemType="https://schema.org/FAQPage">
          {article.content.map((section, i) => (
            <section
              key={i}
              className={i > 0 ? "mt-8 pt-8 border-t border-paper-200" : ""}
              itemScope
              itemProp="mainEntity"
              itemType="https://schema.org/Question"
            >
              <h2 className="text-xl font-semibold text-ink-900" itemProp="name">{section.heading}</h2>
              <div
                className="mt-3 text-ink-700 leading-relaxed"
                itemScope
                itemProp="acceptedAnswer"
                itemType="https://schema.org/Answer"
              >
                <p itemProp="text">{section.body}</p>
              </div>
            </section>
          ))}
        </article>

        <div className="mt-12 pt-8 border-t border-paper-200 flex flex-wrap items-center justify-between gap-3">
          <Link href="/yardim" className="inline-flex items-center gap-2 text-sm text-ink-700 hover:text-ink-900">
            <ArrowLeft size={14} weight="bold" /> Tüm Konular
          </Link>
          <Link href="/iletisim" className="inline-flex items-center gap-2 text-sm text-brand-700 font-medium hover:underline">
            Hâlâ yardıma ihtiyacınız var mı? İletişim <ArrowRight size={14} weight="bold" />
          </Link>
        </div>

        {/* Konuyla ilgili diğer makaleler */}
        <section className="mt-12">
          <h3 className="text-sm font-bold uppercase tracking-wider text-ink-500 mb-4">İlgili Konular</h3>
          <div className="grid sm:grid-cols-2 gap-3">
            {Object.values(articles)
              .filter((a) => a.slug !== article.slug)
              .slice(0, 4)
              .map((a) => (
                <Link
                  key={a.slug}
                  href={`/yardim/${a.slug}`}
                  className="p-4 bg-paper-50 border border-paper-200 rounded-lg hover:border-ink-300 transition-colors group"
                >
                  <div className="font-semibold text-ink-900 text-sm">{a.title}</div>
                  <div className="text-xs text-ink-500 mt-0.5 line-clamp-2">{a.description}</div>
                  <span className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-brand-700 group-hover:gap-2 transition-all">
                    Aç <ArrowRight size={10} weight="bold" />
                  </span>
                </Link>
              ))}
          </div>
        </section>

        {/* Şehir/konu silo linkleri — sadece mantıklı eşleşmelerde */}
        {cityLinks && cityLinks.length > 0 && (
          <section className="mt-10">
            <h3 className="text-sm font-bold uppercase tracking-wider text-ink-500 mb-3">
              Şehrinizdeki Hizmetlerimiz
            </h3>
            <div className="flex flex-wrap gap-2">
              {cityLinks.map((c) => (
                <Link
                  key={c.href}
                  href={c.href}
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-paper-50 border border-paper-200 text-sm text-ink-700 hover:border-brand-500 hover:text-brand-700 transition-colors"
                >
                  {c.label}
                  <ArrowRight size={11} weight="bold" />
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Hâlâ yardım gerekiyorsa */}
        <div className="mt-10 p-5 bg-paper-100 border border-paper-200 rounded-xl flex items-start gap-3">
          <ChatCircle size={22} className="flex-none text-brand-700 mt-0.5" />
          <div>
            <div className="font-semibold text-ink-900 text-sm">Cevabınızı bulamadınız mı?</div>
            <p className="text-xs text-ink-500 mt-1">
              <Link href="/iletisim" className="text-brand-700 hover:underline font-medium">İletişim formundan</Link> ulaşın
              ya da <a href="https://wa.me/905319004102" className="text-brand-700 hover:underline font-medium">WhatsApp</a> ile yazın.
            </p>
          </div>
        </div>
      </Container>
    </>
  );
}
