// Contract validation script for GenImNFTv2
// 
// Usage:
// npx hardhat run scripts/validate-contract.ts --network sepolia
//
// This script validates the current state of a deployed GenImNFTv2 contract
// and checks for upgrade readiness.
//
import { ethers } from "hardhat";

interface ContractInfo {
  name: string;
  symbol: string;
  owner: string;
  mintPrice: string;
  totalSupply: string;
  implementation: string;
  proxyAdmin?: string;
}

async function validateContract(proxyAddress: string): Promise<ContractInfo> {
  console.log(`\n🔍 Validating contract at: ${proxyAddress}`);
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
    const implementationAddress = await ethers.provider.getStorageAt(proxyAddress, implementationSlot);
    const implementation = ethers.getAddress("0x" + implementationAddress.slice(-40));
    
    console.log(`🔧 Implementation: ${implementation}`);

    // Test basic functionality
    console.log("\n🧪 Testing basic functionality...");
    
    try {
      await contract.isImageUpdated(0);
      console.log("✅ isImageUpdated function works");
    } catch (error) {
      if (error.message.includes("Token does not exist")) {
        console.log("✅ isImageUpdated function works (no token 0 exists)");
      } else {
        console.log("❌ isImageUpdated function failed:", error.message);
      }
    }

    try {
      await contract.getAuthorizedImageUpdater(0);
      console.log("✅ getAuthorizedImageUpdater function works");
    } catch (error) {
      if (error.message.includes("Token does not exist")) {
        console.log("✅ getAuthorizedImageUpdater function works (no token 0 exists)");
      } else {
        console.log("❌ getAuthorizedImageUpdater function failed:", error.message);
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
    } catch (error) {
      console.log("❌ Interface check failed:", error.message);
    }

    return {
      name,
      symbol,
      owner,
      mintPrice: ethers.formatEther(mintPrice),
      totalSupply: totalSupply.toString(),
      implementation
    };

  } catch (error) {
    console.error("❌ Contract validation failed:", error.message);
    throw error;
  }
}

async function checkUpgradeReadiness(proxyAddress: string): Promise<void> {
  console.log("\n🔄 Checking upgrade readiness...");
  console.log("=" * 30);

  const [signer] = await ethers.getSigners();
  const contract = await ethers.getContractAt("GenImNFTv2", proxyAddress);

  try {
    // Check if signer is the owner
    const owner = await contract.owner();
    const signerAddress = await signer.getAddress();
    
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
    } catch (error) {
      console.log("❌ Cannot access owner functions:", error.message);
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

    console.log("✅ Contract is ready for upgrade");

  } catch (error) {
    console.error("❌ Upgrade readiness check failed:", error.message);
  }
}

async function main() {
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    console.log("Usage: npx hardhat run scripts/validate-contract.ts --network <network>");
    console.log("Set PROXY_ADDRESS environment variable or modify script to include proxy address");
    return;
  }

  const proxyAddress = process.env.PROXY_ADDRESS || ""; // Set your proxy address here
  
  if (!proxyAddress) {
    console.log("❌ Please set PROXY_ADDRESS environment variable or modify the script");
    console.log("Example: PROXY_ADDRESS=0x... npx hardhat run scripts/validate-contract.ts --network sepolia");
    return;
  }

  try {
    const info = await validateContract(proxyAddress);
    await checkUpgradeReadiness(proxyAddress);

    console.log("\n📋 Summary:");
    console.log("=" * 20);
    console.log(JSON.stringify(info, null, 2));

  } catch (error) {
    console.error("Script failed:", error);
    process.exit(1);
  }
}

// Handle both direct execution and module import
if (require.main === module) {
  main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
}

export { validateContract, checkUpgradeReadiness };
