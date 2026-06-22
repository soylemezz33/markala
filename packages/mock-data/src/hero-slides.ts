export interface HeroSlide {
  id: string;
  eyebrow: string;
  title: string;
  highlightWord?: string;
  description: string;
  ctaLabel: string;
  ctaHref: string;
  secondaryCtaLabel?: string;
  secondaryCtaHref?: string;
  productImage: string;
  /** Slide arka plan teması — paletten seçilir */
  theme: "yellow" | "ink" | "cyan" | "cream";
  size?: string;
  badge?: string;
  /** Sağ tarafın render tipi — slide'a göre özel UX visual */
  visualType?: "image" | "design-stack" | "card-stack" | "mug-3d" | "banner-display";
  /** Stats grid (design-stack ile birlikte gösterilir) */
  stats?: Array<{ value: string; label: string }>;
}

export const heroSlides: HeroSlide[] = [
  {
    // 1) Kampanya kancası — ilk sipariş indirimi (en yüksek dönüşüm)
    id: "indirim",
    eyebrow: "İlk siparişe özel · Online sipariş",
    title: "İlk siparişinde %10 indirim",
    highlightWord: "%10 indirim",
    description:
      "Tüm baskı ürünlerinde geçerli. Sepette HOSGELDIN kodunu gir, indirimini anında yakala.",
    ctaLabel: "İndirimi Yakala",
    ctaHref: "/urunler",
    secondaryCtaLabel: "Kampanyalar",
    secondaryCtaHref: "/kampanyalar",
    productImage: "",
    theme: "ink",
    visualType: "card-stack",
    size: "Kod: HOSGELDIN",
    badge: "Tek kullanım · ilk siparişe",
  },
  {
    // 2) Değer önermesi — ücretsiz profesyonel tasarım
    id: "ucretsiz-tasarim",
    eyebrow: "Her siparişte ücretsiz",
    title: "Tasarımı ücretsiz bizden olsun",
    highlightWord: "ücretsiz",
    description:
      "Logo, kartvizit, broşür… Profesyonel grafik ekibimiz sizin için hazırlar. Siz sadece onaylayın — sınırsız revize, ek ücret yok.",
    ctaLabel: "Ücretsiz Tasarım İste",
    ctaHref: "/hizmetler/tasarim-destegi",
    secondaryCtaLabel: "WhatsApp'tan yaz",
    secondaryCtaHref: "https://wa.me/905319004102",
    productImage: "",
    theme: "yellow",
    visualType: "design-stack",
    stats: [
      { value: "0 ₺", label: "Tasarım ücreti" },
      { value: "24 sa", label: "İlk taslak" },
      { value: "∞", label: "Revize hakkı" },
      { value: "11+", label: "Grafik tasarımcı" },
    ],
  },
  {
    // 3) Hız vaadi — üretim + kargo
    id: "ayni-gun-uretim",
    eyebrow: "Zamanında teslimat",
    title: "Aynı gün üretim, hızlı kargo",
    highlightWord: "hızlı kargo",
    description:
      "Siparişin üretim biter bitmez yola çıkar. 81 ilde güvenli ve hızlı teslimat.",
    ctaLabel: "Hemen Sipariş Ver",
    ctaHref: "/urunler",
    secondaryCtaLabel: "Kargo & teslimat",
    secondaryCtaHref: "/yasal/kargo",
    productImage: "",
    theme: "ink",
    visualType: "mug-3d",
    size: "81 il teslimat",
    badge: "Üretim bittiği gün kargoda",
  },
  {
    // 4) Marka çatısı — kapsam genişliği
    id: "marka",
    eyebrow: "Kartvizitten tabelaya",
    title: "Markanızı biz basarız",
    highlightWord: "biz basarız",
    description:
      "Kurumsal kimliğinizin tüm baskı ihtiyaçları tek adreste: kartvizit, broşür, tabela, bayrak ve daha fazlası.",
    ctaLabel: "Ürünleri Keşfet",
    ctaHref: "/urunler",
    secondaryCtaLabel: "Kategoriler",
    secondaryCtaHref: "/kategoriler",
    productImage: "",
    theme: "yellow",
    visualType: "banner-display",
    size: "Türkiye'nin matbaası",
    badge: "7 kategori · tek sipariş",
  },
];
