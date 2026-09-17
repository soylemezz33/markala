/**
 * Turkuaz beslemesi → Markala katalog eşleme kuralları — SAF modül (I/O yok).
 *
 * İŞ KARARLARI (Hasan, 2026-09-17):
 *  - Satış fiyatı = Turkuaz LİSTE fiyatı (bayi iskontomuz %40 → maliyet = liste × 0,60).
 *  - Baskısız ürün bize gelir, baskıyı Markala yapar → üretim süresi 5-7 iş günü.
 *  - "Matbaa Ürünleri" kök kategorisi HARİÇ (kendi üretimimizle çakışır), kalan her şey alınır.
 *
 * FİYAT ŞEKLİ — emlak-afisi reçetesi (scripts/katalog/emlak-afisi.mjs başlık yorumu):
 *  - "renk" grubu groupRole=priced, groupSort=0 → varyant ekseni (SKU başına bir seçenek).
 *  - "adet" grubu groupRole=dimension, groupSort=1 → TEK boyut grubu olduğu için
 *    priceDimKey olur ve motorun doğrusal `unit × qty × hacim indirimi` yolu tamamen
 *    devre dışı kalır. Fiyatlar (renk, adet) başına TAM MATRİS satırıdır: price = birim × adet.
 *    Hacim indirimi Turkuaz tarafında olmadığı için sızmaması ŞARTTIR (spec doğrular).
 *  - Minimum sipariş, KÜÇÜK KADEMENİN HİÇ SUNULMAMASI ile uygulanır (emlak-afişi deseni):
 *    en düşük adet seçeneği = minimum; müşteri altını seçemez.
 *
 * KDV: beslemedeki <fiyat> KDV HARİÇ varsayılır (<kdv> oranının ayrıca verilmesi bunu işaret
 * eder) → satış = liste × (1 + kdv/100). Bayi panelinden aksi doğrulanırsa servis
 * `fiyatKdvDahil: true` geçirir ve liste önce KDV'den arındırılır. Maliyet HER ZAMAN KDV
 * hariç yazılır (kâr motoru maliyetleri KDV'siz bekler): maliyet = liste_hariç × 0,60.
 */
import { TurkuazKategori, TurkuazSku, kokKategori } from "./turkuaz-xml";

export const TEDARIKCI = "turkuaz";
/** Bayi iskontosu sonrası maliyet çarpanı (%40 iskonto → liste × 0,60). */
export const MALIYET_CARPANI = 0.6;
export const URETIM_SURESI = "5-7 iş günü";
/** Beslemenin "boş geldi, her şeyi pasifleme" sigortası: bundan az aktif SKU varsa senkron durur. */
export const ASGARI_SKU_SAYISI = 200;

/** Turkuaz kök kategorisi → bizim kategori slug'ımız. Listede olmayan kök → çeşitli. */
const KATEGORI_ESLEME: ReadonlyArray<readonly [kokAdi: string, slug: string]> = [
  ["Kalemler", "promosyon-kalem"],
  ["Kalem Setleri", "promosyon-kalem"],
  ["Termos ve Kupa Bardaklar", "promosyon-bardak-termos"],
  ["Teknolojik Ürünler", "promosyon-teknoloji"],
  ["Tarihli Ajanda", "promosyon-defter-ajanda"], // "Tarihli Ajanda • Organizer" — önek eşleşir
  ["Tarihsiz Defterler", "promosyon-defter-ajanda"],
  ["Anahtarlıklar", "promosyon-anahtarlik"],
  ["Tekstil Ürünleri", "promosyon-tekstil"],
  ["Sekreterlikler ve Çantalar", "promosyon-canta"],
  ["Duvar Saatleri", "promosyon-saat"],
  ["Vip Hediyelik Set", "promosyon-vip-set"],
  // "promosyon çakmak" ayda 1.600 arama (DataForSEO, Eyl 2026) — çeşitliye gömülmez, kendi sayfası olur.
  ["Çakmaklar", "promosyon-cakmak"],
] as const;
const VARSAYILAN_SLUG = "promosyon-cesitli";
const HARIC_KOKLER = ["Matbaa Ürünleri"];

export interface KategoriIcerik {
  seo: { title: string; description: string; keywords: string[] };
  faqs: Array<{ q: string; a: string }>;
  seoBolumler: Array<{ baslik: string; paragraflar: string[] }>;
}

/** Tüm promosyon kategorilerinde ortak, dürüst SSS'ler (kategoriye özel olanlar ayrıca eklenir). */
const ORTAK_SSS: Array<{ q: string; a: string }> = [
  {
    q: "Fiyatlara logo baskısı dahil mi?",
    a: "Evet. Listelenen fiyatlara firmanıza özel logo baskısı dahildir; sipariş sonrası logonuzu iletirsiniz, tasarım baskı öncesi onayınıza sunulur.",
  },
  {
    q: "Minimum sipariş adedi nedir?",
    a: "Ürüne göre değişir ve her ürünün sayfasında açıkça yazar; adet seçici zaten minimumun altını göstermez. Kalem ve anahtarlık gibi ürünlerde genellikle 25-100 adet, VIP setlerde tek adet sipariş verilebilir.",
  },
  {
    q: "Teslimat ne kadar sürer?",
    a: "Tasarım onayınızdan sonra üretim 5-7 iş günüdür; kargoya verildiğinde takip numaranız e-posta ile gelir.",
  },
];

/** Yeni kategori oluştururken kullanılacak vitrin metinleri (senkron var olanı EZMEZ). */
export const KATEGORI_TANIMLARI: Record<
  string,
  { name: string; shortDescription: string; longDescription: string; content?: KategoriIcerik }
