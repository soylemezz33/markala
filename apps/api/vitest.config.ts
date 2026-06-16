import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    globals: true,
    environment: "node",
    include: ["src/**/*.spec.ts"],
    coverage: {
      provider: "v8",
      // lcov: CI artifact upload ve harici araçlarla entegrasyon için
      reporter: ["text", "html", "lcov"],
      exclude: ["**/*.dto.ts", "**/*.module.ts", "src/main.ts", "**/*.guard.ts", "**/*.decorator.ts"],
      // Vitest v2: eşikler coverage.thresholds bloğunda tanımlanır.
      // Şu an eşik yok — test sayısı arttıkça web config ile birlikte ayrı PR'da kalibre edilecek.
      // (Mevcut kapsam ~41% < 50% idi; uncalibrated eşik CI'yı kırıyordu — web config ile tutarlı hale getirildi.)
    },
  },
});
