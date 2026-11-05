# website — agent rules

Frontend: Vike SSR + React 19 + Panda CSS. See [`README.md`](./README.md) for the stack,
the layout, and **the design system** — colours and their jobs, the button recipe, the
scales, where styles live. Read that before adding any style. The reasoning behind the
system is in [`IDENTITY.md`](./IDENTITY.md).

## Styling

Use the **`panda`** skill before writing or changing any style — it carries the six ways
Panda fails _silently_ in this repo (the component renders, `tsc` and the tests pass, only
the CSS is missing) and the recipe for verifying a bulk style change. The one-line summary:
never pass a JS variable as a `css({})` value, and remember that typecheck and component
tests are blind to missing CSS. `test/styleConventions.test.ts` and `test/territoryRule.test.ts`
enforce the same rules executably.

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
