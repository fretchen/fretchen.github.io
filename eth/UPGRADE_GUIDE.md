# GenImNFTv2 Upgrade Guide

This document explains how to upgrade the GenImNFTv2 contract using the provided Ignition modules.

## Overview

The GenImNFTv2 contract uses the UUPS (Universal Upgradeable Proxy Standard) pattern, which allows for seamless upgrades while preserving the contract's state and address.

## Available Modules

### 1. Initial Deployment (`GenImNFTv2.ts`)
Deploys a new proxy with the GenImNFTv2 implementation.

```bash
npx hardhat ignition deploy ./ignition/modules/GenImNFTv2.ts --network sepolia
```

### 2. Simple Upgrade (`GenImNFTv2_Upgrade.ts`)
Upgrades an existing proxy to a new implementation without calling any initialization functions.

```bash
npx hardhat ignition deploy ./ignition/modules/GenImNFTv2_Upgrade.ts \
  --network sepolia \
  --parameters '{"proxyAddress": "0xYourExistingProxyAddress"}'
```

## Upgrade Process

### Prerequisites
1. Ensure you have the private key of the contract owner
2. The owner account must have enough ETH for gas fees
3. Test the upgrade on a testnet first

### Step-by-Step Guide

1. **Prepare the new implementation**
   - Make your changes to the `GenImNFTv2.sol` contract
   - Ensure storage layout compatibility (see Storage Layout section)
   - Test thoroughly

2. **Deploy to testnet first**
   ```bash
   # Deploy to Sepolia testnet first
   npx hardhat ignition deploy ./ignition/modules/GenImNFTv2_Upgrade.ts \
     --network sepolia \
     --parameters '{"proxyAddress": "0xTestnetProxyAddress"}'
   ```

3. **Verify the upgrade worked**
   - Call contract functions to ensure they work as expected
   - Check that existing data is preserved
   - Test new functionality

4. **Deploy to mainnet**
   ```bash
   # Only after thorough testing!
   npx hardhat ignition deploy ./ignition/modules/GenImNFTv2_Upgrade.ts \
     --network mainnet \
     --parameters '{"proxyAddress": "0xMainnetProxyAddress"}'
   ```

## Storage Layout Compatibility

⚠️ **CRITICAL**: When upgrading, you must maintain storage layout compatibility.

### Safe Changes:
- ✅ Adding new storage variables at the end
- ✅ Adding new functions
- ✅ Modifying function logic (keeping signatures the same)
- ✅ Adding new events

### Unsafe Changes:
- ❌ Changing the order of existing storage variables
- ❌ Changing the type of existing storage variables
- ❌ Removing storage variables
- ❌ Adding storage variables in the middle

### Current Storage Layout:
```solidity
uint256 private _nextTokenId;                           // Slot 0
uint256 public mintPrice;                               // Slot 1
mapping(uint256 => address) private _authorizedImageUpdaters;  // Slot 2
mapping(uint256 => bool) private _imageUpdated;               // Slot 3
uint256[50] private __gap;                              // Slots 4-53 (reserved)
```

## Example Upgrade Scenarios

### Scenario 1: Bug Fix
If you need to fix a bug in the contract logic:
1. Fix the bug in the contract code
2. Use the simple upgrade module
3. No initialization needed

### Scenario 2: Adding New Features
If you're adding new features that require initialization:
1. Add new features to the contract
2. Add new storage variables at the end (after __gap)
3. Reduce __gap size accordingly
4. Use the simple upgrade module

### Scenario 3: Parameter Updates
If you need to update contract parameters after upgrade:
1. Use the simple upgrade module first
2. Call appropriate setter functions manually after the upgrade

## Emergency Procedures

### Pause Contract (if implemented)
If your contract has pause functionality:
```bash
npx hardhat console --network sepolia
> const contract = await ethers.getContractAt("GenImNFTv2", "0xProxyAddress")
> await contract.pause()  // If pause function exists
```

### Quick Rollback
If an upgrade fails and you need to rollback:
1. Keep the previous implementation address
2. Call `upgradeTo(previousImplementationAddress)` from the owner account

## Verification

After any upgrade, verify:
1. Contract owner is correct: `await contract.owner()`
2. Basic functions work: `await contract.name()`, `await contract.symbol()`
3. Mint price is correct: `await contract.mintPrice()`
4. Total supply is preserved: `await contract.totalSupply()`
5. Existing tokens are accessible: `await contract.ownerOf(tokenId)`

## Troubleshooting

### Common Issues:
1. **"Ownable: caller is not the owner"**
   - Ensure you're using the correct owner account
   - Check that the owner hasn't been transferred

2. **Storage collision errors**
   - Review storage layout changes
   - Ensure no variables were reordered or changed types

3. **Function selector collisions**
   - Check for function signature conflicts
   - Ensure new functions don't override existing ones

## Security Checklist

Before any upgrade:
- [ ] Code has been audited or thoroughly reviewed
- [ ] Storage layout compatibility verified
- [ ] Tested on testnet with real data
- [ ] Gas costs estimated and acceptable
- [ ] Emergency procedures documented
- [ ] Rollback plan prepared
- [ ] Team notified of maintenance window

## Contact Information

For urgent issues during upgrades, contact:
- Lead Developer: [Your Contact Info]
- Smart Contract Team: [Team Contact Info]
