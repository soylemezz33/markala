import { defineConfig, devices } from "@playwright/test";

/**
 * Playwright config — @markala/web
 *
 * İki test katmanı:
 * - tests/e2e     → fonksiyonel E2E (chromium + Pixel 5)
 * - tests/visual  → görsel regresyon (4 viewport, toHaveScreenshot)
 *
 * - PLAYWRIGHT_BASE_URL env ile staging/prod test edilebilir; set değilse
 *   Next dev server otomatik ayağa kalkar.
 * - Görsel baseline'lar font render'ı nedeniyle işletim sistemine bağlıdır;
 *   snapshotPathTemplate platform ekini bilerek içermez → baseline'lar tek
 *   platformda (Windows) üretilip aynı platformda karşılaştırılmalıdır.
 *   CI'da (linux) koşulacaksa baseline'lar orada yeniden üretilmelidir.
 */

/** Görsel regresyon kırılım noktaları — Tailwind sm/md/lg/xl hattını örter. */
const VISUAL_VIEWPORTS = [
  { name: "visual-390", width: 390, height: 844 }, // mobil
  { name: "visual-768", width: 768, height: 1024 }, // tablet
  { name: "visual-1280", width: 1280, height: 800 }, // laptop
  { name: "visual-1920", width: 1920, height: 1080 }, // geniş masaüstü
];

export default defineConfig({
  testDir: "./tests",
  fullyParallel: true,
  retries: 2,
  // Uzak hedefe (canlı/staging) karşı 4 paralel worker nginx limit_req'e takılıp
  // 503 üretiyor (2026-07-18'de görüldü) → uzakta 2'ye düşür, lokalde 4 kalsın.
  workers: process.env.PLAYWRIGHT_BASE_URL ? 2 : 4,
  expect: {
    toHaveScreenshot: {
      // Aynı makinede yeniden koşular piksel-eşdeğer olmalı; ufak antialias
      // sapmalarına tolerans. Gerçek bir yerleşim kayması binlerce piksel oynatır.
      maxDiffPixels: 120,
    },
  },
  snapshotPathTemplate: "{testDir}/visual/__screenshots__/{projectName}/{arg}{ext}",
  use: {
    baseURL: process.env.PLAYWRIGHT_BASE_URL ?? "http://localhost:3000",
    trace: "on-first-retry",
  },
  /**
   * Yerel geliştirmede `playwright test` çalıştırıldığında Next dev server'ı
   * otomatik ayağa kaldır. PLAYWRIGHT_BASE_URL set ise (staging/prod test)
   * webServer atlanır — dış URL'e gidilir.
   */
  webServer: process.env.PLAYWRIGHT_BASE_URL
    ? undefined
    : {
        command: "pnpm dev",
        url: "http://localhost:3000",
        reuseExistingServer: !process.env.CI,
        timeout: 120_000,
      },
  projects: [
    { name: "chromium", testMatch: "e2e/**/*.spec.ts", use: { ...devices["Desktop Chrome"] } },
    { name: "mobile", testMatch: "e2e/**/*.spec.ts", use: { ...devices["Pixel 5"] } },
    ...VISUAL_VIEWPORTS.map(({ name, width, height }) => ({
      name,
      testMatch: "visual/**/*.spec.ts",
      // fullPage + prod ağı + scroll-pass 30sn'lik varsayılan test timeout'una sığmıyor
      timeout: 90_000,
      use: {
        viewport: { width, height },
        deviceScaleFactor: 1,
        // ScrollReveal reduced-motion'da animasyonsuz render eder → fullPage
        // ekran görüntüsünde fold altı içerik opacity:0 takılı kalmaz.
        contextOptions: { reducedMotion: "reduce" as const },
      },
    })),
  ],
});