> = {
  "promosyon-kalem": {
    name: "Promosyon Kalem",
    shortDescription: "Logo baskılı plastik, metal ve roller kalemler — kurumsal hediyenin klasiği.",
    longDescription:
      "Firmanıza özel logo baskılı promosyon kalemler: plastik, metal, roller ve dokunmatik uçlu modeller, kalem setleri. Fuar, tanıtım ve kurumsal hediye için yüksek adetlerde uygun fiyat.",
    content: {
      seo: {
        title: "Promosyon Kalem — Logo Baskılı Toptan Kalem Fiyatları",
        description:
          "Logo baskılı promosyon kalem: plastik, metal, roller ve dokunmatik modeller. 100 adetten başlayan toptan fiyat, KDV dahil, 5-7 iş gününde kargoda. Online sipariş verin.",
        keywords: ["promosyon kalem", "logo baskılı kalem", "toptan kalem", "firma kalemi", "metal kalem baskı"],
      },
      faqs: [
        {
          q: "Plastik ve metal kalem arasında nasıl seçim yapmalıyım?",
          a: "Fuar ve geniş kitle dağıtımında adet maliyeti düşük plastik kalemler tercih edilir; müşteri ve iş ortağı hediyesinde lazer kazımalı metal kalemler daha kalıcı bir izlenim bırakır. Roller ve jel refilli modeller yazım kalitesiyle üst segmenttir.",
        },
        ...ORTAK_SSS,
      ],
      seoBolumler: [
        {
          baslik: "Promosyon Kalem Fiyatını Ne Belirler?",
          paragraflar: [
            "Promosyon kalem fiyatı üç değişkene bağlıdır: gövde malzemesi (plastik, metal, geri dönüşümlü), baskı tekniği (tampon baskı, UV, lazer kazıma) ve sipariş adedi. Adet arttıkça birim maliyet belirgin şekilde düşer; bu yüzden listelerimizde 100'den 2.500 adede kadar kademeli fiyat görürsünüz.",
            "Tüm fiyatlara tek renk logo baskısı ve KDV dahildir. Lazer kazımalı metal kalemlerde logo silinmez; yoğun kullanımda bile marka görünürlüğü yıllarca sürer.",
          ],
        },
        {
          baslik: "Hangi Kalem Hangi Kullanıma Uygun?",
          paragraflar: [
            "Fuar, kongre ve seminer dağıtımları için plastik ve geri dönüşümlü kalemler en ekonomik seçimdir. Banka, sigorta ve otomotiv gibi sektörlerde müşteriyle imza anında buluşan roller ve jel kalemler tercih edilir.",
            "Kalem setleri ise yılbaşı ve bayi hediyelerinde kutusuyla sunulabilen, ajanda ile kombinlenebilen bir üst seviyedir. Kararsızsanız ürün sayfalarındaki ebat ve baskı bilgilerini karşılaştırın ya da bize danışın.",
          ],
        },
      ],
    },
  },
  "promosyon-bardak-termos": {
    name: "Promosyon Bardak & Termos",
    shortDescription: "Baskılı kupa, termos ve mataralar — her gün elde taşınan reklam.",
    longDescription:
      "Logo baskılı porselen kupalar, çelik termoslar, mataralar ve kahve bardakları. Süblimasyon ve UV baskı ile kalıcı görsel; ofis ve saha ekipleri için ideal kurumsal hediye.",
    content: {
      seo: {
        title: "Promosyon Kupa & Termos — Logo Baskılı Bardak Fiyatları",
        description:
          "Logo baskılı porselen kupa, çelik termos ve matara. Süblimasyon baskıyla kalıcı görsel, KDV dahil toptan fiyat, 5-7 iş gününde kargoda. Kurumsal hediyede en çok tercih edilen ürün grubu.",
        keywords: ["promosyon kupa", "logo baskılı kupa", "kurumsal termos", "baskılı bardak", "firma kupası"],
      },
      faqs: [
        {
          q: "Kupalar bulaşık makinesinde yıkanabilir mi?",
          a: "Porselen kupalarımız bulaşık makinesine uygundur; üretici notu olarak, makine kimyasalları nedeniyle her üründe olduğu gibi zamanla solma görülebilir. Elde yıkama baskı ömrünü uzatır.",
        },
        ...ORTAK_SSS,
      ],
      seoBolumler: [
        {
          baslik: "Neden Kupa ve Termos En Etkili Promosyon Ürünlerindendir?",
          paragraflar: [
            "Kupa ve termos, promosyon ürünleri içinde kullanım sıklığı en yüksek gruptur: masada ve elde her gün görünür, logonuz çöpe gitmez. Araştırmalar içecek kaplarının ortalama iki yıldan uzun süre kullanıldığını gösterir — adet başına maliyeti en verimli reklamlardan biridir.",
            "Çift renk iç-kulp kombinli porselen kupalardan çelik termoslara kadar seçenekler, bütçenize göre 45 adetten başlayan siparişlerle üretilir.",
          ],
        },
        {
          baslik: "Baskı Tekniği: Süblimasyon ve UV",
          paragraflar: [
            "Kupalarda süblimasyon (dijital) baskı kullanılır: görsel yüzeye değil sırrın altına işlenir, bulaşıkta çıkmaz. Çelik termos ve mataralarda UV ya da lazer teknikleri yüzeye göre seçilir.",
            "Çok renkli logolar ve fotoğraflı tasarımlar dahil hemen her görsel uygulanabilir; sipariş sonrası tasarımınız onayınıza sunulur.",
          ],
        },
      ],
    },
  },
  "promosyon-teknoloji": {
    name: "Promosyon Teknoloji",
    shortDescription: "USB bellek, powerbank, kablosuz şarj ve masaüstü teknoloji hediyeleri.",
    longDescription:
      "Kurumsal logolu USB bellekler, powerbank'ler, kablosuz şarj üniteleri ve teknoloji aksesuarları. Kapasite ve model seçenekleriyle bütçenize uygun teknolojik promosyon.",
    content: {
      seo: {
        title: "Promosyon Powerbank & USB Bellek — Logo Baskılı Fiyatlar",
        description:
          "Logo baskılı powerbank ve USB bellek (8-128 GB) ile teknoloji hediyeleri. Kapasite seçenekli toptan fiyat, KDV dahil, 5-7 iş gününde kargoda. Kurumsal sipariş için ideal.",
        keywords: ["promosyon powerbank", "promosyon usb bellek", "logo baskılı usb", "kurumsal powerbank", "promosyon teknoloji"],
      },
      faqs: [
        {
          q: "USB belleklerde hangi kapasiteler var?",
          a: "Modele göre 8 GB'tan 128 GB'a kadar kapasite seçenekleri bulunur; her ürünün sayfasındaki seçenek listesinde stokta olan kapasiteler görünür. Kapasite arttıkça birim fiyat yükselir.",
        },
        ...ORTAK_SSS,
      ],
      seoBolumler: [
        {
          baslik: "Kurumsal Hediyede Teknoloji Neden Öne Çıkıyor?",
          paragraflar: [
            "USB bellek ve powerbank, alan kişinin gerçekten kullandığı promosyon ürünleridir: çantada ve masada taşınır, logonuz her kullanımda görünür. Özellikle fuar ve kongrelerde sunum dosyalarının yüklenmiş USB ile dağıtılması hem pratik hem akılda kalıcıdır.",
            "Metal gövdeli modellerde logo lazerle kazınır ve silinmez; deri kapaklı modellerde sıcak baskı uygulanır.",
          ],
        },
        {
          baslik: "Sipariş ve Kapasite Seçimi",
          paragraflar: [
            "Aynı modelin farklı kapasiteleri farklı fiyatlandırılır; ürün sayfasında kapasiteyi ve adedi seçtiğinizde toplam fiyat anında hesaplanır.",
            "Kurumsal veri güvenliği gerektiren dağıtımlar için siparişinizle birlikte dosya yükleme talebinizi iletebilirsiniz; üretim öncesi netleştirilir.",
          ],
        },
      ],
    },
  },
  "promosyon-defter-ajanda": {
    name: "Promosyon Defter & Ajanda",
    shortDescription: "Logo baskılı tarihli ajandalar, tarihsiz defterler ve organizerlar.",
    longDescription:
      "Firmanıza özel tarihli ajanda, tarihsiz defter, bloknot ve organizer modelleri. Termo deri kapaklar, sıcak baskı ve gofre logo seçenekleriyle yıl boyu masada kalan tanıtım.",
    content: {
      seo: {
        title: "Promosyon Ajanda & Defter — Logo Baskılı 2027 Ajanda Fiyatları",
        description:
          "Logo baskılı tarihli ajanda, tarihsiz defter ve organizer. Termo deri kapak, gofre/sıcak baskı logo, KDV dahil toptan fiyat. Yılbaşı kurumsal hediyesinin vazgeçilmezi.",
        keywords: ["promosyon ajanda", "logo baskılı ajanda", "kurumsal ajanda", "tarihsiz defter baskı", "yılbaşı ajanda"],
      },
      faqs: [
        {
          q: "Ajandalara logo nasıl uygulanır?",
          a: "Termo ve PU deri kapaklara gofre (kabartma), sıcak baskı ya da UV teknikleriyle uygulanır; ürün sayfasındaki baskı bilgisi hangi tekniğin kullanıldığını belirtir. Gofre baskı mürekkepsizdir ve kapak ömrü boyunca kalır.",
        },
        ...ORTAK_SSS,
      ],
      seoBolumler: [
        {
          baslik: "Yılbaşı Ajanda Siparişini Ne Zaman Vermeli?",
          paragraflar: [
            "Tarihli ajandalar yılın son çeyreğinde yoğun talep görür ve popüler modellerin stokları kasım ayında tükenmeye başlar. Kurumsal dağıtım planlıyorsanız siparişi ekim sonuna kadar vermek hem model hem renk seçeneği açısından en garantili yoldur.",
            "Tarihsiz defterler ise yıl boyu dağıtılabilir; eğitim, toplantı ve seminer setlerinde tarihli ajandanın esnek alternatifidir.",
          ],
        },
        {
          baslik: "Kapak ve Kâğıt Kalitesi",
          paragraflar: [
            "Modellerimizde termo PU sert kapaklar ve 70 gr ivory (krem) kâğıt standarttır; sayfa sayısı ve çizgi düzeni her ürünün özelliklerinde yazar.",
            "Kalem yuvalı, lastikli ve organizer bölmeli modeller yönetici segmenti için uygundur; kalem setiyle kombinleyerek kutulu hediye oluşturabilirsiniz.",
          ],
        },
      ],
    },
  },
  "promosyon-anahtarlik": {
    name: "Promosyon Anahtarlık",
    shortDescription: "Metal, deri ve plastik logo baskılı anahtarlıklar ve rozetler.",
    longDescription:
      "Metal döküm, deri ve plastik anahtarlıklar, açacaklı ve ledli modeller, rozetler. Düşük maliyetle geniş kitleye ulaşan, en çok tercih edilen promosyon kalemlerinden.",
    content: {
      seo: {
        title: "Promosyon Anahtarlık — Logo Baskılı Toptan Fiyatlar",
        description:
          "Logo baskılı metal, deri ve plastik anahtarlıklar, rozetler. Düşük birim maliyetle geniş kitleye tanıtım; KDV dahil toptan fiyat, 5-7 iş gününde kargoda.",
        keywords: ["promosyon anahtarlık", "logo baskılı anahtarlık", "metal anahtarlık", "toptan anahtarlık", "firma anahtarlığı"],
      },
      faqs: [
        {
          q: "Metal anahtarlıklara logo nasıl işlenir?",
          a: "Metal yüzeylere lazer kazıma ya da domeks (damla) etiket uygulanır; deri modellerde sıcak baskı kullanılır. Hangi tekniğin kullanıldığı her ürünün sayfasında yazar.",
        },
        ...ORTAK_SSS,
      ],
      seoBolumler: [
        {
          baslik: "En Düşük Maliyetli Kalıcı Tanıtım",
          paragraflar: [
            "Anahtarlık, adet başına maliyeti en düşük promosyon ürünlerinden biridir ve alan kişinin gün boyu yanında taşıdığı ender eşyalardandır. Açılış, fuar ve kampanya dağıtımlarında yüksek adetli siparişlerde birim fiyat belirgin şekilde düşer.",
            "Metal döküm modeller premium algı oluştururken, plastik ve açacaklı modeller geniş kitle dağıtımının ekonomik tercihi olur.",
          ],
        },
        {
          baslik: "Rozet ve Yaka Aksesuarları",
          paragraflar: [
            "Kurum logolu rozetler personel ve üye aidiyetinin klasik simgesidir; damla etiketli ve mineli seçeneklerle üretilir.",
            "Dernek, okul ve federasyon siparişlerinde kurumsal amblem birebir uygulanır; tasarım onayı olmadan üretime geçilmez.",
          ],
        },
      ],
    },
  },
  "promosyon-tekstil": {
    name: "Promosyon Tekstil",
    shortDescription: "Baskılı tişört, şapka, yağmurluk ve polar — giyilebilir reklam.",
    longDescription:
      "Logo baskılı tişörtler, şapkalar, yağmurluklar ve polarlar. Organizasyon, saha ekibi ve etkinlikler için beden seçenekli, dayanıklı kurumsal tekstil ürünleri.",
    content: {
      seo: {
        title: "Promosyon Şapka & Tişört — Logo Baskılı Tekstil Fiyatları",
        description:
          "Logo baskılı şapka, tişört, yağmurluk ve polar. Saha ekibi, etkinlik ve sponsorluk için beden seçenekli toptan tekstil; KDV dahil fiyat, 5-7 iş gününde kargoda.",
        keywords: ["promosyon şapka", "promosyon tişört", "logo baskılı tişört", "firma şapkası", "kurumsal tekstil"],
      },
      faqs: [
        {
          q: "Beden dağılımını nasıl bildiririm?",
          a: "Sipariş notunda ya da sipariş sonrası iletişimde S-M-L-XL dağılımınızı iletirsiniz; toplam adet sipariş adedinizle eşleşir. Beden seçenekleri ürün sayfasındaki listede yazar.",
        },
        ...ORTAK_SSS,
      ],
      seoBolumler: [
        {
          baslik: "Giyilebilir Reklamın Gücü",
          paragraflar: [
            "Baskılı tişört ve şapka, markanızı taşıyan kişiyi gönüllü bir reklam yüzüne çevirir: festivaller, saha ekipleri ve mağaza personeli için hem üniforma hem tanıtım işlevi görür.",
            "Penye tişörtlerde serigrafi ve transfer baskı, şapkalarda nakış ve transfer teknikleri kullanılır; yıkamaya dayanıklıdır.",
          ],
        },
        {
          baslik: "Etkinlik ve Sponsorluk Siparişleri",
          paragraflar: [
            "Koşu, turnuva ve festival gibi organizasyonlarda yüksek adetli tişört siparişlerinde birim fiyat belirgin şekilde düşer; renk ve beden karışımı tek siparişte toplanabilir.",
            "Kurumsal renklerinize en yakın kumaş renkleri stok durumuna göre ürün sayfasında listelenir.",
          ],
        },
      ],
    },
  },
  "promosyon-canta": {
    name: "Promosyon Çanta & Sekreterlik",
    shortDescription: "Evrak çantaları, sekreterlikler, bez ve termo çantalar.",
    longDescription:
      "Kurumsal logolu evrak çantaları, sekreterlikler, bez çantalar ve termo çantalar. Toplantı, fuar ve kongre setleri için şık ve işlevsel promosyon çözümleri.",
    content: {
      seo: {
        title: "Promosyon Çanta & Sekreterlik — Logo Baskılı Fiyatlar",
        description:
          "Logo baskılı evrak çantası, sekreterlik, bez ve termo çanta. Kongre-fuar setleri ve kurumsal hediye için KDV dahil toptan fiyat, 5-7 iş gününde kargoda.",
        keywords: ["promosyon çanta", "logo baskılı çanta", "sekreterlik", "kongre çantası", "bez çanta baskı"],
      },
      faqs: [
        {
          q: "Kongre seti için hangi ürünler kombinlenebilir?",
          a: "Evrak çantası ya da sekreterlik; ajanda, kalem ve USB bellek ile kombinlenerek tek pakette katılımcı seti oluşturulabilir. Set siparişleri için teklif isteyebilirsiniz.",
        },
        ...ORTAK_SSS,
      ],
      seoBolumler: [
        {
          baslik: "Toplantıdan Fuara: Doğru Çanta Seçimi",
          paragraflar: [
            "Sekreterlik ve evrak çantaları kurumsal toplantıların klasiğidir; deri ve termo yüzeylere gofre veya sıcak baskı ile logo uygulanır. Bez çantalar ise market, kitap fuarı ve etkinlik dağıtımlarında sürdürülebilir ve ekonomik alternatiftir.",
            "Termo çantalar saha ekipleri ve gıda sektöründe işlevsel bir tanıtım aracı olarak öne çıkar.",
          ],
        },
        {
          baslik: "Baskı ve Dayanıklılık",
          paragraflar: [
            "Bez çantalarda serigrafi baskı yıkamaya dayanıklıdır; deri yüzeylerde kabartma logo çantanın ömrü boyunca kalır.",
            "Yüksek adetli kongre siparişlerinde teslim programı üretim planına göre netleştirilir; erken sipariş her zaman daha geniş renk seçeneği demektir.",
          ],
        },
      ],
    },
  },
  "promosyon-saat": {
    name: "Promosyon Saat",
    shortDescription: "Logo baskılı duvar ve masa saatleri — ofiste kalıcı görünürlük.",
    longDescription:
      "Firmanıza özel duvar saatleri ve masa saatleri; plastik, alüminyum ve ahşap kasa seçenekleri. Ofis duvarında yıllarca kalan etkili bir tanıtım aracı.",
    content: {
      seo: {
        title: "Promosyon Duvar Saati — Logo Baskılı Saat Fiyatları",
        description:
          "Logo baskılı duvar ve masa saatleri; plastik, alüminyum ve ahşap kasa. Ofis duvarında yıllarca kalan tanıtım; KDV dahil toptan fiyat, 5-7 iş gününde kargoda.",
        keywords: ["promosyon duvar saati", "logo baskılı saat", "kurumsal saat", "duvar saati baskı", "masa saati promosyon"],
      },
      faqs: [
        {
          q: "Saat kadranına logo nasıl uygulanır?",
          a: "Kadran, logonuz ve kurumsal renklerinizle dijital baskıyla özel üretilir; çerçeve rengini stoktaki seçeneklerden belirlersiniz. Tasarım baskı öncesi onayınıza sunulur.",
        },
        ...ORTAK_SSS,
      ],
      seoBolumler: [
        {
          baslik: "Duvarda Yıllarca Kalan Reklam",
          paragraflar: [
            "Duvar saati, hediye edildiği ofisin veya dükkânın duvarında yıllarca kalır ve her bakışta markanızı hatırlatır — kalıcılığı en yüksek promosyon ürünlerinden biridir.",
            "Açılış, yıldönümü ve bayi hediyelerinde plastik kasalı ekonomik modellerden alüminyum ve ahşap premium modellere kadar seçenek sunuyoruz.",
          ],
        },
        {
          baslik: "Kadran Tasarımı ve Mekanizma",
          paragraflar: [
            "Kadran tamamen kurumsal kimliğinize göre tasarlanır: logo, renk ve istenirse iletişim bilgileri. Sessiz akar mekanizma seçenekleri ofis kullanımında tercih edilir.",
            "Masa saatleri ve gemici takvimli modeller, masaüstü setlerin tamamlayıcısı olarak kombinlenebilir.",
          ],
        },
      ],
    },
  },
  "promosyon-vip-set": {
    name: "VIP Hediye Setleri",
    shortDescription: "Deri, kalem ve aksesuar kombinli premium kurumsal hediye kutuları.",
    longDescription:
      "Yönetici ve önemli müşterileriniz için premium VIP hediye setleri: deri cüzdan, kalem, ajanda ve aksesuar kombinasyonları, özel kutularında logo baskılı olarak hazırlanır.",
    content: {
      seo: {
        title: "VIP Kurumsal Hediye Setleri — Logo Baskılı Premium Kutular",
        description:
          "Yönetici ve VIP müşteriler için premium hediye setleri: deri cüzdan, kalem, ajanda kombinleri özel kutusunda, logo baskılı. Tek adetten sipariş, KDV dahil fiyat.",
        keywords: ["kurumsal hediye", "kurumsal hediye seti", "vip hediye seti", "yönetici hediyesi", "premium promosyon"],
      },
      faqs: [
        {
          q: "VIP setler tek adet sipariş edilebilir mi?",
          a: "Evet — VIP setlerin çoğu tek adetten itibaren sipariş edilebilir; protokol ve özel gün hediyeleri için idealdir. Adet seçenekleri her setin sayfasında görünür.",
        },
        ...ORTAK_SSS,
      ],
      seoBolumler: [
        {
          baslik: "Premium Hediye Ne Zaman Doğru Tercihtir?",
          paragraflar: [
            "Kilit müşteriler, iş ortakları ve yöneticilere verilen hediye, markanızın algısını doğrudan taşır. VIP setler; deri cüzdan, metal kalem, ajanda ve aksesuarların özel kutuda birleştiği, ilk açılışta etki bırakan kombinlerdir.",
            "Setlerin kutusuna ve ürünlerine logo uygulanır; kabartma ve lazer teknikleri premium yüzeylerde kalıcıdır.",
          ],
        },
        {
          baslik: "Kurumsal Sipariş ve Kişiselleştirme",
          paragraflar: [
            "Yılbaşı ve özel dönem siparişlerinde set içeriği stok durumuna göre planlanır; erken sipariş renk ve model garantisi sağlar.",
            "İsteğe bağlı isme özel baskı (ör. yöneticinin adı) bazı setlerde uygulanabilir; sipariş notunuza ekleyin, üretim öncesi teyit edelim.",
          ],
        },
      ],
    },
  },
  "promosyon-cakmak": {
    name: "Promosyon Çakmak",
    shortDescription: "Logo baskılı çakmaklar — kafe, büfe ve fuar dağıtımının klasiği.",
    longDescription:
      "Firmanıza özel logo baskılı çakmaklar: taşlı ve manyetolu modeller, renk seçenekleriyle. Kafe, restoran, büfe ve fuar dağıtımlarında en çok tercih edilen ekonomik promosyon ürünü.",
    content: {
      seo: {
        title: "Promosyon Çakmak — Logo Baskılı Toptan Çakmak Fiyatları",
        description:
          "Logo baskılı promosyon çakmak: taşlı ve manyetolu modeller, renk seçenekli. Kafe, büfe ve fuar dağıtımı için KDV dahil toptan fiyat, 5-7 iş gününde kargoda.",
        keywords: ["promosyon çakmak", "logo baskılı çakmak", "toptan çakmak", "firma çakmağı", "çakmak baskı"],
      },
      faqs: [
        {
          q: "Çakmaklara logo nasıl basılır?",
          a: "Plastik gövdeye tampon baskı ya da UV tekniğiyle uygulanır; tek renk logo fiyata dahildir. Çok renkli logolar için ürün sayfasından adetle birlikte seçim yapabilirsiniz.",
        },
        ...ORTAK_SSS,
      ],
      seoBolumler: [
        {
          baslik: "Elden Ele Dolaşan Reklam",
          paragraflar: [
            "Çakmak, promosyon dünyasının en hızlı el değiştiren ürünüdür: kafe masasında, büfe tezgâhında ve fuar standında logonuz gün boyu farklı ellerde dolaşır. Adet maliyetinin düşüklüğü, yüksek adetli dağıtımları en ekonomik tanıtım kanallarından biri yapar.",
            "Taşlı ve manyetolu modeller, şeffaf ve opak gövde renkleriyle stok durumuna göre listelenir.",
          ],
        },
        {
          baslik: "Kimler İçin Uygun?",
          paragraflar: [
            "Restoran, kafe, büfe ve tekel noktaları müşterisine küçük bir jest olarak; nakliye, inşaat ve sanayi firmaları ise saha ekiplerine dağıtım için tercih eder.",
            "Minimum sipariş adetleri ürün sayfasında yazar; yüksek adetlerde birim fiyat belirgin şekilde düşer.",
          ],
        },
      ],
    },
  },
  "promosyon-cesitli": {
    name: "Promosyon Çeşitleri",
    shortDescription: "Çakmak, masaüstü, kişisel ve geri dönüşümlü promosyon ürünleri.",
    longDescription:
      "Çakmaklar, masaüstü ürünler, kişisel aksesuarlar, geri dönüşümlü ve tohumlu ürünler dahil geniş promosyon yelpazesi. Aradığınız ürünü bulamadıysanız bize ulaşın; tedarik ağımızla temin edelim.",
    content: {
      seo: {
        title: "Promosyon Ürünleri — Logo Baskılı Kurumsal Hediye Çeşitleri",
        description:
          "Çakmak, masaüstü set, takvim, geri dönüşümlü ve tohumlu ürünler dahil yüzlerce logo baskılı promosyon çeşidi. KDV dahil toptan fiyat, 5-7 iş gününde kargoda.",
        keywords: ["promosyon ürünleri", "kurumsal hediye", "logo baskılı ürünler", "toptan promosyon", "geri dönüşümlü promosyon"],
      },
      faqs: [
        {
          q: "Aradığım ürün listede yoksa temin edebilir misiniz?",
          a: "Evet — geniş tedarik ağımızla katalogda olmayan promosyon ürünlerini de temin edebiliyoruz. İletişim sayfamızdan ürünü ve adedi yazın, aynı gün fiyat dönelim.",
        },
        ...ORTAK_SSS,
      ],
      seoBolumler: [
        {
          baslik: "Doğru Promosyon Ürünü Nasıl Seçilir?",
          paragraflar: [
            "İyi bir promosyon ürünü üç şartı sağlar: hedef kitleniz onu gerçekten kullanmalı, logonuz kullanım sırasında görünmeli ve birim maliyet dağıtım ölçeğinize uymalı. Masaüstü ürünler ofiste, çakmak ve kişisel aksesuarlar günlük hayatta görünürlük sağlar.",
            "Geri dönüşümlü ve tohumlu ürünler, sürdürülebilirlik mesajı vermek isteyen kurumların son yıllardaki ilk tercihi.",
          ],
        },
        {
          baslik: "Toptan Fiyat ve Sipariş Kolaylığı",
          paragraflar: [
            "Tüm ürünlerde fiyatlar adet kademeli ve KDV dahildir; ürün sayfasında adedi seçtiğinizde toplam anında hesaplanır, sürpriz maliyet çıkmaz.",
            "Sipariş sonrası logonuzu iletirsiniz; tasarım onayınız alınmadan baskıya geçilmez, üretim 5-7 iş günüdür.",
          ],
        },
      ],
    },
  },
};

