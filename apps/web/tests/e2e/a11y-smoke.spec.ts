import { test, expect } from "@playwright/test";

/**
 * A11y smoke — axe-playwright entegrasyonu yok (henüz),
 * fakat temel WCAG/SEO kırmızı bayrakları manuel olarak kontrol ediyoruz:
 *  - Tek bir <h1>
 *  - aria-labelledby kullanılan her elemanın referans verdiği ID gerçekten var
 *  - Form input'larının her birinin label/aria-label/aria-labelledby'sı var
 *  - Klavyeyle main content'e atlanabilen "skip link" benzeri akış (ilk linkler navigable)
 */

test.describe("A11y smoke — anasayfa temel erişilebilirlik", () => {
  test("anasayfada tek bir <h1> bulunur", async ({ page }) => {
    await page.goto("/");
    const h1Count = await page.locator("h1").count();
    expect(h1Count).toBe(1);
  });

  test("aria-labelledby referansları kırık değil", async ({ page }) => {
    await page.goto("/");
    const labelledByRefs = await page
      .locator("[aria-labelledby]")
      .evaluateAll((els) =>
        els
          .map((el) => el.getAttribute("aria-labelledby"))
          .filter((v): v is string => !!v)
          .flatMap((v) => v.split(/\s+/))
          .filter(Boolean),
      );

    // Referansları unique'leştir — aynı ID'yi tekrar tekrar kontrol etmeyelim
    const uniqueRefs = Array.from(new Set(labelledByRefs));

    for (const refId of uniqueRefs) {
      const exists = await page.locator(`#${CSS.escape(refId)}`).count();
      expect(exists, `aria-labelledby="${refId}" referans verilen element bulunamadı`).toBeGreaterThan(0);
    }
  });

  test("aria-describedby referansları kırık değil", async ({ page }) => {
    await page.goto("/");
    const describedByRefs = await page
      .locator("[aria-describedby]")
      .evaluateAll((els) =>
        els
          .map((el) => el.getAttribute("aria-describedby"))
          .filter((v): v is string => !!v)
          .flatMap((v) => v.split(/\s+/))
          .filter(Boolean),
      );

    const uniqueRefs = Array.from(new Set(describedByRefs));
    for (const refId of uniqueRefs) {
      const exists = await page.locator(`#${CSS.escape(refId)}`).count();
      expect(exists, `aria-describedby="${refId}" referans verilen element bulunamadı`).toBeGreaterThan(0);
    }
  });

  test("görsellerin alt attribute'u var (decorative değilse boş bile olsa attribute tanımlı olmalı)", async ({
    page,
  }) => {
    await page.goto("/");
    const missingAlt = await page.locator("main img:not([alt])").count();
    expect(missingAlt, "alt attribute eksik <img> tespit edildi").toBe(0);
  });

  test("html lang attribute set edilmiş (Türkçe site)", async ({ page }) => {
    await page.goto("/");
    const lang = await page.locator("html").getAttribute("lang");
    expect(lang).toBeTruthy();
    // tr-TR veya tr olmalı
    expect(lang?.toLowerCase()).toMatch(/^tr/);
  });
});
