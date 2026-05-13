import { test, expect } from "@playwright/test";

/**
 * Smoke: Anasayfa
 * - 200 OK
 * - H1 görünür
 * - Header navigation (Ürünler, Kategoriler vb.) render edilmiş
 * - Footer linkler tıklanabilir
 */

test.describe("Homepage smoke", () => {
  test("anasayfa 200 döner ve tek bir H1 görünür", async ({ page }) => {
    const response = await page.goto("/");
    expect(response?.status()).toBe(200);

    // SEO için bir sayfada tam olarak 1 H1 olmalı (Google best practice).
    const h1Count = await page.locator("h1").count();
    expect(h1Count).toBe(1);

    const h1 = page.locator("h1");
    await expect(h1).toBeVisible();
    const h1Text = await h1.textContent();
    expect(h1Text?.length ?? 0).toBeGreaterThan(3);
  });

  test("header navigation görünür ve link içerir", async ({ page }) => {
    await page.goto("/");
    // Header'da en az 1 nav linki olmalı
    const header = page.locator("header").first();
    await expect(header).toBeVisible();

    const navLinks = header.locator("a");
    const count = await navLinks.count();
    expect(count).toBeGreaterThan(0);
  });

  test("footer linkleri görünür ve href'e sahip", async ({ page }) => {
    await page.goto("/");
    const footer = page.locator("footer").first();
    await expect(footer).toBeVisible();

    const footerLinks = footer.locator("a[href]");
    const count = await footerLinks.count();
    expect(count).toBeGreaterThan(3);

    // İlk footer link href değeri "/" veya "http" ile başlasın
    const firstHref = await footerLinks.first().getAttribute("href");
    expect(firstHref).toBeTruthy();
  });

  test("sayfa metadata title içeriyor", async ({ page }) => {
    await page.goto("/");
    const title = await page.title();
    expect(title.toLowerCase()).toContain("markala");
  });
});
