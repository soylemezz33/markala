import type { Product, Category, FaqItem } from "@markala/types";

const SITE = "https://markala.com.tr";

/** Organizasyon ve WebSite — kök layout'a yerleştirilir. */
export function OrganizationJsonLd() {
  const data = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        "@id": `${SITE}/#organization`,
        name: "Markala",
        legalName: "324 Ajans · Markala",
        alternateName: ["Markala Matbaa", "markala.com.tr"],
        url: SITE,
        logo: `${SITE}/og-default.png`,
        description:
          "Markala, 324 Ajans çatısı altında matbaa ve reklam ürünleri e-ticareti yapan butik markadır.",
        foundingDate: "2024-01-01",
        parentOrganization: {
          "@type": "Organization",
          name: "324 Ajans",
          url: "https://324ajans.com",
        },
        sameAs: [
          "https://www.instagram.com/markala.com.tr",
          "https://www.linkedin.com/company/324ajans",
          "https://324ajans.com",
        ],
        address: {
          "@type": "PostalAddress",
          streetAddress: "Çiftlikköy Mah. 32182 Sk. Astoria One No:13 İç Kapı No:61",
          addressCountry: "TR",
          addressRegion: "Mersin",
          addressLocality: "Yenişehir",
          postalCode: "33060",
        },
        contactPoint: [
          {
            "@type": "ContactPoint",
            contactType: "customer service",
            email: "merhaba@markala.com.tr",
            telephone: "+90-324-433-3351",
            areaServed: "TR",
            availableLanguage: ["Turkish"],
            hoursAvailable: {
              "@type": "OpeningHoursSpecification",
              dayOfWeek: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
              opens: "09:00",
              closes: "18:00",
            },
          },
          {
            "@type": "ContactPoint",
            contactType: "sales",
            email: "kurumsal@markala.com.tr",
            telephone: "+90-324-433-3351",
            areaServed: "TR",
            availableLanguage: ["Turkish"],
          },
        ],
        // AggregateRating KASITLI olarak yok: hardcoded/doğrulanamaz puan (eski 4.8/2450)
        // Google yapılandırılmış-veri politikasına aykırı (manuel ceza/rich-result baskılama riski).
        // Gerçek onaylı yorumlar birikince fetchSiteRating()'ten dinamik beslenip geri eklenecek.
        knowsAbout: [
          "Matbaa",
          "Kartvizit Baskı",
          "Broşür Baskı",
          "Afiş Baskı",
          "Branda Baskı",
          "Kupa Baskı",
          "Etiket Baskı",
          "Antetli Kağıt",
          "Kurumsal Kimlik",
          "Reklam Ürünleri",
        ],
      },
      {
        "@type": "WebSite",
        "@id": `${SITE}/#website`,
        url: SITE,
        name: "Markala — Matbaa & Reklam Ürünleri",
        publisher: { "@id": `${SITE}/#organization` },
        inLanguage: "tr-TR",
        potentialAction: {
          "@type": "SearchAction",
          target: { "@type": "EntryPoint", urlTemplate: `${SITE}/urunler?q={search_term_string}` },
          "query-input": "required name=search_term_string",
        },
      },
    ],
  };
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, "\\u003c") }}
    />
  );
}

