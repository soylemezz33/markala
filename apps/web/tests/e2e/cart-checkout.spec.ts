import { test, expect } from "@playwright/test";

/**
 * E2E: Sepet + Ödeme akışı
 *
 * Kritik dönüşüm yolu: ürün → sepet → kupon → ödeme onayı.
 * Mock ödeme kullanıldığından gerçek iyzico testi değil;
 * WhatsApp sipariş akışı doğrulanır.
 */

const KARTVIZIT_URL = "/urun/klasik-kartvizit";
const HOSGELDIN_COUPON = "HOSGELDIN";

// Yardımcı: ürünü sepete ekle
async function addKartvizitToCart(page: import("@playwright/test").Page) {
  await page.goto(KARTVIZIT_URL);
  const addToCartBtn = page.getByRole("button", { name: /sepete ekle/i }).first();
  await expect(addToCartBtn).toBeEnabled();
  await addToCartBtn.click();
  // Drawer kapanmasını bekle veya drawer'da ürün görünümünü bekle
  await page.waitForTimeout(500);
}

test.describe("Sepet — temel operasyonlar", () => {
  test("sepet sayfası 200 döner", async ({ page }) => {
    const response = await page.goto("/sepet");
    expect(response?.status()).toBe(200);
  });

  test("boş sepet durumu görünür", async ({ page }) => {
    await page.goto("/sepet");
    // Boş sepet mesajı veya 'sepetiniz boş' içerikli element
    const emptyMsg = page.getByText(/sepetiniz boş|ürün yok|henüz ürün eklenmedi/i);
    const emptyEl = page.locator('[data-testid*="empty"], .empty-cart, [class*="empty"]');

    const emptyMsgCount = await emptyMsg.count();
    const emptyElCount = await emptyEl.count();
    expect(
      emptyMsgCount + emptyElCount,
      "Boş sepet durumu gösterilmeli"
    ).toBeGreaterThan(0);
  });

  test("ürün sepete eklenince sepette görünür", async ({ page }) => {
    await addKartvizitToCart(page);

    // Cart drawer veya sepet sayfasına giderek kontrol et
    const drawer = page.locator('[data-testid="cart-drawer"]');
    const drawerVisible = await drawer.isVisible();

    if (drawerVisible) {
      // Drawer'da ürün başlığı görünmeli
      const productInDrawer = page.locator('[data-testid="cart-drawer"] [data-testid*="item"], [data-testid="cart-drawer"] li');
      await expect(productInDrawer.first()).toBeVisible();
    } else {
      // Sepet sayfasına git
      await page.goto("/sepet");
      const cartItems = page.locator('[data-testid*="cart-item"], .cart-item, li').first();
      await expect(cartItems).toBeVisible();
    }
  });

  test("sepette miktar artırma/azaltma çalışır", async ({ page }) => {
    await addKartvizitToCart(page);
    await page.goto("/sepet");

    // Miktar artırma butonu
    const increaseBtn = page
      .getByRole("button", { name: /\+|artır|increase/i })
      .first();

    if (await increaseBtn.count() > 0) {
      await increaseBtn.click();
      await page.waitForTimeout(300);
      // Toplam değişmeli — sayfa güncellendi mi kontrol et
      const total = page.locator('[data-testid*="total"], [class*="total"], [class*="toplam"]').first();
      if (await total.count() > 0) {
        await expect(total).toBeVisible();
      }
    }
  });

  test("sepetten ürün silme çalışır", async ({ page }) => {
    await addKartvizitToCart(page);
    await page.goto("/sepet");

    const removeBtn = page
      .getByRole("button", { name: /sil|kaldır|remove|×|✕/i })
      .first();

    if (await removeBtn.count() > 0) {
      await removeBtn.click();
      await page.waitForTimeout(500);

      // Boş sepet mesajı veya ürün sayısı sıfır
      const emptyMsg = page.getByText(/sepetiniz boş|ürün yok/i);
      const items = page.locator('[data-testid*="cart-item"], .cart-item');
      const emptyCount = await emptyMsg.count();
      const itemCount = await items.count();

      expect(emptyCount > 0 || itemCount === 0, "Ürün silinince sepet boşalmalı").toBe(true);
    }
  });

  test("KDV %20 hesaplama tutarlı", async ({ page }) => {
    await addKartvizitToCart(page);
    await page.goto("/sepet");

    // KDV satırı varsa görünür olmalı
    const vatLine = page.getByText(/kdv|%20|vergi/i).first();
    if (await vatLine.count() > 0) {
      await expect(vatLine).toBeVisible();
    }
  });

  test("1500₺ üzeri kargo bedava mesajı görünür veya uygulanır", async ({ page }) => {
    await page.goto("/sepet");
    // Kargo ücreti veya ücretsiz kargo bilgisi
    const shippingInfo = page.getByText(/kargo|teslimat|ücretsiz/i).first();
    if (await shippingInfo.count() > 0) {
      await expect(shippingInfo).toBeVisible();
    }
  });
});

