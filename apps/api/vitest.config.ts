import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    globals: true,
    environment: "node",
    include: ["src/**/*.spec.ts"],
    coverage: {
      provider: "v8",
      reporter: ["text", "html", "lcov"],
      exclude: ["**/*.dto.ts", "**/*.module.ts", "src/main.ts", "**/*.guard.ts", "**/*.decorator.ts"],
      thresholds: {
        lines: 50,
        functions: 40,
        branches: 50,
        statements: 50,
      },
    },
  },
});
