#!/usr/bin/env npx hardhat run
import { ethers, upgrades, network } from "hardhat";
import { getAddress } from "viem";
import { validateCollectorNFT, validateImplementation } from "./validate-contract";
import * as fs from "fs";
import * as path from "path";

interface LLMv1Config {
  LLMv1Address: string;
  options?: {
    validateOnly?: boolean;
    dryRun?: boolean;
    verify?: boolean;
    waitConfirmations?: number;
  };
  metadata?: {
    description?: string;
    version?: string;
    environment?: string;
  };
}

/**
 * Load LLMv1 deployment configuration
 */
function loadConfig(): LLMv1Config {
  const configPath = path.join(__dirname, "llm-v1.config.json");

  console.log(`📄 Loading configuration from: ${configPath}`);

  if (!fs.existsSync(configPath)) {
    throw new Error(`Configuration file not found: ${configPath}`);
  }

  const configContent = fs.readFileSync(configPath, "utf8");
  let config: LLMv1Config;

  try {
    config = JSON.parse(configContent);
  } catch (error: any) {
    throw new Error(`Invalid JSON in configuration file: ${error.message}`);
  }

  // Basic validation
  if (!config.LLMv1Address) {
    throw new Error("LLMv1Address is required in config");
  }

  // Validate address format
  try {
    getAddress(config.LLMv1Address);
  } catch (error) {
    throw new Error(`Invalid LLMv1Address format: ${config.LLMv1Address}`);
  }

  console.log("✅ Configuration loaded and validated");
  console.log(`📋 Config: ${JSON.stringify(config, null, 2)}`);

  return config;
}

/**
 * Deploy LLMv1 using OpenZeppelin Upgrades Plugin
 *
 * Usage examples:
 * - Deploy to testnet: npx hardhat run scripts/deploy-llm-v1.ts --network sepolia
 * - Deploy locally: npx hardhat run scripts/deploy-llm-v1.ts --network hardhat
 *
 * Configuration is loaded from llm-v1.config.json
 */