/** Tek ürün için Product + Offer + AggregateRating + FAQPage birleşik graph. */
export function ProductJsonLd({
  product,
  category,
}: {
  product: Product;
  category?: Category;
}) {
  const productUrl = `${SITE}/urun/${product.slug}`;
  // Gerçek "başlangıç" fiyatı = API'nin hesapladığı displayPrice (en düşük geçerli yapılandırma).
  // startingPrice/basePrice DB alanları 0 (fiyatlar product_prices'ta) → onları KULLANMA.
  const displayPrice = product.displayPrice ?? 0;

  // Google, Product görselinde SVG desteklemez — /api/mockup SVG fallback'i JSON-LD'ye GİRMEZ.
  // Gerçek (raster) görsel yoksa image alanı tamamen atlanır; yanlış format vermekten iyidir.
  const realImages = product.images
    .filter((img) => !img.includes("/api/mockup"))
    .map((img) => (img.startsWith("http") ? img : `${SITE}${img}`));

  const productNode: Record<string, unknown> = {
    "@type": "Product",
    "@id": `${productUrl}#product`,
    name: product.name,
    description: product.shortDescription,
    sku: product.sku ?? product.slug,
    mpn: product.sku ?? product.slug,
    url: productUrl,
    ...(realImages.length > 0 ? { image: realImages } : {}),
    brand: {
      "@type": "Brand",
      name: product.brand ?? "Markala",
    },
    category: category?.name,
  };

  // Offer SADECE fiyatı olan üründe eklenir. "Teklif Al" (price:0) ürünlerde Offer atlanır —
  // aksi halde Google Merchant/Shopping price:0'ı geçersiz sayıp ürünü reddeder (disapproval).
  if (Number(displayPrice) > 0) {
    // priceValidUntil dinamik: bugün+30 gün (ISO tarih). Merchant "fiyat geçerliliği" sinyali;
    // sayfa ISR ile yeniden üretildikçe pencere ileri kayar, sabit tarih gibi bayatlamaz.
    const priceValidUntil = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
      .toISOString()
      .slice(0, 10);
    productNode.offers = {
      "@type": "Offer",
      url: productUrl,
      priceCurrency: "TRY",
      price: displayPrice,
      priceValidUntil,
      availability: "https://schema.org/InStock",
      itemCondition: "https://schema.org/NewCondition",
      seller: { "@type": "Organization", name: "Markala", url: SITE },
      hasMerchantReturnPolicy: {
        "@type": "MerchantReturnPolicy",
        applicableCountry: "TR",
        returnPolicyCategory: "https://schema.org/MerchantReturnFiniteReturnWindow",
        merchantReturnDays: 7,
        returnMethod: "https://schema.org/ReturnByMail",
        returnFees: "https://schema.org/FreeReturn",
      },
      shippingDetails: {
        "@type": "OfferShippingDetails",
        // Taban kargo ücreti (KDV dahil sepet 1500₺ altı). 1500₺ üzeri ücretsiz bir
        // promosyon; yapılandırılmış veride taban ücreti bildirmek dürüst ve güvenlidir —
        // koşulsuz "0" Merchant Center'da "ücretsiz kargo" vaadi sayılıp ürün reddine yol açar.
        shippingRate: { "@type": "MonetaryAmount", value: 79, currency: "TRY" },
        shippingDestination: { "@type": "DefinedRegion", addressCountry: "TR" },
        deliveryTime: {
          "@type": "ShippingDeliveryTime",
          handlingTime: { "@type": "QuantitativeValue", minValue: 1, maxValue: 5, unitCode: "DAY" },
          transitTime: { "@type": "QuantitativeValue", minValue: 1, maxValue: 3, unitCode: "DAY" },
        },
      },
    };
  }

  if (product.rating) {
    productNode.aggregateRating = {
      "@type": "AggregateRating",
      ratingValue: product.rating.average,
      reviewCount: product.rating.count,
      bestRating: 5,
      worstRating: 1,
    };
  }

  const graph: Record<string, unknown>[] = [productNode];

  if (product.faqs && product.faqs.length > 0) {
    graph.push({
      "@type": "FAQPage",
      "@id": `${productUrl}#faq`,
      mainEntity: product.faqs.map((f: FaqItem) => ({
        "@type": "Question",
        name: f.q,
        acceptedAnswer: { "@type": "Answer", text: f.a },
      })),
    });
  }

  const data = {
    "@context": "https://schema.org",
    "@graph": graph,
  };
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, "\\u003c") }}
    />
  );
}

/** Breadcrumb schema — kategori veya ürün sayfasında kullan. */
export function BreadcrumbJsonLd({
  items,
}: {
  items: Array<{ name: string; href: string }>;
}) {
  const data = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((it, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: it.name,
      item: it.href.startsWith("http") ? it.href : `${SITE}${it.href}`,
    })),
  };
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, "\\u003c") }}
    />
  );
}

/**
 * LocalBusiness — Mersin merkezli işletme. Google Business Profile ile uyumlu.
 * Adres, telefon, çalışma saatleri ve görseller burada tanımlanır.
 * Yereli SEO (mersin matbaa, mersin baskı) için kritik.
 */
export function LocalBusinessJsonLd() {
  const data = {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    "@id": `${SITE}/#localbusiness`,
    name: "Markala — Matbaa & Reklam Ürünleri",
    image: `${SITE}/og-default.png`,
    url: SITE,
    telephone: "+90-324-433-3351",
    email: "merhaba@markala.com.tr",
    priceRange: "₺₺",
    address: {
      "@type": "PostalAddress",
      streetAddress: "Çiftlikköy Mah. 32182 Sk. Astoria One No:13 İç Kapı No:61",
      addressLocality: "Yenişehir",
      addressRegion: "Mersin",
      postalCode: "33060",
      addressCountry: "TR",
    },
    geo: {
      "@type": "GeoCoordinates",
      latitude: 36.812061,
      longitude: 34.641482,
    },
    openingHoursSpecification: [
      {
        "@type": "OpeningHoursSpecification",
        dayOfWeek: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
        opens: "09:00",
        closes: "18:00",
      },
      {
        "@type": "OpeningHoursSpecification",
        dayOfWeek: "Saturday",
        opens: "09:00",
        closes: "17:00",
      },
    ],
    areaServed: [
      { "@type": "Country", name: "Türkiye" },
      { "@type": "City", name: "Mersin" },
      { "@type": "City", name: "Adana" },
      { "@type": "City", name: "İstanbul" },
      { "@type": "City", name: "Ankara" },
      { "@type": "City", name: "İzmir" },
    ],
    paymentAccepted: ["Kredi Kartı", "Banka Kartı", "Havale/EFT"],
    currenciesAccepted: "TRY",
    sameAs: [
      "https://www.instagram.com/markala.com.tr",
      "https://www.linkedin.com/company/324ajans",
      "https://324ajans.com",
    ],
  };
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, "\\u003c") }}
    />
  );
}

