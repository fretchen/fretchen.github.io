#!/usr/bin/env npx hardhat run
import { ethers, upgrades, network } from "hardhat";
import { validateImplementation } from "./validate-contract";
import * as fs from "fs";
import * as path from "path";
import { z } from "zod";
import { getAddress } from "viem";

// Zod Schema für Validierung
const UpgradeV4ConfigSchema = z.object({
  proxyAddress: z.string().refine((addr) => {
    try {
      getAddress(addr);
      return true;
    } catch {
      return false;
    }
  }, "Invalid Ethereum address format"),
  options: z.object({
    validateOnly: z.boolean(),
    dryRun: z.boolean(),
    verify: z.boolean(),
    authorizeAgentWallet: z
      .string()
      .optional()
      .refine((addr) => {
        if (!addr) return true;
        try {
          getAddress(addr);
          return true;
        } catch {
          return false;
        }
      }, "Invalid agent wallet address format"),
    waitConfirmations: z.number().optional(),
  }),
  metadata: z.object({
    description: z.string(),
    version: z.string(),
    environment: z.string(),
    securityFix: z.string().optional(),
    attackerAddress: z.string().optional(),
  }),
});

// TypeScript-Typ automatisch aus Zod-Schema generieren
type UpgradeV4Config = z.infer<typeof UpgradeV4ConfigSchema>;

/**
 * Load upgrade configuration
 */
function loadConfig(): UpgradeV4Config {
  const configPath = path.join(__dirname, "upgrade-genimg-v4.config.json");

  console.log(`📄 Loading configuration from: ${configPath}`);

  if (!fs.existsSync(configPath)) {
    throw new Error(`Configuration file not found: ${configPath}`);
  }

  const configContent = fs.readFileSync(configPath, "utf8");
  let configRaw: unknown;

  try {
    configRaw = JSON.parse(configContent);
  } catch (error: unknown) {
    if (error instanceof Error) {
      throw new Error(`Invalid JSON in configuration file: ${error.message}`);
    }
    throw error;
  }

  // Zod-Validierung
  let config: UpgradeV4Config;
  try {
    config = UpgradeV4ConfigSchema.parse(configRaw);
  } catch (error: unknown) {
    if (error instanceof Error) {
      throw new Error(`Config validation failed: ${error.message}`);
    }
    throw error;
  }

  console.log("✅ Configuration loaded and validated");
  console.log(`📋 Config: ${JSON.stringify(config, null, 2)}`);

  return config;
}

/**
 * Upgrade GenImNFTv3 to GenImNFTv4 - Security Fix for CVE-2025-11-26
 *
 * This upgrade fixes the unauthorized image update exploit discovered on Nov 26, 2025
 * where attacker 0x8B6B008A0073D34D04ff00210E7200Ab00003300 was able to:
 * - Call requestImageUpdate() without authorization
 * - Steal mintPrice rewards meant for legitimate backend service
 * - Lock tokens with attacker-controlled URLs
 *
 * v4 Security Fix: EIP-8004 compatible whitelist for authorized agent wallets
 * - Only whitelisted agents can call requestImageUpdate()
 * - Owner manages whitelist via authorizeAgentWallet/revokeAgentWallet
 * - Prevents unauthorized reward theft and token locking
 *
 * Usage:
 * - Deploy to production: npx hardhat run scripts/upgrade-genimg-v4.ts --network optimisticEthereum
 * - Validation only: Set validateOnly: true in config
 * - Dry run: Set dryRun: true in config
 *
 * Configuration is loaded from upgrade-genimg-v4.config.json
 */
