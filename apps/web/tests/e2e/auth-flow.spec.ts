import { test, expect } from "@playwright/test";

/**
 * E2E: Kimlik doğrulama akışları
 *
 * FAZ 1-2 mock auth: herhangi bir e-posta kabul edilir.
 * FAZ 3 sonrası gerçek JWT/Argon2 entegrasyonuyla aynı senaryolar geçerli.
 */

test.describe("Auth — Kayıt akışı", () => {
  test("kayıt sayfası 200 döner ve form alanları görünür", async ({ page }) => {
    const response = await page.goto("/kayit");
    expect(response?.status()).toBe(200);

    await expect(page.locator('input[type="email"], input[name*="email"]').first()).toBeVisible();
    await expect(page.locator('input[type="password"]').first()).toBeVisible();
    await expect(page.getByRole("button", { name: /kayıt|üye ol|hesap oluştur/i }).first()).toBeVisible();
  });

  test("geçersiz e-posta ile kayıt → validasyon hatası görünür", async ({ page }) => {
    await page.goto("/kayit");

    await page.locator('input[type="email"], input[name*="email"]').first().fill("gecersizimail");
    await page.locator('input[type="password"]').first().fill("sifre123");
    await page.getByRole("button", { name: /kayıt|üye ol|hesap oluştur/i }).first().click();

    // HTML5 validation veya custom hata mesajı
    const emailInput = page.locator('input[type="email"], input[name*="email"]').first();
    const validationMessage = await emailInput.evaluate((el: HTMLInputElement) => el.validationMessage);
    const hasCustomError = await page.locator('[role="alert"], .error, [aria-invalid="true"]').count();

    expect(
      validationMessage.length > 0 || hasCustomError > 0,
      "Geçersiz e-posta için hata mesajı gösterilmeli"
    ).toBe(true);
  });

  test("eksik alan ile form gönderimi engellenir", async ({ page }) => {
    await page.goto("/kayit");

    // Sadece e-posta doldur, şifre boş bırak
    await page.locator('input[type="email"], input[name*="email"]').first().fill("test@markala.com");
    await page.getByRole("button", { name: /kayıt|üye ol|hesap oluştur/i }).first().click();

    // URL değişmemeli (form gönderilmemeli)
    await page.waitForTimeout(500);
    expect(page.url()).toContain("/kayit");
  });
});

test.describe("Auth — Giriş akışı", () => {
  test("giriş sayfası 200 döner ve form alanları görünür", async ({ page }) => {
    const response = await page.goto("/giris");
    expect(response?.status()).toBe(200);

    await expect(page.locator('input[type="email"], input[name*="email"]').first()).toBeVisible();
    await expect(page.locator('input[type="password"]').first()).toBeVisible();
    await expect(page.getByRole("button", { name: /giriş|oturum/i }).first()).toBeVisible();
  });

  test("'şifremi unuttum' linki görünür ve tıklanabilir", async ({ page }) => {
    await page.goto("/giris");

    const forgotLink = page.getByRole("link", { name: /şifremi unuttum|şifre sıfırla/i });
    const forgotBtn = page.getByRole("button", { name: /şifremi unuttum|şifre sıfırla/i });

    const linkCount = await forgotLink.count();
    const btnCount = await forgotBtn.count();
    expect(linkCount + btnCount, "'Şifremi unuttum' linki/butonu olmalı").toBeGreaterThan(0);
  });

  test("kayıt sayfasına link mevcut", async ({ page }) => {
    await page.goto("/giris");

    const registerLink = page.getByRole("link", { name: /kayıt ol|üye ol|hesap oluştur/i });
    await expect(registerLink.first()).toBeVisible();
  });

  test("korunan sayfa /hesabim unauthenticated kullanıcıyı yönlendirir", async ({ page }) => {
    await page.goto("/hesabim");

    // Giriş sayfasına yönlendirmeli veya 401/403 dönmeli
    await page.waitForLoadState("networkidle");
    const currentUrl = page.url();
    const isRedirected = currentUrl.includes("/giris") || currentUrl.includes("/login");
    const hasAuthError = await page.getByText(/giriş yapmanız|oturum açınız|yetkisiz/i).count();

    expect(
      isRedirected || hasAuthError > 0,
      "Korunan sayfa unauthenticated kullanıcıyı login'e yönlendirmeli"
    ).toBe(true);
  });
});

test.describe("Auth — Navigasyon bağlantıları", () => {
  test("header'da giriş/hesabım linki görünür", async ({ page }) => {
    await page.goto("/");
    const header = page.locator("header").first();

    const authLink = header.locator('a[href*="giris"], a[href*="hesabim"]');
    const count = await authLink.count();
    expect(count, "Header'da auth linki olmalı").toBeGreaterThan(0);
  });

  test("giriş → kayıt sayfaları arası geçiş çalışır", async ({ page }) => {
    await page.goto("/giris");

    const registerLink = page.getByRole("link", { name: /kayıt|üye ol/i }).first();
    if (await registerLink.count() > 0) {
      await registerLink.click();
      await page.waitForLoadState("networkidle");
      expect(page.url()).toContain("/kayit");
    }
  });
});
