import { describe, it, expect } from "vitest";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";

/**
 * A Vike `+` file may export only its own setting — `+image.ts` exports `image`, `+Page.tsx` a
 * default — or Vike warns "unexpected export" on every request (https://vike.dev/no-side-exports).
 * Shared values belong in `utils/`; `DEFAULT_SOCIAL_IMAGE` once lived in `pages/+image.ts`.
 * Type-only exports are erased at build time and are allowed.
 */

const ROOT = join(import.meta.dirname, "..");
const PAGES = join(ROOT, "pages");

function plusFiles(dir: string, out: string[] = []): string[] {
  for (const entry of readdirSync(dir)) {
    const path = join(dir, entry);
    if (statSync(path).isDirectory()) plusFiles(path, out);
    else if (/^\+[\w.-]+\.(tsx?|jsx?)$/.test(entry)) out.push(path);
  }
  return out;
}

function exportedNames(source: string): string[] {
  const names: string[] = [];
  for (const m of source.matchAll(/^export\s+(?:async\s+)?(?:function\*?|const|let|var|class)\s+(\w+)/gm)) {
    names.push(m[1]);
  }
  for (const m of source.matchAll(/^export\s*\{([^}]*)\}/gm)) {
    for (const item of m[1].split(",").map((s) => s.trim()).filter(Boolean)) {
      if (item.startsWith("type ")) continue;
      names.push(item.split(/\s+as\s+/).pop()!.trim());
    }
  }
  if (/^export\s+default\b/m.test(source)) names.push("default");
  if (/^export\s*\*/m.test(source)) names.push("*");
  return names;
}

describe("Vike + files", () => {
  it("export nothing but their own setting", () => {
    const violations = plusFiles(PAGES).flatMap((path) => {
      const setting = path.split("/").pop()!.replace(/^\+/, "").replace(/\.(tsx?|jsx?)$/, "");
      const extra = exportedNames(readFileSync(path, "utf-8")).filter((name) => name !== setting && name !== "default");
      return extra.map((name) => `${path.slice(ROOT.length + 1)}: ${name}`);
    });

    expect(violations, `Move these to utils/:\n${violations.join("\n")}`).toEqual([]);
  });
});
