# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repository Overview

Monorepo for a blockchain-based AI service platform. Each subdirectory is an independent npm package — there is no root `package.json` or workspace manager.

| Directory | Purpose | Further reading |
|---|---|---|
| `website/` | Frontend (Vike SSR + React 19 + Panda CSS) | [`README`](website/README.md) · [`CLAUDE.md`](website/CLAUDE.md) |
| `eth/` | Solidity smart contracts (Hardhat, Optimism L2) | [`README`](eth/README.md) · [`CLAUDE.md`](eth/CLAUDE.md) |
| `scw_js/` | Serverless backend (Scaleway Functions, AI image gen + LLM) | [`README`](scw_js/README.md) |
| `x402_facilitator/` | EIP-3009 USDC payment facilitator (Scaleway Functions) | [`README`](x402_facilitator/README.md) |
| `comment_service/` | Blog comment backend (Scaleway Functions) | [`README`](comment_service/README.md) |
| `analytics/` | Serverless pageview counter (Scaleway Functions, S3-backed) | [`README`](analytics/README.md) |
| `growth-agent/` | AI growth agent cron container (Python, LangGraph) | [`README`](growth-agent/README.md) |
| `shared/chain-utils/` | Shared blockchain utility library (Viem peer dep) | — |
| `notebooks/` | Python Jupyter notebooks for analysis | [`README`](notebooks/README.md) |

## Commands

Each package documents its own commands in its `README.md`. Three ordering rules that are not obvious from `package.json`:

- **`website/`** — run `npm run prepare` (Panda codegen) before the first dev or build.
- **`shared/chain-utils/`** — it is a local file dependency (`"file:../shared/chain-utils"`). Run `npm run build` there before rebuilding any dependent package.
- **`eth/`** — after changing a contract, run `npx hardhat run scripts/export-abi.ts`, then update the website's ABI imports.

## Architecture Patterns

### Smart Contracts (`eth/`)

All NFT contracts use the **OpenZeppelin UUPS upgradeable proxy pattern** — never deploy implementation contracts directly. Deploy/upgrade scripts use JSON config files with Zod validation and three execution modes: `validateOnly`, `dryRun`, and execute.

Hardhat here uses **Viem, not Ethers** — contract calls return `bigint`.

Repo-specific conventions (the two test categories, the deploy-script export guard, the storage-layout rule) are in [`eth/CLAUDE.md`](eth/CLAUDE.md).

### Serverless (`scw_js/`, `x402_facilitator/`, `comment_service/`, `analytics/`)

Single Scaleway Function per package with **path-based routing** (`/verify`, `/settle`, `/supported`). Environment variables are split: `env:` in `serverless.yml` for public values, `secret:` configured via the Scaleway Console only.

Use the **`x402`** skill before writing or reviewing anything that names an x402 role — it carries
the official vocabulary, this repo's verified role map, and links to the spec. The role map is
counterintuitive and has been published wrong: `/imagegen` and `/assistent` are **buyers**
(they spend USDC), the `*-agent.fretchen.eu` Scaleway endpoints they call are the **sellers**.

Two things that silently break payments if you get them wrong, both documented in detail where they belong:

- **EIP-712 domain names differ by network** (mainnet USDC is `"USD Coin"`, testnet is `"USDC"`). Follow the checklist in [`scw_js/README.md`](scw_js/README.md) → *Adding New Networks*, which carries the verified per-network table.
- **The x402 recipient whitelist uses OR logic** across a manual list, testnet-only test wallets, and NFT-holder status. See [`x402_facilitator/README.md`](x402_facilitator/README.md) → *Whitelist Architecture*.

### Frontend (`website/`)

**Vike SSR** with file-based routing: pages in `pages/`, renderer in `renderer/`. Client-only components need `{ ssr: false }` in imports.

**Panda CSS** compiles `css({})` at build time, so several ways of writing a style fail *silently* — the component renders, the tests pass, only the CSS is missing. The rules are in [`website/CLAUDE.md`](website/CLAUDE.md), enforced by `website/test/styleConventions.test.ts`. The design system itself — colours and their jobs, the button recipe, the scales — is in [`website/README.md`](website/README.md); read it before adding any style.

**Wagmi v2 + TanStack Query** for blockchain state; hooks are auto-generated from `wagmi.config.ts`, not hand-written.

## Security

See [`.github/THREAT_MODEL.md`](.github/THREAT_MODEL.md) for the full asset inventory, blast radius, and trust boundaries, and [`eth/SECURITY.md`](eth/SECURITY.md) for contract-level findings. Use the **`cve-triage`** skill to evaluate open Dependabot alerts against the threat model; the criteria are in [`.github/CVE_TRIAGE.md`](.github/CVE_TRIAGE.md).

**Key hierarchy** (highest-value first):

- `CONTRACT_OWNER_PRIVATE_KEY` (Hardhat keystore) — dedicated EOA `0x1af51D…fBB20`, controls every upgradeable contract. Never use it for anything else.
- `SEPOLIA_PRIVATE_KEY` (Hardhat keystore) — deployment/script signing key `0x073f26…`. Does NOT own contracts.
- Agent wallet `0xAAEBC1…` — backend-only, whitelisted on GenImNFTv4 via `authorizeAgentWallet()`.
- Facilitator wallet — stored as a Scaleway secret, receives USDC fees only.

Rules that apply everywhere:

- Private keys go in the Hardhat keystore (`npx hardhat keystore set SEPOLIA_PRIVATE_KEY`) or a Scaleway secret — never in code, never committed.
- **CVE-2025-11-26 (GenImNFTv3):** fixed in v4 with an agent whitelist. Any code calling `requestImageUpdate()` must verify `isAuthorizedAgent()`.
- All serverless responses must include CORS headers (`Access-Control-Allow-Origin: *`).

## Blog Posts

Posts are `.md`/`.mdx` in `website/blog/`, with frontmatter: `title`, `publishing_date`, `category`, `description`, `tokenID`. Interactive posts import their widgets as regular React components from `website/components/blog/` — there is no `.tsx` post format.

Use the **`blog-planner`** skill to plan or write one — it enforces the plan-first rule (no MDX before an approved `website/blog/<slug>.plan.md`) and carries the audience and style conventions. Use **`blog-critic`** to review a draft; it is read-only and outputs a `.todos.md`.
