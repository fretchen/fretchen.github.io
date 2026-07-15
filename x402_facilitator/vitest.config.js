import { defineConfig, configDefaults } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    globals: true,
    // Hermetic unit run: exclude the live-RPC integration suite.
    // Run those with `npm run test:integration` (vitest.integration.config.js).
    exclude: [...configDefaults.exclude, "test/integration/**"],
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html"],
      exclude: ["node_modules/", "test/", "*.config.js"],
    },
  },
});