/**
 * Kategori bazlı kullanım senaryoları — ürün sayfasındaki "Nerede kullanılır?" bölümü
 * ve yapay zekâ aramaları (GEO) için alıntılanabilir, DÜRÜST genel senaryolar.
 */
const KULLANIM_SENARYOLARI: Record<string, string[]> = {
  "promosyon-kalem": [
    "Fuar ve etkinliklerde ziyaretçi dağıtımı",
    "Ofis içi kullanım ve müşteri ikramı",
    "Kongre, seminer ve eğitim katılımcı setleri",
    "Bayi ve müşteri ziyaret hediyesi",
  ],
  "promosyon-bardak-termos": [
    "Ofis çalışanlarına kurumsal hediye",
    "Yılbaşı ve özel gün hediye setleri",
    "Müşteri ve bayi hediyesi",
    "Etkinlik ve sponsorluk dağıtımları",
  ],
  "promosyon-teknoloji": [
    "Kurumsal sunum ve veri paylaşımı (USB bellek)",
    "Fuarlarda premium ziyaretçi hediyesi",
    "Yönetici ve önemli müşteri hediyesi",
  ],
  "promosyon-defter-ajanda": [
    "Yılbaşında kurumsal ajanda dağıtımı",
    "Toplantı ve eğitim setleri",
    "Bayi ve müşteri hediyesi",
  ],
  "promosyon-anahtarlik": [
    "Geniş kitleye düşük maliyetli tanıtım dağıtımı",
    "Fuar ve tanıtım standı hediyesi",
    "Açılış ve organizasyon hatırası",
  ],
  "promosyon-tekstil": [
    "Saha ekibi ve personel giyimi",
    "Etkinlik ve festival dağıtımı",
    "Sponsorluk ve takım kıyafetleri",
  ],
  "promosyon-canta": [
    "Kongre ve fuar katılımcı çantası",
    "Kurumsal evrak ve toplantı setleri",
    "Mağaza ve etkinlik dağıtımı",
  ],
  "promosyon-saat": [
    "Ofis ve mağaza duvarında kalıcı marka görünürlüğü",
    "Açılış ve yıldönümü hediyesi",
    "Bayi ve iş ortağı hediyesi",
  ],
  "promosyon-vip-set": [
    "Yönetici ve VIP müşteri hediyesi",
    "Yılbaşı premium kurumsal hediye",
    "Protokol ve iş ortağı hediyeleri",
  ],
  "promosyon-cakmak": [
    "Kafe, restoran ve büfe dağıtımı",
    "Fuar ve etkinliklerde geniş kitle tanıtımı",
    "Bayi ve tekel noktası hediyesi",
  ],
  "promosyon-cesitli": [
    "Kurumsal tanıtım ve etkinlik dağıtımı",
    "Müşteri ve personel hediyeleri",
  ],
};

