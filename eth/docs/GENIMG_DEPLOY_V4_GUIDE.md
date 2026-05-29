# GenImNFTv4 Deployment Guide

## Overview

This guide explains how to deploy GenImNFTv4 to any network using `scripts/deploy-genimg-v4.ts`.

For upgrading an existing GenImNFTv3 contract, see [GENIMG_UPGRADE_TO_V4_GUIDE.md](./GENIMG_UPGRADE_TO_V4_GUIDE.md).

## What is GenImNFTv4?

GenImNFTv4 is an upgradeable NFT contract for AI-generated images with:

- **Agent Authorization**: EIP-8004 whitelist for authorized image update services
- **Public/Private Listing**: Token owners control gallery visibility
- **UUPS Upgradeability**: Secure proxy pattern
- **CVE-2025-11-26 Fix**: Protection against unauthorized updates

## Prerequisites

```bash
# Set Hardhat variables
npx hardhat vars set ALCHEMY_API_KEY
npx hardhat vars set SEPOLIA_PRIVATE_KEY
```

## Current Deployments

| Network          | Proxy Address                                | Status |
| ---------------- | -------------------------------------------- | ------ |
| Optimism Mainnet | `0x80f95d330417a4acEfEA415FE9eE28db7A0A1Cdb` | ✅     |
| Base Mainnet     | `0xa5d6a3eEDADc3346E22dF9556dc5B99f2777ab68` | ✅     |
| Optimism Sepolia | `0x10827cC42a09D0BAD2d43134C69F0e776D853D85` | ✅     |

## Configuration

Edit `scripts/deploy-genimg-v4.config.json`:

```json
{
  "parameters": {
    "mintPrice": "0.00003",
    "agentWallet": "0xAAEBC1441323B8ad6Bdf6793A8428166b510239C"
  },
  "options": {
    "validateOnly": false,
    "dryRun": false,
    "verify": true,
    "waitConfirmations": 2
  },
  "metadata": {
    "description": "GenImNFTv4 deployment to Optimism Sepolia for testing",
    "version": "4.0.0",
    "environment": "testnet"
  }
}
### For Testnet

```json
{
  "parameters": {
    "mintPrice": "0.00003",
    "agentWallet": "0xAAEBC1441323B8ad6Bdf6793A8428166b510239C"
  },
  "options": {
    "validateOnly": false,
    "dryRun": false,
    "verify": true,
    "waitConfirmations": 2
  },
  "metadata": {
    "description": "GenImNFTv4 deployment to test network",
    "version": "4.0.0",
    "environment": "testnet"
  }
}
```

### For Mainnet

```json
{
  "parameters": {
    "mintPrice": "0.01",
    "agentWallet": "0xAAEBC1441323B8ad6Bdf6793A8428166b510239C"
  },
  "options": {
    "validateOnly": false,
    "dryRun": false,
    "verify": true,
    "waitConfirmations": 5
  },
  "metadata": {
    "description": "GenImNFTv4 production deployment",
    "version": "4.0.0",
    "environment": "mainnet"
  }
}
```

## Deployment Process

### Step 1: Fund Deployer

Ensure deployer wallet has ≥0.03 ETH:

| Network  | Minimum | Faucet                                               |
| -------- | ------- | ---------------------------------------------------- |
| Sepolia  | 0.03    | https://www.alchemy.com/faucets/optimism-sepolia     |
| Mainnet  | 0.1     | -                                                    |

### Step 2: Validate (Recommended)

```bash
# Set validateOnly: true in config
npx hardhat run scripts/deploy-genimg-v4.ts --network optsepolia
```

### Step 3: Dry Run (Recommended)

```bash
# Set dryRun: true in config
npx hardhat run scripts/deploy-genimg-v4.ts --network optsepolia
```

### Step 4: Deploy

```bash
# Set both validateOnly: false and dryRun: false
npx hardhat run scripts/deploy-genimg-v4.ts --network optimisticEthereum
```

**For Base:**

```bash
npx hardhat run scripts/deploy-genimg-v4.ts --network base
```

### Expected Output

```
🚀 GenImNFTv4 Deployment Script
============================================================
Network: optimisticEthereum

💰 Checking Deployer Balance
✅ Sufficient balance for deployment

🚀 Deploying GenImNFTv4...
✅ GenImNFTv4 deployed successfully!
============================================================
📍 Proxy Address: 0x...
📍 Implementation Address: 0x...

⚙️  Post-Deployment Configuration
✅ Mint price set to 0.01 ETH
✅ Agent wallet authorized: 0xAAEB...239C

💾 Deployment info saved to: deployments/genimg-v4-optimisticEthereum.json
```

## Post-Deployment

### 1. Verify on Block Explorer

```bash
DEPLOYMENT_FILE=deployments/genimg-v4-optimisticEthereum.json \
CONTRACT_PATH=contracts/GenImNFTv4.sol:GenImNFTv4 \
npx hardhat run scripts/verify-contract.ts --network optimisticEthereum
```

### 2. Update Frontend

Update chain-utils or frontend config with the proxy address from deployment file.

### 3. Test Minting

```bash
npx hardhat console --network optimisticEthereum
> const GenImNFT = await ethers.getContractFactory("GenImNFTv4")
> const contract = GenImNFT.attach("0xProxyAddress")
> await contract.safeMint("0xRecipient", "ipfs://...")
```

## Security Notes

### Agent Authorization

Only authorize trusted wallets. Authorized agents can call `requestImageUpdate()` and receive `mintPrice` payments.

Current agent: `0xAAEBC1441323B8ad6Bdf6793A8428166b510239C`

### Owner Key Management

⚠️ **For mainnet: Use hardware wallet or multisig** — owner can upgrade contracts and change mint price.

## Troubleshooting

| Issue                     | Solution                                           |
| ------------------------- | -------------------------------------------------- |
| "Config file not found"   | Ensure `deploy-genimg-v4.config.json` exists       |
| "Insufficient funds"      | Deployer needs ≥0.03 ETH                           |
| "Validation failed"       | Check contract compiles: `npx hardhat compile`     |
| Verification fails        | Use `verify-contract.ts` script                    |

## Related Documentation

- [GENIMG_UPGRADE_TO_V4_GUIDE.md](./GENIMG_UPGRADE_TO_V4_GUIDE.md) — Upgrade guide
- [DEPLOY_COLLECTOR_V1_GUIDE.md](./DEPLOY_COLLECTOR_V1_GUIDE.md) — CollectorNFT deployment
- [DEPLOY_SUPPORT_V2_GUIDE.md](./DEPLOY_SUPPORT_V2_GUIDE.md) — SupportV2 deployment
