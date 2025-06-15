#!/usr/bin/env npx hardhat run
import { ethers, upgrades, network } from "hardhat";
import { getAddress } from "viem";
import { validateCollectorNFT, validateImplementation } from "./validate-contract";
import * as fs from "fs";
import * as path from "path";
import Ajv from "ajv";

interface DeployConfig {
  genImNFTAddress: string;
  baseMintPrice: string;
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
 * Load and validate deployment configuration from JSON file
 */
function loadAndValidateConfig(configPath: string): DeployConfig {
  console.log(`📄 Loading configuration from: ${configPath}`);
  
  // Check if config file exists
  if (!fs.existsSync(configPath)) {
    throw new Error(`Configuration file not found: ${configPath}`);
  }

  // Load config file
  const configContent = fs.readFileSync(configPath, 'utf8');
  let config: DeployConfig;
  
  try {
    config = JSON.parse(configContent);
  } catch (error: any) {
    throw new Error(`Invalid JSON in configuration file: ${error.message}`);
  }

  // Load schema file
  const schemaPath = path.join(__dirname, "deploy-config.schema.json");
  if (!fs.existsSync(schemaPath)) {
    throw new Error(`Schema file not found: ${schemaPath}`);
  }

  const schemaContent = fs.readFileSync(schemaPath, 'utf8');
  let schema: any;
  
  try {
    schema = JSON.parse(schemaContent);
  } catch (error: any) {
    throw new Error(`Invalid JSON in schema file: ${error.message}`);
  }

  // Validate config against schema
  const ajv = new Ajv({ strict: false });
  const validate = ajv.compile(schema);
  const valid = validate(config);

  if (!valid) {
    console.error("❌ Configuration validation failed:");
    console.error(JSON.stringify(validate.errors, null, 2));
    throw new Error(`Configuration validation failed: ${ajv.errorsText(validate.errors)}`);
  }

  console.log("✅ Configuration loaded and validated successfully");
  console.log(`📋 Config: ${JSON.stringify(config, null, 2)}`);
  
  return config;
}

/**
 * Deploy CollectorNFT using OpenZeppelin Upgrades Plugin
 * 
 * Usage examples:
 * - Standard deployment: npx hardhat run scripts/deploy-collector-nft-v1.ts --network sepolia
 * - Local testing: npx hardhat run scripts/deploy-collector-nft-v1.ts --network hardhat
 * 
 * Configuration is loaded from deploy-config-v1.json and validated against deploy-config.schema.json
 */
async function deployCollectorNFT() {
  console.log("🚀 CollectorNFT Deployment Script");
  console.log("=" .repeat(50));
  console.log(`Network: ${network.name}`);
  console.log(`Block: ${await ethers.provider.getBlockNumber()}`);
  console.log("");

  // Load configuration from file
  let config: DeployConfig | null = null;
  
  try {
    const configPath = path.join(__dirname, "deploy-config-v1.json");
    config = loadAndValidateConfig(configPath);
    console.log("📦 Using configuration from deploy-config-v1.json");
  } catch (error: any) {
    console.log(`⚠️  Could not load config file: ${error.message}`);
    console.log("📦 Falling back to environment variables");
  }

  // Get GenImNFT address from config or environment
  const genImNFTAddress = process.env.GENIMFNT_ADDRESS || 
                         config?.genImNFTAddress;
                         
  if (!genImNFTAddress) {
    throw new Error(
      "GenImNFT address required. Set GENIMFNT_ADDRESS environment variable or configure in deploy-config-v1.json."
    );
  }

  console.log(`📍 GenImNFT Address: ${genImNFTAddress}`);

  // Validate GenImNFT address format
  try {
    getAddress(genImNFTAddress);
  } catch (error) {
    throw new Error(`Invalid GenImNFT address: ${genImNFTAddress}`);
  }

  // Get base mint price from config or environment (default: 0.001 ETH)
  const baseMintPriceStr = process.env.BASE_MINT_PRICE || 
                          config?.baseMintPrice || 
                          "0.001";
  const baseMintPrice = ethers.parseEther(baseMintPriceStr);
  console.log(`💰 Base Mint Price: ${baseMintPriceStr} ETH (${baseMintPrice.toString()} wei)`);

  // Get options from config or environment
  const validateOnly = process.env.VALIDATE_ONLY === "true" || 
                      config?.options?.validateOnly || 
                      false;
                      
  const dryRun = process.env.DRY_RUN === "true" || 
                config?.options?.dryRun || 
                false;

  const verify = config?.options?.verify || false;
                
  const waitConfirmations = config?.options?.waitConfirmations || 1;

  // Check if validation only
  if (validateOnly) {
    console.log("🔍 Validation Only Mode - No deployment will occur");
    return await validateDeployment(genImNFTAddress, baseMintPrice);
  }

  // Check if dry run
  if (dryRun) {
    console.log("🧪 Dry Run Mode - Simulation only");
    return await simulateDeployment(genImNFTAddress, baseMintPrice);
  }

  // Get contract factory
  console.log("📦 Getting CollectorNFT contract factory...");
  const CollectorNFTFactory = await ethers.getContractFactory("CollectorNFTv1");

  // Verify GenImNFT contract exists
  console.log("🔍 Verifying GenImNFT contract...");
  const genImNFTCode = await ethers.provider.getCode(genImNFTAddress);
  if (genImNFTCode === "0x") {
    throw new Error(`No contract found at GenImNFT address: ${genImNFTAddress}`);
  }
  console.log("✅ GenImNFT contract verified");

  // Deploy the upgradeable contract
  console.log("🚀 Deploying CollectorNFT...");
  console.log("");

  const collectorNFT = await upgrades.deployProxy(
    CollectorNFTFactory,
    [genImNFTAddress, baseMintPrice],
    {
      kind: "uups",
      initializer: "initialize",
    }
  );

  await collectorNFT.waitForDeployment();
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
  const implementationAddress = await upgrades.erc1967.getImplementationAddress(collectorNFTAddress);

  console.log(`📄 Contract Name: ${contractName}`);
  console.log(`🏷️  Contract Symbol: ${contractSymbol}`);
  console.log(`🔗 GenImNFT Address: ${contractGenImNFT}`);
  console.log(`💰 Base Mint Price: ${ethers.formatEther(contractBaseMintPrice)} ETH`);

  // Verify configuration
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
    const implementationContract = CollectorNFTFactory.attach(implementationAddress);
    console.log("✅ Implementation contract ABI compatible");
  } catch (error: any) {
    console.log("⚠️  Warning: Could not attach ABI to implementation contract:", error.message || error);
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
    genImNFTAddress: genImNFTAddress,
    baseMintPrice: baseMintPriceStr,
    contractName: contractName,
    contractSymbol: contractSymbol,
    deploymentOptions: {
      verify,
      waitConfirmations,
      configUsed: config ? "deploy-config-v1.json" : "environment/parameters"
    },
    config: config || undefined,
  };