export interface TurkuazGrup {
  kodgrup: string;
  isim: string;
  aciklama: string;
  kdv: number;
  kategoriSlug: string;
  /// Yalnız satılabilir SKU'lar: durum=1, fiyat>0. Stoksuzlar da listede (seçenek dışı bırakılır).
  skular: TurkuazSku[];
}

export interface EslemeSonucu {
  gruplar: TurkuazGrup[];
  /// Matbaa/pasif/fiyatsız gibi sebeplerle atlananların sayacı (log için).
  atlanan: { matbaa: number; pasif: number; fiyatsiz: number; koksuz: number };
}

/** Beslemedeki SKU'ları satılabilir ürün gruplarına indirger ve kategorilere eşler. */
export function gruplaVeEsle(
  skular: ReadonlyArray<TurkuazSku>,
  kategoriler: ReadonlyArray<TurkuazKategori>,
): EslemeSonucu {
  const atlanan = { matbaa: 0, pasif: 0, fiyatsiz: 0, koksuz: 0 };
  const byGrup = new Map<string, TurkuazSku[]>();

  for (const sku of skular) {
    if (!sku.durum) {
      atlanan.pasif++;
      continue;
    }
    if (sku.fiyat <= 0) {
      atlanan.fiyatsiz++;
      continue;
    }
    const kok = kokKategori(sku.kid, kategoriler);
    if (!kok) {
      atlanan.koksuz++;
      continue;
    }
    if (HARIC_KOKLER.some((h) => kok.isim.startsWith(h))) {
      atlanan.matbaa++;
      continue;
    }
    const list = byGrup.get(sku.kodgrup) ?? [];
    list.push(sku);
    byGrup.set(sku.kodgrup, list);
  }

  const gruplar: TurkuazGrup[] = [];
  for (const [kodgrup, list] of byGrup) {
    // En zengin açıklamayı taşıyan SKU grubu temsil eder (çoğu grupta açıklama aynıdır).
    const temsil = [...list].sort((a, b) => b.aciklama.length - a.aciklama.length)[0];
    const kok = kokKategori(temsil.kid, kategoriler);
    const es = KATEGORI_ESLEME.find(([ad]) => (kok?.isim ?? "").startsWith(ad));
    gruplar.push({
      kodgrup,
      isim: temsil.isim,
      aciklama: temsil.aciklama,
      kdv: temsil.kdv,
      kategoriSlug: es?.[1] ?? VARSAYILAN_SLUG,
      skular: list.sort((a, b) => a.kod.localeCompare(b.kod, "tr")),
    });
  }
  gruplar.sort((a, b) => a.kodgrup.localeCompare(b.kodgrup, "tr"));
  return { gruplar, atlanan };
}

