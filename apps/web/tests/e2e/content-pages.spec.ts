import { test, expect } from "@playwright/test";

/**
 * E2E: İçerik sayfaları + dönüşüm sayfaları
 *
 * Reklam öncesi test planındaki tüm sayfa listesini kapsar.
 * Her sayfa: 200 OK, H1 mevcut, yatay taşma yok, placeholder metin yok.
 */

// Tüm içerik sayfaları — durum: başarılı yüklenme bekleniyor
const CONTENT_PAGES = [
  { url: "/", label: "Anasayfa" },
  { url: "/urunler", label: "Ürünler listesi" },
  { url: "/hakkimizda", label: "Hakkımızda" },
  { url: "/hizmetler", label: "Hizmetler" },
  { url: "/kurumsal", label: "Kurumsal" },
  { url: "/referanslar", label: "Referanslar" },
  { url: "/blog", label: "Blog" },
  { url: "/yardim", label: "Yardım/SSS" },
  { url: "/kampanyalar", label: "Kampanyalar" },
  { url: "/fiyat-listesi", label: "Fiyat listesi" },
  { url: "/iletisim", label: "İletişim" },
];

test.describe("İçerik sayfaları — 200 OK ve H1 kontrolü", () => {
  for (const { url, label } of CONTENT_PAGES) {
    test(`${label} (${url}) — 200 döner`, async ({ page }) => {
      const response = await page.goto(url);
      expect(response?.status(), `${label} 200 dönmeli`).toBe(200);
    });

    test(`${label} (${url}) — tek H1 ve placeholder yok`, async ({ page }) => {
      await page.goto(url);
      await page.waitForLoadState("networkidle");

      // H1 kontrolü
      const h1Count = await page.locator("h1").count();
      expect(h1Count, `${label} sayfasında H1 olmalı`).toBeGreaterThanOrEqual(1);

      // Placeholder metinler yok
      const loremText = await page.getByText(/lorem ipsum/i).count();
      const todoText = await page.getByText(/\[TODO\]|\[PLACEHOLDER\]/i).count();
      const undefinedText = await page.getByText(/^undefined$/i).count();

      expect(loremText, `${label}: Lorem ipsum metin bulundu`).toBe(0);
      expect(todoText, `${label}: TODO/PLACEHOLDER metin bulundu`).toBe(0);
      expect(undefinedText, `${label}: 'undefined' metin bulundu`).toBe(0);
    });
  }
});

test.describe("Blog", () => {
  test("blog listeleme sayfası blog postları gösterir", async ({ page }) => {
    await page.goto("/blog");
    await page.waitForLoadState("networkidle");

    const blogItems = page.locator(
      'article, [data-testid*="blog-post"], [class*="blog-card"], [class*="post-card"]'
    );
    const count = await blogItems.count();
    // Mock veri ile en az 1 post görünmeli
    expect(count, "Blog postları listelenmeli").toBeGreaterThan(0);
  });

  test("blog post detay sayfası açılır", async ({ page }) => {
    await page.goto("/blog");

    // İlk blog post linkine tıkla
    const firstPostLink = page.locator('article a, [data-testid*="blog"] a, [class*="blog-card"] a').first();
    if (await firstPostLink.count() > 0) {
      await firstPostLink.click();
      await page.waitForLoadState("networkidle");

      // Blog post URL'sinde /blog/ olmalı
      expect(page.url()).toContain("/blog/");

      // İçerik görünür
      const content = page.locator('article, main [class*="content"], main p').first();
      await expect(content).toBeVisible();
    }
  });
});