/**
 * HowTo schema — anasayfadaki üretim süreci timeline'ı için.
 * Google rich snippet "step-by-step guide" olarak görünür.
 */
export function HowToProductionJsonLd() {
  const data = {
    "@context": "https://schema.org",
    "@type": "HowTo",
    "@id": `${SITE}/#howto-production`,
    name: "Markala Matbaa Sipariş Süreci — 5 Adım",
    description:
      "Markala'da matbaa siparişi nasıl verilir? Konfigüratörden teslimata kadar 5 adımda süreç.",
    totalTime: "PT5D", // ISO 8601 — 5 gün ortalama
    // estimatedCost kaldırıldı: ürünler 34,90₺'den başlıyor; sabit "200 TRY" yanıltıcıydı
    // (kaldırılan "200 TL'den" görünür iddiasının makine-okur kalıntısı). Alan opsiyonel.
    supply: [
      { "@type": "HowToSupply", name: "Tasarım dosyası (PDF/X) veya brief" },
      { "@type": "HowToSupply", name: "Teslimat adresi" },
      { "@type": "HowToSupply", name: "Ödeme yöntemi" },
    ],
    step: [
      {
        "@type": "HowToStep",
        position: 1,
        name: "Sipariş Ver",
        text: "Konfigüratörden paket, ebat ve adet seç. Anında fiyat gör.",
        url: `${SITE}/urunler`,
      },
      {
        "@type": "HowToStep",
        position: 2,
        name: "Tasarım",
        text: "Hazır dosyanı yükle veya ücretsiz tasarım desteği iste.",
        url: `${SITE}/hizmetler/tasarim-destegi`,
      },
      {
        "@type": "HowToStep",
        position: 3,
        name: "Üretim",
        text: "Onaylı tasarım kalite kontrolünden geçer, üretime alınır.",
      },
      {
        "@type": "HowToStep",
        position: 4,
        name: "Paketleme",
        text: "Hasarsız ulaşması için özel ambalaj. Fotoğraflı tutanak.",
      },
      {
        "@type": "HowToStep",
        position: 5,
        name: "Kargo",
        text: "DHL veya Aras Kargo ile 81 ile teslim. Takip linki SMS/e-posta.",
      },
    ],
  };
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, "\\u003c") }}
    />
  );
}

/**
 * ItemList schema — /urunler ve /matbaa hub sayfaları için.
 * Google rich snippet "list of products" olarak görünür.
 */
export function ProductItemListJsonLd({
  products,
  name,
  url,
}: {
  products: Array<{ slug: string; name: string; startingPrice?: number; basePrice: number }>;
  name: string;
  url: string;
}) {
  const data = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    "@id": `${SITE}${url}#list`,
    name,
    numberOfItems: products.length,
    itemListElement: products.slice(0, 50).map((p, i) => ({
      "@type": "ListItem",
      position: i + 1,
      url: `${SITE}/urun/${p.slug}`,
      name: p.name,
    })),
  };
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, "\\u003c") }}
    />
  );
}

/**
 * Article schema — yardım merkezi makaleleri ve içerik sayfaları için.
 * Google "Article" rich result için uygun (haber/blog değil; rehber/yardım için).
 */
export function ArticleJsonLd({
  title,
  description,
  url,
  datePublished,
  dateModified,
  image,
}: {
  title: string;
  description: string;
  url: string;
  datePublished: string;
  dateModified?: string;
  image?: string; // Google rich result için zorunlu — verilmezse brand mockup fallback
}) {
  const resolvedImage = image
    ? image.startsWith("http")
      ? image
      : `${SITE}${image}`
    : `${SITE}/og-default.png`;
  const data = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: title,
    description,
    image: resolvedImage,
    url: `${SITE}${url}`,
    datePublished,
    dateModified: dateModified ?? datePublished,
    author: { "@type": "Organization", name: "Markala", url: SITE },
    publisher: {
      "@type": "Organization",
      name: "Markala",
      logo: {
        "@type": "ImageObject",
        url: `${SITE}/og-default.png`,
      },
    },
    mainEntityOfPage: { "@type": "WebPage", "@id": `${SITE}${url}` },
  };
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, "\\u003c") }}
    />
  );
}

