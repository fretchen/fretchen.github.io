#!/usr/bin/env npx hardhat run
import { ethers, upgrades, network } from "hardhat";
import * as fs from "fs";
import * as path from "path";
import { z } from "zod";
import { getAddress, formatEther, parseEther } from "viem";

// Minimum ETH balance required for deployment (0.03 ETH)
const MIN_DEPLOYMENT_BALANCE = parseEther("0.03");

// Zod Schema für Validierung
const SupportV2DeployConfigSchema = z.object({
  parameters: z.object({
    owner: z
      .string()
      .optional()
      .refine((addr) => {
        if (!addr || addr === "") return true;
        try {
          getAddress(addr);
          return true;
        } catch {
          return false;
        }
      }, "Invalid owner address format"),
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
  }),
});

type SupportV2DeployConfig = z.infer<typeof SupportV2DeployConfigSchema>;

/**
 * Load SupportV2 deployment configuration
 */
function loadConfig(): SupportV2DeployConfig {
  const configPath = path.join(__dirname, "deploy-support-v2.config.json");

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

  let config: SupportV2DeployConfig;
  try {
    config = SupportV2DeployConfigSchema.parse(configRaw);
  } catch (error: unknown) {
    if (error instanceof Error) {
      throw new Error(`Config validation failed: ${error.message}`);
    }
    throw error;
  }

  console.log("✅ Configuration loaded and validated");
  return config;
}

/**
 * Validate deployment without deploying
 */
