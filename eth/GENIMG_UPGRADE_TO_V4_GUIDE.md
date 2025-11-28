# GenImNFTv4 Upgrade Guide

## Overview

This guide explains how to upgrade an existing GenImNFTv3 proxy contract to GenImNFTv4 using the production upgrade script at `scripts/upgrade-genimg-v4.ts`. **This is a critical security upgrade that fixes vulnerability CVE-2025-11-26.**

## ⚠️ Critical Security Fix

**CVE-2025-11-26**: Unauthorized Image Update Vulnerability

GenImNFTv3 contained a critical vulnerability where any address could call `requestImageUpdate()` and claim the `mintPrice` payment intended for authorized image generation services.

**Real Attack (November 26, 2025):**

- Attacker: `0x8B6B008A0073D34D04ff00210E7200Ab00003300`
- Method: Front-running legitimate updates with empty URLs
- Impact: Tokens permanently locked with malicious URLs, payments stolen

**V4 Solution**: EIP-8004 compatible agent whitelist system that restricts `requestImageUpdate()` to authorized service wallets only.

## Prerequisites

- An existing GenImNFTv3 proxy contract deployed on your target network
- The proxy address
- Access to the owner account that can perform upgrades
- OpenZeppelin Hardhat Upgrades Plugin installed (`@openzeppelin/hardhat-upgrades`)
- Zod installed for config validation (`zod`)

## New Security Features in GenImNFTv4

GenImNFTv4 adds agent authorization to GenImNFTv3:

- **Agent Whitelist**: Only owner-authorized agents can update images (EIP-8004 compatible)
- **Authorization Functions**: `authorizeAgentWallet()`, `revokeAgentWallet()`, `isAuthorizedAgent()`
- **Security Events**: `AgentWalletAuthorized` and `AgentWalletRevoked` events
- **Backward Compatibility**: All V3 listing and minting functions preserved
- **Zero User Impact**: Token owners don't need to take any action

## Upgrade Architecture

The upgrade uses a **configuration-driven approach** with three execution modes and automatic proxy registration handling:

### Configuration File

Create or edit `scripts/upgrade-genimg-v4.config.json`:

```json
{
  "proxyAddress": "0x80f95d330417a4acEfEA415FE9eE28db7A0A1Cdb",
  "options": {
    "validateOnly": true,
    "dryRun": false,
    "verify": true,
    "authorizeAgentWallet": "0xAAEBC1441323B8ad6Bdf6793A8428166b510239C",
    "waitConfirmations": 2
  },
  "metadata": {
    "description": "Upgrade GenImNFTv3 to v4 - CVE-2025-11-26 Security Fix",
    "version": "4.0.0",
    "environment": "production",
    "securityFix": "CVE-2025-11-26"
  }
}
```

### Configuration Options

| Field                         | Type    | Required | Description                                          |
| ----------------------------- | ------- | -------- | ---------------------------------------------------- |
| `proxyAddress`                | string  | Yes      | Address of your GenImNFTv3 proxy contract            |
| `options.validateOnly`        | boolean | No       | Only validate compatibility, don't upgrade           |
| `options.dryRun`              | boolean | No       | Preview changes without executing                    |
| `options.verify`              | boolean | No       | Verify contract on block explorer after upgrade      |
| `options.authorizeAgentWallet`| string  | No       | Auto-authorize this agent wallet after upgrade       |
| `options.waitConfirmations`   | number  | No       | Number of confirmations to wait (default: 1)         |
| `metadata.description`        | string  | No       | Deployment description                               |
| `metadata.version`            | string  | No       | Version identifier                                   |
| `metadata.environment`        | string  | No       | Environment (development/staging/production)         |
| `metadata.securityFix`        | string  | No       | Security fix identifier (CVE-2025-11-26)             |

## Upgrade Process

The upgrade script provides comprehensive safety features with three execution modes:

### Step 1: Validation (Required First Step)

Validate upgrade compatibility without executing:

```bash
# Edit config file, set validateOnly: true
npx hardhat run scripts/upgrade-genimg-v4.ts --network optimism
```

**What happens:**
- ✅ Validates proxy address format and checksum
- ✅ Checks current implementation is GenImNFTv3
- ✅ Verifies storage layout compatibility
- ✅ **Automatically handles non-registered proxies** via `forceImport`
- ✅ Samples existing token data
- ⚠️ **Does NOT execute upgrade**

### Step 2: Dry Run (Recommended)

