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
      // The retired splitter still has tests (they run, so it cannot rot silently) but
      // is excluded from the report: retired code should not misrepresent the coverage
      // of the code that actually serves traffic.
      exclude: ["node_modules/", "test/", "*.config.js", "x402_splitter_*.js"],
    },
  },
});
