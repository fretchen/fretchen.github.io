# GenImNFTv4 Deployment Guide

## Overview

This guide explains how to deploy a new GenImNFTv4 contract from scratch using the deployment script at `scripts/deploy-genimg-v4.ts`. Use this for **initial deployments** on new networks (e.g., Optimism Sepolia for testing).

For upgrading an existing GenImNFTv3 contract, see [GENIMG_UPGRADE_TO_V4_GUIDE.md](./GENIMG_UPGRADE_TO_V4_GUIDE.md).

## What is GenImNFTv4?

GenImNFTv4 is an upgradeable NFT contract that supports:

- **AI-Generated Image NFTs**: Mint NFTs that can be updated with AI-generated images
- **Agent Authorization**: EIP-8004 compatible whitelist for authorized image update services
- **Public/Private Listing**: Token owners can control visibility in public galleries
- **UUPS Upgradeability**: Secure upgradeability via UUPS proxy pattern
- **Security**: Protection against unauthorized image updates (CVE-2025-11-26 fix)

## Prerequisites

- Node.js and npm installed
- Hardhat configured with your network settings
- Access to deployer wallet with sufficient funds
- OpenZeppelin Hardhat Upgrades Plugin (`@openzeppelin/hardhat-upgrades`)
- Zod for config validation (`zod`)

## Network Configuration

Ensure your target network is configured in `hardhat.config.ts`:

```typescript
networks: {
  optsepolia: {
    url: `https://opt-sepolia.g.alchemy.com/v2/${ALCHEMY_API_KEY}`,
    accounts: [SEPOLIA_PRIVATE_KEY],
  },
  optimisticEthereum: {
    url: `https://opt-mainnet.g.alchemy.com/v2/${ALCHEMY_API_KEY}`,
    accounts: [SEPOLIA_PRIVATE_KEY],
  },
}
```

## Deployment Architecture

The deployment uses a **configuration-driven approach** with validation and dry-run modes for safe deployments.

### Configuration File

Create or edit `scripts/deploy-genimg-v4.config.json`:

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
```

### Configuration Options

| Field                      | Type    | Required | Description                                          |
| -------------------------- | ------- | -------- | ---------------------------------------------------- |
| `parameters.mintPrice`     | string  | Yes      | Price in ETH for minting (e.g., "0.01")              |
| `parameters.agentWallet`   | string  | No       | Agent wallet to authorize immediately after deploy   |
| `options.validateOnly`     | boolean | No       | Only validate contract, don't deploy                 |
| `options.dryRun`           | boolean | No       | Simulate deployment without executing                |
| `options.verify`           | boolean | No       | Verify contract on block explorer after deployment   |
| `options.waitConfirmations`| number  | No       | Number of confirmations to wait (default: 1)         |
| `metadata.description`     | string  | No       | Deployment description                               |
| `metadata.version`         | string  | No       | Version identifier                                   |
| `metadata.environment`     | string  | No       | Environment (testnet/mainnet)                        |

## Deployment Process

### Step 1: Configuration

Edit `scripts/deploy-genimg-v4.config.json` with your parameters:

**For Testnet (Optimism Sepolia):**
```json
{
  "parameters": {
    "mintPrice": "0.00003",
    "agentWallet": "0xYourAgentAddress"
  },
  "options": {
    "waitConfirmations": 2
  },
  "metadata": {
    "environment": "testnet"
  }
}
```

**For Mainnet (Optimism):**
```json
{
  "parameters": {
    "mintPrice": "0.01",
    "agentWallet": "0xYourAgentAddress"
  },
  "options": {
    "waitConfirmations": 5,
    "verify": true
  },
  "metadata": {
    "environment": "mainnet"
  }
}
```

### Step 2: Validation (Recommended)

Validate the contract before deploying:

```bash
# Set validateOnly: true in config
npx hardhat run scripts/deploy-genimg-v4.ts --network optsepolia
```

**What happens:**
- ✅ Validates contract compiles successfully
- ✅ Checks OpenZeppelin upgrade patterns
- ✅ Verifies UUPS proxy compatibility
- ⚠️ **Does NOT deploy**

### Step 3: Dry Run (Recommended)

Preview deployment without executing:

