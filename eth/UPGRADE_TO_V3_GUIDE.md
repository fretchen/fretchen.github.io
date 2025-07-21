# GenImNFTv3 Upgrade Guide

## Overview

This guide explains how to upgrade an existing GenImNFTv2 proxy contract to GenImNFTv3 using the production upgrade script at `scripts/upgrade-to-v3.ts`.

## Prerequisites

- An existing GenImNFTv2 proxy contract deployed on your target network
- The proxy address
- Access to the owner account that can perform upgrades
- OpenZeppelin Hardhat Upgrades Plugin installed (`@openzeppelin/hardhat-upgrades`)

## New Features in GenImNFTv3

GenImNFTv3 adds listing control functionality to GenImNFTv2:

- **Listing Control**: Tokens can be marked as publicly listed or private
- **Enhanced Minting**: New `safeMint(string, bool)` function with listing option
- **Batch Operations**: `setMultipleTokensListed()` for batch listing updates
- **Public Token Queries**: `getPublicTokensOfOwner()` to get only publicly listed tokens

All existing GenImNFTv2 functions remain available, and existing tokens are automatically marked as "listed" during upgrade.

## Upgrade Process

The upgrade script provides comprehensive safety features with three execution modes:

### Step 1: Validation (Required First Step)

Validate upgrade compatibility without executing:

```bash
PROXY_ADDRESS=0xYourProxyAddress VALIDATE_ONLY=true npx hardhat run scripts/upgrade-to-v3.ts --network sepolia
```

### Step 2: Dry Run (Recommended)

Preview what the upgrade would do without executing:

```bash
PROXY_ADDRESS=0xYourProxyAddress DRY_RUN=true npx hardhat run scripts/upgrade-to-v3.ts --network sepolia
```

### Step 3: Execute Upgrade

Perform the actual upgrade:

```bash
PROXY_ADDRESS=0xYourProxyAddress npx hardhat run scripts/upgrade-to-v3.ts --network sepolia
```

## Environment Variables

| Variable               | Description                                             | Required            |
| ---------------------- | ------------------------------------------------------- | ------------------- |
| `PROXY_ADDRESS`        | Address of your GenImNFTv2 proxy contract               | Yes                 |
| `VALIDATE_ONLY`        | Only validate compatibility, don't upgrade              | No (default: false) |
| `DRY_RUN`              | Preview changes without executing                       | No (default: false) |
| `SKIP_OZ_VALIDATION`   | Skip OpenZeppelin validation (for Ignition deployments) | No (default: false) |
| `FORCE_MANUAL_UPGRADE` | Force manual upgrade method (for Ignition deployments)  | No (default: false) |

## Example Workflow

### Testing on Sepolia (Recommended)

```bash
# 1. Validate compatibility
PROXY_ADDRESS=0x1234567890abcdef... VALIDATE_ONLY=true npx hardhat run scripts/upgrade-to-v3.ts --network sepolia

# 2. Preview changes
PROXY_ADDRESS=0x1234567890abcdef... DRY_RUN=true npx hardhat run scripts/upgrade-to-v3.ts --network sepolia

# 3. Execute upgrade
PROXY_ADDRESS=0x1234567890abcdef... npx hardhat run scripts/upgrade-to-v3.ts --network sepolia
```

### Production Upgrade

Only proceed to mainnet after successful testnet testing:

```bash
PROXY_ADDRESS=0xYourMainnetProxyAddress npx hardhat run scripts/upgrade-to-v3.ts --network mainnet
```

## Script Features

The upgrade script provides:

- ✅ **Pre-upgrade validation** of proxy address and compatibility
- ✅ **Storage layout safety checks** to prevent data corruption
- ✅ **Token data sampling** for verification
- ✅ **Comprehensive post-upgrade verification**
- ✅ **Detailed logging** and error handling

## Post-Upgrade Verification

After upgrade, the script automatically verifies:

