# eth — Smart Contracts

Solidity contracts for a blockchain-based AI image generation platform on Optimism. All contracts use the **OpenZeppelin UUPS upgradeable proxy pattern**.

## Active Contracts

| Contract            | Address (Optimism Mainnet)                   | Purpose                                                          |
| ------------------- | -------------------------------------------- | ---------------------------------------------------------------- |
| `GenImNFTv4`        | `0x80f95d330417a4acEfEA415FE9eE28db7A0A1Cdb` | AI image NFTs with agent-whitelist security fix (CVE-2025-11-26) |
| `CollectorNFTv1`    | `0x584c40d8a7cA164933b5F90a2dC11ddCB4a924ea` | Community NFTs minted on top of GenImNFT tokens                  |
| `EIP3009SplitterV1` | testnet only                                 | Token-agnostic USDC/EURC payment splitter                        |

## Common Commands

```shell
npm test                                  # Hardhat + Viem tests
npx hardhat compile
npx hardhat run scripts/export-abi.ts     # Regenerate ABIs after contract changes
```

## Deployment Pattern

All deploy/upgrade scripts use a JSON config file validated with Zod and support three execution modes:

```shell
# 1. Validate config and upgrade compatibility — no on-chain changes
NETWORK=optsepolia npx hardhat run scripts/deploy-genimg-v4.ts --network optsepolia

# Edit the config's "validateOnly": false, then dry-run:
# 2. Simulate — logs what would happen, no transactions
# 3. Execute — full deployment
```

Config files live alongside each script (`scripts/*.config.json`). Deployment records are saved to `scripts/deployments/`.

## Scripts

### Deploy

```shell
# GenImNFTv4 (fresh deployment, rarely needed — use upgrade instead)
NETWORK=optsepolia npx hardhat run scripts/deploy-genimg-v4.ts --network optsepolia

# EIP3009SplitterV1
npx hardhat run scripts/deploy-splitter-v1.ts --network optimisticEthereum

# SupportV2
npx hardhat run scripts/deploy-support-v2.ts --network optimisticEthereum
```

### Upgrade

```shell
# Upgrade GenImNFTv4 implementation (set PROXY_ADDRESS in config first)
PROXY_ADDRESS=0x80f95d330417a4acEfEA415FE9eE28db7A0A1Cdb \
  npx hardhat run scripts/upgrade-genimg-v4.ts --network optimisticEthereum
```

### Verify & ABI

```shell
# Verify on Etherscan (V2 API — one key covers all chains including Optimism)
npx hardhat run scripts/verify-genimg-v4.ts --network optimisticEthereum
npx hardhat run scripts/verify-llm.ts --network optimisticEthereum
npx hardhat run scripts/verify-contract.ts --network optimisticEthereum

# Validate upgrade storage compatibility without deploying
npx hardhat run scripts/validate-contract.ts --network optimisticEthereum

# Export ABIs for frontend (TypeScript + JSON)
npx hardhat run scripts/export-abi.ts
```

## Networks

| Name                 | Chain            | Use             |
| -------------------- | ---------------- | --------------- |
| `sepolia`            | Ethereum Sepolia | General testnet |
| `optsepolia`         | Optimism Sepolia | Primary testnet |
| `optimisticEthereum` | Optimism Mainnet | Production      |
| `baseSepolia`        | Base Sepolia     | Testnet         |
| `base`               | Base Mainnet     | Production      |

## Secrets (Hardhat vars)

```shell
npx hardhat vars set ALCHEMY_API_KEY
npx hardhat vars set SEPOLIA_PRIVATE_KEY   # used for all networks
npx hardhat vars set ETHERSCAN_API_KEY     # V2 API — single key covers all chains
```

Never commit private keys. Use `hardhat vars` — not `.env`.

## Per-Contract Guides

Step-by-step deployment and upgrade instructions for each contract are in [`docs/`](docs/):

- [`GENIMG_DEPLOY_V4_GUIDE.md`](docs/GENIMG_DEPLOY_V4_GUIDE.md) — deploy or upgrade GenImNFTv4
- [`GENIMG_UPGRADE_TO_V4_GUIDE.md`](docs/GENIMG_UPGRADE_TO_V4_GUIDE.md) — v3→v4 upgrade (CVE-2025-11-26 fix)
- [`DEPLOY_SUPPORT_V2_GUIDE.md`](docs/DEPLOY_SUPPORT_V2_GUIDE.md)
- [`DEPLOY_EIP3009_SPLITTER_V1_GUIDE.md`](docs/DEPLOY_EIP3009_SPLITTER_V1_GUIDE.md)

## Archive

Historical contracts, tests, scripts, and deployment guides are in `archive/`. Active upgrade-path references (GenImNFTv3 source, v4 upgrade guide) remain in `contracts/` and `docs/` respectively.
