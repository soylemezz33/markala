/**
 * Şehir + ilçe verileri — local SEO landing page'leri için.
 *
 * Strateji: Mersin merkez şehri (atölyeye en yakın), Akdeniz/Doğu Akdeniz
 * bölgesi (1 günlük kargo) + Mersin ilçeleri (aynı gün motor kuryeci).
 *
 * Slug'lar URL'de "matbaa" kelimesini içerir (URL-keyword match).
 */

export interface CityData {
  slug: string;
  name: string;
  region: "akdeniz" | "guneydogu";
  /** Kargo ulaşım süresi (iş günü) */
  deliveryDays: { min: number; max: number };
  /** Aynı gün motor kurye var mı */
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

export interface District {
  slug: string;
  name: string;
  parentCity: string;
  /** Mahalle/iş bölgesi/sanayi sitesi listesi */
  neighborhoods: string[];
  /** Aynı gün teslim mi */
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
    sameDayDelivery: true,
    intro:
      "Tarsus, Mersin'in en yoğun ticaret hacmine sahip ilçelerinden. Otomotiv yan sanayi, tekstil, gıda işletmeleri için kartvizit-broşür-magnet-antetli kâğıt taleplerine motor kurye ile aynı gün teslim sağlıyoruz.",
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
    sameDayDelivery: true,
    intro:
      "Yenişehir, Mersin'in modern iş ve eğitim merkezi. Mersin Üniversitesi, hastaneler, hukuk büroları ve danışmanlık ofisleri için kurumsal kimlik, antetli kâğıt, dosya ve bloknot ihtiyaçlarına 1-2 saat içinde ulaştırma.",
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
    sameDayDelivery: true,
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
    sameDayDelivery: true,
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
    sameDayDelivery: true,
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
    deliveryDays: { min: 0, max: 1 },
    sameDayCourier: true,
    population: "1.916.000",
    intro:
      "Mersin merkezli matbaa atölyemiz, şehir içi siparişlere aynı gün motor kurye, çevre ilçelere 1 iş günü teslimat sağlar. Mersin Limanı, Yenişehir ticaret bölgesi, Tarsus OSB ve Toroslar sanayi siteleri çevresinde 12.000+ aktif müşteriye matbaa hizmeti veriyoruz.",
    districts: MERSIN_DISTRICTS,
    popularProducts: [
      "Klasik kartvizit (selefonlu/UV/yaldız)",
      "Kurumsal antetli kâğıt + zarf seti",
      "Restoran menü kartı ve masa standı",
      "Otel anahtar zarfı ve kart",
      "Liman/lojistik etiketi ve sevk irsaliyesi",
      "Tarım/narenciye etiket ve ambalaj baskısı",
      "Fuar standı broşürü ve roll-up",
    ],
    localReferences: [
      "Akdeniz Otel İşletmeleri",
      "Mersin Marina Restoran",
      "Lisan Fen Eğitim Kurumları",
      "Tarsus OSB üyesi 14 firma",
      "Mersin Üniversitesi yan binaları (4 fakülte)",
    ],
    commonNeeds: [
      "Aynı gün acil kartvizit (5 saat içinde)",
      "Mersin Limanı evrak ve etiket baskısı",
      "Sanayi sitelerinde forma kâğıt ve makbuz",
      "Üniversite çevresinde fotokopi-baskı dışı premium iş",
      "Sahil bandı turizm sezonu menü revizyonu",
    ],
    faqs: [
      {
        q: "Mersin'de aynı gün kartvizit baskı yapıyor musunuz?",
        a: "Evet. Mersin merkez ilçelerinde sabah 11:00'a kadar verilen siparişler aynı gün üretilir, motor kurye ile teslim edilir. Diğer Mersin ilçelerine 1 iş günü içinde ulaşır.",
      },
      {
        q: "Mersin'de matbaa ücreti rakiplerden farklı mı?",
        a: "Atölyemizin Mersin'de olması nedeniyle aracı, depo veya nakliye masrafı yok — kıyaslandığında %15-25 daha uygun fiyat veriyoruz. Online konfigüratörden ürün seçip anında fiyat görebilirsiniz.",
      },
      {
        q: "Tarsus, Yenişehir, Toroslar, Mezitli'ye teslim ediyor musunuz?",
        a: "Evet, Mersin'in 13 ilçesinin tamamına kurye veya kargo ile teslim ediyoruz. Merkez ilçelere aynı gün, çevre ilçelere 1 iş günü içinde teslim sağlanır.",
      },
      {
        q: "Mersin Limanı'na evrak baskısı yapar mısınız?",
        a: "Evet. Lojistik şirketleri, gümrük müşavirleri ve ihracatçılar için CMR, sevk irsaliyesi, etiket ve konteyner numarası baskısı yapıyoruz. Acil işlerde 2-3 saat içinde teslim mümkün.",
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
        a: "Evet. 50.000 ₺ üzeri toplu otel-restoran siparişlerinde %10-15 ek indirim, açık fatura ve aylık kapanış imkânı sunuyoruz. Kurumsal hesap başvurusu yapabilirsiniz.",
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
  return cities
    .filter((c) => c.slug !== slug && c.region === current.region)
    .slice(0, count);
}
