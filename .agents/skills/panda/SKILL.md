---
name: "panda"
description: "Use when: writing or changing any style in website/ — css({}) calls, recipes or patterns, adding a token to panda.config.ts, or debugging an element that renders a class name but no CSS. Carries the six ways Panda fails silently in this repo (the component renders, tsc and tests pass, only the CSS is missing), the recipe for verifying a bulk style change, and pointers to the design system and the tests that enforce the rules."
---

# Panda styling in `website/`

Load this **before** writing or changing any style. The rules below are the ways Panda's
static compilation fails _silently_: the component still renders, the class name is still
emitted, `tsc` and the component tests pass, and only the CSS is wrong or missing. They
have all shipped here before. Structure follows the official Panda agent-skills pattern
(<https://panda-css.com/docs/get-started/agent-skills>): general Panda knowledge lives in
the official skills and docs, this file teaches the project's own rules. The executable
checklist is `website/test/styleConventions.test.ts` (call-site rules) and
`website/test/territoryRule.test.ts` (CSS really generated).

The design system — colours and their jobs, the button recipe, the scales, where styles
live — is in [`website/README.md`](../../../website/README.md); the reasoning behind it is
in [`IDENTITY.md`](../../../website/IDENTITY.md). Read both before adding any style; this
skill is not a summary of them.

## The six silent-failure rules

1. **Never pass a JS variable as a `css({})` value.** Panda resolves values statically at
   build time; what it cannot trace without running the code emits no CSS at all. Since the
   v2 engine, Panda _does_ trace a local constant and a named import
   (`import { accent } from "./palette"`) — but the convention is still the token _name_,
   spelled out at the call site: a traced raw value (`"#654321"`) silently goes off-token,
   and a value that only exists at runtime (a prop, state, a default or namespace import)
   still produces nothing, with no error anywhere.

   ```ts
   css({ color: props.accent }); // ✗ runtime value — silently produces nothing
   css({ color: importedHex }); // ✗ v2 emits this, but as a raw literal — off-token
   css({ color: "essayAccent" }); // ✓ token name, resolved at build time
   ```

   When a value is needed in both CSS and JS (a Chart.js dataset, an SVG `fill`, an inline
   `style={{}}`), define it once as a token in `panda.config.ts`, use the token _name_ inside
   `css({})`, and read it via `token("colors.essayAccent")` everywhere else. Pattern:
   `components/blog/palette.ts`.

2. **Spacing tokens resolve for single values only, never inside a shorthand.**

   ```ts
   padding: "4"        // ✓ var(--spacing-4) = 16px
   padding: "2 3"      // ✗ emits `2px 3px` — NOT 8px/12px
   padding: "8px 12px" // ✓ explicit
   paddingY: "2", paddingX: "3"  // ✓ longhands do tokenise
   ```

   This makes a bulk raw→token migration shrink every shorthand it touches by ~4×.

3. **Only reference tokens that exist.** An unknown path is passed through as a literal string
   and the browser discards the whole declaration — e.g. `token(colors.primary)` when the token
   is named `brand` emits `color: colors.primary`. Token names come from `panda.config.ts` and
   the generated `styled-system/`, not from guesswork; the official
   `panda-css` skill reads that output before writing — do the same.

4. **The `"token(…)"` string form works only inside `css({})`.** Panda resolves it at build
   time; a JSX inline style never reaches Panda, so the literal ships and the browser drops
   the declaration.

   ```tsx
   style={{ border: "1px solid token(colors.danger)" }}   // ✗ no border at all
   style={{ border: `1px solid ${token("colors.danger")}` }} // ✓ imported function
   className={css({ border: "1px solid token(colors.danger)" })} // ✓ build-time
   ```

   Rule 3 does not catch this — the path is valid, just unresolved.

5. **`fontFamily` must name one of the three site faces** — `reading` (serif prose), `ui`
   (sans chrome), `code` (mono), or `inherit`. Two ways to get this wrong, both silent:

   ```ts
   fontFamily: "monospace"; // ✗ CSS generic — bypasses the token system
   fontFamily: "mono"; // ✗ Panda's PRESET token — still valid, still the old
   //   system stack. No error anywhere.
   fontFamily: "code"; // ✓
   ```

   The preset's `sans`/`serif`/`mono` survive alongside the custom tokens, so a stale call
   site resolves to a real value and simply renders the wrong font. See
   [`website/README.md`](../../../website/README.md) → Typography.

6. **A config recipe variant passed as a variable emits only the default.** Rule 1 one level up —
   Panda resolves recipe variants statically too.
   ```tsx
   sectionRule({ territory }); // ✗ only defaultVariants gets CSS
   sectionRule({ territory: "explore" }); // ✓ literal, extractable
   ```
   The class name is still rendered, so the element gets the recipe's `base` and nothing else.
   This shipped: the territory rule was an invisible 48×3px transparent block on all six
   `territory="explore"` pages. The fix is not at the call site — list the recipe in `staticCss`:
   ```ts
   staticCss: {
     recipes: {
       sectionRule: [{ territory: ["*"] }];
     }
   }
   ```
   Only variants that _paint_ need this. A variant whose style object is empty (`active: { true: {} }`
   on the button recipe) styles via `compoundVariants`, which Panda emits as atomic utilities.
   `test/territoryRule.test.ts` asserts the CSS is really generated; rule 6 in
   `test/styleConventions.test.ts` catches the call site.

## Verifying a bulk style change

`npm run typecheck` and `npm test` cannot see a wrong colour or a dropped declaration. Diff
the _emitted declarations_ instead — build before and after, resolve `var(--…)` back to
literals, and compare. For a pure rename the set must be identical; anything else is either
an intended change or a bug, and the list should be short enough to read.

Note that Panda escapes `.`, `(`, `)` **and commas** in class names
(`.bg-c_rgba\(123\,_63\,_160\,_0\.04\)`), so a naive `grep -F` for an unescaped class reports
false misses.

## Where the general knowledge lives

This file teaches the project. General Panda questions — which primitive to use, theming,
the v1→v2 migration — go to the official skills (`npx skills add chakra-ui/panda`:
`panda-css`, `panda-css-theming`, `panda-css-migrate`) and the docs index at
<https://panda-css.com/docs>.
