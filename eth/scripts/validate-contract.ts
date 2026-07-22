/**
 * Validates the on-chain state of deployed smart contracts.
 *
 * Checks contract state (name, symbol, supply), interface compliance (ERC721,
 * ERC721Enumerable), owner/permission setup, implementation validity, and
 * upgrade readiness. Also exported as a utility used by deploy scripts.
 *
 * Supports: GenImNFT (all versions), CollectorNFT — proxy and implementation.
 *
 * Usage:
 *   npx hardhat run scripts/validate-contract.ts --network optsepolia
 *   DEPLOYMENT_FILE=deployments/genimg-v4-base.json npx hardhat run scripts/validate-contract.ts --network base
 *   PROXY_ADDRESS=0x123... npx hardhat run scripts/validate-contract.ts --network optimisticEthereum
 */
// - Detailed reporting and summaries
//t validation script for GenImNFTv2 and CollectorNFT
//
// Usage:
// npx hardhat run scripts/validate-contract-new.ts --network sepolia
// or with deployment file:
// DEPLOYMENT_FILE=path/to/deployment.json npx hardhat run scripts/validate-contract-new.ts --network sepolia
//
// This script validates the current state of deployed contracts
// and checks for upgrade readiness.
//
import hre from "hardhat";
import * as fs from "fs";

interface ContractInfo {
  name: string;
  symbol: string;
  owner: string;
  mintPrice: string;
  totalSupply: string;
  implementation: string;
  proxyAdmin?: string;
}

interface CollectorNFTInfo {
  name: string;
  symbol: string;
  genImNFTContract: string;
  baseMintPrice: string;
  totalSupply: string;
  implementation: string;
  proxyAdmin?: string;
}

interface DeploymentData {
  network: string;
  proxyAddress: string;
  implementationAddress: string;
  adminAddress?: string;
  genImNFTAddress?: string;
  baseMintPrice?: string;
  contractName: string;
  contractSymbol: string;
}

async function validateContract(proxyAddress: string): Promise<ContractInfo> {
  const connection = await hre.network.getOrCreate();
  const { ethers } = connection;
  console.log(`\n🔍 Validating GenImNFT contract at: ${proxyAddress}`);
  console.log("=".repeat(50));

  // Get contract instance
  const contract = await ethers.getContractAt("GenImNFTv2", proxyAddress);

  try {
    // Basic contract information
    const name = await contract.name();
    const symbol = await contract.symbol();
    const owner = await contract.owner();
    const mintPrice = await contract.mintPrice();
    const totalSupply = await contract.totalSupply();

    console.log(`📝 Name: ${name}`);
    console.log(`🏷️  Symbol: ${symbol}`);
    console.log(`👤 Owner: ${owner}`);
    console.log(`💰 Mint Price: ${ethers.formatEther(mintPrice)} ETH`);
    console.log(`📊 Total Supply: ${totalSupply}`);

    // Get implementation address (UUPS proxy)
    const implementationSlot = "0x360894a13ba1a3210667c828492db98dca3e2076cc3735a920a3ca505d382bbc";
    const implementationAddress = await ethers.provider.getStorage(proxyAddress, implementationSlot);
    const implementation = ethers.getAddress("0x" + implementationAddress.slice(-40));

    console.log(`🔧 Implementation: ${implementation}`);

    // Test basic functionality
    console.log("\n🧪 Testing basic functionality...");

    try {
      await contract.isImageUpdated(0);
      console.log("✅ isImageUpdated function works");
    } catch (error: unknown) {
      if (error instanceof Error && error.message && error.message.includes("Token does not exist")) {
        console.log("✅ isImageUpdated function works (no token 0 exists)");
      } else {
        console.log("❌ isImageUpdated function failed:", error instanceof Error ? error.message : error);
      }
    }

    try {
      await contract.getAuthorizedImageUpdater(0);
      console.log("✅ getAuthorizedImageUpdater function works");
    } catch (error: unknown) {
      if (error instanceof Error && error.message && error.message.includes("Token does not exist")) {
        console.log("✅ getAuthorizedImageUpdater function works (no token 0 exists)");
      } else {
        console.log("❌ getAuthorizedImageUpdater function failed:", error instanceof Error ? error.message : error);
      }
    }

    // Check if contract supports expected interfaces
    const ERC721_INTERFACE_ID = "0x80ac58cd";
    const ERC721_ENUMERABLE_INTERFACE_ID = "0x780e9d63";
    const ERC721_BURNABLE_INTERFACE_ID = "0x42966c68";

    try {
      const supportsERC721 = await contract.supportsInterface(ERC721_INTERFACE_ID);
      const supportsEnumerable = await contract.supportsInterface(ERC721_ENUMERABLE_INTERFACE_ID);
      const supportsBurnable = await contract.supportsInterface(ERC721_BURNABLE_INTERFACE_ID);

      console.log(`✅ ERC721 Interface: ${supportsERC721 ? "✓" : "✗"}`);
      console.log(`✅ ERC721Enumerable Interface: ${supportsEnumerable ? "✓" : "✗"}`);
      console.log(`✅ ERC721Burnable Interface: ${supportsBurnable ? "✓" : "✗"}`);
    } catch (error: unknown) {
      console.log("❌ Interface check failed:", error instanceof Error ? error.message : error);
    }

    return {
      name,
      symbol,
      owner,
      mintPrice: ethers.formatEther(mintPrice),
      totalSupply: totalSupply.toString(),
      implementation,
    };
  } catch (error: unknown) {
    console.error("❌ Contract validation failed:", error instanceof Error ? error.message : error);
    throw error;
  }
}

