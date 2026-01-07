# EIP3009SplitterV1 Deployment Guide

## Overview

This guide explains how to deploy the EIP3009SplitterV1 contract using the deployment script at `scripts/deploy-splitter-v1.ts`. This contract provides a minimal, auditable fee-splitting mechanism for EIP-3009 compliant tokens (USDC, EURC) where:

- A **buyer** signs a single EIP-3009 authorization
- A **facilitator (relayer)** submits the transaction and earns a fixed fee (0.01 USDC)
- The **seller** receives the remainder
- No custody is taken beyond a single atomic transaction

## What is EIP3009SplitterV1?

EIP3009SplitterV1 is an upgradeable payment splitter contract that supports:

- **Token-Agnostic Design**: Supports any EIP-3009 compliant token (USDC, EURC, etc.)
- **Fixed Fee Split**: Deterministic fee distribution in a single transaction
- **EIP-3009 Authorization**: Gasless payments via signed authorizations
- **UUPS Upgradeability**: Secure upgradeability via UUPS proxy pattern
- **Zero Custody**: Contract holds no persistent balances

## Design Decisions

### Token-Agnostic Architecture

Unlike typical splitters that store a token address, this contract accepts the token as a **parameter** to `executeSplit()`. This design:

- **Supports multiple tokens** without redeployment (USDC on Optimism, EURC on Base, etc.)
- **Reduces storage costs** (no token state variable)
- **Enables cross-chain flexibility** (same contract logic on different networks)

### Fee Model

- **Fixed fee**: 10,000 units (0.01 USDC/EURC with 6 decimals)
- **Owner-adjustable**: Can be updated via `setFixedFee()`
- **Transparent**: Buyer knows exact split before signing

### Security Features

- **SafeERC20**: Handles non-standard token implementations
- **Seller verification**: Cryptographically bound to EIP-3009 nonce
- **No replay attacks**: Single-use authorizations via EIP-3009
- **No reentrancy risk**: Simple transfer flow, no external calls after token reception

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

Create or edit `scripts/deploy-splitter-v1.config.json`:

```json
{
  "parameters": {
    "facilitatorWallet": "0x3F8d2Fb6fEA24E70155bC61471936F3c9C30c206",
    "fixedFee": "10000"
  },
  "options": {
    "validateOnly": false,
    "dryRun": false,
    "verify": false,
    "waitConfirmations": 1
  },
  "metadata": {
    "description": "EIP3009SplitterV1 deployment to Optimism Sepolia",
    "version": "1.0.0",
    "environment": "testnet"
  }
}
```

### Configuration Options

| Field                          | Type    | Required | Description                                                |
| ------------------------------ | ------- | -------- | ---------------------------------------------------------- |
| `parameters.facilitatorWallet` | string  | Yes      | Address that receives the fixed fee                        |
| `parameters.fixedFee`          | string  | Yes      | Fee amount in token base units (e.g., "10000" = 0.01 USDC) |
| `options.validateOnly`         | boolean | No       | Only validate contract, don't deploy                       |
| `options.dryRun`               | boolean | No       | Simulate deployment without executing                      |
| `options.verify`               | boolean | No       | Verify contract on block explorer after deployment         |
| `options.waitConfirmations`    | number  | No       | Number of confirmations to wait (default: 1)               |
| `metadata.description`         | string  | No       | Deployment description                                     |
| `metadata.version`             | string  | No       | Version identifier                                         |
| `metadata.environment`         | string  | No       | Environment (testnet/mainnet)                              |

## Deployment Process

### Step 1: Configuration

Edit `scripts/deploy-splitter-v1.config.json` with your parameters:

**For Testnet (Optimism Sepolia):**

```json
{
  "parameters": {
    "facilitatorWallet": "0xYourFacilitatorAddress",
    "fixedFee": "10000"
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
    "facilitatorWallet": "0xYourFacilitatorAddress",
    "fixedFee": "10000"
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
npx hardhat run scripts/deploy-splitter-v1.ts --network optsepolia
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
npx hardhat run scripts/deploy-splitter-v1.ts --network optsepolia
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
npx hardhat run scripts/deploy-splitter-v1.ts --network optsepolia
```

**What happens:**

1. ✅ Pre-deployment validation
2. ✅ Deploys UUPS proxy and implementation
3. ✅ Calls `initialize()` function
4. ✅ Sets facilitator wallet and fixed fee
5. ✅ Saves deployment info to `deployments/splitter-v1-{network}-{date}.json` **immediately** (before verification)
6. ✅ Runs post-deployment verification checks (non-blocking)
7. ✅ Updates deployment file with verification status

