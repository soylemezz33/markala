import type { Metadata } from "next";
import { getProducts, getHeroBanners } from "@/lib/catalog";
import { PremiumHeroSlider } from "@/components/home/premium-hero-slider";
import { HeroCtaBand } from "@/components/home/hero-cta-band";
import { TrustBadges } from "@/components/home/trust-badges";
import { ProductRail } from "@/components/home/product-rail";
import { CategoryGrid } from "@/components/home/category-grid";
import { SectorShowcase } from "@/components/home/sector-showcase";
import { TrustedBy } from "@/components/home/trusted-by";
import { CustomerReviews } from "@/components/home/customer-reviews";
import { ProcessTimeline } from "@/components/home/process-timeline";
import { PromoBanner } from "@/components/promo-banner";
import { HowToProductionJsonLd } from "@/components/seo/json-ld";

// ISR — katalog fetch'iyle (lib/catalog.ts revalidate:30) aynı pencere; bayat anasayfa cache'ini önler.
export const revalidate = 300;

// Anasayfa — reklam kampanyalarının #1 iniş hedefi: kök varsayılan yerine elle ayarlı
// başlık + açıklama + açık canonical.
export const metadata: Metadata = {
  title: { absolute: "Markala — Online Matbaa: Kartvizit, Broşür, Afiş & Branda Baskı" },
  description:
    "Kartvizit, broşür, afiş, branda ve 30+ matbaa & reklam ürünü online. Ücretsiz tasarım desteği, 1-2 iş günü üretim, 81 il kargo. 324 Ajans güvencesiyle markala.com.tr.",
  alternates: { canonical: "/" },
};

export default async function HomePage() {
  const products = await getProducts();
  // Anasayfa hero slaytları — admin panelinden yönetilen DB (hero_slides) kaynağı.
  const heroBanners = await getHeroBanners();
  // Çok satılanlar (bestseller flag)
  const bestsellers = products.filter((p) => p.bestseller).slice(0, 12);

  // Yeni gelenler — "yeni" badge'li ürünler + diğerleri
  const newArrivals = [
    ...products.filter((p) => p.badges?.includes("yeni")),
    ...products.filter((p) => !p.badges?.includes("yeni") && !p.bestseller),
  ].slice(0, 12);

  return (
    <>
      <HowToProductionJsonLd />
      {/* Anasayfa hero — DB (hero_slides) kaynaklı saf görsel slider; admin panelinden yönetilir. */}
      <PremiumHeroSlider slides={heroBanners} />
      {/* Hero altı CTA + gerçek fiyat çıpası — saf görsel slider'ın eylem boşluğunu kapatır. */}
      <HeroCtaBand products={products} />
      <PromoBanner location="hero" />
      <TrustBadges />

      <ProductRail
        eyebrow="En Çok Tercih Edilenler"
        title="Çok satılanlar"
        description="Markala müşterilerinin en çok sipariş ettiği matbaa ürünleri."
        products={bestsellers}
        viewAllHref="/urunler?sort=popular"
        viewAllLabel="Tüm çok satanlar"
      />

      <TrustedBy />

      <ProcessTimeline />

      <ProductRail
        eyebrow="Yeni Gelenler"
        title="Katalogdaki yenilikler"
        description="Bu sezon eklediğimiz ürünler ve sezonluk kampanyalar."
        products={newArrivals}
        viewAllHref="/urunler"
        viewAllLabel="Tüm ürünler"
      />

      <CategoryGrid />

      <SectorShowcase />

      <CustomerReviews />
    </>
  );
}
