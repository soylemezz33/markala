/**
 * Matbaa terimleri sözlüğü — long-tail SEO için.
 * Her terim ayrı bir aranma intent'i: "cmyk nedir", "selefon nedir", "gramaj nedir"
 *
 * Schema.org DefinedTermSet ile yapılandırılır.
 */

export interface GlossaryTerm {
  slug: string;
  term: string;
  shortDef: string;       // SERP/snippet için 100-150 char
  longDef: string;        // Detaylı açıklama
  category: GlossaryCategory;
  examples?: string[];
  relatedTerms?: string[];
  synonyms?: string[];
}

export type GlossaryCategory =
  | "kagit"
  | "renk"
  | "baski"
  | "kaplama"
  | "kesim"
  | "format"
  | "uretim"
  | "tasarim";

export const glossaryCategories: Record<GlossaryCategory, { name: string; desc: string }> = {
  kagit: { name: "Kağıt", desc: "Kâğıt türleri, gramaj, doku ve özellikleri" },
  renk: { name: "Renk Sistemi", desc: "CMYK, RGB, Pantone ve renk yönetimi" },
  baski: { name: "Baskı Teknikleri", desc: "Ofset, dijital, serigrafi gibi baskı metodları" },
  kaplama: { name: "Kaplama & Lak", desc: "Selefon, UV lak, yaldız ve son kat işlemler" },
  kesim: { name: "Kesim & Bitirme", desc: "Kesim, kırım, dikiş, ciltleme süreçleri" },
  format: { name: "Format & Dosya", desc: "PDF/X, çözünürlük, taşma payı, dosya hazırlama" },
  uretim: { name: "Üretim Süreci", desc: "Ön baskı, tolerans, fire, kalite kontrol" },
  tasarim: { name: "Tasarım", desc: "Tipografi, hiyerarşi, tasarım terimleri" },
};

