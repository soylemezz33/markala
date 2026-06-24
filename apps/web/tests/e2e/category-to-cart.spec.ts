import { test, expect } from "@playwright/test";

/**
 * E2E akış: Anasayfa → Kategori → Ürün → Sepete Ekle
 *
 * Bu akış Markala'nın ana dönüşüm hunisidir.
 * Kırılırsa her organik ziyaretçi kaybedilir.
 */
test.describe("Category-to-cart altın yol akışı", () => {
  test("anasayfadan kategori sayfasına navigasyon çalışır", async ({ page }) => {
    await page.goto("/");

    // Kategori linkine header veya hero CTA üzerinden ulaş
    const kartvizitLink = page
      .locator('a[href*="/kategori/kartvizit"], a[href*="/urunler"]')
      .first();
    await expect(kartvizitLink).toBeVisible();
    await kartvizitLink.click();

    // Kategoriler veya kartvizit sayfasına inildi
    await expect(page).toHaveURL(/\/(kategori|urunler)/);
  });

  test("kategori sayfası ürün kartları render eder", async ({ page }) => {
    await page.goto("/kategori/kartvizit");
    await expect(page).toHaveURL("/kategori/kartvizit");

    // Kategori başlığı görünür
    const h1 = page.locator("h1").first();
    await expect(h1).toBeVisible();

    // Ürün kartlarında ürün linkleri var
    const productLinks = page.locator('a[href^="/urun/"]');
    const count = await productLinks.count();
    expect(count).toBeGreaterThan(0);
  });

  test("kategori → ürün sayfası → Sepete Ekle → cart drawer", async ({ page }) => {
    // 1. Kategori sayfasına git
    await page.goto("/kategori/kartvizit");

    // 2. İlk ürün linkine tıkla
    const firstProductLink = page.locator('a[href^="/urun/"]').first();
    const productHref = await firstProductLink.getAttribute("href");
    await firstProductLink.click();

    // 3. Ürün sayfasına geçildi
    await page.waitForURL(/\/urun\//);
    const h1 = page.locator("h1").first();
    await expect(h1).toBeVisible();

    // 4. "Sepete Ekle" butonu görünür ve etkin
    const addBtn = page.getByRole("button", { name: /sepete ekle/i }).first();
    await expect(addBtn).toBeVisible();
    await expect(addBtn).toBeEnabled();

    // 5. Sepete ekle
    await addBtn.click();

    // 6. Cart drawer açılır VEYA buton "Sepete Eklendi" durumuna geçer
    const cartDrawer = page.locator('[data-testid="cart-drawer"]');
    const addedBtn = page.getByRole("button", { name: /sepete eklendi/i });

    await Promise.race([
      cartDrawer.waitFor({ state: "visible", timeout: 5000 }).catch(() => null),
      addedBtn.waitFor({ state: "visible", timeout: 5000 }).catch(() => null),
    ]);

    // En az birinin görünür olduğunu doğrula
    const drawerVisible = await cartDrawer.isVisible().catch(() => false);
    const addedVisible = await addedBtn.isVisible().catch(() => false);
    expect(drawerVisible || addedVisible).toBe(true);
  });

  test("sepet sayfasına gidince eklenen ürün listelenir", async ({ page }) => {
    // Ürünü sepete ekle
    await page.goto("/urun/klasik-kartvizit");
    const addBtn = page.getByRole("button", { name: /sepete ekle/i }).first();
    await expect(addBtn).toBeEnabled();
    await addBtn.click();

    // Sepet sayfasına git
    await page.goto("/sepet");
    await expect(page).toHaveURL("/sepet");

    // Sepette en az bir ürün var
    const cartItems = page.locator("article").first();
    await expect(cartItems).toBeVisible();
  });
});
