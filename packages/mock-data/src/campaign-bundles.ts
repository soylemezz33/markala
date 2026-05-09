import type { CampaignBundle } from "@markala/types";

const bundleImg = (slug: string) => `/images/bundles/${slug}.jpg`;

/**
 * Açılışa özel "Esnaf Destek Paketi" tarzı hazır bundle'lar.
 * Tek tıkla sepete eklenir, konfigürasyon yok — hepsi sabit içerik.
 */
export const campaignBundles: CampaignBundle[] = [
  {
    slug: "esnaf-destek-paketi-10",
    name: "Esnaf Destek Paketi 10",
    tagline: "Hepsi bir arada — açılışınız hazır",
    description:
      "Açılışa hazırlanıyorsanız işiniz tamam. Bayrak, branda, kartvizit, broşür ve magnet birlikte üretilir, kapınıza tek seferde teslim edilir. Tasarım desteği ücretsiz.",
    contents: [
      { quantity: 1, productName: "Yelken Bayrak Takımı", productSlug: "yelken-bayrak-damla", note: "Damla form, çift taraflı" },
      { quantity: 1, productName: "Mega Reklam Dubası", productSlug: "plastik-duba-baskili", note: "75 cm yükseklik, baskılı" },
      { quantity: 5, productName: "Vinil Branda Afiş", productSlug: "vinil-branda-440gr", note: "70x100 cm, 440 gr" },
      { quantity: 1000, productName: "Çift Yön Kartvizit", productSlug: "klasik-kartvizit", note: "350 gr mat kuşe" },
      { quantity: 1000, productName: "Broşür", productSlug: "brosur-a4-3-katli", note: "A4 3 katlı, 135 gr" },
      { quantity: 1000, productName: "Araç Magnet", productSlug: "arac-magneti-30x40", note: "30x40 cm UV baskı" },
    ],
    originalPrice: 8950,
    bundlePrice: 6750,
    imageUrl: bundleImg("esnaf-destek-paketi-10"),
    badge: "AÇILIŞA ÖZEL",
    highlight: "Son 12 paket · Tasarım desteği dahil",
    category: "esnaf",
    isActive: true,
    designSupport: true,
    sortOrder: 1,
  },
  {
    slug: "kurumsal-baslangic-paketi",
    name: "Kurumsal Başlangıç Paketi",
    tagline: "Yeni kurulan firmalara özel",
    description:
      "Logodan kartvizite, antetli kâğıttan kaşeye — kurumsal kimliğinizi tek seferde bastırın. Tasarım dahil.",
    contents: [
      { quantity: 1000, productName: "Klasik Kartvizit", productSlug: "klasik-kartvizit", note: "350 gr çift yön" },
      { quantity: 500, productName: "Antetli Kağıt", note: "A4 80 gr" },
      { quantity: 500, productName: "Zarf", note: "Diplomat 11x23 cm" },
      { quantity: 1, productName: "Otomatik Kaşe", productSlug: "trodat-printy-4912", note: "Trodat 4912" },
      { quantity: 100, productName: "Faturalı Kâğıt Bandolu", note: "2 nüsha karbonlu" },
    ],
    originalPrice: 3450,
    bundlePrice: 2490,
    imageUrl: bundleImg("kurumsal-baslangic-paketi"),
    badge: "EN ÇOK SATAN",
    highlight: "Tasarım desteği dahil",
    category: "kurumsal",
    isActive: true,
    designSupport: true,
    sortOrder: 2,
  },
  {
    slug: "etkinlik-tanitim-paketi",
    name: "Etkinlik Tanıtım Paketi",
    tagline: "Açılışlar, festivaller, fuarlar için",
    description:
      "Etkinlik gününüzü kalabalıkla taçlandırın. Roll-up, branda, kırlangıç bayrak ve davetiyeler — hepsi koordineli baskı.",
    contents: [
      { quantity: 2, productName: "Roll-Up Stand", productSlug: "rollup-standart", note: "85x200 cm premium" },
      { quantity: 3, productName: "Vinil Branda", productSlug: "vinil-branda-440gr", note: "100x300 cm" },
      { quantity: 30, productName: "Kırlangıç Bayrak", productSlug: "kirlangic-bayrak-3m", note: "Toplam 6 metre" },
      { quantity: 500, productName: "Davetiye", note: "13x18 cm zarflı" },
      { quantity: 200, productName: "Etiket / Sticker", productSlug: "cam-folyosu-kesimli", note: "8 cm yuvarlak" },
    ],
    originalPrice: 5680,
    bundlePrice: 4280,
    imageUrl: bundleImg("etkinlik-tanitim-paketi"),
    badge: "FESTİVAL",
    category: "etkinlik",
    isActive: true,
    designSupport: true,
    sortOrder: 3,
  },
  {
    slug: "promosyon-firmasi-paketi",
    name: "Promosyon Firması Paketi",
    tagline: "Toplu hediye için ekonomik çözüm",
    description:
      "Yılbaşı, müşteri günü, çalışan ödülü — kupa, kalem, anahtarlık ve plaket birlikte sipariş, ciddi tasarruf.",
    contents: [
      { quantity: 100, productName: "Sublime Baskılı Kupa", productSlug: "klasik-beyaz-kupa", note: "330 ml beyaz seramik" },
      { quantity: 200, productName: "Promosyon Kalem", note: "Logo baskılı tükenmez" },
      { quantity: 100, productName: "Anahtarlık", note: "Metal, lazer kazıma" },
      { quantity: 25, productName: "Kristal Plaket", productSlug: "kristal-plaket", note: "20 cm" },
    ],
    originalPrice: 12450,
    bundlePrice: 9750,
    imageUrl: bundleImg("promosyon-firmasi-paketi"),
    badge: "TOPLU İNDİRİM",
    highlight: "Kurumsal fatura imkânı",
    category: "promosyon",
    isActive: true,
    designSupport: true,
    sortOrder: 4,
  },
  {
    slug: "mini-kafe-paketi",
    name: "Mini Kafe / Restoran Paketi",
    tagline: "Yeni açılan kafeler için",
    description:
      "Menü kartı, masa bayrağı, ışıklı tabela ve kasada kullanılacak fişler. Sıfırdan ayağa kalkın.",
    contents: [
      { quantity: 50, productName: "Menü Kartı", note: "A4 mat selefonlu" },
      { quantity: 10, productName: "Masa Bayrağı", productSlug: "masa-bayragi-krom", note: "15x22 cm krom direkli" },
      { quantity: 1, productName: "Lightbox Tabela", productSlug: "lightbox-led-100cm", note: "100x70 cm" },
      { quantity: 500, productName: "Kasa Fişi", note: "10x15 cm" },
      { quantity: 250, productName: "Kahve Bardağı Etiketi", note: "Sticker, takeaway" },
    ],
    originalPrice: 6890,
    bundlePrice: 5290,
    imageUrl: bundleImg("mini-kafe-paketi"),
    badge: "AÇILIŞ",
    category: "acilis",
    isActive: true,
    designSupport: true,
    sortOrder: 5,
  },
  ];

export function getCampaignBundleBySlug(slug: string): CampaignBundle | undefined {
  return campaignBundles.find((b) => b.slug === slug);
}

export function getActiveCampaignBundles(): CampaignBundle[] {
  return campaignBundles.filter((b) => b.isActive).sort((a, b) => a.sortOrder - b.sortOrder);
}
