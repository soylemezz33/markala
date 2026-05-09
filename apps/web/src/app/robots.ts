import type { MetadataRoute } from "next";

const SITE = "https://markala.com.tr";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/api/",
          "/hesabim/",
          "/sepet",
          "/odeme",
          "/odeme/",
          "/giris",
          "/kayit",
          "/*?utm_*",
          "/*?ref=*",
        ],
      },
      // Saldırgan crawlerlara kısıtlama
      { userAgent: "GPTBot", disallow: "/" },
      { userAgent: "CCBot", disallow: "/" },
      { userAgent: "anthropic-ai", disallow: "/" },
      { userAgent: "ClaudeBot", disallow: "/" },
    ],
    sitemap: `${SITE}/sitemap.xml`,
    host: SITE,
  };
}
