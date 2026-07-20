import { test, expect, type Page } from "@playwright/test";

/**
 * Görsel regresyon — kritik sayfaların fullPage ekran görüntüsü karşılaştırması.
 * 4 viewport (playwright.config.ts VISUAL_VIEWPORTS) × aşağıdaki sayfa seti.
 *
 * Determinizm önlemleri:
 * - Consent cookie önceden basılır → çerez banner'ı hiç açılmaz.
 * - page.clock.setFixedTime → "En geç {tarih} kargoda" ve 14:00 cutoff satırı sabit
 *   (kutu yüksekliği saate göre değiştiğinden mask yetmez, saat sabitlenir).
 * - reduced-motion (config) ScrollReveal'ı kapatır; kendi reduced-motion kontrolü
 *   olmayan ham whileInView bileşenleri (ör. trust-badges) için sayfa bir kez
 *   baştan sona kaydırılır → reveal tetiklenir, lazy görseller yüklenir.
 * - Hero slider (autoplay setInterval — sabit saatten etkilenmez) ve Turnstile
 *   iframe'i (3. taraf, yükleme durumu değişken) maskelenir.
 *
 * Koşum:  pnpm --filter @markala/web test:visual          (localhost, dev server)
 *         PLAYWRIGHT_BASE_URL=https://markala.com.tr ...   (canlıya karşı)
 * Baseline güncelleme (bilinçli tasarım/fiyat değişikliği sonrası):
 *         pnpm --filter @markala/web test:visual:update
 */

// Pazartesi 10:30 — hafta içi, 14:00 üretim cutoff'u öncesi (sameDayIntake satırı hep görünür)
const FIXED_NOW = new Date("2026-07-20T10:30:00+03:00");

// cookie-consent.tsx ile eşleşmeli: COOKIE_NAME + CONSENT_VERSION
const CONSENT_COOKIE_NAME = "markala_cookie_consent";
const CONSENT_COOKIE_VALUE = encodeURIComponent(
  JSON.stringify({
    necessary: true,
    analytics: false,
    preferences: false,
    marketing: false,
    timestamp: FIXED_NOW.getTime(),
    version: "1.1",
  }),
);

/** Her sayfada maskelenecek nondeterministik alanlar. */
const GLOBAL_MASKS = ['iframe[src*="challenges.cloudflare.com"]'];

const PAGES: Array<{ name: string; path: string; masks?: string[] }> = [
  { name: "anasayfa", path: "/", masks: ['section[aria-label="Markala öne çıkanlar"]'] },
  { name: "kategoriler", path: "/kategoriler" },
  { name: "kategori-kartvizit", path: "/kategori/kartvizit" },
  // İki fiyat modu da kapsansın: additive (kartvizit) + area/m² (branda)
  { name: "urun-klasik-kartvizit", path: "/urun/klasik-kartvizit" },
  { name: "urun-vinil-branda-440gr", path: "/urun/vinil-branda-440gr" },
  { name: "sepet-bos", path: "/sepet" },
  { name: "kampanyalar", path: "/kampanyalar" },
  { name: "teklif-al", path: "/teklif-al" },
];

/**
 * Ham whileInView reveal'larını tetikleyip lazy görselleri yükler, başa döner.
 * (clock.setFixedTime yalnız Date'i sabitler; buradaki setTimeout'lar normal işler.)
 */
async function revealAndSettle(page: Page): Promise<void> {
  await page.evaluate(async () => {
    // Lazy görselleri hemen yüklemeye zorla — viewport'tan uzaklaşınca Chromium
    // lazy fetch'i iptal edebiliyor; onload hiç gelmeyince bekleme asılı kalıyordu.
    for (const img of Array.from(document.images)) img.loading = "eager";

    const step = Math.max(300, Math.floor(window.innerHeight * 0.75));
    let y = 0;
    // scrollHeight döngü sırasında büyüyebilir → sonsuz döngüye karşı sabit üst sınır
    for (let i = 0; i < 80 && y <= document.documentElement.scrollHeight; i++, y += step) {
      window.scrollTo(0, y);
      await new Promise((r) => setTimeout(r, 60));
    }
    window.scrollTo(0, 0);

    // Görsel yüklemelerini bekle — asla süresiz değil (üst sınır 15s)
    const pending = Array.from(document.images).filter((img) => !img.complete);
    await Promise.race([
      Promise.all(
        pending.map(
          (img) =>
            new Promise((resolve) => {
              img.onload = img.onerror = () => resolve(null);
            }),
        ),
      ),
      new Promise((r) => setTimeout(r, 15_000)),
    ]);
  });
  // Tetiklenen reveal animasyonlarının (0.5s) oturması
  await page.waitForTimeout(700);
}

test.describe("görsel regresyon", () => {
  test.beforeEach(async ({ context, page, baseURL }) => {
    await context.addCookies([
      { name: CONSENT_COOKIE_NAME, value: CONSENT_COOKIE_VALUE, url: baseURL! },
    ]);
    await page.clock.setFixedTime(FIXED_NOW);
  });

  for (const { name, path, masks } of PAGES) {
    test(name, async ({ page }) => {
      const response = await page.goto(path, { waitUntil: "load" });
      // 503 (nginx limit_req / bakım modu) ekran görüntüsü olarak karşılaştırılmasın
      // ve --update-snapshots'ta asla baseline'a yazılmasın → net hata ver.
      expect(response?.status(), `${path} 200 dönmeli (rate-limit veya bakım modu?)`).toBe(200);
      await revealAndSettle(page);
      await expect(page).toHaveScreenshot(`${name}.png`, {
        fullPage: true,
        animations: "disabled",
        caret: "hide",
        mask: [...GLOBAL_MASKS, ...(masks ?? [])].map((sel) => page.locator(sel)),
        timeout: 45_000,
      });
    });
  }
});
