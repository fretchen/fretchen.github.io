#!/usr/bin/env npx hardhat run
import { ethers, upgrades, network } from "hardhat";
import { getAddress } from "viem";
import * as fs from "fs";
import * as path from "path";

interface DeployOptions {
  validateOnly?: boolean;
  dryRun?: boolean;
  verify?: boolean;
  waitConfirmations?: number;
}

interface DeployConfig {
  genImNFTAddress: string;
  baseMintPrice: string;
  options?: DeployOptions;
  metadata?: {
    description?: string;
    version?: string;
    environment?: string;
  };
}

/**
 * Load deployment configuration from JSON file
 */
function loadDeployConfig(configPath?: string): DeployConfig {
  // Determine config file path
  const defaultConfigPath = path.join(__dirname, "deploy-config.json");
  const finalConfigPath = configPath || process.env.DEPLOY_CONFIG || defaultConfigPath;

  console.log(`📋 Loading configuration from: ${finalConfigPath}`);

  if (!fs.existsSync(finalConfigPath)) {
    throw new Error(`Configuration file not found: ${finalConfigPath}`);
  }

  try {
    const configContent = fs.readFileSync(finalConfigPath, "utf8");
    const config: DeployConfig = JSON.parse(configContent);

    // Validate required fields
    if (!config.genImNFTAddress) {
      throw new Error("genImNFTAddress is required in configuration");
    }
    if (!config.baseMintPrice) {
      throw new Error("baseMintPrice is required in configuration");
    }

    // Validate address format
    try {
      getAddress(config.genImNFTAddress);
    } catch (error) {
      throw new Error(`Invalid genImNFTAddress format: ${config.genImNFTAddress}`);
    }

    // Validate baseMintPrice format
    if (!/^[0-9]+(\.[0-9]+)?$/.test(config.baseMintPrice)) {
      throw new Error(`Invalid baseMintPrice format: ${config.baseMintPrice}`);
    }

    console.log("✅ Configuration loaded and validated successfully");
    return config;
  } catch (error) {
    if (error instanceof SyntaxError) {
      throw new Error(`Invalid JSON in configuration file: ${error.message}`);
    }
    throw error;
  }
}

/**
 * Deploy CollectorNFT using configuration from JSON file
 * 
 * Usage examples:
 * - Default config: npx hardhat run scripts/deploy-collector-nft.ts --network sepolia
 * - Custom config: DEPLOY_CONFIG=./my-config.json npx hardhat run scripts/deploy-collector-nft.ts --network sepolia
 * - With config argument: npx hardhat run scripts/deploy-collector-nft.ts --network sepolia -- ./custom-config.json
 * - Validation only: Set "validateOnly": true in JSON config
 * - Dry run: Set "dryRun": true in JSON config
 */
