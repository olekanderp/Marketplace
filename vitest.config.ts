import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) },
  },
  test: {
    environment: "node",
    include: ["tests/**/*.test.ts"],
    env: {
      NODE_ENV: "test",
      JWT_SECRET: "test-only-secret-value-for-vitest-not-a-real-secret-000",
      JWT_EXPIRES_IN: "1h",
      DATABASE_URL: "postgres://unused:unused@localhost:5433/unused",
    },
  },
});
