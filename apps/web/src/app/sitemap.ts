import type { MetadataRoute } from "next";
import { getProducts, getCategories } from "@/lib/catalog";
import { getBlogPosts, getBlogCategories } from "@/lib/blog";
import { getLegalSlugs } from "@/lib/legal";
import { cities, getAllDistrictParams } from "@/lib/cities";
import { services } from "@/lib/services";
import { helpArticleSlugs } from "@/lib/help-articles";

const SITE = "https://markala.com.tr";

const STATIC_ROUTES = [
  { path: "/", priority: 1.0, freq: "daily" as const },
  { path: "/urunler", priority: 0.9, freq: "daily" as const },
  { path: "/kategoriler", priority: 0.9, freq: "weekly" as const },
  { path: "/kampanyalar", priority: 0.9, freq: "weekly" as const },
  { path: "/blog", priority: 0.85, freq: "weekly" as const },
  { path: "/matbaa", priority: 0.95, freq: "weekly" as const },
  { path: "/hizmetler", priority: 0.9, freq: "monthly" as const },
  { path: "/sozluk", priority: 0.8, freq: "monthly" as const },
  { path: "/fiyat-listesi", priority: 0.95, freq: "weekly" as const },
  { path: "/kurumsal", priority: 0.85, freq: "monthly" as const },
  { path: "/teklif-al", priority: 0.8, freq: "monthly" as const },
  { path: "/numune-talebi", priority: 0.75, freq: "monthly" as const },
  { path: "/yardim", priority: 0.7, freq: "weekly" as const },
  { path: "/referanslar", priority: 0.6, freq: "monthly" as const },
  { path: "/portfolio", priority: 0.7, freq: "monthly" as const },
  { path: "/hakkimizda", priority: 0.7, freq: "monthly" as const },
  { path: "/iletisim", priority: 0.7, freq: "monthly" as const },
  { path: "/kargo-takip", priority: 0.5, freq: "monthly" as const },
  // /favorilerim, /giris, /kayit robots.txt'de disallow — sitemap'e girmiyor
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [products, categories, blogPosts, blogCategories, legalSlugs] = await Promise.all([
    getProducts(),
    getCategories(),
    getBlogPosts(),
    getBlogCategories(),
    getLegalSlugs(),
  ]);

  // API blip'inde ürün listesi boş dönerse sitemap ÜRÜNSÜZ üretilip yayınlanır ve yüzlerce
  // ürün URL'si indeksten düşebilir. Throw → route hata verir, eski (stale) sitemap ayakta kalır.
  if (products.length === 0) {
    throw new Error("sitemap: ürün listesi boş döndü — ürünsüz sitemap yayınlanmaz, eski sürüm korunur");
  }

  // Statik/city/service/help gibi girdilerde lastModified BİLEREK yok: her üretimde
  // "bugün" yazmak sahte tazelik sinyalidir (tüm site her gün değişmiş görünür, crawl
  // budget israfı). Gerçek tarih bilinen girdiler (ürün/kategori/blog) kendi tarihini yazar.
  const staticEntries: MetadataRoute.Sitemap = STATIC_ROUTES.map((r) => ({
    url: `${SITE}${r.path}`,
    changeFrequency: r.freq,
    priority: r.priority,
  }));

  // lastModified artık API'den gelen gerçek updatedAt (ISO). Yoksa alan atlanır —
  // bugünün tarihini sahte yazmak tüm kataloğu her gün güncelleniyor gibi gösterir
  // (crawl budget israfı). isoDate() geçersiz/eksik değeri undefined'a indirir.
  const productEntries: MetadataRoute.Sitemap = products.map((p) => ({
    url: `${SITE}/urun/${p.slug}`,
    ...(p.updatedAt ? { lastModified: new Date(p.updatedAt) } : {}),
    changeFrequency: "weekly",
    priority: p.bestseller ? 0.85 : 0.7,
  }));

  const categoryEntries: MetadataRoute.Sitemap = categories.map((c) => ({
    url: `${SITE}/kategori/${c.slug}`,
    ...(c.updatedAt ? { lastModified: new Date(c.updatedAt) } : {}),
    changeFrequency: "weekly",
    priority: 0.8,
  }));

  const legalEntries: MetadataRoute.Sitemap = legalSlugs.map((slug) => ({
    url: `${SITE}/yasal/${slug}`,
    changeFrequency: "yearly",
    priority: 0.4,
  }));

  const blogEntries: MetadataRoute.Sitemap = blogPosts.map((p) => ({
    url: `${SITE}/blog/${p.slug}`,
    lastModified: new Date(p.publishedAt),
    changeFrequency: "monthly",
    priority: 0.7,
  }));

  const blogCategoryEntries: MetadataRoute.Sitemap = blogCategories.map((c) => ({
    url: `${SITE}/blog/kategori/${c.slug}`,
    changeFrequency: "weekly",
    priority: 0.5,
  }));

  // Yardım merkezi makaleleri — tam metadata + ArticleJsonLd + Breadcrumb'a sahip,
  // indekse hazır. /yardim hub'ı yanında tekil makaleler de sitemap'e girer.
  const helpArticleEntries: MetadataRoute.Sitemap = helpArticleSlugs.map((slug) => ({
    url: `${SITE}/yardim/${slug}`,
    changeFrequency: "monthly",
    priority: 0.6,
  }));

  // Şehir landing'leri — Mersin priority en yüksek
  const cityEntries: MetadataRoute.Sitemap = cities.map((c) => ({
    url: `${SITE}/matbaa/${c.slug}`,
    changeFrequency: "weekly",
    priority: c.slug === "mersin" ? 0.95 : 0.85,
  }));

  // İlçe landing'leri — sadece Mersin ilçeleri var şu an
  const districtEntries: MetadataRoute.Sitemap = getAllDistrictParams().map(
    ({ city, district }) => ({
      url: `${SITE}/matbaa/${city}/${district}`,
      changeFrequency: "monthly",
      priority: 0.75,
    }),
  );

  // Hizmet sayfaları
  const serviceEntries: MetadataRoute.Sitemap = services.map((s) => ({
    url: `${SITE}/hizmetler/${s.slug}`,
    changeFrequency: "monthly",
    priority: 0.85,
  }));

  return [
    ...staticEntries,
    ...cityEntries,
    ...districtEntries,
    ...serviceEntries,
    ...categoryEntries,
    ...productEntries,
    ...blogEntries,
    ...blogCategoryEntries,
    ...helpArticleEntries,
    ...legalEntries,
  ];
}