- Proxy address remains unchanged
- Total supply is preserved
- Existing tokens are marked as listed
- V3 functionality works correctly

## Testing

Run the comprehensive test suite to validate upgrade functionality:

```bash
npx hardhat test test/GenImNFTv3_OpenZeppelin_Upgrade.ts
```

## What Happens During Upgrade

1. **Validation**: Script validates proxy and checks compatibility
2. **Implementation Deployment**: New GenImNFTv3 implementation is deployed
3. **Proxy Update**: Proxy's implementation pointer is updated to V3
4. **Initialization**: `reinitializeV3()` runs, marking existing tokens as listed
5. **Verification**: Script confirms upgrade success and tests functionality

## Important Notes

- **Contract Name**: After upgrade, the contract name remains "GenImNFTv2" (proxy behavior)
- **Token Metadata**: All existing token URIs and ownership are preserved
- **Backward Compatibility**: All V2 functions continue to work
- **Default Behavior**: New tokens are listed by default unless specified otherwise

## Next Steps After Upgrade

1. Verify the upgrade on your block explorer
2. Test new V3 functions (`setTokenListed`, `getPublicTokensOfOwner`, etc.)
3. Update your frontend/dApp to use the new V3 ABI
4. Announce the upgrade to your users

## Troubleshooting

### For Ignition-Deployed Contracts

If you deployed your contract using Hardhat Ignition (instead of OpenZeppelin Upgrades Plugin), you may encounter registration errors. Use these options:

#### Skip OpenZeppelin Validation

```bash
PROXY_ADDRESS=0xYourProxyAddress SKIP_OZ_VALIDATION=true npx hardhat run scripts/upgrade-to-v3.ts --network sepolia
```

#### Force Manual Upgrade Method

```bash
PROXY_ADDRESS=0xYourProxyAddress FORCE_MANUAL_UPGRADE=true npx hardhat run scripts/upgrade-to-v3.ts --network sepolia
```

#### Combined for Ignition Deployments

```bash
PROXY_ADDRESS=0xYourProxyAddress SKIP_OZ_VALIDATION=true FORCE_MANUAL_UPGRADE=true npx hardhat run scripts/upgrade-to-v3.ts --network sepolia
```

### Common Error Messages

#### "Deployment at address 0x... is not registered"

- This indicates an Ignition-deployed contract
- Use `FORCE_MANUAL_UPGRADE=true` to bypass OpenZeppelin registry

#### "Pre-upgrade validation failed"

- Use `SKIP_OZ_VALIDATION=true` to skip OpenZeppelin-specific validation
- The script will perform manual ERC1967 proxy validation instead

## Troubleshooting

### For Ignition-Deployed Contracts

If you deployed your contract using Hardhat Ignition (instead of OpenZeppelin Upgrades Plugin), you may encounter registration errors. Use these options:

#### Skip OpenZeppelin Validation

```bash
PROXY_ADDRESS=0xYourProxyAddress SKIP_OZ_VALIDATION=true npx hardhat run scripts/upgrade-to-v3.ts --network sepolia
```

#### Force Manual Upgrade Method

```bash
PROXY_ADDRESS=0xYourProxyAddress FORCE_MANUAL_UPGRADE=true npx hardhat run scripts/upgrade-to-v3.ts --network sepolia
```

#### Combined for Ignition Deployments

```bash
PROXY_ADDRESS=0xYourProxyAddress SKIP_OZ_VALIDATION=true FORCE_MANUAL_UPGRADE=true npx hardhat run scripts/upgrade-to-v3.ts --network sepolia
```

### Common Error Messages

**"Deployment at address 0x... is not registered"**

- This indicates an Ignition-deployed contract
- Use `FORCE_MANUAL_UPGRADE=true` to bypass OpenZeppelin registry

**"Pre-upgrade validation failed"**

- Use `SKIP_OZ_VALIDATION=true` to skip OpenZeppelin-specific validation
- The script will perform manual ERC1967 proxy validation instead
