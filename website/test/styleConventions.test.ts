import { describe, it, expect } from "vitest";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { token } from "../styled-system/tokens";

/**
 * Guards against five ways Panda styling breaks *silently*.
 *
 * All of these shipped at some point, and none of them is visible to
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
 *
 *   5. A `fontFamily` that is not one of the three site faces. Two variants, both silent:
 *      a literal stack or CSS generic (`"monospace"`) bypasses the token system entirely,
 *      and — the nastier one — Panda's *preset* names `sans` / `serif` / `mono` are still
 *      valid tokens resolving to the old system stacks. A call site left on `"mono"` after
 *      the Source rollout keeps the system font and reports no error anywhere.
 *
 *   6. A config recipe invoked with a *variable* variant — `sectionRule({ territory })`.
 *      Rule 2 one level up: Panda resolves recipe variants statically too, so it emits only
 *      the `defaultVariants` case. Every other variant renders its class name with no rule
 *      behind it. This shipped as an invisible territory rule on all six lab pages — the
 *      purple half of the colour system painted nothing. Fix by listing the recipe in
 *      `staticCss`; `test/territoryRule.test.ts` then checks the CSS actually comes out.
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

  it("no multi-value spacing shorthand uses bare grid numbers or named tokens", () => {
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
    // The named steps of the spacing scale (panda.config.ts). In a shorthand these are far
    // worse than a bare number: `padding: "sm md"` emits the literal `padding:sm md`, which
    // is not valid CSS, so the browser discards the whole declaration and the element ends
    // up with NO padding. A bare number at least still produces a (wrong) length.
    const NAMED_STEPS = new Set(["xs", "sm", "md", "lg", "xl", "2xl"]);

    const numberOffenders: string[] = [];
    const tokenOffenders: string[] = [];
    for (const { path, source } of FILES) {
      for (const [start, end] of styleBlocks(source)) {
        const block = source.slice(start, end);
        for (const match of block.matchAll(/\b([a-zA-Z]+):\s*"([^"]{1,40})"/g)) {
          if (!SPACING.has(match[1])) continue;
          const parts = match[2].trim().split(/\s+/);
          if (parts.length < 2) continue; // A single value is a real token lookup.
          const where = `${path}: ${match[1]}: "${match[2]}"`;
          const bareNumbers = parts.filter((p) => /^-?\d+(\.\d+)?$/.test(p));
          if (bareNumbers.some((n) => n !== "0")) {
            numberOffenders.push(where);
          }
          if (parts.some((p) => NAMED_STEPS.has(p))) {
            tokenOffenders.push(where);
          }
        }
      }
    }
    expect(
      numberOffenders,
      'Panda reads shorthand numbers as px, not grid steps: padding "2 3" is 2px 3px, not 8px 12px. ' +
        "Use explicit px, or split into paddingX/paddingY.",
    ).toEqual([]);
    expect(
      tokenOffenders,
      'Named spacing tokens do not resolve inside a shorthand: padding "sm md" emits the literal ' +
        '"padding:sm md", which is invalid CSS — the browser drops the declaration and you get no ' +
        "spacing at all. Split into paddingX/paddingY (or marginTop/marginY, …), which do tokenise.",
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

  it("every fontFamily is one of the three site faces", () => {
    // The site has three faces, named by job: reading (serif prose), ui (sans chrome),
    // code (mono). `inherit` is a deliberate opt-out used by form controls.
    const ALLOWED = new Set(["reading", "ui", "code", "inherit"]);
    const offenders: string[] = [];
    for (const { path, source } of FILES) {
      // panda.config.ts holds the real stacks — it is where the token values are defined.
      if (path === "panda.config.ts") continue;
      for (const [start, end] of styleBlocks(source)) {
        const block = source.slice(start, end);
        for (const match of block.matchAll(/\bfontFamily:\s*"([^"]*)"/g)) {
          if (ALLOWED.has(match[1])) continue;
          const line = source.slice(0, start + match.index).split("\n").length;
          offenders.push(`${path}:${line}: fontFamily: "${match[1]}"`);
        }
      }
    }
    expect(
      offenders,
      "fontFamily must name a site face: reading | ui | code. A literal stack or a CSS " +
        'generic ("monospace") bypasses the tokens, and Panda\'s preset names sans/serif/mono ' +
        "are still valid tokens pointing at the OLD system stacks — so they fail silently " +
        "rather than erroring. See README.md → Typography.",
    ).toEqual([]);
  });

  it("every painting recipe variant passed as a variable is covered by staticCss", async () => {
    const config = (await import("../panda.config")).default;
    const recipes = (config.theme?.extend?.recipes ?? {}) as Record<
      string,
      { variants?: Record<string, Record<string, object>> }
    >;
    const covered = new Set(Object.keys(config.staticCss?.recipes ?? {}));

    /**
     * Only a variant that carries declarations of its own needs its class generated.
     * `button`'s `active: { true: {} }` is empty — it paints via compoundVariants, which
     * Panda emits as atomic utilities — so a dynamic `active` is safe. `sectionRule`'s
     * `territory` sets a backgroundColor, so an ungenerated variant paints nothing.
     */
    const paints = (recipe: string, variantKey: string) =>
      Object.values(recipes[recipe]?.variants?.[variantKey] ?? {}).some((style) => Object.keys(style ?? {}).length > 0);

    const LITERAL = /^(true|false|\d+|["'`])/;
    const offenders: string[] = [];

    for (const { path, source } of FILES) {
      if (path === "panda.config.ts") continue;
      for (const recipe of Object.keys(recipes)) {
        if (covered.has(recipe)) continue;
        for (const match of source.matchAll(new RegExp(`\\b${recipe}\\(\\{([^}]*)\\}\\)`, "g"))) {
          for (const arg of match[1].split(",")) {
            const [rawKey, rawValue] = arg.split(":").map((part) => part.trim());
            if (!rawKey) continue;
            // Shorthand `{ territory }` is always dynamic; `key: value` only when the
            // value is an identifier rather than a literal.
            const isDynamic = rawValue === undefined ? /^[a-zA-Z_$][\w$]*$/.test(rawKey) : !LITERAL.test(rawValue);
            if (!isDynamic || !paints(recipe, rawKey)) continue;
            const line = source.slice(0, match.index).split("\n").length;
            offenders.push(`${path}:${line}: ${recipe}({ …${rawKey}… })`);
          }
        }
      }
    }

    expect(
      offenders,
      "A config recipe variant passed as a variable emits only its defaultVariants case — " +
        "every other value renders a class name with no CSS behind it. That is how the " +
        "territory rule went invisible on all six lab pages. List the recipe under staticCss " +
        'in panda.config.ts, e.g. `sectionRule: [{ territory: ["*"] }]`.',
    ).toEqual([]);
  });
});