/**
 * VideoObject schema — gelecekteki tanıtım/eğitim videoları için hazır component.
 * Şu an kullanılmıyor; ürün konfigüratör tanıtımı veya tutorial videolar için ileride.
 */
export function VideoObjectJsonLd({
  name,
  description,
  thumbnailUrl,
  uploadDate,
  contentUrl,
  duration,
}: {
  name: string;
  description: string;
  thumbnailUrl: string;
  uploadDate: string;
  contentUrl: string;
  duration?: string; // ISO 8601 — örn. "PT1M30S"
}) {
  const data = {
    "@context": "https://schema.org",
    "@type": "VideoObject",
    name,
    description,
    thumbnailUrl: thumbnailUrl.startsWith("http") ? thumbnailUrl : `${SITE}${thumbnailUrl}`,
    uploadDate,
    contentUrl: contentUrl.startsWith("http") ? contentUrl : `${SITE}${contentUrl}`,
    ...(duration ? { duration } : {}),
    publisher: {
      "@type": "Organization",
      name: "Markala",
      logo: {
        "@type": "ImageObject",
        url: `${SITE}/og-default.png`,
      },
    },
  };
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, "\\u003c") }}
    />
  );
}

/**
 * Site-wide aggregate rating fetcher — şu an mock değer döner.
 *
 * TODO(prisma): Production'da Prisma'dan dinamik veri çek. Mock kalırsa
 * Google "hardcoded review count" olarak yakalayıp structured data ihlali
 * raporlayabilir. Bağlandıktan sonra aşağıdaki imzayla doldur:
 *
 *   const agg = await prisma.review.aggregate({
 *     _avg: { rating: true },
 *     _count: { _all: true },
 *     where: { status: "APPROVED" },
 *   });
 *   return { average: agg._avg.rating ?? 0, count: agg._count._all };
 */
export async function fetchSiteRating(): Promise<{ average: number; count: number }> {
  // TODO(prisma): mock — gerçek review tablosuna bağla
  return { average: 4.8, count: 2450 };
}

/**
 * Per-product aggregate rating fetcher.
 *
 * TODO(prisma): Bağlandığında aşağıdaki query'yi aç:
 *   const result = await prisma.review.aggregate({
 *     where: { product: { slug }, isApproved: true },
 *     _avg: { rating: true },
 *     _count: { _all: true },
 *   });
 *   return result._count._all > 0
 *     ? { average: result._avg.rating!, count: result._count._all }
 *     : null;
 *
 * Mock değer dönmüyoruz — Google, hardcoded review sayısını "yapay
 * AggregateRating" olarak işaretler. Gerçek veri yoksa null dön → component
 * AggregateRating bloğunu hiç render etmesin.
 */
export async function fetchProductRating(
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  slug: string,
): Promise<{ average: number; count: number } | null> {
  return null;
}

/**
 * FAQPage schema — yardım merkezi veya ürün dışı SSS sayfaları için.
 * Ürün sayfasındaki SSS'ler için ProductJsonLd içindeki FAQPage bloğunu kullan.
 */
export function FAQPageJsonLd({
  questions,
  url,
}: {
  questions: Array<{ q: string; a: string }>;
  url: string;
}) {
  const data = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "@id": `${SITE}${url}#faq`,
    mainEntity: questions.map((item) => ({
      "@type": "Question",
      name: item.q,
      acceptedAnswer: { "@type": "Answer", text: item.a },
    })),
  };
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, "\\u003c") }}
    />
  );
}

/** Kategori sayfası için CollectionPage. */
export function CategoryJsonLd({ category, products }: { category: Category; products: Product[] }) {
  const url = `${SITE}/kategori/${category.slug}`;
  const data = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    "@id": `${url}#collection`,
    url,
    name: category.name,
    description: category.shortDescription,
    inLanguage: "tr-TR",
    isPartOf: { "@id": `${SITE}/#website` },
    mainEntity: {
      "@type": "ItemList",
      numberOfItems: products.length,
      itemListElement: products.slice(0, 24).map((p, i) => ({
        "@type": "ListItem",
        position: i + 1,
        url: `${SITE}/urun/${p.slug}`,
        name: p.name,
      })),
    },
  };
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, "\\u003c") }}
    />
  );
}
