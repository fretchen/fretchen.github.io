# GenImNFTv3 Upgrade Guide
## Overview
This guide explains how to upgrade an existing GenImNFTv2 proxy contract to GenImNFTv3 using the **OpenZeppelin Hardhat Upgrades Plugin**. This is the recommended approach due to its safety features, automatic validation, and proven reliability.## Prerequisites- An existing GenImNFTv2 proxy contract deployed on your target network- The proxy address- Access to the owner account that can perform upgrades- OpenZeppelin Hardhat Upgrades Plugin installed (`@openzeppelin/hardhat-upgrades`)## Why OpenZeppelin Upgrades Plugin?✅ **Automatic Storage Layout Validation**: Prevents storage conflicts  ✅ **Built-in Safety Checks**: Validates upgrade compatibility  ✅ **Atomic Operations**: Upgrade and initialization in one transaction  ✅ **Battle-tested**: Used by thousands of projects in production  ✅ **Simple API**: Clean, straightforward upgrade process  ## Upgrade FeaturesGenImNFTv3 adds the following new features to GenImNFTv2:

### New Functionality

- **Listing Control**: Tokens can be marked as publicly listed or private- **Enhanced Minting**: New `safeMint(string, bool)` function with listing option- **Batch Operations**: `setMultipleTokensListed()` for batch listing updates- **Public Token Queries**: `getPublicTokensOfOwner()` to get only publicly listed tokens### Backward Compatibility- All existing GenImNFTv2 functions remain available- Existing tokens are automatically marked as "listed" (opt-out system)- Original `safeMint(string)` function defaults to publicly listed tokens## Upgrade Implementation### Using TypeScript/Hardhat ScriptCreate a script file `scripts/upgrade-to-v3.ts`:```typescriptimport { ethers, upgrades } from "hardhat";async function main() {  const proxyAddress = "0xYourExistingProxyAddress"; // Replace with your proxy address    console.log("Upgrading GenImNFT from V2 to V3...");    // Get the GenImNFTv3 contract factory  const GenImNFTv3Factory = await ethers.getContractFactory("GenImNFTv3");    // Perform the upgrade with automatic initialization  const upgradedProxy = await upgrades.upgradeProxy(    proxyAddress,    GenImNFTv3Factory,    {      call: {        fn: "reinitializeV3",        args: []      }    }  );    await upgradedProxy.waitForDeployment();    console.log("✅ Upgrade completed!");  console.log("Proxy address:", await upgradedProxy.getAddress());    // Verify the upgrade worked  const totalSupply = await upgradedProxy.totalSupply();  console.log("Total supply after upgrade:", totalSupply.toString());    if (totalSupply > 0) {    const isFirstTokenListed = await upgradedProxy.isTokenListed(0);    console.log("First token is listed:", isFirstTokenListed);  }}main()  .then(() => process.exit(0))  .catch((error) => {    console.error(error);    process.exit(1);  });```### Using Hardhat Console (Interactive)```bashnpx hardhat console --network <your-network>```In the console:```javascriptconst { ethers, upgrades } = require("hardhat");// Your existing proxy addressconst proxyAddress = "0xYourExistingProxyAddress";// Get contract factoryconst GenImNFTv3Factory = await ethers.getContractFactory("GenImNFTv3");// Perform upgrade with initializationconst proxy = await upgrades.upgradeProxy(  proxyAddress,  GenImNFTv3Factory,  {    call: {      fn: "reinitializeV3",      args: []    }  });console.log("Upgrade completed! Proxy at:", await proxy.getAddress());```## Running the Upgrade### Step 1: Test on Testnet First```bash# Deploy to testnet firstnpx hardhat run scripts/upgrade-to-v3.ts --network sepolia```### Step 2: Production Upgrade```bash# Only after successful testnet validationnpx hardhat run scripts/upgrade-to-v3.ts --network mainnet```## What Happens During Upgrade1. **Validation Phase**: OpenZeppelin plugin validates storage compatibility2. **Implementation Deployment**: New GenImNFTv3 implementation is deployed3. **Proxy Update**: Proxy's implementation pointer is updated4. **Initialization**: `reinitializeV3()` runs automatically, marking existing tokens as listed5. **Verification**: Plugin verifies the upgrade completed successfully## Testing the UpgradeUse the comprehensive test suite:```bash# Run the OpenZeppelin upgrade testsnpx hardhat test test/GenImNFTv3_OpenZeppelin_Upgrade.ts```The test suite covers:- ✅ Successful V2 to V3 upgrade- ✅ Data preservation during upgrade  - ✅ V3 functionality after upgrade- ✅ Implementation address changes- ✅ Reinitializer execution- ✅ Storage compatibility## Post-Upgrade Verification### Manual Verification Commands

```bash
npx hardhat console --network <your-network>
```

