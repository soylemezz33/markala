import type { Product } from "@markala/types";
import { PRODUCTION_TOLERANCE_PARAGRAPH } from "./notes";
import { matbaaProducts } from "./products-matbaa";
import { matbaaProducts2 } from "./products-matbaa-2";
import { matbaaProducts3 } from "./products-matbaa-3";

/**
 * Ürün görselleri yerel /public/images/products/[slug]/ altında.
 * Path: /images/products/[slug]/[index].jpg (Hasan tarafından yüklenecek).
 * Görsel yoksa /api/mockup endpoint'i (Next.js API route) yedek SVG döner.
 *
 * Bu dosya artık 3 modülden gelir:
 *  - products-matbaa.ts (kartvizit, broşür ailesi, el ilanı, afiş)
 *  - products-matbaa-2.ts (antetli, zarflar, magnet, amerikan servis, kapı askı, cepli dosya)
 *  - products-matbaa-3.ts (etiket, makbuz, paspas, bloknot ailesi, notluk, çanta)
 *  - legacyProducts (aşağıda) — dış mekan reklam, plaket, madalya, kupa, kaşe vb.
 *
 * Tüm ürünlerin description sonuna PRODUCTION_TOLERANCE_PARAGRAPH (%1-5 fire notu) otomatik
 * eklenir; idempotent — zaten içerikte varsa tekrar eklenmez.
 */
/** Görsel URL — şimdilik mockup endpoint, ileride yerel /images/products/[slug]/X.jpg geri çevrilebilir */
const prodImg = (slug: string, i: number = 1) => `/api/mockup?slug=${slug}&v=${i}&w=1200&h=1200`;

const FIRE_TAIL = PRODUCTION_TOLERANCE_PARAGRAPH.trim();
const withFireNote = (p: Product): Product => ({
  ...p,
  description: p.description.includes(FIRE_TAIL.slice(0, 40))
    ? p.description
    : `${p.description}${PRODUCTION_TOLERANCE_PARAGRAPH}`,
});