### Expected Output

```
🚀 EIP3009SplitterV1 Deployment Script
============================================================
Network: optsepolia
Block: 18642837

📄 Loading configuration from: /path/to/deploy-splitter-v1.config.json
✅ Configuration loaded and validated

📦 Getting EIP3009SplitterV1 contract factory...

🔍 Pre-Deployment Validation
----------------------------------------
✅ OpenZeppelin upgrade validation passed

🚀 Deploying EIP3009SplitterV1...
📋 Facilitator Wallet: 0x3F8d...c206
📋 Fixed Fee: 10000 (raw units)
📋 Note: Token is now a parameter of executeSplit()

✅ EIP3009SplitterV1 deployed successfully!
============================================================
📍 Proxy Address: 0x7e67...8946
📍 Implementation Address: 0xf18E...D4a6
📍 Admin Address: 0x0000...0000

💾 Deployment info saved to: deployments/splitter-v1-optsepolia-2026-01-05.json

⚙️  Post-Deployment Verification
----------------------------------------
🔧 Verifying implementation contract...
✅ Implementation contract verified (17818 bytes)
✅ Implementation contract ABI compatible
🔍 Verifying proxy state...
✅ Owner: 0x073f...7D20
✅ Deployer: 0x073f...7D20
✅ Facilitator Wallet: 0x3F8d...c206
✅ Fixed Fee: 10000 (raw units)
ℹ️  Token: Passed as parameter to executeSplit() (not stored in state)
✅ All verifications passed!

📋 Deployment Summary:
{
  "network": "optsepolia",
  "proxyAddress": "0x7e67bf96ADbf4a813DD7b0A3Ca3060a937018946",
  "implementationAddress": "0xf18E3901D91D8a08380E37A466E6F7f6AA4BD4a6",
  "facilitatorWallet": "0x3F8d2Fb6fEA24E70155bC61471936F3c9C30c206",
  "fixedFee": "10000",
  "verificationStatus": "passed"
}

✅ Deployment completed successfully!
```

## Post-Deployment Steps

### 1. Save Contract Addresses

The deployment info is saved to `scripts/deployments/splitter-v1-{network}-{date}.json`:

```json
{
  "network": "optsepolia",
  "timestamp": "2026-01-05T07:25:00.000Z",
  "proxyAddress": "0x7e67bf96ADbf4a813DD7b0A3Ca3060a937018946",
  "implementationAddress": "0xf18E3901D91D8a08380E37A466E6F7f6AA4BD4a6",
  "adminAddress": "0x0000000000000000000000000000000000000000",
  "contractType": "EIP3009SplitterV1",
  "owner": "0x073f26F0C3FC100e7b075C3DC3cDE0A777497D20",
  "tokenNote": "Token is passed as parameter to executeSplit() - supports USDC, EURC, and other EIP-3009 tokens",
  "facilitatorWallet": "0x3F8d2Fb6fEA24E70155bC61471936F3c9C30c206",
  "fixedFee": "10000",
  "verificationStatus": "passed"
}
```

**Save the `proxyAddress`** - this is the address the x402 facilitator will interact with.

### 2. Update x402 Facilitator Configuration

Update the `SPLITTER_ADDRESS` constant in `x402_facilitator/`:

```javascript
// x402_facilitator/x402_verify.js or x402_facilitator.js
const SPLITTER_ADDRESS = "0x7e67bf96ADbf4a813DD7b0A3Ca3060a937018946"; // Use your proxy address
```

### 3. Update Frontend Configuration

Update payment requirements in `scw_js/genimg_x402_token.js`:

```javascript
const paymentRequirements = {
  type: "EIP-3009",
  token: "USDC", // or "EURC"
  splitterAddress: "0x7e67bf96ADbf4a813DD7b0A3Ca3060a937018946",
  fixedFee: "10000", // 0.01 USDC
};
```

### 4. Test executeSplit()

**Test with mock EIP-3009 authorization:**

