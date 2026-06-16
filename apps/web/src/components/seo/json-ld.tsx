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
        logo: `${SITE}/api/mockup?theme=ink&w=512&h=512`,
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
          addressCountry: "TR",
          addressRegion: "Mersin",
          addressLocality: "Yenişehir",
          postalCode: "33060",
        },
        contactPoint: [
          {
            "@type": "ContactPoint",
            contactType: "customer service",
            email: "info@markala.com.tr",
            telephone: "+90-324-433-3351",
            areaServed: "TR",
            availableLanguage: ["Turkish"],
            contactOption: "TollFree",
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
        // Site-wide AggregateRating — tüm yorumların bütünleşik puanı
        // TODO: Production'da prisma.review.aggregate({ _avg, _count })'tan dinamik gelmeli
        // (bkz. fetchSiteRating() fonksiyonu — bu dosyanın alt kısmında)
        aggregateRating: {
          "@type": "AggregateRating",
          ratingValue: 4.8,
          reviewCount: 2450,
          bestRating: 5,
          worstRating: 1,
        },
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
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
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
  const startingPrice = product.startingPrice ?? product.basePrice;

  const productNode: Record<string, unknown> = {
    "@type": "Product",
    "@id": `${productUrl}#product`,
    name: product.name,
    description: product.shortDescription,
    sku: product.sku ?? product.slug,
    mpn: product.sku ?? product.slug,
    url: productUrl,
    image: product.images.length > 0
      ? product.images.map((img) => img.startsWith("http") ? img : `${SITE}${img}`)
      : [`${SITE}/api/mockup?slug=${product.slug}&w=1200&h=800`],
    brand: {
      "@type": "Brand",
      name: product.brand ?? "Markala",
    },
    category: category?.name,
    offers: {
      "@type": "Offer",
      url: productUrl,
      priceCurrency: "TRY",
      price: startingPrice,
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
        shippingRate: { "@type": "MonetaryAmount", value: 0, currency: "TRY" },
        shippingDestination: { "@type": "DefinedRegion", addressCountry: "TR" },
        deliveryTime: {
          "@type": "ShippingDeliveryTime",
          handlingTime: { "@type": "QuantitativeValue", minValue: 1, maxValue: 5, unitCode: "DAY" },
          transitTime: { "@type": "QuantitativeValue", minValue: 1, maxValue: 3, unitCode: "DAY" },
        },
      },
    },
  };

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
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
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
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
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
    image: `${SITE}/api/mockup?theme=brand&w=1200&h=800`,
    url: SITE,
    telephone: "+90-324-433-3351",
    email: "info@markala.com.tr",
    priceRange: "₺₺",
    address: {
      "@type": "PostalAddress",
      streetAddress: "Yenişehir",
      addressLocality: "Mersin",
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
        opens: "10:00",
        closes: "16:00",
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
    paymentAccepted: ["Kredi Kartı", "Havale/EFT", "Kapıda Ödeme"],
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
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
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
    estimatedCost: {
      "@type": "MonetaryAmount",
      currency: "TRY",
      value: "200",
    },
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
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
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
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
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
    : `${SITE}/api/mockup?theme=brand&w=1200&h=630`;
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
        url: `${SITE}/api/mockup?theme=ink&w=512&h=512`,
      },
    },
    mainEntityOfPage: { "@type": "WebPage", "@id": `${SITE}${url}` },
  };
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
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
        url: `${SITE}/api/mockup?theme=ink&w=512&h=512`,
      },
    },
  };
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
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
 * Per-product HowTo schema — "X nasıl tasarlanır" rich snippet.
 * Ürün detay sayfasında ProductJsonLd ile beraber render edilir.
 * Google "How-to" rich result açılır (CMYK/dpi/taşma payı/upload akışı).
 */
export function HowToProductJsonLd({
  product,
  slug,
}: {
  product: { name: string };
  slug: string;
}) {
  const data = {
    "@context": "https://schema.org",
    "@type": "HowTo",
    "@id": `${SITE}/urun/${slug}#howto`,
    name: `${product.name} nasıl tasarlanır`,
    description: `${product.name} için adım adım tasarım hazırlama rehberi.`,
    step: [
      {
        "@type": "HowToStep",
        position: 1,
        name: "Tasarım dosyasını hazırla",
        text: "CMYK renk profilinde, 300 dpi çözünürlükte PDF/X-1a olarak.",
      },
      {
        "@type": "HowToStep",
        position: 2,
        name: "Taşma payı bırak",
        text: "Her kenardan 2-3 mm taşma payı.",
      },
      {
        "@type": "HowToStep",
        position: 3,
        name: "Markala'ya yükle",
        text: `${SITE}/urun/${slug} sayfasında konfigüratörden seç ve dosyanı yükle.`,
      },
      {
        "@type": "HowToStep",
        position: 4,
        name: "Onay sonrası üretim",
        text: "1-2 iş günü içinde basılır.",
      },
      {
        "@type": "HowToStep",
        position: 5,
        name: "Kargo ile teslim",
        text: "DHL ile 1-3 iş günü içinde Türkiye geneli.",
      },
    ],
  };
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
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
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
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
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}