/** "*Minimum Sipariş 100 adettir." / "Minimum sipariş: 45 adet" kalıplarından adedi çıkarır. */
export function minSiparisAyikla(aciklama: string): number | null {
  const m = aciklama.match(/minimum\s+sipari[şs][:\s]*([\d.]+)\s*adet/i);
  if (!m) return null;
  const n = parseInt(m[1].replace(/\./g, ""), 10);
  return Number.isFinite(n) && n > 0 ? n : null;
}

/**
 * Adet kademeleri. Açıklamada minimum varsa merdiven ondan başlar (altı HİÇ sunulmaz).
 * Minimum yazmıyorsa birim fiyata göre makul bir başlangıç seçilir: pahalı ürün (VIP set,
 * deri ajanda) tek adet alınabilir; ucuz üründe (kalem, anahtarlık) 25 altı sipariş
 * operasyon maliyetini karşılamaz. Sabitler bilinçli olarak burada — panelden değil,
 * koddan yönetilir; değişiklik istenirse tek satır.
 */
export function adetKademeleri(minSiparis: number | null, birimListe: number): number[] {
  const MERDIVEN = [1, 2, 5, 10, 25, 50, 100, 250, 500, 1000, 2500];
  const min =
    minSiparis ?? (birimListe >= 1000 ? 1 : birimListe >= 300 ? 5 : 25);
  const ustu = MERDIVEN.filter((k) => k >= min);
  const kademeler = ustu.length > 0 ? ustu : [min];
  if (kademeler[0] !== min) kademeler.unshift(min);
  // En fazla 6 kademe: konfigüratörde okunaklı kalsın, matris satır sayısı patlamasın.
  return kademeler.slice(0, 6);
}

