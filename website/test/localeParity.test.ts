/**
 * en/de key parity.
 *
 * `useLocale` resolves a dotted path and falls back to `label || ""` (hooks/useLocale.ts), so a key
 * present in `en.ts` but missing from `de.ts` does not throw, does not warn, and does not fall back
 * to English — it renders the literal string `imagegen.mintFailed` to German visitors. Nothing else
 * in the suite catches that.
 */
import { describe, it, expect } from "vitest";
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
