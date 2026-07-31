import { describe, it, expect } from "vitest";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { token } from "../styled-system/tokens";

/**
 * Guards against four ways Panda styling breaks *silently*.
 *
 * All three of these shipped at some point, and none of them is visible to
 * `tsc` or to a rendering test: the component still mounts, the class name is
 * still emitted, the tests still pass — only the CSS is wrong or missing. They
 * were each found by diffing the generated stylesheet by hand. These tests make
 * that diff unnecessary.
 *
 *   1. A `token(...)` path that does not exist. Panda passes the unresolved path
 *      through as a literal string, so the browser drops the whole declaration.
 *      Symptom: `.c_token\(colors\.primary\) { color: colors.primary }`.
 *
 *   2. A JS identifier used as a value inside `css({})`. Panda extracts `css()`
 *      arguments statically, so a variable produces NO CSS at all.
 *
 *   3. A multi-value spacing shorthand written with bare grid numbers. Panda
 *      resolves spacing tokens for single values only: `padding: "4"` is 16px,
 *      but `padding: "2 3"` is `2px 3px` — NOT 8px/12px. A bulk migration to
 *      grid tokens shrinks every shorthand it touches by roughly 4x.
 *
 *   4. The CSS-function form `"token(colors.x)"` written outside a `css({})` block —
 *      typically in a JSX `style={{}}`. Only Panda resolves that syntax, and it never
 *      sees an inline style, so the literal reaches the browser and the declaration is
 *      dropped. Rule 1 does not catch it: the path is perfectly valid, just unresolved.
 *      Use the imported `token("colors.x")` call there instead.
 */

const ROOT = join(import.meta.dirname, "..");
const SKIP = new Set(["node_modules", "styled-system", "build", "dist", ".git", "test"]);

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
 * Byte ranges of the style object passed to `css({…})`, `defineRecipe({…})` or
 * `defineSlotRecipe({…})`.
 *
 * Recipes matter as much as `css()` here: they are style objects Panda compiles the same
 * way, and they live in `panda.config.ts`, the file that is supposed to be the source of
 * truth. A migration that scanned only `css({` once left raw `999px`, `2px` and
 * `all 0.2s ease` sitting in the button recipe — the exact values it had just removed
 * everywhere else.
 */
function styleBlocks(source: string): Array<[number, number]> {
  const blocks: Array<[number, number]> = [];
  for (const match of source.matchAll(/\b(?:css|defineRecipe|defineSlotRecipe)\(\{/g)) {
    const start = match.index + match[0].length - 1;
    let depth = 0;
    for (let i = start; i < source.length; i++) {
      if (source[i] === "{") depth++;
      else if (source[i] === "}" && --depth === 0) {
        blocks.push([start, i + 1]);
        break;
      }
    }
  }
  return blocks;
}

const FILES = sourceFiles(ROOT).map((path) => ({
  path: path.slice(ROOT.length + 1),
  source: readFileSync(path, "utf8"),
}));

describe("style conventions", () => {
  it("every token(...) reference resolves to a real token", () => {
    const broken: string[] = [];
    for (const { path, source } of FILES) {
      for (const match of source.matchAll(/token\(([a-zA-Z]+\.[a-zA-Z0-9.]+)\)/g)) {
        // `token("colors.x", fallback)` in code vs `"token(colors.x)"` in a style
        // string both reduce to the same path.
        if (token(match[1] as Parameters<typeof token>[0]) === undefined) {
          broken.push(`${path}: token(${match[1]})`);
        }
      }
    }
    expect(broken, "undefined token paths emit invalid CSS that browsers discard").toEqual([]);
  });

  it("no css({}) value is a bare JS identifier", () => {
    const offenders: string[] = [];
    for (const { path, source } of FILES) {
      for (const [start, end] of styleBlocks(source)) {
        const block = source.slice(start, end);
        // property: IDENTIFIER — excludes string/number/object/array/template values.
        for (const match of block.matchAll(/^\s*([a-zA-Z_$][\w$]*):\s*([A-Z][A-Z0-9_]{2,})\s*[,}]/gm)) {
          offenders.push(`${path}: ${match[1]}: ${match[2]}`);
        }
      }
    }
    expect(
      offenders,
      "Panda extracts css() statically — a JS constant here produces no CSS. Use a token name.",
    ).toEqual([]);
  });

  it("no multi-value spacing shorthand uses bare grid numbers", () => {
    const SPACING = new Set([
      "padding",
      "paddingX",
      "paddingY",
      "paddingTop",
      "paddingBottom",
      "paddingLeft",
      "paddingRight",
      "margin",
      "marginX",
      "marginY",
      "marginTop",
      "marginBottom",
      "marginLeft",
      "marginRight",
      "gap",
      "rowGap",
      "columnGap",
      "p",
      "px",
      "py",
      "pt",
      "pb",
      "pl",
      "pr",
      "m",
      "mx",
      "my",
      "mt",
      "mb",
      "ml",
      "mr",
    ]);
    const offenders: string[] = [];
    for (const { path, source } of FILES) {
      for (const [start, end] of styleBlocks(source)) {
        const block = source.slice(start, end);
        for (const match of block.matchAll(/\b([a-zA-Z]+):\s*"([^"]{1,40})"/g)) {
          if (!SPACING.has(match[1])) continue;
          const parts = match[2].trim().split(/\s+/);
          const bareNumbers = parts.filter((p) => /^-?\d+(\.\d+)?$/.test(p));
          // A single bare number is a real token lookup; two or more are raw px.
          if (parts.length > 1 && bareNumbers.length > 0 && bareNumbers.some((n) => n !== "0")) {
            offenders.push(`${path}: ${match[1]}: "${match[2]}"`);
          }
        }
      }
    }
    expect(
      offenders,
      'Panda reads shorthand numbers as px, not grid steps: padding "2 3" is 2px 3px, not 8px 12px. ' +
        "Use explicit px, or split into paddingX/paddingY.",
    ).toEqual([]);
  });

  it("no token(...) CSS-function string sits outside a css({}) block", () => {
    const offenders: string[] = [];
    for (const { path, source } of FILES) {
      // Config recipes are compiled by Panda itself, not through css() — different rules.
      if (path === "panda.config.ts") continue;
      const blocks = styleBlocks(source);
      // Bare path = the CSS-function form. The imported helper always quotes its
      // argument — `token("colors.x")` — so it can never match here.
      for (const match of source.matchAll(/token\([a-zA-Z]+\.[a-zA-Z0-9.]+\)/g)) {
        if (blocks.some(([start, end]) => match.index >= start && match.index < end)) continue;
        offenders.push(`${path}:${source.slice(0, match.index).split("\n").length}`);
      }
    }
    expect(
      offenders,
      'The CSS-function form "token(colors.x)" is resolved by Panda only inside css({}). ' +
        "In a JSX style={{}} or a plain string it ships verbatim and the browser drops the " +
        'declaration — use the imported token("colors.x") call there instead.',
    ).toEqual([]);
  });
});
