import { defineConfig, configDefaults } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    globals: true,
    // Hermetic unit run: exclude the live-RPC integration suite.
    // Run those with `npm run test:integration` (vitest.integration.config.js).
    exclude: [...configDefaults.exclude, "test/integration/**"],
    // Point every configured RPC at a closed port. A unit test that reaches for the network
    // then fails fast instead of passing on whatever the live chain happened to answer —
    // which is how x402_verify.test.ts once "tested" expiry and amount checks it never
    // reached. Real chain behaviour belongs in test/helpers/fakeChain.ts or the integration
    // suite. (x402_fee.ts builds its clients with a bare http() and ignores these; its tests
    // mock viem instead.)
    env: {
      RPC_URL_EIP155_10: "http://127.0.0.1:9",
      RPC_URL_EIP155_11155420: "http://127.0.0.1:9",
      RPC_URL_EIP155_8453: "http://127.0.0.1:9",
      RPC_URL_EIP155_84532: "http://127.0.0.1:9",
    },
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
