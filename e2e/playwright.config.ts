import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./tests",
  baseURL: undefined,
  fullyParallel: true,
  retries: 1,
  reporter: [["html", { open: "never" }], ["list"]],
  use: {
    baseURL: process.env.BASE_URL ?? "https://markala.com.tr",
    trace: "on-first-retry",
    locale: "tr-TR",
timezoneId: "Europe/Istanbul",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
});