```bash
# Set dryRun: true in config
npx hardhat run scripts/deploy-genimg-v4.ts --network optsepolia
```

**What happens:**
- ✅ Shows deployment parameters
- ✅ Validates configuration
- ✅ Simulates deployment flow
- ⚠️ **Does NOT deploy**

### Step 4: Deploy

Execute the actual deployment:

```bash
# Set both validateOnly: false and dryRun: false
npx hardhat run scripts/deploy-genimg-v4.ts --network optsepolia
```

**What happens:**
1. ✅ Pre-deployment validation
2. ✅ Deploys UUPS proxy and implementation
3. ✅ Calls `initialize()` function
4. ✅ Sets mint price to configured value
5. ✅ Authorizes agent wallet (if provided)
6. ✅ Verifies all state is correct
7. ✅ Saves deployment info to `deployments/genimg-v4-{network}-{date}.json`
8. ✅ Runs comprehensive validation checks

### Expected Output

```
🚀 GenImNFTv4 Deployment Script
============================================================
Network: optsepolia
Block: 18642837

📄 Loading configuration from: /path/to/deploy-genimg-v4.config.json
✅ Configuration loaded and validated

📦 Getting GenImNFTv4 contract factory...

🔍 Pre-Deployment Validation
----------------------------------------
✅ OpenZeppelin upgrade validation passed

🚀 Deploying GenImNFTv4...
📋 Mint Price: 0.00003 ETH

✅ GenImNFTv4 deployed successfully!
============================================================
📍 Proxy Address: 0x1234...5678
📍 Implementation Address: 0xabcd...ef01
📍 Admin Address: 0x9876...5432

⚙️  Post-Deployment Configuration
----------------------------------------
✅ Mint price set to 0.00003 ETH
✅ Agent wallet authorized: 0xAAEB...239C

🔍 Verifying deployment...
✅ Implementation contract verified (12345 bytes)
✅ Implementation contract ABI compatible
✅ Owner: 0xYourAddress
✅ Deployer: 0xYourAddress
✅ Mint Price: 0.00003 ETH
✅ Name: GenImNFTv4
✅ Symbol: GENIMGv4
✅ All verifications passed!

💾 Deployment info saved to: deployments/genimg-v4-optsepolia-2025-12-24.json
✅ Comprehensive validation completed successfully!

✅ Deployment completed successfully!
============================================================

📝 Next Steps:
1. Save the proxy address for your frontend/backend configuration
2. Test minting: safeMint(address, uri)
3. Verify contracts on Etherscan if needed
```

## Post-Deployment Steps

### 1. Save Contract Addresses

The deployment info is saved to `scripts/deployments/genimg-v4-{network}-{date}.json`:

```json
{
  "network": "optsepolia",
  "timestamp": "2025-12-24T12:00:00.000Z",
  "blockNumber": 18642837,
  "proxyAddress": "0x1234...5678",
  "implementationAddress": "0xabcd...ef01",
  "adminAddress": "0x9876...5432",
  "owner": "0xYourAddress",
  "mintPrice": "0.00003",
  "agentWallet": "0xAAEB...239C"
}
```

**Save the `proxyAddress`** - this is the address users will interact with.

### 2. Authorize Additional Agents (Optional)

If you need to authorize more agent wallets:

```solidity
// From contract owner account
contract.authorizeAgentWallet("0xNewAgentAddress");
```

Check if an agent is authorized:

```solidity
bool isAuthorized = contract.isAuthorizedAgent("0xAgentAddress");
```

Revoke an agent:

```solidity
contract.revokeAgentWallet("0xAgentAddress");
```

### 3. Test Basic Functions

**Mint a test NFT:**

```javascript
const tx = await contract.safeMint(
  "0xRecipientAddress",
  "ipfs://Qm.../metadata.json"
);
await tx.wait();
```

**Request image update (as authorized agent):**

```javascript
const tx = await contract.requestImageUpdate(
  tokenId,
  "https://image-service.example.com/image.png",
  { value: ethers.parseEther("0.00003") }
);
await tx.wait();
```

### 4. Verify on Block Explorer

If `verify: true` in config, the script notes that verification should be done separately:

```bash
npx hardhat verify --network optsepolia PROXY_ADDRESS
```

