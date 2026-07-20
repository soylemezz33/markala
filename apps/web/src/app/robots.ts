import type { MetadataRoute } from "next";

const SITE = "https://markala.com.tr";

// Ortak disallow seti. DİKKAT: kendi user-agent grubunu bulan bot `*` grubunu TAMAMEN
// yok sayar — bu yüzden bot-özel grup açılacaksa bu liste oraya da kopyalanmalı.
const DISALLOW = [
  "/api/",
  "/hesabim/",
  "/sepet",
  "/odeme",
  "/odeme/",
  "/giris",
  "/kayit",
  "/favorilerim",
  "/hesabim",
  "/sifre-sifirla",
  "/eposta-dogrula",
  "/kvkk-basvuru",
  "/widget/",
  "/*?utm_*",
  "/*?ref=*",
  "/*?fbclid=*",
  "/*?gclid=*",
  // Pagination ve filter parametreleri (duplicate content önler)
  "/*?page=*",
  "/*?sort=*",
  "/*?filter=*",
];

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      // Tek genel grup — Googlebot/Bingbot/YandexBot dahil tüm yararlı botlar buraya düşer.
      // Eski bot-özel gruplar kaldırıldı: kendi grubunu bulan bot `*`ı yok saydığından
      // Googlebot /api/mockup allow'undan ve utm/pagination disallow'larından yoksun kalıyordu.
      {
        userAgent: "*",
        allow: ["/", "/api/mockup"], // Mockup endpoint OG image için crawl edilebilir
        disallow: DISALLOW,
      },
      // AI arama/cevap botları AÇIK (AEO — 2026-07-20): GPTBot, OAI-SearchBot, ChatGPT-User,
      // ClaudeBot/Claude-SearchBot/Claude-User, PerplexityBot, Google-Extended `*` kuralına düşer
      // (Allow / + standart disallow'lar). Rakiplerin 5/5'i açık; görünürlük için biz de açığız.
      // Saf eğitim/scraping koleksiyoncuları kapalı kalır — görünürlük katkıları yok:
      { userAgent: "CCBot", disallow: "/" },
      { userAgent: "Bytespider", disallow: "/" },
      { userAgent: "meta-externalagent", disallow: "/" },
      { userAgent: "FacebookBot", disallow: "/" },
      // Agresif SEO crawler'lara hız limiti + `*`daki disallow seti (kendi grubu olan bot
      // `*` kurallarını görmez; yalnız crawlDelay bırakılırsa her yeri gezebilirler)
      { userAgent: "AhrefsBot", disallow: DISALLOW, crawlDelay: 10 },
      { userAgent: "SemrushBot", disallow: DISALLOW, crawlDelay: 10 },
      { userAgent: "MJ12bot", disallow: DISALLOW, crawlDelay: 10 },
      { userAgent: "DotBot", disallow: "/" },
    ],
    sitemap: `${SITE}/sitemap.xml`,
    host: SITE,
  };
}
