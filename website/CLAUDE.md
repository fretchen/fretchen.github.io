# website — agent rules

Frontend: Vike SSR + React 19 + Panda CSS. See [`README.md`](./README.md) for the stack,
the layout, and **the design system** — colours and their jobs, the button recipe, the
scales, where styles live. Read that before adding any style. The reasoning behind the
system is in [`IDENTITY.md`](./IDENTITY.md).

The rules below are only the ways Panda fails *silently*; they are not a summary of the
system.

## Styling rules (enforced by `test/styleConventions.test.ts`)

Panda compiles `css({})` **statically at build time**. Five mistakes therefore break styling
*silently* — the component still renders, the class name is still emitted, `tsc` and the
component tests all pass, and only the CSS is wrong or missing. They have all shipped here
before. The test file catches them; these are the rules it enforces.

1. **Never pass a JS variable as a `css({})` value.** Panda cannot read it, so it emits no CSS.
   ```ts
   css({ color: ACCENT })        // ✗ silently produces nothing
   css({ color: "essayAccent" }) // ✓ token name, resolved at build time
   ```
   When a value is needed in both CSS and JS (a Chart.js dataset, an SVG `fill`, an inline
   `style={{}}`), define it once as a token in `panda.config.ts`, use the token *name* inside
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
   is named `brand` emits `color: colors.primary`.

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
   fontFamily: "monospace"   // ✗ CSS generic — bypasses the token system
   fontFamily: "mono"        // ✗ Panda's PRESET token — still valid, still the old
                             //   system stack. No error anywhere.
   fontFamily: "code"        // ✓
   ```
   The preset's `sans`/`serif`/`mono` survive alongside the custom tokens, so a stale call
   site resolves to a real value and simply renders the wrong font. See
   [`README.md`](./README.md) → Typography.

## Verifying a bulk style change

`npm run typecheck` and `npm test` cannot see a wrong colour or a dropped declaration. Diff
the *emitted declarations* instead — build before and after, resolve `var(--…)` back to
literals, and compare. For a pure rename the set must be identical; anything else is either
an intended change or a bug, and the list should be short enough to read.

Note that Panda escapes `.`, `(`, `)` **and commas** in class names
(`.bg-c_rgba\(123\,_63\,_160\,_0\.04\)`), so a naive `grep -F` for an unescaped class reports
false misses.

## Other conventions

- Run `npm run prepare` (Panda codegen) after config changes to regenerate `styled-system/` —
  never edit the generated files directly.
- Client-only components need `{ ssr: false }` in their import.
- **Wagmi v2 + TanStack Query** for blockchain state. Wagmi hooks are auto-generated from
  `wagmi.config.ts` — not manually written.
- **ABIs** come from `eth/abi/contracts/*.ts` (TypeScript `as const` exports). After contract
  changes, regenerate them in `eth/` first, then update the imports here.
