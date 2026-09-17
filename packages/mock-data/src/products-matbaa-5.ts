import type { ProductWithParams } from "./legacy-types";

/**
 * AJA-383 (2026-09-01) — Backend katalog: EKSİK ÜRÜNLER + ALT SEÇENEKLER.
 *
 * Bu modüldeki ürünlerin slug'ları, site header (site-header.tsx "Dijital Baskı"
 * mega-menü grubu) tarafından ZATEN link veriliyordu ama katalog kaydı olmadığı için
 * canlıda /urun/<slug> 404 dönüyordu. Bu dosya o boşluğu kapatır:
 *   - pleksi-baski, kompozit-baski, duvar-kagidi-baski, uv-dtf-baski,
 *     folyo-cesitleri, baskes-folyo, one-way-vision-baski  (header'da link var)
 *   - duratrans-baski, x-banner-stand  (AJA-383 madde 5 kapsamı; header linki henüz yok
 *     → Frontend/AJA-380 nav'a ekleyebilir)
 *
 * ⚠️ TÜM FİYATLAR TASLAK — HASAN ONAYI BEKLİYOR (AJA-383 kesin sınır).
 * pricePerSqm / unitPrice / priceModifier / flatFee / startingPrice değerleri
 * benzer ürünlerden türetilmiş PLACEHOLDER'dır; onay verilene kadar nihai değildir.
 * Onay tablosu için AJA-383 PR açıklamasına bakınız.
 */

const prodImg = (slug: string, i: number = 1) => `/api/mockup?slug=${slug}&v=${i}&w=1200&h=1200`;