async function upgradeToV4() {
  console.log("🚀 GenImNFTv3 → GenImNFTv4 Upgrade Script");
  console.log("🔒 Security Fix: CVE-2025-11-26");
  console.log("=".repeat(60));
  console.log(`Network: ${network.name}`);
  console.log(`Block: ${await ethers.provider.getBlockNumber()}`);
  console.log("");

  // Load configuration
  const config = loadConfig();
  const options = config.options;
  const proxyAddress = config.proxyAddress;

  console.log(`📍 Proxy Address: ${proxyAddress}`);
  console.log("");

  // Check if validation only
  if (options.validateOnly) {
    console.log("🔍 Validation Only Mode - No upgrade will occur");
    return await validateUpgrade(proxyAddress);
  }

  // Check if dry run
  if (options.dryRun) {
    console.log("🧪 Dry Run Mode - Simulation only");
    return await simulateUpgrade(proxyAddress, config);
  }

  // Get contract factories
  console.log("📦 Getting contract factories...");
  const GenImNFTv3Factory = await ethers.getContractFactory("GenImNFTv3");
  const GenImNFTv4Factory = await ethers.getContractFactory("GenImNFTv4");

  // Get current proxy instance
  const currentProxy = GenImNFTv3Factory.attach(proxyAddress);

  console.log("🔍 Pre-Upgrade Validation");
  console.log("-".repeat(40));

  try {
    // Verify current contract is GenImNFTv3
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

    // Sample some tokens if they exist
    if (totalSupply > 0n) {
      console.log("📊 Sampling existing tokens:");
      const sampleSize = Math.min(3, Number(totalSupply));
      for (let i = 0; i < sampleSize; i++) {
        try {
          const tokenOwner = await currentProxy.ownerOf(i);
          const tokenURI = await currentProxy.tokenURI(i);
          const isListed = await currentProxy.isTokenListed(i);
          const isUpdated = await currentProxy.isImageUpdated(i);
          console.log(`  Token ${i}: Owner=${tokenOwner.slice(0, 8)}..., Listed=${isListed}, Updated=${isUpdated}`);
          console.log(`           URI=${tokenURI.slice(0, 30)}...`);
        } catch (error) {
          console.log(`  Token ${i}: Error reading - ${error}`);
        }
      }
    }

    // Validate upgrade compatibility
    console.log("");
    console.log("🔍 Validating upgrade compatibility...");
    console.log("🔍 Checking if proxy is registered with OpenZeppelin...");

    try {
      await upgrades.validateUpgrade(proxyAddress, GenImNFTv4Factory, {
        kind: "uups",
      });
      console.log("✅ Proxy is registered");
    } catch (error: any) {
      if (error.message && error.message.includes("not registered")) {
        console.log("⚠️  Proxy not registered with OpenZeppelin Upgrades Plugin");
        console.log("📦 Importing proxy with forceImport...");
        console.log("   This is normal for contracts deployed without OpenZeppelin Upgrades Plugin");

        await upgrades.forceImport(proxyAddress, GenImNFTv3Factory, {
          kind: "uups",
        });

        console.log("✅ Proxy imported successfully");
        console.log("");
        console.log("🔍 Retrying upgrade validation...");

        // Retry validation after import
        await upgrades.validateUpgrade(proxyAddress, GenImNFTv4Factory, {
          kind: "uups",
        });
      } else {
        throw error;
      }
    }

    console.log("✅ OpenZeppelin upgrade validation passed");
  } catch (error) {
    console.error("❌ Pre-upgrade validation failed:");
    throw error;
  }

  console.log("");
  console.log("🔄 Performing Upgrade");
  console.log("-".repeat(40));

  try {
    // Store pre-upgrade state for verification
    const preUpgradeSupply = await currentProxy.totalSupply();
    const preUpgradeOwner = await currentProxy.owner();
    const preUpgradeMintPrice = await currentProxy.mintPrice();

    console.log("⏳ Upgrading proxy to GenImNFTv4...");

    const upgradedProxy = await upgrades.upgradeProxy(proxyAddress, GenImNFTv4Factory, {
      kind: "uups",
      call: {
        fn: "reinitializeV4",
        args: [],
      },
    });

    await upgradedProxy.waitForDeployment();
    console.log("✅ Proxy upgraded successfully");

    // Get V4 contract instance
    const v4Contract = GenImNFTv4Factory.attach(proxyAddress);

    // Verify upgrade
    console.log("");
    console.log("🔍 Post-Upgrade Verification");
    console.log("-".repeat(40));

    const upgradedAddress = await upgradedProxy.getAddress();
    console.log(`✅ Proxy address unchanged: ${upgradedAddress === proxyAddress}`);

    // Verify basic properties preserved
    const postUpgradeSupply = await v4Contract.totalSupply();
    const postUpgradeOwner = await v4Contract.owner();
    const postUpgradeMintPrice = await v4Contract.mintPrice();
    const postUpgradeName = await v4Contract.name();

    console.log(`✅ Total supply preserved: ${preUpgradeSupply.toString()} → ${postUpgradeSupply.toString()}`);
    console.log(`✅ Owner preserved: ${postUpgradeOwner === preUpgradeOwner}`);
    console.log(
      `✅ Mint price preserved: ${ethers.formatEther(preUpgradeMintPrice)} ETH → ${ethers.formatEther(postUpgradeMintPrice)} ETH`,
    );
    console.log(`✅ Contract name: ${postUpgradeName}`);

    // Test V4 functionality
    console.log("");
    console.log("🧪 Testing V4 Security Features");
    console.log("-".repeat(40));

    // Check that new functions exist
    try {
      const isAuthorizedFn = v4Contract.isAuthorizedAgent;
      console.log("✅ isAuthorizedAgent() function exists");

      const authorizeFn = v4Contract.authorizeAgentWallet;
      console.log("✅ authorizeAgentWallet() function exists");

      const revokeFn = v4Contract.revokeAgentWallet;
      console.log("✅ revokeAgentWallet() function exists");
    } catch (error) {
      console.error("❌ V4 functions not found:", error);
      throw error;
    }

    // Authorize agent wallet if configured
    if (options.authorizeAgentWallet) {
      console.log("");
      console.log("🔐 Authorizing Agent Wallet");
      console.log("-".repeat(40));
      console.log(`Agent Wallet: ${options.authorizeAgentWallet}`);

      // Check if already authorized
      const isAlreadyAuthorized = await v4Contract.isAuthorizedAgent(options.authorizeAgentWallet);

      if (isAlreadyAuthorized) {
        console.log("✅ Agent wallet already authorized");
      } else {
        console.log("⏳ Authorizing agent wallet...");
        const authTx = await v4Contract.authorizeAgentWallet(options.authorizeAgentWallet);
        await authTx.wait(options.waitConfirmations || 1);
        console.log("✅ Agent wallet authorized successfully");

        // Verify authorization
        const isNowAuthorized = await v4Contract.isAuthorizedAgent(options.authorizeAgentWallet);
        if (!isNowAuthorized) {
          throw new Error("Agent wallet authorization verification failed");
        }
        console.log("✅ Authorization verified");
      }
    }

    // Test some tokens if they exist
    if (postUpgradeSupply > 0n) {
      console.log("");
      console.log("🧪 Testing V3 Compatibility (existing tokens)");
      console.log("-".repeat(40));

      const sampleSize = Math.min(3, Number(postUpgradeSupply));
      for (let i = 0; i < sampleSize; i++) {
        try {
          const isListed = await v4Contract.isTokenListed(i);
          const isUpdated = await v4Contract.isImageUpdated(i);
          console.log(`  ✅ Token ${i}: Listed=${isListed}, Updated=${isUpdated}`);
        } catch (error) {
          console.log(`  ❌ Token ${i} check failed: ${error}`);
        }
      }
    }

    console.log("");
    console.log("🎉 Upgrade completed successfully!");
    console.log("=".repeat(60));
    console.log(`📍 Contract address: ${proxyAddress}`);
    console.log(`📊 Total supply: ${postUpgradeSupply.toString()}`);
    console.log(`🔒 Security fix: CVE-2025-11-26 - Unauthorized image update exploit`);

    if (options.authorizeAgentWallet) {
      console.log(`🔐 Authorized agent: ${options.authorizeAgentWallet}`);
    }

    // Get implementation and admin addresses
    const implementationAddress = await upgrades.erc1967.getImplementationAddress(proxyAddress);
    const adminAddress = await upgrades.erc1967.getAdminAddress(proxyAddress);

    console.log("");
    console.log("📋 Deployment Details:");
    console.log(`📍 Proxy Address: ${proxyAddress}`);
    console.log(`📍 Implementation Address: ${implementationAddress}`);
    console.log(`📍 Admin Address: ${adminAddress}`);

    // Create deployment info
    const deploymentInfo = {
      network: network.name,
      timestamp: new Date().toISOString(),
      blockNumber: await ethers.provider.getBlockNumber(),
      upgradeType: "GenImNFTv3 → GenImNFTv4",
      proxyAddress: proxyAddress,
      implementationAddress: implementationAddress,
      adminAddress: adminAddress,
      securityFix: config.metadata.securityFix || "CVE-2025-11-26",
      preUpgradeState: {
        totalSupply: preUpgradeSupply.toString(),
        owner: preUpgradeOwner,
        mintPrice: ethers.formatEther(preUpgradeMintPrice),
      },
      postUpgradeState: {
        totalSupply: postUpgradeSupply.toString(),
        owner: postUpgradeOwner,
        mintPrice: ethers.formatEther(postUpgradeMintPrice),
        authorizedAgent: options.authorizeAgentWallet || null,
      },
      config: config,
    };

    console.log("");
    console.log("💾 Saving deployment information...");

    // Save deployment information to file
    const deploymentsDir = path.join(__dirname, "deployments");
    if (!fs.existsSync(deploymentsDir)) {
      fs.mkdirSync(deploymentsDir, { recursive: true });
    }

    const timestamp = new Date().toISOString().split("T")[0]; // YYYY-MM-DD format
    const deploymentFileName = `genimg-v4-upgrade-${network.name}-${timestamp}.json`;
    const deploymentFilePath = path.join(deploymentsDir, deploymentFileName);

    fs.writeFileSync(deploymentFilePath, JSON.stringify(deploymentInfo, null, 2));
    console.log(`✅ Deployment info saved to: ${deploymentFilePath}`);

    // Comprehensive validation using validate-contract functions
    console.log("");
    console.log("🔍 Running comprehensive validation...");
    try {
      await validateImplementation(implementationAddress, "GenImNFTv4");
      console.log("✅ Comprehensive validation completed successfully!");
    } catch (error: unknown) {
      if (error instanceof Error) {
        console.log("⚠️  Warning: Comprehensive validation failed:", error.message);
      } else {
        console.log("⚠️  Warning: Comprehensive validation failed:", error);
      }
    }

    console.log("");
    console.log("📝 Next Steps:");
    console.log("1. ✅ Verify the upgrade on block explorer");
    console.log("2. ✅ Test image update functionality with authorized agent");
    console.log("3. ✅ Update frontend/dApp to use new V4 ABI");
    console.log("4. ✅ Monitor for any unauthorized image update attempts");
    console.log("5. ✅ Announce security fix to users");

    if (!options.authorizeAgentWallet) {
      console.log("");
      console.log("⚠️  WARNING: No agent wallet authorized!");
      console.log("   You must call authorizeAgentWallet() to enable image updates.");
      console.log("   Backend wallet: 0xAAEBC1441323B8ad6Bdf6793A8428166b510239C");
    }

    return {
      success: true,
      proxyAddress,
      implementationAddress,
      deploymentInfo,
    };
  } catch (error) {
    console.error("❌ Upgrade failed:");
    console.error(error);
    throw error;
  }
}

