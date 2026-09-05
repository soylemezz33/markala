import { test, expect, Page } from "@playwright/test";

/**
 * Seçiciler 2026-09-05'te canlı markala.com.tr üzerinde Playwright ile
 * doğrulanarak yazıldı (runbook: "seçicileri canlı siteye bakmadan yazma").
 * Site erişilebilirlik etiketleri sağlam olduğu için getByRole/getByLabel
 * kullanıldı; data-testid sitede bulunmuyor.
 */

// Çerez dialogu tüm sayfalarda açılıyor ve tıklamaları engelliyor.
async function cerezleriKapat(page: Page) {
  const btn = page.getByRole("button", { name: /sadece zorunlu/i });
  if (await btn.isVisible().catch(() => false)) {
    await btn.click();
  }
}

test.beforeEach(async ({ page }) => {
  await page.goto("/");
  await cerezleriKapat(page);
});

test("arama 3 harfte kategori ve ürün önerisi veriyor", async ({ page }) => {
  await page.getByRole("button", { name: /ne bastıracaksın/i }).click();

  const kutu = page.getByRole("searchbox", { name: /site içi arama/i });
  await expect(kutu).toBeVisible();
  await kutu.pressSequentially("bro");

  const dialog = page.getByRole("dialog").filter({ has: kutu });
  await expect(dialog.getByRole("link", { name: /broşür/i }).first()).toBeVisible({
    timeout: 5000,
  });
});

test("m² ürününde en/boy/adet girilebiliyor ve KDV dahil fiyat gösteriliyor", async ({ page }) => {
  await page.goto("/urun/cin-vinil-branda");
  await cerezleriKapat(page);

  await expect(page.getByRole("spinbutton", { name: /en \(cm\)/i })).toBeVisible();
  await expect(page.getByRole("spinbutton", { name: /boy \(cm\)/i })).toBeVisible();
  await expect(page.getByRole("spinbutton", { name: /adet/i })).toBeVisible();

  await expect(page.getByText(/kdv dahil/i).first()).toBeVisible();
  await expect(page.getByText(/₺/).first()).toBeVisible();
});

test("m² ürününde minimum 1 m² kuralı kullanıcıya bildiriliyor", async ({ page }) => {
  // Not: runbook "maksimum limit" varsayıyordu; sitede uygulanan kural
  // üretim MİNİMUMU (1 m²). Test gerçek davranışı doğruluyor.
  await page.goto("/urun/cin-vinil-branda");
  await cerezleriKapat(page);

  await expect(page.getByText(/en az 1 m²/i)).toBeVisible();
  await expect(page.getByText(/üretim minimumu/i)).toBeVisible();
});

test("ölçü değişince fiyat güncelleniyor", async ({ page }) => {
  await page.goto("/urun/cin-vinil-branda");
  await cerezleriKapat(page);

  const fiyatBolgesi = page.getByText(/kdv dahil/i).first();
  await expect(fiyatBolgesi).toBeVisible();
  const ilk = await page.locator("body").innerText();

  await page.getByRole("spinbutton", { name: /boy \(cm\)/i }).fill("300");
  await page.getByRole("spinbutton", { name: /adet/i }).fill("2");
  await page.waitForTimeout(1200);

  const sonra = await page.locator("body").innerText();
  expect(sonra).not.toBe(ilk);
});

test("taksit bilgisi ürün sayfasında görünüyor", async ({ page }) => {
  await page.goto("/urun/cin-vinil-branda");
  await cerezleriKapat(page);
  await expect(page.getByText(/taksitle/i).first()).toBeVisible();
});

test("gramaj seçenekleri m² fiyatıyla listeleniyor", async ({ page }) => {
  await page.goto("/urun/cin-vinil-branda");
  await cerezleriKapat(page);

  await expect(page.getByRole("radio", { name: /280 gr/i })).toBeVisible();
  await expect(page.getByRole("radio", { name: /440 gr/i })).toBeVisible();
  await expect(page.getByText(/₺\/m²/).first()).toBeVisible();
});

test("plastik reklam dubası kategorisi açılıyor ve fiyat içeriyor", async ({ page }) => {
  await page.goto("/kategori/plastik-reklam-dubasi");
  await cerezleriKapat(page);

  await expect(page.getByRole("heading").first()).toBeVisible();
  await expect(page.getByText(/₺/).first()).toBeVisible();
});

test("broşür ürün sayfası açılıyor ve görsel içeriyor", async ({ page }) => {
  await page.goto("/urun/brosur");
  await cerezleriKapat(page);

  await expect(page.getByRole("heading", { name: /broşür/i }).first()).toBeVisible();
  await expect(page.getByRole("img").first()).toBeVisible();
});

test("sepet butonu her sayfada erişilebilir", async ({ page }) => {
  await expect(page.getByRole("button", { name: /sepetim/i })).toBeVisible();
});
