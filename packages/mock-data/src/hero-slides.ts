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
    id: "kartvizit",
    eyebrow: "Çok satan",
    title: "Markanız her elden geçsin",
    highlightWord: "her elden",
    description: "350 gr mat kuşe kâğıtta 4+4 dijital baskı, 1.000 adet kartvizit 24 saatte kapınızda.",
    ctaLabel: "Hemen İncele",
    ctaHref: "/urun/klasik-kartvizit",
    secondaryCtaLabel: "Tüm kartvizitler",
    secondaryCtaHref: "/kategori/kartvizit",
    productImage: "",
    theme: "yellow",
    visualType: "card-stack",
    size: "8.5 x 5.5 cm · 350 gr",
    badge: "1.000 adet 89₺'den",
  },
  {
    id: "branda",
    eyebrow: "Açılışlar için",
    title: "Açılışınızı sokağa duyurun",
    highlightWord: "duyurun",
    description: "440 gr UV dayanıklı vinil branda — istediğiniz ebatta, halkalı veya katlamalı, m² 110₺'den.",
    ctaLabel: "Branda Sipariş Et",
    ctaHref: "/urun/vinil-branda-440gr",
    secondaryCtaLabel: "Roll-Up & Bayrak",
    secondaryCtaHref: "/kategoriler",
    productImage: "",
    theme: "ink",
    visualType: "banner-display",
    size: "Özel ebat · UV dayanıklı",
    badge: "m² 110₺'den",
  },
  {
    id: "kupa",
    eyebrow: "Promosyon",
    title: "Kalıcı kurumsal hediye",
    highlightWord: "kalıcı",
    description: "Sublime baskılı 330 ml seramik kupa — yıkamada solmaz, kurumsal hediyenizin yıllarca masada kalması için.",
    ctaLabel: "Kupa İncele",
    ctaHref: "/urun/klasik-beyaz-kupa",
    secondaryCtaLabel: "Promosyon ürünleri",
    secondaryCtaHref: "/kategoriler",
    productImage: "",
    theme: "cream",
    visualType: "mug-3d",
    size: "330 ml · seramik",
    badge: "12 adet 540₺'den",
  },
  {
    id: "tasarim-destegi",
    eyebrow: "Her siparişte ücretsiz dahil",
    title: "Tasarımınız yoksa biz hallederiz",
    highlightWord: "biz hallederiz",
    description: "Profesyonel grafik ekibimizle çalışın — kartvizitten büyük formata, brief'ten teslime kadar her adımda yanınızdayız. Sınırsız revize. Ek ücret yok.",
    ctaLabel: "Sipariş Ver",
    ctaHref: "/urunler",
    secondaryCtaLabel: "WhatsApp'tan yaz",
    secondaryCtaHref: "https://wa.me/903244333351",
    productImage: "",
    theme: "ink",
    visualType: "design-stack",
    stats: [
      { value: "0 ₺", label: "Tasarım ücreti" },
      { value: "24 sa", label: "İlk taslak" },
      { value: "∞", label: "Revize hakkı" },
      { value: "11+", label: "Grafik tasarımcı" },
    ],
  },
];
