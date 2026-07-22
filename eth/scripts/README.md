# Scripts

All scripts are run with `npx hardhat run scripts/<name>.ts --network <network>`.

Available networks: `optimisticEthereum`, `base`, `optsepolia` (testnet), `hardhat` (local).

Detailed usage and config options are documented in JSDoc at the top of each file.

---

## Deploy

| Script                  | Contract                              | Config file                      |
| ----------------------- | ------------------------------------- | -------------------------------- |
| `deploy-genimg-v4.ts`   | GenImNFTv4 (NFT + image generation)   | `deploy-genimg-v4.config.json`   |
| `deploy-splitter-v1.ts` | EIP3009SplitterV1 (USDC fee splitter) | `deploy-splitter-v1.config.json` |
| `deploy-support-v2.ts`  | SupportV2 (ETH donations)             | `deploy-support-v2.config.json`  |

All deploy scripts support `validateOnly` and `dryRun` modes via their config file.

## Upgrade

| Script                     | Contract                  | Config file                     |
| -------------------------- | ------------------------- | ------------------------------- |
| `upgrade-genimg-v4.ts`     | GenImNFTv4 implementation | `upgrade-genimg-v4.config.json` |

## Verify

| Script                | Purpose                            |
| --------------------- | ---------------------------------- |
| `verify-genimg-v4.ts` | Verify GenImNFTv4 on Etherscan     |
| `verify-contract.ts`  | Generic UUPS contract verification |

## Utilities

| Script                  | Purpose                                                           |
| ----------------------- | ----------------------------------------------------------------- |
| `export-abi.ts`         | Regenerate `abi/` TypeScript exports after contract changes       |
| `validate-contract.ts`  | Validate on-chain state of a deployed contract                    |
| `transfer-ownership.ts` | Transfer `owner()` of all contracts to a new EOA (safe to re-run) |
