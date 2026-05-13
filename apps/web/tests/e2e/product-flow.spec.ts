import { test, expect } from "@playwright/test";

/**
 * E2E: Ürün → Konfigüratör → Sepete Ekle akışı
 *
 * Klasik kartvizit Markala'nın bestseller'ı; bu akış kırılırsa conversion sıfırlanır.
 */

test.describe("Product flow — klasik kartvizit", () => {
  test("ürün sayfası açılır, konfigüratör ve sepete ekle butonu görünür", async ({
    page,
  }) => {
    const response = await page.goto("/urun/klasik-kartvizit");
    expect(response?.status()).toBe(200);

    // Ürün adı H1 olarak render olmalı
    await expect(page.getByRole("heading", { name: /klasik kartvizit/i })).toBeVisible();

    // Konfigüratör — matrix paket/adet tablosu var olmalı
    // Klasik kartvizit "Paket × Adet" matrix parametresine sahip
    const configurator = page.getByText(/paket.*adet/i).first();
    await expect(configurator).toBeVisible();
  });

  test("sepete ekle butonu tıklanabilir ve cart drawer açılır", async ({ page }) => {
    await page.goto("/urun/klasik-kartvizit");

    // Sepete ekle butonu — "Sepete Ekle" metnine sahip
    const addToCartBtn = page
      .getByRole("button", { name: /sepete ekle/i })
      .first();
    await expect(addToCartBtn).toBeVisible();
    await expect(addToCartBtn).toBeEnabled();

    await addToCartBtn.click();

    // Cart drawer açıldıktan sonra `data-testid="cart-drawer"` görünür olmalı.
    // Bu testid component'te zaten tanımlı — geniş selector yerine bunu kullanmak flaky riskini sıfırlar.
    const drawer = page.locator('[data-testid="cart-drawer"]');
    await drawer.waitFor({ state: "visible", timeout: 5000 });
    await expect(drawer).toBeVisible();
  });

  test("ürün galerisi en az 1 görsel içerir", async ({ page }) => {
    await page.goto("/urun/klasik-kartvizit");
    const images = page.locator('main img, [role="main"] img');
    const count = await images.count();
    expect(count).toBeGreaterThan(0);
  });
});
