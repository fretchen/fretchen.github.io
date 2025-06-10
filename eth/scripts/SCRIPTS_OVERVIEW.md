# Smart Contract Scripts

This directory contains various scripts for deploying, validating, verifying, and managing smart contracts.

## 📋 Script Overview

### 🚀 Deployment Scripts

#### `deploy-collector-nft.ts`
**Purpose**: Deploy new CollectorNFT contracts with OpenZeppelin upgradeable proxy pattern.

**Features**:
- UUPS proxy deployment
- Comprehensive validation during deployment
- Automatic deployment file generation
- Integration with validation scripts

**Usage**:
```bash
GENIMFNT_ADDRESS=0x... npx hardhat run scripts/deploy-collector-nft.ts --network sepolia
```

### 🔄 Upgrade Scripts

#### `upgrade-collector-nft.ts`
**Purpose**: Upgrade existing CollectorNFT proxy contracts to new implementations.

#### `upgrade-to-v3.ts`
**Purpose**: Upgrade GenImNFT contracts from v2 to v3.

### ✅ Validation Scripts

#### `validate-contract.ts` (Recommended)
**Purpose**: Comprehensive validation of deployed contract state and functionality.

**What it does**:
- Tests contract functionality and state
- Validates proxy-implementation relationships
- Checks upgrade readiness
- Verifies owner permissions and gas requirements
- Cross-validates related contracts (e.g., GenImNFT ↔ CollectorNFT)

**When to use**: 
- After deployment to ensure everything works
- Before upgrades to check readiness
- Regular health checks of live contracts
- Troubleshooting contract issues

**Usage**:
```bash
# With deployment file (recommended)
DEPLOYMENT_FILE=./scripts/deployments/collector-nft-optimism-2025-06-10.json npx hardhat run scripts/validate-contract.ts --network optimisticEthereum

# With manual proxy address
PROXY_ADDRESS=0x... npx hardhat run scripts/validate-contract.ts --network sepolia

# Auto-detect latest deployment
npx hardhat run scripts/validate-contract.ts --network optimisticEthereum
```

### 🔍 Verification Scripts

#### `verify-contracts.ts` (Recommended)
**Purpose**: Verify contract source code on block explorers (Etherscan, Optimistic Etherscan, etc.).

**What it does**:
- Makes source code publicly viewable on block explorers
- Enables interaction through explorer UI
- Verifies both proxy and implementation contracts
- Automatically detects contract types
- Handles multiple verification strategies

**When to use**:
- After deployment to make contracts publicly verifiable
- When Etherscan shows "Contract not verified"
- To enable public interaction through block explorer

**Usage**:
```bash
# With deployment file (recommended)
DEPLOYMENT_FILE=./scripts/deployments/collector-nft-optimism-2025-06-10.json npx hardhat run scripts/verify-contracts.ts --network optimisticEthereum

# With manual proxy address
PROXY_ADDRESS=0x... npx hardhat run scripts/verify-contracts.ts --network sepolia

# Auto-detect latest deployment
npx hardhat run scripts/verify-contracts.ts --network optimisticEthereum
```

#### `verify-implementation.ts` (Legacy)
**Purpose**: Legacy script for implementation-only verification.
**Note**: Use `verify-contracts.ts` for new projects - it's more comprehensive.

### 🛠️ Utility Scripts

#### `export-abi.ts`
**Purpose**: Export contract ABIs for frontend integration.

## 📁 Supporting Files

### Configuration Files

#### `deploy-config.json`
Example deployment configuration file.

#### `deploy-config.schema.json`
JSON schema for validating deployment configuration files.

### Deployment Records

#### `deployments/`
Directory containing deployment records in JSON format.
- `collector-nft-optimism-2025-06-10.json` - Example deployment record
- Each file contains addresses, metadata, and configuration for deployed contracts

## 🔄 Typical Workflow

1. **Deploy Contract**:
   ```bash
   GENIMFNT_ADDRESS=0x... npx hardhat run scripts/deploy-collector-nft.ts --network sepolia
   ```

2. **Validate Deployment**:
   ```bash
   npx hardhat run scripts/validate-contract.ts --network sepolia
   ```

3. **Verify on Block Explorer**:
   ```bash
   npx hardhat run scripts/verify-contracts.ts --network sepolia
   ```

4. **Regular Health Checks**:
   ```bash
   npx hardhat run scripts/validate-contract.ts --network sepolia
   ```

## 🎯 Key Differences

| Script | Purpose | When to Use |
|--------|---------|-------------|
| `validate-contract.ts` | Check if contracts work correctly | After deployment, before upgrades, troubleshooting |
| `verify-contracts.ts` | Make source code public on Etherscan | After deployment for transparency |
| `deploy-collector-nft.ts` | Create new contracts | Initial deployment only |
| `upgrade-*.ts` | Update existing contracts | When implementing new features |

## 🌐 Network Support

All scripts support multiple networks configured in `hardhat.config.ts`:
- `sepolia` (Ethereum testnet)
- `optimisticEthereum` (Optimism mainnet)
- `localhost` (Local development)
- And more...

## 💡 Pro Tips

1. **Always validate after deployment** - Use `validate-contract.ts` to ensure everything works
2. **Use deployment files** - They contain all necessary information and reduce errors
3. **Verify contracts publicly** - Use `verify-contracts.ts` for transparency
4. **Keep deployment records** - The `deployments/` directory maintains a history of all deployments

---

## 📖 Configuration Documentation

For detailed information about deployment configuration files (`deploy-config.json`), see the [Configuration Guide](#configuration-guide) below.

### Configuration Guide

#### `deploy-config.json`
Main configuration file for CollectorNFT deployment. This file contains all deployment parameters and options.

#### `deploy-config.schema.json`
JSON schema file for validation of configuration structure. This ensures proper format and required fields.

#### Configuration Structure

```json
{
  "genImNFTAddress": "0x1234567890123456789012345678901234567890",
  "baseMintPrice": "0.001",
  "options": {
    "validateOnly": false,
    "dryRun": false,
    "verify": true,
    "waitConfirmations": 2
  },
  "metadata": {
    "description": "CollectorNFT deployment for Sepolia testnet",
    "version": "1.0.0",
    "environment": "development"
  }
}
```

For complete configuration documentation, see the existing detailed sections in this file.