Preview what the upgrade would do without executing:

```bash
# Edit config file, set validateOnly: false, dryRun: true
npx hardhat run scripts/upgrade-genimg-v4.ts --network optimism
```

**What happens:**
- ✅ All validation checks from Step 1
- ✅ Simulates upgrade process
- ✅ Estimates gas costs
- ✅ Shows what would be deployed
- ⚠️ **Does NOT execute upgrade**

### Step 3: Execute Upgrade

Perform the actual upgrade:

```bash
# Edit config file, set validateOnly: false, dryRun: false
npx hardhat run scripts/upgrade-genimg-v4.ts --network optimism
```

**What happens:**
- ✅ All validation checks from Step 1
- ✅ Deploys new GenImNFTv4 implementation
- ✅ Upgrades proxy to point to V4
- ✅ Runs `reinitializeV4()` to initialize new storage
- ✅ Authorizes agent wallet (if configured)
- ✅ Verifies upgrade success
- ✅ Saves deployment info to JSON file

## Example Workflow

### Testing on Optimism Sepolia (Highly Recommended)

```bash
# 1. Configure for Sepolia testnet
cat > scripts/upgrade-genimg-v4.config.json << 'EOF'
{
  "proxyAddress": "0xYourSepoliaProxyAddress",
  "options": {
    "validateOnly": true,
    "dryRun": false,
    "verify": true,
    "authorizeAgentWallet": "0xYourTestBackendWallet",
    "waitConfirmations": 1
  },
  "metadata": {
    "description": "Test upgrade on Sepolia",
    "version": "4.0.0-test",
    "environment": "staging",
    "securityFix": "CVE-2025-11-26"
  }
}
EOF

# 2. Validate compatibility
npx hardhat run scripts/upgrade-genimg-v4.ts --network optimismSepolia

# 3. Edit config: set validateOnly: false, dryRun: true
# Preview changes
npx hardhat run scripts/upgrade-genimg-v4.ts --network optimismSepolia

# 4. Edit config: set dryRun: false
# Execute upgrade
npx hardhat run scripts/upgrade-genimg-v4.ts --network optimismSepolia

# 5. Run verification script
npx hardhat run scripts/verify-genimg-v4.ts --network optimismSepolia
```

### Production Upgrade on Optimism Mainnet

**Only proceed to mainnet after successful testnet testing:**

```bash
# 1. Configure for production
cat > scripts/upgrade-genimg-v4.config.json << 'EOF'
{
  "proxyAddress": "0x80f95d330417a4acEfEA415FE9eE28db7A0A1Cdb",
  "options": {
    "validateOnly": true,
    "dryRun": false,
    "verify": true,
    "authorizeAgentWallet": "0xAAEBC1441323B8ad6Bdf6793A8428166b510239C",
    "waitConfirmations": 2
  },
  "metadata": {
    "description": "Production upgrade - CVE-2025-11-26 Security Fix",
    "version": "4.0.0",
    "environment": "production",
    "securityFix": "CVE-2025-11-26",
    "attackerAddress": "0x8B6B008A0073D34D04ff00210E7200Ab00003300"
  }
}
EOF

# 2. Validate (validateOnly: true)
npx hardhat run scripts/upgrade-genimg-v4.ts --network optimism

# 3. Dry run (validateOnly: false, dryRun: true)
npx hardhat run scripts/upgrade-genimg-v4.ts --network optimism

# 4. Execute (validateOnly: false, dryRun: false)
npx hardhat run scripts/upgrade-genimg-v4.ts --network optimism

# 5. Verify on Etherscan
npx hardhat run scripts/verify-genimg-v4.ts --network optimism
```

## Automatic forceImport Handling

The upgrade script **automatically handles Ignition-deployed contracts** that aren't registered with OpenZeppelin:

```typescript
// Script automatically detects "not registered" errors and imports the proxy
try {
  await upgrades.validateUpgrade(proxyAddress, GenImNFTv4Factory, { kind: "uups" });
} catch (error: any) {
  if (error.message.includes("not registered")) {
    console.log("🔄 Proxy not registered, importing...");
    await upgrades.forceImport(proxyAddress, GenImNFTv3Factory, { kind: "uups" });
    // Retry validation after import
    await upgrades.validateUpgrade(proxyAddress, GenImNFTv4Factory, { kind: "uups" });
  }
}
```

**You don't need to manually use `SKIP_OZ_VALIDATION` or `FORCE_MANUAL_UPGRADE` flags anymore.**

