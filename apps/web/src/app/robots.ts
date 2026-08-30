import type { MetadataRoute } from "next";

const SITE = "https://markala.com.tr";

// Ortak disallow seti. DİKKAT: kendi user-agent grubunu bulan bot `*` grubunu TAMAMEN
// yok sayar — bu yüzden bot-özel grup açılacaksa bu liste oraya da kopyalanmalı.
const DISALLOW = [
  // CF Email Obfuscation footer mailto'larını /cdn-cgi/l/email-protection'a çevirir;
  // URL 404 döner ve her sayfa "kırık linkli" işaretlenir. Cloudflare'in resmi önerisi
  // /cdn-cgi/'yi robots'ta engellemek (developers.cloudflare.com/fundamentals/reference/cdn-cgi-endpoint/).
  "/cdn-cgi/",
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
  // Sort/filter parametreleri (duplicate content önler). ?page= disallow'u KALDIRILDI
  // (2026-07-20): sayfalama artık gerçek URL (self-canonical, SSR dilim) — derin ürün
  // linklerinin keşfi için ?page=N'in crawl edilebilir olması gerekir.
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
      // AI arama/cevap botlarına AÇIK DAVET (2026-08-30): `*` kuralı zaten yeterliydi ama
      // bazı botlar kendi adına yazılmış grubu "izin verilmiş" sinyali sayıyor ve tarama
      // önceliğini ona göre kuruyor. Bu yüzden her biri için AÇIK Allow + aynı disallow seti
      // (kendi grubunu bulan bot `*`ı yok sayar — set kopyalanmak ZORUNDA) + llms.txt işareti.
      ...[
        "GPTBot", // OpenAI tarama
        "OAI-SearchBot", // ChatGPT arama dizini
        "ChatGPT-User", // kullanıcı isteğiyle canlı getirme
        "ClaudeBot",
        "Claude-SearchBot",
        "Claude-User",
        "PerplexityBot",
        "Perplexity-User",
        "Google-Extended", // Gemini/AI Overviews
        "Applebot-Extended", // Apple Intelligence
        "Amazonbot", // Alexa/Rufus cevapları
        "DuckAssistBot",
        "Bingbot", // Copilot'un kaynağı
      ].map((ua) => ({ userAgent: ua, allow: ["/", "/api/mockup", "/llms.txt"], disallow: DISALLOW })),
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
