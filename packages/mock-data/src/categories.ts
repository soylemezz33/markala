import type { Category } from "@markala/types";

/**
 * Kategori görselleri yerel /public/images/categories/ altında bulunur.
 * Path: /images/categories/[slug].jpg (Hasan tarafından yüklenecek).
 * Görsel yoksa Next/Image fallback gösterir — kart bg-paper-100 ile boş kalmaz.
 */
/** Kategori görseli — mockup endpoint kategoriye özel illustrasyon üretir */
const catImg = (slug: string) => `/api/mockup?category=${slug}&w=1200&h=900`;

export const categories: Category[] = [
  {
    slug: "kartvizit",
    name: "Kartvizit",
    shortDescription: "Premium kâğıtlarda profesyonel kartvizit baskısı",
    longDescription:
      "İlk izleniminizi güçlendiren kartvizitler — mat, parlak veya selefonlu seçeneklerle 24 saatte üretim.",
    imageUrl: catImg("kartvizit"),
    accentColor: "#F5B800",
    startingPrice: 89,
    productionTime: "1-2 iş günü",
    productCount: 12,
  },
  {
    slug: "vinil-branda-afis",
    name: "Vinil Branda Afiş",
    shortDescription: "Dış mekan dayanıklı, su geçirmez branda baskı",
    longDescription:
      "440 ve 510 gr branda üzerine UV dayanıklı baskı. İstediğiniz ebatta, gözenekli veya tam yüzey seçenekleriyle.",
    imageUrl: catImg("vinil-branda-afis"),
    accentColor: "#3D342B",
    startingPrice: 250,
    productionTime: "2-3 iş günü",
    productCount: 8,
  },
  {
    slug: "rollup",
    name: "Roll-Up",
    shortDescription: "Fuar ve mağazalar için taşınabilir afiş standı",
    longDescription:
      "Standart 85x200 cm ve özel ebatlarda alüminyum gövdeli, taşıma çantalı roll-up baskı.",
    imageUrl: catImg("rollup"),
    accentColor: "#1A1410",
    startingPrice: 480,
    productionTime: "2 iş günü",
    productCount: 5,
  },
  {
    slug: "yelken-bayrak",
    name: "Yelken Bayrak",
    shortDescription: "Açık alan etkinlikleri için dikkat çekici bayraklar",
    longDescription:
      "Damla, yelken ve dikdörtgen formlarda dış mekan bayrakları. Standlı veya standsız, çift taraflı baskı seçeneği.",
    imageUrl: catImg("yelken-bayrak"),
    accentColor: "#D99A00",
    startingPrice: 320,
    productionTime: "3-4 iş günü",
    productCount: 6,
  },
  {
    slug: "kirlangic-bayrak",
    name: "Kırlangıç Bayrak",
    shortDescription: "Cadde ve sokak süslemeleri için seri bayrak",
    longDescription:
      "Üçgen formda renkli kırlangıç bayraklar — düğün, açılış ve etkinlikler için ipe dizili teslim.",
    imageUrl: catImg("kirlangic-bayrak"),
    startingPrice: 180,
    productionTime: "2-3 iş günü",
    productCount: 4,
  },
  {
    slug: "masa-bayragi",
    name: "Masa Bayrağı",
    shortDescription: "Toplantı ve makamlar için kaliteli masa bayrağı",
    longDescription:
      "Saten kumaş üzerine baskı, krom veya ahşap direkli masa bayrakları. Kurum logosu ile özelleştirilebilir.",
    imageUrl: catImg("masa-bayragi"),
    startingPrice: 150,
    productionTime: "3 iş günü",
    productCount: 5,
  },
  {
    slug: "makam-bayragi",
    name: "Makam Bayrağı",
    shortDescription: "Resmi makamlara özel premium bayrak",
    longDescription:
      "Püsküllü, sırma işlemeli veya düz baskılı makam bayrakları — krom direk ve taban dahil.",
    imageUrl: catImg("makam-bayragi"),
    startingPrice: 850,
    productionTime: "4-5 iş günü",
    productCount: 3,
  },
  {
    slug: "arac-magneti",
    name: "Araç Magneti",
    shortDescription: "Çıkarılabilir magnetli araç giydirme",
    longDescription:
      "Aracınızın boyasına zarar vermeden uygulanabilen, dayanıklı magnet üzerine UV baskı.",
    imageUrl: catImg("arac-magneti"),
    startingPrice: 220,
    productionTime: "2 iş günü",
    productCount: 4,
  },
  {
    slug: "arac-sticker",
    name: "Araç Sticker",
    shortDescription: "Araç giydirme için kesimli folyo baskı",
    longDescription:
      "Tam araç giydirme veya logo/yazı kesimi — UV dayanıklı kalıcı folyo, profesyonel uygulama opsiyonu.",
    imageUrl: catImg("arac-sticker"),
    startingPrice: 180,
    productionTime: "2-3 iş günü",
    productCount: 6,
  },
  {
    slug: "brosur",
    name: "Broşür / El İlanı",
    shortDescription: "Tanıtım için katlamalı veya tek yaprak broşür",
    longDescription:
      "A4-A5-A6 ebatlarında, tek-iki-üç katlama seçenekli broşür ve el ilanı baskıları. Mat veya parlak kâğıt.",
    imageUrl: catImg("brosur"),
    startingPrice: 120,
    productionTime: "1-2 iş günü",
    productCount: 9,
  },
  {
    slug: "folyo",
    name: "Folyo",
    shortDescription: "Cam ve düz yüzeyler için kesimli folyo",
    longDescription:
      "Cam giydirme, kapı yazıları, mağaza vitrini için renkli veya transparan folyo baskı ve kesim.",
    imageUrl: catImg("folyo"),
    startingPrice: 95,
    productionTime: "1-2 iş günü",
    productCount: 7,
  },
  {
    slug: "fosforlu-folyo",
    name: "Fosforlu Folyo",
    shortDescription: "Karanlıkta parlayan güvenlik ve yön folyosu",
    longDescription:
      "Fosforlu reflektif folyo — acil çıkış, güvenlik uyarısı ve yön levhaları için ideal.",
    imageUrl: catImg("fosforlu-folyo"),
    startingPrice: 140,
    productionTime: "2 iş günü",
    productCount: 3,
  },
  {
    slug: "dekota-baski",
    name: "Dekota Baskı",
    shortDescription: "Hafif, dayanıklı dekota plaka baskısı",
    longDescription:
      "3-5-10 mm dekota üzerine UV baskı — tabela, sergi standı, vitrin için.",
    imageUrl: catImg("dekota-baski"),
    startingPrice: 290,
    productionTime: "2-3 iş günü",
    productCount: 5,
  },
  {
    slug: "guvenlik-uyari-levhalari",
    name: "Güvenlik Uyarı Levhaları",
    shortDescription: "İSG mevzuatına uygun uyarı ve yönlendirme",
    longDescription:
      "ISO 7010 standartlarına uygun güvenlik uyarı, yasak, zorunlu ve bilgilendirme levhaları.",
    imageUrl: catImg("guvenlik-uyari-levhalari"),
    startingPrice: 65,
    productionTime: "1-2 iş günü",
    productCount: 24,
  },
  {
    slug: "plaket",
    name: "Plaket",
    shortDescription: "Ödül ve teşekkür için kişiye özel plaket",
    longDescription:
      "Ahşap, kristal veya metal plaket — lazer kazıma ve UV baskı seçenekleriyle özel günlere armağan.",
    imageUrl: catImg("plaket"),
    startingPrice: 280,
    productionTime: "3-5 iş günü",
    productCount: 8,
  },
  {
    slug: "madalya",
    name: "Madalya",
    shortDescription: "Spor ve organizasyonlar için kişiye özel madalya",
    longDescription:
      "Kurdele dahil metal madalya — özel kalıp ve baskı seçenekleriyle.",
    imageUrl: catImg("madalya"),
    startingPrice: 25,
    productionTime: "5-7 iş günü",
    productCount: 6,
  },
  {
    slug: "kupa",
    name: "Kupa",
    shortDescription: "Promosyon ve hediye için baskılı kupa",
    longDescription:
      "Beyaz veya renkli kupa, sublimasyon baskı — kurum logosu, fotoğraf veya özel tasarım.",
    imageUrl: catImg("kupa"),
    startingPrice: 45,
    productionTime: "2-3 iş günü",
    productCount: 5,
  },
  {
    slug: "kase",
    name: "Kaşe",
    shortDescription: "Otomatik veya cep kaşesi — hızlı teslim",
    longDescription:
      "Trodat, Shiny ve Colop kaşeler — yuvarlak, dikdörtgen veya özel ebat. 24 saatte teslim.",
    imageUrl: catImg("kase"),
    startingPrice: 120,
    productionTime: "24 saat",
    productCount: 9,
  },
  {
    slug: "lightbox",
    name: "Lightbox",
    shortDescription: "İç ve dış mekan ışıklı tabela",
    longDescription:
      "LED aydınlatmalı lightbox — alüminyum çerçeve, gergi membran veya pleksi yüzey seçenekleri.",
    imageUrl: catImg("lightbox"),
    startingPrice: 1850,
    productionTime: "5-7 iş günü",
    productCount: 4,
  },
  {
    slug: "plastik-reklam-dubasi",
    name: "Plastik Reklam Dubası",
    shortDescription: "Yön ve uyarı için baskılı plastik dubalar",
    longDescription:
      "İçi su veya kum doldurulabilir plastik dubalar — özel logo ve uyarı baskılı.",
    imageUrl: catImg("plastik-reklam-dubasi"),
    startingPrice: 320,
    productionTime: "3-4 iş günü",
    productCount: 3,
  },
];

