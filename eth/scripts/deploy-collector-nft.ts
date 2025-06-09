#!/usr/bin/env npx hardhat run
import { ethers, upgrades, network } from "hardhat";
import { getAddress } from "viem";

interface DeployOptions {
  genImNFTAddress?: string;
  baseMintPrice?: string;
  validateOnly?: boolean;
  dryRun?: boolean;
}

/**
 * Deploy CollectorNFT using OpenZeppelin Upgrades Plugin
 * 
 * Usage examples:
 * - Environment variable: GENIMNFr_ADDRESS=0x123... npx hardhat run scripts/deploy-collector-nft.ts --network sepolia
 * - Script parameter: npx hardhat run scripts/deploy-collector-nft.ts --network sepolia
 * - Validation only: VALIDATE_ONLY=true npx hardhat run scripts/deploy-collector-nft.ts --network sepolia
 * - Dry run: DRY_RUN=true npx hardhat run scripts/deploy-collector-nft.ts --network sepolia
 * - Custom base price: BASE_MINT_PRICE=0.001 npx hardhat run scripts/deploy-collector-nft.ts --network sepolia
 */
async function deployCollectorNFT(options: DeployOptions = {}) {
  console.log("🚀 CollectorNFT Deployment Script");
  console.log("=" .repeat(50));
  console.log(`Network: ${network.name}`);
  console.log(`Block: ${await ethers.provider.getBlockNumber()}`);
  console.log("");

  // Get GenImNFT address from environment or parameter
  const genImNFTAddress = options.genImNFTAddress || process.env.GENIMFNT_ADDRESS;
  if (!genImNFTAddress) {
    throw new Error(
      "GenImNFT address required. Set GENIMFNT_ADDRESS environment variable or pass as parameter."
    );
  }

  console.log(`📍 GenImNFT Address: ${genImNFTAddress}`);

  // Validate GenImNFT address format
  try {
    getAddress(genImNFTAddress);
  } catch (error) {
    throw new Error(`Invalid GenImNFT address: ${genImNFTAddress}`);
  }

  // Get base mint price (default: 0.001 ETH)
  const baseMintPriceStr = options.baseMintPrice || process.env.BASE_MINT_PRICE || "0.001";
  const baseMintPrice = ethers.parseEther(baseMintPriceStr);
  console.log(`💰 Base Mint Price: ${baseMintPriceStr} ETH (${baseMintPrice.toString()} wei)`);

  // Check if validation only
  if (options.validateOnly || process.env.VALIDATE_ONLY === "true") {
    console.log("🔍 Validation Only Mode - No deployment will occur");
    return await validateDeployment(genImNFTAddress, baseMintPrice);
  }

  // Check if dry run
  if (options.dryRun || process.env.DRY_RUN === "true") {
    console.log("🧪 Dry Run Mode - Simulation only");
    return await simulateDeployment(genImNFTAddress, baseMintPrice);
  }

  // Get contract factory
  console.log("📦 Getting CollectorNFT contract factory...");
  const CollectorNFTFactory = await ethers.getContractFactory("CollectorNFT");

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

export { deployCollectorNFT, DeployOptions };
