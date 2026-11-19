import { defineConfig } from "vitest/config";

export default defineConfig({
  // One viem copy for the whole test graph: consumers import viem through
  // @fretchen/chain-utils (see shared/VIEM_TS6_NOTES.md), which resolves its own
  // node_modules copy — without dedupe the vi.mock("viem") in test/setup.ts would
  // only intercept this package's copy, and the chain-utils re-export would run real.
  resolve: {
    dedupe: ["viem"],
  },
  test: {
    environment: "node",
    globals: true,
    pool: "threads",
    singleThread: true,
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html"],
      exclude: ["node_modules/**", "test/**", "coverage/**", "*.config.*"],
    },
    include: ["test/**/*.test.js", "test/**/*.test.ts"],
  },
});
