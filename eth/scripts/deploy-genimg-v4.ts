#!/usr/bin/env npx hardhat run
import { ethers, upgrades, network } from "hardhat";
import { validateImplementation } from "./validate-contract";
import * as fs from "fs";
import * as path from "path";
import { z } from "zod";
import { getAddress, formatEther, parseEther } from "viem";

// Minimum ETH balance required for deployment (0.03 ETH)
const MIN_DEPLOYMENT_BALANCE = parseEther("0.03");

// Zod Schema für Validierung
const GenImV4DeployConfigSchema = z.object({
  parameters: z.object({
    mintPrice: z.string(), // in ETH, e.g., "0.01"
    agentWallet: z
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
  }),
  options: z.object({
    validateOnly: z.boolean(),
    dryRun: z.boolean(),
    // TODO: Remove verify flag - use scripts/verify-contract.ts instead (DRY principle)
    verify: z.boolean(),
    waitConfirmations: z.number().optional(),
  }),
  metadata: z.object({
    description: z.string(),
    version: z.string(),
    environment: z.string(),
  }),
});

// TypeScript-Typ automatisch aus Zod-Schema generieren
type GenImV4DeployConfig = z.infer<typeof GenImV4DeployConfigSchema>;

/**
 * Load GenImNFTv4 deployment configuration
 */
function loadConfig(): GenImV4DeployConfig {
  const configPath = path.join(__dirname, "deploy-genimg-v4.config.json");

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
  let config: GenImV4DeployConfig;
  try {
    config = GenImV4DeployConfigSchema.parse(configRaw);
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
 * Check if deployer has sufficient ETH balance for deployment
 */
async function checkDeployerBalance(deployer: {
  address: string;
  provider: { getBalance: (addr: string) => Promise<bigint> };
}): Promise<void> {
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
        `   - Base Sepolia: https://www.alchemy.com/faucets/base-sepolia`,
    );
  }

  console.log("✅ Sufficient balance for deployment");
}

/**
 * Validate deployment without deploying
 */