const legacyRaw: Product[] = [
  // ========================================================================
  // (KARTVİZİT eski varyantları products-matbaa.ts'e taşındı — buradan kaldırıldı)
  // ========================================================================
  // ========================================================================
  // VİNİL BRANDA AFİŞ — 2 varyant
  // ========================================================================
  {
    slug: "vinil-branda-440gr",
    name: "Vinil Branda Afiş — 440 gr",
    categorySlug: "vinil-branda-afis",
    sku: "MK-BRD-440-001",
    brand: "Markala",
    shortDescription: "Dış mekan dayanıklı 440 gr branda, m² fiyatlandırma",
    description:
      "Türkiye'nin dört iklim koşuluna dayanıklı 440 gram PVC branda üzerine UV korumalı solvent baskı uygulanan vinil afişimiz; mağaza vitrini, açılış pankartı, fuar standı, inşaat perdesi ve iskele giydirmesinde en çok tercih edilen üründür. İstediğiniz ebatta (en x boy cm bazında) m² hesabıyla üretilir; minimum 30 cm, maksimum 500 cm aralığında çalışır. Kenarları katlamalı, halkalı (50 cm aralıklarla), ya da germe + halka kombinasyonuyla teslim edilir. 1 m²'nin altındaki küçük işlere otomatik dikiş + kopça eklenir. Solmaya, yağmura ve rüzgâra karşı en az 24 ay garantilidir.",
    basePrice: 0,
    startingPrice: 110,
    sizeLabel: "m² hesabı",
    productionTime: "2-3 iş günü",
    images: [prodImg("vinil-branda-440gr", 1), prodImg("vinil-branda-440gr", 2), prodImg("vinil-branda-440gr", 3)],
    badges: ["cok-satilan"],
    bestseller: true,
    rating: { average: 4.7, count: 189 },
    features: [
      "440 gr PVC branda — Türkiye iklimine dayanıklı",
      "UV korumalı solvent baskı — 24 ay solma garantisi",
      "Mat veya parlak yüzey seçeneği",
      "Halkalı, katlamalı veya germe + halka teslim",
      "1 m²'den küçük işlerde otomatik dikiş + kopça",
      "Kolon dikiş ve özel form ekstraları",
    ],
    useCases: [
      "Mağaza açılış pankartı ve indirim afişi",
      "İnşaat şantiyesi perdesi ve iskele giydirme",
      "Fuar, kongre ve konferans tanıtım pankartı",
      "Spor sahası kenar reklamları",
      "Restoran cephesi ve dış mekan yönlendirme",
      "Düğün, kına, sünnet organizasyonu pankartları",
    ],
    specifications: [
      { label: "Malzeme", value: "440 gr PVC vinil branda" },
      { label: "Baskı", value: "Solvent / eco-solvent UV korumalı" },
      { label: "Ebat Aralığı", value: "30 cm - 500 cm (en/boy)" },
      { label: "Yüzey", value: "Mat veya parlak" },
      { label: "Kenar İşlemi", value: "Katlama, halkalı (50 cm), germe + halka" },
      { label: "Dayanım", value: "Dış mekanda 24+ ay solmaz" },
      { label: "Üretim Süresi", value: "2-3 iş günü" },
    ],
    faqs: [
      { q: "Branda fiyatı nasıl hesaplanıyor?", a: "Birim fiyat 138 TL/m² olarak başlar. Girdiğiniz en x boy değeri otomatik m²'ye çevrilir, kenar işlemi ve ekstralar (germe, kolon dikiş vb.) eklenir. 1 m²'nin altındaki işlere otomatik 60 TL dikiş + kopça eklenir, çünkü küçük üretimlerde işçilik oranı yüksektir." },
      { q: "Halka aralığı ne kadardır?", a: "Standart olarak her 50 cm'de bir paslanmaz halka çakılır. Daha sık (25 cm) veya daha seyrek halka istiyorsanız sipariş notunda belirtin; ek ücretsiz uygulanır." },
      { q: "Kaç yıl dayanır?", a: "Türkiye iklim koşullarında, dik ve gerilmiş halde asılı kalan 440 gr branda en az 24 ay solmaz. Akdeniz ve Ege gibi yoğun UV alan bölgelerde 18 ay sonra renk kaybı görünür hale gelebilir; bu durumda 510 gr versiyonu öneririz." },
      { q: "Tasarım dosyamı nasıl göndermeliyim?", a: "CMYK 150 dpi (büyük ebat için yeterli), 2 cm taşma payı bırakılmış PDF formatında. Tasarım yoksa ücretsiz şablonlarımızdan başlayabilir veya 89 TL'den itibaren özel tasarım hizmeti alabilirsiniz." },
    ],
    relatedSlugs: ["mesh-branda", "rollup-standart", "yelken-bayrak-damla"],
    parameters: [
      {
        id: "yuzey", label: "Yüzey Tipi", kind: "radio", required: true, defaultOptionId: "mat",
        options: [
          { id: "mat", label: "Mat", priceModifier: 0 },
          { id: "parlak", label: "Parlak", priceModifier: 0 },
        ],
      },
      {
        id: "kenar", label: "Kenar İşlemi", kind: "radio", required: true, defaultOptionId: "katlama",
        options: [
          { id: "katlama", label: "Sadece katlama", priceModifier: 0 },
          { id: "halkali", label: "Halkalı (50 cm arayla)", priceModifier: 80 },
          { id: "katlama-halkali", label: "Katlama + Halka", priceModifier: 120 },
        ],
      },
      {
        id: "ebat", label: "Ebat (en × boy cm)", kind: "dimension", required: true,
        pricePerSqm: 138, minDimension: 30, maxDimension: 500, defaultWidth: 100, defaultHeight: 100,
        extras: [
          { id: "kucuk-is-dikis", label: "1 m²'den küçük işler dikiş + kopça", flatFee: 60, autoBelow1Sqm: true },
          { id: "kolon-dikis", label: "Kolon Dikiş (m)", perimeterPricePerM: 30 },
          { id: "germe", label: "Germe + Halkalı Teslim", flatFee: 145 },
        ],
      },
    ],
    seo: {
      title: "Vinil Branda Afiş Baskı — 440 gr Dış Mekan, m² 138 TL",
      description: "440 gr PVC branda üzerine UV dayanıklı solvent baskı, m² 138 TL'den. İstediğiniz ebatta, halkalı veya katlamalı teslim. Mağaza, açılış, inşaat ve fuar için.",
      keywords: ["branda baskı", "vinil branda", "afiş baskı", "440 gr branda", "açılış pankartı", "iskele brandası", "outdoor afiş", "branda fiyatları"],
    },
  },
  {
    slug: "mesh-branda",
    name: "Mesh (Gözenekli) Branda",
    categorySlug: "vinil-branda-afis",
    sku: "MK-BRD-MSH-002",
    brand: "Markala",
    shortDescription: "Rüzgar geçirgen, iskele ve cephe için mesh branda",
    description:
      "270 gram gözenekli mesh kumaş üzerine UV dayanıklı solvent baskı uygulanan mesh branda; rüzgâr yükünü %60'a kadar azalttığı için yüksek katlı bina cephesi giydirme, iskele perde, açık fuar standı ve stadyum reklamları için zorunlu bir tercihtir. Hem iç hem dış mekanda kullanılabilir; yağmurda çabuk kurur, esnek yapısı sayesinde kıvrılarak taşınabilir. Sadece katlama veya katlama + halka teslim seçenekleriyle ve istenen her ebatta üretilir.",
    basePrice: 0,
    startingPrice: 145,
    sizeLabel: "m² hesabı",
    productionTime: "3-4 iş günü",
    images: [prodImg("mesh-branda", 1), prodImg("mesh-branda", 2)],
    rating: { average: 4.6, count: 47 },
    features: [
      "270 gr mesh kumaş — %60 rüzgâr geçirgenliği",
      "UV dayanıklı solvent baskı — dış mekan yıllık",
      "Yüksek katlı bina ve iskele için güvenli",
      "Hızlı kuruma — yağmur sonrası saatler içinde",
      "Katlama + halka teslim opsiyonu",
    ],
    useCases: [
      "Yüksek katlı bina cephe giydirme",
      "İnşaat iskelesi perde reklamı",
      "Açık fuar ve festival standları",
      "Stadyum saha kenar reklamları",
      "Belediye, kamu duyuru pankartları",
    ],
    specifications: [
      { label: "Malzeme", value: "270 gr PVC mesh kumaş" },
      { label: "Geçirgenlik", value: "%60 rüzgâr geçirgenliği" },
      { label: "Baskı", value: "UV dayanıklı solvent" },
      { label: "Ebat Aralığı", value: "100 cm - 600 cm (en/boy)" },
      { label: "Üretim Süresi", value: "3-4 iş günü" },
    ],
    faqs: [
      { q: "Mesh branda nerede kullanılmalıdır?", a: "Rüzgâr yükü taşıyamayacak yüksek katlı binalarda, iskelelerde ve sürekli açık alanlarda. Klasik vinil branda rüzgârla birlikte yırtılma veya bağlantı noktasını koparma riski taşıdığından bu noktalarda mesh tercih edilmelidir." },
      { q: "Görsel netliği klasik brandadan az mı?", a: "Çok küçük bir farkla evet — gözenekler nedeniyle ince yazılar yakından bakıldığında belirgin görünebilir. Ancak 5+ metre uzaklıktan algılama farkı sıfırlanır; bu yüzden uzaktan okunan reklamlarda ideal." },
    ],
    relatedSlugs: ["vinil-branda-440gr", "yelken-bayrak-damla"],
    parameters: [
      {
        id: "kenar", label: "Kenar İşlemi", kind: "radio", required: true, defaultOptionId: "katlama-halkali",
        options: [
          { id: "katlama", label: "Sadece katlama", priceModifier: 0 },
          { id: "katlama-halkali", label: "Katlama + Halka", priceModifier: 120 },
        ],
      },
      {
        id: "ebat", label: "Ebat (en × boy cm)", kind: "dimension", required: true,
        pricePerSqm: 175, minDimension: 100, maxDimension: 600, defaultWidth: 200, defaultHeight: 300,
        extras: [
          { id: "kucuk-is-dikis", label: "1 m²'den küçük işler dikiş + kopça", flatFee: 60, autoBelow1Sqm: true },
          { id: "kolon-dikis", label: "Kolon Dikiş (m)", perimeterPricePerM: 35 },
          { id: "germe", label: "Germe + Halkalı Teslim", flatFee: 165 },
        ],
      },
    ],
    seo: {
      title: "Mesh Branda Baskı — Gözenekli, Rüzgâr Geçirgen 270 gr",
      description: "270 gr gözenekli mesh branda üzerine UV dayanıklı baskı, m² 175 TL'den. Yüksek bina cephesi, iskele ve fuar için %60 rüzgâr geçirgenliği.",
      keywords: ["mesh branda", "gözenekli branda", "iskele brandası", "cephe giydirme", "rüzgar geçirgen branda", "bina giydirme afişi"],
    },
  },

  // ========================================================================
  // ROLL-UP — 1 ürün
  // ========================================================================
  {
    slug: "rollup-standart",
    name: "Standart Roll-Up — 85 x 200 cm",
    categorySlug: "rollup",
    sku: "MK-RLP-STD-001",
    brand: "Markala",
    shortDescription: "Alüminyum gövdeli, taşıma çantalı standart roll-up",
    description:
      "Türkiye'de fuar, kongre, mağaza tanıtım ve etkinlik organizasyonlarının vazgeçilmez taşınabilir afiş çözümü olan roll-up standlarımız; alüminyum gövde, otomatik geri sarma mekanizması ve yumuşak taşıma çantasıyla birlikte teslim edilir. Standart 85x200 cm ebatta veya 60x160, 100x200, 120x200 cm seçenekleriyle, ekonomik ya da çift kilitli premium gövde kalitesinde sunulur. 200 gr/m² mat polyester malzeme üzerine yüksek çözünürlüklü baskı, kıvrılma ve bükülmeye karşı dayanıklıdır. 2 iş günü içinde üretilir; tek el ile 30 saniyede kurulur.",
    basePrice: 480,
    startingPrice: 480,
    sizeLabel: "85 x 200 cm",
    productionTime: "2 iş günü",
    images: [prodImg("rollup-standart", 1), prodImg("rollup-standart", 2), prodImg("rollup-standart", 3)],
    badges: ["cok-satilan", "hizli-sevkiyat"],
    bestseller: true,
    rating: { average: 4.9, count: 156 },
    features: [
      "Alüminyum gövde, otomatik geri sarma mekanizması",
      "Yumuşak fermuarlı taşıma çantası dahil",
      "Ekonomik veya premium (çift kilit) gövde seçeneği",
      "200 gr/m² mat polyester baskı yüzeyi",
      "60x160 / 85x200 / 100x200 / 120x200 cm ebatlar",
      "30 saniyede tek elle kurulum, 2 iş günü üretim",
    ],
    useCases: [
      "Fuar ve kongre standları",
      "Mağaza içi kampanya tanıtımı",
      "Konferans, seminer ve eğitim salonları",
      "Otel lobi ve resepsiyon yönlendirme",
      "Düğün organizasyonu ve karşılama panoları",
    ],
    specifications: [
      { label: "Standart Ebat", value: "85 x 200 cm" },
      { label: "Alternatif Ebatlar", value: "60x160 / 100x200 / 120x200 cm" },
      { label: "Gövde", value: "Alüminyum, ekonomik veya çift kilitli premium" },
      { label: "Baskı Yüzeyi", value: "200 gr/m² mat polyester" },
      { label: "Aksesuar", value: "Yumuşak fermuarlı taşıma çantası dahil" },
      { label: "Üretim Süresi", value: "2 iş günü" },
    ],
    faqs: [
      { q: "Premium ile ekonomik gövde arasındaki fark nedir?", a: "Ekonomik gövde tek kilit + standart alüminyum profil ile gelir, 1-2 yıllık etkinlik kullanımına uygundur. Premium gövde çift kilit, daha kalın profil ve daha gergin yay sistemine sahiptir; haftalık-günlük taşımalı yoğun fuar kullanımında 5+ yıl ömür sunar." },
      { q: "Görseli kendim mi tasarlamalıyım?", a: "Hayır. Tasarım yoksa ücretsiz şablonlarımızdan birini seçebilir veya 89 TL'den itibaren tasarım hizmetimizi kullanabilirsiniz. Hazır PDF dosyası göndermek için 85x200 cm ebatta, kenarda 5 cm boş pay (alt mekanizma) bırakılmalı." },
      { q: "Roll-up afişini sonradan değiştirebilir miyim?", a: "Evet. Sadece baskı kısmı (afişi) değiştirilebilir; gövdeyi saklayıp yeni baskıyı sipariş verebilirsiniz. Sadece afiş baskısı 250 TL'den başlar." },
    ],
    relatedSlugs: ["yelken-bayrak-damla", "vinil-branda-440gr", "lightbox-led-100cm"],
    parameters: [
      {
        id: "kalite", label: "Gövde Kalitesi", kind: "radio", required: true, defaultOptionId: "ekonomik",
        options: [
          { id: "ekonomik", label: "Ekonomik", priceModifier: 0 },
          { id: "premium", label: "Premium (çift kilit)", priceModifier: 180 },
        ],
      },
      {
        id: "ebat", label: "Ebat", kind: "radio", required: true, defaultOptionId: "85x200",
        options: [
          { id: "60x160", label: "60 x 160 cm", priceModifier: -120 },
          { id: "85x200", label: "85 x 200 cm (standart)", priceModifier: 0 },
          { id: "100x200", label: "100 x 200 cm", priceModifier: 90 },
          { id: "120x200", label: "120 x 200 cm", priceModifier: 220 },
        ],
      },
      { id: "adet", label: "Adet", kind: "quantity", required: true, unitPrice: 0, quantityPresets: [1, 2, 5, 10] },
    ],
    seo: {
      title: "Roll-Up Stand Baskı — 85x200 cm Alüminyum Gövde, 480 TL",
      description: "Alüminyum gövdeli, taşıma çantalı roll-up stand 480 TL'den. 60x160, 85x200, 100x200, 120x200 cm ebatlar. 2 iş günü üretim, fuar ve mağazalar için.",
      keywords: ["roll up", "rollup baskı", "rollup stand", "85x200 rollup", "fuar standı", "alüminyum rollup", "mağaza standı", "rollup fiyatları"],
    },
  },

  // ========================================================================
  // YELKEN BAYRAK
  // ========================================================================
  {
    slug: "yelken-bayrak-damla",
    name: "Damla Yelken Bayrak",
    categorySlug: "yelken-bayrak",
    sku: "MK-YLK-DML-001",
    brand: "Markala",
    shortDescription: "Damla form, çapraz kesim — 75 x 300 cm standart",
    description:
      "Açık alan etkinliklerinde, mağaza önlerinde ve sahil-kamp alanlarında dikkat çekmek için tasarlanmış damla form yelken bayraklarımız; 110 gram polyester saten kumaş üzerine sublime baskı tekniğiyle üretilir — yıkamada solmaz, UV ışınlarına 18+ ay dayanıklıdır. Standart 75x300 cm ya da 60x240 / 90x350 cm ebatlarında, tek veya çift yüz baskı opsiyonuyla; toprağa kazıklı, beton üstü kare taban veya araç tabanı seçenekleriyle birlikte komple set olarak teslim edilir.",
    basePrice: 320,
    startingPrice: 320,
    sizeLabel: "75 x 300 cm",
    productionTime: "3-4 iş günü",
    images: [prodImg("yelken-bayrak-damla", 1), prodImg("yelken-bayrak-damla", 2)],
    badges: ["cok-satilan"],
    bestseller: true,
    rating: { average: 4.8, count: 92 },
    features: [
      "110 gr polyester saten kumaş",
      "Sublime baskı — yıkamada solmaz",
      "UV dayanımı 18+ ay",
      "60x240 / 75x300 / 90x350 cm ebat seçenekleri",
      "Tek veya çift yüz baskı",
      "Kazıklı, kare taban veya araba tabanlı set",
    ],
    useCases: [
      "Mağaza önü dikkat çekme",
      "Açılış ve etkinlik karşılama",
      "Sahil, kamp, otel havuz çevresi",
      "Spor turnuvası, rallı ve organizasyon",
      "Açık hava fuar ve festival standları",
    ],
    specifications: [
      { label: "Standart Ebat", value: "75 x 300 cm" },
      { label: "Alternatif", value: "60x240 / 90x350 cm" },
      { label: "Kumaş", value: "110 gr polyester saten" },
      { label: "Baskı", value: "Sublime — yıkamada solmaz" },
      { label: "Taban Seçenekleri", value: "Kazık (toprak) / Kare (beton) / Araba tabanı" },
      { label: "Üretim Süresi", value: "3-4 iş günü" },
    ],
    faqs: [
      { q: "Hangi taban benim için uygun?", a: "Toprak, çim veya kum zeminlerde kazıklı taban yeterli olur. Beton, asfalt veya kapalı mekan için kare taban (içine su/kum doldurulur) gerekir. Aracın yanında reklam yapacaksanız araba tabanı tekerleğin altına yerleştirilir, aracın ağırlığıyla sabitlenir." },
      { q: "Çift yüz baskının avantajı nedir?", a: "Tek yüz baskıda arka taraf ayna görüntüsü olarak görünür; bu özellikle yazılarda okuma sorunu yaratır. Çift yüz baskıda iki ayrı katman arasına ışık geçirmez kumaş yerleştirilir ve her iki taraftan da net okuma sağlanır. Yüksek trafikli alanlarda öneririz." },
    ],
    relatedSlugs: ["kirlangic-bayrak-3m", "rollup-standart", "vinil-branda-440gr"],
    parameters: [
      {
        id: "ebat", label: "Ebat", kind: "radio", required: true, defaultOptionId: "75x300",
        options: [
          { id: "60x240", label: "60 x 240 cm", priceModifier: -60 },
          { id: "75x300", label: "75 x 300 cm (standart)", priceModifier: 0 },
          { id: "90x350", label: "90 x 350 cm", priceModifier: 120 },
        ],
      },
      {
        id: "yon", label: "Baskı Yönü", kind: "radio", required: true, defaultOptionId: "tek",
        options: [
          { id: "tek", label: "Tek Yüz", priceModifier: 0 },
          { id: "cift", label: "Çift Yüz", priceModifier: 110 },
        ],
      },
      {
        id: "taban", label: "Taban", kind: "radio", required: true, defaultOptionId: "kare-taban",
        options: [
          { id: "kazik", label: "Kazıklı (toprak için)", priceModifier: 0 },
          { id: "kare-taban", label: "Kare Taban", priceModifier: 150 },
          { id: "araba-tabani", label: "Araba Tabanlı", priceModifier: 220 },
        ],
      },
      { id: "adet", label: "Adet", kind: "quantity", required: true, unitPrice: 0, quantityPresets: [1, 2, 5, 10] },
    ],
    seo: {
      title: "Damla Yelken Bayrak Baskı — 75x300 cm Set, Tek/Çift Yüz",
      description: "110 gr polyester saten damla yelken bayrak 320 TL'den. 60x240, 75x300, 90x350 cm ebatlar; kazık, kare taban, araba tabanı opsiyonlu komple set.",
      keywords: ["yelken bayrak", "damla bayrak", "açık hava bayrak", "mağaza bayrağı", "etkinlik bayrağı", "yelken bayrak fiyat"],
    },
  },

  // ========================================================================
  // KUPA
  // ========================================================================
  {
    slug: "klasik-beyaz-kupa",
    name: "Klasik Beyaz Kupa",
    categorySlug: "kupa",
    sku: "MK-KUP-WHT-001",
    brand: "Markala",
    shortDescription: "Sublimasyon baskılı 330 ml beyaz seramik kupa",
    description:
      "Promosyon ürünlerinin değişmez klasiği olan 330 ml beyaz seramik kupalarımız; AA kalite porselen üzerine sublimasyon baskı tekniğiyle, fotoğraf, logo veya özel tasarımlarınızı kalıcı olarak işler. Bulaşık makinasında 100+ yıkama sonrası bile renkler solmaz; 80°C'ye kadar sıcak içeceklerde güvenli kullanılır. Tek adet promosyon hediyesi olarak veya 50-100 adet kurumsal hediye seti olarak sipariş edilebilir; düğün şahit hediyesi, doğum günü, kurumsal yılbaşı ve tanıtım kampanyaları için en çok tercih edilen üründür.",
    basePrice: 45,
    startingPrice: 45,
    sizeLabel: "330 ml",
    productionTime: "2-3 iş günü",
    images: [prodImg("klasik-beyaz-kupa", 1), prodImg("klasik-beyaz-kupa", 2)],
    badges: ["hizli-sevkiyat"],
    bestseller: true,
    rating: { average: 4.9, count: 312 },
    features: [
      "AA kalite 330 ml beyaz porselen",
      "Sublimasyon baskı — yıkamada solmaz",
      "Bulaşık makinası uyumlu",
      "Fotoğraf, logo, çoklu yüz tasarımı uygulanabilir",
      "1 adetten 250+ adete kadar esnek sipariş",
    ],
    useCases: [
      "Kurumsal promosyon ve yılbaşı hediyeleri",
      "Düğün şahit, sünnet, doğum günü hediyeleri",
      "Anneler/Babalar günü kişisel fotoğraflı hediye",
      "Kafe ve restoranlar için özel kupa serileri",
      "Tanıtım kampanyaları, fuar dağıtımları",
    ],
    specifications: [
      { label: "Hacim", value: "330 ml (standart)" },
      { label: "Malzeme", value: "AA kalite beyaz porselen" },
      { label: "Baskı", value: "Sublimasyon (kalıcı, yıkanmaya dayanıklı)" },
      { label: "Bulaşık Makinası", value: "Uyumlu" },
      { label: "Üretim Süresi", value: "2-3 iş günü" },
    ],
    faqs: [
      { q: "Tek adet sipariş verebilir miyim?", a: "Evet. Doğum günü ve kişisel hediyeler için tek adet sipariş kabul ediyoruz. 1 adet için 45 TL, 6 adet için 240 TL, 12 adet için 432 TL gibi paketlerle daha avantajlı fiyatlar var." },
      { q: "Hangi tasarım dosyasını gönderebilirim?", a: "JPG, PNG (300 dpi, RGB), PDF veya AI dosyaları kabul edilir. Yüksek çözünürlüklü fotoğraflar için en az 2000x900 piksel öneririz; aksi halde baskıda pikselli görünebilir." },
      { q: "Renkli kupa seçeneği var mı?", a: "Bu üründe sadece beyaz mevcut. Magic kupa (siyahken sıcak içecekle açılan), iç renkli veya pastel renkli kupalar için ayrı ürün listemize göz atın." },
    ],
    relatedSlugs: ["madalya-7cm-kurdela", "kristal-plaket"],
    parameters: [
      { id: "adet", label: "Adet", kind: "quantity", required: true, unitPrice: 45, quantityPresets: [1, 6, 12, 24, 50] },
    ],
    seo: {
      title: "Beyaz Kupa Baskı — 330 ml Sublimasyon, Kişiye Özel 45 TL",
      description: "AA kalite 330 ml beyaz porselen kupaya sublimasyon baskı 45 TL'den. Fotoğraf, logo, kurumsal tasarım — bulaşık makinası uyumlu, 2-3 iş günü üretim.",
      keywords: ["kupa baskı", "kişiye özel kupa", "fotoğraflı kupa", "promosyon kupa", "kurumsal kupa", "logolu kupa", "sublimasyon kupa"],
    },
  },

  // ========================================================================
  // KIRLANGIÇ BAYRAK
  // ========================================================================
  {
    slug: "kirlangic-bayrak-3m",
    name: "Kırlangıç Bayrak — 3m İpli Set",
    categorySlug: "kirlangic-bayrak",
    sku: "MK-KRL-3M-001",
    brand: "Markala",
    shortDescription: "20 cm üçgen, 3 metrelik ipe dizili 15 adet bayrak",
    description:
      "Düğün, kına, sünnet, açılış ve sokak süslemelerinin renkli simgesi olan kırlangıç bayraklarımız; 110 gr polyester saten kumaş üzerine sublime baskı uygulanmış 20x30 cm üçgen formdan oluşur ve 3 metrelik beyaz ipe sıralı olarak dikilir. Karışık 5 renk hazır setler hızlı sevkiyat için stoklu; özel logo veya yazı baskılı setler 2-3 iş günü içinde üretilir. Cadde süslemesi için onlarca metre, mağaza vitrini için tek set olarak sipariş edilebilir.",
    basePrice: 180,
    startingPrice: 180,
    sizeLabel: "20 x 30 cm üçgen · 3m ip",
    productionTime: "2-3 iş günü",
    images: [prodImg("kirlangic-bayrak-3m", 1), prodImg("kirlangic-bayrak-3m", 2)],
    badges: ["hizli-sevkiyat"],
    rating: { average: 4.6, count: 78 },
    features: [
      "110 gr polyester saten — yıkanabilir",
      "20x30 cm üçgen form, 3 m ipte 15 adet",
      "Hazır 5 renk karışık set veya özel logolu baskı",
      "Düğün, açılış, etkinlik için ideal",
      "Çoklu metrelerde indirimli paket",
    ],
    useCases: [
      "Düğün, nişan, kına süslemesi",
      "Mağaza açılışı ve cadde süslemesi",
      "Sünnet ve doğum günü organizasyonu",
      "Festival ve etkinlik dekorasyonu",
      "Çocuk parkı ve okul kutlamaları",
    ],
    specifications: [
      { label: "Üçgen Ebat", value: "20 x 30 cm" },
      { label: "İp Uzunluğu", value: "3 m (15 adet bayrak)" },
      { label: "Kumaş", value: "110 gr polyester saten" },
      { label: "Baskı", value: "Sublime — solmaz" },
      { label: "Üretim Süresi", value: "2-3 iş günü (hazır karışık 1 iş günü)" },
    ],
    faqs: [
      { q: "Renk sıralamasını ben mi belirleyebilirim?", a: "Evet. Karışık set sipariş ettiyseniz sipariş notunda renk düzenini belirtebilirsiniz; aksi halde standart sıralama uygulanır." },
      { q: "Logolu baskı ne kadar sürer?", a: "Özel logo / yazı baskılı setler 2-3 iş günü içinde üretilir. Logo çözünürlüğü düşükse baskı kalitesi düşebilir; mümkünse vektörel veya 300 dpi PNG gönderin." },
    ],
    relatedSlugs: ["yelken-bayrak-damla", "masa-bayragi-krom"],
    parameters: [
      {
        id: "renk", label: "Renk Düzeni", kind: "radio", required: true, defaultOptionId: "karisik",
        options: [
          { id: "karisik", label: "Karışık (5 renk)", priceModifier: 0 },
          { id: "ozel", label: "Özel logo basılı", priceModifier: 220 },
        ],
      },
      { id: "metre", label: "Toplam Metre", kind: "quantity", required: true, unitPrice: 60, quantityPresets: [3, 6, 12, 25] },
    ],
    seo: {
      title: "Kırlangıç Bayrak Baskı — 3m İpli Set, Düğün ve Açılış İçin",
      description: "20x30 cm üçgen kırlangıç bayrak, 3 m ipe dizili 15 adet — 180 TL'den. Karışık 5 renk veya özel logolu, düğün, açılış, mağaza süslemesi için.",
      keywords: ["kırlangıç bayrak", "üçgen bayrak", "düğün bayrağı", "açılış süsü", "renkli bayrak", "cadde süslemesi"],
    },
  },

  // ========================================================================
  // MASA BAYRAĞI
  // ========================================================================
  {
    slug: "masa-bayragi-krom",
    name: "Krom Direkli Masa Bayrağı",
    categorySlug: "masa-bayragi",
    sku: "MK-MSB-CRM-001",
    brand: "Markala",
    shortDescription: "15 x 22 cm saten kumaş, krom direk + ahşap taban",
    description:
      "Toplantı odaları, makam masaları, fuar standı ve resepsiyon sayaçlarının kurumsal göstergesi olan masa bayraklarımız; 110 gr polyester saten kumaş üzerine sublime baskı, parlatılmış krom direk ve cilalı ahşap taban kombinasyonuyla teslim edilir. 15x22 cm standart ebatta tek veya çift yüz baskı seçeneğiyle, kurumsal logo, ülke bayrağı veya özel slogan basılabilir. 1 adetten 25+ adete kadar siparişlerde 3 iş günü içinde üretilir.",
    basePrice: 150,
    startingPrice: 150,
    sizeLabel: "15 x 22 cm",
    productionTime: "3 iş günü",
    images: [prodImg("masa-bayragi-krom", 1)],
    rating: { average: 4.7, count: 41 },
    features: [
      "15x22 cm standart ebat saten kumaş",
      "Sublime baskı — kalıcı, solmaz",
      "Parlatılmış krom direk + cilalı ahşap taban",
      "Tek veya çift yüz baskı seçeneği",
      "Toplantı, fuar, resepsiyon için ideal",
    ],
    useCases: [
      "Toplantı ve konferans masaları",
      "Yönetici odası, makam masaları",
      "Fuar ve sergi standları",
      "Resepsiyon ve karşılama bankoları",
      "Konsolosluk ve kamu kuruluşları",
    ],
    specifications: [
      { label: "Bayrak Ebadı", value: "15 x 22 cm" },
      { label: "Kumaş", value: "110 gr polyester saten" },
      { label: "Direk", value: "Parlatılmış krom (~30 cm)" },
      { label: "Taban", value: "Cilalı ahşap, oval form" },
      { label: "Üretim Süresi", value: "3 iş günü" },
    ],
    faqs: [
      { q: "Çoklu sipariş için indirim var mı?", a: "Evet. 5 adetten itibaren kademeli indirim uygulanır; 25 adetlik kurumsal toplantı seti talebiniz için müşteri hizmetleriyle iletişime geçebilirsiniz, özel teklif sunulur." },
      { q: "Direk ve tabanı ayrı sipariş edebilir miyim?", a: "Evet. Mevcut bayraklarınız varsa sadece krom direk + ahşap taban seti 75 TL'den ayrı sipariş verilebilir." },
    ],
    relatedSlugs: ["makam-bayragi-puskullu", "kristal-plaket"],
    parameters: [
      {
        id: "yon", label: "Baskı Yönü", kind: "radio", required: true, defaultOptionId: "cift",
        options: [
          { id: "tek", label: "Tek Yüz", priceModifier: 0 },
          { id: "cift", label: "Çift Yüz", priceModifier: 35 },
        ],
      },
      { id: "adet", label: "Adet", kind: "quantity", required: true, unitPrice: 150, quantityPresets: [1, 5, 10, 25] },
    ],
    seo: {
      title: "Masa Bayrağı — 15x22 cm Krom Direkli Saten, 150 TL",
      description: "15x22 cm saten kumaş masa bayrağı, krom direk + cilalı ahşap taban dahil. Tek/çift yüz baskı, toplantı ve makam için kurumsal kalite.",
      keywords: ["masa bayrağı", "krom direkli masa bayrağı", "kurumsal masa bayrağı", "toplantı bayrağı", "makam bayrağı küçük", "ofis bayrağı"],
    },
  },

  // ========================================================================
  // MAKAM BAYRAĞI
  // ========================================================================
  {
    slug: "makam-bayragi-puskullu",
    name: "Püsküllü Makam Bayrağı",
    categorySlug: "makam-bayragi",
    sku: "MK-MKB-PSK-001",
    brand: "Markala",
    shortDescription: "Sırma püsküllü, krom direk + üçayak taban",
    description:
      "Resmi makam ofisleri, valilikler, belediyeler, kamu binaları ve kurumsal resepsiyonlar için yüksek kaliteli makam bayrağımız; 130 gr polyester saten kumaş üzerine sublime baskı, sırma sarması veya metalik detay püskül, 2,2 m parlatılmış krom direk ve cilalı üçayak taban kombinasyonuyla teslim edilir. 100x150 cm standart ebatta, kurum logosu, Türk bayrağı veya özel arması işlenmiş şekilde 4-5 iş günü içinde üretilir. Resmi protokol kullanımına uygundur.",
    basePrice: 850,
    startingPrice: 850,
    sizeLabel: "100 x 150 cm",
    productionTime: "4-5 iş günü",
    images: [prodImg("makam-bayragi-puskullu", 1)],
    badges: ["yeni"],
    rating: { average: 4.9, count: 18 },
    features: [
      "100x150 cm 130 gr polyester saten",
      "Sırma sarması veya metalik detay püskül",
      "2,2 m parlatılmış krom direk",
      "Cilalı üçayak ahşap taban",
      "Resmi protokol kullanımına uygun",
    ],
    useCases: [
      "Valilik, belediye, kaymakamlık makam odaları",
      "Üniversite rektörlük ve dekanlık ofisleri",
      "Holding genel müdür, CEO ofisleri",
      "Konferans salonu protokol alanı",
      "Resmi resepsiyon ve karşılama",
    ],
    specifications: [
      { label: "Ebat", value: "100 x 150 cm" },
      { label: "Kumaş", value: "130 gr polyester saten" },
      { label: "Püskül", value: "Sırma sarması veya metalik detay" },
      { label: "Direk", value: "2,2 m parlatılmış krom" },
      { label: "Taban", value: "Cilalı üçayak ahşap" },
      { label: "Üretim Süresi", value: "4-5 iş günü" },
    ],
    faqs: [
      { q: "Türk bayrağı baskısı içerebilir mi?", a: "Evet. Türk Bayrağı Yönetmeliği'ne uygun resmi ölçü ve renklerle baskı yapabiliyoruz. Yönetmelik dışında deformasyon, çerçeveleme veya logo eklenmesi mümkün değildir." },
      { q: "Sadece direk + taban siparişi alıyor musunuz?", a: "Evet. Mevcut bayrağınız varsa direk + üçayak taban seti 350 TL'den ayrı sipariş verilebilir." },
    ],
    relatedSlugs: ["masa-bayragi-krom", "kristal-plaket"],
    parameters: [
      {
        id: "puskul", label: "Püskül", kind: "radio", required: true, defaultOptionId: "sarmasi",
        options: [
          { id: "sarmasi", label: "Sırma Sarması", priceModifier: 0 },
          { id: "metalik", label: "Metalik Detay", priceModifier: 180 },
        ],
      },
      { id: "adet", label: "Adet", kind: "quantity", required: true, unitPrice: 850, quantityPresets: [1, 2, 5] },
    ],
    seo: {
      title: "Makam Bayrağı — Püsküllü 100x150 cm, Krom Direk + Üçayak",
      description: "100x150 cm saten makam bayrağı, sırma püsküllü, 2.2 m krom direk + cilalı üçayak taban dahil. Valilik, belediye, kurumsal makam için 850 TL'den.",
      keywords: ["makam bayrağı", "püsküllü bayrak", "krom direkli bayrak", "kurumsal bayrak", "resmi bayrak", "valilik bayrağı"],
    },
  },

  // ========================================================================
  // ARAÇ MAGNETİ
  // ========================================================================
  {
    slug: "arac-magneti-30x40",
    name: "Araç Magneti — 30 x 40 cm",
    categorySlug: "arac-magneti",
    sku: "MK-MGN-3040-001",
    brand: "Markala",
    shortDescription: "0.8 mm magnet üzerine UV dayanıklı baskı",
    description:
      "Aracınızın boyasına zarar vermeden uygulanan ve istediğiniz an çıkarabildiğiniz 0,8 mm kalın magnet üzerine UV dayanıklı baskı yapılan araç magnetleri; servis araçları, kurye, taksi, taksicilik, gıda dağıtım, eczane ve mobil hizmetler için en pratik mobil reklam çözümüdür. 20x30 / 30x40 / 40x60 cm ebatlarında, dayanıklı yüzey kaplamasıyla yağmur, güneş ve araç yıkamaya yıllarca dayanır. Kullanmadığınız zaman çıkarıp düz bir yüzeyde saklayabilirsiniz.",
    basePrice: 220,
    startingPrice: 220,
    sizeLabel: "30 x 40 cm",
    productionTime: "2 iş günü",
    images: [prodImg("arac-magneti-30x40", 1)],
    badges: ["hizli-sevkiyat"],
    rating: { average: 4.6, count: 62 },
    features: [
      "0,8 mm magnet — boyaya zarar vermez",
      "UV dayanıklı baskı + koruyucu laminasyon",
      "20x30 / 30x40 / 40x60 cm ebatlar",
      "Çıkarılıp tekrar kullanılabilir",
      "Yağmur, güneş, araç yıkama dayanımı",
    ],
    useCases: [
      "Servis ve dağıtım araçları",
      "Taksi ve taşımacılık firmaları",
      "Eczane, klinik, veteriner mobil hizmet",
      "Kurye, yemek dağıtım servisleri",
      "Geçici kampanya ve promosyon araçları",
    ],
    specifications: [
      { label: "Kalınlık", value: "0,8 mm magnet" },
      { label: "Ebat Seçenekleri", value: "20x30 / 30x40 / 40x60 cm" },
      { label: "Baskı", value: "UV dayanıklı + laminasyon" },
      { label: "Üretim Süresi", value: "2 iş günü" },
    ],
    faqs: [
      { q: "Magnet aracın boyasını çizer mi?", a: "Hayır. 0,8 mm magnet ile boya arasındaki yüzey pürüzsüzdür. Ancak aracın yüzeyinde kum veya toz varken yapıştırırsanız sürtünmeyle çizilebilir; uygulamadan önce mutlaka aracın temizlenmesi önerilir." },
      { q: "Çıkardığımda iz kalır mı?", a: "Doğru kullanıldığında iz kalmaz. Magnet, manyetik çekim ile tutunur, hiçbir yapışkan kullanılmaz. 6 aydan uzun süre takılı kalan magnetlerde aracın o bölgesinde renk farkı (zaman içinde güneş etkisiyle çevresinin solması) görülebilir." },
    ],
    relatedSlugs: ["arac-sticker-yan", "guvenlik-levhasi-sigorta"],
    parameters: [
      {
        id: "ebat", label: "Ebat", kind: "radio", required: true, defaultOptionId: "30x40",
        options: [
          { id: "20x30", label: "20 x 30 cm", priceModifier: -60 },
          { id: "30x40", label: "30 x 40 cm", priceModifier: 0 },
          { id: "40x60", label: "40 x 60 cm", priceModifier: 95 },
        ],
      },
      { id: "adet", label: "Adet", kind: "quantity", required: true, unitPrice: 0, quantityPresets: [1, 2, 4, 10] },
    ],
    seo: {
      title: "Araç Magneti Baskı — 30x40 cm Çıkarılabilir, 220 TL",
      description: "0,8 mm araç magnet üzerine UV dayanıklı baskı 220 TL'den. 20x30, 30x40, 40x60 cm — boyaya zarar vermez, çıkarılıp tekrar kullanılabilir.",
      keywords: ["araç magneti", "araba magneti", "çıkarılabilir reklam", "araç giydirme magnet", "servis aracı reklam", "kurye magneti"],
    },
  },

  // ========================================================================
  // ARAÇ STICKER
  // ========================================================================
  {
    slug: "arac-sticker-yan",
    name: "Araç Yan Cam Sticker",
    categorySlug: "arac-sticker",
    sku: "MK-STK-VHC-001",
    brand: "Markala",
    shortDescription: "Kesimli folyo, kalıcı yapışkan, m² fiyatlı",
    description:
      "Aracınızın yan camında, kapısında veya kaportasında profesyonel görünüm için CNC lazer kesimli, UV dayanıklı yapışkanlı folyo. Matrix folyo (mat zemin), transparan folyo (cam üstü transparan zeminli) veya metalik folyo (gümüş/altın efekt) seçenekleriyle; tam araç giydirme için m² hesabıyla fiyatlandırılır. Şeffaf laminasyon koruması eklediğinizde 5+ yıl dayanır; doğru uygulamada aracın boyasına ve camına zarar vermeden çıkartılabilir.",
    basePrice: 0,
    startingPrice: 180,
    sizeLabel: "m² hesabı",
    productionTime: "2-3 iş günü",
    images: [prodImg("arac-sticker-yan", 1)],
    rating: { average: 4.7, count: 53 },
    features: [
      "UV dayanıklı kalıcı yapışkanlı folyo",
      "Matrix / transparan / metalik folyo seçenekleri",
      "CNC lazer ile vektörel kesim",
      "Şeffaf laminasyon ile 5+ yıl dayanım",
      "Tam araç giydirme veya logo/yazı kesimi",
    ],
    useCases: [
      "Kurumsal araç filosu giydirme",
      "Reklam aracı tam giydirme",
      "Mağaza, ofis vitrin yazıları",
      "Yan cam ve kaporta logo",
      "Yarış/ralli aracı sponsor stikerları",
    ],
    specifications: [
      { label: "Folyo", value: "Matrix / Transparan / Metalik (gümüş, altın)" },
      { label: "Kesim", value: "CNC lazer (vektörel dosya)" },
      { label: "Dayanım", value: "Laminasyonlu 5+ yıl, laminasyonsuz 2-3 yıl" },
      { label: "Ebat", value: "20-300 cm aralığında özel" },
      { label: "Üretim", value: "2-3 iş günü" },
    ],
    faqs: [
      { q: "Sticker uygulamasını siz mi yapıyorsunuz?", a: "İl içinde özel uygulama paketi (300 TL'den itibaren) sunabiliyoruz. İl dışına gönderilen siparişlerde uygulama bandı (transfer tape) ekleyerek yollarız; videolu kurulum kılavuzu ile %95+ kullanıcı kendisi başarıyla uygulayabilir." },
      { q: "Camlı aracın görüş alanını engeller mi?", a: "Standart yan cam sticker dış cepheden bakılınca renkli görünür, içeriden bakınca opak/koyu görünür. Sürücünün görüş alanını korumak için arka cam ve yan camlarda perforajlı (gözenekli) folyo kullanılır." },
    ],
    relatedSlugs: ["arac-magneti-30x40", "cam-folyosu-kesimli"],
    parameters: [
      {
        id: "tip", label: "Folyo Tipi", kind: "radio", required: true, defaultOptionId: "matrix",
        options: [
          { id: "matrix", label: "Matrix Folyo", priceModifier: 0 },
          { id: "transparan", label: "Transparan", priceModifier: 60 },
          { id: "metalik", label: "Metalik", priceModifier: 120 },
        ],
      },
      {
        id: "ebat", label: "Ebat (en × boy cm)", kind: "dimension", required: true,
        pricePerSqm: 215, minDimension: 20, maxDimension: 300, defaultWidth: 50, defaultHeight: 50,
        extras: [
          { id: "kesim", label: "CNC Lazer Kesim (özel form)", flatFee: 95 },
          { id: "laminasyon", label: "Şeffaf Laminasyon (UV koruma)", perimeterPricePerM: 15 },
        ],
      },
    ],
    seo: {
      title: "Araç Sticker — Yan Cam Folyo Baskı, CNC Lazer Kesim",
      description: "Araç yan cam ve kaporta için UV dayanıklı yapışkanlı folyo, CNC lazer kesim. Matrix, transparan ve metalik seçenek; tam araç giydirme.",
      keywords: ["araç sticker", "araç giydirme", "yan cam sticker", "kaporta folyo", "araba reklam sticker", "araç folyo baskı"],
    },
  },

  // ========================================================================
  // BROŞÜR
  // ========================================================================
  // ========================================================================
  // FOLYO
  // ========================================================================
  {
    slug: "cam-folyosu-kesimli",
    name: "Cam Vitrin Folyosu — Kesimli",
    categorySlug: "folyo",
    sku: "MK-FLY-CAM-001",
    brand: "Markala",
    shortDescription: "Mağaza vitrini için kesimli renkli folyo",
    description:
      "Mağaza vitrinlerine, ofis kapılarına ve cam yüzeylere uygulanan, 5 yıl dış mekan dayanıklılığı sunan renkli yapışkanlı folyo + CNC kesim hizmetimiz; siyah, beyaz veya metalik (altın/gümüş) renklerinde, m² hesabı ile fiyatlandırılır. CNC kesim ekstrası ile vektörel logo veya yazılarınız tek tek kesilir, uygulama bandı (transfer tape) ile bütün halinde tek seferde camınıza yapıştırılır. Kapı yazıları, vitrin sloganları, vergi numarası bilgisi ve dekoratif folyolar için en sık tercih edilen üründür.",
    basePrice: 0,
    startingPrice: 95,
    sizeLabel: "m² hesabı",
    productionTime: "1-2 iş günü",
    images: [prodImg("cam-folyosu-kesimli", 1)],
    rating: { average: 4.5, count: 36 },
    features: [
      "5 yıl dış mekan dayanıklı yapışkan folyo",
      "Siyah / beyaz / metalik (altın & gümüş) renk",
      "CNC kesim ile vektörel logo, yazı",
      "Uygulama bandı (transfer tape) ile kolay tek seferlik uygulama",
      "Cam, ahşap, metal, pleksi yüzeylere uygun",
    ],
    useCases: [
      "Mağaza vitrini logo ve yazıları",
      "Ofis kapısı isim, ünvan tabelası",
      "Restoran ve kafe menü tahtası",
      "Vergi numarası ve yasal bilgi yazıları",
      "Dekoratif cam giydirme (mat folyo bantları)",
    ],
    specifications: [
      { label: "Folyo", value: "Yapışkanlı vinil, 5 yıl dış mekan" },
      { label: "Renkler", value: "Siyah / beyaz / metalik (altın & gümüş)" },
      { label: "Kesim", value: "CNC lazer (vektörel dosya zorunlu)" },
      { label: "Ebat", value: "20 - 400 cm aralığında özel" },
      { label: "Üretim Süresi", value: "1-2 iş günü" },
    ],
    faqs: [
      { q: "Folyoyu cama nasıl yapıştırırım?", a: "Folyo + uygulama bandı sandviç olarak teslim edilir. Camı sabunlu suyla nemlendirin, transfer tape ile birlikte folyoyu cama yapıştırın, üzerinden plastik kart/spatula ile bastırın, ardından transfer tape'i 45° açıyla yavaşça çekin. Detaylı video kılavuz e-postanıza gönderilir." },
      { q: "Kabarcık kalmaması için ne yapmalıyım?", a: "Sabunlu su yöntemi ile uyguladığınızda kabarcık riski minimumdur. Kabarcık çıkarsa iğne ile küçük bir delik açıp parmakla yumuşakça düzleştirebilirsiniz. Doğru uygulamada kabarcıklar 24 saat içinde kendiliğinden kaybolur." },
    ],
    relatedSlugs: ["arac-sticker-yan", "fosforlu-cikis-folyo"],
    parameters: [
      {
        id: "renk", label: "Renk", kind: "radio", required: true, defaultOptionId: "siyah",
        options: [
          { id: "siyah", label: "Siyah", priceModifier: 0 },
          { id: "beyaz", label: "Beyaz", priceModifier: 0 },
          { id: "metalik", label: "Metalik (Altın/Gümüş)", priceModifier: 45 },
        ],
      },
      {
        id: "ebat", label: "Ebat (en × boy cm)", kind: "dimension", required: true,
        pricePerSqm: 125, minDimension: 20, maxDimension: 400, defaultWidth: 100, defaultHeight: 100,
        extras: [
          { id: "kesim", label: "CNC Kesim (yazı/logo)", flatFee: 80 },
          { id: "uygulama-bandi", label: "Uygulama Bandı (transfer tape)", perimeterPricePerM: 8 },
        ],
      },
    ],
    seo: {
      title: "Cam Vitrin Folyosu — Kesimli Yapışkanlı Folyo, m² 125 TL",
      description: "Mağaza vitrinleri için 5 yıl dayanıklı yapışkanlı folyo + CNC kesim, m² 125 TL'den. Siyah, beyaz, metalik renk. Uygulama bandı dahil seçeneği var.",
      keywords: ["cam folyosu", "vitrin folyo", "kesimli folyo", "mağaza folyo", "kapı yazısı", "yapışkan folyo", "CNC kesim folyo"],
    },
  },

  // ========================================================================
  // GÜVENLİK LEVHASI
  // ========================================================================
  {
    slug: "guvenlik-levhasi-sigorta",
    name: "İSG Güvenlik Levhası — Standart",
    categorySlug: "guvenlik-uyari-levhalari",
    sku: "MK-LVH-ISG-001",
    brand: "Markala",
    shortDescription: "ISO 7010 uyumlu A4 plastik levha",
    description:
      "İş Sağlığı ve Güvenliği (İSG) yönetmelikleri ile ISO 7010 standardına uygun olarak üretilen A4 (21x30 cm) güvenlik uyarı levhalarımız; 1,5 mm beyaz PVC plaka üzerine UV korumalı baskı tekniğiyle hazırlanır. Sarı üçgen uyarı, kırmızı yuvarlak yasak, mavi yuvarlak zorunlu sembol türlerinden seçim yapabilir veya tamamen özel sembol/metin tasarlatabilirsiniz. Üretim tesisleri, depolar, iş merkezleri, hastane, otel, okul ve kamu kuruluşlarının zorunlu tabela ihtiyaçları için ideal — düşük adetli (1 adet) siparişler bile kabul edilir, 1-2 iş günü içinde teslim edilir.",
    basePrice: 65,
    startingPrice: 65,
    sizeLabel: "A4 (21 x 30 cm)",
    productionTime: "1-2 iş günü",
    images: [prodImg("guvenlik-levhasi-sigorta", 1)],
    rating: { average: 4.8, count: 96 },
    features: [
      "ISO 7010 standardına uygun renk ve sembol",
      "1,5 mm beyaz PVC plaka",
      "UV korumalı dış mekan baskı",
      "Sarı uyarı / kırmızı yasak / mavi zorunlu / özel tasarım",
      "1 adetten itibaren minimum sipariş",
    ],
    useCases: [
      "Üretim tesisi ve fabrika koridorları",
      "Depo, lojistik merkez, raf alanları",
      "İş merkezi, AVM, ofis bina ortak alan",
      "Hastane, klinik, laboratuvar",
      "Otel, restoran, mutfak iç güvenlik",
      "Okul, kreş, kamu kuruluşu",
    ],
    specifications: [
      { label: "Ebat", value: "A4 (21 x 30 cm)" },
      { label: "Malzeme", value: "1,5 mm beyaz PVC" },
      { label: "Standart", value: "ISO 7010 uyumlu" },
      { label: "Baskı", value: "UV dayanıklı solvent" },
      { label: "Sembol Türleri", value: "Uyarı / Yasak / Zorunlu / Özel" },
      { label: "Üretim Süresi", value: "1-2 iş günü" },
    ],
    faqs: [
      { q: "Hangi sembolleri seçebilirim?", a: "ISO 7010 standardındaki 100+ uyarı, yasak ve zorunlu sembolünden istediğinizi seçebilirsiniz. Sipariş notuna sembol kodunu (örn. W001, P002, M003) yazmanız yeterli. Tam liste için ürün sayfasındaki PDF kataloğa bakabilirsiniz." },
      { q: "Özel tasarım ek ücret nedir?", a: "Standart sembol baskısı ücretsizdir. Tamamen özel sembol/grafik istiyorsanız 35 TL ek ücret uygulanır; bu ücret tek seferliktir, sonraki siparişlerinizde tekrarlanmaz." },
      { q: "Levhayı duvara nasıl monte edebilirim?", a: "Çift taraflı bant, vidalı askılık veya cırt bant ile monte edilebilir. Her sipariş ile ücretsiz çift taraflı bant gönderilir; vidalı askılık ihtiyacı için sipariş notunda belirtin (5 TL/levha)." },
    ],
    relatedSlugs: ["fosforlu-cikis-folyo", "dekota-baski-5mm"],
    parameters: [
      {
        id: "tip", label: "Sembol Türü", kind: "radio", required: true, defaultOptionId: "uyari",
        options: [
          { id: "uyari", label: "Uyarı (sarı üçgen)", priceModifier: 0 },
          { id: "yasak", label: "Yasak (kırmızı yuvarlak)", priceModifier: 0 },
          { id: "zorunlu", label: "Zorunlu (mavi yuvarlak)", priceModifier: 0 },
          { id: "ozel", label: "Özel tasarım", priceModifier: 35 },
        ],
      },
      { id: "adet", label: "Adet", kind: "quantity", required: true, unitPrice: 65, quantityPresets: [1, 5, 10, 25, 50] },
    ],
    seo: {
      title: "İSG Güvenlik Levhası — ISO 7010 Uyumlu A4 PVC, 65 TL",
      description: "ISO 7010 standardında A4 PVC iş güvenliği uyarı levhası 65 TL'den. Uyarı, yasak, zorunlu sembol veya özel tasarım — 1 adetten itibaren.",
      keywords: ["iş güvenliği levhası", "isg levhası", "iso 7010", "uyarı levhası", "yasak levhası", "güvenlik tabelası", "pvc levha"],
    },
  },

  // ========================================================================
  // PLAKET
  // ========================================================================
  {
    slug: "kristal-plaket",
    name: "Kristal Plaket — Lazer Kazıma",
    categorySlug: "plaket",
    sku: "MK-PLK-KRS-001",
    brand: "Markala",
    shortDescription: "20 cm kristal plaket, lazer kazıma + ahşap taban",
    description:
      "Çalışan ödülü, müşteri/iş ortağı teşekkürü, mezuniyet, başarı ve kurumsal etkinliklerin en prestijli hediyesi olan kristal plaketlerimiz; yüksek kaliteli optik kristal blok üzerine CO2 lazer kazıma teknolojisiyle kişiye/firmaya özel kalıcı işleme yapılır. 15-20-25 cm boy seçenekleri, cilalı doğal ahşap taban dahil teslim edilir; lüks ambalajda gönderilir. Tek adet kişisel ödülden 25+ adet kurumsal toplu siparişe kadar 3-5 iş günü içinde üretilir.",
    basePrice: 280,
    startingPrice: 280,
    sizeLabel: "20 cm",
    productionTime: "3-5 iş günü",
    images: [prodImg("kristal-plaket", 1)],
    badges: ["yeni"],
    rating: { average: 4.9, count: 27 },
    features: [
      "Optik kristal blok — yüksek şeffaflık",
      "CO2 lazer ile derin kazıma",
      "15 / 20 / 25 cm boy seçenekleri",
      "Cilalı doğal ahşap taban dahil",
      "Lüks hediye ambalajı",
    ],
    useCases: [
      "Yıllık çalışan başarı ödülleri",
      "İş ortağı, bayi, müşteri teşekkür plaketleri",
      "Spor turnuvası, sanat yarışması ödülleri",
      "Mezuniyet, emeklilik anı plaketleri",
      "Şirket kuruluş yıldönümü hediyeleri",
    ],
    specifications: [
      { label: "Boy", value: "15 / 20 / 25 cm" },
      { label: "Malzeme", value: "Optik kristal blok" },
      { label: "Kazıma", value: "CO2 lazer (3 boyut etki)" },
      { label: "Taban", value: "Cilalı doğal ahşap" },
      { label: "Ambalaj", value: "Lüks kadife kutu" },
      { label: "Üretim Süresi", value: "3-5 iş günü" },
    ],
    faqs: [
      { q: "Lazer kazımada renk eklenebilir mi?", a: "Standart lazer kazıma şeffaf zeminde mat beyaz görünüm verir. Ek ücretle (50 TL) altın, gümüş veya siyah dolgu boyası uygulanabilir; kalıcı ve yıkanabilir." },
      { q: "Toplu siparişte fiyat indirimi var mı?", a: "Evet. 5 adetten itibaren %10, 10 adetten itibaren %15, 25 adet ve üzeri için özel teklif. Kurumsal yıllık ödül törenleri için müşteri hizmetleriyle iletişime geçebilirsiniz." },
    ],
    relatedSlugs: ["madalya-7cm-kurdela", "klasik-beyaz-kupa"],
    parameters: [
      {
        id: "boy", label: "Boy", kind: "radio", required: true, defaultOptionId: "20cm",
        options: [
          { id: "15cm", label: "15 cm", priceModifier: -80 },
          { id: "20cm", label: "20 cm", priceModifier: 0 },
          { id: "25cm", label: "25 cm", priceModifier: 120 },
        ],
      },
      { id: "adet", label: "Adet", kind: "quantity", required: true, unitPrice: 280, quantityPresets: [1, 5, 10, 25] },
    ],
    seo: {
      title: "Kristal Plaket — Lazer Kazıma + Ahşap Taban, 280 TL",
      description: "Optik kristal plaket, CO2 lazer ile kişiye özel kazıma, cilalı ahşap taban + lüks ambalaj dahil. 15/20/25 cm — kurumsal ödül ve teşekkür için.",
      keywords: ["kristal plaket", "lazer kazıma plaket", "ödül plaketi", "teşekkür plaketi", "kurumsal plaket", "cam plaket"],
    },
  },

  // ========================================================================
  // MADALYA
  // ========================================================================
  {
    slug: "madalya-7cm-kurdela",
    name: "Madalya — 7cm Kurdela Dahil",
    categorySlug: "madalya",
    sku: "MK-MDL-7CM-001",
    brand: "Markala",
    shortDescription: "Metal madalya, kurdela + özel baskı",
    description:
      "Spor turnuvaları, futbol-basketbol turnuvaları, okul yarışmaları, koşu ve maraton organizasyonlarının vazgeçilmez ödülü olan 7 cm metal madalyalarımız; altın, gümüş veya bronz kaplama, ön yüzde yarışma logosu/sembolü, arka yüzde tarih ve başarı bilgisi olacak şekilde kişiye/etkinliğe özel hazırlanır. Beraberinde renkli geniş kurdela (lacivert/kırmızı/yeşil/sarı/karışık) verilir. 10 adetten 250 adete kadar siparişlerde 5-7 iş günü içinde üretilir.",
    basePrice: 25,
    startingPrice: 25,
    sizeLabel: "7 cm",
    productionTime: "5-7 iş günü",
    images: [prodImg("madalya-7cm-kurdela", 1)],
    rating: { average: 4.7, count: 84 },
    features: [
      "7 cm metal madalya — altın, gümüş, bronz",
      "Ön yüz özel logo / sembol",
      "Arka yüz tarih, başarı, etkinlik bilgisi",
      "Renkli geniş kurdela dahil",
      "10-250 adet aralığında esnek sipariş",
    ],
    useCases: [
      "Futbol, basketbol, voleybol turnuvaları",
      "Koşu, maraton, triatlon organizasyonu",
      "Okul ve üniversite spor şenlikleri",
      "Yüzme, atletizm, jimnastik yarışmaları",
      "Sanat, müzik, bilim olimpiyatları",
    ],
    specifications: [
      { label: "Çap", value: "7 cm" },
      { label: "Kaplama", value: "Altın / Gümüş / Bronz" },
      { label: "Kurdela", value: "Lacivert / kırmızı / yeşil / sarı (karışık olabilir)" },
      { label: "Üretim Süresi", value: "5-7 iş günü" },
    ],
    faqs: [
      { q: "Tasarımı ben mi hazırlamalıyım?", a: "İstediğiniz logo veya sembolü PNG/SVG/AI formatında gönderin; eğer hazır tasarımınız yoksa standart spor sembolleri (futbol, basketbol, atletizm vb.) kütüphanemizden seçebilirsiniz. Ücretsiz tasarım desteği bu üründe dahildir." },
      { q: "Sıralama (1.-2.-3.) için ayrı sipariş gerekir mi?", a: "Hayır, tek siparişte üç renk birden gelir: 10 altın + 10 gümüş + 10 bronz şeklinde dağılım belirleyebilirsiniz. Sipariş notunda dağılımı yazmanız yeterli." },
    ],
    relatedSlugs: ["kristal-plaket", "klasik-beyaz-kupa"],
    parameters: [
      {
        id: "kalite", label: "Renk", kind: "radio", required: true, defaultOptionId: "altin",
        options: [
          { id: "altin", label: "Altın Kaplama", priceModifier: 0 },
          { id: "gumus", label: "Gümüş Kaplama", priceModifier: 0 },
          { id: "bronz", label: "Bronz Kaplama", priceModifier: 0 },
        ],
      },
      { id: "adet", label: "Adet", kind: "quantity", required: true, unitPrice: 25, quantityPresets: [10, 25, 50, 100, 250] },
    ],
    seo: {
      title: "Madalya — 7 cm Metal Kurdela Dahil, Spor Turnuvası İçin",
      description: "7 cm metal madalya, altın/gümüş/bronz kaplama + renkli kurdela dahil 25 TL'den. Özel logo, tarih, etkinlik bilgisi — okul ve spor turnuvalarına özel.",
      keywords: ["madalya", "spor madalyası", "turnuva madalyası", "altın madalya", "okul madalyası", "kurdelalı madalya", "ödül madalyası"],
    },
  },

  // ========================================================================
  // DEKOTA
  // ========================================================================
  {
    slug: "dekota-baski-5mm",
    name: "Dekota Baskı — 5 mm",
    categorySlug: "dekota-baski",
    sku: "MK-DKT-5MM-001",
    brand: "Markala",
    shortDescription: "5 mm dekota üzerine UV baskı, m² fiyat",
    description:
      "Hafif ama dayanıklı yapısıyla iç ve yarı dış mekan tabela uygulamalarının vazgeçilmezi olan 5 mm beyaz dekota plaka üzerine UV baskı; mağaza tabela, sergi standı, vitrin yazısı, dış cephe paneli, fuar standı arka panel ve yön levhaları için en sık tercih edilen üründür. Düz kesim veya CNC lazer ile özel form kesim seçenekleriyle, m² hesabı bazında 30-305 cm aralığında istediğiniz ebatta üretilir. Askılık aparatı ve çift ayaklı stand ekstralarıyla hızla monte edilir.",
    basePrice: 0,
    startingPrice: 290,
    sizeLabel: "m² hesabı",
    productionTime: "2-3 iş günü",
    images: [prodImg("dekota-baski-5mm", 1)],
    rating: { average: 4.6, count: 31 },
    features: [
      "5 mm beyaz dekota plaka — hafif, dayanıklı",
      "UV baskı — solvent ve yıpranmaya dayanıklı",
      "Düz kesim veya özel form CNC lazer kesim",
      "30-305 cm ebat aralığında özel üretim",
      "Askılık ve çift ayaklı stand ekstraları",
    ],
    useCases: [
      "Mağaza ve restoran tabela",
      "Fuar standı arka panel",
      "Yön levhası ve bilgilendirme tabela",
      "Vitrin içi sergi standı",
      "Açılış kuşak ve karşılama panoları",
    ],
    specifications: [
      { label: "Kalınlık", value: "5 mm" },
      { label: "Renk", value: "Beyaz dekota (siyah, gri seçenekleri ek talep)" },
      { label: "Baskı", value: "UV dayanıklı, mat veya parlak" },
      { label: "Ebat Aralığı", value: "30 - 305 cm" },
      { label: "Üretim Süresi", value: "2-3 iş günü" },
    ],
    faqs: [
      { q: "Dış mekanda ne kadar dayanır?", a: "Dekota dış mekanda 2-3 yıl deformasyona uğramadan kullanılabilir. Ancak doğrudan yağmur ve güneş alan açık alanlarda 8-10 yıl dayanan alüminyum kompozit (alkomp) panel veya 10+ yıl dayanan dibond öneririz. Yarı korunaklı (saçak altı, mağaza alın tabelası vb.) yerlerde 5 mm dekota uygundur." },
      { q: "Özel form kesim için tasarım nasıl olmalı?", a: "Vektörel kesim çizgisini ayrı bir katmanda (genellikle macenta/kırmızı çizgi) belirtmeniz yeterli. Tasarım katmanından farklı renkte olması, makinenin kesim çizgisini ayırt etmesini sağlar." },
    ],
    relatedSlugs: ["lightbox-led-100cm", "vinil-branda-440gr"],
    parameters: [
      {
        id: "kesim", label: "Kesim", kind: "radio", required: true, defaultOptionId: "duz",
        options: [
          { id: "duz", label: "Düz Kesim", priceModifier: 0 },
          { id: "ozel", label: "Özel Form (lazer)", priceModifier: 80 },
        ],
      },
      {
        id: "ebat", label: "Ebat (en × boy cm)", kind: "dimension", required: true,
        pricePerSqm: 345, minDimension: 30, maxDimension: 305, defaultWidth: 100, defaultHeight: 70,
        extras: [
          { id: "askilik", label: "Askılık Aparatı (köşe deliği)", flatFee: 35 },
          { id: "ayaklik", label: "Çift Ayaklı Stand", flatFee: 145 },
        ],
      },
    ],
    seo: {
      title: "Dekota Baskı — 5 mm UV Baskı, m² 345 TL",
      description: "5 mm beyaz dekota plaka üzerine UV baskı, m² 345 TL'den. Düz veya CNC özel form kesim. Tabela, sergi, vitrin için hafif ve dayanıklı çözüm.",
      keywords: ["dekota baskı", "dekota tabela", "5 mm dekota", "uv baskı", "pvc tabela", "vitrin tabela", "fuar standı"],
    },
  },

  // ========================================================================
  // FOSFORLU FOLYO
  // ========================================================================
  {
    slug: "fosforlu-cikis-folyo",
    name: "Fosforlu Acil Çıkış Folyosu",
    categorySlug: "fosforlu-folyo",
    sku: "MK-FSF-AC-001",
    brand: "Markala",
    shortDescription: "Karanlıkta parlayan reflektif folyo, A4",
    description:
      "Yangın yönetmeliği ve İSG mevzuatı kapsamında zorunlu olan, elektrik kesintisi durumunda 6 saate kadar karanlıkta parlayarak yön gösteren fosforlu reflektif folyo. A4 (21x30 cm) ebatta hazır acil çıkış, yangın merdiveni ve yön sembolleri olarak teslim edilir; mağaza, otel, AVM, hastane, okul, üretim tesisleri için zorunludur. UV ışığı 30 dakika depoladıktan sonra elektriğin kesilmesi halinde 6 saat boyunca yeşilimsi ışıkla yön gösterir.",
    basePrice: 140,
    startingPrice: 140,
    sizeLabel: "A4 (21 x 30 cm)",
    productionTime: "2 iş günü",
    images: [prodImg("fosforlu-cikis-folyo", 1)],
    rating: { average: 4.8, count: 22 },
    features: [
      "6 saate kadar karanlıkta parlama (UV depolama sonrası)",
      "Yangın yönetmeliği ve İSG zorunlu",
      "A4 (21x30 cm) standart ebat",
      "Yapışkanlı arkalı, doğrudan duvar uygulaması",
      "1 adetten 25 adete kadar esnek sipariş",
    ],
    useCases: [
      "Mağaza ve AVM acil çıkış yönlendirme",
      "Otel koridor ve merdiven boşlukları",
      "Hastane, klinik ve laboratuvar",
      "Okul ve kreşler",
      "Üretim tesisleri ve depolar",
      "Ofis bina ortak alanları",
    ],
    specifications: [
      { label: "Ebat", value: "A4 (21 x 30 cm)" },
      { label: "Parlama Süresi", value: "30 dk UV depolama → 6 saat parlama" },
      { label: "Kaplama", value: "UV koruyuculu, yapışkan arkalı vinil" },
      { label: "Standartlar", value: "TS EN ISO 7010, ISO 17398" },
      { label: "Üretim Süresi", value: "2 iş günü" },
    ],
    faqs: [
      { q: "Sembol seçenekleri nelerdir?", a: "Standart yangın yönetmeliği sembolleri: acil çıkış (sol-sağ ok), merdiven yönü (yukarı-aşağı), yangın söndürücü konumu, ilk yardım, AED. Sipariş notunda istediğiniz sembolü belirtin; özel yön/grafik için 35 TL ek ücret." },
      { q: "Folyoyu nasıl uygularım?", a: "Yapışkan arkalı vinil yapısı sayesinde temiz ve kuru bir yüzeye doğrudan yapıştırılır. Duvar yağlı boya, fayans veya cama uygundur; tozlu/pürüzlü yüzeylerde silikonlu çift taraflı bant öneririz." },
    ],
    relatedSlugs: ["guvenlik-levhasi-sigorta", "cam-folyosu-kesimli"],
    parameters: [
      { id: "adet", label: "Adet", kind: "quantity", required: true, unitPrice: 140, quantityPresets: [1, 5, 10, 25] },
    ],
    seo: {
      title: "Fosforlu Acil Çıkış Folyosu — A4 Karanlıkta Parlayan",
      description: "Yangın yönetmeliği uyumlu A4 fosforlu acil çıkış folyosu 140 TL. 30 dk UV depoladıktan sonra 6 saat karanlıkta parlama. Mağaza, otel, hastane için.",
      keywords: ["fosforlu folyo", "acil çıkış levhası", "karanlıkta parlayan folyo", "yangın levhası", "iso 7010 levha", "isg fosforlu"],
    },
  },

  // ========================================================================
  // LIGHTBOX
  // ========================================================================
  {
    slug: "lightbox-led-100cm",
    name: "Lightbox LED Tabela — 100x70 cm",
    categorySlug: "lightbox",
    sku: "MK-LGT-100-001",
    brand: "Markala",
    shortDescription: "Alüminyum çerçeve + LED arkadan aydınlatma",
    description:
      "Mağaza vitrini, restoran giriş tabelası, AVM iç mekan ve havaalanı reklam panellerinde profesyonel görünüm sunan lightbox LED tabelalarımız; alüminyum çerçeve, çift taraflı LED dizisi (5050 SMD beyaz), pleksi yüzey üzerine UV dayanıklı baskı kombinasyonuyla üretilir. 60x40 cm küçük vitrin tabelasından 150x100 cm büyük cephe panellerine kadar 3 ebat seçeneğinde, 220V şebeke veya pilli kullanım opsiyonuyla 5-7 iş günü içinde teslim edilir. 50.000 saat ömürlü LED'ler, mağaza-restoran ışıklarına eşdeğer parlaklık sunar.",
    basePrice: 1850,
    startingPrice: 1850,
    sizeLabel: "100 x 70 cm",
    productionTime: "5-7 iş günü",
    images: [prodImg("lightbox-led-100cm", 1)],
    rating: { average: 4.9, count: 14 },
    features: [
      "Alüminyum çerçeve — anodize, pas tutmaz",
      "Çift taraflı 5050 SMD beyaz LED",
      "Pleksi yüzey üzerine UV baskı",
      "60x40 / 100x70 / 150x100 cm ebat seçenekleri",
      "50.000 saat LED ömrü",
      "220V şebeke veya 12V adaptör",
    ],
    useCases: [
      "Mağaza vitrin alın tabela",
      "Restoran ve kafe giriş aydınlatması",
      "AVM iç mekan reklam paneli",
      "Havaalanı, otel, ofis bina lobi",
      "Eczane, klinik, sağlık merkezi",
    ],
    specifications: [
      { label: "Ebat Seçenekleri", value: "60x40 / 100x70 / 150x100 cm" },
      { label: "Çerçeve", value: "Anodize alüminyum" },
      { label: "LED", value: "5050 SMD beyaz, 50.000 saat ömür" },
      { label: "Yüzey", value: "Pleksi + UV dayanıklı baskı" },
      { label: "Güç", value: "220V şebeke veya 12V adaptör" },
      { label: "Üretim Süresi", value: "5-7 iş günü" },
    ],
    faqs: [
      { q: "Lightbox montajı dahil mi?", a: "İl içi montaj 350 TL'den başlayan ek ücretle sunulur. İl dışı gönderimlerde ürün, takım montaj kılavuzu + tüm aksesuarlarla teslim edilir; standart montaj bilgisine sahip bir tabelacı veya elektrikçi 30-45 dakikada monte edebilir." },
      { q: "Görseli sonradan değiştirebilir miyim?", a: "Evet. Pleksi panel öne doğru çıkarılabilir, sadece yeni baskı pleksi 450 TL'den başlayarak ayrı sipariş edilebilir." },
    ],
    relatedSlugs: ["dekota-baski-5mm", "rollup-standart"],
    parameters: [
      {
        id: "ebat", label: "Ebat", kind: "radio", required: true, defaultOptionId: "100x70",
        options: [
          { id: "60x40", label: "60 x 40 cm", priceModifier: -650 },
          { id: "100x70", label: "100 x 70 cm", priceModifier: 0 },
          { id: "150x100", label: "150 x 100 cm", priceModifier: 850 },
        ],
      },
      { id: "adet", label: "Adet", kind: "quantity", required: true, unitPrice: 0, quantityPresets: [1, 2, 5] },
    ],
    seo: {
      title: "Lightbox LED Tabela — 100x70 cm Alüminyum Çerçeve, 1.850 TL",
      description: "Alüminyum çerçeveli, 5050 SMD LED arkadan aydınlatmalı lightbox tabela. 60x40 / 100x70 / 150x100 cm ebatlar; mağaza, restoran, AVM için profesyonel.",
      keywords: ["lightbox tabela", "ışıklı tabela", "led tabela", "vitrin tabela", "alüminyum tabela", "mağaza tabelası", "restoran tabelası"],
    },
  },

  // ========================================================================
  // DUBA
  // ========================================================================
  {
    slug: "plastik-duba-baskili",
    name: "Plastik Reklam Dubası — Baskılı",
    categorySlug: "plastik-reklam-dubasi",
    sku: "MK-DUB-PL-001",
    brand: "Markala",
    shortDescription: "İçi doldurulabilir plastik duba, özel baskı",
    description:
      "Mağaza önü uyarı, açılış kampanyası yönlendirme, yol/park alanı ayırma, etkinlik ve fuar yönlendirmesinde kullanılan; içi su veya kum ile doldurulabildiği için sabit duran dayanıklı plastik dubalarımız. 75 cm yükseklikte, 4 yön baskı (logo + uyarı + yön oku + kampanya mesajı) uygulanabilir; kırmızı, sarı veya yeşil renk seçenekleri vardır. 1-25 adet aralığında 3-4 iş günü içinde üretilip teslim edilir.",
    basePrice: 320,
    startingPrice: 320,
    sizeLabel: "75 cm yükseklik",
    productionTime: "3-4 iş günü",
    images: [prodImg("plastik-duba-baskili", 1)],
    rating: { average: 4.5, count: 19 },
    features: [
      "75 cm yükseklik, kırmızı / sarı / yeşil renk",
      "İçi su veya kum doldurulabilir",
      "4 yön baskı (logo, uyarı, ok, mesaj)",
      "UV dayanıklı yapışkanlı folyo baskı",
      "Yığınlanabilir tasarım — depolama kolay",
    ],
    useCases: [
      "Mağaza önü kampanya ve uyarı",
      "Açılış ve etkinlik yönlendirme",
      "Otopark giriş-çıkış işaretleme",
      "Yol kapatma, çevre güvenlik",
      "Şantiye ve inşaat alanı çevre",
    ],
    specifications: [
      { label: "Yükseklik", value: "75 cm" },
      { label: "Renk Seçenekleri", value: "Kırmızı / Sarı / Yeşil" },
      { label: "İç Doldurma", value: "Su veya kum (sabit duruş için)" },
      { label: "Baskı", value: "4 yön UV dayanıklı yapışkanlı folyo" },
      { label: "Üretim Süresi", value: "3-4 iş günü" },
    ],
    faqs: [
      { q: "Duba kaç kg ağırlıkta?", a: "Boş halde 4-5 kg, içine su (~6 lt) veya kum (~12 kg) doldurulduğunda toplam ağırlık 10-17 kg arasındadır. Bu ağırlık rüzgâra ve hafif çarpmalara karşı sabit duruşu sağlar." },
      { q: "Folyo baskı sonradan değiştirilebilir mi?", a: "Evet. Eski folyo dikkatlice çıkarılır, yüzey alkol ile temizlenir, yeni folyo aynı şekilde uygulanır. Sadece baskı seti yenileme 80 TL/duba'dan başlar." },
    ],
    relatedSlugs: ["guvenlik-levhasi-sigorta", "vinil-branda-440gr"],
    parameters: [
      {
        id: "renk", label: "Duba Rengi", kind: "radio", required: true, defaultOptionId: "kirmizi",
        options: [
          { id: "kirmizi", label: "Kırmızı", priceModifier: 0 },
          { id: "sari", label: "Sarı", priceModifier: 0 },
          { id: "yesil", label: "Yeşil", priceModifier: 0 },
        ],
      },
      { id: "adet", label: "Adet", kind: "quantity", required: true, unitPrice: 320, quantityPresets: [1, 5, 10, 25] },
    ],
    seo: {
      title: "Plastik Reklam Dubası — Baskılı 75 cm, 320 TL",
      description: "75 cm baskılı plastik reklam dubası, içine su/kum doldurulabilir, 4 yön UV folyo baskı. Kırmızı, sarı, yeşil. Mağaza önü, otopark, şantiye için.",
      keywords: ["reklam dubası", "plastik duba", "baskılı duba", "trafik dubası", "uyarı dubası", "açılış dubası"],
    },
  },

  // ========================================================================
  // KAŞE
  // ========================================================================
  {
    slug: "trodat-printy-4912",
    name: "Trodat Printy 4912 Kaşe",
    categorySlug: "kase",
    sku: "MK-KSE-TRD-4912",
    brand: "Trodat",
    shortDescription: "47 x 18 mm dikdörtgen otomatik kaşe — 24 saatte teslim",
    description:
      "Avusturya menşeili dünyanın 1 numaralı kaşe markası Trodat'ın en çok tercih edilen modeli olan Printy 4912; 47x18 mm baskı alanı içeren, 5 satıra kadar yazı sığdırılabilen otomatik kaşedir. Mavi, siyah veya kırmızı mürekkep haznesi ve yedek mürekkep paketi dahil teslim edilir. Şirket kaşesi, fatura kaşesi, mali müşavir tarihli kaşesi, eczane reçete kaşesi, doktor diploma kaşesi gibi günlük kullanımlarda 10.000+ baskı kapasitesi sunar. Sipariş onayından sonra 24 saat içinde üretilip aynı gün/ertesi gün kargolanır.",
    basePrice: 220,
    startingPrice: 220,
    sizeLabel: "47 x 18 mm",
    productionTime: "24 saat",
    images: [prodImg("trodat-printy-4912", 1), prodImg("trodat-printy-4912", 2)],
    badges: ["hizli-sevkiyat", "cok-satilan"],
    bestseller: true,
    rating: { average: 4.9, count: 488 },
    features: [
      "Trodat Avusturya orijinal — 1 yıl garanti",
      "47 x 18 mm baskı alanı, 5 satır yazı",
      "Mavi / siyah / kırmızı mürekkep + yedek paket",
      "10.000+ baskı kapasitesi",
      "24 saat üretim, hızlı teslim",
    ],
    useCases: [
      "Şirket adres ve unvan kaşesi",
      "Fatura ve evrak imza kaşesi",
      "Mali müşavir ve muhasebe tarihli kaşe",
      "Eczane reçete onay kaşesi",
      "Doktor diploma ve hekim kaşesi",
      "Avukat ve noter kaşeleri",
    ],
    specifications: [
      { label: "Model", value: "Trodat Printy 4912 (orijinal)" },
      { label: "Baskı Alanı", value: "47 x 18 mm" },
      { label: "Satır Sayısı", value: "Maksimum 5 satır" },
      { label: "Mürekkep Renk", value: "Mavi / siyah / kırmızı" },
      { label: "Kapasite", value: "10.000+ baskı (yedek mürekkeple)" },
      { label: "Üretim", value: "24 saat" },
    ],
    faqs: [
      { q: "Kaşe içeriğini nasıl iletmeliyim?", a: "Sipariş sırasında \"Kaşe metni\" alanına 5 satır yazıyı düz metin olarak girin. Logo veya özel yazı tipi (Times, Arial, Courier) talebi varsa not alanına ekleyin. Tasarım hazır şablonlarımıza göre 1 saat içinde dijital önizleme gönderilir; onayınız sonrası baskıya geçer." },
      { q: "Mürekkep bittiğinde ne yapacağım?", a: "Yedek mürekkep paketi standart sipariş ile birlikte gönderilir; pad açılır, mürekkep dökülür, kapatılır. Yedek mürekkep ek olarak 35 TL'den ayrı sipariş edilebilir; 1 yedek paket ortalama 5.000 baskı yapar." },
      { q: "Trodat dışında alternatif var mı?", a: "Evet — Shiny ve Colop markaları da satıyoruz. Shiny daha ekonomik (180 TL'den), Trodat Avusturya kalite/garantisi nedeniyle en çok tercih edilen marka. Colop premium segment, fiyatı 280 TL'den başlar." },
    ],
    relatedSlugs: ["klasik-kartvizit", "guvenlik-levhasi-sigorta"],
    parameters: [
      {
        id: "renk", label: "Mürekkep Rengi", kind: "radio", required: true, defaultOptionId: "mavi",
        options: [
          { id: "mavi", label: "Mavi", priceModifier: 0 },
          { id: "siyah", label: "Siyah", priceModifier: 0 },
          { id: "kirmizi", label: "Kırmızı", priceModifier: 0 },
        ],
      },
      { id: "adet", label: "Adet", kind: "quantity", required: true, unitPrice: 220, quantityPresets: [1, 2, 5, 10] },
    ],
    seo: {
      title: "Trodat 4912 Kaşe — Orijinal Avusturya, 24 Saatte Teslim, 220 TL",
      description: "Trodat Printy 4912 dikdörtgen otomatik kaşe, 47x18 mm, 5 satır. Mavi/siyah/kırmızı mürekkep + yedek dahil. 24 saatte üretim, Türkiye geneli kargo.",
      keywords: ["trodat kaşe", "printy 4912", "otomatik kaşe", "şirket kaşesi", "kaşe yaptırma", "ucuz kaşe", "online kaşe", "trodat 4912 fiyat"],
    },
  },
];