```javascript
const GenImNFTv3 = await ethers.getContractFactory("GenImNFTv3");
const proxy = GenImNFTv3.attach("0xYourProxyAddress");

// 1. Check total supply is preserved
const totalSupply = await proxy.totalSupply();
console.log("Total supply:", totalSupply.toString());

// 2. Verify existing tokens are marked as listed
if (totalSupply > 0) {
  for (let i = 0; i < Math.min(5, totalSupply); i++) {
    const isListed = await proxy.isTokenListed(i);
    console.log(`Token ${i} is listed:`, isListed);
  }
}

// 3. Test new V3 functions
const owner = "0xSomeOwnerAddress";
const publicTokens = await proxy.getPublicTokensOfOwner(owner);
console.log("Public tokens:", publicTokens);

// 4. Test backward compatibility
const name = await proxy.name();
const symbol = await proxy.symbol();
console.log("Name:", name, "Symbol:", symbol);
```

## Important Safety Notes

### Storage Compatibility
- ✅ GenImNFTv3 is storage-compatible with GenImNFTv2
- ✅ OpenZeppelin plugin automatically validates this
- ✅ All existing data is preserved during upgrade
- ✅ New storage variables are safely appended

### Reinitializer Function
The `reinitializeV3()` function:
- Uses `reinitializer(3)` modifier to run only once
- Marks all existing tokens as publicly listed
- Emits `TokenListingChanged` events for transparency
- Cannot be called again after upgrade

### Owner Permissions
- Only the contract owner can perform the upgrade
- The upgrade is irreversible
- Always test on testnets before mainnet

## Troubleshooting

### Common Issues

1. **"Proxy admin owner mismatch" Error**
   - Ensure you're using the correct owner account
   - Verify the proxy admin ownership

2. **Storage Layout Conflict**
   - This would be caught by OpenZeppelin plugin validation
   - Do not override plugin warnings

3. **"Function does not exist" After Upgrade**
   - Clear Hardhat cache: `npx hardhat clean`
   - Recompile contracts: `npx hardhat compile`

### Validation Checklist

- [ ] Test upgrade on testnet successfully
- [ ] Verify total supply unchanged
- [ ] Confirm existing token ownership preserved
- [ ] Test `isTokenListed()` returns `true` for existing tokens
- [ ] Verify new V3 functions work (e.g., `getPublicTokensOfOwner`)
- [ ] Confirm backward compatibility (original functions still work)

## Example Usage After Upgrade

```javascript
// All V2 functions still work (backward compatible)
await proxy.safeMint("ipfs://token-uri", { value: mintPrice });

// New V3 functions
await proxy["safeMint(string,bool)"]("ipfs://private-token", false, { value: mintPrice });
await proxy.setTokenListed(tokenId, false); // Make private
await proxy.setMultipleTokensListed([1, 2, 3], true); // Batch operations
const publicTokens = await proxy.getPublicTokensOfOwner(ownerAddress);
```

## Advanced: Upgrade Script with Error Handling

```typescript
import { ethers, upgrades } from "hardhat";

async function upgradeWithValidation() {
  const proxyAddress = process.env.PROXY_ADDRESS;
  if (!proxyAddress) {
    throw new Error("PROXY_ADDRESS environment variable required");
  }

  try {
    console.log("🔍 Validating upgrade...");
    const GenImNFTv3Factory = await ethers.getContractFactory("GenImNFTv3");
    
    // Validate before upgrading
    await upgrades.validateUpgrade(proxyAddress, GenImNFTv3Factory);
    console.log("✅ Upgrade validation passed");
    
    // Get pre-upgrade state
    const currentProxy = await ethers.getContractAt("GenImNFTv2", proxyAddress);
    const preUpgradeTotalSupply = await currentProxy.totalSupply();
    console.log("📊 Pre-upgrade total supply:", preUpgradeTotalSupply.toString());
    
    // Perform upgrade
    console.log("🚀 Performing upgrade...");
    const upgradedProxy = await upgrades.upgradeProxy(
      proxyAddress,
      GenImNFTv3Factory,
      {
        call: {
          fn: "reinitializeV3",
          args: []
        }
      }
    );
    
    await upgradedProxy.waitForDeployment();
    
    // Verify post-upgrade state
    const postUpgradeTotalSupply = await upgradedProxy.totalSupply();
    console.log("📊 Post-upgrade total supply:", postUpgradeTotalSupply.toString());
    
    if (preUpgradeTotalSupply.toString() !== postUpgradeTotalSupply.toString()) {
      throw new Error("Total supply mismatch after upgrade!");
    }
    
    console.log("🎉 Upgrade completed successfully!");
    return upgradedProxy;
    
  } catch (error) {
    console.error("❌ Upgrade failed:", error);
    throw error;
  }
}
```

## Support

If you encounter issues:

1. **Check OpenZeppelin plugin documentation**: https://docs.openzeppelin.com/upgrades-plugins/
2. **Run the test suite**: `npx hardhat test test/GenImNFTv3_OpenZeppelin_Upgrade.ts`
3. **Validate on testnet first**: Always test before mainnet
4. **Review transaction logs**: Check for revert reasons or events
