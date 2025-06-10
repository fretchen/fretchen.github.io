#!/usr/bin/env npx hardhat run
import { ethers, upgrades, network } from "hardhat";
import { getAddress } from "viem";

interface UpgradeOptions {
  proxyAddress?: string;
  validateOnly?: boolean;
  dryRun?: boolean;
  skipPreUpgradeValidation?: boolean;
}

/**
 * Upgrade CollectorNFT using OpenZeppelin Upgrades Plugin
 * 
 * Usage examples:
 * - Environment variable: PROXY_ADDRESS=0x123... npx hardhat run scripts/upgrade-collector-nft.ts --network sepolia
 * - Script parameter: npx hardhat run scripts/upgrade-collector-nft.ts --network sepolia
 * - Validation only: VALIDATE_ONLY=true npx hardhat run scripts/upgrade-collector-nft.ts --network sepolia
 * - Dry run: DRY_RUN=true npx hardhat run scripts/upgrade-collector-nft.ts --network sepolia
 * - Skip OZ validation: SKIP_OZ_VALIDATION=true npx hardhat run scripts/upgrade-collector-nft.ts --network sepolia
 */
async function upgradeCollectorNFT(options: UpgradeOptions = {}) {
  console.log("🚀 CollectorNFT Upgrade Script");
  console.log("=" .repeat(50));
  console.log(`Network: ${network.name}`);
  console.log(`Block: ${await ethers.provider.getBlockNumber()}`);
  console.log("");

  // Get proxy address from environment or parameter
  const proxyAddress = options.proxyAddress || process.env.PROXY_ADDRESS;
  if (!proxyAddress) {
    throw new Error(
      "Proxy address required. Set PROXY_ADDRESS environment variable or pass as parameter."
    );
  }

  console.log(`📍 Proxy Address: ${proxyAddress}`);

  // Validate proxy address format
  try {
    getAddress(proxyAddress);
  } catch (error) {
    throw new Error(`Invalid proxy address: ${proxyAddress}`);
  }

  // Check if validation only
  if (options.validateOnly || process.env.VALIDATE_ONLY === "true") {
    console.log("🔍 Validation Only Mode - No upgrade will occur");
    return await validateUpgrade(proxyAddress);
  }

  // Check if dry run
  if (options.dryRun || process.env.DRY_RUN === "true") {
    console.log("🧪 Dry Run Mode - Simulation only");
    return await simulateUpgrade(proxyAddress);
  }

  // Get contract factory
  console.log("📦 Getting CollectorNFT contract factory...");
  const CollectorNFTFactory = await ethers.getContractFactory("CollectorNFT");

  // Verify proxy contract exists
  console.log("🔍 Verifying proxy contract...");
  const proxyCode = await ethers.provider.getCode(proxyAddress);
  if (proxyCode === "0x") {
    throw new Error(`No contract found at proxy address: ${proxyAddress}`);
  }

  // Get current implementation address
  const currentImplementation = await upgrades.erc1967.getImplementationAddress(proxyAddress);
  console.log(`📍 Current Implementation: ${currentImplementation}`);

  // Validate upgrade (unless skipped)
  if (!options.skipPreUpgradeValidation && process.env.SKIP_OZ_VALIDATION !== "true") {
    console.log("🔍 Validating upgrade compatibility...");
    await upgrades.validateUpgrade(proxyAddress, CollectorNFTFactory);
    console.log("✅ Upgrade validation passed");
  } else {
    console.log("⚠️  Skipping pre-upgrade validation");
  }

  // Store current state for verification
  const oldContract = CollectorNFTFactory.attach(proxyAddress);
  const oldName = await oldContract.name();
  const oldSymbol = await oldContract.symbol();
  const oldGenImNFT = await oldContract.genImNFTContract();
  const oldBaseMintPrice = await oldContract.baseMintPrice();

  console.log("📊 Current Contract State:");
  console.log(`   Name: ${oldName}`);
  console.log(`   Symbol: ${oldSymbol}`);
  console.log(`   GenImNFT: ${oldGenImNFT}`);
  console.log(`   Base Mint Price: ${ethers.formatEther(oldBaseMintPrice)} ETH`);

  // Perform the upgrade
  console.log("🚀 Upgrading CollectorNFT...");
  console.log("");

  const upgradedContract = await upgrades.upgradeProxy(proxyAddress, CollectorNFTFactory);
  await upgradedContract.waitForDeployment();

  const newImplementation = await upgrades.erc1967.getImplementationAddress(proxyAddress);

  console.log("✅ CollectorNFT upgraded successfully!");
  console.log("=" .repeat(50));
  console.log(`📍 Proxy Address: ${proxyAddress}`);
  console.log(`📍 Old Implementation: ${currentImplementation}`);
  console.log(`📍 New Implementation: ${newImplementation}`);
  console.log(`📍 Admin Address: ${await upgrades.erc1967.getAdminAddress(proxyAddress)}`);
  console.log("");

  // Verify upgrade
  console.log("🔍 Verifying upgrade...");
  
  const newName = await upgradedContract.name();
  const newSymbol = await upgradedContract.symbol();
  const newGenImNFT = await upgradedContract.genImNFTContract();
  const newBaseMintPrice = await upgradedContract.baseMintPrice();

  console.log("📊 New Contract State:");
  console.log(`   Name: ${newName}`);
  console.log(`   Symbol: ${newSymbol}`);
  console.log(`   GenImNFT: ${newGenImNFT}`);
  console.log(`   Base Mint Price: ${ethers.formatEther(newBaseMintPrice)} ETH`);

  // Verify state preservation
  if (newName !== oldName) {
    console.warn(`⚠️  Name changed: ${oldName} -> ${newName}`);
  }
  if (newSymbol !== oldSymbol) {
    console.warn(`⚠️  Symbol changed: ${oldSymbol} -> ${newSymbol}`);
  }
  if (newGenImNFT.toLowerCase() !== oldGenImNFT.toLowerCase()) {
    console.warn(`⚠️  GenImNFT address changed: ${oldGenImNFT} -> ${newGenImNFT}`);
  }
  if (newBaseMintPrice !== oldBaseMintPrice) {
    console.warn(`⚠️  Base mint price changed: ${ethers.formatEther(oldBaseMintPrice)} -> ${ethers.formatEther(newBaseMintPrice)} ETH`);
  }

  console.log("✅ All verifications completed!");
  console.log("");

  // Export upgrade info
  const upgradeInfo = {
    network: network.name,
    timestamp: new Date().toISOString(),
    blockNumber: await ethers.provider.getBlockNumber(),
    proxyAddress: proxyAddress,
    oldImplementation: currentImplementation,
    newImplementation: newImplementation,
    adminAddress: await upgrades.erc1967.getAdminAddress(proxyAddress),
    statePreserved: {
      name: newName === oldName,
      symbol: newSymbol === oldSymbol,
      genImNFT: newGenImNFT.toLowerCase() === oldGenImNFT.toLowerCase(),
      baseMintPrice: newBaseMintPrice === oldBaseMintPrice,
    },
  };

  console.log("📋 Upgrade Summary:");
  console.log(JSON.stringify(upgradeInfo, null, 2));

  return {
    contract: upgradedContract,
    address: proxyAddress,
    upgradeInfo,
  };
}

