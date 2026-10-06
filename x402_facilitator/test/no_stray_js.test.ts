import { describe, it, expect } from "vitest";
import { readdirSync, statSync } from "node:fs";
import { join } from "node:path";

/**
 * Guards against untyped JS creeping back into this package.
 *
 * All production code and its live-code tests are TypeScript, checked under `strict: true`
 * (see tsconfig.json). The only JS left is the retired buyer-pays splitter (source + its own
 * tests, kept deliberately — see README.md → "Fee model history") and the root `*.config.js`
 * files, which eslint.config.js's "JS files" block exists to configure, not to license new
 * ones. A new `.js` test file would silently lose type checking the way the six files
 * converted here did (see the x402_facilitator JS→TS cleanup) — this test fails loudly instead.
 *
 * Modeled on website/test/styleConventions.test.ts's `sourceFiles()` walker.
 */

const ROOT = join(import.meta.dirname, "..");
const SKIP = new Set(["node_modules", "dist", "coverage", ".serverless", "notebooks"]);

// The only `.js` files this package intentionally keeps, as paths relative to ROOT.
const ALLOWED_JS = new Set([
  "eslint.config.js",
  "tsup.config.js",
  "vitest.config.js",
  "vitest.integration.config.js",
  "x402_splitter_facilitator.js",
  "x402_splitter_settle.js",
  "x402_splitter_supported.js",
  "x402_splitter_verify.js",
  "test/x402_splitter_settle.test.js",
  "test/x402_splitter_supported.test.js",
  "test/x402_splitter_verify.test.js",
]);

function jsFiles(dir: string, out: string[] = []): string[] {
  for (const entry of readdirSync(dir)) {
    if (SKIP.has(entry)) {
      continue;
    }
    const path = join(dir, entry);
    if (statSync(path).isDirectory()) {
      jsFiles(path, out);
    } else if (/\.(js|cjs|mjs)$/.test(entry)) {
      out.push(path);
    }
  }
  return out;
}

describe("no stray JS", () => {
  it("only the documented splitter + config files are JS — everything else must be TS", () => {
    const found = jsFiles(ROOT).map((path) => path.slice(ROOT.length + 1));

    const unexpected = found.filter((path) => !ALLOWED_JS.has(path));
    expect(unexpected).toEqual([]);

    // Also catch the inverse: an allowlisted file that was itself converted/removed and
    // never dropped from the list here.
    const missing = [...ALLOWED_JS].filter((path) => !found.includes(path));
    expect(missing).toEqual([]);
  });
});