For upgradeable contracts, you may need to verify the implementation separately.

### 5. Update Frontend Configuration

Update your frontend/backend with the new proxy address:

```javascript
const GENIMG_V4_ADDRESS = "0x1234...5678"; // Use proxy address
const GENIMG_V4_ABI = require("./abi/GenImNFTv4.json");

const contract = new ethers.Contract(
  GENIMG_V4_ADDRESS,
  GENIMG_V4_ABI,
  signer
);
```

## Security Considerations

### Agent Authorization

**Critical**: Only authorize trusted wallets as agents. Authorized agents can:
- Call `requestImageUpdate()` and receive `mintPrice` payments
- Update token images (but NOT steal tokens)

**Recommendation**: Use a dedicated backend service wallet with proper key management.

### Mint Price

Set appropriate mint prices based on:
- Network gas costs
- Image generation costs
- Token economics

**Testnet**: Use low prices (e.g., 0.00003 ETH)
**Mainnet**: Consider real costs (e.g., 0.01 ETH or more)

### Owner Key Management

The deployment account becomes the contract owner with critical privileges:
- Upgrade the contract
- Change mint price
- Authorize/revoke agents
- Pause/unpause (if implemented)

**Use a hardware wallet or multisig for mainnet deployments.**

## Troubleshooting

### "Configuration file not found"

Ensure `deploy-genimg-v4.config.json` exists in `scripts/` directory.

### "Invalid Ethereum address format"

Check that addresses in config are valid checksummed Ethereum addresses.

### "Insufficient funds"

Ensure deployer wallet has enough ETH for:
- Gas costs (~$5-20 depending on network)
- Multiple transactions (deploy + configuration)

### "OpenZeppelin upgrade validation failed"

The contract may have upgrade safety issues. Review error message and contract code.

### Deploy fails silently

Check you have:
- Correct network name in `--network` flag
- Network configured in `hardhat.config.ts`
- Valid RPC URL and private key

## Network-Specific Notes

### Optimism Sepolia (Testnet)

- **Chain ID**: 11155420
- **Explorer**: https://sepolia-optimism.etherscan.io/
- **Faucet**: https://faucet.optimism.io/
- **Recommended mint price**: 0.0001 - 0.001 ETH

### Optimism Mainnet

- **Chain ID**: 10
- **Explorer**: https://optimistic.etherscan.io/
- **Recommended mint price**: 0.01+ ETH
- **Always use `waitConfirmations: 5` or higher**

## Example: Complete Testnet Deployment

```bash
# 1. Navigate to eth directory
cd eth

# 2. Edit configuration
cat > scripts/deploy-genimg-v4.config.json << 'EOF'
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
    "description": "GenImNFTv4 test deployment",
    "version": "4.0.0",
    "environment": "testnet"
  }
}
EOF

# 3. Validate first
# Set validateOnly: true, then run:
npx hardhat run scripts/deploy-genimg-v4.ts --network optsepolia

# 4. Deploy (after validation passes)
# Set validateOnly: false, then run:
npx hardhat run scripts/deploy-genimg-v4.ts --network optsepolia

# 5. Save the proxy address from output
# Look for: 📍 Proxy Address: 0x...

# 6. Test minting via Hardhat console
npx hardhat console --network optsepolia
> const GenImNFT = await ethers.getContractFactory("GenImNFTv4")
> const contract = GenImNFT.attach("0xYourProxyAddress")
> await contract.safeMint("0xRecipient", "ipfs://Qm.../metadata.json")
```

## Related Documentation

- [GENIMG_UPGRADE_TO_V4_GUIDE.md](./GENIMG_UPGRADE_TO_V4_GUIDE.md) - Upgrade existing v3 contracts
- [GenImNFTv4.sol](./contracts/GenImNFTv4.sol) - Contract source code
- [OpenZeppelin Upgrades](https://docs.openzeppelin.com/upgrades-plugins/1.x/) - Upgrades plugin docs
- [EIP-8004](https://eips.ethereum.org/EIPS/eip-8004) - Trustless Agents standard

## Support

For issues or questions:
1. Check the deployment output logs
2. Review the saved deployment JSON file
3. Verify configuration matches this guide
4. Check network connectivity and RPC status
