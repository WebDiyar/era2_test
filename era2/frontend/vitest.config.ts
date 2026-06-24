import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

// тесты — чистая логика (редьюсер/селекторы), поэтому окружение node, без jsdom.
export default defineConfig({
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
  test: {
    environment: "node",
    include: ["src/**/*.test.ts"],
  },
});
