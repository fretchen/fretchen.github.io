#!/usr/bin/env npx hardhat run
import { ethers, upgrades, network } from "hardhat";
import { getAddress } from "viem";

interface DeploymentOptions {
  genImNFTContract?: string;
  baseMintPrice?: string;
  validateOnly?: boolean;
  dryRun?: boolean;
}

/**
 * Deploy CollectorNFTv1 using OpenZeppelin Upgrades Plugin
 * 
 * Usage examples:
 * - Environment variable: GEN_IM_NFT_CONTRACT=0x123... npx hardhat run scripts/deploy-collector-nft-v1.ts --network sepolia
 * - Default values: npx hardhat run scripts/deploy-collector-nft-v1.ts --network localhost
 * - Validation only: VALIDATE_ONLY=true npx hardhat run scripts/deploy-collector-nft-v1.ts --network sepolia
 * - Dry run: DRY_RUN=true npx hardhat run scripts/deploy-collector-nft-v1.ts --network sepolia
 */
async function deployCollectorNFTv1(options: DeploymentOptions = {}) {
  console.log("🚀 CollectorNFTv1 Deployment Script");
  console.log("=====================================");
  console.log(`Network: ${network.name}`);
  console.log(`Block: ${await ethers.provider.getBlockNumber()}`);
  console.log("");

  // Get configuration from environment or options
  const genImNFTContract = options.genImNFTContract || 
    process.env.GEN_IM_NFT_CONTRACT || 
    "0x1234567890123456789012345678901234567890"; // Placeholder for testing

  const baseMintPrice = options.baseMintPrice || 
    process.env.BASE_MINT_PRICE || 
    "0.001"; // 0.001 ETH default

  const baseMintPriceWei = ethers.parseEther(baseMintPrice);

  console.log("📋 Deployment Configuration:");
  console.log(`   GenImNFT Contract: ${genImNFTContract}`);
  console.log(`   Base Mint Price: ${baseMintPrice} ETH (${baseMintPriceWei} wei)`);
  console.log("");

  if (options.validateOnly || process.env.VALIDATE_ONLY === "true") {
    console.log("🔍 Validation Only Mode - No deployment will occur");
    console.log("🔍 Validating CollectorNFTv1 deployment configuration...");
    
    try {
      // Validate contract compilation
      const CollectorNFTv1Factory = await ethers.getContractFactory("CollectorNFTv1");
      console.log("✅ CollectorNFTv1 contract compiles successfully");
      
      // Validate GenImNFT contract exists (if not placeholder)
      if (genImNFTContract !== "0x1234567890123456789012345678901234567890") {
        const code = await ethers.provider.getCode(genImNFTContract);
        if (code === "0x") {
          throw new Error("GenImNFT contract not found at specified address");
        }
        console.log("✅ GenImNFT contract exists at specified address");
      } else {
        console.log("⚠️  Using placeholder GenImNFT address for validation");
      }
      
      console.log("✅ All validations passed");
      console.log("🎉 Validation completed successfully!");
      return true;
      
    } catch (error) {
      console.error("❌ Validation failed:", error);
      throw error;
    }
  }

  if (options.dryRun || process.env.DRY_RUN === "true") {
    console.log("🔄 Dry Run Mode - Preview deployment steps");
    console.log("-".repeat(40));
    console.log("1. Deploy CollectorNFTv1 implementation contract");
    console.log("2. Deploy UUPS proxy pointing to CollectorNFTv1");
    console.log("3. Initialize proxy with:");
    console.log(`   - GenImNFT Contract: ${genImNFTContract}`);
    console.log(`   - Base Mint Price: ${baseMintPrice} ETH`);
    console.log("4. Verify deployment and proxy setup");
    console.log("✅ Dry run completed. Set DRY_RUN=false to perform actual deployment.");
    return { dryRun: true };
  }

  console.log("🔄 Deploying CollectorNFTv1");
  console.log("-".repeat(30));

  try {
    // Get deployer
    const [deployer] = await ethers.getSigners();
    console.log(`📍 Deployer: ${deployer.address}`);
    
    // Get deployer balance
    const balance = await ethers.provider.getBalance(deployer.address);
    console.log(`💰 Deployer Balance: ${ethers.formatEther(balance)} ETH`);
    console.log("");

    // Deploy CollectorNFTv1 using OpenZeppelin upgrades
    console.log("⏳ Deploying CollectorNFTv1 proxy...");
    const CollectorNFTv1Factory = await ethers.getContractFactory("CollectorNFTv1");
    
    const proxy = await upgrades.deployProxy(
      CollectorNFTv1Factory,
      [genImNFTContract, baseMintPriceWei],
      {
        initializer: "initialize",
        kind: "uups"
      }
    );

    await proxy.waitForDeployment();
    const proxyAddress = await proxy.getAddress();

    console.log("✅ CollectorNFTv1 deployed successfully!");
    console.log("=======================================");
    console.log(`📍 Proxy Address: ${proxyAddress}`);
    
    // Get implementation address
    const implementationAddress = await upgrades.erc1967.getImplementationAddress(proxyAddress);
    console.log(`📍 Implementation Address: ${implementationAddress}`);
    
    // Get admin address
    try {
      const adminAddress = await upgrades.erc1967.getAdminAddress(proxyAddress);
      console.log(`📍 Admin Address: ${adminAddress}`);
    } catch {
      console.log("📍 Admin Address: N/A (UUPS proxy)");
    }

    console.log("");

    // Verify deployment
    console.log("🔍 Verifying deployment...");
    const collectorNFTv1 = await ethers.getContractAt("CollectorNFTv1", proxyAddress);
    
    const name = await collectorNFTv1.name();
    const symbol = await collectorNFTv1.symbol();
    const owner = await collectorNFTv1.owner();
    const genImNFT = await collectorNFTv1.genImNFTContract();
    const mintPrice = await collectorNFTv1.baseMintPrice();

    console.log("📊 Contract State:");
    console.log(`   Name: ${name}`);
    console.log(`   Symbol: ${symbol}`);
    console.log(`   Owner: ${owner}`);
    console.log(`   GenImNFT: ${genImNFT}`);
    console.log(`   Base Mint Price: ${ethers.formatEther(mintPrice)} ETH`);
    console.log("");

    console.log("🎉 CollectorNFTv1 Deployment Summary:");
    console.log(`   • Fresh deployment of CollectorNFTv1`);
    console.log(`   • UUPS upgradeable proxy pattern`);
    console.log(`   • Ready for future upgrades to v2, v3, etc.`);
    console.log(`   • Automatic URI inheritance from GenImNFT`);
    console.log(`   • Dynamic pricing with exponential scaling`);

    const deploymentInfo = {
      network: network.name,
      timestamp: new Date().toISOString(),
      blockNumber: await ethers.provider.getBlockNumber(),
      proxyAddress,
      implementationAddress,
      deployer: deployer.address,
      genImNFTContract,
      baseMintPrice: baseMintPrice,
      contractName: name,
      contractSymbol: symbol
    };

    console.log("");
    console.log("📋 Deployment Summary:");
    console.log(JSON.stringify(deploymentInfo, null, 2));

    return {
      proxy: collectorNFTv1,
      address: proxyAddress,
      deploymentInfo,
    };

  } catch (error) {
    console.error("❌ Deployment failed:", error);
    throw error;
  }
}

// Main execution
async function main() {
  const options: DeploymentOptions = {
    genImNFTContract: process.env.GEN_IM_NFT_CONTRACT,
    baseMintPrice: process.env.BASE_MINT_PRICE,
    validateOnly: process.env.VALIDATE_ONLY === "true",
    dryRun: process.env.DRY_RUN === "true"
  };

  await deployCollectorNFTv1(options);
}

// Execute if run directly
if (require.main === module) {
  main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
}

export { deployCollectorNFTv1, DeploymentOptions };