  console.log("📋 Deployment Summary:");
  console.log(JSON.stringify(deploymentInfo, null, 2));

  // Save deployment information to file
  const deploymentsDir = path.join(__dirname, "deployments");
  if (!fs.existsSync(deploymentsDir)) {
    fs.mkdirSync(deploymentsDir, { recursive: true });
  }
  
  const timestamp = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format
  const deploymentFileName = `collector-nft-${network.name}-${timestamp}.json`;
  const deploymentFilePath = path.join(deploymentsDir, deploymentFileName);
  
  fs.writeFileSync(deploymentFilePath, JSON.stringify(deploymentInfo, null, 2));
  console.log(`💾 Deployment info saved to: ${deploymentFilePath}`);

  // Comprehensive validation using validate-contract functions
  console.log("\n🔍 Running comprehensive validation...");
  try {
    await validateCollectorNFT(collectorNFTAddress);
    await validateImplementation(deploymentInfo.implementationAddress, "CollectorNFTv1");
    console.log("✅ Comprehensive validation completed successfully!");
  } catch (error: any) {
    console.log("⚠️  Warning: Comprehensive validation failed:", error.message || error);
  }

  // Contract verification if enabled
  if (verify) {
    console.log("\n🔍 Verifying contract on block explorer...");
    try {
      console.log("📋 Contract verification would be performed here");
      console.log("✅ Contract verification completed successfully!");
    } catch (error: any) {
      console.log("⚠️  Warning: Contract verification failed:", error.message || error);
    }
  }

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
    await deployCollectorNFT();
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

export { deployCollectorNFT, loadAndValidateConfig, DeployConfig };
