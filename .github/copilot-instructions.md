# AI Coding Agent Instructions

## Architecture Overview

This is a monorepo for a blockchain-based AI service platform with four main components:

- **eth/**: Solidity smart contracts (Hardhat project) for NFT-based AI image generation on Optimism L2
- **scw_js/**: Serverless backend (Scaleway Functions) providing AI generation APIs with blockchain integration
- **x402_facilitator/**: EIP-3009 USDC payment facilitator for x402 v2 protocol on Optimism
- **website/**: Frontend (Vite + Vike SSR) for interacting with services
- **notebooks/**: Python Jupyter notebooks for analysis and prototyping

## Critical Architecture Patterns

### Smart Contract Upgrade System (eth/)

Contracts use **OpenZeppelin UUPS proxy pattern** with versioned reinitializers. Never deploy implementation contracts directly - always use proxies.

**GenImNFTv4 Deployment/Upgrade Workflow:**
```bash
# Deploy new (scripts/deploy-genimg-v4.ts)
NETWORK=optsepolia npx hardhat run scripts/deploy-genimg-v4.ts --network optsepolia

# Upgrade existing (scripts/upgrade-genimg-v4.ts)
PROXY_ADDRESS=0x... npx hardhat run scripts/upgrade-genimg-v4.ts --network optimisticEthereum
```

**Config-driven deployment:** All deployment scripts use JSON config files (`*.config.json`) with Zod validation and three execution modes:
- `validateOnly: true` - Validate config without execution
- `dryRun: true` - Simulate deployment with logs (no transactions)
- Both false - Execute deployment

**Storage layout compatibility:** When adding new state variables to upgraded contracts, ALWAYS append them after existing variables to maintain storage slot alignment. See [GenImNFTv4.sol](eth/contracts/GenImNFTv4.sol#L39) `_whitelistedAgentWallets` placement.

**Key upgrade guides:** [GENIMG_DEPLOY_V4_GUIDE.md](eth/GENIMG_DEPLOY_V4_GUIDE.md), [GENIMG_UPGRADE_TO_V4_GUIDE.md](eth/GENIMG_UPGRADE_TO_V4_GUIDE.md)

### Serverless Architecture (scw_js/ & x402_facilitator/)

Both use **Scaleway Functions** with `serverless.yml` configuration. Environment variables split into `env:` (public) and `secret:` (private via Scaleway Console).

**Deployment:**
```bash
cd scw_js/  # or x402_facilitator/
npm install
npx serverless deploy  # Requires SCW_ACCESS_KEY, SCW_SECRET_KEY in .env
```

**x402 Facilitator uses path-based routing** in a single function: `/verify`, `/settle`, `/supported` - see [x402_facilitator.js](x402_facilitator/x402_facilitator.js)

**Agent Whitelist Pattern:** Multi-source OR logic checks manual whitelist, test wallets (Sepolia only), and NFT holder status from GenImNFTv4/LLMv1 contracts. See [x402_whitelist.js](x402_facilitator/x402_whitelist.js) and [README](x402_facilitator/README.md#whitelist-architecture).

### Testing Standards

- **Hardhat tests:** `npx hardhat test` (uses Viem, not Ethers)
- **Serverless tests:** Vitest with `NODE_ENV=test` - `npm test` or `npm run test:coverage`
- **Website tests:** Vitest + Testing Library - `npm test`

All test files use `.test.js` or `.test.ts` extensions. Coverage reports generate in `coverage/`.

### Smart Contract Test Structure (eth/)

Tests are split into two categories with distinct purposes:

**`*_Functional.ts` - Contract Logic Tests:**
- Uses **Viem only** (no ethers, no OpenZeppelin Upgrades Plugin)
- Manual proxy deployment via Viem's `deployContract` with compiled artifacts
- Tests contract functionality: initialization, state changes, access control, events
- Example: [SupportV2_Functional.ts](eth/test/SupportV2_Functional.ts), [EIP3009SplitterV1_Functional.test.ts](eth/test/EIP3009SplitterV1_Functional.test.ts)

**`*_Deployment.ts` - Deployment Script Tests:**
- Uses **ethers + OpenZeppelin Upgrades Plugin**
- **Must import and test the actual deployment script** (e.g., `import { deploySupportV2 } from "../scripts/deploy-support-v2"`)
- Uses `createTempConfig()` helper to create test config files
- Uses `withTempConfig()` wrapper to backup/restore original config
- Tests all script modes: `validateOnly`, `dryRun`, and real deployment
- Tests config validation, balance checks, deployment file persistence
- Example: [SupportV2_Deployment.ts](eth/test/SupportV2_Deployment.ts), [EIP3009SplitterV1_Deployment.test.ts](eth/test/EIP3009SplitterV1_Deployment.test.ts)

**Deployment script requirements for testing:**
```typescript
// At end of deploy script, export function and guard execution:
export { deployFunction, MIN_DEPLOYMENT_BALANCE, ConfigSchema };

if (require.main === module) {
  deployFunction()
    .then(() => process.exit(0))
    .catch((error) => { console.error(error); process.exit(1); });
}
```

**Why this separation:**
- Functional tests are fast, isolated, and test contract behavior
- Deployment tests ensure the actual script works with config validation, balance checks, and file persistence
- Deployment tests catch issues like missing config fields, invalid addresses, or insufficient funds before real deployments

## Essential Development Workflows

### Linting & Formatting

All projects use **ESLint v9+ flat config** (`eslint.config.js/cjs`) and require running `npm run lint` or `npx eslint .` before commits:

```bash
# eth/ uses TypeScript ESLint
cd eth/ && npx eslint .

# scw_js/ uses ESLint with Vitest plugin
cd scw_js/ && npm run lint

# x402_facilitator/ similar pattern
cd x402_facilitator/ && npm run lint
```

### Smart Contract ABI Export

After contract changes, regenerate ABIs for frontend integration:
```bash
cd eth/
npx hardhat run scripts/export-abi.ts
# Outputs to abi/contracts/*.json and abi/contracts/*.ts
```

### Network Configuration

- **Optimism Mainnet:** Production deployments for GenImNFTv4 (`0x80f95d330417a4acEfEA415FE9eE28db7A0A1Cdb`)
- **Optimism Sepolia:** Testing deployments
- RPC URLs in [hardhat.config.ts](eth/hardhat.config.ts) use Alchemy with `ALCHEMY_API_KEY` from `hardhat/vars`

### Etherscan Verification

Uses **Etherscan V2 API** (single API key for all chains including Optimism):
```bash
npx hardhat verify --network optimisticEthereum <ADDRESS>
# Or use verify-contracts.ts script with deployment files
```

## Project-Specific Conventions

### Smart Contracts (eth/)

- **Never write pure Solidity NFT contracts** - all NFTs are upgradeable via UUPS pattern
- **Agent authorization (EIP-8004):** GenImNFTv4 uses whitelist pattern for `requestImageUpdate()` - prevents CVE-2025-11-26 exploit
- **mintPrice is in wei** - stored as `uint256`, displayed as ETH in frontend (convert via Viem `parseEther`/`formatEther`)
- **Listing system:** Tokens have `_isListed` mapping for public gallery visibility (opt-out system)

### Serverless Functions (scw_js/)

- **Wallet authentication:** `sc_llm.js` requires EIP-191 signature + minimum 0.00001 ETH balance
- **Image generation flow:** `genimg_bfl.js` → Black Forest Labs API → S3 upload → `requestImageUpdate()` on-chain
- **Response format:** Always include CORS headers (`Access-Control-Allow-Origin: *`)
- **Viem for blockchain interaction** - not web3.js or ethers

### Frontend (website/)

- **Vike SSR framework** - pages in `pages/`, renderer in `renderer/`
- **Panda CSS** for styling - run `npm run prepare` after config changes to generate styled-system/
- **MDX blog posts** - configured with remark-math for LaTeX (client-side KaTeX rendering)
- **Wagmi v2 + TanStack Query** for blockchain state management
- **Build:** `npm run build` → `build/` directory (then run `postbuild` scripts for sitemap)

### Blog Posts: Political Economics

When writing or editing blog posts about political economics, game theory, or related topics, follow these guidelines:

**Target Reader Profile:**
- Akademiker (educated, but not necessarily in STEM)
- Politically curious, follows current events
- Does NOT know game theory concepts (Prisoner's Dilemma, Nash equilibrium)
- Does NOT know EU institutions in detail
- Weak at math — formulas are barriers, not features
- Impatient reader — will skim, needs hooks
- First time meeting recurring characters (e.g., Sofia)

**Writing Principles:**
1. **Math is supporting, not blocking** — formulas go in collapsible `<details>` boxes or postscripts
2. **Natural language over notation** — use "patience" not "δ", "political security" not "p"
3. **Explain concepts inline** — when introducing Prisoner's Dilemma, explain it in dialogue
4. **Characters need fresh introductions** — even recurring characters get a one-line intro
5. **Concrete before abstract** — start with story/example, then generalize
6. **Interactive widgets should be simple** — sliders with natural labels, results in plain language
7. **Technical details for interested readers** — use `<details>` with "🔬 Technical details" summary

**Narrative Structure:**
- Hook with concrete scenario (not abstract question)
- Build to key insight through character dialogue
- Widget/interactive element at moment of understanding
- Practical implications ("What would help?")
- Postscript for formal model (optional, for math readers)


### Python Notebooks (notebooks/)

- **Poetry for dependency management** - `poetry install`, `poetry shell`, `poetry run jupyter notebook`
- **pyproject.toml** defines dependencies, not requirements.txt
- Install kernel for VSCode: `poetry run python -m ipykernel install --user --name=merkle-tree-notebooks`

## Integration Points

### Smart Contract ↔ Backend
- Backend wallet must be **authorized agent** via `authorizeAgentWallet()` on GenImNFTv4
- Current authorized agent: `0xAAEBC1441323B8ad6Bdf6793A8428166b510239C`

### Backend ↔ x402 Facilitator
- x402 facilitator validates payments for `genimg_x402_token.js` function
- Uses EIP-3009 `transferWithAuthorization` for USDC on Optimism
- Recipient must be whitelisted (NFT holder or manual whitelist)

### Frontend ↔ Smart Contracts
- Uses ABIs from `eth/abi/contracts/*.ts` (TypeScript exports with `as const`)
- Wagmi hooks auto-generated from `wagmi.config.ts` (not manually written)

## Non-Obvious Commands

```bash
# Smart contract validation without deployment
cd eth/ && PROXY_ADDRESS=0x... npx hardhat run scripts/validate-contract.ts --network optimisticEthereum

# Local serverless testing with hot reload
cd scw_js/ && npm run dev:bfl  # Starts local Fastify server

# Export contract ABIs after changes
cd eth/ && npx hardhat run scripts/export-abi.ts

# Verify contracts post-upgrade
cd eth/ && npx hardhat run scripts/verify-contracts.ts --network optimisticEthereum

# Send webmentions from blog posts
cd website/ && npm run send-webmentions
```

## Security Considerations

- **CVE-2025-11-26 (GenImNFTv3):** Fixed in v4 with agent whitelist - any code calling `requestImageUpdate()` must check `isAuthorizedAgent()`
- **Private keys via Hardhat vars:** Use `npx hardhat vars set SEPOLIA_PRIVATE_KEY` - never commit to repo
- **Facilitator wallet:** `FACILITATOR_WALLET_PRIVATE_KEY` stored as Scaleway secret
- **Test wallets hardcoded** in [x402_whitelist.js](x402_facilitator/x402_whitelist.js) - Sepolia only, safe for production

## Common Gotchas

- **Hardhat uses Viem not Ethers** - contract calls return bigint, use Viem formatters
- **ESLint v9+ flat config** - old `.eslintrc.json` patterns don't work
- **Panda CSS requires codegen** - run `npm run prepare` before first dev/build
- **Scaleway serverless.yml patterns** - secrets must be set via Console, not in YAML
- **Vike SSR** - client-only components need `{ ssr: false }` in imports
