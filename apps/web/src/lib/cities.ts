/**
 * Şehir + ilçe verileri — local SEO landing page'leri için.
 *
 * Strateji: Mersin merkez şehri (atölyeye en yakın), Akdeniz/Doğu Akdeniz
 * bölgesi (1 günlük kargo) + Mersin ilçeleri (kargo/kurye ile 1-2 iş günü).
 *
 * Slug'lar URL'de "matbaa" kelimesini içerir (URL-keyword match).
 */

export interface CityData {
  slug: string;
  name: string;
  region: "akdeniz" | "guneydogu" | "marmara" | "ege" | "icanadolu";
  /** Kargo ulaşım süresi (iş günü) */
  deliveryDays: { min: number; max: number };
  /** Aynı gün motor kurye var mı (artık hiçbir şehirde sunulmuyor) */
  sameDayCourier: boolean;
  /** Bölgenin yaklaşık nüfus (binin) — content için */
  population: string;
  /** Şehrin matbaa konteksti — neden Markala? */
  intro: string;
  /** Önemli mahalleler/iş bölgeleri (içerik zenginliği için) */
  districts?: District[];
  /** Bu şehirden sık alınan ürünler */
  popularProducts: string[];
  /** Bu şehre özel referans/case (sosyal kanıt) */
  localReferences: string[];
  /** Şehirde matbaa için ortak ihtiyaçlar */
  commonNeeds: string[];
  /** Bu şehre özel SSS — FAQPage schema için */
  faqs: { q: string; a: string }[];
  /** Coğrafi koordinat — LocalBusiness schema için */
  geo: { lat: number; lng: number };
  /** Hizmet alanı yarıçap (km) */
  serviceRadius?: number;
}

/** Bölge etiketi — city sayfası hero'sunda gösterilir. */
export const REGION_LABELS: Record<CityData["region"], string> = {
  akdeniz: "Akdeniz Bölgesi",
  guneydogu: "Güneydoğu Anadolu",
  marmara: "Marmara Bölgesi",
  ege: "Ege Bölgesi",
  icanadolu: "İç Anadolu Bölgesi",
};

export interface District {
  slug: string;
  name: string;
  parentCity: string;
  /** Mahalle/iş bölgesi/sanayi sitesi listesi */
  neighborhoods: string[];
  /** Aynı gün teslim mi (artık hiçbir ilçede sunulmuyor) */
  sameDayDelivery: boolean;
  intro: string;
}