export const glossary: GlossaryTerm[] = [
  // === KAĞIT ===
  {
    slug: "gramaj",
    term: "Gramaj",
    shortDef: "Kâğıdın metrekare başına ağırlığı (g/m²). Kalınlığı ve dolgunluğu belirler.",
    longDef:
      "Gramaj, bir kâğıdın 1 metrekaresinin gram cinsinden ağırlığıdır (g/m² veya gr olarak yazılır). 80 gr fotokopi kâğıdından 350 gr kartvizit kartonuna kadar geniş bir aralıkta kullanılır. Gramaj arttıkça kâğıt daha kalın, daha sert ve daha pahalıdır. Kartvizit için 300-400 gr, broşür için 115-170 gr, antetli kâğıt için 80-90 gr standart kabul edilir.",
    category: "kagit",
    examples: ["80 gr antetli kâğıt", "300 gr mat kuşe kartvizit", "170 gr selefonlu broşür"],
    relatedTerms: ["kuse", "bristol", "selefon"],
  },
  {
    slug: "kuse",
    term: "Kuşe Kâğıt",
    shortDef: "Yüzeyi parlak veya mat kaplı, baskı kalitesi yüksek kâğıt türü.",
    longDef:
      "Kuşe (coated) kâğıt, yüzeyi kil veya kalsiyum karbonat içeren bir kaplama ile işlenmiş kâğıttır. Mat ve parlak olmak üzere iki ana türü vardır. Mürekkep emilimi düşük olduğu için renkler daha canlı ve net çıkar. Broşür, katalog, kartvizit ve kapaklı baskı işlerinde tercih edilir. Mat kuşe okunabilirliği yüksek, parlak kuşe ise renk doygunluğunu maksimize eder.",
    category: "kagit",
    examples: ["170 gr mat kuşe broşür", "350 gr parlak kuşe kartvizit"],
    relatedTerms: ["gramaj", "selefon", "uv-lak"],
  },
  {
    slug: "bristol",
    term: "Bristol Karton",
    shortDef: "Kalın, sert ve premium hisli karton türü. Kartvizit ve davetiye için ideal.",
    longDef:
      "Bristol karton, çok katmanlı yapısıyla yüksek dayanıklılığa sahip bir karton türüdür. 250-400 gr aralığında üretilir. Mat veya hafif dokulu yüzeyi vardır; lüks his verir. Premium kartvizit, davetiye, sertifika ve ürün etiketlerinde kullanılır. Kuşeden farklı olarak yüzey doku kabarık değildir, bu da yazı yazılabilirliğini artırır.",
    category: "kagit",
    examples: ["350 gr Bristol kartvizit", "300 gr Bristol davetiye"],
    relatedTerms: ["kuse", "gramaj"],
  },
  {
    slug: "amerikan-kagit",
    term: "Amerikan (NCR) Kağıt",
    shortDef: "Kopyalı (karbonsuz) kâğıt — makbuz, fatura ve sevk irsaliyesi için.",
    longDef:
      "Amerikan kâğıt veya NCR (No Carbon Required), iki veya daha fazla katlı, üst kâğıdın yazıyı alttaki kâğıda otomatik basınçla aktardığı özel bir kâğıt türüdür. Karbon kullanmaz; yüzeyleri kimyasal kaplı olduğu için yazı doğrudan iletilir. Makbuz, fatura, sevk irsaliyesi, sipariş formu, garanti belgesi gibi işlerde kullanılır. 2-3 nüshalı (beyaz/sarı/pembe) standart formatlarda gelir.",
    category: "kagit",
    examples: ["3 nüshalı NCR makbuz", "2 nüshalı sevk irsaliyesi"],
    relatedTerms: ["makbuz", "fatura"],
  },
  {
    slug: "kraft",
    term: "Kraft Kâğıt",
    shortDef: "Geri dönüştürülmüş, kahverengi tonlarında doğal görünümlü kâğıt.",
    longDef:
      "Kraft kâğıt, ağartılmamış selüloz lifinden üretilen, doğal kahverengi tonu olan dayanıklı bir kâğıttır. Sürdürülebilirlik vurgulayan markalar tarafından tercih edilir. Organik gıda, el yapımı sabun, butik mağaza ürün ambalajı, butik kartvizit ve etiketlerde kullanılır. Yüzey kabasaba olduğu için CMYK baskı renkleri daha mat çıkar.",
    category: "kagit",
    examples: ["Kraft kartvizit", "Kraft kese kâğıt", "Kraft etiket"],
    relatedTerms: ["geri-donusum", "ambalaj"],
  },

  // === RENK ===
  {
    slug: "cmyk",
    term: "CMYK",
    shortDef: "4 mürekkep (cyan-magenta-yellow-key) ile baskı yapan renk sistemi.",
    longDef:
      "CMYK, baskı endüstrisinde kullanılan substraktif (çıkarmalı) renk sistemidir. C (Cyan), M (Magenta), Y (Yellow) ve K (Key/Black) mürekkeplerin farklı oranlarda karıştırılmasıyla milyonlarca renk üretilir. Ekran (RGB) renkleri ile aynı değildir; baskıda CMYK kullanılması zorunludur. Adobe Illustrator, Photoshop ve InDesign'da dosya açarken \"CMYK Color\" seçilmelidir. Renk dönüşümü sırasında doygunluk kaybı olabilir.",
    category: "renk",
    examples: ["CMYK profil", "C:60 M:40 Y:40 K:100 zengin siyah"],
    relatedTerms: ["rgb", "pantone", "icc-profil"],
    synonyms: ["dört renk baskı", "process color"],
  },
  {
    slug: "rgb",
    term: "RGB",
    shortDef: "Ekranlarda kullanılan ışık tabanlı (red-green-blue) renk sistemi.",
    longDef:
      "RGB, kırmızı (Red), yeşil (Green) ve mavi (Blue) ışıkların farklı yoğunluklarda karıştırılmasıyla renk üreten additif (toplamalı) sistemdir. Bilgisayar ekranı, telefon, televizyon, kamera gibi tüm dijital cihazlarda kullanılır. Baskı için RGB dosyası göndermek hatadır; matbaada CMYK'ya dönüşüm sırasında parlak yeşil ve maviler donuklaşır. Tasarımı baştan CMYK profilinde yapmak en doğrusudur.",
    category: "renk",
    relatedTerms: ["cmyk", "icc-profil"],
  },
  {
    slug: "pantone",
    term: "Pantone (PMS)",
    shortDef: "Standart renk kodları sistemi — kurumsal renklerin hassas baskısı için.",
    longDef:
      "Pantone Matching System (PMS), her rengin numerik bir kodu olan dünya çapında standart renk paletidir. CMYK'nın yetersiz kaldığı kurumsal renklerde (örneğin Coca-Cola kırmızısı) Pantone özel mürekkep olarak kullanılır. \"5+1 renk\" baskı CMYK + 1 Pantone, \"6 renk\" ise CMYK + 2 Pantone demektir. Lüks marka kartviziti, ambalaj ve özel projelerde tercih edilir. CMYK'ya dönüşüm %15-20 sapma yaratabilir.",
    category: "renk",
    examples: ["Pantone 185 C (kırmızı)", "Pantone 286 C (mavi)", "Pantone Cool Gray 9"],
    relatedTerms: ["cmyk", "spot-renk"],
    synonyms: ["spot renk", "PMS"],
  },
  {
    slug: "zengin-siyah",
    term: "Zengin Siyah (Rich Black)",
    shortDef: "K:100 yerine CMYK karışımıyla derin siyah elde etme tekniği.",
    longDef:
      "Zengin siyah, sadece K:100 kullanmak yerine CMYK karışımıyla daha derin ve yoğun bir siyah elde etmek için kullanılır. Standart formül: C:60 M:40 Y:40 K:100. Ofset baskıda büyük siyah alanlarda K:100 donuk gri görünür; zengin siyah ise mat ve dolgun bir görünüm verir. Küçük metinler için kullanılmaz (üst üste binme problemi olur), sadece büyük blok alanlar için.",
    category: "renk",
    relatedTerms: ["cmyk", "trapping"],
  },
  {
    slug: "icc-profil",
    term: "ICC Profil",
    shortDef: "Renk yönetiminde cihazlar arası tutarlılık için standart profil dosyası.",
    longDef:
      "ICC (International Color Consortium) profili, ekran-yazıcı-baskı makinesi arasında renk tutarlılığını sağlamak için kullanılan standart bir dosyadır. Türkiye matbaaları yaygın olarak \"ISO Coated v2 (ECI)\" profilini kullanır. Adobe ürünlerine kurarak tasarımınızın baskıdaki halini ekran üzerinde doğru tahmin edebilirsiniz. Profilsiz baskı = sürpriz renk demektir.",
    category: "renk",
    examples: ["ISO Coated v2 (ECI)", "FOGRA39"],
    relatedTerms: ["cmyk", "soft-proof", "hard-proof"],
  },

  // === BASKI ===
  {
    slug: "ofset-baski",
    term: "Ofset Baskı",
    shortDef: "Plakadan silindire, silindirden kâğıda mürekkep aktarımı yapan endüstriyel baskı.",
    longDef:
      "Ofset baskı, mürekkebin metal plakadan kauçuk silindire, oradan kâğıda transfer edildiği endüstriyel baskı türüdür. 1.000+ adet baskıda birim maliyeti çok düşüktür. Renk kalitesi yüksek, detay üretimi mükemmeldir. Kartvizit (5.000+ adet), broşür, katalog, kitap ve gazete gibi yüksek tirajlı işlerde tercih edilir. Forma kâğıt ile çalışır, kesim sonrası ürün elde edilir.",
    category: "baski",
    examples: ["10.000 adet broşür ofset", "50.000 adet kartvizit ofset"],
    relatedTerms: ["dijital-baski", "forma", "plakaba"],
  },
  {
    slug: "dijital-baski",
    term: "Dijital Baskı",
    shortDef: "Bilgisayardan doğrudan baskı — düşük adetli ve hızlı işler için ideal.",
    longDef:
      "Dijital baskı, dosyanın doğrudan baskı makinesine gönderildiği plaka gerektirmeyen baskı türüdür. Düşük adetli (1-1.000) işlerde birim maliyeti makul, ön hazırlık süresi çok kısadır. Acil işler, kişiselleştirilmiş baskı (her sayfa farklı), kısa tirajlı kartvizit ve broşürlerde tercih edilir. Renk kalitesi son yıllarda ofset düzeyine yaklaşmıştır.",
    category: "baski",
    examples: ["100 adet acil kartvizit", "250 adet broşür"],
    relatedTerms: ["ofset-baski", "lazer-baski", "ink-jet"],
  },
  {
    slug: "serigrafi",
    term: "Serigrafi",
    shortDef: "Şablon (elek) yardımıyla mürekkebin baskı yüzeyine geçirildiği baskı tekniği.",
    longDef:
      "Serigrafi (silk-screen), boya geçirmeyen şablon ile boya geçiren elek arasındaki farktan yararlanılan, mürekkebin yüzeye sürüldüğü tekniktir. T-shirt, kupa, kalem, çanta, plastik ve metal yüzeylerde kullanılır. Kâğıt dışı yüzeylerde tek alternatiftir. UV mürekkep ile yıkamaya dayanıklı baskı sağlar.",
    category: "baski",
    examples: ["Kupa baskı", "T-shirt baskı", "Çanta baskı"],
    relatedTerms: ["sublime-baski", "dijital-tekstil"],
  },
  {
    slug: "sublime-baski",
    term: "Sublime Baskı",
    shortDef: "Isı ile mürekkebi malzemeye geçiren, kupada ve polyester kumaşta kullanılan teknik.",
    longDef:
      "Sublime (süblimasyon) baskı, özel mürekkep ile basılan transfer kağıdının yüksek ısı altında polyester yüzey veya kupaya işlenmesidir. Mürekkep yüzeyin altına geçer, dokunulmaz hale gelir. Kupa, mouse pad, polyester t-shirt, magnet ve mausepad ürünlerinde standart tekniktir. Renk tonu mat değil canlı ve tam doygundur.",
    category: "baski",
    examples: ["Sublime kupa", "Sublime mouse pad"],
    relatedTerms: ["serigrafi"],
  },

  // === KAPLAMA ===
  {
    slug: "selefon",
    term: "Selefon",
    shortDef: "Kâğıt yüzeye yapıştırılan ince plastik film — koruma + parlaklık/matlık verir.",
    longDef:
      "Selefon (BOPP veya OPP), baskıdan sonra kâğıdın bir veya iki yüzüne uygulanan ince plastik film katmanıdır. Mat ve parlak olmak üzere iki ana türü vardır. Mat selefon premium ve modern bir his verir, parlak selefon renkleri canlandırır. Yırtılmaya, lekelenmeye ve neme karşı korur. Kartvizit, menü, kapaklı broşür gibi sık ele alınan ürünlerde tercih edilir. Mat selefon üzerine yazı yazılabilir, parlak selefon yazılamaz.",
    category: "kaplama",
    examples: ["Mat selefonlu kartvizit", "Parlak selefonlu broşür"],
    relatedTerms: ["uv-lak", "yaldiz", "kuse"],
  },
  {
    slug: "uv-lak",
    term: "UV Lak",
    shortDef: "Yüzeye sıvı lak sürüp UV ile kurutulan parlak/mat finiş tekniği.",
    longDef:
      "UV lak, UV ışık altında saniyeler içinde kuruyan özel cila uygulamasıdır. Tüm yüzeye (full UV) veya seçili alanlara (lokal/spot UV) uygulanabilir. Lokal UV ile logo veya isim üzerine dramatik vurgu yapılır. Cam gibi parlak veya yumuşak mat varyasyonları vardır. Kartvizit, davetiye, lüks ambalaj ve premium broşürlerde sık kullanılır.",
    category: "kaplama",
    examples: ["Lokal UV kartvizit", "Full UV kapak"],
    relatedTerms: ["selefon", "yaldiz"],
  },
  {
    slug: "yaldiz",
    term: "Yaldız (Folyo Baskı)",
    shortDef: "Metalik altın/gümüş folyo ile yüzey üzerine premium vurgu uygulama.",
    longDef:
      "Yaldız veya folyo baskı, ısı ve baskı altında metalik folyo şeridinin yüzeye yapıştırılmasıdır. Altın, gümüş, bakır, gül altın gibi farklı tonları vardır. Lüks marka kartviziti, davetiye, kutu kapağı ve ambalajlarda premium hissi yaratır. Maliyet selefon ve UV laktan daha yüksektir, küçük detaylar için ideal.",
    category: "kaplama",
    examples: ["Altın yaldızlı kartvizit", "Gümüş yaldızlı davetiye"],
    relatedTerms: ["uv-lak", "kabartma"],
  },
  {
    slug: "kabartma",
    term: "Kabartma (Embossing)",
    shortDef: "Kâğıt yüzeyini kalıpla bastırarak kabartma veya çukurlaştırma efekti.",
    longDef:
      "Kabartma (embossing), özel bir kalıp ile kâğıdın seçili alanlarının yukarı veya aşağı doğru bastırılmasıyla 3 boyutlu efekt yaratılmasıdır. Yukarı kabartma \"emboss\", aşağı çukurlaştırma \"deboss\" denir. Logoyu öne çıkarmak, dokunsal hissi vurgulamak için kullanılır. Genelde yaldız veya UV lak ile kombine edilerek lüks his maksimize edilir.",
    category: "kaplama",
    examples: ["Kabartma logolu kartvizit", "Deboss premium klasör"],
    relatedTerms: ["yaldiz", "uv-lak"],
  },

  // === KESİM ===
  {
    slug: "tasma-payi",
    term: "Taşma Payı (Bleed)",
    shortDef: "Kesim hatasını önlemek için tasarımı kenardan 2-3 mm taşırma.",
    longDef:
      "Taşma payı (bleed), kesim sırasında oluşabilecek 1-2 mm sapmanın baskıyı bozmaması için tasarımın kenarlardan 2-3 mm dışarı taşırılmasıdır. 85x55 mm kartvizit için tasarım 87x57 mm hazırlanır, kesim sonrası fazla kısımlar atılır. Taşma payı bırakılmazsa kenarlarda beyaz çizgiler oluşabilir. Kritik metinler ise kenardan en az 5 mm içeride olmalıdır (safe area).",
    category: "kesim",
    examples: ["3 mm taşma + 5 mm safe area"],
    relatedTerms: ["safe-area", "pdf-x"],
    synonyms: ["bleed", "şişme payı"],
  },
  {
    slug: "safe-area",
    term: "Safe Area (Güvenli Alan)",
    shortDef: "Kesim hatası riski olmayan, metinler için güvenli iç alan.",
    longDef:
      "Safe area, kâğıdın kenarlarından 5 mm içeride bulunan, kesim sırasında kesilmeyeceği garantili olan bölgedir. Telefon numarası, e-posta, isim gibi kritik metinler bu alanın dışına taşmamalıdır. Aksi halde kesim sapması durumunda yazılar kısmen kesilebilir. Taşma payı (3mm dış) + safe area (5mm iç) toplamda 8mm güvenlik şeridi sağlar.",
    category: "kesim",
    relatedTerms: ["tasma-payi"],
  },
  {
    slug: "perforaj",
    term: "Perforaj",
    shortDef: "Koparma hattı oluşturmak için yapılan delik dizisi (yırtık çizgisi).",
    longDef:
      "Perforaj, küçük deliklerin sıralı olarak açılmasıyla kolayca koparılabilen çizgi yaratılmasıdır. Bilet, kupon, makbuz koçanı, defter sayfası gibi ürünlerde kullanılır. Hattı dik veya çapraz olabilir; \"micro perf\" çok ince, kullanıcı dostu koparma sağlar.",
    category: "kesim",
    examples: ["Bilet perforajı", "NCR makbuz koçanı"],
    relatedTerms: ["kirim"],
  },
  {
    slug: "kirim",
    term: "Kırım (Bigleme)",
    shortDef: "Katlanacak hat boyunca kâğıda yapılan ezme — düzgün katlanmayı sağlar.",
    longDef:
      "Kırım (creasing/bigleme), katlanacak çizgi boyunca kâğıdın özel bir bıçakla ezilmesidir. Kalın kâğıtlarda (200 gr+) düz katlamak liflerin kırılmasına ve çatlamaya neden olur; kırım bunu önler. Davetiye, broşür, klasör kapakları, kitapçık kapakları için zorunlu işlemdir.",
    category: "kesim",
    examples: ["3 katlı broşür kırımı", "Davetiye kırımı"],
    relatedTerms: ["perforaj", "katlama"],
  },

  // === FORMAT ===
  {
    slug: "pdf-x",
    term: "PDF/X",
    shortDef: "Matbaa için optimize edilmiş PDF standartı (X-1a, X-3, X-4).",
    longDef:
      "PDF/X, matbaa endüstrisinin standart belge formatıdır. PDF/X-1a en yaygın olanıdır; CMYK renk profili gömülü, font'lar embed edilmiş, transparan efektler düzleştirilmiş halidir. Matbaaya gönderirken bu format tercih edilmelidir. Adobe ürünlerinde \"Save As → PDF → PDF/X-1a:2001\" şeklinde export edilir. JPG ve normal PDF gibi formatlardan daha güvenlidir.",
    category: "format",
    examples: ["PDF/X-1a:2001", "PDF/X-4:2010"],
    relatedTerms: ["dpi", "icc-profil", "embed-font"],
  },
  {
    slug: "dpi",
    term: "DPI (Çözünürlük)",
    shortDef: "İnç başına nokta sayısı — baskıda 300 dpi minimum, ekranda 72 dpi.",
    longDef:
      "DPI (Dots Per Inch), bir görselin yüzey üzerinde kaç noktayla oluşturulduğunu gösterir. Web/ekran için 72 dpi yeterli iken baskıda 300 dpi minimumdur. 300 dpi altındaki görseller baskıda bulanık ve kareli (pikselli) çıkar. Vektörel grafikler (Adobe Illustrator) DPI'dan bağımsızdır; raster (Photoshop) için bu değer kritiktir.",
    category: "format",
    relatedTerms: ["vektorel", "raster", "pdf-x"],
  },
  {
    slug: "vektorel",
    term: "Vektörel",
    shortDef: "Matematiksel formüllerle çizilen, ölçeklenebilir grafik formatı (AI, EPS, SVG).",
    longDef:
      "Vektörel grafikler, piksellerden değil matematiksel eğri ve doğrulardan oluşur. Sınırsız büyütülebilir, kalite kaybetmez. Logo, ikon, illüstrasyon ve haritalar vektörel olmalıdır. Adobe Illustrator (.ai), EPS, SVG ve PDF formatlarında saklanır. Photoshop (raster) ile karıştırılmamalıdır.",
    category: "format",
    examples: ["Logo .ai dosyası", "Vektörel ikon SVG"],
    relatedTerms: ["raster", "dpi"],
  },
  {
    slug: "raster",
    term: "Raster (Bitmap)",
    shortDef: "Piksellerden oluşan görsel formatı (JPG, PNG, TIFF) — sınırlı ölçeklenir.",
    longDef:
      "Raster (bitmap), küçük renk noktaları (piksel) ile oluşturulan görsel formatıdır. JPG, PNG, TIFF, BMP gibi formatları vardır. Belirli bir çözünürlükte üretilir; büyütüldüğünde piksel görünür ve kalite düşer. Fotoğraflar her zaman raster'dır; baskı için 300 dpi'da olmalıdır. Photoshop ana raster düzenleme programıdır.",
    category: "format",
    relatedTerms: ["vektorel", "dpi", "jpg-png"],
  },

  // === ÜRETİM ===
  {
    slug: "fire",
    term: "Fire (Üretim Toleransı)",
    shortDef: "Üretim sürecinde kabul edilen %1-5 oranında eksik adet veya defolu ürün.",
    longDef:
      "Fire (yield loss), matbaa sektörünün TSE/ISO standartlarına göre %1-5 aralığında kabul edilen üretim toleransıdır. Kesim sapması, ayar baskıları, KKK'da elenen defolu ürünler bu kapsamda değerlendirilir. 1.000 sipariş için 980-1.020 arası teslim normaldir. %5'i geçen eksiklerde matbaa ek ücretsiz baskı veya bedel iadesi yapar. Sözleşmeye dahildir.",
    category: "uretim",
    examples: ["1.000 adet sipariş → 980 adet teslim (%2 fire)"],
    relatedTerms: ["kalite-kontrol", "ayar-baski"],
  },
  {
    slug: "ayar-baski",
    term: "Ayar Baskı",
    shortDef: "Üretim öncesi renk dengeleme amacıyla yapılan ilk birkaç deneme baskısı.",
    longDef:
      "Ayar baskı, ofset baskıda mürekkep yoğunluğu ve renk dengesini ayarlamak için yapılan deneme baskılarıdır. Genellikle 50-100 forma harcanır, bu kâğıtlar fire kapsamına girer. Dijital baskıda bu işlem gerekmediği için fire oranı düşüktür. Hard proof onayı sonrası ayar yapılır.",
    category: "uretim",
    relatedTerms: ["fire", "hard-proof"],
  },
  {
    slug: "hard-proof",
    term: "Hard Proof (Renk Provası)",
    shortDef: "Matbaadan gönderilen, gerçek baskıyı %99 simüle eden test çıktı.",
    longDef:
      "Hard proof veya color proof, matbaa makinesinden çıkacak işin %99 doğrulukla simüle edildiği bir test baskısıdır. Müşteri renk onayı için kullanılır. Kurumsal kimlik baskıları, premium ürünler ve renk hassasiyeti yüksek işlerde mutlaka istenmelidir. Ekran üzerinde yapılan \"soft proof\" %85 doğruluğa sahiptir.",
    category: "uretim",
    examples: ["Premium kartvizit hard proof", "Marka logo proof'u"],
    relatedTerms: ["soft-proof", "icc-profil"],
  },
  {
    slug: "soft-proof",
    term: "Soft Proof",
    shortDef: "Ekran üzerinde CMYK simülasyonu — hızlı ama %85 doğrulukta.",
    longDef:
      "Soft proof, tasarım yazılımında (Photoshop, InDesign) ICC profil kullanılarak ekranda yapılan baskı simülasyonudur. Hızlı ve ücretsizdir. Adobe ürünlerinde \"View → Proof Setup → Working CMYK\" ile aktive edilir. Renk doğruluğu monitör kalibrasyonuna bağlıdır; %85 civarındadır. Kritik işlerde hard proof gereklidir.",
    category: "uretim",
    relatedTerms: ["hard-proof", "icc-profil"],
  },

  // === FORMAT (devam) ===
  {
    slug: "outline",
    term: "Outline (Yazı Vektörleştirme)",
    shortDef: "Yazıların yola dönüştürülmesi — font eksikliği probleminden kaçınmak için.",
    longDef:
      "Outline (Convert to Outlines), yazı karakterlerinin vektörel yollara (path) çevrilmesidir. Adobe Illustrator'da \"Type → Create Outlines\" ile yapılır. Matbaaya gönderirken yazıların outline yapılması gerekir; aksi halde matbaada o font yoksa yazı bozulur veya farklı bir fontla yazılır. Outline sonrası yazıyı düzenleyemezsiniz; bu yüzden orijinal dosyayı saklayın.",
    category: "format",
    relatedTerms: ["vektorel", "embed-font"],
  },
];

export function getTermBySlug(slug: string): GlossaryTerm | undefined {
  return glossary.find((t) => t.slug === slug);
}

export function getTermsByCategory(cat: GlossaryCategory): GlossaryTerm[] {
  return glossary.filter((t) => t.category === cat);
}

export function getRelatedTerms(slug: string): GlossaryTerm[] {
  const t = getTermBySlug(slug);
  if (!t) return [];
  return (t.relatedTerms ?? [])
    .map((s) => getTermBySlug(s))
    .filter((x): x is GlossaryTerm => x !== undefined);
}