```javascript
const { ethers } = require("hardhat");

async function testSplit() {
  const splitter = await ethers.getContractAt("EIP3009SplitterV1", "0x7e67bf96ADbf4a813DD7b0A3Ca3060a937018946");

  const token = "0x5fd84259d66Cd46123540766Be93DFE6D43130D7"; // USDC on Optimism Sepolia
  const buyer = "0xBuyerAddress";
  const seller = "0xSellerAddress";
  const totalAmount = ethers.parseUnits("1", 6); // 1 USDC
  const validAfter = 0;
  const validBefore = Math.floor(Date.now() / 1000) + 3600; // 1 hour
  const nonce = ethers.hexlify(ethers.randomBytes(32));

  // Buyer signs EIP-3009 authorization (off-chain)
  // ... (see EIP-3009 documentation)

  // Facilitator submits transaction
  const tx = await splitter.executeSplit(
    token,
    buyer,
    seller,
    totalAmount,
    validAfter,
    validBefore,
    nonce,
    v,
    r,
    s, // Signature components
  );

  await tx.wait();
  console.log("Split executed successfully!");
}
```

### 5. Verify on Block Explorer

For Etherscan verification, use the generic verify script:

```bash
npx hardhat run scripts/verify-deployment.ts --network optsepolia
```

Or manually:

```bash
npx hardhat verify --network optsepolia 0x7e67bf96ADbf4a813DD7b0A3Ca3060a937018946
```

For upgradeable contracts, you may need to verify the implementation separately.

### 6. Update Configuration (Optional)

**Change facilitator wallet:**

```javascript
// From contract owner account
await splitter.setFacilitatorWallet("0xNewFacilitatorAddress");
```

**Update fixed fee:**

```javascript
// From contract owner account
await splitter.setFixedFee("20000"); // 0.02 USDC
```

## Token Support

### Supported Tokens

Any ERC-20 token implementing EIP-3009 `transferWithAuthorization`:

| Token | Network          | Address                                      | Decimals |
| ----- | ---------------- | -------------------------------------------- | -------- |
| USDC  | Optimism         | `0x0b2C639c533813f4Aa9D7837CAf62653d097Ff85` | 6        |
| USDC  | Optimism Sepolia | `0x5fd84259d66Cd46123540766Be93DFE6D43130D7` | 6        |
| EURC  | Base             | Check Circle documentation                   | 6        |

### Token Parameter

The token address is passed as the **first parameter** to `executeSplit()`:

```solidity
function executeSplit(
    address token,          // ← Token address (USDC, EURC, etc.)
    address buyer,
    address seller,
    uint256 totalAmount,
    uint256 validAfter,
    uint256 validBefore,
    bytes32 nonce,
    uint8 v,
    bytes32 r,
    bytes32 s
) external
```

**Benefits:**

- Same contract works with multiple tokens
- No redeployment needed for new tokens
- Cross-chain compatible (USDC on Optimism, EURC on Base)

### Unsupported Tokens

**Fee-on-Transfer Tokens**: NOT supported (USDT, etc.) - would cause incorrect splits

## Security Considerations

### Facilitator Wallet

The facilitator wallet automatically receives the fixed fee for each split. Ensure:

- **Secure key management**: Use hardware wallet or secure backend
- **Monitor transactions**: Set up alerts for unusual activity
- **Correct address**: Double-check before deployment (immutable via initialization)

### Fixed Fee

Set appropriate fees based on:

- Token decimals (6 for USDC/EURC)
- Business model (typical: 0.01-0.02 USD)
- Network economics

**Examples:**

- 0.01 USDC: `fixedFee: "10000"`
- 0.02 USDC: `fixedFee: "20000"`

### Owner Key Management

The deployment account becomes the contract owner with critical privileges:

- Upgrade the contract
- Change fixed fee
- Change facilitator wallet

**Use a hardware wallet or multisig for mainnet deployments.**

### EIP-3009 Security

- **Nonce management**: Each authorization is single-use
- **Time bounds**: Set `validBefore` to prevent stale authorizations
- **Domain separation**: EIP-712 prevents cross-chain replay

## Architecture Details

### Payment Flow

```
1. Buyer signs EIP-3009 authorization off-chain
   ↓
2. Facilitator calls executeSplit() with signature
   ↓
3. Contract pulls totalAmount from buyer via transferWithAuthorization
   ↓
4. Contract transfers (totalAmount - fixedFee) to seller
   ↓
5. Contract transfers fixedFee to facilitatorWallet
   ↓
6. Contract ends with zero balance (no custody)
```

### Storage Layout

```solidity
// Slot 0: Initializable (OpenZeppelin)
// Slot 1: ContextUpgradeable (OpenZeppelin)
// Slot 2: OwnableUpgradeable.owner (OpenZeppelin)
// Slot 3: UUPSUpgradeable (OpenZeppelin)
// Slot 4: facilitatorWallet
// Slot 5: fixedFee
// Slot 6-55: __gap[50] (reserved for future upgrades)
```

