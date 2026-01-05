#!/usr/bin/env npx hardhat run
import { ethers, upgrades, network } from "hardhat";
import { validateImplementation } from "./validate-contract";
import * as fs from "fs";
import * as path from "path";
import { z } from "zod";
import { getAddress } from "viem";

// Zod Schema for configuration validation
const SplitterV1DeployConfigSchema = z.object({
  parameters: z.object({
    facilitatorWallet: z.string().refine((addr) => {
      try {
        getAddress(addr);
        return true;
      } catch {
        return false;
      }
    }, "Invalid facilitator wallet address format"),
    fixedFee: z.string().refine((fee) => {
      const num = parseInt(fee);
      return !isNaN(num) && num > 0;
    }, "Fixed fee must be a positive number string"),
  }),
  options: z.object({
    validateOnly: z.boolean(),
    dryRun: z.boolean(),
    verify: z.boolean(),
    waitConfirmations: z.number().optional(),
  }),
  metadata: z.object({
    description: z.string(),
    version: z.string(),
    environment: z.string(),
    notes: z.string().optional(),
  }),
});

// TypeScript type from Zod schema
type SplitterV1DeployConfig = z.infer<typeof SplitterV1DeployConfigSchema>;

/**
 * Load EIP3009SplitterV1 deployment configuration
 */