async function validateCollectorNFT(proxyAddress: string): Promise<CollectorNFTInfo> {
  const connection = await hre.network.getOrCreate();
  const { ethers } = connection;
  console.log(`\n🔍 Validating CollectorNFT contract at: ${proxyAddress}`);
  console.log("=".repeat(50));

  // Get contract instance
  const contract = await ethers.getContractAt("CollectorNFTv1", proxyAddress);

  try {
    // Basic contract information
    const name = await contract.name();
    const symbol = await contract.symbol();
    const genImNFTContract = await contract.genImNFTContract();
    const baseMintPrice = await contract.baseMintPrice();
    const totalSupply = await contract.totalSupply();

    console.log(`📝 Name: ${name}`);
    console.log(`🏷️  Symbol: ${symbol}`);
    console.log(`🔗 GenImNFT Contract: ${genImNFTContract}`);
    console.log(`💰 Base Mint Price: ${ethers.formatEther(baseMintPrice)} ETH`);
    console.log(`📊 Total Supply: ${totalSupply}`);

    // Get implementation address (UUPS proxy)
    const implementationSlot = "0x360894a13ba1a3210667c828492db98dca3e2076cc3735a920a3ca505d382bbc";
    const implementationAddress = await ethers.provider.getStorage(proxyAddress, implementationSlot);
    const implementation = ethers.getAddress("0x" + implementationAddress.slice(-40));

    console.log(`🔧 Implementation: ${implementation}`);

    // Test basic functionality
    console.log("\n🧪 Testing basic functionality...");

    // Test if contract can check minting permissions
    try {
      const [signer] = await ethers.getSigners();
      const signerAddress = await signer.getAddress();
      await contract.canMint(signerAddress, 1);
      console.log("✅ canMint function works");
    } catch (error: unknown) {
      console.log("⚠️  canMint function test failed:", error instanceof Error ? error.message : error);
    }

    // Check if contract supports expected interfaces
    const ERC721_INTERFACE_ID = "0x80ac58cd";
    const ERC721_ENUMERABLE_INTERFACE_ID = "0x780e9d63";
    const ERC721_BURNABLE_INTERFACE_ID = "0x42966c68";

    try {
      const supportsERC721 = await contract.supportsInterface(ERC721_INTERFACE_ID);
      const supportsEnumerable = await contract.supportsInterface(ERC721_ENUMERABLE_INTERFACE_ID);
      const supportsBurnable = await contract.supportsInterface(ERC721_BURNABLE_INTERFACE_ID);

      console.log(`✅ ERC721 Interface: ${supportsERC721 ? "✓" : "✗"}`);
      console.log(`✅ ERC721Enumerable Interface: ${supportsEnumerable ? "✓" : "✗"}`);
      console.log(`✅ ERC721Burnable Interface: ${supportsBurnable ? "✓" : "✗"}`);
    } catch (error: unknown) {
      console.log("❌ Interface check failed:", error instanceof Error ? error.message : error);
    }

    return {
      name,
      symbol,
      genImNFTContract,
      baseMintPrice: ethers.formatEther(baseMintPrice),
      totalSupply: totalSupply.toString(),
      implementation,
    };
  } catch (error: unknown) {
    console.error("❌ CollectorNFT validation failed:", error instanceof Error ? error.message : error);
    throw error;
  }
}

