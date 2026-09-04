#!/usr/bin/env node
/**
 * TİCARİ SEO — kategori içerikleri, PARTİ 2: İSG LEVHALARI (2026-09-04, Yetişme Planı Faz 1).
 *
 * Kapsam: 10 iş güvenliği kategorisi + ISO 7010 toplayıcı kategori. 730 ürünle kataloğun en
 * derin alanı; rakiplerin hiç girmediği, GSC'de "topraklama işareti", "emredici işaret rengi",
 * "ilk yardım dolabı işareti hangi renk" gibi sorularla gösterim aldığımız yer.
 *
 * Ortak ürün gerçekleri (canlı katalogdan): ebat 25×35 / 35×50 / 50×70 / 70×100 cm; malzeme
 * yapışkanlı etiket (sticker), 0,50 mm PVC levha, 3 mm dekota/foreks, 0,50 mm galvaniz sac;
 * baskı UV / reflektif folyo / fosforlu lümen folyo; adet 1-100; üretim 2-3 iş günü.
 * Yönetmelik: Sağlık ve Güvenlik İşaretleri Yönetmeliği (11.09.2013, RG 28762) + ISO 7010.
 * FİYAT POLİTİKASI: sabit TL rakamı yazılmaz.
 *
 * Kullanım: ADMIN_EMAIL=... ADMIN_PASSWORD=... node scripts/seo/kategori-icerik-parti2-isg.mjs [--dry]
 */
const API = process.env.API_URL || "https://api.markala.com.tr";
const DRY = process.argv.includes("--dry");

/** Her İSG kategorisinde ortak olan malzeme/ebat/dosya/teslimat bölümleri — tekrar yerine tek kaynak. */
const ORTAK = {
  malzemeTablo: {
    basliklar: ["Malzeme", "Özellik", "Nereye asılır"],
    satirlar: [
      ["Yapışkanlı etiket (sticker)", "Yüzeye doğrudan yapıştırılır, en ekonomik", "Pano kapağı, makine gövdesi, kapı, cam"],
      ["0,50 mm PVC levha", "Hafif, esnek, vidalanır veya çift taraflı bantla asılır", "İç mekân duvar, ofis, koridor"],
      ["3 mm dekota / foreks", "Sert, düz durur, dış mekâna dayanıklı", "Şantiye, fabrika, dış cephe, direk"],
      ["0,50 mm galvaniz sac", "Metal, darbeye ve kırılmaya dayanıklı", "Ağır sanayi, açık saha, yüksek trafikli alan"],
    ],
  },
  baskiTablo: {
    basliklar: ["Baskı tipi", "Ne yapar", "Ne zaman seçilir"],
    satirlar: [
      ["UV baskı", "Güneşe ve neme dayanıklı, solmaz", "Standart iç ve dış mekân kullanımı"],
      ["Reflektif folyo", "Araç farı ve el feneri ışığını geri yansıtır", "Gece çalışılan saha, yol kenarı, otopark"],
      ["Fosforlu lümen folyo", "Karanlıkta kendiliğinden parlar", "Kaçış yolu, acil çıkış, elektrik kesintisinde okunacak levha"],
    ],
  },
  ebatParagraf:
    "Dört standart ebat vardır: 25×35, 35×50, 50×70 ve 70×100 cm. Kaba kural görüş mesafesine göredir: 5 metreye kadar 25×35 cm, 10 metreye kadar 35×50 cm, 20 metreye kadar 50×70 cm, açık saha ve uzak mesafede 70×100 cm. Levha, işaret ettiği tehlikeye yaklaşmadan önce okunacak kadar erken görülmelidir.",
  adetParagraf:
    "Tek adetten 100 adede kadar sipariş verilebilir; 1, 2, 5, 10, 25, 50 ve 100 adet kademelerinde birim fiyat düşer. Ürün sayfasındaki konfigüratörde ebat, malzeme, baskı tipi ve adedi seçtiğinizde KDV dahil tutar anında hesaplanır.",
  teslimat:
    "Levhalar sipariş onayından sonra 2-3 iş gününde üretilir, DHL ile kargoya verilir ve 81 ile 2-4 iş gününde teslim edilir. Toplu iş yeri siparişlerinde farklı levhaları tek sepette birleştirmek kargo maliyetini düşürür; 1.500 ₺ üzeri siparişlerde kargo ücretsizdir.",
  dosya:
    "Katalogdaki levhalar ISO 7010 piktogramları ve yönetmelikteki renk kurallarıyla hazırdır; dosya göndermeniz gerekmez. Firma logosu, özel metin veya farklı dil isteyen işletmeler sipariş notuna yazabilir ya da ücretsiz tasarım desteği talep edebilir.",
};

const sssOrtak = [
  { q: "Levha için hangi malzemeyi seçmeliyim?", a: "İç mekân duvar ve kapılar için 0,50 mm PVC levha veya yapışkanlı etiket yeterlidir. Şantiye, fabrika sahası ve dış cephe gibi hava koşullarına açık yerlerde 3 mm dekota, darbe alan ağır sanayi alanlarında ise 0,50 mm galvaniz sac tercih edilir. Pano kapağı ve makine gövdesi gibi yüzeylere en pratik çözüm yapışkanlı etikettir." },
  { q: "Fosforlu (lümen) ve reflektif baskı arasındaki fark nedir?", a: "Fosforlu lümen folyo gün ışığında enerji depolar ve karanlıkta kendiliğinden parlar; elektrik kesildiğinde okunması gereken kaçış yolu ve acil çıkış levhalarında zorunlu tercihtir. Reflektif folyo kendi ışığını üretmez, üzerine gelen far veya fener ışığını geri yansıtır; gece çalışılan saha, otopark ve yol kenarı için uygundur. Standart UV baskı ise aydınlık ortamlar için yeterlidir." },
  { q: "Levha ebadını neye göre seçmeliyim?", a: "Görüş mesafesine göre. 5 metreye kadar 25×35 cm, 10 metreye kadar 35×50 cm, 20 metreye kadar 50×70 cm, açık saha ve uzak mesafeler için 70×100 cm önerilir. Levha, tehlikeye yaklaşmadan önce okunabilecek kadar erken görülmelidir; emin değilseniz bir üst ebadı seçin." },
  { q: "Tek adet levha sipariş edebilir miyim?", a: "Evet. Tüm İSG levhaları 1 adetten sipariş edilebilir; 2, 5, 10, 25, 50 ve 100 adet kademelerinde birim fiyat düşer. Farklı levhaları aynı sepette birleştirebilir, hepsini tek kargoyla alabilirsiniz." },
  { q: "Levhalar kaç günde teslim edilir?", a: "Sipariş onayından sonra üretim 2-3 iş günü sürer; ardından DHL ile 81 ile 2-4 iş gününde teslim edilir. Denetim tarihi yakınsa sipariş notuna yazın, üretim planı buna göre yapılır." },
];