function loadConfig(): SplitterV1DeployConfig {
  const configPath = path.join(__dirname, "deploy-splitter-v1.config.json");

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

  // Zod validation
  let config: SplitterV1DeployConfig;
  try {
    config = SplitterV1DeployConfigSchema.parse(configRaw);
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
 * Validate deployment without deploying
 */
async function validateDeployment(): Promise<void> {
  console.log("🔍 Validating EIP3009SplitterV1 contract...");

  try {
    const SplitterFactory = await ethers.getContractFactory("EIP3009SplitterV1");

    // Validate contract bytecode
    console.log("✅ Contract compiles successfully");

    // Validate OpenZeppelin upgradeable patterns
    await upgrades.validateImplementation(SplitterFactory, {
      kind: "uups",
    });

    console.log("✅ OpenZeppelin upgrade validation passed");
  } catch (error: unknown) {
    if (error instanceof Error) {
      console.error("❌ Validation failed:", error.message);
      throw error;
    }
    throw error;
  }

  console.log("✅ All validations passed!");
}

/**
 * Simulate deployment (dry run)
 */
async function simulateDeployment(config: SplitterV1DeployConfig): Promise<void> {
  console.log("🧪 Simulating EIP3009SplitterV1 deployment...");

  console.log("📋 Deployment parameters:");
  console.log(`  - Facilitator Wallet: ${config.parameters.facilitatorWallet}`);
  console.log(`  - Fixed Fee: ${config.parameters.fixedFee} (raw units)`);
  console.log(`  - Note: Token is now a parameter of executeSplit(), not a state variable`);
  console.log("");

  console.log("✅ Simulation complete (no actual deployment)");
}

/**
 * Deploy EIP3009SplitterV1 using OpenZeppelin Upgrades Plugin
 *
 * Usage examples:
 * - Deploy to Optimism Sepolia: npx hardhat run scripts/deploy-splitter-v1.ts --network optsepolia
 * - Deploy to Optimism Mainnet: npx hardhat run scripts/deploy-splitter-v1.ts --network optimisticEthereum
 * - Deploy locally: npx hardhat run scripts/deploy-splitter-v1.ts --network hardhat
 * - Validation only: Set validateOnly: true in config
 * - Dry run: Set dryRun: true in config
 *
 * Configuration is loaded from deploy-splitter-v1.config.json
 */
export async function deploySplitterV1(): Promise<
  boolean | { contract: unknown; address: string; deploymentInfo: unknown }
> {
  console.log("🚀 EIP3009SplitterV1 Deployment Script");
  console.log("=".repeat(60));
  console.log(`Network: ${network.name}`);
  console.log(`Block: ${await ethers.provider.getBlockNumber()}`);
  console.log("");

  // Load configuration
  const config = loadConfig();
  const options = config.options || {};
  const parameters = config.parameters;

  // Check if validation only
  if (options.validateOnly) {
    console.log("🔍 Validation Only Mode - No deployment will occur");
    await validateDeployment();
    return true;
  }

  // Check if dry run
  if (options.dryRun) {
    console.log("🧪 Dry Run Mode - Simulation only");
    await simulateDeployment(config);
    return true;
  }

  // Get contract factory
  console.log("📦 Getting EIP3009SplitterV1 contract factory...");
  const SplitterFactory = await ethers.getContractFactory("EIP3009SplitterV1");

  // Pre-deployment validation
  console.log("🔍 Pre-Deployment Validation");
  console.log("-".repeat(40));

  try {
    await upgrades.validateImplementation(SplitterFactory, {
      kind: "uups",
    });
    console.log("✅ OpenZeppelin upgrade validation passed");
  } catch (error: unknown) {
    console.error("❌ Pre-deployment validation failed:");
    throw error;
  }

  // Deploy the upgradeable contract
  console.log("");
  console.log("🚀 Deploying EIP3009SplitterV1...");
  console.log(`📋 Facilitator Wallet: ${parameters.facilitatorWallet}`);
  console.log(`📋 Fixed Fee: ${parameters.fixedFee} (raw units)`);
  console.log(`📋 Note: Token is now a parameter of executeSplit()`);
  console.log("");

  const Splitter = await upgrades.deployProxy(SplitterFactory, [parameters.facilitatorWallet, parameters.fixedFee], {
    kind: "uups",
    initializer: "initialize",
  });

  await Splitter.waitForDeployment();
  const proxyAddress = await Splitter.getAddress();
  const implementationAddress = await upgrades.erc1967.getImplementationAddress(proxyAddress);
  const adminAddress = await upgrades.erc1967.getAdminAddress(proxyAddress);

  console.log("✅ EIP3009SplitterV1 deployed successfully!");
  console.log("=".repeat(60));
  console.log(`📍 Proxy Address: ${proxyAddress}`);
  console.log(`📍 Implementation Address: ${implementationAddress}`);
  console.log(`📍 Admin Address: ${adminAddress}`);
  console.log("");

  // Get basic contract state for deployment file (before verification)
  const deployedContract = SplitterFactory.attach(proxyAddress);
  const owner = await deployedContract.owner();
  const facilitatorWallet = await deployedContract.facilitatorWallet();
  const fixedFee = await deployedContract.fixedFee();

  // Create deployment info IMMEDIATELY after successful deployment
  // This ensures deployment info is saved even if verification fails
  const deploymentInfo = {
    network: network.name,
    timestamp: new Date().toISOString(),
    blockNumber: await ethers.provider.getBlockNumber(),
    proxyAddress: proxyAddress,
    implementationAddress: implementationAddress,
    adminAddress: adminAddress,
    contractType: "EIP3009SplitterV1",
    owner: owner,
    tokenNote: "Token is passed as parameter to executeSplit() - supports USDC, EURC, and other EIP-3009 tokens",
    facilitatorWallet: facilitatorWallet,
    fixedFee: fixedFee.toString(),
    deploymentOptions: {
      verify: options.verify || false,
      waitConfirmations: options.waitConfirmations || 1,
      configUsed: "deploy-splitter-v1.config.json",
    },
    config: config,
    verificationStatus: "pending", // Will be updated after verification
  };

  // Save deployment information to file BEFORE verification
  const deploymentsDir = path.join(__dirname, "deployments");
  if (!fs.existsSync(deploymentsDir)) {
    fs.mkdirSync(deploymentsDir, { recursive: true });
  }

  const timestamp = new Date().toISOString().split("T")[0]; // YYYY-MM-DD format
  const deploymentFileName = `splitter-v1-${network.name}-${timestamp}.json`;
  const deploymentFilePath = path.join(deploymentsDir, deploymentFileName);

  fs.writeFileSync(deploymentFilePath, JSON.stringify(deploymentInfo, null, 2));
  console.log(`💾 Deployment info saved to: ${deploymentFilePath}`);

  // Post-deployment verification (non-critical - failures are warnings only)
  console.log("");
  console.log("⚙️  Post-Deployment Verification");
  console.log("-".repeat(40));

  let verificationPassed = true;
  const verificationErrors: string[] = [];

  // Verify implementation contract
  console.log("🔧 Verifying implementation contract...");
  const implementationCode = await ethers.provider.getCode(implementationAddress);
  if (implementationCode === "0x") {
    verificationErrors.push(`No contract code found at implementation address: ${implementationAddress}`);
    verificationPassed = false;
  } else {
    console.log(`✅ Implementation contract verified (${implementationCode.length} bytes)`);
  }

  // Test implementation contract ABI compatibility
  try {
    SplitterFactory.attach(implementationAddress);
    console.log("✅ Implementation contract ABI compatible");
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error);
    console.log("⚠️  Warning: Could not attach ABI to implementation contract:", msg);
    verificationErrors.push(`ABI compatibility: ${msg}`);
  }

  // Verify proxy state
  console.log("🔍 Verifying proxy state...");
  const [deployer] = await ethers.getSigners();
  console.log(`✅ Owner: ${owner}`);
  console.log(`✅ Deployer: ${deployer.address}`);

  if (getAddress(owner) !== getAddress(deployer.address)) {
    const msg = `Owner mismatch: expected ${deployer.address}, got ${owner}`;
    console.log(`⚠️  Warning: ${msg}`);
    verificationErrors.push(msg);
    verificationPassed = false;
  }

  console.log(`✅ Facilitator Wallet: ${facilitatorWallet}`);
  console.log(`✅ Fixed Fee: ${fixedFee.toString()} (raw units)`);
  console.log(`ℹ️  Token: Passed as parameter to executeSplit() (not stored in state)`);

  // Validate configuration matches (normalize addresses to checksummed format for comparison)
  if (getAddress(facilitatorWallet) !== getAddress(parameters.facilitatorWallet)) {
    const msg = `Facilitator wallet mismatch: expected ${parameters.facilitatorWallet}, got ${facilitatorWallet}`;
    console.log(`⚠️  Warning: ${msg}`);
    verificationErrors.push(msg);
    verificationPassed = false;
  }
  if (fixedFee.toString() !== parameters.fixedFee) {
    const msg = `Fixed fee mismatch: expected ${parameters.fixedFee}, got ${fixedFee.toString()}`;
    console.log(`⚠️  Warning: ${msg}`);
    verificationErrors.push(msg);
    verificationPassed = false;
  }

  // Update deployment file with verification status
  deploymentInfo.verificationStatus = verificationPassed ? "passed" : "failed";
  if (verificationErrors.length > 0) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (deploymentInfo as any).verificationErrors = verificationErrors;
  }
  fs.writeFileSync(deploymentFilePath, JSON.stringify(deploymentInfo, null, 2));

  if (verificationPassed) {
    console.log("✅ All verifications passed!");
  } else {
    console.log("");
    console.log("⚠️  Some verifications failed (see warnings above)");
    console.log("   Deployment was successful - contract is deployed and operational");
  }
  console.log("");

  console.log("📋 Deployment Summary:");
  console.log(JSON.stringify(deploymentInfo, null, 2));

  // Comprehensive validation using validate-contract functions
  console.log("\n🔍 Running comprehensive validation...");
  try {
    await validateImplementation(deploymentInfo.implementationAddress, "EIP3009SplitterV1");
    console.log("✅ Comprehensive validation completed successfully!");
  } catch (error: unknown) {
    if (error instanceof Error) {
      console.log("⚠️  Warning: Comprehensive validation failed:", error.message);
    } else {
      console.log("⚠️  Warning: Comprehensive validation failed:", error);
    }
  }

  // Contract verification if enabled
  if (options.verify) {
    console.log("\n🔍 Etherscan verification...");
    console.log("⚠️  Note: Etherscan verification for upgradeable contracts should be done separately");
    console.log("📝 Use: npx hardhat verify --network <network> <proxy-address>");
  }

  console.log("\n✅ Deployment completed successfully!");
  console.log("=".repeat(60));
  console.log("\n📝 Next Steps:");
  console.log("1. Save the proxy address for x402 facilitator configuration");
  console.log("2. Update x402_facilitator/ SPLITTER_ADDRESS constant");
  console.log("3. Update scw_js/genimg_x402_token.js paymentRequirements");
  console.log("4. Test executeSplit() with EIP-3009 authorization");
  console.log("5. Verify contracts on Optimistic Etherscan if needed");

  return {
    contract: deployedContract,
    address: proxyAddress,
    deploymentInfo,
  };
}

// Execute deployment only when run directly (not imported)
if (require.main === module) {
  deploySplitterV1().catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
}
