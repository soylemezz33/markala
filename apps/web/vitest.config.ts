import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import path from "path";

/**
 * Vitest config — @markala/web
 *
 * - jsdom ortamı: React komponentleri ve DOM bağımlı util'ler için
 * - alias "@" → ./src (tsconfig paths ile aynı)
 * - thresholds: başlangıç eşiği lines/functions %60, branches %50
 * - lcov reporter: CI artifact upload için (actions/upload-artifact)
 */
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
      reporter: ["text", "html", "lcov"],
      reportsDirectory: "./coverage",
      thresholds: {
        lines: 60,
        functions: 60,
        branches: 50,
        statements: 60,
      },
    },
  },
});
