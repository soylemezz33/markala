import type { MetadataRoute } from "next";

const SITE = "https://markala.com.tr";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/", "/api/mockup"], // Mockup endpoint OG image için crawl edilebilir
        disallow: [
          "/api/",
          "/hesabim/",
          "/sepet",
          "/odeme",
          "/odeme/",
          "/giris",
          "/kayit",
          "/favorilerim",
          "/widget/",
          "/*?utm_*",
          "/*?ref=*",
          "/*?fbclid=*",
          "/*?gclid=*",
          // Pagination ve filter parametreleri (duplicate content önler)
          "/*?page=*",
          "/*?sort=*",
          "/*?filter=*",
        ],
      },
      // Yararlı bot — Google
      {
        userAgent: "Googlebot",
        allow: "/",
        disallow: ["/api/", "/hesabim/", "/sepet", "/odeme/", "/giris", "/kayit"],
      },
      // Bing
      {
        userAgent: "Bingbot",
        allow: "/",
        disallow: ["/api/", "/hesabim/", "/sepet", "/odeme/", "/giris", "/kayit"],
        crawlDelay: 1,
      },
      // Yandex
      {
        userAgent: "YandexBot",
        allow: "/",
        disallow: ["/api/", "/hesabim/", "/sepet", "/odeme/", "/giris", "/kayit"],
        crawlDelay: 2,
      },
      // Saldırgan AI crawler bloku — verimizin LLM eğitiminde kullanılmasını engelle
      { userAgent: "GPTBot", disallow: "/" },
      { userAgent: "CCBot", disallow: "/" },
      { userAgent: "anthropic-ai", disallow: "/" },
      { userAgent: "ClaudeBot", disallow: "/" },
      { userAgent: "Claude-Web", disallow: "/" },
      { userAgent: "Google-Extended", disallow: "/" },
      { userAgent: "PerplexityBot", disallow: "/" },
      { userAgent: "FacebookBot", disallow: "/" },
      { userAgent: "Bytespider", disallow: "/" },
      // Agresif SEO crawler'lara hız limiti
      { userAgent: "AhrefsBot", crawlDelay: 10 },
      { userAgent: "SemrushBot", crawlDelay: 10 },
      { userAgent: "MJ12bot", crawlDelay: 10 },
      { userAgent: "DotBot", disallow: "/" },
    ],
    sitemap: `${SITE}/sitemap.xml`,
    host: SITE,
  };
}
