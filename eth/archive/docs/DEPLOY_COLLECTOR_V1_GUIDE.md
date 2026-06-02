# CollectorNFTv1 Deployment Guide

## Overview

This guide explains how to deploy CollectorNFTv1 to any network using `scripts/deploy-collector-nft-v1.ts`. CollectorNFTv1 is an upgradeable companion NFT that:

- **Depends on GenImNFTv4**: Requires deployed GenImNFT contract
- **Dynamic Pricing**: Mint price increases with GenImNFT token count
- **UUPS Upgradeability**: Secure proxy pattern

## Prerequisites

```bash
# Set Hardhat variables
npx hardhat vars set ALCHEMY_API_KEY
npx hardhat vars set SEPOLIA_PRIVATE_KEY
```

**Important**: Deploy GenImNFTv4 first (see [GENIMG_DEPLOY_V4_GUIDE.md](./GENIMG_DEPLOY_V4_GUIDE.md)).

## Current Deployments

| Network          | Proxy Address                                | GenImNFT Address                             | Status |
| ---------------- | -------------------------------------------- | -------------------------------------------- | ------ |
| Optimism Mainnet | `0x584c40d8a7cA164933b5F90a2dC11ddCB4a924ea` | `0x80f95d330417a4acEfEA415FE9eE28db7A0A1Cdb` | ✅     |
| Base Mainnet     | TBD                                          | `0xa5d6a3eEDADc3346E22dF9556dc5B99f2777ab68` | ⬜     |

## Configuration

Edit `scripts/collector-nft-v1.config.json`:

### For Testnet

```json
{
  "parameters": {
    "genImNFTAddress": "0xYourGenImNFTProxyAddress",
    "baseMintPrice": "0.00005"
  },
  "options": {
    "validateOnly": false,
    "dryRun": false
  },
  "metadata": {
    "description": "CollectorNFTv1 deployment to test network",
    "version": "1.0.0",
    "environment": "testnet"
  }
}
```

### For Base Mainnet

```json
{
  "parameters": {
    "genImNFTAddress": "0xa5d6a3eEDADc3346E22dF9556dc5B99f2777ab68",
    "baseMintPrice": "0.00005"
  },
  "options": {
    "validateOnly": false,
    "dryRun": false
  },
  "metadata": {
    "description": "CollectorNFTv1 production deployment to Base",
    "version": "1.0.0",
    "environment": "production"
  }
}
```

## Deployment Process

### Step 1: Fund Deployer

Ensure deployer wallet has ≥0.03 ETH:

| Network | Minimum | Faucet                                           |
| ------- | ------- | ------------------------------------------------ |
| Sepolia | 0.03    | https://www.alchemy.com/faucets/optimism-sepolia |
| Mainnet | 0.1     | -                                                |

### Step 2: Validate (Recommended)

```bash
# Set validateOnly: true in config
npx hardhat run scripts/deploy-collector-nft-v1.ts --network optsepolia
```

### Step 3: Dry Run (Recommended)

```bash
# Set dryRun: true in config
npx hardhat run scripts/deploy-collector-nft-v1.ts --network optsepolia
```

### Step 4: Deploy

```bash
# Set both validateOnly: false and dryRun: false
npx hardhat run scripts/deploy-collector-nft-v1.ts --network optimisticEthereum
```

**For Base:**

```bash
npx hardhat run scripts/deploy-collector-nft-v1.ts --network base
```

### Expected Output

```
🚀 CollectorNFTv1 Deployment Script
============================================================
Network: optimisticEthereum

💰 Checking Deployer Balance
✅ Sufficient balance for deployment

🔍 Verifying GenImNFT contract...
✅ GenImNFT contract verified

🚀 Deploying CollectorNFTv1...
✅ CollectorNFTv1 deployed successfully!
============================================================
📍 Proxy Address: 0x...
📍 Implementation Address: 0x...
📍 Admin Address: 0x...

🔍 Verifying deployment...
📄 Contract Name: CollectorNFTv1
🏷️  Contract Symbol: COLLECTORv1
🔗 GenImNFT Address: 0x80f95d330417a4acEfEA415FE9eE28db7A0A1Cdb
💰 Base Mint Price: 0.00005 ETH
✅ All verifications passed!

💾 Deployment info saved to: deployments/collector-nft-v1-optimisticEthereum.json
```

