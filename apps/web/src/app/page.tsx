import type { Metadata } from "next";
import { getProducts, getHeroSlides, getHeroBanners } from "@/lib/catalog";
import { HeroCarousel } from "@/components/home/hero-carousel";
import { ImageHeroCarousel } from "@/components/home/image-hero-carousel";
import { TrustBadges } from "@/components/home/trust-badges";
import { ProductRail } from "@/components/home/product-rail";
import { CategoryGrid } from "@/components/home/category-grid";
import { TrustedBy } from "@/components/home/trusted-by";
import { CustomerReviews } from "@/components/home/customer-reviews";
import { ProcessTimeline } from "@/components/home/process-timeline";
import { PromoBanner } from "@/components/promo-banner";
import { HowToProductionJsonLd } from "@/components/seo/json-ld";

// ISR — katalog fetch'iyle (lib/catalog.ts revalidate:30) aynı pencere; bayat anasayfa cache'ini önler.
export const revalidate = 30;

// Anasayfa — reklam kampanyalarının #1 iniş hedefi: kök varsayılan yerine elle ayarlı
// başlık + açıklama + açık canonical.
export const metadata: Metadata = {
  title: { absolute: "Markala — Online Matbaa: Kartvizit, Broşür, Afiş & Branda Baskı" },
  description:
    "Kartvizit, broşür, afiş, branda ve 30+ matbaa & reklam ürünü online. Ücretsiz tasarım desteği, 1-2 iş günü üretim, 81 il kargo. 324 Ajans güvencesiyle markala.com.tr.",
  alternates: { canonical: "/" },
};

export default async function HomePage() {
  const [products, heroSlides, heroBanners] = await Promise.all([
    getProducts(),
    getHeroSlides(),
    getHeroBanners(),
  ]);
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
      {/* Admin'den tam-banner slider eklendiyse onu göster; yoksa yapısal/3D hero (mock fallback). */}
      {heroBanners.length > 0 ? (
        <ImageHeroCarousel slides={heroBanners} />
      ) : (
        <HeroCarousel slides={heroSlides} />
      )}
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

      <CustomerReviews />
    </>
  );
}
