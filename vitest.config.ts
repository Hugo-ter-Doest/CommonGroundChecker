import { defineConfig } from "vitest/config";
import { fileURLToPath } from "node:url";

export default defineConfig({
  test: {
    environment: "node",
    include: ["tests/**/*.test.ts"],
    clearMocks: true,
    restoreMocks: true,
    coverage: {
      provider: "v8",
      reporter: ["text", "html", "json-summary"],
      include: [
        "src/lib/checkers/index.ts",
        "src/lib/checkers/sourcecode.ts",
        "src/lib/checkers/security.ts",
        "src/lib/checkers/semver.ts",
      ],
      exclude: ["src/generated/**"],
      thresholds: {
        lines: 90,
        functions: 90,
        statements: 90,
        branches: 45,
      },
    },
  },
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
});