/**
 * Hizmet sayfaları veri katmanı — SEO landing'ler için.
 */

export interface ServiceData {
  slug: string;
  title: string;
  metaTitle: string;
  metaDescription: string;
  keywords: string[];
  /** Hero açıklama */
  intro: string;
  /** 4-6 fayda */
  benefits: { icon?: string; title: string; desc: string }[];
  /** 3-5 adımlı süreç */
  process: { n: string; title: string; desc: string; duration?: string }[];
  /** SSS — FAQPage schema için */
  faqs: { q: string; a: string }[];
  /** Service schema fiyat aralığı */
  priceRange?: { min: number; max: number };
  /** İlgili ürünler */
  relatedProductSlugs?: string[];
}

export const services: ServiceData[] = [
  {
    slug: "tasarim-destegi",
    title: "Ücretsiz Tasarım Desteği",
    metaTitle: "Ücretsiz Matbaa Tasarım Desteği — Profesyonel Grafik Ekibi",
    metaDescription:
      "Markala matbaa siparişlerinizde ücretsiz tasarım desteği. Profesyonel grafik tasarımcı ekibimizle kartvizit, broşür, logo ve kurumsal kimlik tasarımı.",
    keywords: [
      "ücretsiz matbaa tasarım",
      "tasarım desteği matbaa",
      "ücretsiz kartvizit tasarım",
      "broşür tasarım hizmeti",
      "grafik tasarım ücretsiz",
      "matbaa tasarım hizmeti",
      "324 ajans tasarım",
      "logo tasarım ücretsiz",
    ],
    intro:
      "Markala'da matbaa siparişi veren herkesin kullanabileceği ücretsiz tasarım desteği — 324 Ajans grafik ekibimizle kartvizitten kurumsal kimliğe kadar her tasarım ihtiyacınız karşılansın. Ekstra ücret yok, sınırsız revize.",
    benefits: [
      {
        title: "Sıfırdan tasarım",
        desc: "Hazır dosyanız yoksa biz sıfırdan tasarlarız — sadece briefinizi alın.",
      },
      {
        title: "Sınırsız revize",
        desc: "Onaylayana kadar revize hakkınız sınırsız. Ek ücret yok.",
      },
      {
        title: "324 Ajans deneyimi",
        desc: "10+ yıllık reklam ajansı tecrübesi her tasarımda.",
      },
      {
        title: "Hızlı teslim",
        desc: "İlk taslak 4-24 saat içinde, onay sonrası üretim 1-2 iş günü.",
      },
      {
        title: "Pantone & CMYK uyum",
        desc: "Kurumsal renk kodlarınıza uygun, baskıya hazır dosyalar.",
      },
      {
        title: "Tüm formatlarda dosya",
        desc: "AI, PDF/X, PNG, JPG — sonradan başka iş için de kullanın.",
      },
    ],
    process: [
      {
        n: "1",
        title: "Brief verin",
        desc: "Sipariş sırasında 'Tasarım desteği istiyorum' işaretleyin, kısa brief yazın.",
        duration: "2 dk",
      },
      {
        n: "2",
        title: "İlk taslak",
        desc: "Grafik ekibimiz 4-24 saat içinde 2 farklı taslak gönderir.",
        duration: "4-24 sa",
      },
      {
        n: "3",
        title: "Revize",
        desc: "Onaylayana kadar değişiklik isteyin — sınırsız.",
        duration: "Müşteriye bağlı",
      },
      {
        n: "4",
        title: "Onay & Üretim",
        desc: "Onayladığınız tasarım üretime alınır, kargo ile teslim edilir.",
        duration: "1-2 iş günü",
      },
    ],
    faqs: [
      {
        q: "Tasarım desteği gerçekten ücretsiz mi?",
        a: "Evet, %100 ücretsiz. Sipariş tutarına dahildir, ek ücret kesinlikle yoktur. Sıfırdan tasarım veya mevcut tasarımınızda küçük revize farketmez.",
      },
      {
        q: "Kaç revize hakkım var?",
        a: "Sınırsız. Onaylayana kadar istediğiniz kadar değişiklik talebinde bulunabilirsiniz. Genellikle 2-3 revize sonrası nihai tasarıma ulaşılır.",
      },
      {
        q: "Logo tasarımı da yapıyor musunuz?",
        a: "Evet. Sıfırdan logo tasarımı için 324 Ajans'a yönlendiriyoruz — 7-14 iş günü içinde 3 alternatif sunulur. Markala matbaa siparişiyle birlikte sipariş verirseniz %15 indirim.",
      },
      {
        q: "Tasarım dosyamı sonradan başka matbaada kullanabilir miyim?",
        a: "Tabii ki. Tüm dosyaları (AI, PDF/X, PNG) size eksiksiz teslim ediyoruz. Telif hakkı sizindir — istediğiniz yerde kullanabilirsiniz.",
      },
      {
        q: "Brand guideline / kurumsal kimlik tasarımı yapıyor musunuz?",
        a: "Evet, 324 Ajans tarafından yapılır. Logo + renk paleti + tipografi + 5+ basılı uygulama (kartvizit, antetli, zarf vs) içeren tam paket. Detay için /kurumsal sayfasına bakabilirsiniz.",
      },
    ],
    priceRange: { min: 0, max: 0 },
    relatedProductSlugs: ["klasik-kartvizit", "brosur", "antetli-kagit"],
  },

  {
    slug: "toplu-baski",
    title: "Toplu Baskı & Kurumsal İndirim",
    metaTitle: "Toplu Matbaa Siparişi — Avantajlı Fiyat, Açık Fatura, B2B",
    metaDescription:
      "Toplu matbaa siparişlerinde firmanıza özel avantajlı fiyatlandırma, açık fatura, dedicated müşteri temsilcisi. Kurumsal hesap başvurusu 1-2 iş gününde onaylanır.",
    keywords: [
      "toplu matbaa siparişi",
      "toplu baskı indirim",
      "kurumsal matbaa fiyat",
      "b2b matbaa",
      "açık fatura matbaa",
      "kurumsal kartvizit baskı",
      "toplu kartvizit",
      "yıllık matbaa anlaşması",
    ],
    intro:
      "Düzenli matbaa harcaması yapan firmalara özel: firmanıza özel avantajlı fiyatlandırma, açık fatura, ay sonu kapanış, dedicated müşteri temsilcisi ve öncelikli üretim. Kurumsal hesap 1-2 iş gününde onaylanır.",
    benefits: [
      {
        title: "Firmanıza özel avantajlı fiyat",
        desc: "Bireysel fiyatların üzerine sipariş hacminize göre özel fiyatlandırma.",
      },
      {
        title: "30 gün açık fatura",
        desc: "Cari hesap onayı sonrası ay sonu toplu fatura, EFT/havale ödeme.",
      },
      {
        title: "Öncelikli üretim",
        desc: "Kurumsal siparişler kuyrukta öne alınır, acil işlerde 24 saat.",
      },
      {
        title: "Dedicated temsilci",
        desc: "Tek noktadan iletişim, WhatsApp + telefon doğrudan hat.",
      },
      {
        title: "Sabit fiyat anlaşması",
        desc: "Yıllık çerçeve sözleşme — fiyat artışlarından etkilenmezsiniz.",
      },
      {
        title: "Tasarım dahil",
        desc: "Tüm tasarım hizmetleri ücretsiz, brand guideline uyumlu.",
      },
    ],
    process: [
      {
        n: "1",
        title: "Başvuru",
        desc: "/kurumsal/basvuru üzerinden vergi levhası + imza sirküleri yükleyin.",
        duration: "5 dk",
      },
      {
        n: "2",
        title: "Mali değerlendirme",
        desc: "Mali ekibimiz 1-2 iş günü içinde değerlendirir.",
        duration: "1-2 iş günü",
      },
      {
        n: "3",
        title: "Onay & aktivasyon",
        desc: "Onaylanırsa kurumsal hesap aktif, ek indirimler tanımlanır.",
        duration: "24 saat",
      },
      {
        n: "4",
        title: "İlk sipariş",
        desc: "İlk toplu siparişinizde tüm avantajları kullanmaya başlayın.",
        duration: "—",
      },
    ],
    faqs: [
      {
        q: "Hangi adetten itibaren toplu sayılır?",
        a: "5.000+ kartvizit, 2.500+ broşür, 1.000+ etiket gibi ürün bazlı eşikler vardır. Yüksek adetli siparişlerde firmanıza özel fiyatlandırma sunulur.",
      },
      {
        q: "Yıllık sözleşme zorunlu mu?",
        a: "Hayır. Tek seferlik toplu sipariş de avantajlı fiyatlandırmadan yararlanır. Yıllık sözleşme ek avantajlar ve fiyat istikrarı sağlar.",
      },
      {
        q: "Açık fatura için kredi limiti nasıl belirlenir?",
        a: "Mali ekibimiz vergi levhası, ciro ve sektör dinamiklerine göre firmanıza özel kredi limitini belirler.",
      },
      {
        q: "Hangi ödeme vadeleri mevcut?",
        a: "Standart 30 gün açık fatura. Kurumsal müşterilerimize firmanıza özel esnek ödeme ve vade seçenekleri sunulur.",
      },
      {
        q: "Ürün stoklama yapıyor musunuz?",
        a: "Evet. Kurumsal müşteriler için 6 aylık stok hizmeti vermekteyiz — ayda otomatik teslim. Aylık abonelik modeli mevcut.",
      },
    ],
    priceRange: { min: 5000, max: 500000 },
    relatedProductSlugs: ["klasik-kartvizit", "brosur", "antetli-kagit", "afis-105gr"],
  },
];

export function getServiceBySlug(slug: string): ServiceData | undefined {
  return services.find((s) => s.slug === slug);
}