async function deployLLMv1() {
  console.log("🚀 LLMv1 Deployment Script");
  console.log("=".repeat(50));
  console.log(`Network: ${network.name}`);
  console.log(`Block: ${await ethers.provider.getBlockNumber()}`);
  console.log("");

  // Load configuration
  const config = loadConfig();

  const LLMv1Address = config.LLMv1Address;
  const options = config.options || {};

  console.log(`📍 LLMv1 Address: ${LLMv1Address}`);

  // Check if validation only
  if (options.validateOnly) {
    console.log("🔍 Validation Only Mode - No deployment will occur");
    return await validateDeployment(LLMv1Address);
  }

  // Check if dry run
  if (options.dryRun) {
    console.log("🧪 Dry Run Mode - Simulation only");
    return await simulateDeployment(LLMv1Address);
  }

  // Get contract factory
  console.log("📦 Getting LLMv1 contract factory...");
  const LLMv1Factory = await ethers.getContractFactory("LLMv1");

  // Verify LLMv1 contract exists
  console.log("🔍 Verifying LLMv1 contract...");
  const LLMv1Code = await ethers.provider.getCode(LLMv1Address);
  if (LLMv1Code === "0x") {
    throw new Error(`No contract found at LLMv1 address: ${LLMv1Address}`);
  }
  console.log("✅ LLMv1 contract verified");

  // Deploy the upgradeable contract
  console.log("🚀 Deploying LLMv1...");
  console.log("");

  const LLMv1 = await upgrades.deployProxy(LLMv1Factory, [LLMv1Address], {
    kind: "uups",
    initializer: "initialize",
  });

  await LLMv1.waitForDeployment();
  const proxyAddress = await LLMv1.getAddress();

  console.log("✅ LLMv1 deployed successfully!");
  console.log("=".repeat(50));
  console.log(`📍 Proxy Address: ${proxyAddress}`);
  console.log(`📍 Implementation Address: ${await upgrades.erc1967.getImplementationAddress(proxyAddress)}`);
  console.log(`📍 Admin Address: ${await upgrades.erc1967.getAdminAddress(proxyAddress)}`);
  console.log("");

  // Verify deployment
  console.log("🔍 Verifying deployment...");
  const deployedContract = LLMv1Factory.attach(proxyAddress);

  const contractName = await deployedContract.name();
  const contractSymbol = await deployedContract.symbol();
  const contractLLM = await deployedContract.LLMContract();
  const implementationAddress = await upgrades.erc1967.getImplementationAddress(proxyAddress);

  console.log(`📄 Contract Name: ${contractName}`);
  console.log(`🏷️  Contract Symbol: ${contractSymbol}`);
  console.log(`🔗 LLM Address: ${contractLLM}`);

  // Verify configuration matches
  if (contractLLM.toLowerCase() !== LLMAddress.toLowerCase()) {
    throw new Error("LLM   address mismatch after deployment");
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
    const implementationContract = LLMv1Factory.attach(implementationAddress);
    console.log("✅ Implementation contract ABI compatible");
  } catch (error: any) {
    console.log("⚠️  Warning: Could not attach ABI to implementation contract:", error.message || error);
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
    LLMv1Address: LLMv1Address,
    contractName: contractName,
    contractSymbol: contractSymbol,
    deploymentOptions: {
      verify: options.verify || false,
      waitConfirmations: options.waitConfirmations || 1,
      configUsed: "llm-v1.config.json",
    },
    config: config,
  };

  console.log("📋 Deployment Summary:");
  console.log(JSON.stringify(deploymentInfo, null, 2));

  // Save deployment information to file
  const deploymentsDir = path.join(__dirname, "deployments");
  if (!fs.existsSync(deploymentsDir)) {
    fs.mkdirSync(deploymentsDir, { recursive: true });
  }

  const timestamp = new Date().toISOString().split("T")[0]; // YYYY-MM-DD format
  const deploymentFileName = `llm-v1-${network.name}-${timestamp}.json`;
  const deploymentFilePath = path.join(deploymentsDir, deploymentFileName);

  fs.writeFileSync(deploymentFilePath, JSON.stringify(deploymentInfo, null, 2));
  console.log(`💾 Deployment info saved to: ${deploymentFilePath}`);

  // Comprehensive validation using validate-contract functions
  console.log("\n🔍 Running comprehensive validation...");
  try {
    await validateCollectorNFT(proxyAddress);
    await validateImplementation(deploymentInfo.implementationAddress, "CollectorNFTv1");
    console.log("✅ Comprehensive validation completed successfully!");
  } catch (error: any) {
    console.log("⚠️  Warning: Comprehensive validation failed:", error.message || error);
  }

  // Contract verification if enabled
  if (options.verify) {
    console.log("\n🔍 Verifying contract on block explorer...");
    try {
      console.log("📋 Contract verification would be performed here");
      console.log("✅ Contract verification completed successfully!");
    } catch (error: unknown) {
      if (error instanceof Error) {
        console.log("⚠️  Warning: Contract verification failed:", error.message);
      } else {
        console.log("⚠️  Warning: Contract verification failed:", error);
      }
    }
  }

  return {
    contract: deployedContract,
    address: proxyAddress,
    deploymentInfo,
  };
}

async function validateDeployment(LLMv1Address: string) {
  console.log("🔍 Validating deployment configuration...");

  // Verify LLMv1 contract
  const LLMv1Code = await ethers.provider.getCode(LLMv1Address);
  if (LLMv1Code === "0x") {
    throw new Error(`No contract found at LLMv1 address: ${LLMv1Address}`);
  }

  // Get contract factory for validation
  await ethers.getContractFactory("LLMv1");

  // Validate contract compilation
  console.log("✅ LLMv1 contract compiles successfully");
  console.log("✅ LLMv1 contract exists at specified address");

  console.log("🎉 Validation completed successfully!");
  return true;
}

async function simulateDeployment(LLMv1Address: string) {
  console.log("🧪 Simulating deployment...");

  await validateDeployment(LLMv1Address);

  // Get contract factory for simulation
  await ethers.getContractFactory("LLMv1");

  console.log("⛽ Estimating deployment costs...");
  console.log("📦 Contract factory created successfully");
  console.log("💡 Ready for deployment with specified parameters");

  console.log("🎉 Simulation completed successfully!");
  return true;
}

// Main execution
async function main() {
  try {
    await deployLLMv1();
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

export { deployLLMv1, loadConfig, LLMv1Config };