async function validateDeployment(): Promise<void> {
  console.log("🔍 Validating GenImNFTv4 contract...");

  // Check deployer balance
  const [deployer] = await ethers.getSigners();
  await checkDeployerBalance(deployer);

  try {
    const GenImNFTv4Factory = await ethers.getContractFactory("GenImNFTv4");

    // Validate contract bytecode
    console.log("✅ Contract compiles successfully");

    // Validate OpenZeppelin upgradeable patterns
    await upgrades.validateImplementation(GenImNFTv4Factory, {
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
async function simulateDeployment(config: GenImV4DeployConfig): Promise<void> {
  console.log("🧪 Simulating GenImNFTv4 deployment...");

  const [deployer] = await ethers.getSigners();

  // Check deployer balance
  await checkDeployerBalance(deployer);

  console.log("");
  console.log("📋 Deployment parameters:");
  console.log(`  - Network: ${network.name}`);
  console.log(`  - Mint Price: ${config.parameters.mintPrice} ETH`);
  console.log(`  - Agent Wallet: ${config.parameters.agentWallet || "Not specified (can be set after deployment)"}`);
  console.log("");
  console.log("📦 What would happen:");
  console.log("  1. Deploy GenImNFTv4 implementation");
  console.log("  2. Deploy ERC1967 proxy");
  console.log("  3. Initialize contract");
  console.log("  4. Set mint price");
  if (config.parameters.agentWallet) {
    console.log("  5. Authorize agent wallet");
  }
  console.log("");
  console.log("✅ Simulation complete (no actual deployment)");
}

/**
 * Deploy GenImNFTv4 using OpenZeppelin Upgrades Plugin
 *
 * Usage examples:
 * - Deploy to Optimism Sepolia: npx hardhat run scripts/deploy-genimg-v4.ts --network optsepolia
 * - Deploy to Optimism Mainnet: npx hardhat run scripts/deploy-genimg-v4.ts --network optimisticEthereum
 * - Deploy locally: npx hardhat run scripts/deploy-genimg-v4.ts --network hardhat
 * - Validation only: Set validateOnly: true in config
 * - Dry run: Set dryRun: true in config
 *
 * Configuration is loaded from deploy-genimg-v4.config.json
 */
async function deployGenImV4() {
  console.log("🚀 GenImNFTv4 Deployment Script");
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
    return await validateDeployment();
  }

  // Check if dry run
  if (options.dryRun) {
    console.log("🧪 Dry Run Mode - Simulation only");
    return await simulateDeployment(config);
  }

  // Get deployer
  const [deployer] = await ethers.getSigners();
  console.log(`👤 Deployer: ${deployer.address}`);
  console.log("");

  // Check deployer balance before anything else
  console.log("💰 Checking Deployer Balance");
  console.log("-".repeat(40));
  await checkDeployerBalance(deployer);
  console.log("");

  // Get contract factory
  console.log("📦 Getting GenImNFTv4 contract factory...");
  const GenImNFTv4Factory = await ethers.getContractFactory("GenImNFTv4");

  // Pre-deployment validation
  console.log("🔍 Pre-Deployment Validation");
  console.log("-".repeat(40));

  try {
    await upgrades.validateImplementation(GenImNFTv4Factory, {
      kind: "uups",
    });
    console.log("✅ OpenZeppelin upgrade validation passed");
  } catch (error: unknown) {
    console.error("❌ Pre-deployment validation failed:");
    throw error;
  }

  // Deploy the upgradeable contract
  console.log("");
  console.log("🚀 Deploying GenImNFTv4...");
  console.log(`📋 Mint Price: ${parameters.mintPrice} ETH`);
  console.log("");

  const GenImNFTv4 = await upgrades.deployProxy(GenImNFTv4Factory, [], {
    kind: "uups",
    initializer: "initialize",
  });

  await GenImNFTv4.waitForDeployment();
  const proxyAddress = await GenImNFTv4.getAddress();

  console.log("✅ GenImNFTv4 deployed successfully!");
  console.log("=".repeat(60));
  console.log(`📍 Proxy Address: ${proxyAddress}`);
  console.log(`📍 Implementation Address: ${await upgrades.erc1967.getImplementationAddress(proxyAddress)}`);
  console.log(`📍 Admin Address: ${await upgrades.erc1967.getAdminAddress(proxyAddress)}`);
  console.log("");

  // Post-deployment configuration
  console.log("⚙️  Post-Deployment Configuration");
  console.log("-".repeat(40));

  const deployedContract = GenImNFTv4Factory.attach(proxyAddress);

  // Set mint price if different from default
  const mintPriceWei = ethers.parseEther(parameters.mintPrice);
  const currentMintPrice = await deployedContract.mintPrice();

  if (mintPriceWei !== currentMintPrice) {
    console.log(`Setting mint price to ${parameters.mintPrice} ETH...`);
    const tx = await deployedContract.setMintPrice(mintPriceWei);
    await tx.wait(options.waitConfirmations || 1);
    console.log(`✅ Mint price set to ${parameters.mintPrice} ETH`);
  } else {
    console.log(`✅ Mint price already set to ${parameters.mintPrice} ETH`);
  }

  // Authorize agent wallet if provided
  if (parameters.agentWallet) {
    console.log(`Authorizing agent wallet: ${parameters.agentWallet}...`);
    const tx = await deployedContract.authorizeAgentWallet(parameters.agentWallet);
    await tx.wait(options.waitConfirmations || 1);
    console.log(`✅ Agent wallet authorized: ${parameters.agentWallet}`);
  } else {
    console.log("⚠️  No agent wallet specified - remember to authorize one later");
  }

  console.log("");

  // Verify deployment
  console.log("🔍 Verifying deployment...");
  const implementationAddress = await upgrades.erc1967.getImplementationAddress(proxyAddress);

  console.log(`📄 Contract deployed at: ${proxyAddress}`);

  // Verify implementation contract
  console.log("🔧 Verifying implementation contract...");
  const implementationCode = await ethers.provider.getCode(implementationAddress);
  if (implementationCode === "0x") {
    throw new Error(`No contract code found at implementation address: ${implementationAddress}`);
  }
  console.log(`✅ Implementation contract verified (${implementationCode.length} bytes)`);

  // Test implementation contract ABI compatibility
  try {
    GenImNFTv4Factory.attach(implementationAddress);
    console.log("✅ Implementation contract ABI compatible");
  } catch (error: unknown) {
    if (error instanceof Error) {
      console.log("⚠️  Warning: Could not attach ABI to implementation contract:", error.message);
    } else {
      console.log("⚠️  Warning: Could not attach ABI to implementation contract:", error);
    }
  }

  // Verify proxy state
  console.log("🔍 Verifying proxy state...");
  const owner = await deployedContract.owner();
  console.log(`✅ Owner: ${owner}`);
  console.log(`✅ Deployer: ${deployer.address}`);

  if (owner !== deployer.address) {
    throw new Error(`Owner mismatch: expected ${deployer.address}, got ${owner}`);
  }

  const mintPrice = await deployedContract.mintPrice();
  console.log(`✅ Mint Price: ${ethers.formatEther(mintPrice)} ETH`);

  const name = await deployedContract.name();
  const symbol = await deployedContract.symbol();
  console.log(`✅ Name: ${name}`);
  console.log(`✅ Symbol: ${symbol}`);

  console.log("✅ All verifications passed!");
  console.log("");

  // Create deployment info
  const deploymentInfo = {
    network: network.name,
    timestamp: new Date().toISOString(),
    blockNumber: await ethers.provider.getBlockNumber(),
    proxyAddress: proxyAddress,
    implementationAddress: await upgrades.erc1967.getImplementationAddress(proxyAddress),
    adminAddress: await upgrades.erc1967.getAdminAddress(proxyAddress),
    contractType: "GenImNFTv4",
    owner: owner,
    mintPrice: ethers.formatEther(mintPrice),
    agentWallet: parameters.agentWallet || null,
    deploymentOptions: {
      verify: options.verify || false,
      waitConfirmations: options.waitConfirmations || 1,
      configUsed: "deploy-genimg-v4.config.json",
    },
    config: config,
  };

  console.log("📋 Deployment Summary:");
  console.log(JSON.stringify(deploymentInfo, null, 2));

  // Save deployment information to file
  const deploymentsDir = path.join(__dirname, "../deployments");
  if (!fs.existsSync(deploymentsDir)) {
    fs.mkdirSync(deploymentsDir, { recursive: true });
  }

  const deploymentFileName = `genimg-v4-${network.name}.json`;
  const deploymentFilePath = path.join(deploymentsDir, deploymentFileName);

  fs.writeFileSync(deploymentFilePath, JSON.stringify(deploymentInfo, null, 2));
  console.log(`💾 Deployment info saved to: ${deploymentFilePath}`);

  // Comprehensive validation using validate-contract functions
  console.log("\n🔍 Running comprehensive validation...");
  try {
    await validateImplementation(deploymentInfo.implementationAddress, "GenImNFTv4");
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
    console.log("📝 Use the verify-genimg-v4.ts script or Hardhat verify command");
  }

  console.log("\n✅ Deployment completed successfully!");
  console.log("=".repeat(60));
  console.log("\n📝 Next Steps:");
  console.log("1. Save the proxy address for your frontend/backend configuration");
  if (!parameters.agentWallet) {
    console.log("2. Authorize your agent wallet using: authorizeAgentWallet(address)");
  }
  console.log("3. Test minting: safeMint(address, uri)");
  console.log("4. Verify contracts on Etherscan if needed");

  return { proxyAddress, implementationAddress: deploymentInfo.implementationAddress };
}

// Export for testing
export { deployGenImV4, MIN_DEPLOYMENT_BALANCE, GenImV4DeployConfigSchema };

// Execute only when run directly (not imported)
if (require.main === module) {
  deployGenImV4()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}