const ICERIK = {
  "is-guvenligi-uyari-ikaz": {
    seo: {
      title: "Uyarı ve İkaz Levhaları — Sarı Zeminli İSG Tehlike Levhaları, Online Sipariş",
      description:
        "ISO 7010 uyumlu uyarı/ikaz levhaları: dikkat kaygan zemin, yüksek gerilim, tehlikeli madde. 25×35'ten 70×100 cm'ye, sticker/PVC/dekota/sac, tek adetten sipariş.",
    },
    faqs: [
      { q: "Uyarı levhaları neden sarı zeminli ve üçgen?", a: "Sağlık ve Güvenlik İşaretleri Yönetmeliği'ne göre uyarı işaretleri sarı zemin üzerine siyah piktogram ve siyah çerçeveli üçgen biçimindedir. Sarı, insan gözünün en uzaktan ayırt ettiği renklerden biridir; üçgen ise diğer işaret gruplarından (kırmızı daire yasak, mavi daire emredici, yeşil dikdörtgen acil durum) ilk bakışta ayrılmasını sağlar. Renk ve biçim standart olduğu için çalışan levhayı okumadan da 'dikkat' mesajını alır." },
      { q: "İş yerinde hangi uyarı levhaları zorunludur?", a: "Zorunluluk risk değerlendirmesine bağlıdır: iş yerinde hangi tehlike varsa onun işareti bulunmalıdır. En yaygın olanlar kaygan zemin, elektrik tehlikesi, düşme tehlikesi, forklift trafiği, tehlikeli madde ve gürültü uyarılarıdır. Denetimlerde levhanın varlığı kadar doğru yerde ve okunur ebatta olması da kontrol edilir." },
      { q: "Uyarı levhası ile yasaklayıcı levha arasındaki fark nedir?", a: "Uyarı levhası bir tehlikenin varlığını bildirir ('dikkat kaygan zemin'); yasaklayıcı levha bir davranışı yasaklar ('sigara içilmez'). Uyarı sarı üçgen, yasak kırmızı çerçeveli beyaz daire ve çapraz çizgidir. Aynı noktada ikisi birlikte kullanılabilir: örneğin 'dikkat yüksek gerilim' uyarısı ile 'yetkisiz giremez' yasağı." },
      ...sssOrtak,
    ],
    seoBolumler: [
      {
        baslik: "Uyarı ve İkaz Levhası Nedir, Nerede Zorunludur?",
        paragraflar: [
          "Uyarı (ikaz) levhaları bir tehlikenin varlığını çalışana önceden bildirir: kaygan zemin, elektrik çarpması, düşme, forklift geçişi, tehlikeli madde. Sağlık ve Güvenlik İşaretleri Yönetmeliği bu grubu sarı zemin üzerine siyah piktogramlı, siyah çerçeveli üçgen olarak tanımlar; ISO 7010 ise her tehlike için standart piktogramı belirler.",
          "Hangi levhanın gerekli olduğu iş yerinin risk değerlendirmesinden çıkar. Risk analizinde tanımlanan her tehlike noktasına, o tehlikeye yaklaşmadan önce görülecek bir uyarı levhası konur. Katalogdaki 146 uyarı levhası şantiye, fabrika, depo, atölye ve tesis ihtiyaçlarının tamamına yakınını kapsar.",
        ],
      },
      {
        baslik: "En Çok Kullanılan Uyarı Levhaları",
        paragraflar: [
          "Aşağıdaki liste denetimlerde en sık aranan ve en çok sipariş edilen uyarı levhalarını kullanım yerine göre gruplar.",
        ],
        tablo: {
          basliklar: ["Levha", "Kullanım yeri"],
          satirlar: [
            ["Dikkat Kaygan Zemin", "Islak temizlik alanı, giriş holü, mutfak, soğuk hava deposu"],
            ["Dikkat 220 V / 380 V Ölüm Tehlikesi", "Elektrik panosu, trafo odası, kompanzasyon"],
            ["Dikkat Ana Şalter", "Ana dağıtım panosu, makine besleme noktası"],
            ["Dikkat Forklift Çalışıyor", "Depo koridoru, yükleme rampası"],
            ["Dikkat Düşme Tehlikesi", "İskele, çatı, kat boşluğu, açık kuyu"],
            ["Dikkat Tehlikeli Madde", "Kimyasal depo, boyahane, LPG alanı"],
            ["Toplu İş Güvenliği Levhaları", "Tek panoda birden fazla uyarı, iş yeri girişi"],
          ],
        },
      },
      {
        baslik: "Malzeme Seçimi: Sticker, PVC, Dekota, Sac",
        paragraflar: [
          "Aynı levha dört malzemede üretilir; doğru seçim asılacağı yüzeye ve ortama bağlıdır.",
        ],
        tablo: ORTAK.malzemeTablo,
      },
      {
        baslik: "Baskı Tipi ve Ebat",
        paragraflar: [ORTAK.ebatParagraf, "Baskı tipi ortamın ışık koşuluna göre seçilir."],
        tablo: ORTAK.baskiTablo,
      },
      {
        baslik: "Sipariş, Dosya ve Teslimat",
        paragraflar: [ORTAK.adetParagraf, ORTAK.dosya, ORTAK.teslimat],
      },
    ],
  },

  "is-guvenligi-yasaklayici": {
    seo: {
      title: "Yasaklayıcı Levhalar — Kırmızı Daireli İSG Yasak Levhaları, Online Sipariş",
      description:
        "ISO 7010 yasaklayıcı levhalar: sigara içilmez, baretsiz girilmez, yetkisiz giremez. Kırmızı çerçeveli standart tasarım, sticker/PVC/dekota/sac, tek adetten sipariş.",
    },
    faqs: [
      { q: "Yasaklayıcı işaretler hangi renk ve biçimdedir?", a: "Yönetmeliğe göre yasaklayıcı işaretler beyaz zemin üzerine siyah piktogram, kırmızı çerçeve ve sol üstten sağ alta inen kırmızı çapraz çizgili daire biçimindedir. Kırmızının yüzeyin en az %35'ini kaplaması gerekir. Bu düzen sayesinde işaret okunmadan da 'yapma' mesajı anlaşılır." },
      { q: "Sigara içilmez levhası nereye asılmalı?", a: "Kapalı alanların girişine, yanıcı ve parlayıcı madde depolarına, LPG ve akaryakıt alanlarına, üretim sahasında açık alev yasağı olan noktalara. Patlayıcı ortamlar için 'sigara içilmez, açık alev yasaktır' birleşik levhası kullanılır; göz hizasında ve girişten önce görülecek şekilde asılır." },
      { q: "Yasaklayıcı ile emredici levha birlikte kullanılır mı?", a: "Evet, sık sık birlikte kullanılır. Örneğin şantiye girişinde 'baretsiz girilmez' yasağı ile 'baret tak' emri aynı panoda yer alır; biri davranışı yasaklar, diğeri doğru davranışı tarif eder. Toplu iş güvenliği panoları bu birleşimi tek levhada sunar." },
      ...sssOrtak,
    ],
    seoBolumler: [
      {
        baslik: "Yasaklayıcı Levha Nedir, Ne Zaman Kullanılır?",
        paragraflar: [
          "Yasaklayıcı levhalar tehlikeye yol açacak bir davranışı yasaklar: sigara içmek, baretsiz girmek, raflara basmak, yetkisiz alana girmek, cep telefonu kullanmak. Sağlık ve Güvenlik İşaretleri Yönetmeliği bu grubu kırmızı çerçeveli ve çapraz çizgili beyaz daire olarak tanımlar; ISO 7010 her yasağın piktogramını standartlaştırır.",
          "Yasak levhası, yasağın geçerli olduğu alanın girişine ve alan içinde davranışın yapılabileceği noktalara konur. Katalogdaki 89 yasaklayıcı levha şantiye, fabrika, tünel, depo ve ofis kullanımını kapsar; metin ve piktogram birlikte basıldığı için okuma yazma bilmeyen çalışan da mesajı alır.",
        ],
      },
      {
        baslik: "En Çok Kullanılan Yasaklayıcı Levhalar",
        paragraflar: ["Denetimlerde ve toplu siparişlerde en sık istenen yasak levhaları kullanım yerine göre aşağıdadır."],
        tablo: {
          basliklar: ["Levha", "Kullanım yeri"],
          satirlar: [
            ["Sigara İçilmez / Açık Alev Yasaktır", "Kapalı alan girişi, yakıt ve kimyasal depo, LPG alanı"],
            ["Baretsiz Girilmez", "Şantiye ve tünel girişi, montaj sahası"],
            ["Yetkisiz Kişi Giremez", "Elektrik odası, makine dairesi, laboratuvar"],
            ["Raflara Basmak Yasaktır", "Depo ve arşiv rafları"],
            ["Yükün Altında Durmak Yasaktır", "Vinç ve forklift çalışma alanı"],
            ["Çalışma Yerinden Habersiz Ayrılmak Yasaktır", "Üretim hattı, vardiya alanı"],
          ],
        },
      },
      {
        baslik: "Malzeme Seçimi: Sticker, PVC, Dekota, Sac",
        paragraflar: ["Aynı levha dört malzemede üretilir; doğru seçim asılacağı yüzeye ve ortama bağlıdır."],
        tablo: ORTAK.malzemeTablo,
      },
      {
        baslik: "Baskı Tipi ve Ebat",
        paragraflar: [ORTAK.ebatParagraf, "Baskı tipi ortamın ışık koşuluna göre seçilir."],
        tablo: ORTAK.baskiTablo,
      },
      {
        baslik: "Sipariş, Dosya ve Teslimat",
        paragraflar: [ORTAK.adetParagraf, ORTAK.dosya, ORTAK.teslimat],
      },
    ],
  },

  "is-guvenligi-emredici-kkd": {
    seo: {
      title: "Emredici Levhalar ve KKD İşaretleri — Mavi Zeminli İSG Levhaları, Online Sipariş",
      description:
        "ISO 7010 emredici levhalar: baret tak, gözlük kullan, emniyet kemeri bağla. Mavi daire standart tasarım, 25×35'ten 70×100 cm'ye, sticker/PVC/dekota/sac, tek adetten sipariş.",
    },
    faqs: [
      { q: "Emredici işaret rengi nedir, neden mavi?", a: "Yönetmeliğe göre emredici işaretler mavi zemin üzerine beyaz piktogramlı daire biçimindedir ve mavi yüzeyin en az %50'sini kaplar. Mavi, uyarı (sarı), yasak (kırmızı) ve acil durum (yeşil) renklerinden net ayrıldığı için 'yapılması zorunlu' mesajı diğerleriyle karışmaz. KKD levhalarının tamamı bu gruptadır." },
      { q: "KKD levhası nedir?", a: "Kişisel koruyucu donanım kullanımını zorunlu kılan emredici levhadır: baret, gözlük, kulaklık, eldiven, maske, emniyet kemeri, iş ayakkabısı. Çalışanın hangi donanımı takması gerektiğini alanın girişinde bildirir; birden fazla donanım gerekiyorsa 'baret, gözlük ve kulaklık tak' gibi birleşik levhalar kullanılır." },
      { q: "Emredici levha nereye asılır?", a: "Zorunluluğun başladığı alanın girişine, göz hizasında ve alana girmeden görülecek şekilde. Makine başında çalışılan noktalarda makinenin üzerine ya da hemen yanına; şantiyede kapı ve turnike girişine. Toplu iş güvenliği panosunda yasak ve uyarılarla birlikte de kullanılır." },
      ...sssOrtak,
    ],
    seoBolumler: [
      {
        baslik: "Emredici Levha Nedir, KKD İşaretleri Neden Zorunlu?",
        paragraflar: [
          "Emredici levhalar belirli bir davranışı zorunlu kılar; büyük çoğunluğu kişisel koruyucu donanım (KKD) kullanımıyla ilgilidir: baret tak, koruyucu gözlük kullan, kulaklık tak, emniyet kemerini bağla, iş elbisesi giy. Sağlık ve Güvenlik İşaretleri Yönetmeliği bu grubu mavi zemin üzerine beyaz piktogramlı daire olarak tanımlar.",
          "Risk değerlendirmesinde KKD gerektiren her alan için o donanımın emredici levhası girişe asılır. Katalogdaki 95 emredici levha tek donanımlı ve birleşik (iki-üç donanım) seçenekleri kapsar; metinli tasarım sayesinde hangi donanımın kastedildiği tereddütsüz anlaşılır.",
        ],
      },
      {
        baslik: "En Çok Kullanılan Emredici ve KKD Levhaları",
        paragraflar: ["Sektöre göre en sık istenen emredici levhalar aşağıdadır."],
        tablo: {
          basliklar: ["Levha", "Kullanım yeri"],
          satirlar: [
            ["Baret Tak", "Şantiye, montaj, yükleme sahası"],
            ["Baret, Gözlük ve Kulaklık Tak", "Metal işleme, kesim ve taşlama hattı"],
            ["Emniyet Kemerini Kullan", "Yüksekte çalışma, iskele, çatı"],
            ["Toz Gözlüğü / Yüz Siperi Kullan", "Taşlama, kaynak, kimyasal dolum"],
            ["İş Elbisesi Giy", "Üretim hattı girişi, laboratuvar"],
            ["Maske Tak", "Boyahane, tozlu ortam, kimyasal alan"],
            ["Eldiven Kullan", "Kesici alet, sıcak yüzey, kimyasal temas"],
          ],
        },
      },
      {
        baslik: "Malzeme Seçimi: Sticker, PVC, Dekota, Sac",
        paragraflar: ["Aynı levha dört malzemede üretilir; doğru seçim asılacağı yüzeye ve ortama bağlıdır."],
        tablo: ORTAK.malzemeTablo,
      },
      {
        baslik: "Baskı Tipi ve Ebat",
        paragraflar: [ORTAK.ebatParagraf, "Baskı tipi ortamın ışık koşuluna göre seçilir."],
        tablo: ORTAK.baskiTablo,
      },
      {
        baslik: "Sipariş, Dosya ve Teslimat",
        paragraflar: [ORTAK.adetParagraf, ORTAK.dosya, ORTAK.teslimat],
      },
    ],
  },

  "is-guvenligi-acil-ilk-yardim": {
    seo: {
      title: "Acil Çıkış, Kaçış Yolu ve İlk Yardım Levhaları — Yeşil Zeminli, Fotolümenli Seçenek",
      description:
        "Acil çıkış, toplanma alanı ve ilk yardım levhaları: yeşil zemin, ISO 7010 piktogram, karanlıkta parlayan fotolümenli seçenek ve yer laminasyonlu kaçış okları.",
    },
    faqs: [
      { q: "İlk yardım dolabı işareti hangi renk ile tanımlanır?", a: "Yeşil. Yönetmeliğe göre ilk yardım, acil çıkış ve kaçış yolu işaretleri yeşil zemin üzerine beyaz piktogramlı dikdörtgen veya kare biçimindedir; yeşil yüzeyin en az %50'sini kaplar. İlk yardım dolabının üzerine beyaz artı işaretli yeşil levha asılır; kırmızı artı sağlık kuruluşları için kullanılır, iş yerinde ilk yardım işareti için yeşil zorunludur." },
      { q: "Acil çıkış levhası fotolümenli olmak zorunda mı?", a: "Elektrik kesildiğinde kaçış yolunun görülebilmesi gerekir; bu ya acil aydınlatmayla ya da karanlıkta kendiliğinden parlayan fotolümenli levhayla sağlanır. Acil aydınlatma sistemi olmayan veya yetersiz olan binalarda fotolümenli acil çıkış ve kaçış yolu levhaları en pratik çözümdür. Yönetmelik işaretlerin her koşulda görünür olmasını ister." },
      { q: "Yer laminasyonlu kaçış işareti nedir?", a: "Zemine yapıştırılan, üzerine basılmaya ve temizliğe dayanıklı laminasyonlu ok işaretleridir. Dumanlı ortamda insan eğilerek ilerlediği için zemindeki fotolümenli oklar duvardaki levhalardan daha erken fark edilir; AVM, otel, hastane ve fabrika koridorlarında duvar levhalarını tamamlar." },
      ...sssOrtak,
    ],
    seoBolumler: [
      {
        baslik: "Acil Durum ve İlk Yardım Levhaları Nedir?",
        paragraflar: [
          "Bu grup tehlike anında güvenli davranışı gösterir: acil çıkış, kaçış yolu okları, toplanma alanı, ilk yardım dolabı, göz duşu, acil telefon. Sağlık ve Güvenlik İşaretleri Yönetmeliği bu işaretleri yeşil zemin üzerine beyaz piktogramlı dikdörtgen olarak tanımlar; yeşil, güvenli yön ve yardım anlamına gelir.",
          "Kaçış yolu işaretlemesi bir zincirdir: her çıkışta, her yön değişiminde ve koridorun görüş mesafesi bittiği her noktada bir işaret bulunmalıdır. Katalogdaki 95 ürün duvar levhalarını, fotolümenli seçenekleri ve zemine yapıştırılan yer laminasyonlu okları kapsar.",
        ],
      },
      {
        baslik: "Kaçış Yolu Planlaması: Hangi İşaret Nereye?",
        paragraflar: ["Aşağıdaki tablo bir kaçış yolunun tipik noktalarını ve gerekli işaretleri eşleştirir."],
        tablo: {
          basliklar: ["Nokta", "İşaret", "Öneri"],
          satirlar: [
            ["Çıkış kapısı üstü", "Acil Çıkış (koşan adam + kapı)", "Fotolümenli, 35×50 cm"],
            ["Koridor yön değişimi", "Acil Çıkış sağ / sol / ileri ok", "Fotolümenli; uzun koridorda her 10-15 m"],
            ["Zemin (dumanlı ortam)", "Yer laminasyonlu lümen ok", "Duvar levhalarına ek, kapı önlerinde"],
            ["Merdiven sahanlığı", "Acil Çıkış aşağı / yukarı ok", "Her katta tekrar"],
            ["Bina dışı", "Toplanma Alanı", "Dekota veya sac, 50×70 cm ve üzeri"],
            ["Revir, üretim alanı", "İlk Yardım Dolabı, Göz Duşu, Sedye", "Dolabın hemen üstü, göz hizası"],
          ],
        },
      },
      {
        baslik: "Fotolümenli Levha Nasıl Çalışır?",
        paragraflar: [
          "Fotolümenli (lümen) folyo gün ışığı veya ortam aydınlatmasından enerji depolar, ışık kesildiğinde bu enerjiyi yeşilimsi parıltı olarak geri verir. Kendi enerji kaynağı ve kablosu yoktur, bakım gerektirmez; şarj olması için gün içinde aydınlık ortamda bulunması yeterlidir. Dumanlı ve karanlık koridorda kaçış yönünü göstermenin en güvenilir pasif yöntemidir.",
          "Katalogda fotolümenli seçenek hem duvar levhalarında hem yer laminasyonlu oklarda sunulur. Elektrik kesintisinde okunması gereken tüm işaretlerde bu seçeneği işaretleyin.",
        ],
      },
      {
        baslik: "Malzeme, Baskı ve Ebat",
        paragraflar: ["Aynı levha dört malzemede üretilir; doğru seçim asılacağı yüzeye bağlıdır.", ORTAK.ebatParagraf],
        tablo: ORTAK.malzemeTablo,
      },
      {
        baslik: "Sipariş, Dosya ve Teslimat",
        paragraflar: [ORTAK.adetParagraf, ORTAK.dosya, ORTAK.teslimat],
      },
    ],
  },

  "is-guvenligi-yangin": {
    seo: {
      title: "Yangın Levhaları — Yangın Söndürücü, Dolap, Alarm İşaretleri, Online Sipariş",
      description:
        "Yangın levhaları: yangın söndürücü, dolap, hortum ve alarm butonu işaretleri, fotolümenli seçenek. Kırmızı zemin ISO 7010 tasarım, sticker/PVC/dekota/sac, tek adetten sipariş.",
    },
    faqs: [
      { q: "Yangın levhaları hangi renktir?", a: "Yangınla mücadele ekipmanını gösteren işaretler kırmızı zemin üzerine beyaz piktogramlı dikdörtgen veya karedir; kırmızı yüzeyin en az %50'sini kaplar. Yasaklayıcı işaretlerdeki kırmızıdan biçimle ayrılır: yasak daire ve çapraz çizgi, yangın ekipmanı dikdörtgen." },
      { q: "Yangın söndürücü levhası nereye asılır?", a: "Söndürücünün hemen üstüne, uzaktan görülecek yükseklikte. Söndürücü bir köşede veya kolon arkasında kalıyorsa yönlendirme oklu levha koridora da asılır. Levha söndürücünün tipini de belirtebilir: köpüklü, karbondioksitli, kuru kimyevi tozlu; hangi yangın sınıfında kullanılacağı üzerinde yazar." },
      { q: "Yangın alarmı ve ihbar butonu levhası zorunlu mu?", a: "Yangın ihbar noktaları görünür biçimde işaretlenmelidir; buton duvar rengiyle karışıyorsa ya da uzaktan seçilmiyorsa levha gerekir. Fotolümenli alarm levhası elektrik kesildiğinde de butonun yerini gösterir; kaçış yolu üzerindeki ihbar noktalarında bu seçenek önerilir." },
      ...sssOrtak,
    ],
    seoBolumler: [
      {
        baslik: "Yangınla Mücadele Levhaları Nedir?",
        paragraflar: [
          "Bu grup yangın anında kullanılacak ekipmanın yerini gösterir: yangın söndürücü, yangın dolabı, hortum, alarm butonu, yangın merdiveni, yangın kovası. Sağlık ve Güvenlik İşaretleri Yönetmeliği bu işaretleri kırmızı zemin üzerine beyaz piktogramlı dikdörtgen olarak tanımlar.",
          "Levhanın görevi ekipmanı panik anında saniyeler içinde buldurmaktır; bu yüzden ekipmanın tam üstüne ve koridordan görülecek yüksekliğe asılır. Katalogdaki 24 ürün söndürücü tiplerine göre kullanım alanı levhalarını, dolap ve hortum işaretlerini ve fotolümenli alarm levhalarını kapsar.",
        ],
      },
      {
        baslik: "Söndürücü Tipine Göre Levha Seçimi",
        paragraflar: ["Söndürücünün tipi hangi yangın sınıfında kullanılacağını belirler; levha bunu çalışana önceden bildirir."],
        tablo: {
          basliklar: ["Söndürücü tipi", "Uygun yangın sınıfı", "Tipik yer"],
          satirlar: [
            ["Kuru kimyevi tozlu (ABC)", "Katı, sıvı ve gaz yangınları", "Genel amaçlı, koridor, üretim alanı"],
            ["Köpüklü", "Katı ve sıvı (akaryakıt, boya) yangınları", "Yakıt deposu, boyahane, otopark"],
            ["Karbondioksitli (CO₂)", "Elektrik ve elektronik yangınları", "Pano odası, sunucu odası, laboratuvar"],
            ["Halokarbon", "Hassas elektronik, arşiv", "Veri merkezi, arşiv, kontrol odası"],
          ],
        },
      },
      {
        baslik: "Yangın Levhaları Nereye Asılır?",
        paragraflar: [
          "Söndürücü ve dolap levhaları ekipmanın tam üstüne, zeminden yaklaşık 2 metre yüksekliğe asılır; koridor boyunca bakıldığında görünmesi gerekir. Ekipman köşede kalıyorsa yönlendirme oklu bir ikinci levha koridora eklenir. Alarm butonu levhası butonun hemen yanına, göz hizasına konur.",
          "Elektrik kesintisinde de görülmesi gereken alarm ve söndürücü işaretlerinde fotolümenli seçeneği işaretleyin; karanlıkta kendiliğinden parlar ve kaçış yolu levhalarıyla aynı mantıkla çalışır.",
        ],
      },
      {
        baslik: "Malzeme, Baskı ve Ebat",
        paragraflar: ["Aynı levha dört malzemede üretilir; doğru seçim asılacağı yüzeye bağlıdır.", ORTAK.ebatParagraf],
        tablo: ORTAK.malzemeTablo,
      },
      {
        baslik: "Sipariş, Dosya ve Teslimat",
        paragraflar: [ORTAK.adetParagraf, ORTAK.dosya, ORTAK.teslimat],
      },
    ],
  },

  "is-guvenligi-elektrik-voltaj": {
    seo: {
      title: "Elektrik ve Yüksek Gerilim Levhaları — 220V, 380V, 10,5 kV, 66 kV Uyarıları",
      description:
        "Elektrik tehlikesi levhaları: yüksek gerilim ölüm tehlikesi, pano kapağını kapalı tut, elektrik odası girilmez, kV tehlike levhaları. Sticker/PVC/dekota/sac seçenekleri.",
    },
    faqs: [
      { q: "Elektrik panosuna hangi uyarı levhası asılmalı?", a: "Panonun gerilim seviyesine uygun 'dikkat 220 V' veya 'dikkat 380 V ölüm tehlikesi' uyarısı ve 'pano kapaklarını kapalı tut' talimatı standart ikilidir. Yetkisiz müdahaleyi önlemek için 'elektrik odası girilmez' yasağı ve arıza durumunda 'izoleli takım kullan' emredici levhası eklenir. Pano kapağına yapışkanlı etiket en pratik çözümdür." },
      { q: "kV tehlike levhaları hangi tesislerde kullanılır?", a: "10,5 kV, 33 kV ve 66 kV gibi gerilim değerli levhalar trafo merkezleri, enerji nakil hattı direkleri, OG hücreleri ve GES-RES sahalarında kullanılır. Levha gerilim seviyesini açıkça yazar; dış mekânda dekota veya galvaniz sac, direk üzerinde ise reflektif baskı tercih edilir." },
      { q: "Yüksek gerilim levhası hangi renkte olmalı?", a: "Elektrik tehlikesi bir uyarı işaretidir: sarı zemin üzerine siyah şimşek piktogramlı üçgen. Metin (ölüm tehlikesi, yüksek gerilim, kV değeri) piktogramın altına eklenir. Yasaklayıcı içerik taşıyan 'elektrik odası girilmez' ise kırmızı daireli yasak levhası olarak üretilir." },
      ...sssOrtak,
    ],
    seoBolumler: [
      {
        baslik: "Elektrik Tehlikesi Levhaları Nedir, Nerede Zorunludur?",
        paragraflar: [
          "Elektrik çarpması iş kazalarının en ölümcül türlerindendir; bu yüzden gerilim taşıyan her nokta işaretlenir: dağıtım panoları, trafo odaları, kompanzasyon panoları, kablo kanalları, enerji nakil hatları, jeneratör ve UPS odaları. Levhalar sarı zeminli şimşek piktogramıyla uyarır, gerekirse gerilim değerini (220 V, 380 V, 10,5 kV, 66 kV) açıkça yazar.",
          "Katalogdaki 55 ürün pano etiketlerinden trafo merkezi levhalarına kadar tüm gerilim seviyelerini kapsar. Sac ve dekota seçenekleri dış mekân direk ve çit uygulamaları için, yapışkanlı etiket pano kapakları için tasarlanmıştır.",
        ],
      },
      {
        baslik: "Gerilim Seviyesine Göre Levha Seçimi",
        paragraflar: ["Tesisin gerilim seviyesi hangi levhanın gerekli olduğunu belirler."],
        tablo: {
          basliklar: ["Gerilim / nokta", "Levha", "Önerilen malzeme"],
          satirlar: [
            ["220 V pano, priz hattı", "Dikkat 220 V Ölüm Tehlikesi", "Yapışkanlı etiket"],
            ["380 V dağıtım panosu, makine besleme", "Dikkat 380 V Ölüm Tehlikesi + Pano Kapaklarını Kapalı Tut", "Yapışkanlı etiket veya PVC"],
            ["Ana şalter", "Dikkat Ana Şalter", "PVC levha"],
            ["Trafo odası, OG hücresi", "Elektrik Odası Girilmez + Yüksek Voltaj Ölüm Tehlikesi", "3 mm dekota"],
            ["10,5 kV – 66 kV hat ve direk", "kV değerli Tehlike Levhası", "Galvaniz sac, reflektif baskı"],
            ["Bakım ve arıza noktası", "Elektrik Arızalarında İzoleli Takım Kullan", "PVC levha"],
          ],
        },
      },
      {
        baslik: "Malzeme Seçimi: Sticker, PVC, Dekota, Sac",
        paragraflar: ["Aynı levha dört malzemede üretilir; doğru seçim asılacağı yüzeye ve ortama bağlıdır."],
        tablo: ORTAK.malzemeTablo,
      },
      {
        baslik: "Baskı Tipi ve Ebat",
        paragraflar: [ORTAK.ebatParagraf, "Gece bakım yapılan direk ve saha noktalarında reflektif baskı, pano odalarında UV baskı yeterlidir."],
        tablo: ORTAK.baskiTablo,
      },
      {
        baslik: "Sipariş, Dosya ve Teslimat",
        paragraflar: [ORTAK.adetParagraf, ORTAK.dosya, ORTAK.teslimat],
      },
    ],
  },

  "is-guvenligi-kalite-kontrol": {
    seo: {
      title: "Kalite Kontrol Etiketleri — Onaylandı, Test Edildi, Red, Karantina Etiketleri",
      description:
        "Üretim ve depo için kalite kontrol etiketleri: onaylandı, test edildi, red, karantina, vinç ve ekipman kontrol etiketleri. Yapışkanlı, renk kodlu, tek adetten sipariş.",
    },
    faqs: [
      { q: "Kalite kontrol etiketleri hangi renk kodlarını kullanır?", a: "Yaygın uygulama yeşil 'onaylandı / kontrol edildi', kırmızı 'red / kullanılmaz', sarı 'karantina / bekliyor' ve mavi 'test edildi' biçimindedir. Renk, etiket okunmadan durumun anlaşılmasını sağlar; ISO 9001 kalite yönetim sistemlerinde ürün ve ekipman durumunun izlenebilirliği için kullanılır." },
      { q: "Vinç ve ekipman kontrol etiketi ne işe yarar?", a: "Kaldırma ekipmanlarının (vinç, caraskal, sapan) periyodik kontrolden geçtiğini ve bir sonraki kontrol tarihini gösterir. Etiketin üzerine kontrol tarihi ve kontrolü yapan kişi elle yazılır; bu yüzden yazılabilir yüzeyli seçenek tercih edilir. Denetimlerde ekipmanın üzerinde güncel etiket olması istenir." },
      { q: "Karantina etiketi ne zaman kullanılır?", a: "Uygunsuz ürün ya da henüz muayene edilmemiş malzeme, kararı verilene kadar karantina alanında tutulur ve sarı karantina etiketiyle işaretlenir. Etiket ürünün yanlışlıkla sevkiyata veya üretime karışmasını önler; karar verildiğinde onay ya da red etiketiyle değiştirilir." },
      ...sssOrtak,
    ],
    seoBolumler: [
      {
        baslik: "Kalite Kontrol Etiketi Nedir?",
        paragraflar: [
          "Kalite kontrol etiketleri bir ürünün, partinin veya ekipmanın muayene durumunu üzerine yapıştırılan renk kodlu etiketle gösterir: onaylandı, test edildi, red, karantina, kontrol edildi. ISO 9001 sistemlerinde ürün durumunun tanımlanması ve izlenebilirlik şartı bu etiketlerle karşılanır.",
          "Katalogdaki 59 ürün üretim hattı, depo, laboratuvar ve kaldırma ekipmanı ihtiyaçlarını kapsar: onay ve red etiketleri, karantina etiketleri, vinç ve caraskal kontrol etiketleri, L1-L2-L3 faz etiketleri, toksik madde ve gerilim uyarı etiketleri.",
        ],
      },
      {
        baslik: "Renk Kodu ve Kullanım",
        paragraflar: ["Renk, etiketin okunmadan anlaşılmasını sağlar. Yaygın uygulama aşağıdaki gibidir."],
        tablo: {
          basliklar: ["Etiket", "Renk", "Ne zaman yapıştırılır"],
          satirlar: [
            ["Onaylandı / Kontrol Edildi", "Yeşil", "Muayeneden geçen ürün ve ekipman"],
            ["Test Edildi", "Mavi", "Fonksiyon testi tamamlanan parça"],
            ["Karantina / Bekliyor", "Sarı", "Karar bekleyen veya muayene edilmemiş malzeme"],
            ["Red / Kullanılmaz", "Kırmızı", "Uygunsuz ürün, arızalı ekipman"],
            ["Vinç / Ekipman Kontrol", "Yeşil veya beyaz, yazılabilir", "Periyodik kontrol tarihi ve imza için"],
            ["L1 / L2 / L3 Faz", "Kahverengi / siyah / gri", "Pano içi kablo ve bara işaretleme"],
          ],
        },
      },
      {
        baslik: "Malzeme ve Ebat",
        paragraflar: [
          "Kalite kontrol etiketleri çoğunlukla yapışkanlı etiket olarak kullanılır; ürün ambalajına, palete veya ekipman gövdesine yapıştırılır. Sabit istasyonlara asılacak durum panoları için PVC levha ve dekota seçenekleri de vardır. Elle tarih ve imza yazılacak etiketlerde selefonsuz, yazılabilir yüzey tercih edilir.",
          ORTAK.ebatParagraf,
        ],
        tablo: ORTAK.malzemeTablo,
      },
      {
        baslik: "Sipariş, Dosya ve Teslimat",
        paragraflar: [ORTAK.adetParagraf, "Firma adı, form numarası veya farklı metin isteyen işletmeler sipariş notuna yazabilir; kalite sisteminizin dokümanına uygun özel etiket için ücretsiz tasarım desteği talep edin.", ORTAK.teslimat],
      },
    ],
  },

  "is-guvenligi-trafik-saha": {
    seo: {
      title: "Trafik, Saha ve Otopark Levhaları — Forklift, Hız, Yaya Yolu İşaretleri",
      description:
        "Saha içi trafik ve otopark levhaları: forklift çalışıyor, hız sınırı, yaya giremez, kamyon takozu, vinç yükü altında durma. Dekota/sac, reflektif seçenek, tek adetten sipariş.",
    },
    faqs: [
      { q: "Fabrika sahasında hangi trafik levhaları gerekir?", a: "Araç ve yaya yollarının ayrıldığı her noktada yaya yolu ve araç yolu işaretleri, depo ve rampa çevresinde 'dikkat forklift çalışıyor', saha girişinde hız sınırı, yükleme alanında 'kamyon takozu' ve 'güvenlik önlemi almadan yükleme yapma' talimatları temel settir. Vinç ve kaldırma alanlarında 'yükün altında durma' uyarısı eklenir." },
      { q: "Otopark ve saha levhalarında reflektif baskı gerekli mi?", a: "Gece çalışılan veya araç trafiğinin olduğu açık alanlarda evet. Reflektif folyo far ışığını geri yansıttığı için levha karanlıkta da okunur; yol kenarı, otopark girişi ve rampa levhalarında bu seçenek önerilir. Kapalı ve aydınlık depolarda standart UV baskı yeterlidir." },
      { q: "Saha levhası için dekota mı sac mı?", a: "Direğe veya çite monte edilecek, araç ve forklift trafiğine yakın levhalarda 0,50 mm galvaniz sac darbeye daha dayanıklıdır. Duvara veya korunaklı noktaya asılacak levhalarda 3 mm dekota yeterlidir ve daha ekonomiktir. İkisi de dış mekân UV baskıyla üretilir." },
      ...sssOrtak,
    ],
    seoBolumler: [
      {
        baslik: "Saha İçi Trafik Levhaları Neden Gerekli?",
        paragraflar: [
          "Fabrika, depo, liman ve şantiye sahalarında forklift, kamyon ve yaya aynı alanı paylaşır; iş kazalarının önemli bir kısmı bu kesişimlerde olur. Saha içi trafik levhaları araç ve yaya yollarını ayırır, hız sınırını bildirir, yükleme ve kaldırma alanlarındaki tehlikeleri işaretler.",
          "Katalogdaki 45 ürün forklift ve vinç uyarılarını, hız ve yön levhalarını, otopark işaretlerini ve yükleme talimatlarını kapsar. Dış mekân kullanımı için dekota, galvaniz sac ve reflektif baskı seçenekleri vardır.",
        ],
      },
      {
        baslik: "Saha Noktasına Göre Levha Seçimi",
        paragraflar: ["Aşağıdaki tablo tipik saha noktalarını ve gerekli levhaları eşleştirir."],
        tablo: {
          basliklar: ["Nokta", "Levha", "Öneri"],
          satirlar: [
            ["Saha girişi", "Hız Sınırı, Giriş Yönü", "Galvaniz sac, reflektif, 50×70 cm"],
            ["Depo koridoru", "Dikkat Forklift Çalışıyor, Yaya Yolu", "Dekota, 35×50 cm"],
            ["Yükleme rampası", "Kamyon Takozu, Güvenlik Önlemi Almadan Yükleme Yapma", "Dekota veya sac, 50×70 cm"],
            ["Vinç çalışma alanı", "Yükün Altında Durma, Vinci Operatör Dışında Kimse Kullanamaz", "Dekota, 35×50 cm"],
            ["Yaya geçişi", "Yayaların Girmesi Yasaktır / Yaya Yolu", "Dekota, 25×35 – 35×50 cm"],
            ["Otopark", "Otopark, Yön Okları, Engelli Park Yeri", "Sac, reflektif"],
          ],
        },
      },
      {
        baslik: "Malzeme Seçimi: Sticker, PVC, Dekota, Sac",
        paragraflar: ["Saha levhaları çoğunlukla dış mekânda ve araç trafiğine yakın kullanıldığı için dekota ve galvaniz sac öne çıkar."],
        tablo: ORTAK.malzemeTablo,
      },
      {
        baslik: "Baskı Tipi ve Ebat",
        paragraflar: [ORTAK.ebatParagraf, "Araç trafiği olan açık alanlarda reflektif baskı seçin; far ışığında okunur."],
        tablo: ORTAK.baskiTablo,
      },
      {
        baslik: "Sipariş, Dosya ve Teslimat",
        paragraflar: [ORTAK.adetParagraf, ORTAK.dosya, ORTAK.teslimat],
      },
    ],
  },

  "is-guvenligi-ges": {
    seo: {
      title: "GES Levhaları — Güneş Enerjisi Santrali Uyarı ve Topraklama İşaretleri",
      description:
        "GES levhaları: topraklama işareti, PV sistem AC/DC ayırıcı, evirici müdahale uyarısı, yetkili personel ve kamera levhaları. Dış mekân dekota/sac, tek adetten sipariş.",
    },
    faqs: [
      { q: "Topraklama işareti nedir, GES'te nereye konur?", a: "Topraklama sembolü, üç yatay çizgiden oluşan ve dikey bir hatla bağlanan IEC 60417 işaretidir; topraklama bağlantı noktasını gösterir. GES'te panel konstrüksiyonu, evirici gövdesi, AC-DC panoları ve topraklama barasının bulunduğu her noktaya topraklama etiketi yapıştırılır; denetimde topraklama sürekliliği ile birlikte işaretleme de kontrol edilir." },
      { q: "PV sistem AC ayırıcı levhası neden zorunlu?", a: "Güneş panelleri gün ışığında sürekli gerilim ürettiği için şebeke kesilse bile sistemin DC tarafı enerjilidir. Müdahale edecek personelin ve itfaiyenin ana AC ve DC ayırıcıların yerini hemen bulması gerekir; bu levhalar ayırıcı noktalarını ve sistemin enerjili olabileceğini bildirir." },
      { q: "GES levhaları hangi malzemeden olmalı?", a: "GES sahaları açık alandır ve yıl boyu güneş, rüzgâr ve yağmur alır. Direk, çit ve konstrüksiyona monte edilecek levhalarda 3 mm dekota veya 0,50 mm galvaniz sac ile UV baskı tercih edilir; evirici ve pano üzerine yapışkanlı etiket kullanılır. Gece bakım yapılan sahalarda reflektif baskı eklenir." },
      ...sssOrtak,
    ],
    seoBolumler: [
      {
        baslik: "GES Levhaları Nedir, Neden Ayrı Bir Set Gerekir?",
        paragraflar: [
          "Güneş enerjisi santrali, gün ışığında kendiliğinden enerji üreten bir tesistir; şebekeden ayrılsa bile DC tarafı enerjili kalır. Bu yüzden GES'lerde standart elektrik levhalarına ek olarak PV sisteme özgü uyarılar gerekir: AC ve DC ayırıcı konumları, evirici müdahale uyarısı, topraklama işaretleri, yetkili personel ve kamera bilgilendirmesi.",
          "Katalogdaki 24 ürün çatı GES'inden arazi santraline kadar gerekli seti kapsar. Dış mekân dayanımı için dekota ve galvaniz sac, pano ve evirici gövdesi için yapışkanlı etiket seçenekleri vardır.",
        ],
      },
      {
        baslik: "GES Sahasında Levha Yerleşimi",
        paragraflar: ["Aşağıdaki tablo tipik GES noktalarını ve gerekli işaretleri eşleştirir."],
        tablo: {
          basliklar: ["Nokta", "Levha", "Öneri"],
          satirlar: [
            ["Saha girişi ve çit", "Yetkilendirilmiş Personel Dışında Girilmez, Kamera Sistemi Uyarısı", "Galvaniz sac, 50×70 cm"],
            ["AC ana pano", "PV Sistem Ana AC Ayırıcı", "Yapışkanlı etiket veya PVC"],
            ["DC toplama kutusu", "Dikkat DC Gerilim, PV Sistem DC Ayırıcı", "Yapışkanlı etiket"],
            ["Evirici (inverter)", "Evirici Müdahale Uyarısı", "Yapışkanlı etiket"],
            ["Panel konstrüksiyonu, topraklama barası", "Topraklama Etiketi / Topraklama İşareti", "Yapışkanlı etiket, dış mekân UV"],
            ["Kontrol edilen ekipman", "Kontrol Edildi Sticker (yeşil)", "Yazılabilir etiket"],
          ],
        },
      },
      {
        baslik: "Topraklama İşareti: Sembol ve Kullanım",
        paragraflar: [
          "Topraklama sembolü IEC 60417 standardında tanımlanır: bir dikey hat ve altında gittikçe kısalan üç yatay çizgi. Elektrik tesisatında topraklama iletkeninin bağlandığı noktayı gösterir. GES'te panel çerçeveleri, konstrüksiyon, evirici gövdesi ve pano toprak baraları ayrı ayrı topraklandığı için her bağlantı noktasına etiket yapıştırılır.",
          "Katalogdaki topraklama etiketleri yapışkanlı, UV dayanımlı folyodan üretilir ve tek adetten 100 adede kadar sipariş edilebilir; santral genelinde tek seferde işaretleme için 25, 50 ve 100 adet kademeleri birim fiyatı düşürür.",
        ],
      },
      {
        baslik: "Malzeme, Baskı ve Ebat",
        paragraflar: ["GES levhaları açık alanda kullanıldığı için dış mekân malzemeleri öne çıkar.", ORTAK.ebatParagraf],
        tablo: ORTAK.malzemeTablo,
      },
      {
        baslik: "Sipariş, Dosya ve Teslimat",
        paragraflar: [ORTAK.adetParagraf, "Santral adı, kurulu güç veya işletmeci bilgisi eklenmesini isteyen firmalar sipariş notuna yazabilir; özel levha için ücretsiz tasarım desteği talep edin.", ORTAK.teslimat],
      },
    ],
  },

  "is-guvenligi-bilgilendirme-talimat": {
    seo: {
      title: "Bilgilendirme ve Talimat Levhaları — İş Yeri Talimatları, Kamera, Genel İSG Levhaları",
      description:
        "İş yeri talimat ve bilgilendirme levhaları: yangın talimatı, kamera uyarısı, tehlikeli madde bilgisi, çalışma kuralları. Sticker/PVC/dekota/sac, tek adetten sipariş.",
    },
    faqs: [
      { q: "Talimat levhası ile uyarı levhası arasındaki fark nedir?", a: "Uyarı levhası tek bir tehlikeyi piktogramla bildirir; talimat levhası bir işin nasıl yapılacağını ya da nelere dikkat edileceğini metinle anlatır: 'yangında boşalan söndürücüleri yerine asma', 'yangına karşı önlem almadan kaynak yapma'. Talimatlar genellikle daha büyük ebatta, metin ağırlıklı ve iş istasyonunun yanına asılır." },
      { q: "Kamera ile izlenmektedir levhası zorunlu mu?", a: "Kişisel Verilerin Korunması Kanunu kapsamında kamerayla izlenen alanlarda kişilerin bilgilendirilmesi gerekir; giriş noktalarına 'bu alan kamera ile izlenmektedir' levhası asılmalıdır. Levhada veri sorumlusunun adı ve aydınlatma metnine yönlendirme bulunması tavsiye edilir." },
      { q: "Tehlikeli madde bilgilendirme levhası ne içerir?", a: "Depolanan maddenin tehlike sınıfını (zararlı, tahriş edici, yanıcı, aşındırıcı) piktogramla ve metinle bildirir. Kimyasal depo, boyahane ve laboratuvar girişlerine asılır; güvenlik bilgi formunda (SDS) belirtilen tehlike işaretleriyle uyumlu olmalıdır." },
      ...sssOrtak,
    ],
    seoBolumler: [
      {
        baslik: "Bilgilendirme ve Talimat Levhası Nedir?",
        paragraflar: [
          "Bilgilendirme ve talimat levhaları çalışana kural, yöntem ve genel bilgi aktarır: yangın talimatı, kaynak ve kesme öncesi önlemler, söndürücülerin yerini değiştirmeme, kamera ile izleme bildirimi, tehlikeli madde bilgisi, iş yeri çalışma kuralları. Piktogram ağırlıklı uyarı levhalarından farklı olarak metin ağırlıklıdır.",
          "Katalogdaki 96 ürün yangın güvenliği talimatlarından KVKK kamera levhalarına, tehlikeli madde bilgilendirmelerinden genel iş güvenliği kurallarına kadar geniş bir alanı kapsar. Toplu iş yeri panoları için birden fazla talimatın tek levhada birleştiği seçenekler de vardır.",
        ],
      },
      {
        baslik: "En Çok Kullanılan Talimat Levhaları",
        paragraflar: ["Kullanım yerine göre en sık istenen bilgilendirme ve talimat levhaları aşağıdadır."],
        tablo: {
          basliklar: ["Levha", "Kullanım yeri"],
          satirlar: [
            ["Yangın Talimatı", "Kat koridorları, üretim alanı, ofis girişi"],
            ["Yangında Boşalan Söndürücüleri Yerine Asma", "Söndürücü istasyonları"],
            ["Yangına Karşı Önlem Almadan Kaynak ve Kesme Yapma", "Kaynak atölyesi, bakım alanı"],
            ["Bu Alan Kamera ile İzlenmektedir", "Bina ve saha girişleri, otopark"],
            ["Zararlı ve Tahriş Edici Madde", "Kimyasal depo, boyahane, laboratuvar"],
            ["İş Yeri Çalışma Kuralları", "Vardiya girişi, soyunma odası"],
          ],
        },
      },
      {
        baslik: "Malzeme Seçimi ve Ebat",
        paragraflar: [
          "Metin ağırlıklı talimat levhaları okunabilmesi için genellikle 35×50 cm ve üzeri ebatta üretilir; iş istasyonunun yanına, göz hizasına asılır. Kamera ve giriş levhaları dış mekânda dekota veya sac, iç mekânda PVC levha olarak tercih edilir.",
          ORTAK.ebatParagraf,
        ],
        tablo: ORTAK.malzemeTablo,
      },
      {
        baslik: "Özel Talimat Levhası",
        paragraflar: [
          "Her iş yerinin kendine özgü talimatları vardır. Firma adı, makine adı, sorumlu kişi veya kendi kural metninizle özel talimat levhası için sipariş notuna metni yazmanız yeterlidir; tasarım ekibimiz yönetmelik renk ve piktogram kurallarına uygun düzenleyip onayınıza sunar. Bu hizmet ücretsizdir.",
        ],
      },
      {
        baslik: "Sipariş ve Teslimat",
        paragraflar: [ORTAK.adetParagraf, ORTAK.teslimat],
      },
    ],
  },

  "guvenlik-uyari-levhalari": {
    seo: {
      title: "ISO 7010 Güvenlik Levhaları — Uyarı, Yasak, Emredici ve Acil Durum İşaretleri",
      description:
        "ISO 7010 ve yönetmeliğe uygun güvenlik levhaları: uyarı, yasak, emredici, acil durum ve yangın işaretleri. Malzeme, ebat ve adet seçin; tek adetten sipariş.",
    },
    faqs: [
      { q: "ISO 7010 nedir?", a: "ISO 7010, güvenlik işaretlerinin piktogramlarını, renklerini ve biçimlerini dünya genelinde standartlaştıran uluslararası normdur. Aynı tehlike her ülkede aynı işaretle gösterilir; Türkiye'deki Sağlık ve Güvenlik İşaretleri Yönetmeliği de bu renk ve biçim kurallarını esas alır. Katalogdaki tüm levhalar ISO 7010 piktogramlarıyla üretilir." },
      { q: "İş güvenliği işaret renkleri ne anlama gelir?", a: "Kırmızı: yasak ve yangın ekipmanı. Sarı: uyarı ve tehlike. Mavi: emredici, yapılması zorunlu davranış. Yeşil: acil çıkış, kaçış yolu, ilk yardım ve güvenli durum. Renkle birlikte biçim de anlam taşır: daire yasak veya emir, üçgen uyarı, dikdörtgen bilgi ve acil durum." },
      { q: "İş yerimde hangi levhaların gerektiğini nasıl belirlerim?", a: "Risk değerlendirmesinden yola çıkın: tanımlanan her tehlike için uyarı, yasaklanan her davranış için yasak, zorunlu her donanım için emredici levha; her çıkış ve ilk yardım noktası için yeşil işaret; her söndürücü ve alarm için kırmızı yangın levhası. İSG rehberimizde iş yeri tipine göre kontrol listesi bulunur." },
      ...sssOrtak,
    ],
    seoBolumler: [
      {
        baslik: "Güvenlik Levhası Grupları ve Renk Kuralları",
        paragraflar: [
          "Sağlık ve Güvenlik İşaretleri Yönetmeliği güvenlik işaretlerini beş gruba ayırır ve her gruba bir renk ile biçim verir. Renk ve biçim standart olduğu için çalışan levhayı okumadan mesajın türünü algılar. Aşağıdaki tablo grupları özetler; her grubun kendi kategori sayfasında ürünler ve ayrıntılar yer alır.",
        ],
        tablo: {
          basliklar: ["Grup", "Renk ve biçim", "Örnek", "Kategori"],
          satirlar: [
            ["Uyarı / ikaz", "Sarı zemin, siyah üçgen", "Dikkat kaygan zemin, yüksek gerilim", "Uyarı / İkaz Levhaları"],
            ["Yasaklayıcı", "Beyaz zemin, kırmızı çerçeveli çapraz daire", "Sigara içilmez, baretsiz girilmez", "Yasaklayıcı Levhalar"],
            ["Emredici", "Mavi daire, beyaz piktogram", "Baret tak, gözlük kullan", "Emredici / KKD Levhaları"],
            ["Acil durum ve ilk yardım", "Yeşil dikdörtgen, beyaz piktogram", "Acil çıkış, ilk yardım dolabı", "Acil Durum, Kaçış ve İlk Yardım"],
            ["Yangınla mücadele", "Kırmızı dikdörtgen, beyaz piktogram", "Yangın söndürücü, alarm butonu", "Yangınla Mücadele"],
          ],
        },
      },
      {
        baslik: "Malzeme Seçimi: Sticker, PVC, Dekota, Sac",
        paragraflar: ["Tüm gruplarda aynı dört malzeme sunulur; seçim asılacağı yüzeye ve ortama bağlıdır."],
        tablo: ORTAK.malzemeTablo,
      },
      {
        baslik: "Baskı Tipi ve Ebat",
        paragraflar: [ORTAK.ebatParagraf, "Baskı tipi ortamın ışık koşuluna göre seçilir."],
        tablo: ORTAK.baskiTablo,
      },
      {
        baslik: "Denetime Hazırlık: Levha Kontrol Listesi",
        paragraflar: [
          "Denetimde levhanın varlığı kadar doğru yerde, doğru ebatta ve okunur durumda olması da kontrol edilir. Solmuş, kırılmış veya yanlış renkte levhalar uygunsuzluk sayılır. İş yeri tipine göre hangi levhaların gerektiğini İSG uyarı levhaları rehberimizdeki kontrol listesinden görebilir, tüm levhaları tek sepette sipariş edebilirsiniz.",
        ],
      },
      {
        baslik: "Sipariş, Dosya ve Teslimat",
        paragraflar: [ORTAK.adetParagraf, ORTAK.dosya, ORTAK.teslimat],
      },
    ],
  },
};

