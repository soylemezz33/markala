import { getProducts } from "@/lib/catalog";
import { HeroCarousel } from "@/components/home/hero-carousel";
import { TrustBadges } from "@/components/home/trust-badges";
import { ProductRail } from "@/components/home/product-rail";
import { CategoryGrid } from "@/components/home/category-grid";
import { TrustedBy } from "@/components/home/trusted-by";
import { CustomerReviews } from "@/components/home/customer-reviews";
import { ProcessTimeline } from "@/components/home/process-timeline";
import { HowToProductionJsonLd } from "@/components/seo/json-ld";

export default async function HomePage() {
  const products = await getProducts();
  // Çok satılanlar (bestseller flag)
  const bestsellers = products.filter((p) => p.bestseller).slice(0, 12);

  // Yeni gelenler — "yeni" badge'li ürünler + diğerleri
  const newArrivals = [
    ...products.filter((p) => p.badges?.includes("yeni")),
    ...products.filter(
      (p) => !p.badges?.includes("yeni") && !p.bestseller,
    ),
  ].slice(0, 12);

  return (
    <>
      <HowToProductionJsonLd />
      <HeroCarousel />
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