// === MERSİN İLÇELERİ ===
const MERSIN_DISTRICTS: District[] = [
  {
    slug: "tarsus",
    name: "Tarsus",
    parentCity: "mersin",
    neighborhoods: [
      "Cumhuriyet Mahallesi",
      "Şahin Mahallesi",
      "Kazanlı",
      "Yenice OSB",
      "Gazipaşa Mahallesi",
      "Yeşil Mahalle",
    ],
    sameDayDelivery: false,
    intro:
      "Tarsus, Mersin'in en yoğun ticaret hacmine sahip ilçelerinden. Otomotiv yan sanayi, tekstil, gıda işletmeleri için kartvizit-broşür-magnet-antetli kâğıt taleplerine kargo/kurye ile 1-2 iş günü teslim sağlıyoruz.",
  },
  {
    slug: "yenisehir",
    name: "Yenişehir",
    parentCity: "mersin",
    neighborhoods: [
      "Bahçelievler",
      "Eğriçam",
      "Mahmudiye",
      "Pirireis",
      "Çiftlikköy",
      "Menteş",
      "Fındıkpınarı",
    ],
    sameDayDelivery: false,
    intro:
      "Yenişehir, Mersin'in modern iş ve eğitim merkezi. Mersin Üniversitesi, hastaneler, hukuk büroları ve danışmanlık ofisleri için kurumsal kimlik, antetli kâğıt, dosya ve bloknot ihtiyaçlarına kargo/kurye ile 1-2 iş günü teslim.",
  },
  {
    slug: "akdeniz",
    name: "Akdeniz",
    parentCity: "mersin",
    neighborhoods: [
      "Hal Mahallesi",
      "Nusratiye",
      "Çay Mahallesi",
      "Camişerif",
      "Kazanlı OSB",
      "Liman Caddesi",
      "Anadolu Mahallesi",
    ],
    sameDayDelivery: false,
    intro:
      "Akdeniz ilçesi Mersin Liman bölgesini ve eski şehir merkezini kapsar. Lojistik firmaları, ihracatçılar, gümrük müşavirleri için kaşe, etiket, faturalama formu ve nakliye broşürlerinde uzmanız.",
  },
  {
    slug: "toroslar",
    name: "Toroslar",
    parentCity: "mersin",
    neighborhoods: [
      "Yalınayak",
      "Akbelen",
      "Çağdaşkent",
      "Halkkent",
      "Toroslar Sanayi",
      "Demirhisar",
    ],
    sameDayDelivery: false,
    intro:
      "Toroslar, üretim ve sanayi sitelerinin yoğun olduğu ilçe. İmalathaneler, atölyeler ve toptancılar için yapışkanlı etiket, koli yazı, magnet ve kartvizit baskısında hızlı çözüm sunuyoruz.",
  },
  {
    slug: "mezitli",
    name: "Mezitli",
    parentCity: "mersin",
    neighborhoods: [
      "Akdeniz Mahallesi",
      "Davultepe",
      "Tece",
      "Soğucak",
      "Kuzucubelen",
    ],
    sameDayDelivery: false,
    intro:
      "Mezitli, sahil bandında turistik tesislerin yoğun olduğu ilçe. Otel, restoran, kafe ve emlak ofisleri için menü kartı, masa standı, broşür ve afiş baskısında deneyimliyiz.",
  },
  {
    slug: "erdemli",
    name: "Erdemli",
    parentCity: "mersin",
    neighborhoods: [
      "Merkez Mahalle",
      "Limonlu",
      "Kocahasanlı",
      "Tömük",
      "Kargıpınarı",
    ],
    sameDayDelivery: false,
    intro:
      "Erdemli, narenciye üretiminin başkenti. Ambalaj etiketi, kasa baskısı, ihracat dokümanları ve tarım broşürleri için kargo ile 1 iş günü ulaşıyoruz.",
  },
  {
    slug: "silifke",
    name: "Silifke",
    parentCity: "mersin",
    neighborhoods: [
      "Atatürk Mahallesi",
      "Cumhuriyet Mahallesi",
      "Taşucu",
      "Akdere",
    ],
    sameDayDelivery: false,
    intro:
      "Silifke, antik Akdeniz şehri — turizm ve narenciye odaklı. Otel, restoran, müze ve seyahat acentaları için broşür, harita, ticket ve giriş kartı üretiyoruz.",
  },
  {
    slug: "anamur",
    name: "Anamur",
    parentCity: "mersin",
    neighborhoods: [
      "Bahçe Mahallesi",
      "Yeşilyurt",
      "Ortaköy",
      "Kalınören",
    ],
    sameDayDelivery: false,
    intro:
      "Anamur, Türkiye'nin en güney ucu — muz ve fıstık üretimiyle bilinir. Tarımsal ihracat ambalajı, etiket ve B2B promosyon ürünlerine kargo ile 1-2 gün teslim.",
  },
];

