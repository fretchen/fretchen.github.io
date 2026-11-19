# The chain-utils viem instance split — and what TS 6 changed

**For:** anyone bumping `typescript` in a package that consumes `@fretchen/chain-utils`, or
bumping `viem` anywhere. The constraint bit in PR #792 (CI log, 2026-11-19), and the diagnosis
was initially misattributed to viem version drift — the experiments that isolated it are
summarized last.

## The setup

Each npm package in this repo is independent — no workspace, no root `node_modules`.
`@fretchen/chain-utils` is installed as a `file:` dep, so its consumers see it as a symlink to
`shared/chain-utils`, whose `dist/*.d.ts` resolve `import("viem")` against **its own**
`shared/chain-utils/node_modules/viem`. The consumer package (scw_js, analytics, …) has its own
`node_modules/viem`. There are therefore always **two copies of the viem types in every
compile** that crosses the boundary, even when the manifest/lock versions are identical.
This is also why `test-viem-alignment.yml` pins all five lockfiles to one viem version.

## What TS 6 changed

TypeScript 5.9 structurally compared the two copies' `Chain` types and accepted them.
TypeScript 6.0 does not — it refuses the crossing outright:

```
error TS2322: Type 'Chain' is not assignable to type 'Chain | undefined'.
  Type '…/shared/chain-utils/node_modules/viem/…/chain'.Chain' is not assignable to
  type '…/scw_js/node_modules/viem/…/chain'.Chain'.
```

Verified on a clean checkout of main with **only** the compiler swapped
(`npm i --no-save typescript@6.0.3`): six errors in scw_js, four of them this class
(`llm_x402_cron.ts`, `x402_channel_sync.ts`, `scripts/fee_allowances.ts` ×2), all of them
independent of the viem version (reproduces identically at viem 2.57.4 and 2.57.20 twins).
The remaining two errors were the rootDir enforcement, a second TS 6 change:

```
error TS6059: File '…/observability/alertCoverage.ts' is not under 'rootDir' '…/scw_js'.
```

TS 6 also started inferring `rootDir` from `include` and enforcing that every input file sits
under it — `test/alert_coverage.test.ts` imports `../../observability/alertCoverage.ts`,
outside the package. (`rootDirs` does **not** silence this under TS 6; an explicit
`"rootDir": ".."` does.)

## The current fixes (both in scw_js on the ts6 branch)

1. **Pin the viem instance at the boundary** — cast `getViemChain(...)` to the consumer's own
   `Chain` type where a chain-utils-produced chain enters a viem client
   (`import { type Chain } from "viem"`, `getViemChain(network) as Chain`). These casts are
   checked: with them, TS 6 compiles scw_js cleanly at both viem 2.57.4 and 2.57.20, tests
   included. Any *new* code that passes a chain-utils viem object into this package's viem
   (or vice versa) will need the same cast — this file is why.
2. **`"rootDir": ".."` in `scw_js/tsconfig.json`** for the imported `observability/alertCoverage.ts`.

## What still needs solving in a future PR

The casts are local damage control; the real debt is the instance split itself. Pick one and
do it as its own PR:

- **Single viem instance for type-checking. Have consumers import the viem surface from
  `@fretchen/chain-utils`** (re-export `createPublicClient`, `http`, `Chain`, …), and drop
  their own direct `viem` dep — *every type position* then resolves through chain-utils' copy.
  Watch out: `@x402/*` and `wagmi`/`viem`-peers still pull a hoisted copy for *their* emitted
  types, so verify no call site mixes both instances again before deleting the casts.
- **Or move `getViemChain`'s return type out of the tangle:** make chain-utils export chain
  descriptors only (id, rpcUrls, name…) and build the `viem.Chain` in the consumer. Bigger
  API change, but it removes the ambiguity entirely.

Until then: `typescript` bumps in chain-utils-consuming packages need the casts verified;
`viem` bumps need version alignment (all five lockfiles) **plus** the casts re-verified
against the new viem's type surface — TS 6's cross-instance comparison may bail at shapes
that cast only by luck today.

## Diagnosis history (so nobody re-runs it)

1. PR #792's `test-scw-js` failed with the errors above; the PR also bumped viem to 2.57.20
   in scw_js/website → looked like version drift.
2. A merge-base worktree with viem **twins at 2.57.20/2.58.1** still failed → blamed viem's
   new `Chain` members for a while. The inconvenient detail: those runs trusted `npx -y -p
   typescript@5.9.3 tsc` to run TS 5.9.3 — it runs the local `node_modules` tsc (6.0.3),
   so every "5.9 also fails" data point was actually 6.0.3.
3. A fresh main checkout, baseline `node_modules/.bin/tsc` (5.9.3): green; same tree with
   only `typescript@6.0.3` swapped in: the six errors. TypeScript 6 is the one sufficient
   trigger. viem version is irrelevant to *this* failure class.
4. scw_js with casts + `rootDir` on TS 6: green at 2.57.4 and 2.57.20 (full `npm run check`).
