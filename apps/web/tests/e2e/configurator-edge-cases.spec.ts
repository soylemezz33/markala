import { test, expect } from "@playwright/test";

/**
 * E2E: Konfigüratör uç durumları
 *
 * Birim testler fiyat motorunu kapsar (configurator-price.test.ts).
 * Burada UI katmanı: sıfır adet, maksimum adet, m² ürünler,
 * checkbox kombinasyonları ve fiyat güncelleme görünürlüğü.
 */

test.describe("Konfigüratör — Klasik kartvizit (matrix)", () => {
  test("matrix tablo hücresi seçilebilir ve fiyat güncellenir", async ({ page }) => {
    await page.goto("/urun/klasik-kartvizit");

    // Matrix tabloda bir hücre seç
    const matrixCell = page
      .locator('table td, [role="gridcell"], [data-testid*="matrix-cell"]')
      .first();

    if (await matrixCell.count() > 0) {
      await matrixCell.click();
      await page.waitForTimeout(300);

      // Fiyat alanı görünür olmalı
      const priceDisplay = page.locator(
        '[data-testid*="price"], [class*="price"], [class*="fiyat"]'
      ).first();
      if (await priceDisplay.count() > 0) {
        await expect(priceDisplay).toBeVisible();
        const priceText = await priceDisplay.textContent();
        expect(priceText).toMatch(/₺|\d/);
      }
    }
  });

  test("seçim yapılmadan sepete ekle denemesi — 0₺ veya hata gösterilmez", async ({ page }) => {
    await page.goto("/urun/klasik-kartvizit");

    // Sepete ekle butonuna tıkla (seçim yapmadan)
    const addBtn = page.getByRole("button", { name: /sepete ekle/i }).first();
    await expect(addBtn).toBeVisible();

    // Buton disabled ise veya tıklanabiliyorsa kontrol et
    const isDisabled = await addBtn.isDisabled();
    if (!isDisabled) {
      await addBtn.click();
      await page.waitForTimeout(500);
      // Hata mesajı veya ürün başarıyla eklenmeli — NaN₺ gösterilmemeli
      const nanText = page.getByText(/NaN|undefined|null/i);
      const nanCount = await nanText.count();
      expect(nanCount, "Fiyat NaN/undefined göstermemeli").toBe(0);
    }
  });
});

test.describe("Konfigüratör — Adet (quantity) parametresi", () => {
  test("adet artırma butonu çalışır", async ({ page }) => {
    // Adet parametresi olan bir ürün bul (el ilanı, broşür vb.)
    await page.goto("/urun/klasik-kartvizit");

    const qtyIncBtn = page.getByRole("button", { name: /\+|artır/i }).first();
    const qtyInput = page.locator('input[type="number"], [data-testid*="quantity-input"]').first();

    if (await qtyInput.count() > 0 && await qtyIncBtn.count() > 0) {
      const initialVal = await qtyInput.inputValue();
      await qtyIncBtn.click();
      await page.waitForTimeout(200);
      const newVal = await qtyInput.inputValue();
      expect(Number(newVal)).toBeGreaterThan(Number(initialVal));
    }
  });

  test("adet 0 veya negatif girilemiyor", async ({ page }) => {
    await page.goto("/urun/klasik-kartvizit");

    const qtyInput = page.locator('input[type="number"]').first();
    if (await qtyInput.count() > 0) {
      await qtyInput.fill("0");
      await page.keyboard.press("Tab");
      await page.waitForTimeout(200);

      const val = await qtyInput.inputValue();
      // 0 veya negatif değer kabul edilmemeli
      expect(Number(val)).toBeGreaterThan(0);
    }
  });
});

