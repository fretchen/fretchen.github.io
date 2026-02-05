#!/usr/bin/env npx hardhat run
import { ethers, upgrades, network } from "hardhat";
import { getAddress, formatEther, parseEther } from "viem";
import { validateCollectorNFT, validateImplementation } from "./validate-contract";
import * as fs from "fs";
import * as path from "path";
import { z } from "zod";

// Minimum ETH balance required for deployment (0.03 ETH)
const MIN_DEPLOYMENT_BALANCE = parseEther("0.03");

// Zod Schema für Validierung
const CollectorNFTv1ConfigSchema = z.object({
  parameters: z.object({
    genImNFTAddress: z.string().refine((addr) => {
      try {
        getAddress(addr);
        return true;
      } catch {
        return false;
      }
    }, "Invalid genImNFTAddress format"),
    baseMintPrice: z.string(), // in ETH, e.g., "0.00005"
  }),
  options: z.object({
    validateOnly: z.boolean(),
    dryRun: z.boolean(),
  }),
  metadata: z.object({
    description: z.string(),
    version: z.string(),
    environment: z.string(),
  }),
});

// TypeScript-Typ automatisch aus Zod-Schema generieren
type CollectorNFTv1Config = z.infer<typeof CollectorNFTv1ConfigSchema>;

/**
 * Load CollectorNFTv1 deployment configuration
 */