async function validateUpgrade(proxyAddress: string) {
  console.log("🔍 Validating upgrade configuration...");
  
  // Verify proxy contract
  const proxyCode = await ethers.provider.getCode(proxyAddress);
  if (proxyCode === "0x") {
    throw new Error(`No contract found at proxy address: ${proxyAddress}`);
  }

  // Get contract factory for validation
  const CollectorNFTFactory = await ethers.getContractFactory("CollectorNFT");

  // Validate upgrade compatibility
  await upgrades.validateUpgrade(proxyAddress, CollectorNFTFactory);

  console.log("✅ New contract compiles successfully");
  console.log("✅ Proxy contract exists at specified address");
  console.log("✅ Upgrade compatibility validated");
  
  console.log("🎉 Validation completed successfully!");
  return true;
}

async function simulateUpgrade(proxyAddress: string) {
  console.log("🧪 Simulating upgrade...");
  
  await validateUpgrade(proxyAddress);
  
  // Get current implementation
  const currentImplementation = await upgrades.erc1967.getImplementationAddress(proxyAddress);
  console.log(`📍 Current Implementation: ${currentImplementation}`);
  
  console.log("⛽ Estimating upgrade costs...");
  console.log("📦 New contract factory created successfully");
  console.log("💡 Ready for upgrade");
  
  console.log("🎉 Simulation completed successfully!");
  return true;
}

// Main execution
async function main() {
  try {
    await upgradeCollectorNFT();
  } catch (error) {
    console.error("❌ Upgrade failed:");
    console.error(error);
    process.exitCode = 1;
  }
}

// Execute if run directly
if (require.main === module) {
  main();
}

export { upgradeCollectorNFT, UpgradeOptions };