## Script Features

The upgrade script provides:

- ✅ **Config-driven execution** with Zod schema validation
- ✅ **Automatic proxy registration** via `forceImport`
- ✅ **Three execution modes** (validate, dry-run, execute)
- ✅ **Pre-upgrade validation** of proxy address and compatibility
- ✅ **Storage layout safety checks** to prevent data corruption
- ✅ **Token data sampling** for verification
- ✅ **Automatic agent authorization** post-upgrade
- ✅ **Comprehensive post-upgrade verification**
- ✅ **Deployment info saved to JSON** for audit trail
- ✅ **Detailed logging** and error handling

## Post-Upgrade Verification

After upgrade, the script automatically verifies:

- ✅ Proxy address remains unchanged
- ✅ Total supply is preserved
- ✅ Existing tokens remain listed
- ✅ V4 agent authorization functions work
- ✅ Storage compatibility maintained

Run the dedicated verification script:

```bash
npx hardhat run scripts/verify-genimg-v4.ts --network optimism
```

**This script:**
- Loads deployment info from JSON
- Verifies implementation on Etherscan/block explorer
- Tests `isAuthorizedAgent()` functionality
- Provides Etherscan links for manual verification

## What Happens During Upgrade

1. **Configuration Loading**: Script reads and validates `upgrade-genimg-v4.config.json`
2. **Proxy Registration**: Automatically imports proxy if not registered (forceImport)
3. **Validation**: Checks proxy, validates compatibility, samples token data
4. **Implementation Deployment**: New GenImNFTv4 implementation is deployed
5. **Proxy Update**: Proxy's implementation pointer is updated to V4 via `upgradeToAndCall`
6. **Initialization**: `reinitializeV4()` runs to initialize new storage slots
7. **Agent Authorization**: Automatically authorizes configured agent wallet
8. **Verification**: Script confirms upgrade success and tests V4 functionality
9. **Deployment Info**: Saves all deployment details to JSON file

## Agent Authorization

### Automatic Authorization (Recommended)

Configure `authorizeAgentWallet` in config file - the script will automatically authorize after upgrade:

```json
{
  "options": {
    "authorizeAgentWallet": "0xAAEBC1441323B8ad6Bdf6793A8428166b510239C"
  }
}
```

### Manual Authorization

Authorize agents after upgrade using Hardhat console:

```bash
npx hardhat console --network optimism
```

```javascript
const contract = await ethers.getContractAt(
  "GenImNFTv4",
  "0x80f95d330417a4acEfEA415FE9eE28db7A0A1Cdb"
);

// Authorize agent
await contract.authorizeAgentWallet("0xAAEBC1441323B8ad6Bdf6793A8428166b510239C");

// Check authorization
const isAuthorized = await contract.isAuthorizedAgent("0xAAEBC1441323B8ad6Bdf6793A8428166b510239C");
console.log("Agent authorized:", isAuthorized);

// Revoke if needed
await contract.revokeAgentWallet("0xAAEBC1441323B8ad6Bdf6793A8428166b510239C");
```

## Multiple Agent Wallets

You can authorize multiple agent wallets for redundancy:

```javascript
// Authorize primary backend
await contract.authorizeAgentWallet("0xPrimaryBackendWallet");

// Authorize backup backend
await contract.authorizeAgentWallet("0xBackupBackendWallet");

// Authorize load balancer
await contract.authorizeAgentWallet("0xLoadBalancerWallet");
```

## Important Notes

### Contract Behavior

- **Contract Name**: After upgrade, the contract name remains "GenImNFTv2" (proxy behavior)
- **Token Metadata**: All existing token URIs and ownership are preserved
- **Backward Compatibility**: All V3 functions continue to work
- **Security Fix**: Only authorized agents can now call `requestImageUpdate()`
- **No User Action Required**: Token owners don't need to do anything

### Storage Changes

- **Added**: `mapping(address => bool) private _whitelistedAgentWallets` (1 slot)
- **Modified**: `__gap` array reduced by 1 slot (from 49 to 48)
- **Preserved**: All V3 state variables unchanged

### EIP-8004 Compatibility

The agent whitelist system follows EIP-8004 Trustless Agents naming conventions:

- Function names: `authorizeAgentWallet()`, `revokeAgentWallet()`, `isAuthorizedAgent()`
- Event names: `AgentWalletAuthorized`, `AgentWalletRevoked`
- Terminology: "Agent" instead of "Updater"

