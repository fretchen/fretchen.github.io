import { defineConfig } from "vitest/config";

// Integration suite: live-RPC tests under test/integration/. Network-dependent
// (real Optimism mainnet + Sepolia calls), so run explicitly via
// `npm run test:integration`, separate from the hermetic `npm test` unit run.
export default defineConfig({
  test: {
    environment: "node",
    globals: true,
    include: ["test/integration/**/*.test.{js,ts}"],
    testTimeout: 30000, // live RPC calls can be slow
  },
});
