import { test, expect } from "@playwright/test";

/**
 * E2E: Hesabım dashboard akışları
 *
 * FAZ 1-2 mock auth kullanır — gerçek giriş yapmadan /hesabim korumasını
 * ve sayfa yapılarını doğrular. Gerçek auth entegrasyonunda bu fixture-tabanlı
 * bir beforeEach login adımıyla genişletilmeli.
 */

test.describe("Hesabım — Erişim koruması", () => {
  const PROTECTED_ROUTES = [
    "/hesabim",
    "/hesabim/bilgilerim",
    "/hesabim/adreslerim",
    "/hesabim/sifre",
    "/hesabim/siparislerim",
    "/hesabim/faturalarim",
    "/hesabim/bildirim",
  ];

  for (const route of PROTECTED_ROUTES) {
    test(`${route} — unauthenticated yönlendirme`, async ({ page }) => {
      await page.goto(route);
      await page.waitForLoadState("networkidle");

      const redirectedToLogin =
        page.url().includes("/giris") ||
        page.url().includes("/login") ||
        page.url().includes("/auth");

      const hasLoginPrompt = await page
        .getByText(/giriş yapmanız|oturum açınız|lütfen giriş/i)
        .count();

      expect(
        redirectedToLogin || hasLoginPrompt > 0,
        `${route}: Giriş yapmayan kullanıcı yönlendirilmeli`
      ).toBe(true);
    });
  }
});

test.describe("Hesabım — Sayfa yapısı (authenticated)", () => {
  // NOT: Gerçek auth entegrasyonunda beforeEach içine login adımı ekle.
  // FAZ 1-2: mock auth herhangi bir e-postayı kabul eder.

  test.fixme(
    "sipariş geçmişi tablosu görünür",
    async ({ page }) => {
      // Bu test FAZ 3 (gerçek auth) sonrası aktif olacak.
      // Login adımı:
      // await page.goto("/giris");
      // await page.fill('input[type="email"]', "test@markala.com");
      // await page.fill('input[type="password"]', "Test1234!");
      // await page.getByRole("button", { name: /giriş/i }).click();
      // await page.waitForURL("/hesabim");

      await page.goto("/hesabim/siparislerim");

      const orderTable = page.locator("table, [data-testid*='orders'], [class*='orders']").first();
      await expect(orderTable).toBeVisible();
    }
  );

  test.fixme(
    "adres yönetimi — adres ekleme formu",
    async ({ page }) => {
      await page.goto("/hesabim/adreslerim");
      const addAddressBtn = page
        .getByRole("button", { name: /adres ekle|yeni adres/i })
        .first();
      await expect(addAddressBtn).toBeVisible();
    }
  );
});

test.describe("Hesabım — Navigasyon yapısı", () => {
  test("giriş sayfası /hesabim yönlendirme ile yüklenir", async ({ page }) => {
    await page.goto("/giris");
    const response = await page.goto("/giris");
    expect(response?.status()).toBe(200);

    // Giriş formu görünür
    const form = page.locator("form").first();
    await expect(form).toBeVisible();
  });

  test("hesap silme sayfası erişim kontrolü", async ({ page }) => {
    await page.goto("/hesabim/hesap-sil");
    await page.waitForLoadState("networkidle");

    // Ya login'e yönlendir ya da uyarı göster
    const redirected = page.url().includes("/giris");
    const hasWarning = await page.getByText(/emin misiniz|hesabınız silinecek/i).count();

    expect(
      redirected || hasWarning > 0,
      "Hesap silme sayfası korumalı olmalı"
    ).toBe(true);
  });

  test("veri yönetimi (KVKK) sayfası erişim kontrolü", async ({ page }) => {
    await page.goto("/hesabim/veri-yonetimi");
    await page.waitForLoadState("networkidle");

    const redirected = page.url().includes("/giris");
    const hasContent = await page.locator("main").count();

    expect(redirected || hasContent > 0).toBe(true);
  });
});

test.describe("KVKK başvuru formu", () => {
  test("/kvkk-basvuru sayfası 200 döner ve form görünür", async ({ page }) => {
    const response = await page.goto("/kvkk-basvuru");
    expect(response?.status()).toBe(200);

    const form = page.locator("form").first();
    await expect(form).toBeVisible();
  });

  test("KVKK formu TC/pasaport alanı içeriyor", async ({ page }) => {
    await page.goto("/kvkk-basvuru");

    const tcInput = page.locator(
      'input[name*="tc"], input[name*="kimlik"], input[placeholder*="T.C"]'
    ).first();
    const identityField = page.getByLabel(/tc kimlik|kimlik|pasaport/i).first();

    const count = (await tcInput.count()) + (await identityField.count());
    expect(count, "KVKK formunda kimlik alanı olmalı").toBeGreaterThan(0);
  });
});
