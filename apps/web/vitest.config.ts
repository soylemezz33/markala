import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  test: {
    environment: "jsdom",
    globals: true,
    include: ["tests/unit/**/*.test.ts"],
    coverage: {
      provider: "v8",
      // lcov: CI artifact upload ve harici araçlarla entegrasyon için
      reporter: ["text", "html", "lcov"],
      // Vitest v2: eşikler coverage.thresholds bloğunda tanımlanmalı (coverage.lines deprecated).
      // Şu an eşik yok — test sayısı arttıkça ayrı PR'da kalibre edilecek.
    },
  },
});