// ============================================================================
// MATBAA KATALOG KATEGORİLERİ — products-matbaa-*.ts ile uyumlu
// ============================================================================
const matbaaCategories: Category[] = [
  {
    slug: "el-ilani",
    name: "El İlanı",
    shortDescription: "105 gr Kuşe tek yön renkli — kampanya ve sokak dağıtımı için ekonomik",
    longDescription:
      "105 gr Kuşe kâğıt üzerine tek yön renkli el ilanı baskı; A7 / A5 / A4 / A3 ebatlarında 2.000-12.000 adet aralığında. Açılış kampanyası, sokak/kapı dağıtımı, etkinlik davetiye için en hızlı ve uygun maliyetli matbaa çözümü.",
    imageUrl: catImg("el-ilani"),
    accentColor: "#F5B800",
    startingPrice: 900,
    productionTime: "1-2 iş günü",
    productCount: 1,
  },
  {
    slug: "afis",
    name: "Afiş",
    shortDescription: "105 gr Kuşe kâğıt afiş — etkinlik, konser, vitrin için",
    longDescription:
      "105 gr Kuşe tek yön renkli kâğıt afiş; 34×49 ve 49×69 cm ebatlarda 250-1.000 adet. Konser, festival, sergi, mağaza vitrin tanıtımı için iç mekan ve kısa süreli kullanıma uygun ekonomik çözüm.",
    imageUrl: catImg("afis"),
    accentColor: "#D72A2A",
    startingPrice: 1750,
    productionTime: "1-2 iş günü",
    productCount: 1,
  },
  {
    slug: "antetli-kagit",
    name: "Antetli Kağıt",
    shortDescription: "90 gr 1.Hamur kurumsal antetli — A5 ve A4",
    longDescription:
      "90 gr 1.Hamur kâğıt üzerine tek yön renkli baskılı kurumsal antetli kağıt; A5 ve A4 ebatlarda 2.000-12.000 adet. Resmi yazışma, fatura üst yazısı, sözleşme kapağı için.",
    imageUrl: catImg("antetli-kagit"),
    accentColor: "#3D342B",
    startingPrice: 1550,
    productionTime: "1-2 iş günü",
    productCount: 1,
  },
  {
    slug: "zarf",
    name: "Zarf",
    shortDescription: "110 gr 1.Hamur diplomat ve torba zarf — tek renk veya CMYK",
    longDescription:
      "Diplomat (10.5×24 cm) zarf tek renk veya tam renkli baskı + Torba (24×32 cm) renkli zarf seçenekleri. Resmi yazışma, fatura, davetiye, ihale dosya gönderimi için 110 gr 1.Hamur kâğıttan üretilir.",
    imageUrl: catImg("zarf"),
    startingPrice: 1750,
    productionTime: "2-3 iş günü",
    productCount: 3,
  },
  {
    slug: "magnet",
    name: "Magnet",
    shortDescription: "60 mikron 46×68 mm renkli promosyon magnet",
    longDescription:
      "Buzdolabı tipi 60 mikron renkli baskılı promosyon magneti; 46×68 mm kartvizit boyu özel veya oval kesim. Eczane, taksi, restoran, mağaza ve kargo için en sık tercih edilen 'kalıcı reklam' ürünü.",
    imageUrl: catImg("magnet"),
    accentColor: "#3D342B",
    startingPrice: 630,
    productionTime: "3-4 iş günü",
    productCount: 1,
  },
  {
    slug: "amerikan-servis",
    name: "Amerikan Servis",
    shortDescription: "Restoran-kafe için tek kullanımlık tepsi altlığı",
    longDescription:
      "31×44 / 27.5×40 / 34×49 cm ebatlarda 90/100/120 gr tek kullanımlık restoran-kafe tepsi altlığı (placemat). Tek yön renkli baskı, kampanya ve menü tanıtımı için.",
    imageUrl: catImg("amerikan-servis"),
    startingPrice: 2750,
    productionTime: "2-3 iş günü",
    productCount: 1,
  },
  {
    slug: "kapi-aski-brosur",
    name: "Kapı Askı Broşürleri",
    shortDescription: "Otel ve mağaza için premium kapı kolu broşür",
    longDescription:
      "350-700 gr Kuşe / Bristol kâğıt + mat/parlak selefon + kabartma lak ile premium kapı kolu askı broşür. Otel oda DND/hizmet bilgilendirme, mağaza vitrin kapı kolu, apartman dağıtım için.",
    imageUrl: catImg("kapi-aski-brosur"),
    startingPrice: 2625,
    productionTime: "3-4 iş günü",
    productCount: 1,
  },
  {
    slug: "cepli-dosya",
    name: "Cepli Dosya",
    shortDescription: "Avukat ve kurumsal teklif için 22.5×31 cm cepli dosya",
    longDescription:
      "Kapalı hâli 22.5×31 cm renkli cepli dosya; 7 farklı kâğıt-kaplama varyantı (mat/parlak selefon, kabartma lak, çift yön baskı, 400 gr lak, 300 gr Bristol). Avukat dosyası, kurumsal teklif, ihale dosyası ve marka tanıtım dosyası için.",
    imageUrl: catImg("cepli-dosya"),
    accentColor: "#1A1410",
    startingPrice: 5000,
    productionTime: "4-5 iş günü",
    productCount: 1,
  },
  {
    slug: "etiket",
    name: "Etiket",
    shortDescription: "90 gr Kuşe yapışkanlı etiket — 6 varyant",
    longDescription:
      "Ürün ambalajı, kavanoz/şişe etiketi, kargo paket etiketi için 90 gr Kuşe yapışkanlı çıkartma. 53×83 / 52×82 mm kartvizit boy ve 15.5×25.5 / 25.5×33 cm büyük boy seçenekleri; selefonlu/selefonsuz, özel kesim, altın yaldız varyantları.",
    imageUrl: catImg("etiket"),
    startingPrice: 280,
    productionTime: "2-3 iş günü",
    productCount: 1,
  },
  {
    slug: "makbuz",
    name: "Makbuz",
    shortDescription: "54 gr kendinden kopyalı (NCR) 1 asıl + 1 suret makbuz",
    longDescription:
      "Esnaf, restoran, kafe, oto galerisi, kargo şirketi gibi günlük tahsilat-teslimat belgesi tutan işletmeler için 54 gr kendinden kopyalı kâğıt üzerine 1 asıl + 1 suret formatlı makbuz. 4 ebat × tek renk/renkli × 10/20/30 cilt seçenekleri.",
    imageUrl: catImg("makbuz"),
    startingPrice: 780,
    productionTime: "3-4 iş günü",
    productCount: 1,
  },
  {
    slug: "oto-paspas",
    name: "Oto Paspas",
    shortDescription: "Oto galerisi-servis için tek kullanımlık 85 gr karft paspas",
    longDescription:
      "Oto galerisi, oto servisi, ekspertiz ve kiralama firmalarının müşteri aracına yerleştirdiği tek kullanımlık 85 gr karft 34×49 cm oto paspas; tek renk baskı (logo + iletişim).",
    imageUrl: catImg("oto-paspas"),
    startingPrice: 1750,
    productionTime: "3-4 iş günü",
    productCount: 1,
  },
  {
    slug: "bloknot",
    name: "Bloknot & Notluk",
    shortDescription: "Küp / spiralli / kapaklı / kapaksız bloknot ve premium notluk",
    longDescription:
      "Promosyon ve kurumsal hediye için bloknot serisi: Küp Bloknot (78×78 mm 250/500'lük), Spiralli Bloknot (50'lik 9.4×13.3 / 14×20 cm × 5 kapak), Kapaklı Bloknot (Amerikan Cilt × 4 kapak), Kapaksız Tutkallı Bloknot ve premium 7.8×14 cm Notluk.",
    imageUrl: catImg("bloknot"),
    accentColor: "#D99A00",
    startingPrice: 5625,
    productionTime: "5-7 iş günü",
    productCount: 5,
  },
  {
    slug: "canta-kese",
    name: "Çanta & Kese Kağıdı",
    shortDescription: "Mağaza ve promosyon için 210 gr Bristol selefonlu çantalar",
    longDescription:
      "Mağaza, butik, hediye paketleme, etkinlik dağıtım için 210 gr Amerikan Bristol kâğıttan parlak/mat selefonlu çantalar; 6 ebat × adet × ip rengi (29 alternatif) × lak ekstra (Normal/Kabartma/Özel Desen).",
    imageUrl: catImg("canta-kese"),
    accentColor: "#1A1410",
    startingPrice: 5300,
    productionTime: "5-7 iş günü",
    productCount: 1,
  },
];

categories.push(...matbaaCategories);

export function getCategoryBySlug(slug: string): Category | undefined {
  return categories.find((c) => c.slug === slug);
}