async function girisYap() {
  const { ADMIN_EMAIL: email, ADMIN_PASSWORD: password } = process.env;
  if (!email || !password) { console.error("ADMIN_EMAIL + ADMIN_PASSWORD gerekli."); process.exit(1); }
  const r = await fetch(`${API}/api/auth/login`, {
    method: "POST", headers: { "content-type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  if (!r.ok) { console.error(`Giriş başarısız: ${r.status}`); process.exit(1); }
  const j = await r.json();
  return j.accessToken || j.access_token || j.token;
}

// Tutarlılık denetimi: sabit TL fiyatı yok (kargo eşiği 1.500 ₺ politika metnidir, fiyat değil), 8 SSS, dolu bölümler.
for (const [slug, icerik] of Object.entries(ICERIK)) {
  const metin = JSON.stringify(icerik).replace(/1\.500 ₺/g, "");
  if (/\d\s?(₺|TL)\b/.test(metin)) { console.error(`✗ ${slug}: içerikte sabit TL rakamı var`); process.exit(1); }
  if (icerik.faqs.length !== 8) { console.error(`✗ ${slug}: SSS sayısı 8 olmalı (${icerik.faqs.length})`); process.exit(1); }
  for (const b of icerik.seoBolumler) if (!b.baslik || !b.paragraflar?.length) { console.error(`✗ ${slug}: boş bölüm`); process.exit(1); }
  if (icerik.seo.title.length > 80 || icerik.seo.description.length > 175) console.warn(`! ${slug}: title ${icerik.seo.title.length} / description ${icerik.seo.description.length} karakter`);
}

const token = await girisYap();
const H = { "content-type": "application/json", authorization: `Bearer ${token}` };
const kategoriler = await fetch(`${API}/api/categories`).then((r) => r.json())
  .then((j) => (Array.isArray(j) ? j : j.items ?? []));

let ok = 0, hata = 0;
for (const [slug, icerik] of Object.entries(ICERIK)) {
  const cat = kategoriler.find((c) => c.slug === slug);
  if (!cat) { console.warn(`- ${slug}: aktif kategori listesinde yok (pasif toplayıcı), atlandı`); continue; }
  const mevcut = cat.content && typeof cat.content === "object" ? cat.content : {};
  const yeniContent = { ...mevcut, ...icerik };
  const ozet = `seoBölüm:${icerik.seoBolumler.length} sss:${icerik.faqs.length} title:${icerik.seo.title.length}k desc:${icerik.seo.description.length}k`;
  if (DRY) { console.log(`[DRY] ${slug} → ${ozet}`); continue; }
  const res = await fetch(`${API}/api/categories/${cat.id}`, { method: "PATCH", headers: H, body: JSON.stringify({ content: yeniContent }) });
  if (!res.ok) { console.error(`✗ ${slug}: ${res.status} ${(await res.text()).slice(0, 200)}`); hata++; continue; }
  const kontrol = await fetch(`${API}/api/categories`).then((r) => r.json())
    .then((j) => (Array.isArray(j) ? j : j.items ?? []).find((c) => c.slug === slug));
  if (!kontrol?.content?.seoBolumler?.length) { console.error(`✗ ${slug}: PATCH 200 döndü ama içerik YAZILMADI`); hata++; continue; }
  console.log(`✓ ${slug} güncellendi ve doğrulandı — ${ozet}`);
  ok++;
}
console.log(`\nÖzet — güncellenen: ${ok} · hata: ${hata}`);
