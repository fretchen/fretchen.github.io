# SupportV2 Deployment Guide

## Overview

This guide explains how to deploy the SupportV2 contract to Optimism and Base mainnets using the deployment script at `scripts/deploy-support-v2.ts`. SupportV2 is an upgradeable donation contract that:

- Accepts **ETH donations** with URL-based like counting
- Uses **UUPS proxy pattern** for future upgradeability
- Works **cross-chain** (Optimism + Base)

> **Note:** The contract includes `donateToken()` for EIP-3009 token donations, but this is not currently used in the frontend.

## What is SupportV2?

SupportV2 is an evolution of the original Support contract with these key changes:

| Feature              | Support (v1)  | SupportV2                |
| -------------------- | ------------- | ------------------------ |
| `donate()` signature | `donate(url)` | `donate(url, recipient)` |

| Upgradeability | None | UUPS proxy |
| Multi-chain | Single chain | Optimism + Base |

### Key Functions

```solidity
// ETH Donation - recipient receives ETH directly
function donate(string calldata _url, address _recipient) external payable;

// Get like count for URL
function getLikesForUrl(string calldata _url) external view returns (uint256);
```

## Prerequisites

- Node.js 18+ and npm installed
- Hardhat configured with your network settings
- Access to deployer wallet with sufficient funds
- OpenZeppelin Hardhat Upgrades Plugin (`@openzeppelin/hardhat-upgrades`)
- Zod for config validation (`zod`)

### Required Hardhat Variables

Set these before deployment:

```bash
# Set private key (will prompt for input)
npx hardhat vars set SEPOLIA_PRIVATE_KEY

# Set Alchemy API key
npx hardhat vars set ALCHEMY_API_KEY
```

## Network Configuration

Ensure all target networks are configured in `hardhat.config.ts`:

```typescript
networks: {
  // Testnets
  optsepolia: {
    url: `https://opt-sepolia.g.alchemy.com/v2/${ALCHEMY_API_KEY}`,
    accounts: [SEPOLIA_PRIVATE_KEY],
  },
  baseSepolia: {
    url: `https://base-sepolia.g.alchemy.com/v2/${ALCHEMY_API_KEY}`,
    accounts: [SEPOLIA_PRIVATE_KEY],
  },
  // Mainnets
  optimisticEthereum: {
    url: `https://opt-mainnet.g.alchemy.com/v2/${ALCHEMY_API_KEY}`,
    accounts: [SEPOLIA_PRIVATE_KEY],
  },
  base: {
    url: `https://base-mainnet.g.alchemy.com/v2/${ALCHEMY_API_KEY}`,
    accounts: [SEPOLIA_PRIVATE_KEY],
  },
}
```

## Current Deployment Status

### Testnets ✅

| Network          | Proxy Address                                | Implementation | Verified |
| ---------------- | -------------------------------------------- | -------------- | -------- |
| Optimism Sepolia | `0x9859431b682e861b19e87Db14a04944BC747AB6d` | -              | ✅       |
| Base Sepolia     | `0xaB44BE78499721b593a0f4BE2099b246e9C53B57` | -              | ✅       |

### Mainnets ✅

| Network  | Proxy Address                                | Implementation                               | Verified |
| -------- | -------------------------------------------- | -------------------------------------------- | -------- |
| Optimism | `0x4ca63f8A4Cd56287E854f53E18ca482D74391316` | `0x011881999565F10aB2C62912878050Fb5deC10ac` | ✅       |
| Base     | `0xB70EA4d714Fed01ce20E93F9033008BadA1c8694` | `0x314B07fBd33A7343479e99E6682D5Ee1da7F17c1` | ✅       |

## Configuration File

Edit `scripts/deploy-support-v2.config.json`:

### For Testnet

```json
{
  "parameters": {
    "owner": ""
  },
  "options": {
    "validateOnly": false,
    "dryRun": false
  },
  "metadata": {
    "description": "SupportV2 deployment to Optimism Sepolia",
    "version": "1.0.0",
    "environment": "testnet"
  }
}
```

### For Mainnet (Recommended Settings)

```json
{
  "parameters": {
    "owner": "0x073f26F0C3FC100e7b075C3DC3cDE0A777497D20"
  },
  "options": {
    "validateOnly": false,
    "dryRun": false
  },
  "metadata": {
    "description": "SupportV2 production deployment to Optimism Mainnet",
    "version": "1.0.0",
    "environment": "mainnet"
  }
}
```

    "environment": "mainnet"

}
}

````

### Configuration Options

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `parameters.owner` | string | No | Contract owner address. Defaults to deployer if empty. |
| `options.validateOnly` | boolean | Yes | Only validate contract, don't deploy |
| `options.dryRun` | boolean | Yes | Simulate deployment without executing |
| `metadata.description` | string | Yes | Deployment description |
| `metadata.version` | string | Yes | Version identifier |
| `metadata.environment` | string | Yes | Environment (testnet/mainnet) |

## Deployment Process

### Step 1: Fund Deployer Wallet

Ensure the deployer wallet has sufficient ETH:

| Network | Minimum ETH | Recommended |
|---------|-------------|-------------|
| Optimism Sepolia | 0.03 ETH | 0.05 ETH |
| Base Sepolia | 0.03 ETH | 0.05 ETH |
| Optimism Mainnet | 0.03 ETH | 0.1 ETH |
| Base Mainnet | 0.03 ETH | 0.1 ETH |

**Faucets (Testnets):**
- Optimism Sepolia: https://www.alchemy.com/faucets/optimism-sepolia
- Base Sepolia: https://www.alchemy.com/faucets/base-sepolia

### Step 2: Validate Contract (Recommended)

```bash
cd eth

