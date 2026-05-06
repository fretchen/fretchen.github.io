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
poetry install
poetry shell
poetry run jupyter notebook
poetry run python -m ipykernel install --user --name=merkle-tree-notebooks
```

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

**Wagmi v2 + TanStack Query** for blockchain state. Wagmi hooks auto-generated from `wagmi.config.ts` — not manually written.

Blog posts are `.md` or `.mdx` in `website/blog/` with frontmatter (`title`, `publishing_date`, `category`, `description`, `tokenID`). MDX supports remark-math (KaTeX renders client-side) and interactive React components.

**ABIs** come from `eth/abi/contracts/*.ts` (TypeScript `as const` exports). After contract changes: regenerate with `npx hardhat run scripts/export-abi.ts`, then update the website.

### Shared Library

`shared/chain-utils/` is a local file dependency (`"file:../shared/chain-utils"` in dependents' `package.json`). Rebuild it before rebuilding dependent packages.

## Security

- **CVE-2025-11-26 (GenImNFTv3):** Fixed in v4 with agent whitelist. Any code calling `requestImageUpdate()` must verify `isAuthorizedAgent()`.
- Private keys via Hardhat vars (`npx hardhat vars set SEPOLIA_PRIVATE_KEY`) — never commit.
- Facilitator wallet key stored as Scaleway secret, not in code.
- All serverless responses must include CORS headers (`Access-Control-Allow-Origin: *`).

## Blog Post Workflow

### Agents

Two custom agents live in `.github/agents/`:

- **`blog-planner.agent.md`** — Invoked when planning or writing a new blog post. **Must create a `.plan.md` file before any MDX content is written.** Reads 2–3 existing posts before planning to calibrate style.
- **`blog-critic.agent.md`** — Invoked when reviewing a draft. Read-only: outputs a `.todos.md` critique file, never edits the post itself.

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