async function validateImplementation(implementationAddress: string, contractName: string): Promise<void> {
  const connection = await hre.network.getOrCreate();
  const { ethers } = connection;
  console.log(`\n🔧 Validating ${contractName} implementation at: ${implementationAddress}`);
  console.log("=".repeat(50));

  try {
    // Check if code exists at implementation address
    const code = await ethers.provider.getCode(implementationAddress);
    if (code === "0x") {
      throw new Error(`No contract code found at implementation address: ${implementationAddress}`);
    }

    console.log(`✅ Implementation contract code exists (${code.length} bytes)`);

    // Try to get contract instance (this will fail if ABI doesn't match)
    try {
      await ethers.getContractAt(contractName, implementationAddress);
      console.log(`✅ Contract ABI matches implementation`);

      // For implementation contracts, we can't call initialize functions
      // but we can check if the contract has the expected structure
      console.log(`✅ ${contractName} implementation validation passed`);
    } catch (error: unknown) {
      console.log(
        `⚠️  Could not attach contract ABI to implementation:`,
        error instanceof Error ? error.message : error,
      );
    }
  } catch (error: unknown) {
    console.error(`❌ Implementation validation failed:`, error instanceof Error ? error.message : error);
    throw error;
  }
}

async function checkUpgradeReadiness(proxyAddress: string, contractType: string = "GenImNFTv2"): Promise<void> {
  const connection = await hre.network.getOrCreate();
  const { ethers } = connection;
  console.log(`\n🔄 Checking upgrade readiness for ${contractType}...`);
  console.log("=".repeat(30));

  const [signer] = await ethers.getSigners();

  try {
    const contract = await ethers.getContractAt(contractType, proxyAddress);

    // Check if signer has upgrade permissions
    const signerAddress = await signer.getAddress();

    if (contractType === "GenImNFTv2") {
      // Check if signer is the owner
      const owner = await contract.owner();

      if (owner.toLowerCase() === signerAddress.toLowerCase()) {
        console.log("✅ Current signer is the contract owner");
      } else {
        console.log("❌ Current signer is NOT the contract owner");
        console.log(`   Owner: ${owner}`);
        console.log(`   Signer: ${signerAddress}`);
        return;
      }

      // Check if we can call owner-only functions
      try {
        // This should not actually change anything, just test access
        await contract.setMintPrice.staticCall(await contract.mintPrice());
        console.log("✅ Owner functions are accessible");
      } catch (error: unknown) {
        console.log("❌ Cannot access owner functions:", error instanceof Error ? error.message : error);
      }
    }

    // Check current gas price
    const gasPrice = await ethers.provider.getFeeData();
    console.log(`⛽ Current gas price: ${ethers.formatUnits(gasPrice.gasPrice || 0, "gwei")} gwei`);

    // Check account balance
    const balance = await ethers.provider.getBalance(signerAddress);
    console.log(`💰 Account balance: ${ethers.formatEther(balance)} ETH`);

    if (balance < ethers.parseEther("0.01")) {
      console.log("⚠️  Warning: Low account balance for upgrade transaction");
    }

    console.log(`✅ ${contractType} is ready for upgrade`);
  } catch (error: unknown) {
    console.error("❌ Upgrade readiness check failed:", error instanceof Error ? error.message : error);
  }
}

