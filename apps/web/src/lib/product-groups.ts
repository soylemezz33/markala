/**
 * ÜRÜN GRUPLARI — menüdeki 8 grubun İNDEKSLENEBİLİR karşılığı (2026-09-01 SEO denetimi).
 *
 * SORUN NEYDİ: anasayfanın hero altındaki 8 kategori kutusu — ilk ekranın en değerli
 * bağlantı alanı — `/urunler?kategoriler=…&grup=…` filtre adreslerine gidiyordu. Bu
 * adreslerin hepsi `/urunler`'e canonical veriyor, yani o 8 bağlantının SEO değeri hiçbir
 * yere ulaşmıyordu. Üstelik grup adları ("matbaa", "dijital baskı", "reklam tabela",
 * "iş güvenliği levhaları") tam olarak ARANAN terimler ve hiçbirinin sayfası yoktu.
 *
 * KARTVİZİT NEDEN LİSTEDE YOK: o grup tek kategoriden ibaret (kartvizit). Ona hub açmak
 * `/kategori/kartvizit` ile neredeyse birebir kopya bir sayfa üretirdi — kendi kendine
 * duplicate content. Kutusu doğrudan `/kategori/kartvizit`'e gider (bkz. grubaGoreHref).
 *
 * SLUG'LAR KOD TARAFINDA SABİT: etiketten türetilseydi, admin panelde etiketi düzelten
 * biri (örn. "Bayrak & Stand" → "Bayrak ve Stand") farkında olmadan URL'i değiştirir ve
 * indekslenmiş sayfa 404 olurdu. `navLabel` DB'deki etikete bakar, `slug` asla değişmez.
 *
 * `intro` METİNLERİ ELLE YAZILDI: uydurma iddia yok — hepsi katalogda gerçekten olan
 * ürünlere, gerçek malzemelere ve mevzuat kuralına dayanır.
 */

export interface ProductGroup {
  /** URL parçası — DEĞİŞTİRME. İndekslenmiş adres buna bağlı. */
  slug: string;
  /** Sayfada ve breadcrumb'da görünen ad. */
  label: string;
  /** DB header_nav'daki etiket — kutu eşleşmesi bununla yapılır. */
  navLabel: string;
  h1: string;
  /** SERP başlığı — MARKA EKİ OLMADAN. " · Markala" soneki generateMetadata'da eklenir
   *  (bkz. kategoriler/[grup]/page.tsx): /kategoriler/layout.tsx düz string bir `title`
   *  verdiği için kökteki "%s · Markala" şablonu bu alt ağaçta uygulanmıyor. Değerler
   *  sonek eklendiğinde 60 karakterin altında kalacak şekilde kısa tutuldu. */
  title: string;
  description: string;
  /** H1 altındaki açıklama. Kısa tutuldu: asıl derinlik kategori sayfalarında. */
  intro: string;
  /** Gruba giren kategori slug'ları — sıra sayfadaki sırayı belirler. */
  categorySlugs: string[];
}