export const matbaaProducts5: ProductWithParams[] = [
  // ========================================================================
  // PLEKSİ BASKI  (kategori: pleksi)
  // ========================================================================
  {
    slug: "pleksi-baski",
    name: "Pleksi Baskı — UV Baskılı Akrilik Levha",
    categorySlug: "pleksi",
    sku: "MK-PLX-UV-001",
    brand: "Markala",
    shortDescription: "Şeffaf/renkli pleksiglas üzerine UV baskı, m² fiyat",
    description:
      "Premium tabela ve dekorasyon uygulamalarının vazgeçilmezi olan pleksiglas (akrilik) plaka üzerine yüksek çözünürlüklü UV baskı hizmetimiz; şeffaf, opal (buzlu) veya renkli 3-10 mm pleksi üzerine, arkadan (ters) veya önden baskı seçenekleriyle üretilir. Lazer kesim ile milimetrik hassasiyette form verilir, kenarlar alevle parlatılarak kristal görünüm elde edilir. Kurumsal kapı isimlikleri, resepsiyon logo panoları, menü ve fiyat listeleri, ödül ve dekoratif panolar için en çok tercih edilen üründür. m² hesabı ile istediğiniz ebatta çalışılır.",
    basePrice: 0,
    startingPrice: 450,
    sizeLabel: "m² hesabı",
    productionTime: "2-4 iş günü",
    images: [prodImg("pleksi-baski", 1)],
    badges: ["yeni"],
    rating: { average: 4.8, count: 24 },
    features: [
      "3 / 5 / 8 / 10 mm şeffaf, opal veya renkli pleksi",
      "Yüksek çözünürlüklü UV baskı — önden veya ters (arka) baskı",
      "Lazer kesim + alevle kenar parlatma",
      "Mesafe bağlantı (stand-off) aparatı ile duvar montajı seçeneği",
      "Kurumsal isimlik, menü, ödül ve dekoratif pano",
    ],
    useCases: [
      "Resepsiyon / lobi kurumsal logo panosu",
      "Ofis kapısı isim ve ünvan isimliği",
      "Restoran ve kafe menü / fiyat panosu",
      "Fuar ve sergi bilgi panoları",
      "Dekoratif duvar ve ödül panoları",
    ],
    specifications: [
      { label: "Malzeme", value: "Döküm/ekstrüzyon pleksiglas (akrilik)" },
      { label: "Kalınlık", value: "3 / 5 / 8 / 10 mm" },
      { label: "Renk", value: "Şeffaf / opal / renkli" },
      { label: "Baskı", value: "UV — önden veya ters (arka) baskı" },
      { label: "Kesim", value: "Lazer + alevle kenar parlatma" },
      { label: "Ebat Aralığı", value: "10 - 200 cm (en/boy)" },
      { label: "Üretim Süresi", value: "2-4 iş günü" },
    ],
    faqs: [
      { q: "Önden mi ters (arka) baskı mı seçmeliyim?", a: "Şeffaf pleksiye ters baskıda görsel, pleksinin arka yüzüne basılır ve ön yüzden cam altı gibi parlak, çizilmeye karşı korumalı görünür — kurumsal panolarda önerdiğimiz yöntem budur. Önden baskı opal/renkli pleksilerde ve tek yönden görünen uygulamalarda tercih edilir." },
      { q: "Duvara nasıl monte edilir?", a: "Standart teslimde çift taraflı montaj bandı verilir. Kurumsal görünüm için krom mesafe bağlantı (stand-off) aparatı ekleyebilirsiniz; pleksi duvardan ~2 cm önde durarak gölge/derinlik efekti oluşturur." },
    ],
    relatedSlugs: ["kompozit-baski", "dekota-baski-5mm"],
    parameters: [
      {
        id: "kalinlik", label: "Kalınlık", kind: "radio", required: true, defaultOptionId: "5mm",
        options: [
          { id: "3mm", label: "3 mm", priceModifier: 0 },
          { id: "5mm", label: "5 mm", priceModifier: 120 },
          { id: "8mm", label: "8 mm", priceModifier: 260 },
          { id: "10mm", label: "10 mm", priceModifier: 380 },
        ],
      },
      {
        id: "renk", label: "Pleksi Rengi", kind: "radio", required: true, defaultOptionId: "seffaf",
        options: [
          { id: "seffaf", label: "Şeffaf", priceModifier: 0 },
          { id: "opal", label: "Opal (buzlu beyaz)", priceModifier: 0 },
          { id: "renkli", label: "Renkli", priceModifier: 60 },
        ],
      },
      {
        id: "ebat", label: "Ebat (en × boy cm)", kind: "dimension", required: true,
        pricePerSqm: 1450, minDimension: 10, maxDimension: 200, defaultWidth: 40, defaultHeight: 30,
        extras: [
          { id: "lazer-form", label: "Lazer Özel Form Kesim", flatFee: 120 },
          { id: "standoff", label: "Krom Mesafe Bağlantı (4 adet)", flatFee: 160 },
        ],
      },
    ],
    seo: {
      title: "Pleksi Baskı — UV Baskılı Akrilik Levha, m² 1.450 TL'den",
      description: "Şeffaf, opal veya renkli pleksiglas üzerine UV baskı + lazer kesim. Kurumsal isimlik, menü ve logo panosu için ters baskı seçeneği. m² 1.450 TL'den.",
      keywords: ["pleksi baskı", "pleksiglas baskı", "akrilik levha", "pleksi tabela", "kapı isimliği", "logo panosu", "ters baskı pleksi"],
    },
  },

  // ========================================================================
  // KOMPOZİT BASKI  (kategori: kompozit)
  // ========================================================================
  {
    slug: "kompozit-baski",
    name: "Kompozit Baskı — 3 mm Alüminyum Kompozit Panel",
    categorySlug: "kompozit",
    sku: "MK-KMP-3MM-001",
    brand: "Markala",
    shortDescription: "Alüminyum kompozit (Alkomp) panele dış mekan baskı, m² fiyat",
    description:
      "Dış mekan tabelacılığının en dayanıklı malzemesi olan 3 mm alüminyum kompozit (Alkomp/dibond) panel üzerine UV korumalı baskı hizmetimiz; iki ince alüminyum tabaka arasında polietilen öz bulunan bu panel, dış mekanda 8-10 yıl deforme olmadan kullanılır. Mağaza alın tabelası, cephe giydirme, yönlendirme panosu ve totem uygulamalarında sektörün standardıdır. Düz kesim veya CNC ile özel form; askılık, çıta ve stand ekstralarıyla teslim edilir. m² hesabı ile istediğiniz ebatta çalışılır.",
    basePrice: 0,
    startingPrice: 445,
    sizeLabel: "m² hesabı",
    productionTime: "2-4 iş günü",
    images: [prodImg("kompozit-baski", 1)],
    badges: ["yeni"],
    rating: { average: 4.7, count: 33 },
    features: [
      "3 mm alüminyum kompozit (Alkomp) panel",
      "UV korumalı baskı — dış mekanda 8-10 yıl",
      "Düz veya CNC özel form kesim",
      "Alüminyum çıta / askılık ile kolay montaj",
      "Mağaza alın tabelası ve cephe için ideal",
    ],
    useCases: [
      "Mağaza ve iş yeri alın tabelası",
      "Bina cephe giydirme panoları",
      "Yönlendirme ve bilgilendirme tabelaları",
      "Totem ve yol kenarı reklam panosu",
      "Kurumsal kapı ve resepsiyon panosu",
    ],
    specifications: [
      { label: "Malzeme", value: "3 mm alüminyum kompozit (PE öz)" },
      { label: "Baskı", value: "UV / solvent dış mekan dayanıklı" },
      { label: "Dayanım", value: "Dış mekanda 8-10 yıl" },
      { label: "Kesim", value: "Düz veya CNC özel form" },
      { label: "Ebat Aralığı", value: "20 - 305 cm (en/boy)" },
      { label: "Üretim Süresi", value: "2-4 iş günü" },
    ],
    faqs: [
      { q: "Kompozit mi dekota mı tercih etmeliyim?", a: "Doğrudan yağmur ve güneş alan açık alan tabelaları için kompozit (8-10 yıl) doğru seçimdir. Saçak altı, mağaza içi veya kısa ömürlü uygulamalarda 5 mm dekota daha ekonomik olur. Uzun ömür + cephe montajı = kompozit." },
      { q: "Montaj aparatı dahil mi?", a: "Panel baskısı temel fiyata dahildir. Alüminyum U çıta, askılık deliği veya duvar dübeli seti ekstra olarak eklenir; montaj ekibi hizmeti Mersin ve çevresi için ayrıca sunulur." },
    ],
    relatedSlugs: ["dekota-baski-5mm", "pleksi-baski"],
    parameters: [
      {
        id: "kesim", label: "Kesim", kind: "radio", required: true, defaultOptionId: "duz",
        options: [
          { id: "duz", label: "Düz Kesim", priceModifier: 0 },
          { id: "ozel", label: "CNC Özel Form", priceModifier: 90 },
        ],
      },
      {
        id: "ebat", label: "Ebat (en × boy cm)", kind: "dimension", required: true,
        pricePerSqm: 890, minDimension: 20, maxDimension: 305, defaultWidth: 100, defaultHeight: 50,
        extras: [
          { id: "cita", label: "Alüminyum U Çıta (çevre)", perimeterPricePerM: 45 },
          { id: "askilik", label: "Askılık Aparatı (köşe deliği)", flatFee: 40 },
        ],
      },
    ],
    seo: {
      title: "Kompozit Baskı — 3 mm Alüminyum Kompozit Tabela, m² 890 TL'den",
      description: "3 mm alüminyum kompozit (Alkomp) panele UV baskı, m² 890 TL'den. Dış mekanda 8-10 yıl dayanıklı; alın tabelası, cephe ve yönlendirme için düz/CNC kesim.",
      keywords: ["kompozit baskı", "alüminyum kompozit", "alkomp tabela", "dibond baskı", "alın tabelası", "cephe tabela", "dış mekan tabela"],
    },
  },

  // ========================================================================
  // DURATRANS (BACKLIT) BASKI  (kategori: duratrans)
  // ========================================================================
  {
    slug: "duratrans-baski",
    name: "Duratrans Baskı — Backlit Işıklı Kutu Filmi",
    categorySlug: "duratrans",
    sku: "MK-DRT-BL-001",
    brand: "Markala",
    shortDescription: "Işıklı kutu için arkadan aydınlatmalı backlit baskı, m² fiyat",
    description:
      "Işıklı kutu (lightbox), menü board ve vitrin aydınlatma uygulamaları için özel olarak geliştirilen backlit (duratrans) film üzerine yüksek yoğunluklu UV baskı hizmetimiz; arkadan aydınlatıldığında renkleri soluklaştırmadan canlı ve homojen tutan yoğun mürekkep katmanıyla üretilir. Fast-food menü panoları, AVM ışıklı reklam kutuları, sinema afiş kutuları ve eczane/vitrin aydınlatmaları için idealdir. m² hesabı ile istediğiniz ebatta çalışılır.",
    basePrice: 0,
    startingPrice: 390,
    sizeLabel: "m² hesabı",
    productionTime: "2-3 iş günü",
    images: [prodImg("duratrans-baski", 1)],
    badges: ["yeni"],
    rating: { average: 4.6, count: 18 },
    features: [
      "Yüksek yoğunluklu backlit (duratrans) film",
      "Arkadan aydınlatmada canlı, homojen renk",
      "Işıklı kutu / lightbox / menü board için optimize",
      "Mat veya parlak lamine koruma seçeneği",
      "m² hesabı ile özel ebat",
    ],
    useCases: [
      "Fast-food ve restoran menü ışıklı panosu",
      "AVM ve mağaza ışıklı reklam kutusu",
      "Sinema / etkinlik afiş kutusu",
      "Eczama ve vitrin aydınlatma görselleri",
      "Havalimanı ve metro ışıklı reklam",
    ],
    specifications: [
      { label: "Malzeme", value: "Backlit (duratrans) film" },
      { label: "Baskı", value: "Yüksek yoğunluklu UV — backlit optimize" },
      { label: "Kullanım", value: "Arkadan aydınlatmalı ışıklı kutu" },
      { label: "Yüzey", value: "Mat veya parlak lamine" },
      { label: "Ebat Aralığı", value: "20 - 300 cm (en/boy)" },
      { label: "Üretim Süresi", value: "2-3 iş günü" },
    ],
    faqs: [
      { q: "Normal afiş baskısından farkı ne?", a: "Backlit film, arkadan ışık geçtiğinde renklerin solmaması için normale göre çok daha yoğun mürekkep katmanı taşır. Standart afişi ışıklı kutuya koyarsanız görsel soluk ve lekeli görünür; duratrans bu sorunu çözer." },
      { q: "Işıklı kutumun ölçüsüne göre üretiyor musunuz?", a: "Evet. Kutunuzun iç görünür ölçüsünü (en × boy) girmeniz yeterli; 1-2 cm oturma payı ekleyerek üretiriz. LED ışıklı kutunuz yoksa lightbox ürünümüzle birlikte sipariş verebilirsiniz." },
    ],
    relatedSlugs: ["lightbox-led-100cm", "vinil-branda-440gr"],
    parameters: [
      {
        id: "yuzey", label: "Yüzey Kaplama", kind: "radio", required: true, defaultOptionId: "mat",
        options: [
          { id: "mat", label: "Mat Lamine", priceModifier: 0 },
          { id: "parlak", label: "Parlak Lamine", priceModifier: 0 },
        ],
      },
      {
        id: "ebat", label: "Ebat (en × boy cm)", kind: "dimension", required: true,
        pricePerSqm: 780, minDimension: 20, maxDimension: 300, defaultWidth: 100, defaultHeight: 60,
        extras: [],
      },
    ],
    seo: {
      title: "Duratrans Baskı — Backlit Işıklı Kutu Filmi, m² 780 TL'den",
      description: "Işıklı kutu ve menü board için backlit (duratrans) baskı, m² 780 TL'den. Arkadan aydınlatmada solmayan canlı renk; mat/parlak lamine, özel ebat.",
      keywords: ["duratrans baskı", "backlit baskı", "ışıklı kutu baskı", "lightbox film", "menü board", "arkadan aydınlatmalı afiş"],
    },
  },

  // ========================================================================
  // DUVAR KAĞIDI BASKI  (kategori: duvar-kagidi)
  // ========================================================================
  {
    slug: "duvar-kagidi-baski",
    name: "Duvar Kağıdı Baskı — Özel Tasarım",
    categorySlug: "duvar-kagidi",
    sku: "MK-DVK-OZL-001",
    brand: "Markala",
    shortDescription: "Özel tasarım baskılı duvar kağıdı, m² fiyatlandırma",
    description:
      "Ofis, mağaza, kafe, çocuk odası ve ev dekorasyonu için özel tasarım baskılı duvar kağıdı hizmetimiz; dokulu, mat veya silinebilir vinil yüzey seçenekleriyle m² hesabında üretilir. Kendi görselinizi, kurumsal duvarınıza logo/görsel kompozisyonunu veya hazır desen kütüphanemizden bir tasarımı bastırabilirsiniz. Şeritler halinde, uygulama kılavuzu ve fazladan hizalama payıyla teslim edilir. Nefes alan, kabarcık yapmayan yapıştırma için kılavuz videosu gönderilir.",
    basePrice: 0,
    startingPrice: 320,
    sizeLabel: "m² hesabı",
    productionTime: "3-5 iş günü",
    images: [prodImg("duvar-kagidi-baski", 1)],
    badges: ["yeni"],
    rating: { average: 4.7, count: 21 },
    features: [
      "Dokulu, mat veya silinebilir vinil yüzey",
      "Özel görsel veya hazır desen kütüphanesi",
      "m² hesabı — duvar ölçünüze göre şeritli üretim",
      "Uygulama kılavuzu + hizalama payı dahil",
      "Ofis, mağaza, kafe ve ev dekorasyonu",
    ],
    useCases: [
      "Ofis / toplantı odası kurumsal duvar",
      "Kafe ve restoran konsept duvarı",
      "Mağaza vitrin arka fon giydirme",
      "Çocuk odası ve ev dekorasyonu",
      "Fuar standı arka pano giydirme",
    ],
    specifications: [
      { label: "Malzeme", value: "Dokulu / mat / silinebilir vinil duvar kağıdı" },
      { label: "Baskı", value: "Lateks/UV — kokusuz, iç mekan güvenli" },
      { label: "Teslim", value: "Şeritli (~50-100 cm en), uygulama payı ile" },
      { label: "Yüzey", value: "Mat, dokulu veya silinebilir" },
      { label: "Ebat", value: "m² hesabı, duvar ölçüsüne özel" },
      { label: "Üretim Süresi", value: "3-5 iş günü" },
    ],
    faqs: [
      { q: "Duvarımın ölçüsünü nasıl vermeliyim?", a: "Duvarın genişliği ve yüksekliğini (cm) girin; sistem m²'yi hesaplar. Prizler, kapı ve pencere boşluklarını çıkarmayın — tam dikdörtgen ölçü verin, uygulama sırasında fazlalık kesilir. Emin değilseniz ölçü fotoğrafını sipariş notuna ekleyin." },
      { q: "Yapıştırması zor mu?", a: "Şeritler hizalama payı ile üretilir ve numaralandırılır; sabunlu su + plastik spatula ile kabarcıksız uygulanır. Kılavuz videosu e-postanıza gönderilir. Mersin ve çevresinde profesyonel uygulama hizmeti de sunulur." },
    ],
    relatedSlugs: ["folyo-cesitleri", "vinil-branda-440gr"],
    parameters: [
      {
        id: "yuzey", label: "Yüzey Tipi", kind: "radio", required: true, defaultOptionId: "mat",
        options: [
          { id: "mat", label: "Mat", priceModifier: 0 },
          { id: "dokulu", label: "Dokulu", priceModifier: 40 },
          { id: "silinebilir", label: "Silinebilir Vinil", priceModifier: 70 },
        ],
      },
      {
        id: "ebat", label: "Duvar Ölçüsü (en × boy cm)", kind: "dimension", required: true,
        pricePerSqm: 320, minDimension: 50, maxDimension: 600, defaultWidth: 300, defaultHeight: 250,
        extras: [
          { id: "uygulama", label: "Profesyonel Uygulama (Mersin içi)", flatFee: 350 },
        ],
      },
    ],
    seo: {
      title: "Duvar Kağıdı Baskı — Özel Tasarım, m² 320 TL'den",
      description: "Özel tasarım baskılı duvar kağıdı, m² 320 TL'den. Dokulu, mat veya silinebilir vinil; ofis, kafe, mağaza ve ev için kişiye özel duvar giydirme.",
      keywords: ["duvar kağıdı baskı", "özel duvar kağıdı", "3d duvar kağıdı", "kişiye özel duvar", "ofis duvar giydirme", "kafe duvar kağıdı"],
    },
  },

  // ========================================================================
  // X-BANNER STAND  (kategori: x-banner)
  // ========================================================================
  {
    slug: "x-banner-stand",
    name: "X-Banner Stand — 60 x 160 cm",
    categorySlug: "x-banner",
    sku: "MK-XBN-60160-001",
    brand: "Markala",
    shortDescription: "Katlanır X ayaklı afiş standı + baskı + çanta",
    description:
      "Fuar, mağaza girişi, etkinlik ve tanıtım masaları için ekonomik ve taşınabilir stand çözümü olan X-banner standımız; 60x160 cm standart ebatta, hafif katlanır X biçimli ayak + su geçirmez afiş baskısı + taşıma çantası ile teslim edilir. Roll-up'a göre daha ekonomik, saniyeler içinde kurulur ve toplanır. Afişi köşe apoletlerden gererek takılır; standı koruyup afişi yenileyerek tekrar tekrar kullanabilirsiniz.",
    basePrice: 480,
    startingPrice: 480,
    sizeLabel: "60 x 160 cm",
    productionTime: "2 iş günü",
    images: [prodImg("x-banner-stand", 1)],
    badges: ["yeni"],
    rating: { average: 4.5, count: 27 },
    features: [
      "60x160 cm standart ebat (80x180 cm seçeneği)",
      "Hafif katlanır X ayak + taşıma çantası",
      "Su geçirmez afiş baskısı — köşe apoletli germe",
      "Saniyeler içinde kur-topla, tekrar kullanım",
      "Roll-up'a göre ekonomik alternatif",
    ],
    useCases: [
      "Fuar ve sergi stand tanıtımı",
      "Mağaza girişi kampanya duyurusu",
      "Etkinlik / seminer karşılama alanı",
      "Restoran menü ve kampanya standı",
      "Açılış ve promosyon tanıtımları",
    ],
    specifications: [
      { label: "Ebat", value: "60 x 160 cm (80 x 180 cm opsiyon)" },
      { label: "Ayak", value: "Katlanır X biçimli fiber/metal" },
      { label: "Afiş", value: "Su geçirmez PP / branda, köşe apoletli" },
      { label: "Çanta", value: "Taşıma çantası dahil" },
      { label: "Üretim Süresi", value: "2 iş günü" },
    ],
    faqs: [
      { q: "Roll-up ile farkı nedir?", a: "X-banner daha hafif ve ekonomiktir; afiş X ayağa köşelerden gerilir. Roll-up'ta afiş kasetten çıkar ve daha kurumsal/dayanıklıdır. Sık afiş değiştiren ve bütçe odaklı kullanımlar için X-banner, uzun ömürlü sabit kullanım için roll-up öneririz." },
      { q: "Afişi tek başına yenileyebilir miyim?", a: "Evet. Stand ayağı kalıcıdır; sadece afiş baskısını (yalnız afiş fiyatına) yeniden sipariş ederek eskisiyle değiştirebilirsiniz. Sipariş notuna 'yalnız afiş' yazmanız yeterli." },
    ],
    relatedSlugs: ["rollup-standart", "yelken-bayrak-damla"],
    parameters: [
      {
        id: "ebat", label: "Stand Ebadı", kind: "radio", required: true, defaultOptionId: "60x160",
        options: [
          { id: "60x160", label: "60 × 160 cm", priceModifier: 0 },
          { id: "80x180", label: "80 × 180 cm", priceModifier: 140 },
        ],
      },
      {
        id: "icerik", label: "Kapsam", kind: "radio", required: true, defaultOptionId: "stand-afis",
        options: [
          { id: "stand-afis", label: "Stand + Afiş (tam set)", priceModifier: 0 },
          { id: "yalniz-afis", label: "Yalnız Afiş (yedek)", priceModifier: -300 },
        ],
      },
      { id: "adet", label: "Adet", kind: "quantity", required: true, unitPrice: 480, quantityPresets: [1, 2, 5, 10] },
    ],
    seo: {
      title: "X-Banner Stand — 60x160 cm Afiş Standı, 480 TL'den",
      description: "60x160 cm katlanır X-banner standı + su geçirmez afiş baskısı + taşıma çantası, 480 TL'den. Fuar, mağaza ve etkinlik için ekonomik taşınabilir stand.",
      keywords: ["x banner", "x-banner stand", "afiş standı", "katlanır stand", "fuar standı", "ekonomik stand", "x ayak afiş"],
    },
  },

  // ========================================================================
  // UV DTF BASKI  (kategori: uv-dtf)
  // ========================================================================
  {
    slug: "uv-dtf-baski",
    name: "UV DTF Baskı — Her Yüzeye Transfer Sticker",
    categorySlug: "uv-dtf",
    sku: "MK-UVDTF-001",
    brand: "Markala",
    shortDescription: "Cam, metal, ahşap, plastiğe uygulanan UV DTF transfer",
    description:
      "En yeni transfer teknolojisi olan UV DTF (Direct-to-Film); cam, metal, ahşap, plastik, seramik ve kavisli yüzeylere ısı gerektirmeden, kalıcı ve hafif kabartmalı dokuyla uygulanan tam renkli sticker çözümüdür. A/B film sandviçi olarak teslim edilir: uygulama filmini yüzeye bastırıp taşıyıcıyı soymanız yeterlidir. Logo etiketleri, ürün markalama, promosyon sticker'ları, cam ve kutu dekorasyonu için idealdir. m² hesabı ile ölçekli üretilir; küçük adetli logo setleri de yapılır.",
    basePrice: 0,
    startingPrice: 190,
    sizeLabel: "m² hesabı",
    productionTime: "2-3 iş günü",
    images: [prodImg("uv-dtf-baski", 1)],
    badges: ["yeni"],
    rating: { average: 4.8, count: 15 },
    features: [
      "Cam, metal, ahşap, plastik, seramik yüzeye uygun",
      "Isı gerektirmez — bastır & soy uygulama",
      "Kalıcı, hafif kabartmalı doku",
      "Tam renkli + beyaz alt baskı (opak)",
      "Logo etiketi, ürün markalama, promosyon",
    ],
    useCases: [
      "Ürün ve ambalaj logo markalama",
      "Cam bardak / kupa / şişe dekorasyonu",
      "Elektronik ve beyaz eşya etiketi",
      "Promosyon ve hediyelik sticker",
      "Kavisli yüzey (kask, termos) uygulama",
    ],
    specifications: [
      { label: "Teknoloji", value: "UV DTF (Direct-to-Film) transfer" },
      { label: "Yüzey", value: "Cam, metal, ahşap, plastik, seramik" },
      { label: "Uygulama", value: "Isısız — bastır & soy" },
      { label: "Renk", value: "Tam renk + opak beyaz alt baskı" },
      { label: "Ebat", value: "m² hesabı; özel form kesim" },
      { label: "Üretim Süresi", value: "2-3 iş günü" },
    ],
    faqs: [
      { q: "Sticker ile UV DTF arasındaki fark nedir?", a: "Klasik yapışkan sticker düz yüzeyde iyi durur ama kenarları zamanla kalkabilir ve kavisli yüzeyde kırışır. UV DTF, kabartmalı ve daha ince bir film olduğu için kavisli yüzeylere oturur, kenar kalkması yapmaz ve çizilmeye karşı daha dayanıklıdır." },
      { q: "Bulaşık makinesine dayanıklı mı?", a: "Elde yıkamada uzun ömürlüdür. Yoğun bulaşık makinesi kullanımında (bardak/kupa) zamanla aşınabilir; gıdayla temas eden ürünlerde logoyu temas alanının dışına konumlandırmanızı öneririz." },
    ],
    relatedSlugs: ["folyo-cesitleri", "arac-sticker-yan"],
    parameters: [
      {
        id: "ebat", label: "Ebat (en × boy cm)", kind: "dimension", required: true,
        pricePerSqm: 950, minDimension: 5, maxDimension: 130, defaultWidth: 30, defaultHeight: 30,
        extras: [
          { id: "form-kesim", label: "Kontur (özel form) Kesim", flatFee: 60 },
        ],
      },
    ],
    seo: {
      title: "UV DTF Baskı — Her Yüzeye Transfer Sticker, m² 950 TL'den",
      description: "Cam, metal, ahşap ve plastiğe ısısız uygulanan UV DTF transfer sticker, m² 950 TL'den. Kalıcı, kabartmalı doku; logo markalama ve ürün etiketi için.",
      keywords: ["uv dtf baskı", "uv dtf transfer", "dtf sticker", "logo transfer", "ürün markalama", "cam sticker", "metal etiket"],
    },
  },

  // ========================================================================
  // FOLYO ÇEŞİTLERİ  (kategori: folyo) — folyo ailesi hub ürünü
  // ========================================================================
  {
    slug: "folyo-cesitleri",
    name: "Folyo Çeşitleri — Renkli & Kesimli Yapışkan Folyo",
    categorySlug: "folyo",
    sku: "MK-FLY-CES-001",
    brand: "Markala",
    shortDescription: "Renkli, mat, transparan yapışkan folyo + kesim, m² fiyat",
    description:
      "Cam, duvar, ahşap ve düz yüzeyler için geniş renk ve yüzey seçeneğiyle sunulan yapışkan folyo çeşitlerimiz; renkli (mono renk), mat buzlu (cam gizlilik), transparan ve metalik seçenekleriyle m² hesabında üretilir. Kesimli (CNC/plotter) uygulamada logo ve yazılarınız tek tek kesilir, uygulama bandıyla tek seferde yapıştırılır. Vitrin yazısı, cam gizlilik folyosu, dekoratif duvar ve mağaza giydirme için doğru başlangıç ürünüdür — özel folyo tipleri (baskes, one way vision, UV DTF) için ilgili ürünlerimize bakınız.",
    basePrice: 0,
    startingPrice: 95,
    sizeLabel: "m² hesabı",
    productionTime: "1-2 iş günü",
    images: [prodImg("folyo-cesitleri", 1)],
    badges: ["yeni"],
    rating: { average: 4.6, count: 44 },
    features: [
      "Renkli / mat buzlu / transparan / metalik folyo",
      "CNC/plotter kesim ile logo ve yazı",
      "Uygulama bandı (transfer tape) seçeneği",
      "5 yıl iç/dış mekan dayanıklılık",
      "Cam gizlilik, vitrin yazısı, dekoratif giydirme",
    ],
    useCases: [
      "Mağaza vitrini logo ve slogan yazıları",
      "Cam gizlilik (buzlu) folyo uygulaması",
      "Ofis bölme camı dekoratif giydirme",
      "Dekoratif duvar ve mobilya kaplama",
      "Yasal bilgi / vergi no yazıları",
    ],
    specifications: [
      { label: "Folyo Tipi", value: "Renkli / mat buzlu / transparan / metalik" },
      { label: "Kesim", value: "CNC / plotter (vektörel dosya)" },
      { label: "Dayanım", value: "5 yıl iç/dış mekan" },
      { label: "Ebat Aralığı", value: "10 - 400 cm (en/boy)" },
      { label: "Üretim Süresi", value: "1-2 iş günü" },
    ],
    faqs: [
      { q: "Hangi folyo tipini seçmeliyim?", a: "Vitrin yazısı için renkli/kesimli folyo, cam gizliliği için mat buzlu folyo, tam görsel baskı için baskılı folyo doğru seçimdir. Dışarıdan görünüp içeriden bakışı açık tutan uygulama için 'One Way Vision', ışık geçirmeyen arka fon için 'Baskes Folyo' ürünlerimize bakın." },
      { q: "Uygulama bandı nedir, gerekli mi?", a: "Kesimli yazı/logo çok parçalıysa, uygulama bandı (transfer tape) tüm parçaları hizasında tutarak tek seferde yapıştırmanızı sağlar. Tek parça basit uygulamalarda gerekmez; çok parçalı yazılarda kesinlikle öneririz." },
    ],
    relatedSlugs: ["baskes-folyo", "one-way-vision-baski", "cam-folyosu-kesimli"],
    parameters: [
      {
        id: "tip", label: "Folyo Tipi", kind: "radio", required: true, defaultOptionId: "renkli",
        options: [
          { id: "renkli", label: "Renkli (mono)", priceModifier: 0 },
          { id: "mat-buzlu", label: "Mat Buzlu (cam gizlilik)", priceModifier: 25 },
          { id: "transparan", label: "Transparan Baskılı", priceModifier: 35 },
          { id: "metalik", label: "Metalik (altın/gümüş)", priceModifier: 55 },
        ],
      },
      {
        id: "ebat", label: "Ebat (en × boy cm)", kind: "dimension", required: true,
        pricePerSqm: 130, minDimension: 10, maxDimension: 400, defaultWidth: 100, defaultHeight: 100,
        extras: [
          { id: "kesim", label: "CNC Kesim (yazı/logo)", flatFee: 80 },
          { id: "uygulama-bandi", label: "Uygulama Bandı (transfer tape)", perimeterPricePerM: 8 },
        ],
      },
    ],
    seo: {
      title: "Folyo Çeşitleri — Renkli & Kesimli Yapışkan Folyo, m² 130 TL'den",
      description: "Renkli, mat buzlu, transparan ve metalik yapışkan folyo + CNC kesim, m² 130 TL'den. Vitrin yazısı, cam gizlilik ve dekoratif giydirme için.",
      keywords: ["folyo çeşitleri", "yapışkan folyo", "kesimli folyo", "cam gizlilik folyo", "mat buzlu folyo", "vitrin folyo", "renkli folyo"],
    },
  },

  // ========================================================================
  // BASKES FOLYO  (kategori: folyo) — arkası gri, ışık geçirmez (item 6 "arkası gri")
  // ========================================================================
  {
    slug: "baskes-folyo",
    name: "Baskes Folyo — Arkası Gri Işık Geçirmez Baskı",
    categorySlug: "folyo",
    sku: "MK-FLY-BSK-001",
    brand: "Markala",
    shortDescription: "Arkası gri (blockout), ışık geçirmez baskılı folyo, m² fiyat",
    description:
      "Arkası gri (blockout) yapısıyla ışığı ve arka görüntüyü tamamen kapatan baskes folyo; bir cam veya yüzeyin ARDINDAKİ görüntünün önden görünmesini engelleyerek net, opak bir baskı sunar. Cam üzerine tam kapatıcı vitrin görselleri, ışık sızdırmayan reklam panoları, üst üste uygulama (eski folyonun üzerini kapatma) ve arka fon giydirme için idealdir. m² hesabı ile istediğiniz ebatta üretilir; parlak veya mat yüzeyle laminasyon eklenebilir.",
    basePrice: 0,
    startingPrice: 145,
    sizeLabel: "m² hesabı",
    productionTime: "1-2 iş günü",
    images: [prodImg("baskes-folyo", 1)],
    badges: ["yeni"],
    rating: { average: 4.6, count: 19 },
    features: [
      "Arkası gri (blockout) — ışık ve arka görüntü geçmez",
      "Tam opak, net vitrin ve pano baskısı",
      "Eski folyo/görsel üzerine kapatarak uygulama",
      "Mat veya parlak koruyucu laminasyon",
      "Cam, duvar ve düz yüzeylere yapışkan",
    ],
    useCases: [
      "Cam vitrin tam kapatıcı reklam giydirme",
      "Işık sızdırmaması gereken reklam panoları",
      "Eski folyo/görselin üzerini kapatma",
      "Fuar standı arka fon giydirme",
      "Mağaza bölme camı gizlilik + reklam",
    ],
    specifications: [
      { label: "Malzeme", value: "Arkası gri blockout yapışkan folyo" },
      { label: "Opaklık", value: "Tam opak — ışık geçirmez" },
      { label: "Baskı", value: "UV/eco-solvent tam renk" },
      { label: "Yüzey", value: "Mat veya parlak lamine (opsiyon)" },
      { label: "Ebat Aralığı", value: "10 - 400 cm (en/boy)" },
      { label: "Üretim Süresi", value: "1-2 iş günü" },
    ],
    faqs: [
      { q: "Normal folyodan farkı nedir?", a: "Standart folyoda arka yüzey açık/şeffaftır ve güçlü ışıkta arka görüntü hafifçe görünebilir. Baskes folyonun arkası gri (blockout) olduğu için ışığı ve arka görüntüyü tamamen keser; net, opak sonuç verir. Cam vitrinde arkadaki dağınık iç mekanı gizlemek isterseniz baskes doğru seçimdir." },
      { q: "Camın iç tarafına mı dış tarafına mı uygulanır?", a: "Genellikle iç tarafa uygulanır (çizilme ve hava koşullarından korunur, önden net görünür). Dış cephede korunaklı olmayan alanlar için dış uygulama + parlak laminasyon öneririz." },
    ],
    relatedSlugs: ["one-way-vision-baski", "folyo-cesitleri", "vinil-branda-440gr"],
    parameters: [
      {
        id: "yuzey", label: "Yüzey Kaplama", kind: "radio", required: true, defaultOptionId: "mat",
        options: [
          { id: "mat", label: "Mat Lamine", priceModifier: 0 },
          { id: "parlak", label: "Parlak Lamine", priceModifier: 0 },
          { id: "laminesiz", label: "Laminesiz", priceModifier: -20 },
        ],
      },
      {
        id: "ebat", label: "Ebat (en × boy cm)", kind: "dimension", required: true,
        pricePerSqm: 165, minDimension: 10, maxDimension: 400, defaultWidth: 100, defaultHeight: 100,
        extras: [
          { id: "kesim", label: "CNC Kontur Kesim", flatFee: 80 },
        ],
      },
    ],
    seo: {
      title: "Baskes Folyo — Arkası Gri Işık Geçirmez Baskı, m² 165 TL'den",
      description: "Arkası gri (blockout) baskes folyo, m² 165 TL'den. Işık geçirmez tam opak vitrin ve pano baskısı; eski folyo üzerine kapatma, mat/parlak lamine.",
      keywords: ["baskes folyo", "arkası gri folyo", "blockout folyo", "ışık geçirmez folyo", "opak folyo", "vitrin kapatma folyo"],
    },
  },

  // ========================================================================
  // ONE WAY VISION  (kategori: folyo) — delikli, tek yön görüş (item 6)
  // ========================================================================
  {
    slug: "one-way-vision-baski",
    name: "One Way Vision — Delikli Tek Yön Görüş Folyosu",
    categorySlug: "folyo",
    sku: "MK-FLY-OWV-001",
    brand: "Markala",
    shortDescription: "Dışarıdan reklam, içeriden görüş — delikli cam folyosu, m² fiyat",
    description:
      "Mikro delikli (perfore) yapısıyla dışarıdan bakıldığında tam renkli reklam görseli, içeriden bakıldığında dışarıyı görmeyi sağlayan one way vision folyosu; mağaza vitrini, araç camı ve otobüs giydirmelerinde en çok tercih edilen üründür. %40 delik oranı ile hem net baskı hem içeriden görüş dengesi kurulur. Arka yüzü koyu (gri/siyah) olduğundan dışarıdan görsel canlı, içeriden cam şeffaf algılanır. m² hesabı ile üretilir; araç camı uygulamaları için laminasyon önerilir.",
    basePrice: 0,
    startingPrice: 175,
    sizeLabel: "m² hesabı",
    productionTime: "1-2 iş günü",
    images: [prodImg("one-way-vision-baski", 1)],
    badges: ["yeni"],
    rating: { average: 4.7, count: 22 },
    features: [
      "Mikro delikli (perfore) — %40 delik oranı",
      "Dışarıdan reklam, içeriden net görüş",
      "Arka yüzü koyu — dışarıdan canlı, içeriden şeffaf",
      "Mağaza vitrini ve araç camı uygulaması",
      "Koruyucu laminasyon (araç için önerilir)",
    ],
    useCases: [
      "Mağaza vitrini tam cam reklam giydirme",
      "Araç arka/yan cam reklam uygulaması",
      "Otobüs ve toplu taşıma giydirme",
      "Ofis camı reklam + içeriden görüş",
      "Etkinlik / showroom cam giydirme",
    ],
    specifications: [
      { label: "Malzeme", value: "Perfore (delikli) tek yön görüş folyosu" },
      { label: "Delik Oranı", value: "%40 (baskı/görüş dengesi)" },
      { label: "Baskı", value: "UV/eco-solvent tam renk" },
      { label: "Yüzey", value: "Laminasyon opsiyonu (araç için önerilir)" },
      { label: "Ebat Aralığı", value: "10 - 400 cm (en/boy)" },
      { label: "Üretim Süresi", value: "1-2 iş günü" },
    ],
    faqs: [
      { q: "İçeriden gerçekten dışarısı görünür mü?", a: "Evet. Gündüz iç mekan dışarıdan daha karanlık olduğu için dışarıdan yalnızca reklam görseli, içeriden ise deliklerden dışarısı net görünür. Gece iç mekan aydınlık, dışarısı karanlık olduğunda bu etki tersine döner — geceleri yoğun kullanılan camlarda bunu göz önünde bulundurun." },
      { q: "Araç camına uygulanır mı, yasal mı?", a: "Yan ve arka camlara uygulanabilir; sürücünün ön görüşünü kapatan uygulamalar trafik mevzuatına aykırıdır. Ön cam ve sürücü yan camlarına uygulama yapmıyoruz; arka/yan cam reklamları için laminasyonlu üretim öneririz." },
    ],
    relatedSlugs: ["baskes-folyo", "arac-sticker-yan", "folyo-cesitleri"],
    parameters: [
      {
        id: "lamine", label: "Koruyucu Laminasyon", kind: "radio", required: true, defaultOptionId: "laminesiz",
        options: [
          { id: "laminesiz", label: "Laminesiz", priceModifier: 0 },
          { id: "mat", label: "Mat Lamine", priceModifier: 30 },
          { id: "parlak", label: "Parlak Lamine (araç)", priceModifier: 30 },
        ],
      },
      {
        id: "ebat", label: "Ebat (en × boy cm)", kind: "dimension", required: true,
        pricePerSqm: 210, minDimension: 10, maxDimension: 400, defaultWidth: 100, defaultHeight: 100,
        extras: [
          { id: "uygulama", label: "Yerinde Uygulama (Mersin içi)", flatFee: 250 },
        ],
      },
    ],
    seo: {
      title: "One Way Vision — Delikli Tek Yön Görüş Folyosu, m² 210 TL'den",
      description: "Dışarıdan reklam, içeriden görüş sağlayan one way vision (delikli) folyo, m² 210 TL'den. Mağaza vitrini ve araç camı için %40 delikli tam renk baskı.",
      keywords: ["one way vision", "tek yön görüş folyo", "delikli folyo", "perfore folyo", "vitrin cam reklam", "araç cam folyo", "cam giydirme"],
    },
  },
];