## Troubleshooting

### "Configuration file not found"

Ensure `deploy-splitter-v1.config.json` exists in `scripts/` directory.

### "Invalid facilitator wallet address format"

Check that the address in config is a valid checksummed Ethereum address (0x...).

### "Insufficient funds"

Ensure deployer wallet has enough ETH for:

- Gas costs (~$1-5 on Optimism)
- Multiple transactions (deploy + initialization)

### "OpenZeppelin upgrade validation failed"

The contract may have upgrade safety issues. Review error message and contract code.

### "Facilitator wallet mismatch"

This warning indicates the deployed contract has a different facilitator wallet than configured. This is non-critical if intentional (e.g., checksummed vs lowercase address).

### Deployment file not created

If deployment succeeds but no file is created, check:

- `scripts/deployments/` directory exists (auto-created)
- Write permissions on directory
- Deployment logs for errors

## Network-Specific Notes

### Optimism Sepolia (Testnet)

- **Chain ID**: 11155420
- **Explorer**: https://sepolia-optimism.etherscan.io/
- **Faucet**: https://faucet.optimism.io/
- **USDC Address**: `0x5fd84259d66Cd46123540766Be93DFE6D43130D7`
- **Recommended fee**: `"10000"` (0.01 USDC)

### Optimism Mainnet

- **Chain ID**: 10
- **Explorer**: https://optimistic.etherscan.io/
- **USDC Address**: `0x0b2C639c533813f4Aa9D7837CAf62653d097Ff85`
- **Recommended fee**: `"10000"` (0.01 USDC)
- **Always use `waitConfirmations: 5` or higher**

## Example: Complete Testnet Deployment

```bash
# 1. Navigate to eth directory
cd eth

# 2. Edit configuration
cat > scripts/deploy-splitter-v1.config.json << 'EOF'
{
  "parameters": {
    "facilitatorWallet": "0x3F8d2Fb6fEA24E70155bC61471936F3c9C30c206",
    "fixedFee": "10000"
  },
  "options": {
    "validateOnly": false,
    "dryRun": false,
    "verify": false,
    "waitConfirmations": 2
  },
  "metadata": {
    "description": "EIP3009SplitterV1 testnet deployment",
    "version": "1.0.0",
    "environment": "testnet"
  }
}
EOF

# 3. Validate first
# Set validateOnly: true, then run:
npx hardhat run scripts/deploy-splitter-v1.ts --network optsepolia

# 4. Dry run (preview)
# Set dryRun: true, then run:
npx hardhat run scripts/deploy-splitter-v1.ts --network optsepolia

# 5. Deploy (after validation passes)
# Set both false, then run:
npx hardhat run scripts/deploy-splitter-v1.ts --network optsepolia

# 6. Save the proxy address from output
# Look for: 📍 Proxy Address: 0x...

# 7. Verify on Etherscan
npx hardhat run scripts/verify-deployment.ts --network optsepolia
```

## Integration with x402 Protocol

The EIP3009SplitterV1 is designed to work with the x402 payment facilitator:

### x402 Flow

1. **Buyer requests service** (e.g., AI image generation)
2. **Backend generates payment request** with seller address + price
3. **Frontend requests EIP-3009 signature** from buyer wallet
4. **x402 facilitator validates** signature and seller whitelist
5. **x402 facilitator calls `executeSplit()`** on splitter contract
6. **Splitter distributes payment** atomically (seller + facilitator fee)
7. **Backend receives confirmation** and provides service

### Whitelist Integration

The x402 facilitator validates sellers before executing splits:

- Manual whitelist
- NFT holder check (GenImNFTv4, LLMv1)
- Test wallets (Sepolia only)

See `x402_facilitator/x402_whitelist.js` for implementation.

## Related Documentation

- [EIP3009SplitterV1.sol](./contracts/EIP3009SplitterV1.sol) - Contract source code
- [EIP-3009](https://eips.ethereum.org/EIPS/eip-3009) - Transfer With Authorization standard
- [OpenZeppelin Upgrades](https://docs.openzeppelin.com/upgrades-plugins/1.x/) - Upgrades plugin docs
- [x402 Facilitator README](../x402_facilitator/README.md) - Payment facilitator documentation

## Support

For issues or questions:

1. Check the deployment output logs
2. Review the saved deployment JSON file
3. Verify configuration matches this guide
4. Check network connectivity and RPC status
5. Review test suite: `npx hardhat test test/EIP3009SplitterV1*.ts`
