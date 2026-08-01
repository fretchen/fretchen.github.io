# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repository Overview

Monorepo for a blockchain-based AI service platform. Each subdirectory is an independent npm package — there is no root `package.json` or workspace manager.

| Directory | Purpose |
|---|---|
| `website/` | Frontend (Vike SSR + React 19 + Panda CSS) |
| `eth/` | Solidity smart contracts (Hardhat, Optimism L2) |
| `scw_js/` | Serverless backend (Scaleway Functions, AI image gen + LLM) |
| `x402_facilitator/` | EIP-3009 USDC payment facilitator (Scaleway Functions) |
| `comment_service/` | Blog comment backend (Scaleway Functions) |
| `growth-agent/` | AI growth agent cron container |
| `shared/chain-utils/` | Shared blockchain utility library (Viem peer dep) |
| `notebooks/` | Python Jupyter notebooks for analysis |

## Commands

### website/
```bash
npm run prepare      # Panda CSS codegen — required before first dev/build
npm run dev          # Vike dev server
npm run build        # Production build → build/
npm run lint         # ESLint
npm run lint:fix
npm test             # Vitest
npm run test:watch
npm run test:coverage
npm run send-webmentions
```

### eth/
```bash
npm test                                          # Hardhat + Viem tests
npm run lint
npx hardhat compile
npx hardhat run scripts/export-abi.ts             # Regenerate ABIs after contract changes
npx hardhat verify --network optimisticEthereum <ADDRESS>
npx hardhat run scripts/verify-contracts.ts --network optimisticEthereum

# Deploy / upgrade (use NETWORK env var)
NETWORK=optsepolia npx hardhat run scripts/deploy-genimg-v4.ts --network optsepolia
PROXY_ADDRESS=0x... npx hardhat run scripts/upgrade-genimg-v4.ts --network optimisticEthereum
```

### scw_js/ / x402_facilitator/ / comment_service/
```bash
npm install
npm test
npm run build
npm run lint
npm run dev:bfl      # Local Fastify server with hot reload (scw_js only)
npx serverless deploy  # Requires SCW_ACCESS_KEY + SCW_SECRET_KEY in .env
```

### shared/chain-utils/
```bash
npm run build   # Must rebuild before dependent packages pick up changes
npm test
```

### notebooks/
```bash
uv sync
uv run jupyter notebook
uv run python -m ipykernel install --user --name=merkle-tree-notebooks
```

### growth-agent/

Python cron container (managed with `uv`). Runs daily on Scaleway: generates LLM social-media drafts, and publishes approved posts to Mastodon and Bluesky. Human-in-the-loop via the website's Growth UI (`/growth`). LangGraph graph: `START -> ingest -> [insights (Monday only) ->] plan -> drafts -> publish -> END`.

```bash
cd growth-agent/
uv sync                                              # install deps
uv run pytest test/                                  # run tests
uv run python scripts/run_local.py --diagnose        # inspect current S3 state (read-only)
uv run python scripts/run_local.py --publish         # publish approved drafts
uv run python scripts/run_local.py --refill          # pipeline refill (create drafts)
uv run python scripts/run_local.py --insights        # generate LLM insights
uv run python scripts/run_local.py --analytics       # ingest analytics
uv run python scripts/run_local.py --graph           # export LangGraph as graph.png
uv run python handler.py                             # start local HTTP server on :8080
curl http://localhost:8080                           # trigger a full handler run locally
uv run python scripts/deploy.py                      # build + push + deploy (needs SCW creds)
```

LLM provider is selected via `LLM_PROVIDER` env var (`ionos` default, or `mistral`). Matching API key env var: `IONOS_API_TOKEN` or `MISTRAL_API_KEY`. Override model with `LLM_MODEL`.

## Architecture Patterns

### Smart Contracts (eth/)

All NFT contracts use **OpenZeppelin UUPS upgradeable proxy pattern** — never deploy implementation contracts directly. Deployment scripts use JSON config files with Zod validation and three execution modes: `validateOnly`, `dryRun`, and execute.

When upgrading contracts: **always append new state variables after existing ones** to maintain storage slot alignment.

Tests are split into two categories:
- **`*_Functional.ts`** — Uses Viem only. Tests contract logic (initialization, state changes, events). Manual proxy deployment via `deployContract`.
- **`*_Deployment.ts`** — Uses ethers + OpenZeppelin Upgrades Plugin. Imports and tests the actual deployment script. Tests all three modes (validateOnly, dryRun, execute) and config validation.

All deployment scripts must export their deploy function and guard execution:
```typescript
export { deployFunction, MIN_DEPLOYMENT_BALANCE, ConfigSchema };
if (require.main === module) { deployFunction().then(...) }
```

Hardhat uses **Viem not Ethers** — contract calls return `bigint`, use Viem formatters. Networks: `optimisticEthereum` (mainnet), `optsepolia` (testnet), `sepolia`. RPC via Alchemy (`ALCHEMY_API_KEY` in hardhat vars). Etherscan verification uses the V2 API (one key covers all chains including Optimism).

### Serverless (scw_js/ & x402_facilitator/)

Single Scaleway Function with **path-based routing** (`/verify`, `/settle`, `/supported`). Environment variables are split: `env:` in `serverless.yml` for public values, `secret:` configured via Scaleway Console only.

**x402 whitelist** uses OR logic: manual list OR test wallets (Sepolia only) OR NFT holder status from GenImNFTv4/LLMv1 contracts.

**EIP-712 domain name differs by network:** mainnet USDC = `"USD Coin"`, testnet = `"USDC"`. Getting this wrong silently breaks payment verification.