This makes the contract compatible with future Identity/Reputation Registry systems.

## Testing

Run the comprehensive test suites:

```bash
# Test upgrade mechanics
npx hardhat test test/GenImNFTv4_Upgrade.ts

# Test business logic
npx hardhat test test/GenImNFTv4_Functional.ts

# Run all v4 tests
npx hardhat test test/GenImNFTv4_*.ts
```

## Deployment Info

After successful upgrade, deployment info is saved to:

```
scripts/deployments/genimg-v4-upgrade-{network}-{date}.json
```

Example:

```json
{
  "network": "optimism",
  "chainId": 10,
  "timestamp": "2025-11-27T10:30:00.000Z",
  "blockNumber": 144314071,
  "upgradeType": "GenImNFTv3 → GenImNFTv4",
  "securityFix": "CVE-2025-11-26",
  "proxyAddress": "0x80f95d330417a4acEfEA415FE9eE28db7A0A1Cdb",
  "implementationAddress": "0xNewV4ImplementationAddress",
  "deployer": "0xYourDeployerAddress",
  "gasUsed": "1234567",
  "authorizedAgent": "0xAAEBC1441323B8ad6Bdf6793A8428166b510239C",
  "config": { /* your config */ }
}
```

## Next Steps After Upgrade

1. ✅ Verify the upgrade on Optimistic Etherscan
2. ✅ Test new V4 authorization functions
3. ✅ Update your backend to use authorized wallet
4. ✅ Update frontend/dApp ABI to GenImNFTv4
5. ✅ Monitor for unauthorized update attempts (should be blocked)
6. ✅ Announce security fix to your users

## Troubleshooting

### Config Validation Errors

**"Invalid Ethereum address format"**

```bash
# Ensure addresses are checksummed (0xABC... not 0xabc...)
# Use ethers.getAddress() or a checksum tool
```

**"Config validation failed"**

```bash
# Check JSON syntax
# Verify all required fields are present
# Ensure types match schema (boolean for flags, string for addresses)
```

### Proxy Registration Issues

**"Deployment at address 0x... is not registered"**

- The script **automatically handles this** via `forceImport`
- If you still see this error, check that the current implementation is actually GenImNFTv3

### Storage Layout Issues

**"Storage layout is incompatible"**

- This indicates a breaking change in storage structure
- V4 is designed to be compatible with V3
- If you see this, do NOT proceed - contact support

### Gas Estimation Errors

```bash
# Increase gas limit in hardhat.config.ts for your network
optimism: {
  gas: 8000000,
  gasPrice: 1000000
}
```

## Rollback Plan

UUPS proxies **cannot be rolled back** once upgraded. Therefore:

1. **Always test on Sepolia first**
2. **Run validation and dry-run modes**
3. **Verify on testnet before mainnet**
4. **Have multiple authorized agents** for redundancy

## Security Considerations

### CVE-2025-11-26 Mitigation

After upgrade:

- ❌ Attacker `0x8B6B008A0073D34D04ff00210E7200Ab00003300` can no longer steal payments
- ❌ Front-running `requestImageUpdate()` is now impossible
- ✅ Only authorized agents can update images
- ✅ Owner controls agent authorization

### Agent Wallet Security

- 🔐 Use hardware wallets or secure key management for agent wallets
- 🔐 Rotate agent wallets regularly
- 🔐 Monitor agent authorization events
- 🔐 Authorize multiple agents for redundancy
- 🔐 Revoke compromised agents immediately

### Owner Security

- 🔐 The owner account can authorize/revoke agents
- 🔐 Protect your owner private key with hardware wallet
- 🔐 Consider using a multisig for owner role
- 🔐 Monitor `AgentWalletAuthorized` events for unauthorized changes

## Support

For issues or questions:

1. Check test files for examples: `test/GenImNFTv4_*.ts`
2. Review `SECURITY_FIX_v4.md` for security details
3. Check deployment info JSON for audit trail
4. Review Etherscan transaction history

## References

- [OpenZeppelin UUPS Upgrades](https://docs.openzeppelin.com/contracts/4.x/api/proxy#UUPSUpgradeable)
- [EIP-1967: Proxy Storage Slots](https://eips.ethereum.org/EIPS/eip-1967)
- [EIP-8004: Trustless Agents](https://eips.ethereum.org/EIPS/eip-8004)
- [CVE-2025-11-26 Details](./SECURITY_FIX_v4.md)
