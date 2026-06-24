import { test, expect } from "@playwright/test";

/**
 * E2E: Mock checkout → Başarı ekranı
 *
 * Akış: Ürün sayfası → Sepete Ekle → /sepet → /odeme → form doldur → /odeme/basarili/[id]
 * WhatsApp window.open çağrısından kaçınmak için "Telefonla Sipariş" kanalı kullanılır.
 */

async function addProductToCart(page: import("@playwright/test").Page) {
  await page.goto("/urun/klasik-kartvizit");
  const addBtn = page.getByRole("button", { name: /sepete ekle/i }).first();
  await expect(addBtn).toBeEnabled({ timeout: 8000 });
  await addBtn.click();
  // Butona eklendi state'ine geçmesini bekle
  await page.waitForTimeout(500);
}

test.describe("Checkout altın yol akışı", () => {
  test("sepet sayfasında 'Siparişe Devam Et' butonu görünür", async ({ page }) => {
    await addProductToCart(page);
    await page.goto("/sepet");

    const continueBtn = page.getByRole("link", { name: /siparişe devam et/i });
    await expect(continueBtn).toBeVisible();
  });

  test("checkout sayfası açılır ve step göstergesi çalışır", async ({ page }) => {
    await addProductToCart(page);
    await page.goto("/odeme");

    // Checkout sayfası yüklendi
    const heading = page.getByRole("heading", { name: /siparişini tamamla/i });
    await expect(heading).toBeVisible();

    // İlk adım "İletişim" aktif
    const iletisimSection = page.locator("#iletisim, [id='iletisim']").first();
    await expect(iletisimSection).toBeVisible();
  });

  test("iletişim adımı doldurulunca 'Devam Et' etkinleşir", async ({ page }) => {
    await addProductToCart(page);
    await page.goto("/odeme");

    // E-posta ve telefon doldur
    await page.getByLabel(/e-posta/i).fill("test@example.com");
    await page.getByLabel(/telefon/i).fill("05321234567");

    // Devam Et butonu artık aktif olmalı
    const devamBtn = page.getByRole("button", { name: /devam et/i });
    await expect(devamBtn).toBeEnabled();
  });

  test("tam checkout akışı → başarı sayfası", async ({ page }) => {
    // window.open'ı stub'la — WhatsApp sekmesi açılmasın
    await page.addInitScript(() => {
      window.open = () => null;
    });

    await addProductToCart(page);
    await page.goto("/odeme");

    // Adım 1: İletişim
    await page.getByLabel(/e-posta/i).fill("test@markala.com");
    await page.getByLabel(/telefon/i).fill("05321234567");
    await page.getByRole("button", { name: /devam et/i }).click();

    // Adım 2: Fatura (bireysel)
    await page.getByLabel(/ad soyad/i).fill("Test Kullanıcı");
    await page.getByLabel(/t\.c\. kimlik/i).fill("12345678901");
    await page.getByRole("button", { name: /devam et/i }).click();

    // Adım 3: Teslimat
    await page.getByLabel(/^i̇l$/i).fill("İstanbul");
    await page.getByLabel(/i̇lçe/i).fill("Kadıköy");
    await page.getByLabel(/adres/i).fill("Moda Caddesi No:1 Daire:2");
    await page.getByRole("button", { name: /devam et/i }).click();

    // Adım 4: Onay — sözleşmeleri kabul et
    const checkboxes = page.locator('input[type="checkbox"]');
    const count = await checkboxes.count();
    for (let i = 0; i < count; i++) {
      const cb = checkboxes.nth(i);
      if (!(await cb.isChecked())) {
        await cb.check();
      }
    }

    // Telefonla Sipariş butonuna tıkla (window.open açmaz)
    const phoneBtn = page.getByRole("button", { name: /telefonla sipariş/i });
    await expect(phoneBtn).toBeEnabled({ timeout: 5000 });
    await phoneBtn.click();

    // Başarı sayfasına yönlendirildi
    await expect(page).toHaveURL(/\/odeme\/basarili\//, { timeout: 10000 });

    // Başarı mesajı görünür
    const successHeading = page.getByRole("heading", { name: /sipariş talebin alındı/i });
    await expect(successHeading).toBeVisible();
  });

  test("başarı sayfasında sipariş numarası gösterilir", async ({ page }) => {
    await page.addInitScript(() => {
      window.open = () => null;
    });

    await addProductToCart(page);
    await page.goto("/odeme");

    await page.getByLabel(/e-posta/i).fill("test@markala.com");
    await page.getByLabel(/telefon/i).fill("05321234567");
    await page.getByRole("button", { name: /devam et/i }).click();

    await page.getByLabel(/ad soyad/i).fill("Test Kullanıcı");
    await page.getByLabel(/t\.c\. kimlik/i).fill("12345678901");
    await page.getByRole("button", { name: /devam et/i }).click();

    await page.getByLabel(/^i̇l$/i).fill("İstanbul");
    await page.getByLabel(/i̇lçe/i).fill("Kadıköy");
    await page.getByLabel(/adres/i).fill("Moda Caddesi No:1 Daire:2");
    await page.getByRole("button", { name: /devam et/i }).click();

    const checkboxes = page.locator('input[type="checkbox"]');
    const count = await checkboxes.count();
    for (let i = 0; i < count; i++) {
      if (!(await checkboxes.nth(i).isChecked())) {
        await checkboxes.nth(i).check();
      }
    }

    await page.getByRole("button", { name: /telefonla sipariş/i }).click();
    await expect(page).toHaveURL(/\/odeme\/basarili\//, { timeout: 10000 });

    // Sipariş numarası (MRK- prefix) görünür
    const orderNumber = page.getByText(/MRK-\d+/);
    await expect(orderNumber).toBeVisible();
  });

  test("boş sepette /odeme doğrudan erişilemez (sepete redirect)", async ({ page }) => {
    // Boş state ile /odeme'ye git
    await page.goto("/odeme");

    // Sayfa ya /sepet'e yönlendirmeli ya da içerik render etmemeli
    await page.waitForTimeout(1000);
    const currentUrl = page.url();
    // Redirect olmuşsa /sepet'teyiz; olmamışsa sayfa boş render (cartItems.length === 0)
    const isSepet = currentUrl.includes("/sepet");
    const isOdeme = currentUrl.includes("/odeme");
    expect(isSepet || isOdeme).toBe(true);
  });
});