const TR_MAP: Record<string, string> = {
  ç: "c", Ç: "c", ğ: "g", Ğ: "g", ı: "i", İ: "i", ö: "o", Ö: "o",
  ş: "s", Ş: "s", ü: "u", Ü: "u", â: "a", Â: "a", î: "i", Î: "i", û: "u", Û: "u",
};

export function slugla(metin: string): string {
  return metin
    .split("")
    .map((c) => TR_MAP[c] ?? c)
    .join("")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-{2,}/g, "-");
}

/**
 * "*Madde\r\n*Madde" biçimindeki tedarikçi açıklamasını okunur maddelere çevirir.
 * Bazı kayıtlarda maddeler satır sonu YERİNE satır içi "*" ile ayrılır
 * ("Baskı: UV*Ebat: 23 cm*Deri kapak") — o yüzden her iki ayraçta da bölünür.
 */
export function aciklamaTemizle(aciklama: string): string {
  const satirlar = aciklama
    .split(/\r?\n|\*/)
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
  return satirlar.map((s) => `• ${s}`).join("\n");
}

function yuvarla2(n: number): number {
  return Math.round(n * 100) / 100;
}

export interface UrunYuku {
  slug: string;
  name: string;
  kategoriSlug: string;
  shortDescription: string;
  description: string;
  basePrice: number;
  productionTime: string;
  content: Record<string, unknown>;
  options: Array<{
    groupKey: string;
    groupLabel: string;
    groupRole: "priced" | "dimension";
    groupSort: number;
    optionKey: string;
    optionLabel: string;
    optionSublabel: string | null;
    optionSort: number;
    locked: boolean;
    rules: null;
  }>;
  prices: Array<{
    groupKey: string;
    optionKey: string;
    dimKey: string;
    price: number;
    cost: number;
  }>;
  /// Ürün görselleri: tedarikçi URL sırası (indirme servisi bizim URL'lere çevirir).
  gorselKaynaklari: string[];
  aktif: boolean;
  /// Senkron karşılaştırması için içerik özeti (stok+fiyat+SKU listesi).
  ozetHash: string;
}

