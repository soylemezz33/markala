import { defineConfig, devices } from "@playwright/test";

/**
 * Playwright E2E config — @markala/web
 *
 * - testDir: tests/e2e
 * - 2 retry (flaky network/animasyon koruması)
 * - 4 worker (CI'da uyumlu)
 * - PLAYWRIGHT_BASE_URL env ile staging/prod test edilebilir
 * - chromium + Pixel 5 (mobil) projects
 */
export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: true,
  retries: 2,
  workers: 4,
  reporter: process.env.CI ? [["github"], ["html", { outputFolder: "playwright-report", open: "never" }]] : "list",
  use: {
    baseURL: process.env.PLAYWRIGHT_BASE_URL ?? "http://localhost:3000",
    trace: "on-first-retry",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
  },
  /**
   * Yerel geliştirmede `playwright test` çalıştırıldığında Next dev server'ı
   * otomatik ayağa kaldır. PLAYWRIGHT_BASE_URL set ise (staging/prod test)
   * webServer atlanır — dış URL'e gidilir.
   */
  webServer: process.env.PLAYWRIGHT_BASE_URL
    ? undefined
    : {
        command: process.env.CI ? "pnpm start" : "pnpm dev",
        url: "http://localhost:3000",
        reuseExistingServer: !process.env.CI,
        timeout: 120_000,
      },
  projects: [
    { name: "chromium", use: { ...devices["Desktop Chrome"] } },
    { name: "mobile", use: { ...devices["Pixel 5"] } },
  ],
});
