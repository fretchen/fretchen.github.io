# website — agent rules

Frontend: Vike SSR + React 19 + Panda CSS. See [`README.md`](./README.md) for the stack,
the layout, and **the design system** — colours and their jobs, the button recipe, the
scales, where styles live. Read that before adding any style. The reasoning behind the
system is in [`IDENTITY.md`](./IDENTITY.md).

The rules below are only the ways Panda fails _silently_; they are not a summary of the
system.

## Styling rules (enforced by `test/styleConventions.test.ts`)

Panda compiles `css({})` and recipe variants **statically at build time**. Six mistakes therefore
break styling _silently_ — the component still renders, the class name is still emitted, `tsc` and
the component tests all pass, and only the CSS is wrong or missing. They have all shipped here
before. The test file catches them; these are the rules it enforces.

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
   fontFamily: "monospace"; // ✗ CSS generic — bypasses the token system
   fontFamily: "mono"; // ✗ Panda's PRESET token — still valid, still the old
   //   system stack. No error anywhere.
   fontFamily: "code"; // ✓
   ```

   The preset's `sans`/`serif`/`mono` survive alongside the custom tokens, so a stale call
   site resolves to a real value and simply renders the wrong font. See
   [`README.md`](./README.md) → Typography.

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

## Other conventions

- Run `npm run prepare` (Panda codegen) after config changes to regenerate `styled-system/` —
  never edit the generated files directly.
- Client-only components need `{ ssr: false }` in their import.
- **Wagmi v2 + TanStack Query** for blockchain state. Wagmi hooks are auto-generated from
  `wagmi.config.ts` — not manually written.
- Use the **`chat-tools`** skill before adding or changing an assistant tool — it carries the
  two-part contract (`TOOL_REGISTRY` + a runner), why `tools/*.ts` stay React-free, and the
  backend caps that turn an over-budget `tools` array into a 400.
- **ABIs** come from `eth/abi/contracts/*.ts` (TypeScript `as const` exports). After contract
  changes, regenerate them in `eth/` first, then update the imports here.

## Blog posts

Posts are `.md`/`.mdx` in `blog/`, with frontmatter: `title`, `publishing_date`, `category`,
`description`, `tokenID`, and `network` (the CAIP-2 chain the token lives on — omit for the
legacy default `eip155:10`; a Base token must declare `eip155:8453`, because both GenImNFT
mainnets have independent id sequences and an invalid value fails the build). Interactive posts
import their widgets as regular React components from `components/blog/` — there is no `.tsx`
post format.

Use the **`blog-planner`** skill to plan or write one — it enforces the plan-first rule (no MDX
before an approved `blog/<slug>.plan.md`) and carries the audience and style conventions. Use
**`blog-critic`** to review a draft; it is read-only and outputs a `.todos.md`.

### Prose: no manufactured suspense

State a claim where it arises. Never order sentences so they build to a reveal — the suspense is
fake, because the sentence already knows what it is withholding. Four constructions are banned:

- **Concede-then-swing** — "X is the benchmark, and it works. But…", "So a good outcome exists.
  But…". Put the limitation in the same sentence as the claim: "The planner reaches the right
  fleet, but has to know how fast the fish breed."
- **Forward promise** — "the two ends of that bracket everything below", "this point is worth
  detailing further", "more on that later". Say it here or cut it.
- **Meta-announcement** — "That is enough to state the tragedy", "Now for the interesting part".
  Delete the sentence; the next one is the content.
- **Withheld reveal** — "a third possibility, from an odd direction", "That is the point", or a
  heading with an appended promise ("The circuit, and what it implements"). Name the thing in
  the sentence that raises it; a heading names its subject and stops.

Test: read each paragraph's first sentence on its own. If it announces that something is coming
rather than saying something, rewrite it. This applies to figure captions too.