/**
 * Bir tedarikçi grubunu Markala ürün yüküne çevirir.
 *
 * Varyant ekseni SKU'nun kendisidir (optionKey = tedarikçi SKU kodu): renk varyasyonlarında
 * etiket renk adı, ebat varyasyonlarında ebat, ikisi de boşsa "Standart". SKU bazlı anahtar
 * hem benzersizliği garanti eder hem stok/fiyatı doğrudan SKU'ya bağlar (27 grupta renkler
 * FARKLI fiyatlıdır — matris bunu doğal karşılar).
 *
 * Stoksuz SKU seçenek olarak HİÇ yazılmaz (bugünkü tek stok kolu: seçenek yokluğu).
 * Hiç stoklu SKU kalmazsa ürün pasife düşer, kayıt silinmez.
 */
export function grupToYuk(
  grup: TurkuazGrup,
  fiyatKdvDahil: boolean,
): UrunYuku {
  const kdvCarpan = 1 + grup.kdv / 100;
  const stoklular = grup.skular.filter((s) => s.stok > 0);
  const aktif = stoklular.length > 0;
  const varyantlar = aktif ? stoklular : grup.skular.slice(0, 1);

  const minListe = Math.min(...varyantlar.map((s) => s.fiyat));
  const listeHaric = (liste: number) => (fiyatKdvDahil ? liste / kdvCarpan : liste);

  const minSiparis = minSiparisAyikla(grup.aciklama);
  const kademeler = adetKademeleri(minSiparis, yuvarla2(listeHaric(minListe) * kdvCarpan));

  const renkliSayisi = new Set(varyantlar.map((v) => v.renk).values()).size;
  const coklu = varyantlar.length > 1;

  const options: UrunYuku["options"] = [];
  varyantlar.forEach((v, i) => {
    const etiket = v.renk || v.ebat || "Standart";
    options.push({
      groupKey: "renk",
      groupLabel: renkliSayisi > 1 ? "Renk" : "Model",
      groupRole: "priced",
      groupSort: 0,
      optionKey: v.kod,
      optionLabel: etiket,
      optionSublabel: v.renk && v.ebat ? v.ebat : null,
      optionSort: i,
      locked: !coklu,
      rules: null,
    });
  });
  kademeler.forEach((k, i) => {
    options.push({
      groupKey: "adet",
      groupLabel: "Adet",
      groupRole: "dimension",
      groupSort: 1,
      optionKey: String(k),
      optionLabel: `${k} adet`,
      optionSublabel: i === 0 && (minSiparis ?? 0) > 1 ? "Minimum sipariş" : null,
      optionSort: i,
      locked: false,
      rules: null,
    });
  });

  const prices: UrunYuku["prices"] = [];
  for (const v of varyantlar) {
    const haric = listeHaric(v.fiyat);
    for (const k of kademeler) {
      prices.push({
        groupKey: "renk",
        optionKey: v.kod,
        dimKey: String(k),
        price: yuvarla2(haric * kdvCarpan * k),
        cost: yuvarla2(haric * MALIYET_CARPANI * k),
      });
    }
  }

  const ebatlar = [...new Set(grup.skular.map((s) => s.ebat).filter(Boolean))];
  const temizAciklama = aciklamaTemizle(grup.aciklama);
  const maddeler = temizAciklama.split("\n").map((s) => s.replace(/^•\s*/, "").trim());
  // Kısa açıklamaya ilk GERÇEK özellik alınır — "Minimum sipariş" idari bilgidir, vitrine çıkmaz.
  const ozellikler = maddeler.filter((s) => s && !/minimum/i.test(s)).slice(0, 7);
  const ilkOzellik = ozellikler[0] ?? "";
  const baskiTeknigi = maddeler
    .find((s) => /^bask[ıi]\s*:/i.test(s))
    ?.replace(/^bask[ıi]\s*:\s*/i, "");
  const renkAdlari = [...new Set(varyantlar.map((v) => v.renk).filter(Boolean))];
  const minAdet = kademeler[0];
  const enDusukBirim = yuvarla2(listeHaric(minListe) * kdvCarpan);
  // Anahtar kelime/tanımda parantezli teknik ekler atılır: "Metal Kalem (Jel Refil)" → "metal kalem".
  const isimKucuk = grup.isim.replace(/\s*\([^)]*\)/g, "").trim().toLocaleLowerCase("tr");

  // SEO/GEO içeriği (ürün OLUŞTURULURKEN yazılır; senkron var olan içeriği ezmez, panel/SEO
  // oturumu sonradan zenginleştirebilir). SSS cevapları veriden üretilir — uydurma iddia yok.
  const seo = {
    title: `${grup.isim} ${grup.kodgrup} — Logo Baskılı Promosyon, ${minAdet}+ Adet`,
    description:
      `Logo baskılı ${isimKucuk} ${enDusukBirim.toFixed(0)} ₺/adet'ten (KDV dahil). ` +
      `Minimum ${minAdet} adet${renkAdlari.length > 1 ? `, ${renkAdlari.length} renk seçeneği` : ""}, ` +
      `${URETIM_SURESI} içinde kargoda. Online fiyat alın, hemen sipariş verin.`,
    keywords: [
      `promosyon ${isimKucuk}`,
      `logo baskılı ${isimKucuk}`,
      `${isimKucuk} baskı`,
      `toptan ${isimKucuk}`,
      "kurumsal hediye",
    ],
  };
  const faqs: Array<{ q: string; a: string }> = [
    {
      q: "Fiyata logo baskısı dahil mi?",
      a: "Evet — listelenen fiyata firmanıza özel logo baskısı dahildir. Sipariş sonrası logonuzu iletirsiniz; tasarım baskı öncesi onayınıza sunulur.",
    },
    {
      q: "Minimum sipariş adedi nedir?",
      a: `Bu ürün en az ${minAdet} adet sipariş edilebilir. Adet seçenekleri: ${kademeler.join(", ")}. Daha yüksek adetler için teklif isteyebilirsiniz.`,
    },
    {
      q: "Kargoya ne zaman verilir?",
      a: `Tasarım onayınızdan sonra ${URETIM_SURESI} içinde üretilip kargoya verilir; kargoya verildiğinde takip numaranız e-posta ile iletilir.`,
    },
    {
      q: "Fiyatlara KDV dahil mi?",
      a: "Evet, sitede gördüğünüz tüm fiyatlar KDV dahildir; ödeme adımında ek vergi eklenmez.",
    },
  ];
  if (renkAdlari.length > 1) {
    faqs.push({
      q: "Hangi renk seçenekleri var?",
      a: `Şu an stokta olan renkler: ${renkAdlari.join(", ")}. Stok durumu güncellendikçe seçenekler değişebilir.`,
    });
  }
  const specifications: Array<{ label: string; value: string }> = [
    ...(ebatlar.length > 0 ? [{ label: ebatlar.length > 1 ? "Ebatlar" : "Ebat", value: ebatlar.join(", ") }] : []),
    ...(renkAdlari.length > 0 ? [{ label: "Renk seçenekleri", value: renkAdlari.join(", ") }] : []),
    ...(baskiTeknigi ? [{ label: "Baskı tekniği", value: baskiTeknigi }] : []),
    { label: "Minimum sipariş", value: `${minAdet} adet` },
    { label: "Ürün kodu", value: grup.kodgrup },
  ];

  // Hash SÜRÜM + KDV bayrağı taşır: eşleme kuralları ya da KDV yorumu değişirse
  // "değişmeyen" hızlı yolu düşer ve tüm fiyat matrisi yeniden yazılır.
  const ozet =
    `v1:${fiyatKdvDahil ? "D" : "H"}:` +
    varyantlar
      .map((v) => `${v.kod}:${v.stok}:${v.fiyat}`)
      .sort()
      .join("|");

  return {
    slug: slugla(`promosyon ${grup.isim} ${grup.kodgrup}`),
    name: `${grup.isim} ${grup.kodgrup}`,
    kategoriSlug: grup.kategoriSlug,
    shortDescription:
      `Logo baskılı ${grup.isim}${ilkOzellik ? ` — ${ilkOzellik}` : ""}`.slice(0, 160),
    description:
      `${temizAciklama}\n• Fiyata firmanıza özel logo baskısı dahildir.\n• Ürün kodu: ${grup.kodgrup}`,
    basePrice: yuvarla2(listeHaric(minListe) * kdvCarpan),
    productionTime: URETIM_SURESI,
    content: {
      sku: grup.kodgrup,
      brand: "Markala Promosyon",
      supplier: { name: TEDARIKCI, kodgrup: grup.kodgrup },
      seo,
      faqs,
      specifications,
      features: ozellikler,
      useCases: KULLANIM_SENARYOLARI[grup.kategoriSlug] ?? KULLANIM_SENARYOLARI["promosyon-cesitli"],
    },
    options,
    prices,
    gorselKaynaklari: gorselSirasi(grup),
    aktif,
    ozetHash: ozet,
  };
}

