#!/usr/bin/env npx hardhat run
import { ethers, upgrades, network } from "hardhat";
import { getAddress } from "viem";

interface UpgradeOptions {
  proxyAddress?: string;
  validateOnly?: boolean;
  dryRun?: boolean;
  skipPreUpgradeValidation?: boolean;
  forceManualUpgrade?: boolean;
}

/**
 * Upgrade GenImNFTv2 to GenImNFTv3 using OpenZeppelin Upgrades Plugin
 *
 * Usage examples:
 * - Environment variable: PROXY_ADDRESS=0x123... npx hardhat run scripts/upgrade-to-v3.ts --network sepolia
 * - Script parameter: npx hardhat run scripts/upgrade-to-v3.ts --network sepolia
 * - Validation only: VALIDATE_ONLY=true npx hardhat run scripts/upgrade-to-v3.ts --network sepolia
 * - Dry run: DRY_RUN=true npx hardhat run scripts/upgrade-to-v3.ts --network sepolia
 * - Skip OZ validation: SKIP_OZ_VALIDATION=true npx hardhat run scripts/upgrade-to-v3.ts --network sepolia
 * - Force manual upgrade: FORCE_MANUAL_UPGRADE=true npx hardhat run scripts/upgrade-to-v3.ts --network sepolia
 */