async function validateDeployment(): Promise<void> {
  console.log("🔍 Validating SupportV2 contract...");

  // Check deployer balance
  const [deployer] = await ethers.getSigners();
  await checkDeployerBalance(deployer);

  try {
    const SupportV2Factory = await ethers.getContractFactory("SupportV2");
    console.log("✅ Contract compiles successfully");

    await upgrades.validateImplementation(SupportV2Factory, {
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
 * Check if deployer has sufficient ETH balance for deployment
 */
async function checkDeployerBalance(deployer: { address: string; provider: { getBalance: (addr: string) => Promise<bigint> } }): Promise<void> {
  const balance = await deployer.provider.getBalance(deployer.address);
  const balanceFormatted = formatEther(balance);
  const minFormatted = formatEther(MIN_DEPLOYMENT_BALANCE);

  console.log(`💰 Deployer Balance: ${balanceFormatted} ETH`);
  console.log(`📊 Minimum Required: ${minFormatted} ETH`);

  if (balance < MIN_DEPLOYMENT_BALANCE) {
    const deficit = MIN_DEPLOYMENT_BALANCE - balance;
    throw new Error(
      `Insufficient funds for deployment!\n` +
      `   Balance: ${balanceFormatted} ETH\n` +
      `   Required: ${minFormatted} ETH\n` +
      `   Deficit: ${formatEther(deficit)} ETH\n\n` +
      `   Please fund ${deployer.address} with at least ${formatEther(deficit)} ETH.\n` +
      `   Faucets:\n` +
      `   - Optimism Sepolia: https://www.alchemy.com/faucets/optimism-sepolia\n` +
      `   - Base Sepolia: https://www.alchemy.com/faucets/base-sepolia`
    );
  }

  console.log("✅ Sufficient balance for deployment");
}

/**
 * Simulate deployment (dry run)
 */
async function simulateDeployment(config: SupportV2DeployConfig): Promise<void> {
  console.log("🧪 Simulating SupportV2 deployment...");

  const [deployer] = await ethers.getSigners();
  const ownerAddress = config.parameters.owner || deployer.address;

  // Check deployer balance
  await checkDeployerBalance(deployer);

  console.log("");
  console.log("📋 Deployment parameters:");
  console.log(`  - Network: ${network.name}`);
  console.log(`  - Owner: ${ownerAddress}`);
  console.log("");
  console.log("📦 What would happen:");
  console.log("  1. Deploy SupportV2 implementation");
  console.log("  2. Deploy ERC1967 proxy");
  console.log("  3. Initialize with owner");
  console.log("");
  console.log("✅ Simulation complete (no actual deployment)");
}

/**
 * Deploy SupportV2 using OpenZeppelin Upgrades Plugin
 *
 * Usage:
 * - Optimism Sepolia: npx hardhat run scripts/deploy-support-v2.ts --network optsepolia
 * - Optimism Mainnet: npx hardhat run scripts/deploy-support-v2.ts --network optimisticEthereum
 * - Base Sepolia: npx hardhat run scripts/deploy-support-v2.ts --network baseSepolia
 * - Base Mainnet: npx hardhat run scripts/deploy-support-v2.ts --network base
 */
async function deploySupportV2() {
  console.log("🚀 SupportV2 Deployment Script");
  console.log("=".repeat(60));
  console.log(`Network: ${network.name}`);
  console.log(`Block: ${await ethers.provider.getBlockNumber()}`);
  console.log("");

  const config = loadConfig();
  const options = config.options;

  // Validation only mode
  if (options.validateOnly) {
    console.log("🔍 Validation Only Mode");
    return await validateDeployment();
  }

  // Dry run mode
  if (options.dryRun) {
    console.log("🧪 Dry Run Mode");
    return await simulateDeployment(config);
  }

  // Get deployer
  const [deployer] = await ethers.getSigners();
  const ownerAddress = config.parameters.owner || deployer.address;

  console.log(`👤 Deployer: ${deployer.address}`);
  console.log(`👑 Owner: ${ownerAddress}`);
  console.log("");

  // Check deployer balance before anything else
  console.log("💰 Checking Deployer Balance");
  console.log("-".repeat(40));
  await checkDeployerBalance(deployer);
  console.log("");

  // Get contract factory
  console.log("📦 Getting SupportV2 contract factory...");
  const SupportV2Factory = await ethers.getContractFactory("SupportV2");

  // Pre-deployment validation
  console.log("🔍 Pre-Deployment Validation");
  console.log("-".repeat(40));

  try {
    await upgrades.validateImplementation(SupportV2Factory, {
      kind: "uups",
    });
    console.log("✅ OpenZeppelin upgrade validation passed");
  } catch (error: unknown) {
    console.error("❌ Pre-deployment validation failed:");
    throw error;
  }

  // Deploy
  console.log("");
  console.log("🚀 Deploying SupportV2...");

  const SupportV2 = await upgrades.deployProxy(SupportV2Factory, [ownerAddress], {
    kind: "uups",
    initializer: "initialize",
  });

  await SupportV2.waitForDeployment();
  const proxyAddress = await SupportV2.getAddress();
  const implementationAddress = await upgrades.erc1967.getImplementationAddress(proxyAddress);

  console.log("✅ SupportV2 deployed successfully!");
  console.log("=".repeat(60));
  console.log(`📍 Proxy Address: ${proxyAddress}`);
  console.log(`📍 Implementation Address: ${implementationAddress}`);
  console.log("");

  // Save deployment info
  const deploymentInfo = {
    network: network.name,
    proxyAddress,
    implementationAddress,
    owner: ownerAddress,
    deployedAt: new Date().toISOString(),
    version: config.metadata.version,
  };

  const deploymentPath = path.join(__dirname, `../deployments/support-v2-${network.name}.json`);

  // Ensure deployments directory exists
  const deploymentsDir = path.dirname(deploymentPath);
  if (!fs.existsSync(deploymentsDir)) {
    fs.mkdirSync(deploymentsDir, { recursive: true });
  }

  fs.writeFileSync(deploymentPath, JSON.stringify(deploymentInfo, null, 2));
  console.log(`📄 Deployment info saved to: ${deploymentPath}`);

  // Verification reminder
  if (options.verify) {
    console.log("");
    console.log("📋 Verification Commands:");
    console.log("-".repeat(40));
    console.log(`npx hardhat verify --network ${network.name} ${implementationAddress}`);
  }

  console.log("");
  console.log("🎉 Deployment complete!");

  return { proxyAddress, implementationAddress };
}

// Execute
deploySupportV2()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