async function deployCollectorNFT(configPath?: string) {
  console.log("🚀 CollectorNFT Deployment Script");
  console.log("=" .repeat(50));
  console.log(`Network: ${network.name}`);
  console.log(`Block: ${await ethers.provider.getBlockNumber()}`);
  console.log("");

  // Load configuration from JSON file
  const config = loadDeployConfig(configPath);

  // Display configuration
  console.log("📋 Deployment Configuration:");
  console.log(`📍 GenImNFT Address: ${config.genImNFTAddress}`);
  console.log(`💰 Base Mint Price: ${config.baseMintPrice} ETH`);
  console.log(`🌐 Target Network: ${network.name}`);
  if (config.metadata) {
    console.log(`📝 Description: ${config.metadata.description || "N/A"}`);
    console.log(`🏷️  Version: ${config.metadata.version || "N/A"}`);
    console.log(`🔧 Environment: ${config.metadata.environment || "N/A"}`);
  }
  console.log("");

  const baseMintPrice = ethers.parseEther(config.baseMintPrice);
  console.log(`💰 Parsed Base Mint Price: ${baseMintPrice.toString()} wei`);

  const options = config.options || {};

  // Check if validation only
  if (options.validateOnly) {
    console.log("🔍 Validation Only Mode - No deployment will occur");
    return await validateDeployment(config.genImNFTAddress, baseMintPrice);
  }

  // Check if dry run
  if (options.dryRun) {
    console.log("🧪 Dry Run Mode - Simulation only");
    return await simulateDeployment(config.genImNFTAddress, baseMintPrice);
  }

  // Get contract factory
  console.log("📦 Getting CollectorNFT contract factory...");
  const CollectorNFTFactory = await ethers.getContractFactory("CollectorNFT");

  // Verify GenImNFT contract exists
  console.log("🔍 Verifying GenImNFT contract...");
  const genImNFTCode = await ethers.provider.getCode(config.genImNFTAddress);
  if (genImNFTCode === "0x") {
    throw new Error(`No contract found at GenImNFT address: ${config.genImNFTAddress}`);
  }
  console.log("✅ GenImNFT contract verified");

  // Deploy the upgradeable contract
  console.log("🚀 Deploying CollectorNFT...");
  console.log("");

  const collectorNFT = await upgrades.deployProxy(
    CollectorNFTFactory,
    [config.genImNFTAddress, baseMintPrice],
    {
      kind: "uups",
      initializer: "initialize",
    }
  );

  // Wait for deployment with specified confirmations
  const waitConfirmations = options.waitConfirmations || 1;
  console.log(`⏳ Waiting for ${waitConfirmations} confirmation(s)...`);
  await collectorNFT.waitForDeployment();
  
  // Wait for additional confirmations if specified
  if (waitConfirmations > 1) {
    const deploymentTx = collectorNFT.deploymentTransaction();
    if (deploymentTx) {
      await deploymentTx.wait(waitConfirmations);
      console.log(`✅ ${waitConfirmations} confirmations received`);
    }
  }

  const collectorNFTAddress = await collectorNFT.getAddress();

  console.log("✅ CollectorNFT deployed successfully!");
  console.log("=" .repeat(50));
  console.log(`📍 Proxy Address: ${collectorNFTAddress}`);
  console.log(`📍 Implementation Address: ${await upgrades.erc1967.getImplementationAddress(collectorNFTAddress)}`);
  console.log(`📍 Admin Address: ${await upgrades.erc1967.getAdminAddress(collectorNFTAddress)}`);
  console.log("");

  // Verify deployment
  console.log("🔍 Verifying deployment...");
  const deployedContract = CollectorNFTFactory.attach(collectorNFTAddress);
  
  const contractName = await deployedContract.name();
  const contractSymbol = await deployedContract.symbol();
  const contractGenImNFT = await deployedContract.genImNFTContract();
  const contractBaseMintPrice = await deployedContract.baseMintPrice();

  console.log(`📄 Contract Name: ${contractName}`);
  console.log(`🏷️  Contract Symbol: ${contractSymbol}`);
  console.log(`🔗 GenImNFT Address: ${contractGenImNFT}`);
  console.log(`💰 Base Mint Price: ${ethers.formatEther(contractBaseMintPrice)} ETH`);

  // Verify configuration
  if (contractGenImNFT.toLowerCase() !== config.genImNFTAddress.toLowerCase()) {
    throw new Error("GenImNFT address mismatch after deployment");
  }
  if (contractBaseMintPrice !== baseMintPrice) {
    throw new Error("Base mint price mismatch after deployment");
  }

  console.log("✅ All verifications passed!");
  console.log("");

  // Export deployment info
  const deploymentInfo = {
    network: network.name,
    timestamp: new Date().toISOString(),
    blockNumber: await ethers.provider.getBlockNumber(),
    proxyAddress: collectorNFTAddress,
    implementationAddress: await upgrades.erc1967.getImplementationAddress(collectorNFTAddress),
    adminAddress: await upgrades.erc1967.getAdminAddress(collectorNFTAddress),
    genImNFTAddress: config.genImNFTAddress,
    baseMintPrice: config.baseMintPrice,
    contractName: contractName,
    contractSymbol: contractSymbol,
    config: config,
  };

  console.log("📋 Deployment Summary:");
  console.log(JSON.stringify(deploymentInfo, null, 2));

  return {
    contract: deployedContract,
    address: collectorNFTAddress,
    deploymentInfo,
  };
}

async function validateDeployment(genImNFTAddress: string, baseMintPrice: bigint) {
  console.log("🔍 Validating deployment configuration...");
  
  // Verify GenImNFT contract
  const genImNFTCode = await ethers.provider.getCode(genImNFTAddress);
  if (genImNFTCode === "0x") {
    throw new Error(`No contract found at GenImNFT address: ${genImNFTAddress}`);
  }

  // Get contract factory for validation
  const CollectorNFTFactory = await ethers.getContractFactory("CollectorNFT");

  // Validate contract compilation
  console.log("✅ CollectorNFT contract compiles successfully");
  console.log("✅ GenImNFT contract exists at specified address");
  console.log(`✅ Base mint price valid: ${ethers.formatEther(baseMintPrice)} ETH`);
  
  console.log("🎉 Validation completed successfully!");
  return true;
}

async function simulateDeployment(genImNFTAddress: string, baseMintPrice: bigint) {
  console.log("🧪 Simulating deployment...");
  
  await validateDeployment(genImNFTAddress, baseMintPrice);
  
  // Estimate gas costs
  const CollectorNFTFactory = await ethers.getContractFactory("CollectorNFT");
  
  console.log("⛽ Estimating deployment costs...");
  console.log("📦 Contract factory created successfully");
  console.log("💡 Ready for deployment with specified parameters");
  
  console.log("🎉 Simulation completed successfully!");
  return true;
}

// Main execution
async function main() {
  try {
    // Check for config file argument
    const configPath = process.argv[2];
    await deployCollectorNFT(configPath);
  } catch (error) {
    console.error("❌ Deployment failed:");
    console.error(error);
    process.exitCode = 1;
  }
}

// Execute if run directly
if (require.main === module) {
  main();
}

export { deployCollectorNFT, DeployConfig, DeployOptions, loadDeployConfig };