export const PRODUCT_GROUPS: ProductGroup[] = [
  {
    slug: "matbaa-ve-brosur",
    label: "Matbaa ve Broşür",
    navLabel: "Matbaa ve Broşür",
    h1: "Matbaa ve broşür baskı",
    title: "Matbaa ve Broşür Baskı — Broşür, Afiş, Antetli",
    description:
      "Broşür, el ilanı, afiş, etiket, antetli kağıt, zarf, cepli dosya, makbuz ve bloknot baskısı. Ebadını ve adedini seç, fiyatı anında gör. 2-3 iş günü üretim, 81 ile kargo.",
    intro:
      "Klasik matbaa işlerinin tamamı bu başlık altında: kuşe ve 1. hamur kâğıda broşür, el ilanı, afiş; kurumsal kırtasiye tarafında antetli kağıt, diplomat ve torba zarf, cepli dosya, NCR makbuz; yapışkanlı etiket ve bloknot çeşitleri. Her üründe gramaj, ebat, tek/çift yön ve selefon seçenekleri konfigüratörden seçilir; tutar KDV dahil anında görünür.",
    categorySlugs: [
      "brosur",
      "afis",
      "etiket",
      "antetli-kagit",
      "zarf",
      "cepli-dosya",
      "makbuz",
      "bloknot",
    ],
  },
  {
    slug: "bayrak-ve-stand",
    label: "Bayrak & Stand",
    navLabel: "Bayrak & Stand",
    h1: "Bayrak ve stand baskı",
    title: "Bayrak & Stand — Yelken Bayrak, Roll-Up",
    description:
      "Yelken bayrak, kırlangıç bayrak, masa ve makam bayrağı, roll-up, vinil branda afiş. Fuar, mağaza ve etkinlik için hazır çözümler. 2-3 iş günü üretim.",
    intro:
      "Fuar, mağaza önü ve etkinlik tanıtımı için kullanılan dış mekân görünürlük ürünleri: rüzgârda okunur kalan yelken ve kırlangıç bayraklar, toplantı masası için krom direkli masa bayrağı, saten püsküllü makam bayrağı, taşınabilir roll-up standlar ve dilediğiniz ebatta vinil branda afiş. Direk, ayak ve taşıma çantası gibi aparatlar ürün sayfasında ayrıca seçilir.",
    categorySlugs: [
      "yelken-bayrak",
      "kirlangic-bayrak",
      "masa-bayragi",
      "makam-bayragi",
      "rollup",
      "vinil-branda-afis",
    ],
  },
  {
    slug: "dijital-baski",
    label: "Dijital Baskı",
    navLabel: "Dijital Baskı",
    h1: "Dijital baskı",
    title: "Dijital Baskı — Branda, Folyo, Dekota",
    description:
      "Solvent ve UV dijital baskı: vinil branda, yapışkanlı folyo, dekota levha, fosforlu folyo. m² hesabıyla anında fiyat, kontür kesim seçeneği.",
    intro:
      "Geniş format tarafı: solvent ve UV makinelerde m² hesabıyla üretilen işler. 440 gr vinil branda afişten yapışkanlı folyoya, iç ve dış mekânda kullanılan sert PVC dekota levhadan karanlıkta parlayan fosforlu folyoya kadar. Fiyat m² üzerinden hesaplandığı için istediğiniz ebadı girip tutarı doğrudan görebilir, kontür kesim gerekiyorsa aynı ekrandan ekleyebilirsiniz.",
    categorySlugs: ["vinil-branda-afis", "folyo", "dekota-baski", "fosforlu-folyo"],
  },
  {
    slug: "promosyon-ve-hediye",
    label: "Promosyon & Hediye",
    navLabel: "Promosyon & Hediye",
    h1: "Promosyon ve hediye ürünleri",
    title: "Promosyon & Hediye — Kupa, Magnet, Plaket",
    description:
      "Baskılı kupa, promosyon magnet, kristal plaket, madalya, bloknot ve kaşe. Kurumsal hediyelik ve etkinlik promosyonu için tek adres.",
    intro:
      "Kurumsal hediyelik ve etkinlik promosyonu için üretilen ürünler: sublimasyon baskılı porselen kupa, buzdolabı ve araç magneti, lazer kazımalı kristal plaket, madalya, logolu bloknot ve otomatik kaşe. Kupa ve kaşe gibi ürünler tek adetten üretilebilir; magnet ve bloknot gibi matbaa işlerinde adet kademeleri konfigüratörde listelenir.",
    categorySlugs: ["kupa", "magnet", "plaket", "madalya", "kase", "bloknot"],
  },
  {
    slug: "reklam-tabela",
    label: "Reklam Tabela",
    navLabel: "Reklam Tabela",
    h1: "Reklam ve tabela ürünleri",
    title: "Reklam Tabela — Lightbox, Dekota, Araç Folyo",
    description:
      "Işıklı lightbox tabela, dekota levha, plastik reklam dubası, araç magneti ve folyo. İşletme cephesi ve araç filosu için tabela çözümleri.",
    intro:
      "İşletme cephesi ve araç filosu görünürlüğü: gece de okunan LED lightbox tabelalar, cephe ve yönlendirme için dekota levha, kaldırım ve otopark için plastik reklam dubası, araç giydirmede kullanılan yapışkanlı folyo ile sökülüp takılabilen araç magneti. Ölçü konusunda emin değilseniz teklif formundan ölçü desteği isteyebilirsiniz.",
    categorySlugs: [
      "lightbox",
      "dekota-baski",
      "plastik-reklam-dubasi",
      "folyo",
      "arac-magneti",
      "oto-paspas",
    ],
  },
  {
    slug: "sektorel-urunler",
    label: "Sektörel Ürünler",
    navLabel: "Sektörel Ürünler",
    h1: "Sektöre özel baskı ürünleri",
    title: "Sektörel Ürünler — Amerikan Servis, Kese Kağıdı",
    description:
      "Restoran, kafe, otel ve perakende için amerikan servis, kese kağıdı, çanta, kapı askı broşürü, araç sticker ve oto paspas baskısı.",
    intro:
      "Restoran, kafe, otel ve perakende işletmelerinin düzenli olarak bastırdığı ürünler: masa üstü amerikan servis, logolu kese kağıdı ve çanta, kapıya asılan broşür, araç sticker ve tek kullanımlık oto paspas. Bu ürünlerin çoğu toplu üretilir; sektörünüzü seçip teklif formunu doldurursanız kullanım adedinize göre fiyat çıkarırız.",
    categorySlugs: [
      "amerikan-servis",
      "canta-kese",
      "kapi-aski-brosur",
      "arac-sticker",
      "oto-paspas",
      "brosur",
      "vinil-branda-afis",
      "folyo",
      "arac-magneti",
    ],
  },
  {
    slug: "isg-uyari-levhalari",
    label: "İSG Uyarı Levhaları",
    navLabel: "İSG Uyarı Levhaları",
    h1: "İş güvenliği uyarı levhaları",
    title: "İSG Uyarı Levhaları — Yasaklayıcı, Emredici",
    description:
      "Yönetmeliğe uygun iş güvenliği levhaları: uyarı, yasaklayıcı, emredici/KKD, acil çıkış, yangın, elektrik, GES ve trafik levhaları. Dekota, folyo ve fosforlu seçenek.",
    intro:
      "Sağlık ve Güvenlik İşaretleri Yönetmeliği'nin istediği renk ve şekil kurallarına göre üretilen levhalar: yasaklayıcı işaretler kırmızı, uyarı işaretleri sarı, emredici (KKD) işaretler mavi, acil çıkış ve ilk yardım işaretleri yeşil. Her levha üç malzemede sunulur — iç ve dış mekân için sert PVC dekota, düz yüzeye yapıştırma için yapışkanlı folyo, karanlıkta görünürlük gereken kaçış yolları için fosforlu.",
    categorySlugs: [
      "is-guvenligi-uyari-ikaz",
      "is-guvenligi-yasaklayici",
      "is-guvenligi-emredici-kkd",
      "is-guvenligi-acil-ilk-yardim",
      "is-guvenligi-yangin",
      "is-guvenligi-elektrik-voltaj",
      "is-guvenligi-ges",
      "is-guvenligi-trafik-saha",
      "is-guvenligi-kalite-kontrol",
      "is-guvenligi-bilgilendirme-talimat",
    ],
  },
];

export function getProductGroup(slug: string): ProductGroup | undefined {
  return PRODUCT_GROUPS.find((g) => g.slug === slug);
}

/**
 * Menü grubunun GİDECEĞİ indekslenebilir adres.
 *
 * Sıra: (1) kod tarafındaki grup hub'ı, (2) grup tek kategoriyse o kategorinin kendi
 * sayfası (Kartvizit böyle), (3) hiçbiri tutmazsa DB'deki href — yani admin yeni bir grup
 * eklerse kutu çalışmaya devam eder, sadece eski filtre adresine gider.
 */
export function grubaGoreHref(navLabel: string, dbHref: string): string {
  const grup = PRODUCT_GROUPS.find((g) => g.navLabel === navLabel);
  if (grup) return `/kategoriler/${grup.slug}`;

  const qs = dbHref.indexOf("?");
  if (qs >= 0) {
    const kategoriler = new URLSearchParams(dbHref.slice(qs + 1)).get("kategoriler");
    const slugs = (kategoriler ?? "").split(",").map((s) => s.trim()).filter(Boolean);
    if (slugs.length === 1) return `/kategori/${slugs[0]}`;
  }
  return dbHref;
}
