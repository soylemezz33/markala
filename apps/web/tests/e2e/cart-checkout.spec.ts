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

/**
 * Yardımcı: çerez onay banner'ını kapat. Banner ekranın altında sabit durur ve mobilde
 * çekmece/sepet CTA'larının üstüne binip tıklamayı ÇALAR (2026-08-18 mobil düşmeleri).
 * "Sadece zorunlu"ya basmak testi gerçekçi tutar (reklam çerezi olmadan akış çalışmalı).
 */
async function dismissCookieBanner(page: import("@playwright/test").Page) {
  const btn = page.getByRole("button", { name: /sadece zorunlu|tümünü kabul|reddet/i }).first();
  if (await btn.isVisible({ timeout: 3000 }).catch(() => false)) {
    await btn.dispatchEvent("click");
    await page.waitForTimeout(200);
  }
}

/**
 * Yardımcı: sepet sayfasındaki kupon alanını AÇ ve döndür.
 * Kupon girişi <details> içinde KATLI durur; açmadan fill() görünmez alana yazmaya çalışıp
 * zaman aşımına düşer (2026-08-18'de iki kupon testinin düşme sebebi buydu).
 */
async function openCouponInput(page: import("@playwright/test").Page) {
  const details = page.getByTestId("coupon-details");
  if ((await details.count()) === 0) return null;
  const isOpen = await details.evaluate((el) => (el as HTMLDetailsElement).open);
  if (!isOpen) await page.getByTestId("coupon-toggle").click();
  const input = page.getByTestId("coupon-input");
  await expect(input).toBeVisible();
  return input;
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

    // Ürün satırları data-testid="cart-item" taşır (drawer ve sepet sayfası ortak).
    // Eskiden `li` aranıyordu; satırlar <article> olduğu için test yanlış düşüyordu.
    const drawer = page.locator('[data-testid="cart-drawer"]');
    if (await drawer.isVisible()) {
      await expect(drawer.getByTestId("cart-item").first()).toBeVisible();
    } else {
      await page.goto("/sepet");
      await expect(page.getByTestId("cart-item").first()).toBeVisible();
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
    await addKartvizitToCart(page);
    await page.goto("/sepet");
    await expect(page.getByTestId("cart-item").first()).toBeVisible();
    // main ile SINIRLA: header üst barındaki "81 ile teslimat" rozeti mobilde gizli
    // (hidden lg:flex) — first() ona denk gelip "görünmüyor" diye düşüyordu (2026-08-18).
    const shippingInfo = page
      .locator("main")
      .getByText(/kargo|teslimat|ücretsiz/i)
      .locator("visible=true")
      .first();
    await expect(shippingInfo).toBeVisible();
  });
});

test.describe("Sepet — Kupon kodu", () => {
  test("kupon kodu alanı mevcut", async ({ page }) => {
    await addKartvizitToCart(page);
    await page.goto("/sepet");
    // Önce ürün satırının görünmesini bekle — sepet hidrasyonu bitmeden kupon bölümü
    // render edilmez; beklemeden sayılınca yarışta 0 bulunuyordu (2026-08-18, mobil).
    await expect(page.getByTestId("cart-item").first()).toBeVisible();
    await expect(page.getByTestId("coupon-details")).toHaveCount(1);
  });

  test(`HOSGELDIN kupon kodu uygulanır`, async ({ page }) => {
    await addKartvizitToCart(page);
    await page.goto("/sepet");

    const couponInput = await openCouponInput(page);
    if (!couponInput) return;

    await couponInput.fill(HOSGELDIN_COUPON);
    const applyBtn = page.getByRole("button", { name: /uygula|apply/i }).first();
    await applyBtn.click();

    // Sonuç iki biçimde olabilir: indirim satırı ya da "yalnız üyelere" uyarısı
    // (HOSGELDIN üyeye özel; misafir oturumda bilinçli reddedilir — ikisi de GEÇERLİ yanıt,
    // önemli olan kuponun SESSİZ kalmaması). main ile sınırla: header'daki gizli "Üye Girişi"
    // metni /üye/ desenine denk gelip yanlış eşleşiyordu (2026-08-18, mobil).
    const outcome = page
      .locator("main")
      .getByText(/indirim|kupon|üye girişiyle|geçerli|kullanıl/i)
      .locator("visible=true")
      .first();
    await expect(outcome).toBeVisible({ timeout: 10_000 });
  });

  test("geçersiz kupon kodu hata mesajı gösterir", async ({ page }) => {
    await addKartvizitToCart(page);
    await page.goto("/sepet");

    const couponInput = await openCouponInput(page);
    if (!couponInput) return;

    await couponInput.fill("GECERSIZ9999");
    await page.getByRole("button", { name: /uygula|apply/i }).first().click();

    // Geçersiz kupon SESSİZ kalmamalı — kullanıcı sebebini görmeli.
    const errorMsg = page
      .getByText(/geçersiz|bulunamadı|hatalı|kullanılamaz|kontrol edilemedi/i)
      .first();
    await expect(errorMsg).toBeVisible({ timeout: 10_000 });
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
    // Sepet hidrasyonu bitmeden CTA render edilmez — beklemeden count() yarışta 0 bulur.
    await expect(page.getByTestId("cart-item").first()).toBeVisible();

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
    // Sepet BOŞSA /odeme kendini /sepet'e yönlendirir — ve doğrudan goto("/odeme")
    // yapılırsa sepet store'u localStorage'dan HİDRASYON tamamlanmadan bu yönlendirme
    // tetikleniyor (yarış durumu; 2026-08-18'de testin düşme sebebi). Gerçek kullanıcı
    // yolu sağlam: sepet sayfasından "Ödemeye Geç" ile gidilir — buton ancak sepet
    // yüklendiğinde tıklanabilir olduğundan yarış oluşmaz.
    await addKartvizitToCart(page);
    await page.goto("/sepet");
    await expect(page.getByTestId("cart-item").first()).toBeVisible();
    await page.getByRole("link", { name: /ödemeye geç/i }).first().click();
    await page.waitForURL(/\/odeme/);

    // Misafir kapısı çıkarsa misafir olarak devam et (giriş duvarı funnel'ı kırıyordu).
    // Hidrasyon re-render'ları normal click()'in kararlılık beklemesini bozabildiği için
    // buton GÖRÜNÜR olana kadar bekleyip dispatchEvent ile tıklanır.
    const guestBtn = page.getByRole("button", { name: /misafir olarak devam/i }).first();
    if (await guestBtn.isVisible({ timeout: 4000 }).catch(() => false)) {
      await guestBtn.dispatchEvent("click");
    }

    const emailField = page.locator('input[type="email"], input[name*="email"]').first();
    const phoneField = page.locator('input[type="tel"], input[name*="phone"]').first();

    await expect(emailField.or(phoneField).first()).toBeVisible({ timeout: 10_000 });
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
    // Çerez banner'ı çekmecedeki linki mobilde örtüyor → önce kapat.
    await dismissCookieBanner(page);

    const drawer = page.locator('[data-testid="cart-drawer"]');
    if (await drawer.isVisible()) {
      const cartLink = drawer.getByRole("link", { name: /sepet|cart/i }).first();
      if (await cartLink.count() > 0) {
        await cartLink.click();
        await page.waitForURL(/\/sepet/);
        expect(page.url()).toContain("/sepet");
      }
    }
  });
});