/**
 * Tüm ürünler — matbaa katalogu (3 modül) + legacy ürünler (dış mekan reklam, plaket vb.).
 * Her birinin description'una %1-5 fire notu otomatik eklenir (idempotent).
 */
export const products: Product[] = [
  ...matbaaProducts,
  ...matbaaProducts2,
  ...matbaaProducts3,
  ...legacyRaw,
].map(withFireNote);

export function getProductBySlug(slug: string): Product | undefined {
  return products.find((p) => p.slug === slug);
}

export function getProductsByCategory(categorySlug: string): Product[] {
  return products.filter((p) => p.categorySlug === categorySlug);
}

export function getBestsellers(): Product[] {
  return products.filter((p) => p.bestseller === true);
}

export function getRelatedProducts(slug: string, limit = 4): Product[] {
  const p = getProductBySlug(slug);
  if (!p) return [];
  const explicit = (p.relatedSlugs ?? [])
    .map((s) => getProductBySlug(s))
    .filter((x): x is Product => Boolean(x));
  if (explicit.length >= limit) return explicit.slice(0, limit);
  const extra = products
    .filter((x) => x.categorySlug === p.categorySlug && x.slug !== p.slug && !explicit.find((e) => e.slug === x.slug))
    .slice(0, limit - explicit.length);
  return [...explicit, ...extra];
}
