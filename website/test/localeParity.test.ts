/**
 * en/de key parity.
 *
 * `useLocale` resolves a dotted path and falls back to `label || ""` (hooks/useLocale.ts), so a key
 * present in `en.ts` but missing from `de.ts` does not throw, does not warn, and does not fall back
 * to English — it renders the literal string `imagegen.mintFailed` to German visitors. Nothing else
 * in the suite catches that.
 */
import { describe, it, expect } from "vitest";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import en from "../locales/en";
import de from "../locales/de";

/** Every leaf path in a nested translation object, e.g. "imagegen.checkGallery". */
function leafPaths(obj: unknown, prefix = ""): string[] {
  if (obj === null || typeof obj !== "object") return [prefix];
  return Object.entries(obj as Record<string, unknown>).flatMap(([key, value]) =>
    leafPaths(value, prefix ? `${prefix}.${key}` : key),
  );
}

describe("locale parity", () => {
  const enPaths = leafPaths(en).sort();
  const dePaths = leafPaths(de).sort();

  it("has no English key missing from German", () => {
    expect(enPaths.filter((p) => !dePaths.includes(p))).toEqual([]);
  });

  it("has no German key missing from English", () => {
    expect(dePaths.filter((p) => !enPaths.includes(p))).toEqual([]);
  });

  it("has no empty translations — an empty string falls back to the raw key path", () => {
    const empty = [...enPaths, ...dePaths].filter((path) => {
      const from = enPaths.includes(path) ? en : de;
      const value = path.split(".").reduce<unknown>((acc, k) => (acc as Record<string, unknown>)?.[k], from);
      return typeof value === "string" && value.trim().length === 0;
    });

    expect(empty).toEqual([]);
  });
});

const ROOT = join(import.meta.dirname, "..");
const SKIP = new Set(["node_modules", "styled-system", "build", "dist", ".git", "test", "coverage"]);

function sourceFiles(dir: string, out: string[] = []): string[] {
  for (const entry of readdirSync(dir)) {
    if (SKIP.has(entry)) continue;
    const path = join(dir, entry);
    if (statSync(path).isDirectory()) sourceFiles(path, out);
    else if (/\.(tsx?|jsx?)$/.test(entry)) out.push(path);
  }
  return out;
}

/**
 * Every locale key written as a literal in the source, with the file it came from.
 *
 * Three forms, because a key reaches the lookup three ways: the `useLocale` hook, the
 * `LocaleText` component, and `TOOL_REGISTRY`'s `label`, which holds a key rather than a
 * human string so the tool list can read as German. A key built at runtime is invisible
 * to this scan by construction — that is the argument for keeping them literal.
 */
const KEY_PATTERNS = [
  /useLocale\(\{\s*label:\s*"([^"]+)"/g,
  /<LocaleText\s+label="([^"]+)"/g,
  /\blabel:\s*"(assistent\.[^"]+)"/g,
];

function referencedKeys(): { key: string; file: string }[] {
  return sourceFiles(ROOT).flatMap((file) => {
    const source = readFileSync(file, "utf-8");
    return KEY_PATTERNS.flatMap((pattern) =>
      [...source.matchAll(pattern)].map((match) => ({ key: match[1], file: file.slice(ROOT.length + 1) })),
    );
  });
}

/**
 * The parity tests above prove `en.ts` and `de.ts` agree with *each other*. They cannot see a key
 * that exists in neither — which is what a typo at the call site produces.
 *
 * Both lookups fall back to rendering the key itself (`hooks/useLocale.ts`,
 * `components/LocaleText.tsx`), so `assistent.toolWebSerach` ships as that literal dotted string
 * in front of visitors: no throw, no warning, no failing test. The risk grew when
 * `TOOL_REGISTRY.label` stopped being a human string and became a key, since those are assembled
 * in a list rather than typed inline where a wrong one reads oddly.
 */
describe("locale keys referenced in source", () => {
  const referenced = referencedKeys();

  it("finds the call sites at all — a scan matching nothing would pass vacuously", () => {
    expect(referenced.length).toBeGreaterThan(50);
  });

  it("resolves every referenced key to a string in both locales", () => {
    const unresolved = referenced.filter(({ key }) =>
      [en, de].some((locale) => {
        const value = key.split(".").reduce<unknown>((acc, k) => (acc as Record<string, unknown>)?.[k], locale);
        return typeof value !== "string";
      }),
    );

    expect(unresolved.map(({ key, file }) => `${key} (${file})`)).toEqual([]);
  });
});
