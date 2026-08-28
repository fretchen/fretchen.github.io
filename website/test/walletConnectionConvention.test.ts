import { describe, it, expect } from "vitest";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";

/**
 * Guards against re-introducing the "flash of stale disconnected state" risk that
 * hooks/useIsWalletConnected.ts exists to prevent — see its doc comment and
 * wagmi.config.ts's `ssr: true` comment for the mechanism (wagmi's reconnect-on-mount
 * moved from render-synchronous to an effect; a component reading raw
 * `useAccount().isConnected` renders "disconnected" for one extra tick after
 * hydration, even for an already-connected wallet).
 *
 * hooks/useIsWalletConnected.ts is the one place allowed to read `status` off
 * useAccount() directly — everywhere else should go through it (or through
 * useWalletConnection(), which itself calls useIsWalletConnected()).
 */

const ROOT = join(import.meta.dirname, "..");
const SCAN_DIRS = ["components", "hooks"];
const EXEMPT_FILES = new Set(["hooks/useIsWalletConnected.ts"]);
const SKIP = new Set(["node_modules"]);

function sourceFiles(dir: string, out: string[] = []): string[] {
  for (const entry of readdirSync(dir)) {
    if (SKIP.has(entry)) continue;
    const path = join(dir, entry);
    if (statSync(path).isDirectory()) sourceFiles(path, out);
    else if (/\.(tsx?|jsx?)$/.test(entry) && !/\.test\./.test(entry)) out.push(path);
  }
  return out;
}

// Matches a destructure of `isConnected` off a useAccount() call, however the
// destructure is formatted (single line, multi-line, other fields alongside it).
const RAW_IS_CONNECTED = /const\s*\{[^}]*\bisConnected\b[^}]*\}\s*=\s*useAccount\(/;

describe("wallet connection convention", () => {
  it("no component or hook reads useAccount().isConnected directly", () => {
    const violations = SCAN_DIRS.flatMap((dir) => sourceFiles(join(ROOT, dir)))
      .filter((path) => !EXEMPT_FILES.has(path.slice(ROOT.length + 1)))
      .filter((path) => RAW_IS_CONNECTED.test(readFileSync(path, "utf-8")))
      .map((path) => path.slice(ROOT.length + 1));

    expect(violations, `Use hooks/useIsWalletConnected.ts instead:\n${violations.join("\n")}`).toEqual([]);
  });
});
