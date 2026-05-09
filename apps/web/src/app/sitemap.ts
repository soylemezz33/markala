import type { MetadataRoute } from "next";
import { products, categories, getAllLegalSlugs } from "@markala/mock-data";
import { blogPosts, blogCategories } from "@/lib/blog";
import { cities, getAllDistrictParams } from "@/lib/cities";
import { services } from "@/lib/services";

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
  { path: "/yardim", priority: 0.7, freq: "weekly" as const },
  { path: "/referanslar", priority: 0.6, freq: "monthly" as const },
  { path: "/hakkimizda", priority: 0.7, freq: "monthly" as const },
  { path: "/iletisim", priority: 0.7, freq: "monthly" as const },
  { path: "/kargo-takip", priority: 0.5, freq: "monthly" as const },
  { path: "/favorilerim", priority: 0.4, freq: "yearly" as const },
  { path: "/giris", priority: 0.3, freq: "yearly" as const },
  { path: "/kayit", priority: 0.3, freq: "yearly" as const },
];

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();

  const staticEntries: MetadataRoute.Sitemap = STATIC_ROUTES.map((r) => ({
    url: `${SITE}${r.path}`,
    lastModified: now,
    changeFrequency: r.freq,
    priority: r.priority,
  }));

  const productEntries: MetadataRoute.Sitemap = products.map((p) => ({
    url: `${SITE}/urun/${p.slug}`,
    lastModified: now,
    changeFrequency: "weekly",
    priority: p.bestseller ? 0.85 : 0.7,
  }));

  const categoryEntries: MetadataRoute.Sitemap = categories.map((c) => ({
    url: `${SITE}/kategori/${c.slug}`,
    lastModified: now,
    changeFrequency: "weekly",
    priority: 0.8,
  }));

  const legalEntries: MetadataRoute.Sitemap = getAllLegalSlugs().map((slug) => ({
    url: `${SITE}/yasal/${slug}`,
    lastModified: now,
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
    lastModified: now,
    changeFrequency: "weekly",
    priority: 0.5,
  }));

  // Şehir landing'leri — Mersin priority en yüksek
  const cityEntries: MetadataRoute.Sitemap = cities.map((c) => ({
    url: `${SITE}/matbaa/${c.slug}`,
    lastModified: now,
    changeFrequency: "weekly",
    priority: c.slug === "mersin" ? 0.95 : 0.85,
  }));

  // İlçe landing'leri — sadece Mersin ilçeleri var şu an
  const districtEntries: MetadataRoute.Sitemap = getAllDistrictParams().map(
    ({ city, district }) => ({
      url: `${SITE}/matbaa/${city}/${district}`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.75,
    }),
  );

  // Hizmet sayfaları
  const serviceEntries: MetadataRoute.Sitemap = services.map((s) => ({
    url: `${SITE}/hizmetler/${s.slug}`,
    lastModified: now,
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
    ...legalEntries,
  ];
}