function loadConfig(): CollectorNFTv1Config {
  const configPath = path.join(__dirname, "collector-nft-v1.config.json");

  console.log(`📄 Loading configuration from: ${configPath}`);

  if (!fs.existsSync(configPath)) {
    throw new Error(`Configuration file not found: ${configPath}`);
  }

  const configContent = fs.readFileSync(configPath, "utf8");
  let configRaw: unknown;

  try {
    configRaw = JSON.parse(configContent);
  } catch (error: unknown) {
    throw new Error(`Invalid JSON in configuration file: ${error instanceof Error ? error.message : String(error)}`);
  }

  // Zod-Validierung
  let config: CollectorNFTv1Config;
  try {
    config = CollectorNFTv1ConfigSchema.parse(configRaw);
  } catch (error: unknown) {
    if (error instanceof Error) {
      throw new Error(`Config validation failed: ${error.message}`);
    }
    throw error;
  }

  // Validate price format
  try {
    ethers.parseEther(config.parameters.baseMintPrice);
  } catch {
    throw new Error(`Invalid baseMintPrice format: ${config.parameters.baseMintPrice}`);
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
 * Deploy CollectorNFTv1 using OpenZeppelin Upgrades Plugin
 *
 * Usage examples:
 * - Deploy to testnet: npx hardhat run scripts/deploy-collector-nft-v1.ts --network sepolia
 * - Deploy locally: npx hardhat run scripts/deploy-collector-nft-v1.ts --network hardhat
 *
 * Configuration is loaded from collector-nft-v1.config.json
 */
async function deployCollectorNFT() {
  console.log("🚀 CollectorNFTv1 Deployment Script");
  console.log("=".repeat(60));
  console.log(`Network: ${network.name}`);
  console.log(`Block: ${await ethers.provider.getBlockNumber()}`);
  console.log("");

  // Load configuration
  const config = loadConfig();
  const options = config.options;
  const parameters = config.parameters;

  const genImNFTAddress = parameters.genImNFTAddress;
  const baseMintPrice = ethers.parseEther(parameters.baseMintPrice);

  // Check if validation only
  if (options.validateOnly) {
    console.log("🔍 Validation Only Mode - No deployment will occur");
    return await validateDeployment(genImNFTAddress, baseMintPrice);
  }

  // Check if dry run
  if (options.dryRun) {
    console.log("🧪 Dry Run Mode - Simulation only");
    return await simulateDeployment(genImNFTAddress, baseMintPrice);
  }

  // Get deployer and check balance
  const [deployer] = await ethers.getSigners();
  console.log(`👤 Deployer: ${deployer.address}`);
  console.log(`📍 GenImNFT Address: ${genImNFTAddress}`);
  console.log(`💰 Base Mint Price: ${parameters.baseMintPrice} ETH`);
  console.log("");

  // Check deployer balance before anything else
  console.log("💰 Checking Deployer Balance");
  console.log("-".repeat(40));
  await checkDeployerBalance(deployer);
  console.log("");

  // Get contract factory
  console.log("📦 Getting CollectorNFTv1 contract factory...");
  const CollectorNFTv1Factory = await ethers.getContractFactory("CollectorNFTv1");

  // Verify GenImNFT contract exists
  console.log("🔍 Verifying GenImNFT contract...");
  const genImNFTCode = await ethers.provider.getCode(genImNFTAddress);
  if (genImNFTCode === "0x") {
    throw new Error(`No contract found at GenImNFT address: ${genImNFTAddress}`);
  }
  console.log("✅ GenImNFT contract verified");

  // Deploy the upgradeable contract
  console.log("🚀 Deploying CollectorNFTv1...");
  console.log("");

  const collectorNFTv1 = await upgrades.deployProxy(CollectorNFTv1Factory, [genImNFTAddress, baseMintPrice], {
    kind: "uups",
    initializer: "initialize",
  });

  await collectorNFTv1.waitForDeployment();
  const proxyAddress = await collectorNFTv1.getAddress();

  console.log("✅ CollectorNFTv1 deployed successfully!");
  console.log("=".repeat(50));
  console.log(`📍 Proxy Address: ${proxyAddress}`);
  console.log(`📍 Implementation Address: ${await upgrades.erc1967.getImplementationAddress(proxyAddress)}`);
  console.log(`📍 Admin Address: ${await upgrades.erc1967.getAdminAddress(proxyAddress)}`);
  console.log("");

  // Verify deployment
  console.log("🔍 Verifying deployment...");
  const deployedContract = CollectorNFTv1Factory.attach(proxyAddress);

  const contractName = await deployedContract.name();
  const contractSymbol = await deployedContract.symbol();
  const contractGenImNFT = await deployedContract.genImNFTContract();
  const contractBaseMintPrice = await deployedContract.baseMintPrice();
  const implementationAddress = await upgrades.erc1967.getImplementationAddress(proxyAddress);

  console.log(`📄 Contract Name: ${contractName}`);
  console.log(`🏷️  Contract Symbol: ${contractSymbol}`);
  console.log(`🔗 GenImNFT Address: ${contractGenImNFT}`);
  console.log(`💰 Base Mint Price: ${ethers.formatEther(contractBaseMintPrice)} ETH`);

  // Verify configuration matches
  if (contractGenImNFT.toLowerCase() !== genImNFTAddress.toLowerCase()) {
    throw new Error("GenImNFT address mismatch after deployment");
  }
  if (contractBaseMintPrice !== baseMintPrice) {
    throw new Error("Base mint price mismatch after deployment");
  }

  // Verify implementation contract
  console.log("🔧 Verifying implementation contract...");
  const implementationCode = await ethers.provider.getCode(implementationAddress);
  if (implementationCode === "0x") {
    throw new Error(`No contract code found at implementation address: ${implementationAddress}`);
  }
  console.log(`✅ Implementation contract verified (${implementationCode.length} bytes)`);

  // Test implementation contract ABI compatibility
  try {
    CollectorNFTv1Factory.attach(implementationAddress);
    console.log("✅ Implementation contract ABI compatible");
  } catch (error: unknown) {
    console.log(
      "⚠️  Warning: Could not attach ABI to implementation contract:",
      error instanceof Error ? error.message : String(error),
    );
  }

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
    genImNFTAddress: genImNFTAddress,
    baseMintPrice: parameters.baseMintPrice,
    contractName: contractName,
    contractSymbol: contractSymbol,
    version: config.metadata.version,
    config: config,
  };

  console.log("📋 Deployment Summary:");
  console.log(JSON.stringify(deploymentInfo, null, 2));

  // Save deployment information to file
  const deploymentsDir = path.join(__dirname, "../deployments");
  if (!fs.existsSync(deploymentsDir)) {
    fs.mkdirSync(deploymentsDir, { recursive: true });
  }

  const deploymentFileName = `collector-nft-v1-${network.name}.json`;
  const deploymentFilePath = path.join(deploymentsDir, deploymentFileName);

  fs.writeFileSync(deploymentFilePath, JSON.stringify(deploymentInfo, null, 2));
  console.log(`💾 Deployment info saved to: ${deploymentFilePath}`);

  // Comprehensive validation using validate-contract functions
  console.log("\n🔍 Running comprehensive validation...");
  try {
    await validateCollectorNFT(proxyAddress);
    await validateImplementation(deploymentInfo.implementationAddress, "CollectorNFTv1");
    console.log("✅ Comprehensive validation completed successfully!");
  } catch (error: unknown) {
    console.log(
      "⚠️  Warning: Comprehensive validation failed:",
      error instanceof Error ? error.message : String(error),
    );
  }

  console.log("\n✅ Deployment completed successfully!");
  console.log("=".repeat(60));
  console.log("\n📝 Next Steps:");
  console.log("1. Save the proxy address for your frontend configuration");
  console.log("2. Verify contracts on Etherscan if needed");

  return {
    proxyAddress,
    implementationAddress: deploymentInfo.implementationAddress,
    deploymentInfo,
  };
}

async function validateDeployment(genImNFTAddress: string, baseMintPrice: bigint) {
  console.log("🔍 Validating deployment configuration...");

  // Check deployer balance
  const [deployer] = await ethers.getSigners();
  await checkDeployerBalance(deployer);

  // Verify GenImNFT contract
  const genImNFTCode = await ethers.provider.getCode(genImNFTAddress);
  if (genImNFTCode === "0x") {
    throw new Error(`No contract found at GenImNFT address: ${genImNFTAddress}`);
  }

  // Get contract factory for validation
  const CollectorNFTv1Factory = await ethers.getContractFactory("CollectorNFTv1");

  // Validate OpenZeppelin upgradeable patterns
  await upgrades.validateImplementation(CollectorNFTv1Factory, {
    kind: "uups",
  });

  // Validate contract compilation
  console.log("✅ CollectorNFTv1 contract compiles successfully");
  console.log("✅ OpenZeppelin upgrade validation passed");
  console.log("✅ GenImNFT contract exists at specified address");
  console.log(`✅ Base mint price valid: ${ethers.formatEther(baseMintPrice)} ETH`);

  console.log("🎉 Validation completed successfully!");
  return true;
}

async function simulateDeployment(genImNFTAddress: string, baseMintPrice: bigint) {
  console.log("🧪 Simulating deployment...");

  const [deployer] = await ethers.getSigners();

  // Check deployer balance
  await checkDeployerBalance(deployer);

  // Verify GenImNFT contract
  const genImNFTCode = await ethers.provider.getCode(genImNFTAddress);
  if (genImNFTCode === "0x") {
    throw new Error(`No contract found at GenImNFT address: ${genImNFTAddress}`);
  }

  console.log("");
  console.log("📋 Deployment parameters:");
  console.log(`  - Network: ${network.name}`);
  console.log(`  - GenImNFT Address: ${genImNFTAddress}`);
  console.log(`  - Base Mint Price: ${ethers.formatEther(baseMintPrice)} ETH`);
  console.log("");
  console.log("📦 What would happen:");
  console.log("  1. Deploy CollectorNFTv1 implementation");
  console.log("  2. Deploy ERC1967 proxy");
  console.log("  3. Initialize with GenImNFT address and base mint price");
  console.log("");
  console.log("✅ Simulation complete (no actual deployment)");
  return true;
}

// Export for testing
export { deployCollectorNFT, MIN_DEPLOYMENT_BALANCE, CollectorNFTv1ConfigSchema };

// Execute only when run directly (not imported)
if (require.main === module) {
  deployCollectorNFT()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}
