import type { Metadata } from "next";
import type { Product } from "@markala/types";
import {
  getProducts,
  getBestsellers,
  getHeroBanners,
  getHeaderNav,
  getCategories,
} from "@/lib/catalog";
import { HeroSplit } from "@/components/home/hero-split";
import { CategoryTiles } from "@/components/home/category-tiles";
import { ProductRail } from "@/components/home/product-rail";
import { SectorShowcase } from "@/components/home/sector-showcase";
import { TrustedBy } from "@/components/home/trusted-by";
import { CustomerReviews } from "@/components/home/customer-reviews";
import { AboutMarkala } from "@/components/home/about-markala";
import { HomeFaq } from "@/components/home/home-faq";
import { GuidesRail } from "@/components/home/guides-rail";
import { HomeJsonLd, LocalBusinessJsonLd } from "@/components/seo/json-ld";
import { ProcessTimeline } from "@/components/home/process-timeline";
import { PromoBanner } from "@/components/promo-banner";

// ISR — katalog fetch'iyle (lib/catalog.ts revalidate:30) aynı pencere; bayat anasayfa cache'ini önler.
export const revalidate = 300;

// Anasayfa — reklam kampanyalarının #1 iniş hedefi: kök varsayılan yerine elle ayarlı
// başlık + açıklama + açık canonical.
export const metadata: Metadata = {
  // SERP bütçesi: title ≤60 kr, description ≤160 kr (kelime sınırında biter) — 2026-08-01 SEO denetimi.
  title: { absolute: "Markala, Online Matbaa: Kartvizit, Broşür & Branda Baskı" },
  description:
    "Kartvizit, broşür, afiş, branda ve 750+ matbaa ürünü online. Ücretsiz tasarım desteği, 2-3 iş günü üretim, 81 ile kargo. 324 Ajans güvencesiyle.",
  alternates: { canonical: "/" },
  // OG/Twitter başlıkları BURADA tekrar yazılıyor (2026-09-01 SEO denetimi): denetimde
  // <title> özenle yazılmışken paylaşım başlığının kök layout'un jenerik varsayılanında
  // ("Markala | Matbaa ve Reklam Ürünleri") kaldığı çıktı — WhatsApp/LinkedIn'de paylaşılan
  // her anasayfa linki o zayıf başlıkla görünüyordu.
  //
  // DİKKAT: Next `openGraph`/`twitter` nesnelerini derin birleştirmez, KOMPLE değiştirir.
  // images/url/siteName/locale/type burada tekrar yazılmazsa kaybolur — o yüzden tam liste.
  openGraph: {
    type: "website",
    locale: "tr_TR",
    siteName: "Markala",
    url: "https://markala.com.tr",
    title: "Markala, Online Matbaa: Kartvizit, Broşür & Branda Baskı",
    description:
      "750+ matbaa ürünü online. Ebadını ve adedini seç, fiyatı anında gör. Ücretsiz tasarım desteği, 2-3 iş günü üretim, 81 ile kargo.",
    images: [
      {
        url: "/og-default.png",
        width: 1200,
        height: 630,
        alt: "Markala - Matbaa ve Reklam Ürünleri",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Markala, Online Matbaa: Kartvizit, Broşür & Branda Baskı",
    description:
      "750+ matbaa ürünü online. Fiyatı anında gör, ücretsiz tasarım desteği al, 2-3 iş gününde üretilsin.",
    images: ["/og-default.png"],
  },
};

/**
 * RSC payload diyeti (PSI 2026-08-03): raylardaki ProductCard client bileşeni — ona giden
 * her alan sayfa HTML'ine ikinci kez (hydration verisi olarak) gömülür. Kart yalnız şu
 * alanları kullanır; description/parameters gibi ağır alanlar 24 üründe onlarca KB
 * şişiriyordu (mobil LCP 7.1s'in parçası). getDisplayPrice displayPrice ile kısa devre yapar.
 */
const slimForCard = (p: Product): Product => ({
  slug: p.slug,
  name: p.name,
  categorySlug: p.categorySlug,
  shortDescription: "",
  description: "",
  basePrice: p.basePrice,
  startingPrice: p.startingPrice,
  productionTime: p.productionTime,
  sizeLabel: p.sizeLabel,
  // İKİ görsel: [0] kapak, [1] hover'da gösterilen destek görseli (2026-08-31).
  // Diyet bozulmuyor — bu yalnız bir URL dizesi daha (~80 B/ürün); ikinci görselin
  // KENDİSİ ProductCard'da ilk hover'a kadar indirilmez, yani LCP'ye etkisi yok.
  images: p.images.slice(0, 2),
  badges: p.badges,
  displayPrice: p.displayPrice,
  pricingMode: p.pricingMode,
  rating: p.rating,
  bestseller: p.bestseller,
});

export default async function HomePage() {
  const products = await getProducts();
  // Anasayfa hero slaytları — admin panelinden yönetilen DB (hero_slides) kaynağı.
  const heroBanners = await getHeroBanners();
  // Hero altı kategori kutuları başlıktaki menünün 8 grubunu kullanır (tek kaynak).
  // Kategoriler yalnız temsili GÖRSEL için gerekiyor (45/45'inde imageUrl dolu).
  const [headerNav, categories] = await Promise.all([getHeaderNav(), getCategories()]);
  // Çok satılanlar — GERÇEK ciro sırasıyla (getBestsellers: content.bestsellerRank'e göre
  // sıralı döner; rank'i haftalık senkron yazar, 1 = ciro lideri, dolgu ürünler sona).
  // Not: buradaki `products` list=true hafif yanıttır ve content taşımaz — o yüzden ayrı çağrı.
  const bestsellers = (await getBestsellers(12)).map(slimForCard);

  // Yeni gelenler — "yeni" badge'li ürünler + diğerleri.
  //
  // GÖRSELİ OLMAYAN ÜRÜN BU RAFA GİRMEZ (2026-09-01, Hasan): "yeni" rozetli 5 ürünün
  // (duvar kağıdı, kompozit, one way vision, pleksi, UV DTF) görseli henüz yüklenmemişti
  // ve raf boş kutularla doluyordu — anasayfada en kötü ilk izlenim burası.
  //
  // Filtre KALICI ve KENDİ KENDİNİ ÇÖZER: görsel yüklenir yüklenmez ürün kendiliğinden
  // rafa döner (ISR revalidate 300 sn). Slug listesi yazmadım, çünkü öyle yapsaydım görsel
  // gelince listeyi elle temizlemek gerekirdi ve unutulurdu.
  const gorselliUrun = (p: { images?: string[] | null }) => (p.images?.length ?? 0) > 0;
  const newArrivals = [
    ...products.filter((p) => p.badges?.includes("yeni") && gorselliUrun(p)),
    ...products.filter((p) => !p.badges?.includes("yeni") && !p.bestseller && gorselliUrun(p)),
  ].slice(0, 12).map(slimForCard);

  return (
    <>
      {/* Anasayfaya ÖZEL şema (2026-09-01 SEO denetimi): WebPage + görünen rafların
          ItemList'i. Liste, sayfada GERÇEKTEN basılan iki raftan beslenir — şema ile
          görünen içerik uyuşmazlığı Google ihlali sayılır, o yüzden ayrı sorgu yok. */}
      <HomeJsonLd
        products={[...bestsellers, ...newArrivals].map((p) => ({ slug: p.slug, name: p.name }))}
      />
      {/* LocalBusiness artık kök layout'ta değil (900+ sayfada tekrarlanıyordu); işletme
          kaydını beklenen iki sayfa basıyor: burası ve /iletisim. */}
      <LocalBusinessJsonLd />
      {/* HowTo JSON-LD kaldırıldı (2026-08): Google HowTo zengin sonucunu Eylül 2023'te
          tüm sonuçlardan çekti — işaretleme artık hiçbir görsel çıktı üretmiyordu.
          Görünen "Üretim Süreci" bölümü (ProcessTimeline) aynen duruyor. */}
      {/* Anasayfa hero (2026-08-31): solda gerçek h1 + CTA + canlı fiyat çıpası, sağda
          slaytlar (mobilde otomatik dönmez). Eski edge-to-edge saf görsel slider ilk ekranda
          hiç eylem bırakmıyordu; HeroCtaBand'in taşıdığı fiyat/butonlar buraya taşındı. */}
      <HeroSplit products={products} slides={heroBanners} />
      {/* İlk ekranda katalog girişi — mobilde kategori menüsü hamburger arkasında olduğu
          için burası masaüstünden daha kritik. */}
      <CategoryTiles nav={headerNav} products={products} categories={categories} />
      <PromoBanner location="hero" />
      {/* TrustBadges 2026-08-31'de KALDIRILDI: dört rozetten üçü ("Ücretsiz Tasarım Desteği",
          "2-3 İş Günü Üretim", "81 İle Kargo") artık HeroSplit'in güven satırında, hemen
          yukarıda duruyor. Aynı iddiayı 500px arayla iki kez tekrarlamak yer harcıyordu.
          Bileşen duruyor (components/home/trust-badges.tsx), geri istenirse import et. */}

      <ProductRail
        eyebrow="En Çok Tercih Edilenler"
        title="Çok satılanlar"
        description="Markala müşterilerinin en çok sipariş ettiği matbaa ürünleri."
        products={bestsellers}
        // ?sort=popular KALDIRILDI (2026-09-01 SEO denetimi): robots.txt `/*?sort=*`'ı
        // engelliyordu, yani anasayfanın en görünür iki CTA'sından biri taranması yasak
        // bir adrese gidiyordu. Parametreyi silmek hiçbir şey kaybettirmiyor: /urunler
        // sıralamayı URL'den HİÇ okumuyor (all-products-client.tsx useState<SortKey>
        // varsayılanı zaten "popular"), yani ?sort=popular ölü bir parametreydi ve
        // sayfa ikisinde de aynı sırayla açılıyordu.
        viewAllHref="/urunler"
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

      {/* CategoryGrid ("Tüm matbaa ve reklam ürünleri") 2026-08-06 kararıyla geçici
          kaldırıldı — bileşen duruyor (components/home/category-grid.tsx), gerektiğinde
          import edip buraya geri ekle. */}
      <SectorShowcase />

      <CustomerReviews />

      {/* Açıklama metni EN ALTTA (2026-09-01, Hasan onayı): SEO denetiminde anasayfada
          Markala'nın ne yaptığını anlatan hiç metin olmadığı çıktı. Satın alma akışının
          önüne geçmesin diye kasıtlı olarak sayfanın sonunda — yukarıdaki rafların ve
          sektör bloğunun sırası değişmedi. */}
      {/* Rehberler — açıklama metninin ÜSTÜNDE (2026-09-02): sitenin en çok gösterim alan
          sayfaları rehber/blog yazıları ama anasayfadan hiç link almıyorlardı. Buraya
          konuldu çünkü hâlâ sayfanın alt yarısı ama "biz kimiz" metninden önce gelmesi
          okuma sırası açısından doğru: önce işine yarayacak içerik, sonra kurumsal anlatım. */}
      <GuidesRail />

      <AboutMarkala />

      {/* SSS anlatım metninin ALTINDA: metin "biz kimiz"i anlatır, SSS itirazları karşılar —
          okuma sırası bu. Sorular admin'den gelir, elle yazılmadı. */}
      <HomeFaq />
    </>
  );
}