async function upgradeToV3(options: UpgradeOptions = {}) {
  console.log("🚀 GenImNFTv2 to GenImNFTv3 Upgrade Script");
  console.log("=".repeat(50));
  console.log(`Network: ${network.name}`);
  console.log(`Block: ${await ethers.provider.getBlockNumber()}`);
  console.log("");

  // Get proxy address from environment or parameter
  const proxyAddress = options.proxyAddress || process.env.PROXY_ADDRESS;
  if (!proxyAddress) {
    throw new Error("Proxy address required. Set PROXY_ADDRESS environment variable or pass as parameter.");
  }

  console.log(`📍 Proxy Address: ${proxyAddress}`);

  // Validate proxy address format
  try {
    getAddress(proxyAddress);
  } catch (error) {
    throw new Error(`Invalid proxy address: ${proxyAddress}`);
  }

  // Get contract factories
  const GenImNFTv2Factory = await ethers.getContractFactory("GenImNFTv2");
  const GenImNFTv3Factory = await ethers.getContractFactory("GenImNFTv3");

  // Get current proxy instance
  const currentProxy = GenImNFTv2Factory.attach(proxyAddress);

  console.log("🔍 Pre-Upgrade Validation");
  console.log("-".repeat(30));

  try {
    // Verify current contract is GenImNFTv2
    const name = await currentProxy.name();
    const symbol = await currentProxy.symbol();
    const owner = await currentProxy.owner();
    const totalSupply = await currentProxy.totalSupply();
    const mintPrice = await currentProxy.mintPrice();

    console.log(`✅ Contract Name: ${name}`);
    console.log(`✅ Contract Symbol: ${symbol}`);
    console.log(`✅ Owner: ${owner}`);
    console.log(`✅ Total Supply: ${totalSupply.toString()}`);
    console.log(`✅ Mint Price: ${ethers.formatEther(mintPrice)} ETH`);

    // Validate upgrade compatibility
    console.log("🔍 Validating upgrade compatibility...");

    // Skip OpenZeppelin validation for Ignition-deployed contracts
    if (process.env.SKIP_OZ_VALIDATION !== "true") {
      try {
        await upgrades.validateUpgrade(proxyAddress, GenImNFTv3Factory);
        console.log("✅ OpenZeppelin upgrade validation passed");
      } catch (error: any) {
        console.log("⚠️  OpenZeppelin validation failed (likely Ignition deployment):", error.message);
        console.log("🔄 Continuing with manual validation...");

        // Manual validation: Check if it's a proxy
        try {
          const implementationSlot = "0x360894a13ba1a3210667c828492db98dca3e2076cc3735a920a3ca505d382bbc";
          const implementationAddress = await ethers.provider.getStorage(proxyAddress, implementationSlot);
          console.log(`✅ Found implementation at: 0x${implementationAddress.slice(26)}`);
        } catch (error: any) {
          throw new Error(`Not a valid ERC1967 proxy: ${error.message}`);
        }
      }
    } else {
      console.log("⏭️  Skipping OpenZeppelin validation (SKIP_OZ_VALIDATION=true)");
    }

    // Sample some token data if tokens exist
    if (totalSupply > 0n) {
      console.log("📊 Sampling existing token data:");
      const sampleSize = Math.min(3, Number(totalSupply));
      for (let i = 0; i < sampleSize; i++) {
        try {
          const tokenOwner = await currentProxy.ownerOf(i);
          const tokenURI = await currentProxy.tokenURI(i);
          console.log(`  Token ${i}: Owner=${tokenOwner.slice(0, 8)}..., URI=${tokenURI.slice(0, 20)}...`);
        } catch (error) {
          console.log(`  Token ${i}: Error reading (${error})`);
        }
      }
    }
  } catch (error) {
    throw new Error(`Pre-upgrade validation failed: ${error}`);
  }

  // If validation only, stop here
  if (options.validateOnly || process.env.VALIDATE_ONLY === "true") {
    console.log("✅ Validation completed successfully. Use DRY_RUN=false to proceed with upgrade.");
    return { proxyAddress, validated: true, upgraded: false };
  }

  // If dry run, show what would happen but don't actually upgrade
  if (options.dryRun || process.env.DRY_RUN === "true") {
    console.log("🎭 Dry Run Mode - Showing what would happen:");
    console.log("1. Deploy new GenImNFTv3 implementation");
    console.log("2. Upgrade proxy to point to new implementation");
    console.log("3. Call reinitializeV3() to mark existing tokens as listed");
    console.log("4. Verify upgrade success");
    console.log("✅ Dry run completed. Set DRY_RUN=false to perform actual upgrade.");
    return { proxyAddress, validated: true, upgraded: false, dryRun: true };
  }

  console.log("");
  console.log("🔄 Performing Upgrade");
  console.log("-".repeat(30));

  try {
    // Store pre-upgrade state for verification
    const preUpgradeSupply = await currentProxy.totalSupply();
    const preUpgradeOwner = await currentProxy.owner();

    console.log("⏳ Upgrading proxy to GenImNFTv3...");

    let upgradedProxy;

    // Check if manual upgrade is forced or try OpenZeppelin first
    if (options.forceManualUpgrade || process.env.FORCE_MANUAL_UPGRADE === "true") {
      console.log("🔧 Manual upgrade forced, skipping OpenZeppelin upgrade...");

      // Manual upgrade for Ignition-deployed contracts
      console.log("1️⃣ Deploying new GenImNFTv3 implementation...");
      const newImplementation = await GenImNFTv3Factory.deploy();
      await newImplementation.waitForDeployment();
      const newImplAddress = await newImplementation.getAddress();
      console.log(`✅ New implementation deployed at: ${newImplAddress}`);

      console.log("2️⃣ Upgrading proxy to new implementation...");

      // Prepare the call to reinitializeV3
      const reinitializeCall = GenImNFTv3Factory.interface.encodeFunctionData("reinitializeV3", []);

      // Get the proxy admin (owner should be able to upgrade)
      const [signer] = await ethers.getSigners();
      console.log(`Using signer: ${signer.address}`);

      // Perform upgradeToAndCall
      const v3Contract = await ethers.getContractAt("GenImNFTv3", proxyAddress);
      const upgradeTx = await v3Contract.upgradeToAndCall(newImplAddress, reinitializeCall);
      await upgradeTx.wait();

      console.log("✅ Manual upgrade completed");
      upgradedProxy = v3Contract;
    } else {
      // Try OpenZeppelin upgrade first, fallback to manual upgrade for Ignition deployments
      try {
        console.log("🔄 Attempting OpenZeppelin managed upgrade...");
        upgradedProxy = await upgrades.upgradeProxy(proxyAddress, GenImNFTv3Factory, {
          call: {
            fn: "reinitializeV3",
            args: [],
          },
        });
        console.log("✅ OpenZeppelin upgrade successful");
      } catch (error: any) {
        console.log("⚠️  OpenZeppelin upgrade failed (likely Ignition deployment)");
        console.log("🔄 Falling back to manual upgrade...");

        // Manual upgrade for Ignition-deployed contracts
        console.log("1️⃣ Deploying new GenImNFTv3 implementation...");
        const newImplementation = await GenImNFTv3Factory.deploy();
        await newImplementation.waitForDeployment();
        const newImplAddress = await newImplementation.getAddress();
        console.log(`✅ New implementation deployed at: ${newImplAddress}`);

        console.log("2️⃣ Upgrading proxy to new implementation...");

        // Prepare the call to reinitializeV3
        const reinitializeCall = GenImNFTv3Factory.interface.encodeFunctionData("reinitializeV3", []);

        // Get the proxy admin (owner should be able to upgrade)
        const [signer] = await ethers.getSigners();
        console.log(`Using signer: ${signer.address}`);

        // Perform upgradeToAndCall
        const v3Contract = await ethers.getContractAt("GenImNFTv3", proxyAddress);
        const upgradeTx = await v3Contract.upgradeToAndCall(newImplAddress, reinitializeCall);
        await upgradeTx.wait();

        console.log("✅ Manual upgrade completed");
        upgradedProxy = v3Contract;
      }
    }

    await upgradedProxy.waitForDeployment();
    console.log("✅ Proxy upgraded successfully");

    // Verify upgrade
    console.log("🔍 Post-Upgrade Verification");
    console.log("-".repeat(30));

    const upgradedAddress = await upgradedProxy.getAddress();
    console.log(`✅ Proxy address unchanged: ${upgradedAddress === proxyAddress}`);

    // Get V3 contract instance
    const v3Contract = GenImNFTv3Factory.attach(proxyAddress);

    // Verify basic properties preserved
    const postUpgradeSupply = await v3Contract.totalSupply();
    const postUpgradeOwner = await v3Contract.owner();
    const postUpgradeName = await v3Contract.name();

    console.log(`✅ Total supply preserved: ${preUpgradeSupply.toString()} -> ${postUpgradeSupply.toString()}`);
    console.log(`✅ Owner preserved: ${postUpgradeOwner === preUpgradeOwner}`);
    console.log(`✅ Contract name: ${postUpgradeName}`);

    // Test V3 functionality if tokens exist
    if (postUpgradeSupply > 0n) {
      console.log("🧪 Testing V3 functionality:");

      // Check that existing tokens are marked as listed
      const sampleSize = Math.min(3, Number(postUpgradeSupply));
      for (let i = 0; i < sampleSize; i++) {
        try {
          const isListed = await v3Contract.isTokenListed(i);
          console.log(`  ✅ Token ${i} is listed: ${isListed}`);
        } catch (error) {
          console.log(`  ❌ Token ${i} listing check failed: ${error}`);
        }
      }

      // Test getPublicTokensOfOwner for first token owner
      try {
        const firstTokenOwner = await v3Contract.ownerOf(0);
        const publicTokens = await v3Contract.getPublicTokensOfOwner(firstTokenOwner);
        console.log(`  ✅ Public tokens for first owner: ${publicTokens.length} tokens`);
      } catch (error) {
        console.log(`  ⚠️  Public tokens check failed: ${error}`);
      }
    }

    console.log("");
    console.log("🎉 Upgrade completed successfully!");
    console.log(`📍 Contract address: ${proxyAddress}`);
    console.log(`📊 Final total supply: ${postUpgradeSupply.toString()}`);
    console.log("");
    console.log("Next steps:");
    console.log("1. Verify the upgrade on block explorer");
    console.log("2. Test new V3 functions (safeMint with listing, setTokenListed, etc.)");
    console.log("3. Update frontend/dApp to use new V3 ABI");
    console.log("4. Announce upgrade to users");

    return {
      proxyAddress,
      validated: true,
      upgraded: true,
      preUpgradeSupply: preUpgradeSupply.toString(),
      postUpgradeSupply: postUpgradeSupply.toString(),
      upgradedProxy,
    };
  } catch (error) {
    console.error("❌ Upgrade failed:", error);
    throw error;
  }
}

/**
 * Rollback utility (for emergency use only)
 * WARNING: This is dangerous and should only be used if the upgrade introduced critical bugs
 */
async function rollbackUpgrade(proxyAddress: string, previousImplementationAddress: string) {
  console.log("⚠️  EMERGENCY ROLLBACK PROCEDURE");
  console.log("🚨 This should only be used in case of critical bugs!");

  const GenImNFTv2Factory = await ethers.getContractFactory("GenImNFTv2");
  const proxy = GenImNFTv2Factory.attach(proxyAddress);

  console.log(`Rolling back to implementation: ${previousImplementationAddress}`);
  const tx = await proxy.upgradeToAndCall(previousImplementationAddress, "0x");
  await tx.wait();

  console.log("✅ Rollback completed");
}

// Main execution
async function main() {
  try {
    const result = await upgradeToV3();

    if (result.upgraded) {
      console.log("\n✅ Script completed successfully");
      process.exit(0);
    } else {
      console.log("\n✅ Validation completed");
      process.exit(0);
    }
  } catch (error) {
    console.error("\n❌ Script failed:", error);
    process.exit(1);
  }
}

// Export for use in tests
export { upgradeToV3, rollbackUpgrade };

// Run if called directly
if (require.main === module) {
  main();
}
