import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import path from "path";

/**
 * Vitest config — @markala/web
 *
 * - jsdom ortamı: React komponentleri ve DOM bağımlı util'ler için
 * - alias "@" → ./src (tsconfig paths ile aynı)
 * - coverage hedefi: %60 line — başlangıç eşiği, MVP sonrası %80'e çıkarılacak
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
      reporter: ["text", "html"],
      lines: 60,
    },
  },
});