Image generation flow: `genimg_bfl.js` → Black Forest Labs API → S3 upload → `requestImageUpdate()` on-chain. Backend wallet must be authorized via `authorizeAgentWallet()` on GenImNFTv4.

### Frontend (website/)

**Vike SSR** with file-based routing: pages in `pages/`, renderer in `renderer/`. Client-only components need `{ ssr: false }` in imports.

**Panda CSS** — run `npm run prepare` after config changes to regenerate `styled-system/` (never edit generated files directly).

**The design system — colours and their jobs, the button recipe, the scales, where styles live —
is documented in [`website/README.md`](website/README.md). Read it before adding any style.** The
rules below are only the ways Panda fails *silently*; they are not a summary of the system.

#### Styling rules (enforced by `test/styleConventions.test.ts`)

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
   `website/README.md` → Typography.

**Verifying a bulk style change:** `npm run typecheck` and `npm test` cannot see a wrong colour
or a dropped declaration. Diff the *emitted declarations* instead — build before and after,
resolve `var(--…)` back to literals, and compare. For a pure rename the set must be identical;
anything else is either an intended change or a bug, and the list should be short enough to read.
Note that Panda escapes `.`, `(`, `)` **and commas** in class names
(`.bg-c_rgba\(123\,_63\,_160\,_0\.04\)`), so a naive `grep -F` for an unescaped class reports
false misses.

**Wagmi v2 + TanStack Query** for blockchain state. Wagmi hooks auto-generated from `wagmi.config.ts` — not manually written.

Blog posts are `.md` or `.mdx` in `website/blog/` with frontmatter (`title`, `publishing_date`, `category`, `description`, `tokenID`). MDX supports remark-math (KaTeX renders client-side) and interactive React components.

**ABIs** come from `eth/abi/contracts/*.ts` (TypeScript `as const` exports). After contract changes: regenerate with `npx hardhat run scripts/export-abi.ts`, then update the website.

### Shared Library

`shared/chain-utils/` is a local file dependency (`"file:../shared/chain-utils"` in dependents' `package.json`). Rebuild it before rebuilding dependent packages.

## Security

See [`.github/THREAT_MODEL.md`](.github/THREAT_MODEL.md) for full asset inventory, blast radius, and trust boundaries. See [`eth/SECURITY.md`](eth/SECURITY.md) for contract-level findings. Use the **`cve-triage`** skill (`.claude/skills/cve-triage/`) to evaluate open Dependabot alerts against the threat model; triage criteria are in [`.github/CVE_TRIAGE.md`](.github/CVE_TRIAGE.md).

**Key hierarchy** (highest-value first):
- `CONTRACT_OWNER_PRIVATE_KEY` (Hardhat keystore) — dedicated EOA `0x1af51D…fBB20`, controls every upgradeable contract. Never use for anything else.
- `SEPOLIA_PRIVATE_KEY` (Hardhat keystore) — deployment/script signing key `0x073f26…`. Does NOT own contracts.
- Agent wallet `0xAAEBC1…` — backend-only, whitelisted on GenImNFTv4 via `authorizeAgentWallet()`.
- Facilitator wallet — stored as Scaleway secret, receives USDC fees only.

- **CVE-2025-11-26 (GenImNFTv3):** Fixed in v4 with agent whitelist. Any code calling `requestImageUpdate()` must verify `isAuthorizedAgent()`.
- Private keys via Hardhat keystore (`npx hardhat keystore set SEPOLIA_PRIVATE_KEY`) — never commit.
- Facilitator wallet key stored as Scaleway secret, not in code.
- All serverless responses must include CORS headers (`Access-Control-Allow-Origin: *`).

## Blog Post Workflow

### Skills

Blog skills live in `.claude/skills/`:

- **`blog-planner`** — Invoked when planning or writing a new blog post. **Must create a `.plan.md` file before any MDX content is written.** Reads 2–3 existing posts before planning to calibrate style.
- **`blog-critic`** — Invoked when reviewing a draft. Read-only: outputs a `.todos.md` critique file, never edits the post itself.

### Plan-First Rule

Never write MDX before a `.plan.md` exists and the user has approved it. Plan files live at `website/blog/<post-slug>.plan.md` and must contain: target audience, core thesis, outline, interactive elements, tone/style, sources, consistency notes.

### Three Audiences

Every post targets exactly ONE of these:

| Audience | Prior Knowledge | Style | Avoid |
| --- | --- | --- | --- |
| **Academics (non-STEM)** | Educated, politically curious. No math, no game theory | Story-first, concrete examples, math in `<details>` | Jargon, formulas in main text |
| **Blockchain developers** | Solidity, EVM, DeFi | Technical depth, code snippets | Over-explaining basics |
| **Physicists / QC enthusiasts** | Strong math, QM basics | Precise language, equations welcome | Pop-science metaphors that sacrifice accuracy |

### MDX Conventions

Frontmatter fields: `title`, `publishing_date` (YYYY-MM-DD), `category` (`"blockchain"` or `"others"`), `description`, `tokenID`.

- Interactive posts may use `.tsx` instead of `.mdx` (see `prisoners_dilemma_interactive.tsx` as pattern)
- Technical depth that would interrupt flow goes in `<details>` blocks
- Math renders client-side via KaTeX — use remark-math syntax
- Import React components only when interactive elements are needed

### Writing Principles (non-STEM / political economics posts)

- Math in collapsible `<details>` blocks, never inline
- Natural language over notation (`"patience"` not `"δ"`)
- Explain concepts inline on first use — even recurring characters get a one-line intro
- Concrete example first, then generalize
- Interactive widgets use plain-language labels and results in plain language