## Post-Deployment

### 1. Verify on Block Explorer

```bash
DEPLOYMENT_FILE=deployments/collector-nft-v1-optimisticEthereum.json \
CONTRACT_PATH=contracts/CollectorNFTv1.sol:CollectorNFTv1 \
npx hardhat run scripts/verify-contract.ts --network optimisticEthereum
```

### 2. Update Frontend

Update chain-utils with the proxy address:

```typescript
// shared/chain-utils/src/addresses.ts
export const MAINNET_COLLECTOR_NFT_ADDRESSES: Record<string, `0x${string}`> = {
  "eip155:10": "0x584c40d8a7cA164933b5F90a2dC11ddCB4a924ea", // Optimism
  "eip155:8453": "0xYourNewBaseAddress", // Base - add after deployment
};
```

Then rebuild and republish:

```bash
cd shared/chain-utils
npm run build
npm test
```

### 3. Test Minting

```bash
npx hardhat console --network optimisticEthereum
> const CollectorNFT = await ethers.getContractFactory("CollectorNFTv1")
> const contract = CollectorNFT.attach("0xProxyAddress")
> const price = await contract.calculateMintPrice()
> await contract.mintWithGenImToken(tokenId, { value: price })
```

## How Pricing Works

CollectorNFTv1 pricing is dynamic:

```solidity
mintPrice = baseMintPrice × (1 + totalSupply)
```

Example with `baseMintPrice = 0.00005 ETH`:

- 1st mint: 0.00005 ETH
- 10th mint: 0.00055 ETH
- 100th mint: 0.00505 ETH

## Security Notes

### GenImNFT Dependency

CollectorNFTv1 validates that minters own GenImNFT tokens. The GenImNFT address is **immutable** after deployment.

⚠️ **Verify GenImNFT address carefully** — it cannot be changed.

### Owner Key Management

⚠️ **For mainnet: Use hardware wallet or multisig** — owner can upgrade contracts.

## Troubleshooting

| Issue                             | Solution                                           |
| --------------------------------- | -------------------------------------------------- |
| "Config file not found"           | Ensure `collector-nft-v1.config.json` exists       |
| "No contract at GenImNFT address" | Deploy GenImNFTv4 first, use correct proxy address |
| "Insufficient funds"              | Deployer needs ≥0.03 ETH                           |
| "Validation failed"               | Check contract compiles: `npx hardhat compile`     |

## Deployment Checklist

### Pre-Deployment

- [ ] GenImNFTv4 deployed on target network
- [ ] GenImNFT proxy address added to config
- [ ] Deployer wallet funded with ≥0.1 ETH (mainnet)
- [ ] `ALCHEMY_API_KEY` and `SEPOLIA_PRIVATE_KEY` set
- [ ] Config file updated for correct environment
- [ ] Validation passed (`validateOnly: true`)
- [ ] Dry run completed (`dryRun: true`)

### Deployment

- [ ] Deploy CollectorNFTv1
- [ ] Save deployment JSON file
- [ ] Verify contract on block explorer

### Post-Deployment

- [ ] Update chain-utils with proxy address
- [ ] Rebuild and test chain-utils
- [ ] Update dependent packages (scw_js, x402_facilitator, website)
- [ ] Test minting with GenImNFT token
- [ ] Verify dynamic pricing works

## Related Documentation

- [GENIMG_DEPLOY_V4_GUIDE.md](./GENIMG_DEPLOY_V4_GUIDE.md) — Deploy GenImNFTv4 first
- [DEPLOY_SUPPORT_V2_GUIDE.md](./DEPLOY_SUPPORT_V2_GUIDE.md) — Similar deployment pattern
- [CollectorNFTv1.sol](./contracts/CollectorNFTv1.sol) — Contract source code
- [CollectorNFTv1_Functional.ts](./test/CollectorNFTv1_Functional.ts) — Functional tests
- [CollectorNFTv1_Deployment.ts](./test/CollectorNFTv1_Deployment.ts) — Deployment script tests