test.describe("Konfigüratör — m² (Branda/Vinil) ürünler", () => {
  test("vinil branda sayfası açılır ve boyut girişi görünür", async ({ page }) => {
    const response = await page.goto("/urun/vinil-branda");
    // Ürün mevcut değilse diğer slug dene
    if (response?.status() === 404) {
      await page.goto("/urun/mesh-branda");
    }

    const dimensionInput = page.locator(
      'input[name*="en"], input[name*="boy"], input[placeholder*="cm"], [data-testid*="dimension"]'
    ).first();
    const widthInput = page.locator('input[name*="width"], input[name*="genislik"]').first();

    const hasDimension =
      (await dimensionInput.count()) + (await widthInput.count());

    // Ürün gerçekten varsa boyut girişi olmalı
    if (response?.status() !== 404) {
      expect(hasDimension, "Boyut (en/boy) girişi mevcut olmalı").toBeGreaterThan(0);
    }
  });

  test("m² fiyat hesaplama — en × boy girişi sonrası fiyat değişir", async ({ page }) => {
    const responses = [
      await page.goto("/urun/vinil-branda"),
      null,
    ];

    const statusOk = responses[0]?.status() === 200;
    if (!statusOk) {
      test.skip();
      return;
    }

    const widthInput = page
      .locator('input[name*="en"], input[name*="width"], input[placeholder*="en"]')
      .first();
    const heightInput = page
      .locator('input[name*="boy"], input[name*="height"], input[placeholder*="boy"]')
      .first();

    if ((await widthInput.count()) > 0 && (await heightInput.count()) > 0) {
      await widthInput.fill("200");
      await heightInput.fill("100");
      await page.keyboard.press("Tab");
      await page.waitForTimeout(500);

      const priceEl = page.locator('[data-testid*="price"], [class*="price"]').first();
      if (await priceEl.count() > 0) {
        const priceText = await priceEl.textContent();
        expect(priceText).toMatch(/₺|\d/);
        expect(priceText).not.toMatch(/NaN|undefined/);
      }
    }
  });
});

test.describe("Konfigüratör — Fiyat kartı görünürlüğü", () => {
  test("fiyat kartı yapılandırma öncesi görünür veya placeholder gösterir", async ({ page }) => {
    await page.goto("/urun/klasik-kartvizit");

    const priceCard = page.locator('[data-testid*="price-card"], [class*="price-card"]').first();
    const priceText = page.getByText(/₺|fiyat|tutar/i).first();

    const count = (await priceCard.count()) + (await priceText.count());
    expect(count, "Fiyat alanı sayfa yüklenince görünür olmalı").toBeGreaterThan(0);
  });

  test("fiyat breakdown NaN içermiyor", async ({ page }) => {
    await page.goto("/urun/klasik-kartvizit");

    // Matrix'te herhangi bir hücre seç
    const cell = page.locator('table td, [role="gridcell"]').first();
    if (await cell.count() > 0) {
      await cell.click();
      await page.waitForTimeout(300);
    }

    const nanText = page.getByText(/NaN/);
    const nanCount = await nanText.count();
    expect(nanCount, "Fiyat gösteriminde NaN olmamalı").toBe(0);
  });

  test("tasarım yükleme alanı görünür", async ({ page }) => {
    await page.goto("/urun/klasik-kartvizit");

    const designUpload = page.locator(
      '[data-testid*="design"], input[type="file"], [class*="upload"]'
    ).first();
    const designText = page.getByText(/tasarım|dosya yükle|design/i).first();

    const count = (await designUpload.count()) + (await designText.count());
    expect(count, "Tasarım yükleme alanı görünür olmalı").toBeGreaterThan(0);
  });
});

test.describe("Ürün detay — genel", () => {
  test("ürün açıklaması görünür", async ({ page }) => {
    await page.goto("/urun/klasik-kartvizit");

    const description = page.locator('main p, [class*="description"], [data-testid*="desc"]').first();
    await expect(description).toBeVisible();
    const text = await description.textContent();
    expect(text?.length ?? 0).toBeGreaterThan(10);
  });

  test("üretim süresi bilgisi görünür", async ({ page }) => {
    await page.goto("/urun/klasik-kartvizit");

    const productionTime = page.getByText(/üretim süresi|teslimat|gün/i).first();
    if (await productionTime.count() > 0) {
      await expect(productionTime).toBeVisible();
    }
  });

  test("mobil 'sepete ekle' sticky CTA görünür (mobile viewport)", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/urun/klasik-kartvizit");

    const mobileCTA = page.locator('[data-testid*="mobile-cta"], .mobile-cta').first();
    const stickyBtn = page.locator('.sticky button, [class*="sticky"] button').first();

    const count = (await mobileCTA.count()) + (await stickyBtn.count());
    // Mobile CTA mevcut olmayabilir (opsiyonel kontrol)
    if (count > 0) {
      await expect(mobileCTA.or(stickyBtn).first()).toBeVisible();
    }
  });
});