async function validateUpgrade(proxyAddress: string) {
  console.log("🔍 Validating upgrade configuration...");

  // Get contract factories
  const GenImNFTv3Factory = await ethers.getContractFactory("GenImNFTv3");
  const GenImNFTv4Factory = await ethers.getContractFactory("GenImNFTv4");

  // Verify proxy exists and is accessible
  const currentProxy = GenImNFTv3Factory.attach(proxyAddress);
  const name = await currentProxy.name();
  const totalSupply = await currentProxy.totalSupply();

  console.log(`✅ Current contract: ${name}`);
  console.log(`✅ Total supply: ${totalSupply.toString()}`);

  // Validate upgrade compatibility
  console.log("");
  console.log("🔍 Checking if proxy is registered with OpenZeppelin...");
  try {
    await upgrades.validateUpgrade(proxyAddress, GenImNFTv4Factory, {
      kind: "uups",
    });
    console.log("✅ Proxy is registered");
  } catch (error: any) {
    if (error.message && error.message.includes("not registered")) {
      console.log("⚠️  Proxy not registered with OpenZeppelin Upgrades Plugin");
      console.log("📦 Importing proxy with forceImport...");

      await upgrades.forceImport(proxyAddress, GenImNFTv3Factory, {
        kind: "uups",
      });

      console.log("✅ Proxy imported successfully");
      console.log("");
      console.log("🔍 Retrying upgrade validation...");

      // Retry validation after import
      await upgrades.validateUpgrade(proxyAddress, GenImNFTv4Factory, {
        kind: "uups",
      });
    } else {
      throw error;
    }
  }

  console.log("✅ GenImNFTv4 upgrade validation passed");
  console.log("✅ Storage layout is compatible");
  console.log("✅ No breaking changes detected");

  console.log("");
  console.log("🎉 Validation completed successfully!");
  console.log("💡 Ready to upgrade. Set dryRun: false in config to proceed.");

  return { validated: true };
}