// === ANA ŞEHİRLER ===
export const cities: CityData[] = [
  {
    slug: "mersin",
    name: "Mersin",
    region: "akdeniz",
    deliveryDays: { min: 1, max: 2 },
    sameDayCourier: false,
    population: "1.916.000",
    intro:
      "Mersin merkezli matbaa atölyemiz, Mersin ve çevresine kurye/kargo ile 1-2 iş günü teslimat sağlar. Mersin Limanı, Yenişehir ticaret bölgesi, Tarsus OSB ve Toroslar sanayi siteleri çevresinde 12.000+ aktif müşteriye matbaa hizmeti veriyoruz.",
    districts: MERSIN_DISTRICTS,
    popularProducts: [
      "Klasik kartvizit (selefonlu/UV/yaldız)",
      "Kurumsal antetli kâğıt + zarf seti",
      "Restoran menü kartı ve masa standı",
      "Otel anahtar zarfı ve kart",
      "Liman/lojistik etiketi ve sevk irsaliyesi",
      "Tarım/narenciye etiket ve ambalaj baskısı",
      "Fuar standı broşürü ve rollup",
    ],
    localReferences: [
      "Akdeniz Otel İşletmeleri",
      "Mersin Marina Restoran",
      "Lisan Fen Eğitim Kurumları",
      "Tarsus OSB üyesi 14 firma",
      "Mersin Üniversitesi yan binaları (4 fakülte)",
    ],
    commonNeeds: [
      "Hızlı kartvizit baskı",
      "Mersin Limanı evrak ve etiket baskısı",
      "Sanayi sitelerinde forma kâğıt ve makbuz",
      "Üniversite çevresinde fotokopi-baskı dışı premium iş",
      "Sahil bandı turizm sezonu menü revizyonu",
    ],
    faqs: [
      {
        q: "Mersin'de kartvizit baskı yapıyor musunuz?",
        a: "Evet. Mersin ve ilçelerine kurye/kargo ile genellikle 1-2 iş günü içinde teslim ediyoruz.",
      },
      {
        q: "Mersin'de matbaa ücreti rakiplerden farklı mı?",
        a: "Atölyemizin Mersin'de olması nedeniyle aracı, depo veya nakliye masrafı yok — kıyaslandığında %15-25 daha uygun fiyat veriyoruz. Online konfigüratörden ürün seçip anında fiyat görebilirsiniz.",
      },
      {
        q: "Tarsus, Yenişehir, Toroslar, Mezitli'ye teslim ediyor musunuz?",
        a: "Evet, Mersin'in 13 ilçesinin tamamına kurye veya kargo ile teslim ediyoruz. Mersin'in tüm ilçelerine kurye/kargo ile 1-2 iş günü içinde teslim sağlanır.",
      },
      {
        q: "Mersin Limanı'na evrak baskısı yapar mısınız?",
        a: "Evet. Lojistik şirketleri, gümrük müşavirleri ve ihracatçılar için CMR, sevk irsaliyesi, etiket ve konteyner numarası baskısı yapıyoruz.",
      },
      {
        q: "Mersin'deki ofisinizi ziyaret edebilir miyim?",
        a: "Evet — randevu ile Yenişehir'deki atölye ve showroom'umuza gelebilirsiniz. Numune kâğıtları, baskı türleri ve renk kataloglarını yerinde görebilirsiniz.",
      },
    ],
    geo: { lat: 36.812061, lng: 34.641482 },
    serviceRadius: 80,
  },

  {
    slug: "antalya",
    name: "Antalya",
    region: "akdeniz",
    deliveryDays: { min: 1, max: 2 },
    sameDayCourier: false,
    population: "2.696.000",
    intro:
      "Antalya, Türkiye'nin turizm başkenti. Otel, restoran, marina ve kongre merkezi yoğunluğu nedeniyle matbaa talebi yıl boyunca sezonsal olarak artıp azalır. Markala olarak Antalya'ya 1-2 iş günü içinde DHL kargo ile ulaşıyoruz; sezon başı toplu kampanyalı paketlerimiz var.",
    popularProducts: [
      "Otel anahtar zarfı ve kart",
      "Restoran menü kartı, masa standı, peçete altı",
      "Marina yat hizmeti broşürü",
      "Kongre/etkinlik yaka kartı, broşür",
      "Plaj/havuz menü ve self-stand",
    ],
    localReferences: [
      "Antalya bölgesinden 80+ otel ve restoran",
      "Lara, Kemer, Belek, Side, Manavgat çevresi",
    ],
    commonNeeds: [
      "Sezon başı (Mart-Nisan) toplu menü baskısı",
      "Çoklu dil menü (TR/EN/RU/DE) tasarım + baskı",
      "UV dayanıklı havuz/plaj ürünleri",
    ],
    faqs: [
      {
        q: "Antalya'ya kaç günde teslim ediyorsunuz?",
        a: "DHL Express ile Antalya merkez, Lara, Kemer, Belek, Side ve Manavgat'a 1-2 iş günü içinde teslim ediyoruz. Acil siparişlerde sabah uçağıyla 1 günde ulaşım da mümkün.",
      },
      {
        q: "Antalya'daki otelime özel menü tasarımı yapıyor musunuz?",
        a: "Evet. 324 Ajans tasarım ekibimiz otelinizin marka kimliğine uygun çoklu dil menü (Türkçe, İngilizce, Rusça, Almanca) tasarlar; UV ve nem dayanıklı kâğıt seçenekleriyle basarız.",
      },
      {
        q: "Antalya bölgesinde toplu sipariş indirimi var mı?",
        a: "Evet. Toplu otel-restoran siparişlerinde firmanıza özel avantajlı fiyatlandırma, açık fatura ve aylık kapanış imkânı sunuyoruz. Kurumsal hesap başvurusu yapabilirsiniz.",
      },
    ],
    geo: { lat: 36.896891, lng: 30.713323 },
  },

  {
    slug: "adana",
    name: "Adana",
    region: "akdeniz",
    deliveryDays: { min: 1, max: 1 },
    sameDayCourier: false,
    population: "2.274.000",
    intro:
      "Adana, Çukurova'nın ticaret ve sanayi merkezi. Tekstil, gıda, otomotiv ve tarım sektörlerinin yoğun olduğu Adana'ya Mersin atölyemizden 1 iş günü içinde DHL ile teslim sağlıyoruz. Komşu il olarak nakliye süresi en kısa.",
    popularProducts: [
      "Tekstil etiket ve barkod",
      "Gıda ambalaj etiketi",
      "Restoran menü ve masa standı",
      "Otomotiv yan sanayi katalog",
      "Tarım ürünü kasa baskısı",
    ],
    localReferences: [
      "Adana Sanayi Odası üyesi 12 firma",
      "Adana OSB içi tekstil firmaları",
      "Seyhan & Yüreğir restoranları",
    ],
    commonNeeds: [
      "Tekstil yıkama etiketi (UV dayanıklı)",
      "Tarım ihracat ambalajı (çoklu dil)",
      "Hızlı sezon ürün etiketi (kebap, lahmacun, şalgam)",
    ],
    faqs: [
      {
        q: "Adana'ya teslimat kaç günde?",
        a: "DHL Express ile Adana merkez ve OSB'ye 1 iş günü içinde teslim. Sabah verilen sipariş ertesi öğle teslim edilir.",
      },
      {
        q: "Adana'daki tekstil firmasıyım, etiket baskısı yapar mısınız?",
        a: "Evet. Yıkama dayanıklı saten etiket, kompozit etiket ve barkod basımı yapıyoruz. Toplu (10.000+ adet) siparişlerde özel fiyat.",
      },
    ],
    geo: { lat: 37.000000, lng: 35.321335 },
  },

  {
    slug: "sanliurfa",
    name: "Şanlıurfa",
    region: "guneydogu",
    deliveryDays: { min: 1, max: 2 },
    sameDayCourier: false,
    population: "2.143.000",
    intro:
      "Şanlıurfa, Türkiye'nin en hızlı büyüyen şehirlerinden. Tekstil, tarım, gıda ve hizmet sektörlerinde matbaa ihtiyaçlarına Mersin merkezimizden 1-2 iş günü içinde teslim sağlıyoruz.",
    popularProducts: [
      "Restoran menü kartı (Urfa mutfağı için özel)",
      "Tekstil etiket ve marka kart",
      "Hediyelik ürün ambalaj baskısı",
      "Otel ve pansiyon broşürü",
      "Tarım kooperatifi katalog",
    ],
    localReferences: [
      "Şanlıurfa restoran ve otel sektörü",
      "Tekstil ve konfeksiyon firmaları",
    ],
    commonNeeds: [
      "Çiğ köfte, lahmacun, kebap menüsü",
      "Hediyelik (sabun, baharat) ambalajı",
      "Otel için Türkçe-Arapça-İngilizce menü",
    ],
    faqs: [
      {
        q: "Şanlıurfa'ya teslimat kaç günde?",
        a: "DHL ile Şanlıurfa merkez ve ilçelere 1-2 iş günü içinde teslim. Acil işlerde uçak kargoyla 1 günde ulaşım mümkün.",
      },
      {
        q: "Çoklu dilli menü (Arapça dahil) basabiliyor musunuz?",
        a: "Evet. Türkçe, İngilizce, Almanca, Rusça ve Arapça menü tasarımı ve baskısı yapıyoruz. Arapça için sağdan sola düzen otomatik uygulanır.",
      },
    ],
    geo: { lat: 37.166113, lng: 38.793884 },
  },

  {
    slug: "hatay",
    name: "Hatay",
    region: "akdeniz",
    deliveryDays: { min: 1, max: 2 },
    sameDayCourier: false,
    population: "1.686.000",
    intro:
      "Hatay (Antakya, İskenderun, Dörtyol), Akdeniz'in tarihi ve kültürel zenginliğe sahip ili. Restoran, otel, lojistik ve narenciye sektörleri yoğun. Mersin'den 1-2 iş günü içinde ulaşıyoruz; Antakya'nın yeniden inşa sürecinde küçük işletmelere özel kampanyamız var.",
    popularProducts: [
      "Restoran menü (Antakya mutfağı için)",
      "Otel ve butik pansiyon broşürü",
      "Antakya el sanatları ambalajı",
      "Lojistik ve İskenderun limanı evrak baskısı",
    ],
    localReferences: [
      "Antakya restoran ve butik otel sektörü",
      "İskenderun liman bölgesi lojistik firmaları",
    ],
    commonNeeds: [
      "Restoran sezon menü revizyonu",
      "Antik motif kurumsal kimlik tasarımı",
      "İhracat ambalajı (sabun, defne yağı)",
    ],
    faqs: [
      {
        q: "Hatay deprem bölgesi olarak özel kampanya var mı?",
        a: "Evet. Antakya ve çevresindeki işini yeniden ayağa kaldıran küçük işletmelere ilk siparişte %20 indirim ve ücretsiz tasarım desteği veriyoruz. WhatsApp veya kurumsal başvurudan iletişime geçebilirsiniz.",
      },
      {
        q: "İskenderun limanı için lojistik evrak baskısı yapar mısınız?",
        a: "Evet — CMR, sevk irsaliyesi, etiket, konteyner numarası ve gümrük formları için 1-2 iş günü içinde teslim ediyoruz.",
      },
    ],
    geo: { lat: 36.402150, lng: 36.349534 },
  },

  {
    slug: "osmaniye",
    name: "Osmaniye",
    region: "akdeniz",
    deliveryDays: { min: 1, max: 1 },
    sameDayCourier: false,
    population: "550.000",
    intro:
      "Osmaniye, Çukurova ve Doğu Akdeniz arasında kavşak konumda. Demir-çelik, tarım ve gıda sektörleri yoğun. Mersin'den 1 iş günü içinde DHL ile teslim sağlıyoruz; OSB içi firmalara özel kurumsal hesap.",
    popularProducts: [
      "Demir-çelik üretim etiket ve barkod",
      "Gıda ambalaj baskısı",
      "Yer fıstığı ve tahıl ambalajı",
      "Restoran menü ve kart",
    ],
    localReferences: ["Osmaniye OSB üyesi 8+ firma"],
    commonNeeds: [
      "Endüstriyel etiket (yağ ve sıcaklığa dayanıklı)",
      "Gıda ihracat ambalajı",
    ],
    faqs: [
      {
        q: "Osmaniye'ye teslimat süresi nedir?",
        a: "Mersin atölyemizden DHL ile Osmaniye'ye 1 iş günü içinde teslim. Sabah verilen sipariş ertesi gün öğle saatlerinde elinizde.",
      },
    ],
    geo: { lat: 37.069569, lng: 36.247221 },
  },

  {
    slug: "gaziantep",
    name: "Gaziantep",
    region: "guneydogu",
    deliveryDays: { min: 1, max: 2 },
    sameDayCourier: false,
    population: "2.130.000",
    intro:
      "Gaziantep, Güneydoğu'nun ticaret ve sanayi başkenti. Tekstil, makine, gıda (baklava, fıstık) ve mobilya sektörleri yoğun. Mersin'den 1-2 iş günü içinde DHL ile teslim sağlıyoruz; Gaziantep OSB ve sanayi sitelerine özel kurumsal teklif.",
    popularProducts: [
      "Baklava/fıstık premium ambalaj baskısı",
      "Tekstil etiket ve kart",
      "Mobilya katalog ve broşür",
      "Restoran menü (Antep mutfağı)",
      "Hediyelik ürün ambalajı",
    ],
    localReferences: [
      "Gaziantep OSB üyesi 15+ firma",
      "Antep baklava ve baharat üreticileri",
    ],
    commonNeeds: [
      "Premium baklava kutu baskısı (yaldız + selefon)",
      "Fıstık ihracat ambalajı (çoklu dil)",
      "Mobilya katalog ve broşür",
    ],
    faqs: [
      {
        q: "Gaziantep'e baklava kutusu basıyor musunuz?",
        a: "Evet. Premium baklava kutuları için yaldızlı, selefonlu, kabartmalı tasarımlar yapıyoruz. 1.000+ adet siparişte özel fiyat.",
      },
      {
        q: "Gaziantep'e teslimat süresi?",
        a: "DHL Express ile Gaziantep merkez ve OSB'ye 1-2 iş günü içinde teslim.",
      },
    ],
    geo: { lat: 37.066135, lng: 37.378361 },
  },

  // === UZAK BÜYÜKŞEHİRLER ===
  // Yerel referans iddiası YOK (localReferences boş — bölüm gizlenir); teslimat DHL ile
  // 1-2 iş günü. İçerik şehrin gerçek sektör profiline göre yazılmıştır.
  {
    slug: "istanbul",
    name: "İstanbul",
    region: "marmara",
    deliveryDays: { min: 1, max: 2 },
    sameDayCourier: false,
    population: "15.700.000",
    intro:
      "İstanbul'daki ajanslar, e-ticaret markaları ve etkinlik firmaları için online matbaa çözümü: siparişini web'den yapılandır, Mersin atölyemizde üretilsin, DHL Express ile 1-2 iş günü içinde İstanbul'un her ilçesine teslim edilsin. Şehir içi matbaa trafiğine girmeden, KDV dahil net fiyatla.",
    popularProducts: [
      "Kartvizit (selefonlu/UV/yaldız)",
      "E-ticaret ambalaj etiketi ve sticker",
      "Katalog ve broşür baskısı",
      "Fuar-etkinlik rollup ve branda",
      "Şantiye İSG uyarı levhaları",
    ],
    localReferences: [],
    commonNeeds: [
      "E-ticaret paketleri için marka etiketi ve sticker",
      "Plaza ofisleri için kurumsal kimlik seti (kartvizit + antetli + zarf)",
      "Kongre, lansman ve fuar baskıları (rollup, yaka kartı, broşür)",
      "İnşaat projeleri için İSG levha setleri",
    ],
    faqs: [
      {
        q: "İstanbul'a teslimat kaç günde?",
        a: "DHL Express ile İstanbul'un tüm ilçelerine (Avrupa ve Anadolu yakası) 1-2 iş günü içinde teslim ediyoruz. Sabah onaylanan sipariş genellikle ertesi gün kargodadır.",
      },
      {
        q: "İstanbul'da matbaa varken neden online sipariş vereyim?",
        a: "Fiyat ve netlik: üretim Mersin'de kendi atölyemizde yapıldığı için aracı maliyeti yok; fiyatlar KDV dahil sitede yazar, sepette değişmez. Trafikte numune kovalamak yerine kargoyla kapına gelir; tasarım desteği de ücretsizdir.",
      },
      {
        q: "Acil işlerde süre kısalır mı?",
        a: "Üretim çoğu üründe 1-2 iş günüdür; acil durumda WhatsApp'tan yazın, üretim sırasını öne alma ve uçak kargo seçeneklerini birlikte değerlendirelim.",
      },
    ],
    geo: { lat: 41.008238, lng: 28.978359 },
  },

  {
    slug: "ankara",
    name: "Ankara",
    region: "icanadolu",
    deliveryDays: { min: 1, max: 2 },
    sameDayCourier: false,
    population: "5.800.000",
    intro:
      "Ankara'daki kurumlar, üniversiteler ve OSTİM-İvedik sanayi bölgeleri için online matbaa: antetli kağıttan İSG levhalarına siparişini web'den yapılandır, DHL Express ile 1-2 iş günü içinde teslim al. KDV dahil net fiyat, e-arşiv fatura ve kurumsal cari hesap imkânıyla.",
    popularProducts: [
      "Antetli kağıt + zarf kurumsal set",
      "Makbuz, fatura ve form baskısı",
      "Kartvizit (selefonlu/UV)",
      "Seminer-kongre rollup ve broşür",
      "OSTİM/İvedik atölyeleri için İSG levhaları",
    ],
    localReferences: [],
    commonNeeds: [
      "Kurum ve dernekler için evrak-form baskısı",
      "Sanayi sitelerinde iş güvenliği levha setleri",
      "Üniversite etkinlikleri için afiş ve rollup",
      "Muhasebe ofisleri için makbuz ve kaşe",
    ],
    faqs: [
      {
        q: "Ankara'ya teslimat kaç günde?",
        a: "DHL Express ile Ankara merkez, OSTİM, İvedik ve tüm ilçelere 1-2 iş günü içinde teslim ediyoruz.",
      },
      {
        q: "Kurumsal fatura ve cari hesap açıyor musunuz?",
        a: "Evet. Kurumsal hesap başvurusuyla açık fatura, ay sonu kapanış ve firmanıza özel fiyatlandırma sunuyoruz; e-arşiv/e-fatura otomatik kesilir.",
      },
    ],
    geo: { lat: 39.933365, lng: 32.859742 },
  },

  {
    slug: "izmir",
    name: "İzmir",
    region: "ege",
    deliveryDays: { min: 1, max: 2 },
    sameDayCourier: false,
    population: "4.500.000",
    intro:
      "İzmir'in fuar, liman ve turizm ekosistemi için online matbaa: Fuar İzmir etkinlikleri, Kemeraltı esnafı ve Alsancak ofisleri siparişini web'den verir, DHL Express ile 1-2 iş günü içinde teslim alır. KDV dahil net fiyat ve ücretsiz tasarım desteğiyle.",
    popularProducts: [
      "Fuar rollup, branda ve broşür seti",
      "İhracat ambalaj etiketi",
      "Restoran-kafe menü baskıları",
      "Kartvizit ve kurumsal kimlik seti",
      "Liman-lojistik evrak ve etiket baskısı",
    ],
    localReferences: [],
    commonNeeds: [
      "Fuar sezonu stand baskıları (rollup + broşür + yaka kartı)",
      "Ege ihracatçıları için çoklu dil ambalaj etiketi",
      "Sahil bandı işletmeleri için menü ve tanıtım baskısı",
    ],
    faqs: [
      {
        q: "İzmir'e teslimat kaç günde?",
        a: "DHL Express ile İzmir merkez ve tüm ilçelere 1-2 iş günü içinde teslim ediyoruz. Fuar öncesi yoğun dönemlerde siparişi birkaç gün önceden vermenizi öneririz.",
      },
      {
        q: "Fuar standım için toplu paket yapıyor musunuz?",
        a: "Evet — rollup, masa broşürü, yaka kartı ve stand brandasını tek siparişte toplayabilir, toplu sipariş için teklif alabilirsiniz.",
      },
    ],
    geo: { lat: 38.423734, lng: 27.142826 },
  },

  {
    slug: "bursa",
    name: "Bursa",
    region: "marmara",
    deliveryDays: { min: 1, max: 2 },
    sameDayCourier: false,
    population: "3.200.000",
    intro:
      "Bursa'nın otomotiv, tekstil ve mobilya (İnegöl) sanayisi için online matbaa: fabrika İSG levhalarından ürün etiketine siparişini web'den yapılandır, DHL Express ile 1-2 iş günü içinde teslim al. KDV dahil net fiyat ve kurumsal cari hesap imkânıyla.",
    popularProducts: [
      "Fabrika İSG uyarı ve talimat levhaları",
      "Tekstil etiket ve barkod baskısı",
      "Mobilya katalog ve broşür",
      "Kartvizit ve kurumsal kimlik seti",
      "Vinil branda ve dekota tabela",
    ],
    localReferences: [],
    commonNeeds: [
      "OSB fabrikaları için İSG levha setleri",
      "Tekstil ve konfeksiyon etiketi",
      "İnegöl mobilyacıları için katalog baskısı",
    ],
    faqs: [
      {
        q: "Bursa'ya teslimat kaç günde?",
        a: "DHL Express ile Bursa merkez, OSB'ler ve İnegöl dahil tüm ilçelere 1-2 iş günü içinde teslim ediyoruz.",
      },
      {
        q: "Fabrikamız için İSG levha seti hazırlar mısınız?",
        a: "Evet. 800'den fazla İSG levhası içeren katalogdan işyeri tipinize göre set önerisi hazırlıyoruz; toplu alımda adet indirimi uygulanır.",
      },
    ],
    geo: { lat: 40.195, lng: 29.06 },
  },

  {
    slug: "konya",
    name: "Konya",
    region: "icanadolu",
    deliveryDays: { min: 1, max: 2 },
    sameDayCourier: false,
    population: "2.300.000",
    intro:
      "Konya'nın tarım makineleri, döküm ve gıda sanayisi için online matbaa: makine etiketinden İSG levhasına siparişini web'den yapılandır, DHL Express ile 1-2 iş günü içinde teslim al. KDV dahil net fiyat ve toplu alım indirimleriyle.",
    popularProducts: [
      "Makine ve ekipman etiketi",
      "Sanayi İSG uyarı levhaları",
      "Gıda ambalaj etiketi",
      "Kartvizit ve broşür baskısı",
      "Vinil branda ve dekota tabela",
    ],
    localReferences: [],
    commonNeeds: [
      "Tarım makinesi üreticileri için dayanıklı etiket",
      "OSB fabrikaları için İSG levha setleri",
      "Gıda üreticileri için ambalaj etiketi",
    ],
    faqs: [
      {
        q: "Konya'ya teslimat kaç günde?",
        a: "DHL Express ile Konya merkez ve OSB'lere 1-2 iş günü içinde teslim ediyoruz.",
      },
      {
        q: "Makine etiketleri yağa ve sıcağa dayanır mı?",
        a: "Evet — endüstriyel kullanım için selefonlu ve folyo malzeme seçenekleri sunuyoruz; kullanım koşulunuzu belirtirseniz doğru malzemeyi öneririz.",
      },
    ],
    geo: { lat: 37.8716, lng: 32.4846 },
  },
];

// === Helpers ===

export function getCityBySlug(slug: string): CityData | undefined {
  return cities.find((c) => c.slug === slug);
}

export function getDistrictBySlug(
  citySlug: string,
  districtSlug: string,
): District | undefined {
  const city = getCityBySlug(citySlug);
  return city?.districts?.find((d) => d.slug === districtSlug);
}

export function getAllDistrictParams(): { city: string; district: string }[] {
  return cities.flatMap(
    (c) =>
      c.districts?.map((d) => ({ city: c.slug, district: d.slug })) ?? [],
  );
}

export function getNearbyCities(slug: string, count = 3): CityData[] {
  const current = getCityBySlug(slug);
  if (!current) return [];
  const sameRegion = cities.filter((c) => c.slug !== slug && c.region === current.region);
  // Tek/az şehirli bölgelerde (ör. Ege) boş kalan slotları diğer illerle doldur —
  // iç link ağı kopmasın.
  const others = cities.filter((c) => c.slug !== slug && c.region !== current.region);
  return [...sameRegion, ...others].slice(0, count);
}