# Edit config: set validateOnly: true
npx hardhat run scripts/deploy-support-v2.ts --network optimisticEthereum
````

**What happens:**

- ✅ Validates contract compiles successfully
- ✅ Checks OpenZeppelin upgrade patterns
- ✅ Verifies UUPS proxy compatibility
- ✅ Checks deployer balance (minimum 0.03 ETH)
- ⚠️ **Does NOT deploy**

### Step 3: Dry Run (Recommended)

```bash
# Edit config: set dryRun: true
npx hardhat run scripts/deploy-support-v2.ts --network optimisticEthereum
```

**What happens:**

- ✅ Shows deployment parameters
- ✅ Validates configuration
- ✅ Simulates deployment flow
- ⚠️ **Does NOT deploy**

### Step 4: Deploy

```bash
# Edit config: set both validateOnly: false and dryRun: false
npx hardhat run scripts/deploy-support-v2.ts --network optimisticEthereum
```

**For Base Mainnet:**

```bash
npx hardhat run scripts/deploy-support-v2.ts --network base
```

### Expected Output

```
🚀 SupportV2 Deployment Script
============================================================
Network: optimisticEthereum
Block: 12345678

📄 Loading configuration from: /path/to/deploy-support-v2.config.json
✅ Configuration loaded and validated

👤 Deployer: 0x073f26F0C3FC100e7b075C3DC3cDE0A777497D20
👑 Owner: 0x073f26F0C3FC100e7b075C3DC3cDE0A777497D20

💰 Checking Deployer Balance
----------------------------------------
💰 Deployer Balance: 0.15 ETH
📊 Minimum Required: 0.03 ETH
✅ Sufficient balance for deployment

📦 Getting SupportV2 contract factory...

🔍 Pre-Deployment Validation
----------------------------------------
✅ OpenZeppelin upgrade validation passed

🚀 Deploying SupportV2...
✅ SupportV2 deployed successfully!
============================================================
📍 Proxy Address: 0x...
📍 Implementation Address: 0x...

📄 Deployment info saved to: deployments/support-v2-optimisticEthereum.json

🎉 Deployment complete!
```

## Post-Deployment Steps

### 1. Save Deployment Info

The deployment saves to `deployments/support-v2-{network}.json`:

```json
{
  "network": "optimisticEthereum",
  "proxyAddress": "0x...",
  "implementationAddress": "0x...",
  "owner": "0x073f26F0C3FC100e7b075C3DC3cDE0A777497D20",
  "deployedAt": "2026-01-24T...",
  "version": "1.0.0"
}
```

**⚠️ Save the `proxyAddress`** — this is the address users interact with.

### 2. Verify on Block Explorer

Use the generic `verify-contract.ts` script for robust verification with multiple fallback strategies:

```bash
# Optimism Mainnet
DEPLOYMENT_FILE=deployments/support-v2-optimisticEthereum.json \
CONTRACT_PATH=contracts/SupportV2.sol:SupportV2 \
npx hardhat run scripts/verify-contract.ts --network optimisticEthereum

# Base Mainnet
DEPLOYMENT_FILE=deployments/support-v2-base.json \
CONTRACT_PATH=contracts/SupportV2.sol:SupportV2 \
npx hardhat run scripts/verify-contract.ts --network base
```

The script will:

1. Verify the implementation contract
2. Attempt proxy verification with multiple strategies
3. Handle "Already Verified" gracefully

**Alternative (simple):**

```bash
npx hardhat verify --network optimisticEthereum <IMPLEMENTATION_ADDRESS>
```

### 3. Update Frontend Configuration

Edit `website/utils/getChain.ts`:

```typescript
const SUPPORT_V2_ADDRESSES: Record<number, `0x${string}`> = {
  // Testnets
  [optimismSepolia.id]: "0x9859431b682e861b19e87Db14a04944BC747AB6d",
  [baseSepolia.id]: "0xaB44BE78499721b593a0f4BE2099b246e9C53B57",
  // Mainnets - ADD THESE AFTER DEPLOYMENT
  [optimism.id]: "0x...", // ← Optimism Mainnet proxy address
  [base.id]: "0x...", // ← Base Mainnet proxy address
};

// Update default chain for production
export const DEFAULT_SUPPORT_CHAIN = optimism; // ← Change from optimismSepolia
```

