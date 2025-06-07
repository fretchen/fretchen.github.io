import { ethers, run } from "hardhat";

/**
 * Script to verify OpenZeppelin upgraded contracts on Etherscan
 * 
 * Usage:
 * npx hardhat run scripts/verify-v3.ts --network sepolia
 * 
 * Or with specific proxy address:
 * PROXY_ADDRESS=0x123... npx hardhat run scripts/verify-v3.ts --network sepolia
 */

async function main() {
  const network = process.env.HARDHAT_NETWORK || "localhost";
  console.log(`🔍 Verifying GenImNFTv3 contracts on ${network}...`);

  // Get proxy address from environment variable or prompt user
  const proxyAddress = process.env.PROXY_ADDRESS;
  
  if (!proxyAddress) {
    console.error("❌ Please provide PROXY_ADDRESS environment variable");
    console.log("Example: PROXY_ADDRESS=0x123... npx hardhat run scripts/verify-v3.ts --network sepolia");
    process.exit(1);
  }

  if (!ethers.isAddress(proxyAddress)) {
    console.error("❌ Invalid proxy address provided");
    process.exit(1);
  }

  console.log(`📍 Proxy Address: ${proxyAddress}`);

  try {
    // First, try to get the implementation address
    console.log("\n🔍 Getting implementation address...");
    
    // Connect to the proxy and get implementation address
    const proxy = await ethers.getContractAt("GenImNFTv3", proxyAddress);
    
    // Get the implementation address using the standard EIP-1967 storage slot
    const implementationSlot = "0x360894a13ba1a3210667c828492db98dca3e2076cc3735a920a3ca505d382bbc";
    const implementationAddress = await ethers.provider.getStorage(proxyAddress, implementationSlot);
    const cleanImplementationAddress = "0x" + implementationAddress.slice(-40);

    console.log(`📄 Implementation Address: ${cleanImplementationAddress}`);

    // Verify the implementation contract
    console.log("\n🔄 Verifying implementation contract...");
    
    try {
      await run("verify:verify", {
        address: cleanImplementationAddress,
        constructorArguments: [], // Implementation contracts don't have constructor args for OpenZeppelin
        contract: "contracts/GenImNFTv3.sol:GenImNFTv3"
      });
      console.log("✅ Implementation contract verified successfully!");
    } catch (error: any) {
      if (error.message.includes("Already Verified")) {
        console.log("✅ Implementation contract already verified!");
      } else {
        console.error("❌ Implementation verification failed:", error.message);
      }
    }

    // Verify the proxy contract (ERC1967Proxy)
    console.log("\n🔄 Verifying proxy contract...");
    
    try {
      // For proxy verification, we need the constructor arguments:
      // 1. Implementation address
      // 2. Initialization data (encoded initialize() call)
      
      // Get the initialize function signature
      const initializeData = ethers.interface.encodeFunctionData(
        proxy.interface.getFunction("initialize"),
        []
      );

      await run("verify:verify", {
        address: proxyAddress,
        constructorArguments: [cleanImplementationAddress, initializeData],
        contract: "@openzeppelin/contracts/proxy/ERC1967/ERC1967Proxy.sol:ERC1967Proxy"
      });
      console.log("✅ Proxy contract verified successfully!");
    } catch (error: any) {
      if (error.message.includes("Already Verified")) {
        console.log("✅ Proxy contract already verified!");
      } else {
        console.log("⚠️ Proxy verification failed (this is often expected):", error.message);
        console.log("💡 The proxy might have been deployed with different constructor arguments.");
      }
    }

    // Test contract functionality
    console.log("\n🧪 Testing contract functionality...");
    
    try {
      const name = await proxy.name();
      const symbol = await proxy.symbol();
      const totalSupply = await proxy.totalSupply();
      
      console.log(`✅ Contract Name: ${name}`);
      console.log(`✅ Contract Symbol: ${symbol}`);
      console.log(`✅ Total Supply: ${totalSupply}`);
      
      // Test V3 specific functionality
      try {
        const allPublicTokens = await proxy.getAllPublicTokens();
        console.log(`✅ Public Tokens: ${allPublicTokens.length} tokens`);
      } catch (e) {
        console.log("⚠️ V3 functionality test failed - might be a V2 contract");
      }
      
    } catch (error) {
      console.error("❌ Contract functionality test failed:", error);
    }

    console.log("\n🎉 Verification process completed!");
    console.log("\n📋 Summary:");
    console.log(`   📍 Proxy: ${proxyAddress}`);
    console.log(`   📄 Implementation: ${cleanImplementationAddress}`);
    console.log(`   🌐 Network: ${network}`);
    
    if (network !== "localhost" && network !== "hardhat") {
      console.log(`   🔗 View on Etherscan: https://${network !== "mainnet" ? network + "." : ""}etherscan.io/address/${proxyAddress}`);
    }

  } catch (error: any) {
    console.error("❌ Verification failed:", error.message);
    process.exit(1);
  }
}

// Handle errors gracefully
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
