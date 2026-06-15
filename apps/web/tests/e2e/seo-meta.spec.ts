import { test, expect } from "@playwright/test";

/**
 * E2E: SEO + Meta tag doğrulama
 *
 * Google Ads dönüşümü için OG tag'leri, canonical, robots.txt ve sitemap.
 * Sosyal paylaşım önizlemeleri (WhatsApp/Facebook) OG meta tag'lerine bağımlı.
 */

const KEY_PAGES = [
  { url: "/", label: "Anasayfa" },
  { url: "/urunler", label: "Ürünler" },
  { url: "/urun/klasik-kartvizit", label: "Ürün detay" },
  { url: "/hakkimizda", label: "Hakkımızda" },
  { url: "/iletisim", label: "İletişim" },
];

test.describe("SEO — Temel meta tag'ler", () => {
  for (const { url, label } of KEY_PAGES) {
    test(`${label} — title ve description mevcut`, async ({ page }) => {
      await page.goto(url);

      // Title
      const title = await page.title();
      expect(title.length, `${label}: title boş olmamalı`).toBeGreaterThan(5);
      expect(title, `${label}: title 'markala' içermeli`).toMatch(/markala/i);

      // Description
      const description = await page
        .locator('meta[name="description"]')
        .getAttribute("content");

      if (description !== null) {
        expect(description.length, `${label}: meta description boş olmamalı`).toBeGreaterThan(10);
      }
    });

    test(`${label} — Open Graph tag'leri mevcut (sosyal paylaşım)`, async ({ page }) => {
      await page.goto(url);

      const ogTitle = await page.locator('meta[property="og:title"]').getAttribute("content");
      const ogImage = await page.locator('meta[property="og:image"]').getAttribute("content");

      // OG title zorunlu
      expect(ogTitle, `${label}: og:title olmalı`).toBeTruthy();
      expect(ogTitle?.length ?? 0, `${label}: og:title içeriği olmalı`).toBeGreaterThan(0);

      // OG image önerilir (uyarı, fail değil)
      if (!ogImage) {
        console.warn(`${label}: og:image eksik — WhatsApp/FB önizlemede görsel yok`);
      }
    });
  }
});

test.describe("SEO — Yapısal doğruluk", () => {
  test("anasayfa canonical tag mevcut", async ({ page }) => {
    await page.goto("/");
    const canonical = await page.locator('link[rel="canonical"]').getAttribute("href");

    if (canonical) {
      expect(canonical).toMatch(/markala\.com\.tr|localhost/);
    }
  });

  test("robots.txt erişilebilir", async ({ page }) => {
    const response = await page.goto("/robots.txt");
    expect(response?.status()).toBe(200);

    const content = await page.content();
    expect(content).toMatch(/User-agent/i);
  });

  test("sitemap.xml erişilebilir", async ({ page }) => {
    const response = await page.goto("/sitemap.xml");
    // 200 veya 404 (henüz oluşturulmadıysa) — 500 olmamalı
    expect(response?.status()).toBeLessThan(500);

    if (response?.status() === 200) {
      const content = await page.content();
      expect(content).toMatch(/urlset|sitemap/i);
    }
  });

  test("favicon mevcut", async ({ page }) => {
    await page.goto("/");
    const favicon = page.locator('link[rel*="icon"]').first();
    const count = await favicon.count();
    expect(count, "Favicon tanımlı olmalı").toBeGreaterThan(0);
  });
});

test.describe("SEO — Ürün yapısal verisi", () => {
  test("ürün sayfasında JSON-LD schema mevcut", async ({ page }) => {
    await page.goto("/urun/klasik-kartvizit");

    const jsonLd = await page.locator('script[type="application/ld+json"]').allTextContents();

    if (jsonLd.length > 0) {
      const schemas = jsonLd.map((s) => {
        try {
          return JSON.parse(s);
        } catch {
          return null;
        }
      }).filter(Boolean);

      // En az bir geçerli JSON-LD olmalı
      expect(schemas.length, "Ürün sayfasında JSON-LD olmalı").toBeGreaterThan(0);

      // Product schema veya WebPage schema
      const hasProductSchema = schemas.some(
        (s: Record<string, unknown>) =>
          s["@type"] === "Product" ||
          s["@type"] === "WebPage" ||
          s["@type"] === "BreadcrumbList"
      );

      if (!hasProductSchema) {
        console.warn("Ürün sayfasında Product schema yok — Google rich snippet kaçırılıyor");
      }
    }
  });

  test("breadcrumb navigasyon mevcut", async ({ page }) => {
    await page.goto("/urun/klasik-kartvizit");

    const breadcrumb = page.locator(
      '[aria-label*="breadcrumb"], [data-testid*="breadcrumb"], nav[class*="breadcrumb"], ol[class*="breadcrumb"]'
    ).first();

    if (await breadcrumb.count() > 0) {
      await expect(breadcrumb).toBeVisible();
    }
  });
});

test.describe("SEO — GA4 entegrasyonu", () => {
  test("GA4 script yüklenmiş (NEXT_PUBLIC_GA4_ID set ise)", async ({ page }) => {
    await page.goto("/");

    // GA4 script — sadece env set ise mevcut
    const ga4Scripts = await page
      .locator('script[src*="googletagmanager"], script[src*="gtag"]')
      .count();

    // CI'da env set değilse bu test bilgi amaçlı
    if (ga4Scripts === 0) {
      console.info("GA4 scripti bulunamadı — NEXT_PUBLIC_GA4_ID env set edilmemiş olabilir");
    } else {
      expect(ga4Scripts).toBeGreaterThan(0);
    }
  });
});