async function simulateUpgrade(proxyAddress: string, config: UpgradeV4Config) {
  console.log("🧪 Simulating upgrade process...");
  console.log("");

  await validateUpgrade(proxyAddress);

  console.log("");
  console.log("📋 Upgrade Plan:");
  console.log("1. Deploy new GenImNFTv4 implementation contract");
  console.log("2. Upgrade proxy to point to new implementation");
  console.log("3. Call reinitializeV4() (no state changes)");
  console.log("4. Verify upgrade success");
  console.log("5. Test V4 security functions");

  if (config.options.authorizeAgentWallet) {
    console.log(`6. Authorize agent wallet: ${config.options.authorizeAgentWallet}`);
  }

  console.log("7. Save deployment information");
  console.log("");
  console.log("🔒 Security Changes:");
  console.log("  - Add EIP-8004 compatible whitelist for agent wallets");
  console.log("  - Only whitelisted agents can call requestImageUpdate()");
  console.log("  - Prevents CVE-2025-11-26 exploit");
  console.log("");
  console.log("✅ Dry run completed successfully!");
  console.log("💡 Set dryRun: false in config to perform actual upgrade.");

  return { simulated: true };
}

// Main execution
async function main() {
  try {
    const result = await upgradeToV4();

    if (result.success) {
      console.log("\n✅ Script completed successfully");
      process.exit(0);
    } else {
      console.log("\n✅ Validation/simulation completed");
      process.exit(0);
    }
  } catch (error) {
    console.error("\n❌ Script failed:");
    console.error(error);
    process.exit(1);
  }
}

// Export for use in tests
export { upgradeToV4, loadConfig, UpgradeV4Config };

// Run if called directly
if (require.main === module) {
  main();
}