### 4. Test Donation

Use cast or ethers to test:

```bash
# Test with cast (Foundry)
cast send <PROXY_ADDRESS> \
  "donate(string,address)" \
  "https://frederic-jendrzejewski.de/blog/test" \
  "0x073f26F0C3FC100e7b075C3DC3cDE0A777497D20" \
  --value 0.0002ether \
  --rpc-url https://mainnet.optimism.io \
  --private-key $PRIVATE_KEY
```

## Security Considerations

### Owner Key Management

The deployment account becomes the contract owner with these privileges:

- **Upgrade the contract** via UUPS
- **No funds custody** — donations go directly to recipients

**⚠️ For mainnet: Use a hardware wallet or multisig.**

### Recipient Address

The `SUPPORT_RECIPIENT_ADDRESS` in the frontend (`0x073f26F0C3FC100e7b075C3DC3cDE0A777497D20`) is passed as parameter, not stored in contract. This means:

- Recipients are verified client-side only
- Anyone can call `donate()` with any recipient
- This is by design — the contract is a generic donation mechanism

### Upgradeability

The UUPS proxy allows future upgrades:

```bash
# To upgrade (from owner account):
npx hardhat run scripts/upgrade-support-v2.ts --network optimisticEthereum
```

## Troubleshooting

### "Insufficient funds for deployment"

Ensure deployer has at least 0.03 ETH. Check with:

```bash
cast balance <DEPLOYER_ADDRESS> --rpc-url https://mainnet.optimism.io
```

### "Configuration file not found"

Ensure `scripts/deploy-support-v2.config.json` exists.

### "OpenZeppelin upgrade validation failed"

Check the contract for:

- Missing `__gap` arrays in base contracts
- Storage layout incompatibilities

### Verification fails

Use the robust `verify-contract.ts` script which handles multiple scenarios:

```bash
DEPLOYMENT_FILE=deployments/support-v2-optimisticEthereum.json \
CONTRACT_PATH=contracts/SupportV2.sol:SupportV2 \
npx hardhat run scripts/verify-contract.ts --network optimisticEthereum
```

If that fails, try direct Hardhat verification:

```bash
npx hardhat verify --network optimisticEthereum <IMPLEMENTATION_ADDRESS>
```

For proxies, the implementation is verified separately from the proxy.

## Complete Deployment Checklist

### Pre-Deployment

- [x] Deployer wallet funded with ≥0.1 ETH (mainnet)
- [x] `ALCHEMY_API_KEY` and `SEPOLIA_PRIVATE_KEY` set in Hardhat vars
- [x] Config file updated for mainnet (`environment: "mainnet"`)
- [x] Validation passed (`validateOnly: true`)
- [x] Dry run completed (`dryRun: true`)

### Deployment

- [x] Deploy to Optimism Mainnet (`0x4ca63f8A4Cd56287E854f53E18ca482D74391316`)
- [x] Deploy to Base Mainnet (`0xB70EA4d714Fed01ce20E93F9033008BadA1c8694`)
- [x] Save deployment JSON files
- [x] Verify contracts on block explorers

### Post-Deployment

- [x] Update `website/utils/getChain.ts` with mainnet addresses
- [x] Update `DEFAULT_SUPPORT_CHAIN` to mainnet
- [ ] Test donation on each chain
- [x] Update SUPPORT_V2_PROPOSAL.md with deployment status

## Network-Specific Notes

### Optimism Mainnet

- **Chain ID**: 10
- **Explorer**: https://optimistic.etherscan.io/
- **RPC**: https://mainnet.optimism.io
- **Gas**: Typically $0.01-0.10 per transaction

### Base Mainnet

- **Chain ID**: 8453
- **Explorer**: https://basescan.org/
- **RPC**: https://mainnet.base.org
- **Gas**: Typically $0.01-0.05 per transaction

## Related Documentation

- [SUPPORT_V2_PROPOSAL.md](./SUPPORT_V2_PROPOSAL.md) — Full implementation plan
- [SupportV2.sol](./contracts/SupportV2.sol) — Contract source code
- [SupportV2_Functional.ts](./test/SupportV2_Functional.ts) — Functional tests
- [SupportV2_Deployment.ts](./test/SupportV2_Deployment.ts) — Deployment script tests
- [verify-contract.ts](./scripts/verify-contract.ts) — Generic contract verification script
- [validate-contract.ts](./scripts/validate-contract.ts) — Pre-deployment validation utilities
- [GENIMG_DEPLOY_V4_GUIDE.md](./GENIMG_DEPLOY_V4_GUIDE.md) — Similar deployment pattern

## Support

For issues:

1. Check deployment output logs
2. Review saved deployment JSON file
3. Run tests: `npx hardhat test test/SupportV2*.ts`
4. Check network connectivity and RPC status