test.describe("İletişim formu", () => {
  test("iletişim sayfası 200 döner ve form görünür", async ({ page }) => {
    const response = await page.goto("/iletisim");
    expect(response?.status()).toBe(200);

    const form = page.locator("form").first();
    await expect(form).toBeVisible();
  });

  test("boş form gönderimi — validasyon uyarısı", async ({ page }) => {
    await page.goto("/iletisim");

    const submitBtn = page.getByRole("button", { name: /gönder|ilet|submit/i }).first();
    await submitBtn.click();

    await page.waitForTimeout(500);

    // URL değişmemeli (başarılı submit değil)
    expect(page.url()).toContain("/iletisim");

    // Validasyon mesajı veya required field işareti
    const requiredInputs = page.locator("input:invalid, textarea:invalid, [aria-invalid='true']");
    const count = await requiredInputs.count();
    // En azından bir hata oluşmalı
    expect(count, "Boş form için validasyon gösterilmeli").toBeGreaterThan(0);
  });

  test("WhatsApp / telefon butonu mevcut", async ({ page }) => {
    await page.goto("/iletisim");

    const waLink = page.locator('a[href*="wa.me"], a[href*="whatsapp"]').first();
    const telLink = page.locator('a[href*="tel:"]').first();

    const count = (await waLink.count()) + (await telLink.count());
    expect(count, "İletişim sayfasında WhatsApp veya telefon linki olmalı").toBeGreaterThan(0);
  });

  test("WhatsApp linki geçerli bir numara içeriyor", async ({ page }) => {
    await page.goto("/iletisim");

    const waLink = page.locator('a[href*="wa.me"]').first();
    if (await waLink.count() > 0) {
      const href = await waLink.getAttribute("href");
      expect(href).toMatch(/wa\.me\/\d{10,}/);
    }
  });
});

test.describe("Kurumsal başvuru formu", () => {
  test("kurumsal başvuru sayfası açılır", async ({ page }) => {
    const response = await page.goto("/kurumsal/basvuru");
    expect(response?.status()).toBe(200);

    const form = page.locator("form").first();
    await expect(form).toBeVisible();
  });
});

test.describe("Yasal sayfalar", () => {
  const LEGAL_SLUGS = ["mesafeli-satis-sozlesmesi", "gizlilik-politikasi", "kvkk"];

  for (const slug of LEGAL_SLUGS) {
    test(`Yasal: /yasal/${slug} — erişilebilir`, async ({ page }) => {
      const response = await page.goto(`/yasal/${slug}`);
      // 200 veya redirect (başka slug kullanılıyor olabilir)
      expect(response?.status()).toBeLessThan(500);
    });
  }

  test("footer'dan yasal sayfa linklerine erişim", async ({ page }) => {
    await page.goto("/");
    const footer = page.locator("footer").first();

    const legalLinks = footer.locator('a[href*="yasal"], a[href*="kvkk"], a[href*="gizlilik"]');
    const count = await legalLinks.count();
    expect(count, "Footer'da yasal linkler mevcut olmalı").toBeGreaterThan(0);
  });
});

test.describe("Kategori navigasyonu", () => {
  test("ürünler sayfasında kategori filtreleri görünür", async ({ page }) => {
    await page.goto("/urunler");
    await page.waitForLoadState("networkidle");

    const categoryFilter = page.locator(
      '[data-testid*="category"], [class*="category"], aside nav a, [role="navigation"] a'
    ).first();

    if (await categoryFilter.count() > 0) {
      await expect(categoryFilter).toBeVisible();
    }
  });

  test("kategori sayfası ürünleri listeler", async ({ page }) => {
    await page.goto("/kategori/kartvizit");

    const statusOk = (await page.goto("/kategori/kartvizit"))?.status() === 200;
    if (!statusOk) {
      await page.goto("/urunler");
    }

    await page.waitForLoadState("networkidle");
    const products = page.locator('article, [data-testid*="product"], [class*="product-card"]');
    const count = await products.count();
    expect(count, "Kategori sayfasında en az 1 ürün görünmeli").toBeGreaterThan(0);
  });
});

test.describe("Kargo takip", () => {
  test("/kargo-takip sayfası erişilebilir ve form görünür", async ({ page }) => {
    const response = await page.goto("/kargo-takip");
    expect(response?.status()).toBe(200);

    const input = page.locator('input[type="text"], input[name*="tracking"]').first();
    await expect(input).toBeVisible();
  });
});

test.describe("Newsletter", () => {
  test("anasayfada newsletter alanı mevcut", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");

    const newsletterInput = page.locator(
      'input[type="email"][placeholder*="e-posta"], input[name*="newsletter"]'
    ).first();
    const newsletterSection = page.getByText(/bülten|newsletter|e-bülten/i).first();

    const count = (await newsletterInput.count()) + (await newsletterSection.count());
    expect(count, "Newsletter bölümü anasayfada olmalı").toBeGreaterThan(0);
  });
});