/**
 * Grup görselleri — tekrarsız, en fazla 6. SIRA BİLİNÇLİ (2026-09-17 örnek incelemesi):
 * SKU görseli (resim1) DÜZ ürün fotoğrafıdır → ana görsel olur; kodgrup görseli ise
 * Turkuaz'ın ESKİ MÜŞTERİLERİNİN logolu baskı örneklerini içeren kolajdır → galeriye
 * 2. sıraya gider. Ana görselde üçüncü taraf logosu görünmesin (Hasan, görsel sorusu).
 */
export function gorselSirasi(grup: TurkuazGrup): string[] {
  const out: string[] = [];
  const ekle = (u: string) => {
    if (u && !out.includes(u) && out.length < 6) out.push(u);
  };
  for (const s of grup.skular) {
    const ilk = s.resimler.find((u) => !u.includes("/kodgrup/"));
    if (ilk) {
      ekle(ilk);
      break; // ana görsel: ilk SKU'nun düz fotoğrafı
    }
  }
  const kodgrupResmi = grup.skular
    .flatMap((s) => s.resimler)
    .find((u) => u.includes("/kodgrup/"));
  if (kodgrupResmi) ekle(kodgrupResmi);
  for (const s of grup.skular) {
    const ilk = s.resimler.find((u) => !u.includes("/kodgrup/"));
    if (ilk) ekle(ilk);
  }
  for (const u of grup.skular.flatMap((s) => s.resimler)) ekle(u);
  return out;
}