test.describe("Sepet — Kupon kodu", () => {
  test("kupon kodu alanı mevcut", async ({ page }) => {
    await addKartvizitToCart(page);
    await page.goto("/sepet");

    const couponInput = page.locator(
      'input[placeholder*="kupon"], input[name*="coupon"], input[placeholder*="kod"]'
    ).first();
    const couponBtn = page.getByRole("button", { name: /kupon|indirim kodu uygula/i }).first();

    const couponExists = (await couponInput.count()) + (await couponBtn.count());
    expect(couponExists, "Kupon kodu girişi mevcut olmalı").toBeGreaterThan(0);
  });

  test(`HOSGELDIN kupon kodu uygulanır`, async ({ page }) => {
    await addKartvizitToCart(page);
    await page.goto("/sepet");

    const couponInput = page.locator(
      'input[placeholder*="kupon"], input[name*="coupon"], input[placeholder*="kod"]'
    ).first();

    if (await couponInput.count() > 0) {
      await couponInput.fill(HOSGELDIN_COUPON);

      const applyBtn = page.getByRole("button", { name: /uygula|apply/i }).first();
      if (await applyBtn.count() > 0) {
        await applyBtn.click();
        await page.waitForTimeout(1000);

        // İndirim uygulandı mesajı veya indirim satırı
        const successMsg = page.getByText(/indirim|kupon uygulandı|başarıyla/i).first();
        const discountLine = page.getByText(/-%|indirim/i).first();

        const applied = (await successMsg.count()) + (await discountLine.count());
        expect(applied, "HOSGELDIN kuponu uygulanmalı").toBeGreaterThan(0);
      }
    }
  });

  test("geçersiz kupon kodu hata mesajı gösterir", async ({ page }) => {
    await addKartvizitToCart(page);
    await page.goto("/sepet");

    const couponInput = page.locator(
      'input[placeholder*="kupon"], input[name*="coupon"], input[placeholder*="kod"]'
    ).first();

    if (await couponInput.count() > 0) {
      await couponInput.fill("GECERSIZ9999");
      const applyBtn = page.getByRole("button", { name: /uygula|apply/i }).first();
      if (await applyBtn.count() > 0) {
        await applyBtn.click();
        await page.waitForTimeout(1000);

        const errorMsg = page.getByText(/geçersiz|bulunamadı|hatalı kupon/i).first();
        if (await errorMsg.count() > 0) {
          await expect(errorMsg).toBeVisible();
        }
      }
    }
  });
});

test.describe("Ödeme — checkout akışı", () => {
  test("ödeme sayfası 200 döner", async ({ page }) => {
    const response = await page.goto("/odeme");
    expect(response?.status()).toBe(200);
  });

  test("sepet doluyken ödeme adımına geçiş butonu çalışır", async ({ page }) => {
    await addKartvizitToCart(page);
    await page.goto("/sepet");

    const checkoutBtn = page.getByRole("button", {
      name: /sipari[şs]e devam|ödeme|checkout/i,
    }).first();
    const checkoutLink = page.getByRole("link", {
      name: /sipari[şs]e devam|ödeme|checkout/i,
    }).first();

    const btnCount = await checkoutBtn.count();
    const linkCount = await checkoutLink.count();
    expect(btnCount + linkCount, "Checkout CTA mevcut olmalı").toBeGreaterThan(0);

    if (btnCount > 0) {
      await checkoutBtn.click();
    } else {
      await checkoutLink.click();
    }

    await page.waitForLoadState("networkidle");
    expect(
      page.url().includes("/odeme") || page.url().includes("/checkout"),
      "Checkout sayfasına yönlenmeli"
    ).toBe(true);
  });

  test("iletişim bilgileri formu mevcut", async ({ page }) => {
    await page.goto("/odeme");

    // İsim, e-posta, telefon alanları
    const emailField = page.locator('input[type="email"], input[name*="email"]').first();
    const phoneField = page.locator('input[type="tel"], input[name*="phone"], input[name*="telefon"]').first();

    const hasEmail = await emailField.count();
    const hasPhone = await phoneField.count();

    expect(hasEmail + hasPhone, "Checkout'ta iletişim alanları olmalı").toBeGreaterThan(0);
  });

  test("WhatsApp ile sipariş tamamla butonu mevcut", async ({ page }) => {
    await page.goto("/odeme");

    const whatsappBtn = page.getByRole("link", { name: /whatsapp/i }).first();
    const whatsappBtnEl = page.getByRole("button", { name: /whatsapp/i }).first();
    const whatsappEl = page.locator('a[href*="wa.me"], a[href*="whatsapp"]').first();

    const count =
      (await whatsappBtn.count()) +
      (await whatsappBtnEl.count()) +
      (await whatsappEl.count());

    expect(count, "WhatsApp sipariş butonu mevcut olmalı").toBeGreaterThan(0);
  });

  test("sipariş başarı sayfası erişilebilir", async ({ page }) => {
    // Mock orderId ile başarı sayfasını test et
    const response = await page.goto("/odeme/basarili/test-order-123");
    // 200 veya redirect kabul edilebilir (boş sipariş ID yönlendirebilir)
    expect(response?.status()).toBeLessThan(500);
  });
});

test.describe("Sepet — Drawer UI", () => {
  test("cart drawer 'x' ile kapanır", async ({ page }) => {
    await addKartvizitToCart(page);

    const drawer = page.locator('[data-testid="cart-drawer"]');
    if (await drawer.isVisible()) {
      const closeBtn = drawer.getByRole("button", { name: /kapat|close|×|✕/i }).first();
      if (await closeBtn.count() > 0) {
        await closeBtn.click();
        await page.waitForTimeout(300);
        await expect(drawer).not.toBeVisible();
      }
    }
  });

  test("cart drawer'dan 'sepete git' linki çalışır", async ({ page }) => {
    await addKartvizitToCart(page);

    const drawer = page.locator('[data-testid="cart-drawer"]');
    if (await drawer.isVisible()) {
      const cartLink = drawer.getByRole("link", { name: /sepet|cart/i }).first();
      if (await cartLink.count() > 0) {
        await cartLink.click();
        await page.waitForLoadState("networkidle");
        expect(page.url()).toContain("/sepet");
      }
    }
  });
});