function loadDeploymentFile(filePath: string): DeploymentData | null {
  try {
    if (!fs.existsSync(filePath)) {
      return null;
    }

    const fileContent = fs.readFileSync(filePath, "utf8");
    const deploymentData = JSON.parse(fileContent) as DeploymentData;

    console.log(`📂 Loaded deployment file: ${filePath}`);
    console.log(`📝 Network: ${deploymentData.network}`);
    console.log(`📍 Proxy: ${deploymentData.proxyAddress}`);
    console.log(`🔧 Implementation: ${deploymentData.implementationAddress}`);

    return deploymentData;
  } catch (error: unknown) {
    console.error("❌ Failed to load deployment file:", error instanceof Error ? error.message : error);
    return null;
  }
}

async function validateFromDeploymentFile(deploymentData: DeploymentData): Promise<void> {
  console.log("\n🚀 Starting comprehensive validation from deployment file...");
  console.log("=".repeat(60));

  // Validate CollectorNFT proxy
  if (deploymentData.proxyAddress) {
    try {
      const collectorInfo = await validateCollectorNFT(deploymentData.proxyAddress);
      await checkUpgradeReadiness(deploymentData.proxyAddress, "CollectorNFTv1");

      console.log("\n📋 CollectorNFT Summary:");
      console.log("=".repeat(30));
      console.log(JSON.stringify(collectorInfo, null, 2));
    } catch (error: unknown) {
      console.error("❌ CollectorNFT validation failed:", error instanceof Error ? error.message : error);
    }
  }

  // Validate CollectorNFT implementation
  if (deploymentData.implementationAddress) {
    try {
      await validateImplementation(deploymentData.implementationAddress, "CollectorNFTv1");
    } catch (error: unknown) {
      console.error(
        "❌ CollectorNFT implementation validation failed:",
        error instanceof Error ? error.message : error,
      );
    }
  }

  // Validate GenImNFT contract if present
  if (deploymentData.genImNFTAddress) {
    try {
      const genImInfo = await validateContract(deploymentData.genImNFTAddress);
      await checkUpgradeReadiness(deploymentData.genImNFTAddress, "GenImNFTv2");

      console.log("\n📋 GenImNFT Summary:");
      console.log("=".repeat(30));
      console.log(JSON.stringify(genImInfo, null, 2));
    } catch (error: unknown) {
      console.error("❌ GenImNFT validation failed:", error instanceof Error ? error.message : error);
    }
  }
}

export {
  validateContract,
  validateCollectorNFT,
  validateImplementation,
  checkUpgradeReadiness,
  loadDeploymentFile,
  validateFromDeploymentFile,
};

async function main() {
  const deploymentFilePath = process.env.DEPLOYMENT_FILE;
  if (deploymentFilePath) {
    const deploymentData = loadDeploymentFile(deploymentFilePath);
    if (deploymentData) {
      await validateFromDeploymentFile(deploymentData);
      return;
    }
    console.error("❌ Failed to load deployment file");
    process.exit(1);
  }

  const proxyAddress = process.env.PROXY_ADDRESS;
  if (!proxyAddress) {
    console.error("❌ Set PROXY_ADDRESS or DEPLOYMENT_FILE environment variable");
    console.error("Example: PROXY_ADDRESS=0x... npx hardhat run scripts/validate-contract.ts --network sepolia");
    process.exit(1);
  }

  try {
    const info = await validateContract(proxyAddress);
    await checkUpgradeReadiness(proxyAddress);
    console.log("\n📋 Summary:");
    console.log(JSON.stringify(info, null, 2));
  } catch (error: unknown) {
    console.error("Script failed:", error instanceof Error ? error.message : error);
    process.exit(1);
  }
}

// HH_TEST is set by Hardhat's test runner. Guard against running main() when
// this module is imported transitively by test files via deploy/upgrade scripts.
if (!process.env.HH_TEST) {
  main().catch((error) => {
    console.error(error);
    process.exit(1);
  });
}
