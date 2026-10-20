/**
 * Bundle regression test — the deploy zip is dist/** and nothing else.
 *
 * serverless.yml packages `dist/**` only: no package.json, no node_modules.
 * A bare import that survives into an emitted chunk therefore works locally
 * (node_modules is right there) and dies on Scaleway with ERR_MODULE_NOT_FOUND
 * before the handler ever runs. That exact failure shipped once: tsdown's
 * `deps.alwaysBundle: ["viem"]` matched the bare specifier but not the
 * `viem/chains` subpath, the function 500ed on import, the platform's error
 * preflight broke CORS, and the dashboard showed "Failed to fetch".
 *
 * tsdown's `deps.onlyImport` already fails the *build* on a stray bare
 * specifier, but nothing runs this package's build in CI — this test catches
 * the same failure independently of that config, by reproducing the production
 * environment: build with the real tsdown.config.ts into an empty temp
 * directory (no node_modules above it), then import both entries there the way
 * the Scaleway runtime does.
 *
 * The import runs in a child `node` process, not a dynamic import here:
 * vitest's module runner would resolve the chunk's bare imports against this
 * project's node_modules and hide the very failure under test.
 */
import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { mkdtemp, rm, readdir } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { build, type InlineConfig, type UserConfig } from "tsdown";
import userConfig from "../tsdown.config.js";

const execFileAsync = promisify(execFile);

// The two handlers serverless.yml deploys (functions.analytics, functions.rollup).
const ENTRIES = ["analytics.js", "rollup.js"] as const;

describe("bundled dist", () => {
  let outDir: string;

  beforeAll(async () => {
    // A fresh tmp dir has no node_modules above it, so a bare import that
    // survived bundling fails to resolve here exactly as it does on Scaleway.
    outDir = await mkdtemp(path.join(tmpdir(), "analytics-dist-"));
    await build({ ...(userConfig as UserConfig), outDir } as InlineConfig);
  }, 60_000);

  afterAll(async () => {
    await rm(outDir, { recursive: true, force: true });
  });

  it("emits both deployed handlers", async () => {
    const files = await readdir(outDir);
    for (const entry of ENTRIES) {
      expect(files, `expected ${entry} in the build output`).toContain(entry);
    }
  });

  it("loads in an environment without node_modules — no bare import survives bundling", async () => {
    const entryUrls = ENTRIES.map((entry) => pathToFileURL(path.join(outDir, entry)).href);
    try {
      const { stdout } = await execFileAsync(
        process.execPath,
        [
          "--input-type=module",
          "-e",
          `const mods = await Promise.all((process.env.ENTRY_URLS ?? "").split("\\n").map((url) => import(url)));
           for (const [index, mod] of mods.entries()) {
             if (typeof mod.handle !== "function") throw new Error(\`entry \${index} does not export handle()\`);
           }`,
        ],
        { env: { ...process.env, ENTRY_URLS: entryUrls.join("\n") }, timeout: 30_000 },
      );
      expect(stdout.trim()).toBe("");
    } catch (err) {
      // The child's stderr names the offending package (ERR_MODULE_NOT_FOUND) —
      // surface it, since the whole point is knowing which import was not bundled.
      expect(
        (err as { stderr?: string }).stderr ?? String(err),
        "a bare import survived bundling — the deploy zip ships dist/** with no node_modules, so it is fatal on Scaleway",
      ).toBe("");
    }
  });
});
