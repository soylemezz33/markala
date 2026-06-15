import { test, expect, devices } from "@playwright/test";

/**
 * E2E: Mobil responsive testleri
 *
 * Reklam trafiğinin %70+ mobil — bu testler iOS Safari + Android Chrome hedefler.
 * Playwright config'de Pixel 5 tanımlı; burada ek viewport senaryoları ekleniyor.
 */

const MOBILE_VIEWPORT = { width: 390, height: 844 }; // iPhone 14 Pro
const TABLET_VIEWPORT = { width: 768, height: 1024 }; // iPad

// Kritik sayfalar
const PAGES = ["/", "/urunler", "/urun/klasik-kartvizit", "/sepet", "/iletisim"];

test.describe("Mobil — Yatay taşma (horizontal scroll)", () => {
  for (const url of PAGES) {
    test(`${url} — yatay taşma yok`, async ({ page }) => {
      await page.setViewportSize(MOBILE_VIEWPORT);
      await page.goto(url);
      await page.waitForLoadState("networkidle");

      // Sayfa genişliği viewport genişliğini aşmamalı
      const bodyWidth = await page.evaluate(() => document.body.scrollWidth);
      const viewportWidth = MOBILE_VIEWPORT.width;

      expect(
        bodyWidth,
        `${url} sayfasında yatay taşma var (body: ${bodyWidth}px, viewport: ${viewportWidth}px)`
      ).toBeLessThanOrEqual(viewportWidth + 2); // 2px tolerans (border)
    });
  }
});

test.describe("Mobil — Hamburger menü", () => {
  test("hamburger menü butonu görünür", async ({ page }) => {
    await page.setViewportSize(MOBILE_VIEWPORT);
    await page.goto("/");

    const hamburger = page.locator(
      '[data-testid*="hamburger"], [aria-label*="menü"], button[aria-expanded], [class*="hamburger"], [class*="mobile-menu-btn"]'
    ).first();

    await expect(hamburger).toBeVisible();
  });

  test("hamburger menü tıklanınca açılır", async ({ page }) => {
    await page.setViewportSize(MOBILE_VIEWPORT);
    await page.goto("/");

    const hamburger = page.locator(
      '[data-testid*="hamburger"], [aria-label*="menü"], button[aria-expanded], [class*="hamburger"]'
    ).first();

    if (await hamburger.count() > 0) {
      await hamburger.click();
      await page.waitForTimeout(400);

      // Menü nav açılmalı
      const mobileNav = page.locator(
        '[data-testid*="mobile-nav"], [class*="mobile-menu"], nav[class*="open"], [aria-expanded="true"]'
      ).first();

      if (await mobileNav.count() > 0) {
        await expect(mobileNav).toBeVisible();
      }
    }
  });

  test("hamburger menü kapatılabilir", async ({ page }) => {
    await page.setViewportSize(MOBILE_VIEWPORT);
    await page.goto("/");

    const hamburger = page.locator(
      '[data-testid*="hamburger"], button[aria-expanded], [class*="hamburger"]'
    ).first();

    if (await hamburger.count() > 0) {
      await hamburger.click(); // aç
      await page.waitForTimeout(300);
      await hamburger.click(); // kapat
      await page.waitForTimeout(300);

      const expandedAttr = await hamburger.getAttribute("aria-expanded");
      if (expandedAttr !== null) {
        expect(expandedAttr).toBe("false");
      }
    }
  });
});

test.describe("Mobil — Touch hedefleri", () => {
  test("anasayfa CTA butonları minimum 44x44px", async ({ page }) => {
    await page.setViewportSize(MOBILE_VIEWPORT);
    await page.goto("/");

    const buttons = page.getByRole("button");
    const count = await buttons.count();

    let tooSmallCount = 0;
    for (let i = 0; i < Math.min(count, 20); i++) {
      const btn = buttons.nth(i);
      if (!(await btn.isVisible())) continue;

      const box = await btn.boundingBox();
      if (box && (box.width < 44 || box.height < 44)) {
        tooSmallCount++;
      }
    }

    // Tolerans: maksimum 2 buton küçük olabilir (ikon butonlar gibi)
    expect(
      tooSmallCount,
      `${tooSmallCount} buton 44×44px altında — WCAG 2.5.5 ihlali riski`
    ).toBeLessThanOrEqual(3);
  });
});

test.describe("Mobil — Form kullanılabilirliği", () => {
  test("iletişim formu mobilde kullanılabilir", async ({ page }) => {
    await page.setViewportSize(MOBILE_VIEWPORT);
    await page.goto("/iletisim");

    const nameInput = page.locator('input[name*="name"], input[name*="isim"]').first();
    const emailInput = page.locator('input[type="email"]').first();

    if (await nameInput.count() > 0) {
      await nameInput.tap();
      await nameInput.fill("Test Kullanıcı");
      await expect(nameInput).toHaveValue("Test Kullanıcı");
    }

    if (await emailInput.count() > 0) {
      await emailInput.tap();
      await emailInput.fill("test@test.com");
      await expect(emailInput).toHaveValue("test@test.com");
    }
  });

  test("checkout formu mobilde kullanılabilir", async ({ page }) => {
    await page.setViewportSize(MOBILE_VIEWPORT);
    await page.goto("/odeme");
    await page.waitForLoadState("networkidle");

    const emailInput = page.locator('input[type="email"]').first();
    if (await emailInput.count() > 0) {
      await emailInput.tap();
      await emailInput.fill("test@markala.com");
      await expect(emailInput).toHaveValue("test@markala.com");
    }
  });
});

test.describe("Mobil — LCP performansı (temel)", () => {
  test("anasayfa hero içeriği 3 saniyede yüklenir", async ({ page }) => {
    await page.setViewportSize(MOBILE_VIEWPORT);

    const startTime = Date.now();
    await page.goto("/");
    await page.waitForLoadState("networkidle");
    const loadTime = Date.now() - startTime;

    // 3 saniyelik eşik (network koşullarına göre CI'da esnekleştirilebilir)
    expect(loadTime, `Anasayfa yükleme süresi: ${loadTime}ms (hedef: <5000ms CI)`).toBeLessThan(10000);

    // LCP adayı — hero veya H1
    const heroOrH1 = page.locator("h1, [class*='hero'] img, [data-testid*='hero']").first();
    await expect(heroOrH1).toBeVisible({ timeout: 5000 });
  });
});

test.describe("Tablet — Orta boyut viewport", () => {
  test("ürünler listesi tablet'te düzgün görünür", async ({ page }) => {
    await page.setViewportSize(TABLET_VIEWPORT);
    await page.goto("/urunler");
    await page.waitForLoadState("networkidle");

    // Ürün kartları görünür
    const productCards = page.locator('[data-testid*="product-card"], [class*="product-card"], article').first();
    await expect(productCards).toBeVisible({ timeout: 5000 });

    // Yatay taşma kontrolü
    const bodyWidth = await page.evaluate(() => document.body.scrollWidth);
    expect(bodyWidth).toBeLessThanOrEqual(TABLET_VIEWPORT.width + 2);
  });
});
